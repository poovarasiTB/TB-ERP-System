from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import math

from app.db.session import get_db
from app.models.employee import Employee
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeResponse,
    EmployeeList,
)
from app.core.security import get_current_user, require_roles, TokenData

router = APIRouter()

@router.get("", response_model=EmployeeList)
async def list_employees(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    department_id: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """List all employees with pagination and searching"""
    query = select(Employee)
    count_query = select(func.count(Employee.id))
    
    if department_id:
        query = query.where(Employee.department_id == department_id)
        count_query = count_query.where(Employee.department_id == department_id)
    
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (Employee.full_name.ilike(search_filter)) |
            (Employee.employee_id.ilike(search_filter)) |
            (Employee.email.ilike(search_filter))
        )
        count_query = count_query.where(
            (Employee.full_name.ilike(search_filter)) |
            (Employee.employee_id.ilike(search_filter)) |
            (Employee.email.ilike(search_filter))
        )
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * size
    query = query.offset(offset).limit(size).order_by(Employee.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    employees = result.scalars().all()
    
    return EmployeeList(
        items=[EmployeeResponse.model_validate(e) for e in employees],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )

@router.get("/{id}", response_model=EmployeeResponse)
async def get_employee(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Get a specific employee by ID"""
    result = await db.execute(select(Employee).where(Employee.id == id))
    employee = result.scalar_one_or_none()
    
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return EmployeeResponse.model_validate(employee)

@router.post("", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    employee_data: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_roles(["hr_manager", "admin"])),
):
    """Create a new employee (HR/Admin only)"""
    # Check for duplicate employee_id
    existing = await db.execute(select(Employee).where(Employee.employee_id == employee_data.employee_id))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Employee ID already exists")
        
    employee = Employee(**employee_data.model_dump())
    db.add(employee)
    await db.commit()
    await db.refresh(employee)
    return EmployeeResponse.model_validate(employee)
