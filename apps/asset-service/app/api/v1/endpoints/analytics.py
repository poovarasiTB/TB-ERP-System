from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text

from app.db.session import get_db
from app.models.asset import Asset
from app.schemas.analytics import DashboardStatsResponse, EmployeeAssetCount
from app.core.security import get_current_user, TokenData

print("--- DEBUG: Loading analytics module ---")

router = APIRouter()

print("--- DEBUG: Analytics router created ---")

# Test endpoint to verify routing works
@router.get("/test", tags=["analytics"])
async def test_analytics_route():
    """Test endpoint to verify analytics router is accessible"""
    print("--- DEBUG: /test endpoint called ---")
    return {
        "message": "Analytics router is working!", 
        "path": "/api/v1/analytics/test",
        "status": "success"
    }

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Get aggregated statistics for the dashboard.
    """
    print("--- DEBUG: dashboard-stats endpoint called ---")
    # 1. Total Assets
    total_query = select(func.count(Asset.id))
    total_result = await db.execute(total_query)
    total_assets = total_result.scalar() or 0
    
    # 2. Status Distribution
    # Group by status to get counts for all statuses
    status_query = select(Asset.status, func.count(Asset.id)).group_by(Asset.status)
    status_result = await db.execute(status_query)
    status_distribution = {row[0]: row[1] for row in status_result.all()}
    
    # Extract specific counts from distribution or defaulting to 0
    assigned_assets = status_distribution.get("assigned", 0)
    
    # Available typically means 'in_stock' or 'active' (depending on terminology used)
    # Checking both common terms
    available_assets = status_distribution.get("in_stock", 0) + status_distribution.get("active", 0)
    
    maintenance_assets = status_distribution.get("maintenance", 0)
    
    # 3. Type Distribution
    type_query = select(Asset.asset_type, func.count(Asset.id)).group_by(Asset.asset_type)
    type_result = await db.execute(type_query)
    type_distribution = {row[0]: row[1] for row in type_result.all() if row[0]}
    
    return DashboardStatsResponse(
        total_assets=total_assets,
        assigned_assets=assigned_assets,
        available_assets=available_assets,
        maintenance_assets=maintenance_assets,
        status_distribution=status_distribution,
        type_distribution=type_distribution
    )

@router.get("/employee-usage", response_model=list[EmployeeAssetCount])
async def get_employee_usage_stats(
    db: AsyncSession = Depends(get_db),
    current_user: TokenData = Depends(get_current_user),
):
    """
    Get asset counts per employee.
    """
    # Query Asset table where status is assigned and group by assigned_employee_id
    query = (
        select(Asset.assigned_employee_id, func.count(Asset.id))
        .where(Asset.status == 'assigned')
        .where(Asset.assigned_employee_id.isnot(None))
        .group_by(Asset.assigned_employee_id)
        .order_by(func.count(Asset.id).desc())
    )
    
    result = await db.execute(query)
    
    usage_stats = []
    for row in result.all():
        employee_id, count = row
        usage_stats.append(EmployeeAssetCount(
            employee_id=employee_id,
            asset_count=count
        ))
        
    return usage_stats
