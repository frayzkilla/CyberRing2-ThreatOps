from contextlib import asynccontextmanager

from fastapi import FastAPI, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import init_db, get_db
from app.models import Task, Indicator, IndicatorType
from app.routes.auth import router as auth_router
from app.routes.tasks import router as tasks_router
from app.schemas import IndicatorUpsertRequest, IndicatorUpsertResponse, IndicatorSummary
from app.services.s3_service import ensure_bucket


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await ensure_bucket()
    yield


app = FastAPI(title="Vishing/OSINT Backend", lifespan=lifespan)
app.include_router(auth_router)
app.include_router(tasks_router)


@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/internal/tasks/latest")
async def internal_latest_tasks(db: AsyncSession = Depends(get_db)):
    stmt = select(Task).order_by(Task.created_at.desc()).limit(10)
    result = await db.execute(stmt)
    tasks = result.scalars().all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "comments": t.comments,
            "label": t.label,
            "status": t.status,
            "priority": t.priority,
            "created_at": t.created_at.isoformat(),
        }
        for t in tasks
    ]



@app.post("/internal/osint/indicators", response_model=IndicatorUpsertResponse)
async def upsert_osint_indicators(
    body: IndicatorUpsertRequest,
    db: AsyncSession = Depends(get_db),
):
    summaries: list[IndicatorSummary] = []

    for item in body.indicators:
        indicator_type = IndicatorType(item.type)
        result = await db.execute(
            select(Indicator).where(
                Indicator.type == indicator_type,
                Indicator.value == item.value,
            )
        )
        indicator = result.scalar_one_or_none()

        if indicator is None:
            indicator = Indicator(
                type=indicator_type,
                value=item.value,
                display_value=item.display_value,
                seen_count=1,
                suspicious_hits=1 if body.vishing_result is True else 0,
            )
            db.add(indicator)
            repeated = False
        else:
            indicator.display_value = item.display_value
            indicator.seen_count += 1
            if body.vishing_result is True:
                indicator.suspicious_hits += 1
            repeated = indicator.seen_count > 1

        possible_fraud = (
            indicator.type == IndicatorType.phone and repeated
        ) or indicator.suspicious_hits > 0

        summaries.append(
            IndicatorSummary(
                type=item.type,
                display_value=item.display_value,
                seen_count=indicator.seen_count,
                suspicious_hits=indicator.suspicious_hits,
                repeated=repeated,
                possible_fraud=possible_fraud,
            )
        )

    await db.commit()
    return IndicatorUpsertResponse(indicators=summaries)
