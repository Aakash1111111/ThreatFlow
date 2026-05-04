import uuid
import datetime
from sqlalchemy import Column, String, Integer, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from core.database import Base

class EnrichmentResult(Base):
    __tablename__ = "enrichment_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    ioc_id = Column(String(36), ForeignKey("iocs.id"), nullable=False)
    source = Column(String(100), nullable=False) # "virustotal", "abuseipdb", "ipinfo"
    raw_response = Column(JSON, default=dict)
    malicious_votes = Column(Integer, default=0)
    total_votes = Column(Integer, default=0)
    abuse_confidence_score = Column(Integer, default=0)
    country = Column(String(100), nullable=True)
    isp = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    ioc = relationship("IOC", back_populates="enrichments")
