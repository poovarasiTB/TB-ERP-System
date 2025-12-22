"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from enum import Enum

class AssetStatus(str, Enum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"
    DISPOSED = "disposed"

# ============================================
# Asset Schemas
# ============================================

class AssetBase(BaseModel):
    """Base schema for Asset mapping to user's specified data structure"""
    asset_id: str = Field(..., min_length=1, max_length=50)
    asset_type: Optional[str] = None
    asset_class: Optional[str] = None
    serial_number: Optional[str] = None
    manufacturer: Optional[str] = None
    model: Optional[str] = None
    os_installed: Optional[str] = None
    processor: Optional[str] = None
    ram_size_gb: Optional[str] = None
    hard_drive_size: Optional[str] = None
    battery_condition: Optional[str] = None
    status: str = "active"
    assigned_employee_id: Optional[int] = None

class AssetCreate(AssetBase):
    """Schema for creating an asset"""
    pass

class AssetUpdate(BaseModel):
    """Schema for updating an asset"""
    asset_type: Optional[str] = None
    asset_class: Optional[str] = None
    status: Optional[str] = None
    assigned_employee_id: Optional[int] = None

class AssetResponse(AssetBase):
    """Schema for asset response"""
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    created_at: datetime
    updated_at: datetime

class AssetList(BaseModel):
    """Paginated list of assets"""
    items: List[AssetResponse]
    total: int
    page: int
    size: int
    pages: int
