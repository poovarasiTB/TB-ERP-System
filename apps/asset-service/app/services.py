"""
Service Layer: Business Logic for Asset Management
Following Clean Architecture principles - separates business logic from API layer
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import Optional

from app.models.asset import Asset
from app.models.assignment import AssetAssignment
from app.models.history import AssetHistory, AssetEventType
from app.schemas.asset import AssetCreate, AssetUpdate
from app.core.security import TokenData


class AssetService:
    """Service for asset management operations"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def create_asset(
        self, 
        asset_data: AssetCreate, 
        performed_by: Optional[str] = None
    ) -> Asset:
        """Create a new asset with audit history"""
        # Check for duplicate asset_id
        existing = await self.db.execute(
            select(Asset).where(Asset.asset_id == asset_data.asset_id)
        )
        if existing.scalar_one_or_none():
            raise ValueError("Asset with this ID already exists")
        
        # Create asset
        asset = Asset(**asset_data.model_dump())
        self.db.add(asset)
        await self.db.flush()  # Get the ID
        
        # Create audit history
        history = AssetHistory(
            asset_id=asset.id,
            event_type=AssetEventType.CREATED,
            details=f"Asset created: {asset.asset_id}",
            performed_by=performed_by
        )
        self.db.add(history)
        
        await self.db.commit()
        await self.db.refresh(asset)
        return asset
    
    async def update_asset(
        self,
        asset_id: int,
        update_data: AssetUpdate,
        performed_by: Optional[str] = None
    ) -> Asset:
        """Update an existing asset"""
        result = await self.db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        asset = result.scalar_one_or_none()
        
        if not asset:
            raise ValueError("Asset not found")
        
        # Track changes for audit
        changes = []
        update_dict = update_data.model_dump(exclude_unset=True)
        
        for field, value in update_dict.items():
            old_value = getattr(asset, field)
            setattr(asset, field, value)
            if old_value != value:
                changes.append(f"{field}: {old_value} -> {value}")
        
        # Create audit history if changes were made
        if changes:
            history = AssetHistory(
                asset_id=asset.id,
                event_type=AssetEventType.STATUS_CHANGED,
                details="; ".join(changes),
                performed_by=performed_by
            )
            self.db.add(history)
        
        await self.db.commit()
        await self.db.refresh(asset)
        return asset
    
    async def assign_asset(
        self,
        asset_id: int,
        employee_id: int,
        assigned_date: Optional[datetime] = None,
        notes: Optional[str] = None,
        performed_by: Optional[str] = None
    ) -> Asset:
        """Assign an asset to an employee"""
        # Fetch asset
        result = await self.db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        asset = result.scalar_one_or_none()
        
        if not asset:
            raise ValueError("Asset not found")
        
        if asset.assigned_employee_id:
            raise ValueError("Asset is already assigned")
        
        # Update asset
        asset.status = "assigned"
        asset.assigned_employee_id = employee_id
        asset.updated_at = datetime.utcnow()
        
        # Create assignment record
        assignment = AssetAssignment(
            asset_id=asset.id,
            employee_id=employee_id,
            assigned_at=assigned_date or datetime.utcnow()
        )
        self.db.add(assignment)
        
        # Create audit history
        history = AssetHistory(
            asset_id=asset.id,
            event_type=AssetEventType.ASSIGNED,
            details=f"Assigned to employee {employee_id}" + (f": {notes}" if notes else ""),
            performed_by=performed_by
        )
        self.db.add(history)
        
        await self.db.commit()
        await self.db.refresh(asset)
        return asset
    
    async def unassign_asset(
        self,
        asset_id: int,
        return_date: Optional[datetime] = None,
        notes: Optional[str] = None,
        performed_by: Optional[str] = None
    ) -> Asset:
        """Unassign an asset from an employee"""
        # Fetch asset
        result = await self.db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        asset = result.scalar_one_or_none()
        
        if not asset:
            raise ValueError("Asset not found")
        
        if not asset.assigned_employee_id:
            raise ValueError("Asset is not currently assigned")
        
        employee_id = asset.assigned_employee_id
        
        # Update active assignment record
        assignment_result = await self.db.execute(
            select(AssetAssignment)
            .where(AssetAssignment.asset_id == asset.id)
            .where(AssetAssignment.unassigned_at.is_(None))
        )
        assignment = assignment_result.scalar_one_or_none()
        
        if assignment:
            assignment.unassigned_at = return_date or datetime.utcnow()
            self.db.add(assignment)
        
        # Update asset
        asset.status = "active"
        asset.assigned_employee_id = None
        asset.updated_at = datetime.utcnow()
        
        # Create audit history
        history = AssetHistory(
            asset_id=asset.id,
            event_type=AssetEventType.UNASSIGNED,
            details=f"Unassigned from employee {employee_id}" + (f": {notes}" if notes else ""),
            performed_by=performed_by
        )
        self.db.add(history)
        
        await self.db.commit()
        await self.db.refresh(asset)
        return asset
    
    async def change_status(
        self,
        asset_id: int,
        new_status: str,
        reason: Optional[str] = None,
        performed_by: Optional[str] = None
    ) -> Asset:
        """Change asset status with validation and audit trail"""
        result = await self.db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        asset = result.scalar_one_or_none()
        
        if not asset:
            raise ValueError("Asset not found")
        
        from_status = asset.status
        
        # Validate status transition (add your business rules here)
        valid_statuses = ["active", "assigned", "maintenance", "retired", "disposed"]
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status: {new_status}")
        
        # Update status
        asset.status = new_status
        asset.updated_at = datetime.utcnow()
        
        # Create audit history
        history = AssetHistory(
            asset_id=asset.id,
            event_type=AssetEventType.STATUS_CHANGED,
            details=f"Status changed: {from_status} -> {new_status}" + (f" (Reason: {reason})" if reason else ""),
            performed_by=performed_by
        )
        self.db.add(history)
        
        await self.db.commit()
        await self.db.refresh(asset)
        return asset
    
    async def get_asset(self, asset_id: int) -> Optional[Asset]:
        """Get asset by ID"""
        result = await self.db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        return result.scalar_one_or_none()
    
    async def delete_asset(
        self,
        asset_id: int,
        performed_by: Optional[str] = None
    ) -> bool:
        """Delete an asset (soft delete by setting status to disposed)"""
        result = await self.db.execute(
            select(Asset).where(Asset.id == asset_id)
        )
        asset = result.scalar_one_or_none()
        
        if not asset:
            raise ValueError("Asset not found")
        
        # Soft delete - change status to disposed
        asset.status = "disposed"
        asset.updated_at = datetime.utcnow()
        
        # Create audit history
        history = AssetHistory(
            asset_id=asset.id,
            event_type=AssetEventType.STATUS_CHANGED,
            details="Asset disposed/deleted",
            performed_by=performed_by
        )
        self.db.add(history)
        
        await self.db.commit()
        return True
