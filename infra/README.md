# Infrastructure scaffold

Infrastructure assets live here. Use the provided environment template to configure credentials for deployment tooling.

## Environment variables

Copy the template to supply database credentials and build-time overrides:

```bash
cp infra/.env.example infra/.env
```

## Local Docker Compose

Build and run the stack locally (PostgreSQL, API, and frontend) from the repository root:

```bash
docker compose up --build
```

* API: http://localhost:8000/health
* Frontend: http://localhost:5173

## Kubernetes manifests

Static manifests live under `infra/k8s` and are bundled with a `kustomization.yaml` for validation:

```bash
kubectl kustomize infra/k8s | kubectl apply --dry-run=client -f -
```

Update the `image` fields in the deployments to match the images published to your registry (for example, `ghcr.io/<owner>/dentistry-api:latest`).

## Helm chart

The `infra/helm/dentistry-registry` chart packages the API, frontend, and PostgreSQL with ConfigMaps and Secrets for configuration. To render or install:

```bash
helm lint infra/helm/dentistry-registry
helm install dentistry ./infra/helm/dentistry-registry \
  --set image.repository=ghcr.io/<owner>/dentistry-api \
  --set frontendImage.repository=ghcr.io/<owner>/dentistry-frontend
```

Override values in `values.yaml` (for example, database credentials or ingress hosts) to match your cluster environment.
