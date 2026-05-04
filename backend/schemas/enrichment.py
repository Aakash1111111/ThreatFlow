from pydantic import BaseModel, ConfigDict
import datetime
from typing import Optional, Dict, Any

class EnrichmentResultResponse(BaseModel):
    id: str
    ioc_id: str
    source: str
    raw_response: Dict[str, Any]
    malicious_votes: int
    total_votes: int
    abuse_confidence_score: int
    country: Optional[str] = None
    isp: Optional[str] = None
    created_at: datetime.datetime
    
    model_config = ConfigDict(from_attributes=True)
