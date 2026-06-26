import hashlib

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks
from fastapi.responses import Response
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user, require_user
from app.models import Task, TaskStatus, User
from app.schemas import TaskResponse, TaskStatusUpdate, AnalyticsRequest, AnalyticsCallback
from app.services import s3_service, analytics_client

router = APIRouter(prefix="/tasks", tags=["tasks"])


def _build_visible_tasks_stmt(current_user: User | None):
    if current_user and current_user.is_admin:
        return select(Task).order_by(Task.created_at.desc())
    if current_user:
        return select(Task).where(
            or_(Task.owner_id == current_user.id, Task.visibility == "public")
        ).order_by(Task.created_at.desc())
    return select(Task).where(Task.visibility == "public").order_by(Task.created_at.desc())


def _ensure_task_access(task: Task, current_user: User | None) -> None:
    if task.visibility == "private":
        if not current_user or (task.owner_id != current_user.id and not current_user.is_admin):
            raise HTTPException(status_code=403, detail="Access denied")

@router.post("/", response_model=TaskResponse, status_code=201)
async def create_task(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    label: str = Form(..., min_length=1, max_length=1),
    description: str | None = Form(None),
    priority: int = Form(0, ge=0, le=127),
    comments: str | None = Form(None),
    visibility: str = Form("private"),
    file: UploadFile | None = File(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user),
):
    if visibility not in ("public", "private"):
        visibility = "private"

    task = Task(
        title=title,
        label=label,
        description=description,
        priority=priority,
        file_key=None,
        comments=comments,
        status=TaskStatus.pending,
        owner_id=current_user.id,
        visibility=visibility,
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    if file and file.filename:
        data = await file.read()
        file_key = await s3_service.upload_file(
            data, file.filename, task.id,
            file.content_type or "application/octet-stream",
        )
        task.file_key = file_key
        await db.commit()
        await db.refresh(task)

    background_tasks.add_task(
        analytics_client.send_for_analysis,
        AnalyticsRequest(
            task_id=task.id,
            label=task.label,
            description=task.description,
            priority=task.priority,
            file_key=task.file_key,
            comments=task.comments,
        ),
    )

    return task


@router.get("/", response_model=list[TaskResponse])
async def get_tasks(
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    stmt = _build_visible_tasks_stmt(current_user)

    if status:
        stmt = stmt.where(Task.status == status)
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.visibility == "private":
        if not current_user or (task.owner_id != current_user.id and not current_user.is_admin):
            raise HTTPException(status_code=403, detail="Access denied")
    return task


@router.patch("/{task_id}/status", response_model=TaskResponse)
async def update_status(
    task_id: int,
    body: TaskStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_user),
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.owner_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied")
    task.status = TaskStatus(body.status)
    await db.commit()
    await db.refresh(task)
    return task


@router.get("/{task_id}/file")
async def download_file(task_id: int, db: AsyncSession = Depends(get_db)):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not task.file_key:
        raise HTTPException(status_code=404, detail="No file attached")
    data = await s3_service.download_file(task.file_key)
    return Response(content=data, media_type="application/octet-stream")


@router.get("/{task_id}/file-url")
async def get_file_url(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not task.file_key:
        raise HTTPException(status_code=404, detail="No file attached")
    _ensure_task_access(task, current_user)
    url = await s3_service.get_presigned_url(task.file_key)
    return {"url": url}


@router.get("/{task_id}/report")
async def download_report(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not task.report_key:
        raise HTTPException(status_code=404, detail="Report not ready yet")
    _ensure_task_access(task, current_user)
    data = await s3_service.download_file(task.report_key)
    filename = task.report_key.split("/")[-1]
    return Response(
        content=data,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/{task_id}/report-url")
async def get_report_url(
    task_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User | None = Depends(get_current_user),
):
    task = await db.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if not task.report_key:
        raise HTTPException(status_code=404, detail="Report not ready yet")
    _ensure_task_access(task, current_user)
    url = await s3_service.get_presigned_url(task.report_key)
    return {"url": url}


@router.post("/callback", status_code=204)
async def analytics_callback(body: AnalyticsCallback, db: AsyncSession = Depends(get_db)):
    """Called by analytics service when analysis is complete."""
    task = await db.get(Task, body.task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.vishing_result = body.vishing_result
    task.osint_comments = body.osint_comments
    task.report_key = body.report_key
    await db.commit()
