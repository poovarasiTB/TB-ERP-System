"""
Maintenance Logs API Endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.db.session import get_db
from app.models.asset import Asset, MaintenanceLog
from app.schemas.maintenance import (
    MaintenanceLogCreate,
    MaintenanceLogResponse,
    MaintenanceLogList
)
from app.core.security import get_current_user, require_roles, TokenData

router = APIRouter()

@router.get("/{asset_id}", response_model=List[MaintenanceLogResponse])
async def get_asset_maintenance_logs(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Get all maintenance logs for a specific asset.
    """
    # Verify asset exists
    asset_result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = asset_result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    # Get maintenance logs
    result = await db.execute(
        select(MaintenanceLog)
        .where(MaintenanceLog.asset_id == asset_id)
        .order_by(MaintenanceLog.performed_at.desc())
    )
    logs = result.scalars().all()
    
    return logs

@router.post("/{asset_id}", response_model=MaintenanceLogResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance_log(
    asset_id: int,
    log_data: MaintenanceLogCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_roles(["asset_manager"])),
):
    """
    Create a new maintenance log for an asset.
    """
    # Verify asset exists
    asset_result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = asset_result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    # Create maintenance log
    log = MaintenanceLog(
        asset_id=asset_id,
        maintenance_type=log_data.maintenance_type,
        description=log_data.description,
        cost=log_data.cost,
        performed_by=log_data.performed_by,
        performed_at=log_data.performed_at,
        next_maintenance=log_data.next_maintenance,
    )
    
    db.add(log)
    await db.commit()
    await db.refresh(log)
    
    return log
