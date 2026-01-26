"""
Maintenance Log Schemas
"""
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class MaintenanceLogBase(BaseModel):
    maintenance_type: str
    description: Optional[str] = None
    cost: Optional[float] = None
    performed_by: Optional[str] = None
    performed_at: datetime
    next_maintenance: Optional[datetime] = None

class MaintenanceLogCreate(MaintenanceLogBase):
    asset_id: int

class MaintenanceLogResponse(MaintenanceLogBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    asset_id: int
    created_at: datetime

class MaintenanceLogList(BaseModel):
    items: List[MaintenanceLogResponse]
    total: int
