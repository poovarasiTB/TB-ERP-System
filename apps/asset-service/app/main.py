"""
TB ERP - Asset Management Service
FastAPI-based microservice for asset lifecycle management
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.api.v1.router import router as api_router
from app.core.config import settings
from app.db.session import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management"""
    # Startup
    print("--- LIFESPAN: STARTING UP ---")
    try:
        print("--- LIFESPAN: Initializing DB ---")
        await init_db()
        print("--- LIFESPAN: DB Initialized ---")
    except Exception as e:
        print(f"--- LIFESPAN: DB Init FAILED: {e} ---")
        print("--- WARNING: Server will start but database operations may fail ---")
        print("--- Please check your database connection settings ---")
        # Don't raise - allow server to start even if DB connection fails
        # Database will be connected on first request
    yield
    # Shutdown
    print("--- LIFESPAN: SHUTTING DOWN ---")

app = FastAPI(
    title="Asset Management Service",
    description="Microservice for managing company assets, maintenance, and depreciation",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Direct test route to verify routing works (define BEFORE router to test)
@app.get("/api/v1/analytics/test-direct")
async def test_direct_route():
    """Direct test route to verify routing"""
    return {"message": "Direct route works!", "path": "/api/v1/analytics/test-direct"}

# Include API routes
app.include_router(api_router, prefix="/api/v1")

# Debug: Verify analytics routes are in the app after inclusion
print("--- DEBUG: Checking app routes after inclusion ---")
analytics_routes = []
for route in app.routes:
    if hasattr(route, 'path') and 'analytics' in str(route.path):
        methods = getattr(route, 'methods', set())
        analytics_routes.append(f"{list(methods)} {route.path}")
        print(f"  Found analytics route: {list(methods)} {route.path}")

if not analytics_routes:
    print("  ⚠ WARNING: No analytics routes found in app!")
    print("  Checking all routes:")
    for route in app.routes:
        if hasattr(route, 'path'):
            print(f"    - {route.path}")
else:
    print(f"  ✓ Found {len(analytics_routes)} analytics route(s)")

@app.get("/health")
async def health_check():
    """Health check endpoint for container orchestration"""
    return {"status": "healthy", "service": "asset-service"}
