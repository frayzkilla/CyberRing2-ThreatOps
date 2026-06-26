import enum
from datetime import datetime

from sqlalchemy import String, Text, Integer, SmallInteger, DateTime, Enum, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    token: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    is_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    confirmed = "confirmed"


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    label: Mapped[str] = mapped_column(String(1), nullable=False)  # 'p' = vishing, else = osint
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[int] = mapped_column(SmallInteger, default=0)
    file_key: Mapped[str | None] = mapped_column(String(255), nullable=True)  # S3 object key
    comments: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.pending)

    
    owner_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    visibility: Mapped[str] = mapped_column(String(8), default="private")  # "public" | "private"

    
    vishing_result: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    osint_comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    report_key: Mapped[str | None] = mapped_column(String(255), nullable=True)  # S3 report key

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class IndicatorType(str, enum.Enum):
    phone = "phone"
    email = "email"
    inn = "inn"


class Indicator(Base):
    __tablename__ = "indicators"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    type: Mapped[IndicatorType] = mapped_column(Enum(IndicatorType), nullable=False)
    value: Mapped[str] = mapped_column(String(255), nullable=False)
    display_value: Mapped[str] = mapped_column(String(255), nullable=False)
    seen_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    suspicious_hits: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
