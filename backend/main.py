from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.database import engine, Base
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup event: create all DB tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(
    title="ThreatFlow API",
    description="Backend API for ThreatFlow SOAR platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS allowing all origins (dev mode)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from api.iocs import router as iocs_router
from api.enrichment import router as enrichment_router
from api.reports import router as reports_router
from api.dashboard import router as dashboard_router

app.include_router(iocs_router, prefix="/api/v1/iocs", tags=["IOCs"])
app.include_router(enrichment_router, prefix="/api/v1/enrich", tags=["Enrichment"])
app.include_router(reports_router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(dashboard_router, prefix="/api/v1/dashboard", tags=["Dashboard"])

@app.get("/health")
async def health_check():
    return {"status": "ok"}

