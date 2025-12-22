"""
API Router configuration for Employee Service
"""
from fastapi import APIRouter
from app.api.v1.endpoints import employees

api_router = APIRouter()

api_router.include_router(
    employees.router,
    prefix="/employees",
    tags=["employees"]
)
