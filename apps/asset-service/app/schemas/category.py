from typing import Any, Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime

class CategoryBase(BaseModel):
    name: str
    spec_fields: List[str]
    allowed_values: Dict[str, List[str]]

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
