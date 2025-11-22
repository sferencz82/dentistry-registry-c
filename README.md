# Stitch Dentistry Registry

This repository contains scaffolding for the Stitch Dentistry platform across web, mobile, shared libraries, and the FastAPI backend. Each package ships with linting, formatting, testing, and build scripts plus environment templates to ease local setup.

## Project layout
- `stitch_dentistry_search/web` – React + Vite web client.
- `stitch_dentistry_search/mobile` – React Native-style mobile scaffold using TypeScript.
- `stitch_dentistry_search/shared` – Shared TypeScript models and utilities.
- `stitch_dentistry_search/api` – FastAPI backend skeleton with configuration loader and health check.
- `infra/` – Placeholder for infrastructure definitions and shared environment variables.

## Getting started
1. Copy the environment templates for each package and adjust values as needed:
   ```bash
   cp stitch_dentistry_search/web/.env.example stitch_dentistry_search/web/.env
   cp stitch_dentistry_search/mobile/.env.example stitch_dentistry_search/mobile/.env
   cp stitch_dentistry_search/shared/.env.example stitch_dentistry_search/shared/.env
   cp stitch_dentistry_search/api/.env.example stitch_dentistry_search/api/.env
   cp infra/.env.example infra/.env
   ```

2. Install dependencies per package (use `npm install` for Node projects and `python -m pip install .[dev]` for the API).

3. Run quality checks:
   - Web: `npm run lint`, `npm run format`, `npm test`, `npm run build` inside `stitch_dentistry_search/web`.
   - Mobile: `npm run lint`, `npm run format`, `npm test`, `npm run build` inside `stitch_dentistry_search/mobile`.
   - Shared: `npm run lint`, `npm run format`, `npm test`, `npm run build` inside `stitch_dentistry_search/shared`.
   - API: `ruff check .`, `pytest`, and `python -m compileall src` inside `stitch_dentistry_search/api`.

GitHub Actions (`.github/workflows/ci.yml`) mirrors these steps on pushes and pull requests.

## Local deployment with Docker

Build and run the full stack with Docker Compose (requires copying `infra/.env.example` to `infra/.env` to supply database credentials and Vite build overrides):

```bash
docker compose up --build
```

Services are available at:

- API: http://localhost:8000/health
- Frontend: http://localhost:5173

## Cloud deployment (Kubernetes)

Kubernetes manifests live in `infra/k8s` and are also packaged as a Helm chart under `infra/helm/dentistry-registry`.

Validate the static manifests with:

```bash
kubectl kustomize infra/k8s | kubectl apply --dry-run=client -f -
```

Render or install the Helm chart (override the image repositories to match your registry):

```bash
helm lint infra/helm/dentistry-registry
helm upgrade --install dentistry ./infra/helm/dentistry-registry \
  --set image.repository=ghcr.io/<owner>/dentistry-api \
  --set frontendImage.repository=ghcr.io/<owner>/dentistry-frontend
```

The chart provisions ConfigMaps for API/frontend configuration, Secrets for PostgreSQL credentials, Deployments for the API and frontend, and a StatefulSet for PostgreSQL storage.
