# Stitch Dentistry Developer Guides

Use these notes when extending the API or coordinating web/mobile flows.

## API contracts
- **Dentistries (`/dentistries`)**: CRUD endpoints manage practice metadata and billing status. New records attach services and staff to a dentistry ID.
- **Services (`/services`)**: CRUD operations scoped to a dentistry; duration and price drive appointment validation.
- **Staff & availability (`/staff`, `/appointments/availability`, `/appointments/closest`)**: Staff records include roles and contact details. Availability slots are filtered by dentistry, staff, optional date, and are validated to belong to the requested service/staff before booking.
- **Appointments (`/appointments`)**: Bookings enforce dentistry/service/staff alignment, mark slots as booked, and return confirmation payloads with patient- and dentistry-facing messages plus map links and access notes.
- **Knowledge base (`/knowledge_base`)**: CRUD routes for FAQs attached to a dentistry; used by chat to answer non-booking prompts.
- **Chat (`/chat/message`)**: Conversational endpoint maintains per-conversation booking state, switches between FAQ answers and guided booking collection, and requires valid service/staff/slot selections.
- **Billing (`/billing`)**: Subscription management per dentistry: subscribe, cancel, check status, and process provider webhooks.

Swagger/OpenAPI for all routes is available at `http://localhost:8000/docs` when the API runs locally.

## Data model notes
- **Dentistry**: Owns services and staff; tracks billing status/provider IDs used by billing hooks.
- **Service**: Belongs to a dentistry with duration and price used in booking confirmation content.
- **Staff**: Includes role/email/phone; owns availability slots.
- **AvailabilitySlot**: Dentistry- and staff-scoped start/end times with `is_booked` flags.
- **Patient & Booking**: Patient contact info is normalized before booking; bookings store slot/service/staff references, timestamps, and build confirmation messages.
- **KnowledgeBaseEntry**: Dentistry-scoped FAQs used by the chat router for simple semantic matching.

## Billing flow
1. **Subscribe**: `POST /billing/{dentistry_id}/subscribe` delegates to the configured provider, updates the dentistry record with subscription/customer IDs, and optionally returns a management URL.
2. **Cancel**: `POST /billing/{dentistry_id}/cancel` calls the provider and updates the stored billing status; errors if no active subscription exists.
3. **Status**: `GET /billing/{dentistry_id}/status` returns the persisted billing status and subscription ID.
4. **Webhook**: `POST /billing/webhook` parses provider events, matches them to a dentistry by subscription ID, and updates billing status; unknown subscriptions return 404.

## Chat flow
1. New conversations start idle; messages containing "book" trigger booking mode and request a service ID.
2. The assistant sequentially asks for staff ID, availability slot ID, and contact details, validating each selection belongs to the dentistry.
3. After collecting contact info, the assistant calls the appointment booking pipeline to reserve the slot and returns the full booking confirmation object; otherwise, FAQ answers are served from the knowledge base.
