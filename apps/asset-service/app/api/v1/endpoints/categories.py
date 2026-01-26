from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.category import AssetCategory
from app.schemas.category import Category

router = APIRouter()

@router.get("/", response_model=List[Category])
async def read_categories(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve asset categories with their dynamic form configuration.
    """
    result = await db.execute(select(AssetCategory).offset(skip).limit(limit))
    categories = result.scalars().all()
    return categories
