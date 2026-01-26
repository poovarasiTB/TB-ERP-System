from sqlalchemy import Column, Integer, String, DateTime, text
from sqlalchemy.dialects.postgresql import JSONB
from app.db.session import Base

class AssetCategory(Base):
    __tablename__ = "asset_categories"
    __table_args__ = {"schema": "assets"}

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True, nullable=False)
    spec_fields = Column(JSONB, nullable=False)
    allowed_values = Column(JSONB, nullable=False)
    created_at = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
