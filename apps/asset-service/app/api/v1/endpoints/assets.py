"""
Asset API Endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
import math

from app.db.session import get_db
from app.models.asset import Asset
from app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    AssetList,
)
from app.core.security import get_current_user, require_roles, TokenData

router = APIRouter()

@router.get("", response_model=AssetList)
async def list_assets(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    asset_type: Optional[str] = None,
    asset_class: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    List all assets with pagination and filtering.
    """
    # Build query
    query = select(Asset)
    count_query = select(func.count(Asset.id))
    
    # Apply filters
    if asset_type:
        query = query.where(Asset.asset_type == asset_type)
        count_query = count_query.where(Asset.asset_type == asset_type)
    
    if asset_class:
        query = query.where(Asset.asset_class == asset_class)
        count_query = count_query.where(Asset.asset_class == asset_class)
    
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (Asset.asset_id.ilike(search_filter)) |
            (Asset.serial_number.ilike(search_filter)) |
            (Asset.model.ilike(search_filter))
        )
        count_query = count_query.where(
            (Asset.asset_id.ilike(search_filter)) |
            (Asset.serial_number.ilike(search_filter)) |
            (Asset.model.ilike(search_filter))
        )
    
    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * size
    query = query.offset(offset).limit(size).order_by(Asset.created_at.desc())
    
    # Execute query
    result = await db.execute(query)
    assets = result.scalars().all()
    
    return AssetList(
        items=[AssetResponse.model_validate(a) for a in assets],
        total=total,
        page=page,
        size=size,
        pages=math.ceil(total / size) if total > 0 else 0,
    )

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """Get a specific asset by ID"""
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    return AssetResponse.model_validate(asset)

@router.post("", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def create_asset(
    asset_data: AssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_roles(["asset_manager"])),
):
    """
    Create a new asset.
    """
    # Check for duplicate asset_id
    existing = await db.execute(
        select(Asset).where(Asset.asset_id == asset_data.asset_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset with this ID already exists"
        )
    
    # Create asset
    asset = Asset(**asset_data.model_dump())
    
    db.add(asset)
    await db.commit()
    await db.refresh(asset)
    
    return AssetResponse.model_validate(asset)

@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: int,
    asset_data: AssetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(require_roles(["asset_manager"])),
):
    """
    Update an existing asset.
    """
    result = await db.execute(select(Asset).where(Asset.id == asset_id))
    asset = result.scalar_one_or_none()
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    # Update fields
    update_data = asset_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)
    
    await db.commit()
    await db.refresh(asset)
    
    return AssetResponse.model_validate(asset)
