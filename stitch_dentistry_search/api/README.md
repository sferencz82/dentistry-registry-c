# Stitch Dentistry API

A FastAPI scaffold that exposes configuration-aware endpoints for the Stitch Dentistry platform.

## Local development

Create an `.env` file based on `.env.example` and install dependencies:

```bash
python -m pip install .[dev]
python -m stitch_dentistry_api.main
```

Run quality checks with the configured tools:

```bash
ruff check .
pytest
```

## Docker image

A production-friendly image is defined in `Dockerfile` (based on `python:3.11-slim` with `uvicorn`). Build and run locally with the Compose stack from the repository root:

```bash
docker compose up --build api
```

Set `API_DATABASE_URL` to your PostgreSQL connection string (for example, `postgresql+psycopg://user:password@host:5432/db`).

## API surface

The FastAPI app exposes CRUD endpoints for dentistries, services, staff (with availability), and appointment booking/availability queries. Interactive documentation is available at [`/docs`](http://localhost:8000/docs) when running the dev server.
