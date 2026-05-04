from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Dict

from core.database import get_db
from models.ioc import IOC
from models.enrichment import EnrichmentResult
from schemas.enrichment import EnrichmentResultResponse
from services.enrichment import VirusTotalService, AbuseIPDBService, IPInfoService
from services.scoring import calculate_risk_score
import asyncio

router = APIRouter()

vt_service = VirusTotalService()
abuse_service = AbuseIPDBService()
ipinfo_service = IPInfoService()

async def process_enrichment(ioc: IOC, db: AsyncSession):
    # clear existing
    await db.execute(select(EnrichmentResult).filter(EnrichmentResult.ioc_id == ioc.id))
    
    enrichments = []
    
    vt_result = await vt_service.check(ioc.value, ioc.ioc_type)
    if "skipped" not in vt_result and "error" not in vt_result:
        vt_enr = EnrichmentResult(
            ioc_id=ioc.id,
            source="virustotal",
            raw_response=vt_result.get("raw", {}),
            malicious_votes=vt_result.get("malicious", 0),
            total_votes=sum(v for k,v in vt_result.items() if k in ["malicious", "suspicious", "harmless", "undetected"])
        )
        db.add(vt_enr)
        enrichments.append({"source": "virustotal", "malicious_votes": vt_enr.malicious_votes, "total_votes": vt_enr.total_votes})

    if ioc.ioc_type == "ip":
        abuse_result = await abuse_service.check(ioc.value)
        if "skipped" not in abuse_result and "error" not in abuse_result:
            ab_enr = EnrichmentResult(
                ioc_id=ioc.id,
                source="abuseipdb",
                raw_response=abuse_result.get("raw", {}),
                abuse_confidence_score=abuse_result.get("abuseConfidenceScore", 0),
                country=abuse_result.get("countryCode", ""),
                isp=abuse_result.get("isp", "")
            )
            db.add(ab_enr)
            enrichments.append({"source": "abuseipdb", "abuse_confidence_score": ab_enr.abuse_confidence_score})
            
        ipinfo_result = await ipinfo_service.check(ioc.value)
        if "skipped" not in ipinfo_result and "error" not in ipinfo_result:
            ip_enr = EnrichmentResult(
                ioc_id=ioc.id,
                source="ipinfo",
                raw_response=ipinfo_result.get("raw", {}),
                country=ipinfo_result.get("country", "")
            )
            db.add(ip_enr)
            enrichments.append({"source": "ipinfo", "country": ip_enr.country})
            
    # Calculate Risk Score
    score, level = calculate_risk_score(enrichments)
    ioc.risk_score = score
    ioc.risk_level = level
    db.add(ioc)

@router.post("/{ioc_id}")
async def enrich_single_ioc(ioc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IOC).filter(IOC.id == ioc_id))
    ioc = result.scalar_one_or_none()
    if not ioc:
        raise HTTPException(status_code=404, detail="IOC not found")
        
    await process_enrichment(ioc, db)
    await db.commit()
    
    # return results
    res = await db.execute(select(EnrichmentResult).filter(EnrichmentResult.ioc_id == ioc_id))
    return res.scalars().all()

@router.post("/bulk")
async def enrich_multiple_iocs(request: dict, db: AsyncSession = Depends(get_db)):
    ioc_ids = request.get("ioc_ids", [])
    if not ioc_ids:
        return {"status": "success", "processed": 0}
        
    result = await db.execute(select(IOC).filter(IOC.id.in_(ioc_ids)))
    iocs = result.scalars().all()
    
    for ioc in iocs:
        await process_enrichment(ioc, db)
        
    await db.commit()
    return {"status": "success", "processed": len(iocs)}

@router.get("/{ioc_id}/results", response_model=List[EnrichmentResultResponse])
async def get_enrichment_results(ioc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(EnrichmentResult).filter(EnrichmentResult.ioc_id == ioc_id))
    return result.scalars().all()
