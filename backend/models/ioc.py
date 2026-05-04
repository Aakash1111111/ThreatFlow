import uuid
import datetime
from sqlalchemy import Column, String, Float, Text, JSON, DateTime
from sqlalchemy.orm import relationship
from core.database import Base

class IOC(Base):
    __tablename__ = "iocs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    value = Column(String(255), nullable=False)
    ioc_type = Column(String(50), nullable=False) # "ip", "domain", "hash", "url"
    source_text = Column(Text, nullable=True)
    risk_score = Column(Float, default=0.0)
    risk_level = Column(String(50), default="clean") # "critical", "high", "medium", "low", "clean"
    tags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    enrichments = relationship("EnrichmentResult", back_populates="ioc", cascade="all, delete-orphan")
