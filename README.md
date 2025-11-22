# Stitch Dentistry Registry

Documentation and scaffolding for the Stitch Dentistry platform across the web client, mobile shell, shared TypeScript utilities, and FastAPI backend. Use this repo to prototype search, booking, and billing flows locally or in CI/CD.

## Architecture
- **Web (`stitch_dentistry_search/web`)**: React + Vite single-page app with chat assist (`ChatSupport.tsx`), API adapter (`api.ts`), and Jest/RTL tests.
- **Mobile (`stitch_dentistry_search/mobile`)**: React Native scaffold with bottom-tab navigation, Zustand store, and mocked API client for appointments/chat.
- **Shared (`stitch_dentistry_search/shared`)**: Lightweight TypeScript env loader shared by web/mobile bundles.
- **API (`stitch_dentistry_search/api`)**: FastAPI + SQLModel service with migrations, seed data, and routers for dentistries, services, staff/availability, appointments, chat booking, billing, and FAQs. Swagger UI is exposed at `http://localhost:8000/docs` when the API is running.
- **Infrastructure (`infra/`)**: Docker Compose stack, Kubernetes manifests, and Helm chart for API, frontend, and PostgreSQL wiring.
- **Design mocks (`stitch_dentistry_search/*/screen.png`)**: Reference screens for flows such as practitioner selection and patient dashboard (for example, `stitch_dentistry_search/practitioner_selection/screen.png`, `stitch_dentistry_search/patient_dashboard/screen.png`).

## Prerequisites
- Node.js 20+, npm
- Python 3.11+
- Docker / Docker Compose (for containerized runs)
- Optional: kubectl + Helm for Kubernetes workflows

## Environment configuration
Copy the provided environment templates before running any package:

```bash
cp stitch_dentistry_search/web/.env.example stitch_dentistry_search/web/.env
cp stitch_dentistry_search/mobile/.env.example stitch_dentistry_search/mobile/.env
cp stitch_dentistry_search/shared/.env.example stitch_dentistry_search/shared/.env
cp stitch_dentistry_search/api/.env.example stitch_dentistry_search/api/.env
cp infra/.env.example infra/.env
```

Key variables:
- Web: `VITE_API_URL`, `VITE_APP_NAME`
- Mobile: `MOBILE_API_URL`, `MOBILE_ENV`
- Shared: `MODEL_VERSION`, `SCHEMA_VERSION`
- API: `API_HOST`, `API_PORT`, `API_DEBUG`, `API_DATABASE_URL`

## Running locally
### Web (Vite)
```bash
cd stitch_dentistry_search/web
npm install
npm run dev
```

### Mobile (React Native scaffold)
The project is structured for RN bundlers; to exercise the TypeScript/logic locally:
```bash
cd stitch_dentistry_search/mobile
npm install
npm run build   # type-only build
npm test
```

### Shared utilities
```bash
cd stitch_dentistry_search/shared
npm install
npm test
```

### API (FastAPI)
```bash
cd stitch_dentistry_search/api
python -m pip install --upgrade pip
python -m pip install .[dev]
uvicorn stitch_dentistry_api.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI: http://localhost:8000/docs
Health: http://localhost:8000/health

## Quality checks
- **Web**: `npm run lint`, `npm run format`, `npm test`, `npm run build`
- **Mobile**: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
- **Shared**: `npm run lint`, `npm run format`, `npm test`, `npm run build`
- **API**: `ruff check .`, `pytest`, `python -m compileall src`

## Continuous Integration
`.github/workflows/ci.yml` executes the same lint/test/build steps for all packages, then builds/pushes Docker images for the API and frontend, and lint/templates Kubernetes manifests via Helm + kustomize.

## Docker Compose
From the repo root, run the full stack (PostgreSQL, API, frontend):

```bash
docker compose up --build
```

- API: http://localhost:8000 (health at `/health`, docs at `/docs`)
- Frontend: http://localhost:5173

## Kubernetes / Helm
- Validate static manifests:
  ```bash
  kubectl kustomize infra/k8s | kubectl apply --dry-run=client -f -
  ```
- Render or install the Helm chart:
  ```bash
  helm lint infra/helm/dentistry-registry
  helm upgrade --install dentistry ./infra/helm/dentistry-registry \
    --set image.repository=ghcr.io/<owner>/dentistry-api \
    --set frontendImage.repository=ghcr.io/<owner>/dentistry-frontend
  ```

## Additional resources
- API usage, data models, billing, and chat flow details: see [`docs/`](docs/).
- Contribution guidelines: see [`CONTRIBUTING.md`](CONTRIBUTING.md).
