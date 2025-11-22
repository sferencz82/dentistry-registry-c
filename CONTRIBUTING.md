# Contributing to Stitch Dentistry Registry

Thank you for improving the platform! These guidelines keep changes consistent across web, mobile, shared, and API packages.

## Workflow
- Create feature branches from `main` and keep pull requests focused.
- Ensure relevant `.env` files are copied from their `.env.example` templates before running or testing any package.
- Prefer small, self-contained commits with clear messages.

## Coding standards
- **Web/Mobile/Shared**: Run `npm run lint` and `npm run format` before pushing. Add or update Jest tests when touching React components or shared utilities.
- **API**: Run `ruff check .`, `pytest`, and `python -m compileall src`. Keep new dependencies listed in `pyproject.toml` and prefer FastAPI dependency injection for configuration.
- **Documentation**: Update `README.md` and `docs/` when API contracts, data models, or user flows change. Include links to any new mocks under `stitch_dentistry_search/*/screen.png`.

## Testing expectations
- CI mirrors local scripts (`npm run build` for Node packages; `ruff`/`pytest`/`compileall` for the API). Match those before opening a PR to avoid surprises.
- For changes touching chat, billing, or booking flows, include unit tests that cover both happy paths and validation errors.

## Communication
- Describe how your change affects web, mobile, and API boundaries in your PR description (e.g., new fields in booking payloads or billing status transitions).
- Link to relevant screenshots/mocks when UI or flow adjustments are involved.
