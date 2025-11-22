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

## API surface

The FastAPI app exposes CRUD endpoints for dentistries, services, staff (with availability), and appointment booking/availability queries. Interactive documentation is available at [`/docs`](http://localhost:8000/docs) when running the dev server.
