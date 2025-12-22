from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class EmployeeBase(BaseModel):
    employee_id: str = Field(..., min_length=1, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=255)
    email: str = Field(..., min_length=1, max_length=255)
    department_id: Optional[int] = None
    location: Optional[str] = None
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    department_id: Optional[int] = None
    location: Optional[str] = None
    is_active: Optional[bool] = None

class EmployeeResponse(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

class EmployeeList(BaseModel):
    items: List[EmployeeResponse]
    total: int
    page: int
    size: int
    pages: int
