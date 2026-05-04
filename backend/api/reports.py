from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID

from core.database import get_db
from models.ioc import IOC
from services.reporting import generate_pdf_report
from pydantic import BaseModel
import io

router = APIRouter()

class ReportRequest(BaseModel):
    ioc_ids: List[str]
    title: str = "Threat Intelligence Report"

@router.post("/generate")
async def generate_report(request: ReportRequest, db: AsyncSession = Depends(get_db)):
    if not request.ioc_ids:
        raise HTTPException(status_code=400, detail="No IOC IDs provided")
        
    result = await db.execute(select(IOC).filter(IOC.id.in_(request.ioc_ids)))
    iocs = result.scalars().unique().all()
    
    if not iocs:
        raise HTTPException(status_code=404, detail="No matching IOCs found")
        
    pdf_bytes = generate_pdf_report(iocs, request.title)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=threatflow_report.pdf"
        }
    )

@router.get("/preview/{ioc_id}")
async def preview_report(ioc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IOC).filter(IOC.id == ioc_id))
    ioc = result.scalar_one_or_none()
    if not ioc:
        raise HTTPException(status_code=404, detail="IOC not found")
        
    return {
        "title": f"Report for {ioc.value}",
        "sections": ["Executive Summary", "IOC Details"],
        "ioc_count": 1,
        "risk_level": ioc.risk_level
    }
