"""
API Router configuration
"""
from fastapi import APIRouter

router = APIRouter()

# Import and register routers
try:
    from app.api.v1.endpoints import assets
    router.include_router(assets.router, prefix="/assets", tags=["assets"])
    print("✓ Assets router registered")
except Exception as e:
    print(f"✗ Failed to register assets router: {e}")

try:
    from app.api.v1.endpoints import categories
    router.include_router(categories.router, prefix="/categories", tags=["categories"])
    print("✓ Categories router registered")
except Exception as e:
    print(f"✗ Failed to register categories router: {e}")

try:
    from app.api.v1.endpoints import assignments
    router.include_router(assignments.router, prefix="/assignments", tags=["assignments"])
    print("✓ Assignments router registered")
except Exception as e:
    print(f"✗ Failed to register assignments router: {e}")

try:
    from app.api.v1.endpoints import history
    router.include_router(history.router, prefix="/history", tags=["history"])
    print("✓ History router registered")
except Exception as e:
    print(f"✗ Failed to register history router: {e}")

try:
    from app.api.v1.endpoints import maintenance
    router.include_router(maintenance.router, prefix="/maintenance", tags=["maintenance"])
    print("✓ Maintenance router registered")
except Exception as e:
    print(f"✗ Failed to register maintenance router: {e}")

try:
    print("--- DEBUG: Attempting to import analytics module ---")
    from app.api.v1.endpoints import analytics
    print("--- DEBUG: Analytics module imported successfully ---")
    print(f"--- DEBUG: Analytics router object: {analytics.router} ---")
    print(f"--- DEBUG: Analytics router type: {type(analytics.router)} ---")
    print(f"--- DEBUG: Analytics router routes before inclusion: {len(analytics.router.routes)} ---")
    
    # Verify router has routes before including
    if len(analytics.router.routes) == 0:
        print("⚠ WARNING: Analytics router has no routes!")
    else:
        for route in analytics.router.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                print(f"  Pre-inclusion Route: {route.path} Methods: {route.methods}")
    
    router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
    print("✓ Analytics router registered at /api/v1/analytics")
    
    # Debug: Print all routes in analytics router after inclusion
    print(f"--- DEBUG: Analytics router has {len(analytics.router.routes)} routes after inclusion ---")
    for route in analytics.router.routes:
        if hasattr(route, 'path') and hasattr(route, 'methods'):
            print(f"  Route: {route.path} Methods: {route.methods}")
    
    # Debug: Check main router after inclusion
    print(f"--- DEBUG: Main router now has {len(router.routes)} total routes ---")
    analytics_in_main = [r for r in router.routes if hasattr(r, 'path') and 'analytics' in str(r.path)]
    print(f"--- DEBUG: Found {len(analytics_in_main)} analytics routes in main router ---")
    for r in analytics_in_main:
        methods = getattr(r, 'methods', set())
        print(f"  Main router analytics route: {list(methods)} {r.path}")
    
except Exception as e:
    print(f"✗ Failed to register analytics router: {e}")
    import traceback
    traceback.print_exc()
    # Don't raise - allow server to start, but error is visible
