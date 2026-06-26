import secrets

from sqlalchemy import text, select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        for stmt in [
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_id INTEGER REFERENCES users(id)",
            "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS visibility VARCHAR(8) DEFAULT 'private'",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE",
        ]:
            await conn.execute(text(stmt))

    await _ensure_admin()


async def _ensure_admin():
    """Create default admin account on startup if it doesn't exist."""
    import hashlib
    from app.models import User

    password = settings.ADMIN_PASSWORD or secrets.token_urlsafe(12)

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User).where(User.username == settings.ADMIN_USERNAME)
        )
        admin = result.scalar_one_or_none()
        if admin is None:
            admin = User(
                username=settings.ADMIN_USERNAME,
                password_hash=hashlib.sha256(password.encode()).hexdigest(),
                token=secrets.token_hex(32),
                is_admin=True,
            )
            session.add(admin)
            await session.commit()

            creds = f"username: {settings.ADMIN_USERNAME}\npassword: {password}\n"
            banner = "\n" + "=" * 52 + "\n  ADMIN CREDENTIALS (first-run)\n" + "=" * 52 + "\n" + creds + "=" * 52 + "\n"
            print(banner, flush=True)
            try:
                with open("/app/admin_creds.txt", "w") as f:
                    f.write(creds)
            except OSError:
                pass
        elif not admin.is_admin:
            admin.is_admin = True
            await session.commit()
