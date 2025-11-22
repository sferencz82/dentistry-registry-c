# Project Plan: Dentistry Appointment Booking App

Updated task list aligned to a C#, Ruby, and Node.js stack with security-first practices (authentication/authorization and OWASP Top 10 mitigations) baked into each stage.

1) **Project scaffolding & workspace setup**  
   Establish repo structure, environments, and CI foundations using the chosen stacks.  
   :::task-stub{title="Initialize project scaffold and tooling (C#/Ruby/Node.js)"}
   - Create top-level directories (e.g., `stitch_dentistry_search/api-dotnet`, `stitch_dentistry_search/chat-ruby`, `stitch_dentistry_search/mobile-node`, `infra/`).
   - Scaffold ASP.NET Core API (C#), Ruby service skeleton (for chat/FAQ or billing webhook handler), and Node.js mobile/web app baseline (Expo/React Native or Next.js for web companion).
   - Add lint/format/test tooling: `dotnet format`/`dotnet test`, `rubocop`/`rspec`, `eslint`/`jest` for Node.js. Wire npm/yarn scripts and `Gemfile`/`Rakefile`.
   - Set up CI (GitHub Actions) to run format/lint/tests for all stacks; include SAST/lint checks (e.g., `dotnet build` with analyzers, `brakeman` for Ruby, `npm audit`/`eslint`).
   - Provide `.env.example` and config loaders; ensure secrets are not committed.
   :::

2) **Backend API foundation (C#)**  
   Build the primary REST API in ASP.NET Core with OpenAPI/Swagger.  
   :::task-stub{title="Implement core API with OpenAPI/Swagger (ASP.NET Core)"}
   - Scaffold entities and EF Core migrations for dentistries, services (duration/pricing), staff (roles/availability), patients, bookings, and billing status.
   - Expose endpoints for dentistry CRUD, services CRUD, staff CRUD with roles/availability, appointment availability query, and booking creation.
   - Enable Swagger (`/swagger`) and request/response validation filters. Add global error handling and structured logging.
   - Implement authentication/authorization (e.g., JWT bearer) with RBAC (patient vs. dentistry admin) and input validation to mitigate OWASP Top 10 risks (XSS, injection, broken auth). Add rate limiting and CORS policy.
   - Seed sample data and add unit/integration tests (`xUnit`/`NUnit`).
   :::

3) **Availability & scheduling engine (C#)**  
   Compute nearest available slots per provider/service duration and constraints.  
   :::task-stub{title="Add availability computation and booking rules (C#)"}
   - Implement scheduling utilities that consider provider calendars, service duration, buffer times, timezone handling, and blackout dates.
   - Support "closest available appointment" queries with conflict detection and working hours enforcement.
   - Add tests for overlaps, daylight savings, and multi-role providers; validate authorization on scheduling endpoints.
   :::

4) **Patient booking flow API + notifications (C# + Node.js)**  
   Handle end-to-end booking and confirmations for patient and dentistry.  
   :::task-stub{title="Implement booking + notification pipeline (C# API, Node.js worker)"}
   - Extend booking endpoint to capture patient contact details and preferences; include price estimates and access/map info.
   - Add notification abstraction; implement Node.js worker (e.g., using NestJS/Express) to send email/SMS via providers with signed webhooks.
   - Ensure idempotency, validation, and secure storage of PII; log audit trails and enforce authorization.
   - Add tests for success/failure flows and payload correctness across API and worker.
   :::

5) **AI/chat receptionist with FAQ/knowledge base (Ruby service)**  
   Provide out-of-hours booking via chat using FAQs plus live booking integration.  
   :::task-stub{title="Build receptionist chat service (Ruby)"}
   - Create Ruby service (Sinatra/Rails API) for chat/FAQ, leveraging existing knowledge base per dentistry; integrate with C# booking API via authenticated calls.
   - Implement conversational flow to create bookings and fetch availability; include input sanitization and throttling.
   - Add admin endpoints to manage FAQs/knowledge base; protect with authentication and CSRF controls where applicable.
   - Add tests (`rspec`) for FAQ retrieval and booking via chat; run security scan (`brakeman`).
   :::

