from datetime import datetime

from fastapi import FastAPI

from .config import get_settings
from .migrations import run_migrations
from .routers import appointments, dentistry, services, staff
from .seeding import seed_data
from .db import engine
from sqlmodel import Session

tags_metadata = [
    {"name": "dentistries", "description": "Manage dentistry profiles."},
    {"name": "services", "description": "Manage offered services and pricing."},
    {"name": "staff", "description": "Manage staff records and availability."},
    {"name": "appointments", "description": "Check availability and book appointments."},
]

app = FastAPI(title="Stitch Dentistry API", openapi_tags=tags_metadata)
settings = get_settings()


@app.on_event("startup")
def on_startup():
    run_migrations()
    with Session(engine) as session:
        seed_data(session)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "debug": settings.debug,
        "database_url": settings.database_url,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/config")
async def config_summary():
    return {
        "host": settings.host,
        "port": settings.port,
        "debug": settings.debug,
    }


app.include_router(dentistry.router)
app.include_router(services.router)
app.include_router(staff.router)
app.include_router(appointments.router)
