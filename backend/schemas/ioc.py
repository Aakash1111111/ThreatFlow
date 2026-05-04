from pydantic import BaseModel, ConfigDict
import datetime
from typing import List, Optional

class IOCBase(BaseModel):
    value: str
    ioc_type: str
    source_text: Optional[str] = None

class IOCExtractRequest(BaseModel):
    text: str

class IOCSubmitRequest(BaseModel):
    iocs: List[IOCBase]
    source_text: Optional[str] = None

class IOCResponse(BaseModel):
    id: str
    value: str
    ioc_type: str
    risk_score: float
    risk_level: str
    tags: List[str]
    created_at: datetime.datetime
    
    model_config = ConfigDict(from_attributes=True)
