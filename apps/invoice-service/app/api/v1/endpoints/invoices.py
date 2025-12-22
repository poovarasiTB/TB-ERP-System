from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import math

from app.db.session import get_db
from app.models.invoice import Invoice
from app.schemas.invoice import (
    InvoiceCreate,
    InvoiceUpdate,
    InvoiceResponse,
    InvoiceList,
)
from app.core.security import get_current_user, require_roles, TokenData

router = APIRouter()

@router.get("", response_model=InvoiceList)
async def list_invoices(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """List all invoices with pagination"""
    query = select(Invoice)
    count_query = select(func.count(Invoice.id))
    
    if status:
        query = query.where(Invoice.status == status)
        count_query = count_query.where(Invoice.status == status)
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * size
    query = query.offset(offset).limit(size).order_by(Invoice.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    return InvoiceList(
        items=[InvoiceResponse.model_validate(i) for i in invoices],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )

@router.get("/{id}", response_model=InvoiceResponse)
async def get_invoice(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Get a specific invoice by ID"""
    result = await db.execute(select(Invoice).where(Invoice.id == id))
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    return InvoiceResponse.model_validate(invoice)

@router.post("", response_model=InvoiceResponse, status_code=201)
async def create_invoice(
    invoice_data: InvoiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_roles(["invoice_manager", "admin"])),
):
    """Create a new invoice (Manager/Admin only)"""
    invoice = Invoice(**invoice_data.model_dump())
    db.add(invoice)
    await db.commit()
    await db.refresh(invoice)
    return InvoiceResponse.model_validate(invoice)
