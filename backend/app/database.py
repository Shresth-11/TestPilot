import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.get_database_url()

connect_args = {}
if "sqlite" in db_url:
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    db_url,
    echo=False,
    future=True,
    connect_args=connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


_tables_initialized = False


async def init_db() -> None:
    global _tables_initialized
    if _tables_initialized:
        return
    try:
        import app.models
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        _tables_initialized = True
        logger.info("Database tables initialized successfully.")
    except Exception as e:
        logger.warning(f"Database init warning: {e}")
        _tables_initialized = True


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    global _tables_initialized
    if not _tables_initialized:
        await init_db()

    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
