from fastapi import FastAPI

from .config import get_settings

app = FastAPI(title="Stitch Dentistry API")
settings = get_settings()


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "debug": settings.debug,
        "database_url": settings.database_url,
    }


@app.get("/config")
async def config_summary():
    return {
        "host": settings.host,
        "port": settings.port,
        "debug": settings.debug,
    }
