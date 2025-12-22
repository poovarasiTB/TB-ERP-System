"""
Asset database models using SQLAlchemy with Schema Isolation
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.db.session import Base

class AssetStatus(str, enum.Enum):
    """Asset status enumeration"""
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    RETIRED = "retired"
    DISPOSED = "disposed"

class Asset(Base):
    """Asset model representing company assets"""
    __tablename__ = "assets"
    __table_args__ = {"schema": "assets"}
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(50), unique=True, nullable=False, index=True)
    asset_type = Column(String(100), nullable=True)
    asset_class = Column(String(100), nullable=True)
    serial_number = Column(String(100), nullable=True, index=True)
    manufacturer = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    os_installed = Column(String(100), nullable=True)
    processor = Column(String(100), nullable=True)
    ram_size_gb = Column(String(50), nullable=True)
    hard_drive_size = Column(String(50), nullable=True)
    battery_condition = Column(String(50), nullable=True)
    
    status = Column(String(50), default="active", nullable=False)
    assigned_employee_id = Column(Integer, nullable=True, index=True)
    
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

class MaintenanceLog(Base):
    """Maintenance records for assets"""
    __tablename__ = "maintenance_logs"
    __table_args__ = {"schema": "assets"}
    
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, nullable=False, index=True)
    maintenance_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    cost = Column(Float, nullable=True)
    performed_by = Column(String(255), nullable=True)
    performed_at = Column(DateTime, nullable=False)
    next_maintenance = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
