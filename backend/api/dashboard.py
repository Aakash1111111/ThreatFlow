from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any
import datetime

from core.database import get_db
from models.ioc import IOC
from models.enrichment import EnrichmentResult

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_db)) -> Dict[str, Any]:
    # Totals
    result = await db.execute(select(func.count()).select_from(IOC))
    total_iocs = result.scalar() or 0
    
    # By type
    result = await db.execute(select(IOC.ioc_type, func.count(IOC.id)).group_by(IOC.ioc_type))
    by_type = {row[0]: row[1] for row in result.all()}
    
    # By risk level
    result = await db.execute(select(IOC.risk_level, func.count(IOC.id)).group_by(IOC.risk_level))
    by_risk = {row[0]: row[1] for row in result.all()}
    
    # Recent 10
    result = await db.execute(select(IOC).order_by(IOC.created_at.desc()).limit(10))
    recent_iocs = result.scalars().all()
    
    # Enrichment coverage
    result = await db.execute(select(func.count(func.distinct(EnrichmentResult.ioc_id))))
    enriched_count = result.scalar() or 0
    coverage = (enriched_count / total_iocs * 100) if total_iocs > 0 else 0
    
    # Average Risk Score
    result = await db.execute(select(func.avg(IOC.risk_score)))
    avg_score = result.scalar() or 0.0
    
    return {
        "total_iocs": total_iocs,
        "by_type": by_type,
        "by_risk_level": by_risk,
        "recent_iocs": [{"id": i.id, "value": i.value, "type": i.ioc_type, "risk_level": i.risk_level, "timestamp": str(i.created_at)} for i in recent_iocs],
        "enrichment_coverage": round(coverage, 2),
        "avg_risk_score": round(avg_score, 2)
    }

@router.get("/timeline")
async def get_dashboard_timeline(db: AsyncSession = Depends(get_db)):
    # Group by day for last 30 days
    # SQLite friendly date truncation
    thirty_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    
    query = select(
        func.date(IOC.created_at).label('day'),
        func.count(IOC.id).label('count')
    ).filter(
        IOC.created_at >= thirty_days_ago
    ).group_by(
        'day'
    ).order_by('day')
    
    result = await db.execute(query)
    data = []
    # Fill in blanks so frontend has continuous dates
    results_map = {row[0]: row[1] for row in result.all()}
    
    curr_date = thirty_days_ago.date()
    end_date = datetime.datetime.utcnow().date()
    
    while curr_date <= end_date:
        date_str = curr_date.strftime("%Y-%m-%d")
        data.append({
            "date": date_str,
            "count": results_map.get(date_str, 0)
        })
        curr_date += datetime.timedelta(days=1)
        
    return data
