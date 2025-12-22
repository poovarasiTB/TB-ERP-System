from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date

class InvoiceBase(BaseModel):
    invoice_number: str
    total_amount: float
    status: str = "draft"
    due_date: Optional[date] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(BaseModel):
    total_amount: Optional[float] = None
    status: Optional[str] = None
    due_date: Optional[date] = None

class InvoiceResponse(InvoiceBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime

class InvoiceList(BaseModel):
    items: List[InvoiceResponse]
    total: int
    page: int
    size: int
    pages: int
