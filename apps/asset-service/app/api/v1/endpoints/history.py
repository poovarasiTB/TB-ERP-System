from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.history import AssignmentHistory
from app.schemas.history import AssignmentHistory as AssignmentHistorySchema
from app.core.security import get_current_user, TokenData

router = APIRouter()

@router.get("/{asset_id}", response_model=List[AssignmentHistorySchema])
async def get_asset_history(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Get assignment history for a specific asset.
    """
    result = await db.execute(
        select(AssignmentHistory)
        .where(AssignmentHistory.asset_id == asset_id)
        .order_by(AssignmentHistory.assigned_date.desc())
    )
    history = result.scalars().all()
    return history

