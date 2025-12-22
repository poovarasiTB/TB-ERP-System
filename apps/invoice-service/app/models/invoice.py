"""
Invoice database models using SQLAlchemy with Schema Isolation
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Date
from sqlalchemy.sql import func
from app.db.session import Base

class Invoice(Base):
    """Invoice model for billing"""
    __tablename__ = "invoices"
    __table_args__ = {"schema": "invoices"}
    
    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(50), unique=True, nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), default="draft")
    due_date = Column(Date, nullable=True)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
