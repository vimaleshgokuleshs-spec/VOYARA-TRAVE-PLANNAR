import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from backend.app.config import settings, BASE_DIR
from backend.app.database import init_db, SessionLocal
from backend.app.seed.seeder import seed_destinations
from backend.app.routes import auth_router, destination_router, trip_router, favorite_router

# Lifespan: DB initialization & initial seed
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure all database tables exist
    init_db()
    # 2. Seed default destinations if table is empty
    db = SessionLocal()
    try:
        seed_destinations(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="VOYARA API",
    version="1.0.0",
    description="Full-Stack Smart Travel Planner API with secure authentication, itinerary persistence & budget telemetry.",
    lifespan=lifespan
)

# CORS configuration for cross-origin local development
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(destination_router, prefix="/api")
app.include_router(trip_router, prefix="/api")
app.include_router(favorite_router, prefix="/api")

# Static Files & Frontend Integration
FRONTEND_DIR = BASE_DIR / "frontend"

if FRONTEND_DIR.exists():
    # Mount frontend assets
    app.mount("/frontend", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend_assets")

    # Serve index.html at root
    @app.get("/", include_in_schema=False)
    async def serve_root():
        index_path = FRONTEND_DIR / "index.html"
        return FileResponse(index_path)

@app.get("/api/health", tags=["Telemetry"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "database": "sqlite",
        "version": "1.0.0"
    }
