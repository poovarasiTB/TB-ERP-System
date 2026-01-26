"""
Asset History and Audit Models
"""
from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, Text
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class AssetEventType(str, enum.Enum):
    """Types of events tracked in asset history"""
    CREATED = "created"
    STATUS_CHANGED = "status_changed"
    ASSIGNED = "assigned"
    UNASSIGNED = "unassigned"
    MAINTENANCE = "maintenance"

class AssetHistory(Base):
    """Immutable audit trail for all asset lifecycle events"""
    __tablename__ = "asset_history"
    __table_args__ = {"schema": "assets"}

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("assets.assets.id"), nullable=False, index=True)
    event_type = Column(Enum(AssetEventType), nullable=False)
    event_time = Column(DateTime, server_default=func.now(), nullable=False)
    details = Column(Text, nullable=True)
    performed_by = Column(String(255), nullable=True)