6) **Payments integration (C# + Ruby)**  
   Charge dentistries for registration/subscription with provider abstraction.  
   :::task-stub{title="Add billing/subscription module (C# API with Ruby webhook handler)"}
   - Implement billing module in C# with provider-agnostic interface; start with Stripe and support Google Pay/PayPal later.
   - Create secure subscription endpoints and enforce RBAC; store billing status on dentistry profile; gate premium features.
   - Add Ruby webhook handler to verify signatures and update billing status; protect against replay and insecure deserialization.
   - Write mocked tests for payment flows and webhook verification.
   :::

7) **Frontend scaffolding (Node.js mobile/web)**  
   Build cross-platform UI aligned with mocks in `stitch_dentistry_search`.  
   :::task-stub{title="Create shared frontend scaffold (Node.js)"}
   - Use React Native/Expo for mobile (`stitch_dentistry_search/mobile-node`) with TypeScript, navigation, and theming; optionally add web companion with Next.js.
   - Set up API client with secure token storage, error handling, and request signing; centralize state management.
   - Add lint/test scripts (ESLint/Prettier/Jest/React Testing Library) and CI steps; integrate basic accessibility checks.
   :::

8) **Patient booking UX (Node.js frontend)**  
   Implement main flow per mocks.  
   :::task-stub{title="Implement patient booking screens (React Native/Next.js)"}
   - Screens: dentistry search/list, dentistry detail (services, staff, map/access info), service selection, provider selection, nearest-availability calendar, booking confirmation.
   - Connect to C# API and handle authentication, loading/error states, and validation; protect against XSS/CSRF via sanitization and proper token handling.
   - Add unit/UI tests for components and navigation flows.
   :::

9) **Dentistry admin UX (Node.js frontend)**  
   Manage practice configuration and calendars.  
   :::task-stub{title="Build dentistry admin screens (React Native/Next.js)"}
   - Screens: profile (name/address/contact), services (duration/pricing), staff roster (roles/specialties), availability editor/calendar, billing/subscription status.
   - Integrate with secured API endpoints; include form validation, optimistic updates, and access control checks.
   - Add tests for forms, RBAC, and data flows.
   :::

10) **Chat/receptionist UI (Node.js frontend)**  
    Embed chat with FAQ + booking capability.  
    :::task-stub{title="Add chat receptionist UI (React Native/Next.js)"}
    - Chat screen/component wired to Ruby chat service and C# booking API; include quick replies for FAQs and "book for me" flow.
    - Display booking status updates and confirmations within chat; guard against injection and insecure HTML rendering.
    - Add tests for message rendering and action flows.
    :::

11) **Deployment: Docker, Kubernetes, and CI/CD**  
    Containerize services and define deployment manifests.  
    :::task-stub{title="Add deploy artifacts (multi-stack)"}
    - Write Dockerfiles for C# API, Ruby chat/billing webhook, and Node.js frontend; create docker-compose for local dev with secure env injection.
    - Add Kubernetes manifests/Helm chart under `infra/` for API, frontend, and DB (with secrets/configmaps); include network policies and PodSecurity contexts.
    - Update GitHub Actions to build/push images, run security scans (container scanning, `npm audit`, `bundle audit`), and validate manifests.
    - Document local and cloud deployment steps with secrets management guidance.
    :::

12) **Documentation & README**  
    Provide comprehensive setup/run/deploy instructions.  
    :::task-stub{title="Draft README and developer docs"}
    - In repo root, write `README.md` covering architecture, security/auth model (JWT, RBAC), setup, environment, running locally (web/mobile/api/services), tests, lint, CI, Docker/K8s usage, and swagger URL.
    - Add `CONTRIBUTING.md` or `/docs/` for deeper guides (API contracts, data models, billing, chat flow, threat model/OWASP mitigations).
    - Include screenshots or references to mocks in `stitch_dentistry_search` where applicable; highlight secure coding practices and secret handling.
    :::
