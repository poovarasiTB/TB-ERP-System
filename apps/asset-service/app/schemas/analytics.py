from pydantic import BaseModel
from typing import List, Dict, Optional

class DashboardStatsResponse(BaseModel):
    total_assets: int
    assigned_assets: int
    available_assets: int
    maintenance_assets: int
    status_distribution: Dict[str, int]
    type_distribution: Dict[str, int]

class EmployeeAssetCount(BaseModel):
    employee_id: int
    asset_count: int
    last_assigned_date: Optional[str] = None
