from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.db.session import get_db
from app.models.asset import Asset
from app.models.assignment import AssetAssignment
from app.models.history import AssignmentHistory
from app.schemas.asset import AssetResponse
from app.schemas.assignment import AssetAssign, AssetReturn
from app.core.security import get_current_user, TokenData

router = APIRouter()

@router.post("/{asset_id}/assign", response_model=AssetResponse)
async def assign_asset(
    asset_id: int,
    assign_data: AssetAssign,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Assign an asset to an employee.
    """
    # 1. Fetch Asset
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    if asset.status == "assigned":
        raise HTTPException(status_code=400, detail="Asset is already assigned")

    # 2. Update Asset
    asset.status = "assigned"
    asset.assigned_employee_id = assign_data.employee_id
    asset.updated_at = datetime.utcnow()
    
    # 3. Create History Record
    history = AssignmentHistory(
        asset_id=asset.id,
        employee_id=assign_data.employee_id,
        assigned_by=current_user.id, # Using authenticated user ID
        assigned_date=assign_data.assigned_date or datetime.utcnow(),
        notes=assign_data.notes
    )
    
    # 4. Create Asset Assignment Record (Active Assignment)
    assignment = AssetAssignment(
        asset_id=asset.id,
        employee_id=assign_data.employee_id,
        assigned_at=assign_data.assigned_date or datetime.utcnow()
    )
    
    db.add(history)
    db.add(assignment)
    db.add(asset)
    
    await db.commit()
    await db.refresh(asset)
    
    return asset

@router.post("/{asset_id}/return", response_model=AssetResponse)
async def return_asset(
    asset_id: int,
    return_data: AssetReturn,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Return an assigned asset.
    """
    # 1. Fetch Asset
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
        
    if asset.status != "assigned":
        raise HTTPException(status_code=400, detail="Asset is not currently assigned")

    # 2. Find active history record
    history_result = await db.execute(
        select(AssignmentHistory)
        .where(AssignmentHistory.asset_id == asset.id)
        .where(AssignmentHistory.return_date == None)
        .order_by(AssignmentHistory.assigned_date.desc())
    )
    history = history_result.scalar_one_or_none()
    
    if history:
        history.return_date = return_data.return_date or datetime.utcnow()
        if return_data.notes:
            history.notes = (history.notes or "") + f" [Return Note: {return_data.notes}]"
        db.add(history)

    # 3. Update Active Assignment Record
    assignment_result = await db.execute(
        select(AssetAssignment)
        .where(AssetAssignment.asset_id == asset.id)
        .where(AssetAssignment.unassigned_at == None)
    )
    assignment = assignment_result.scalar_one_or_none()
    
    if assignment:
        assignment.unassigned_at = return_data.return_date or datetime.utcnow()
        db.add(assignment)

    # 4. Update Asset
    asset.status = "in_stock"
    asset.assigned_employee_id = None
    asset.updated_at = datetime.utcnow()
    
    db.add(asset)
    
    await db.commit()
    await db.refresh(asset)
    
    return asset
