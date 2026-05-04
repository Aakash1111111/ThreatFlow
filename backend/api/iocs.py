from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from uuid import UUID

from core.database import get_db
from models.ioc import IOC
from schemas.ioc import IOCExtractRequest, IOCSubmitRequest, IOCResponse
from services.extraction import extract_iocs

router = APIRouter()

@router.post("/extract")
async def api_extract_iocs(request: IOCExtractRequest):
    results = extract_iocs(request.text)
    counts = {
        "ips": len(results["ips"]),
        "domains": len(results["domains"]),
        "hashes": sum(len(v) for v in results["hashes"].values()),
        "urls": len(results["urls"])
    }
    return {"results": results, "counts": counts}

@router.post("/submit", response_model=List[IOCResponse])
async def submit_iocs(request: IOCSubmitRequest, db: AsyncSession = Depends(get_db)):
    created_iocs = []
    
    for ioc_req in request.iocs:
        new_ioc = IOC(
            value=ioc_req.value,
            ioc_type=ioc_req.ioc_type,
            source_text=ioc_req.source_text or request.source_text
        )
        db.add(new_ioc)
        created_iocs.append(new_ioc)
        
    await db.commit()
    for ioc in created_iocs:
        await db.refresh(ioc)
        
    return created_iocs

@router.get("", response_model=List[IOCResponse])
async def get_iocs(
    limit: int = Query(100, ge=1, le=1000), 
    offset: int = 0,
    risk_level: Optional[str] = None,
    ioc_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    query = select(IOC).order_by(desc(IOC.created_at)).offset(offset).limit(limit)
    if risk_level:
        query = query.filter(IOC.risk_level == risk_level)
    if ioc_type:
        query = query.filter(IOC.ioc_type == ioc_type)
        
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{ioc_id}", response_model=IOCResponse)
async def get_ioc(ioc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IOC).filter(IOC.id == ioc_id))
    ioc = result.scalar_one_or_none()
    if not ioc:
        raise HTTPException(status_code=404, detail="IOC not found")
    return ioc

@router.delete("/{ioc_id}")
async def delete_ioc(ioc_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IOC).filter(IOC.id == ioc_id))
    ioc = result.scalar_one_or_none()
    if not ioc:
        raise HTTPException(status_code=404, detail="IOC not found")
        
    await db.delete(ioc)
    await db.commit()
    return {"status": "success", "message": f"Deleted IOC {ioc_id}"}

@router.post("/bulk-delete")
async def bulk_delete_iocs(request: dict, db: AsyncSession = Depends(get_db)):
    ids = request.get("ids", [])
    if not ids:
        return {"status": "success", "count": 0}
        
    result = await db.execute(select(IOC).filter(IOC.id.in_(ids)))
    iocs = result.scalars().all()
    
    for ioc in iocs:
        await db.delete(ioc)
        
    await db.commit()
    return {"status": "success", "count": len(iocs)}
