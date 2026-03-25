# Copilot Continuation Context (GPT-5.3-Codex medium)

This repository is in active MVP refinement. Use this context when continuing work.

## Current Priority
1. Enforce max declared weight = 40 tons in frontend and backend.
2. Fix Create Order button text contrast.
3. Expand seed transport units to include multiple high-capacity units (40 tons support cases).
4. Ensure emails use "contrasena" wording only in visible text (avoid "contrasena temporal" phrasing).
5. Fix Spanish accent/tilde issues in user-facing strings first.
6. Continue docs/happypath.md with missing real screenshots and remove placeholder CAPTURA points.

## Verified State
- Docker rebuild succeeded previously with:
  - docker-compose down -v --rmi all && docker-compose up -d --build
- docs/happypath.md is advanced through section 13, but has remaining capture placeholders from section 5 onward.

## Key Files To Touch
- Frontend create order flow:
  - client/app/(dashboard-cliente)/cliente/nuevo-servicio/page.tsx
- Backend order DTO validation:
  - server/src/client/presentation/dto/client.dto.ts
- Seed data:
  - server/src/infrastructure/database/seeds/database-seeder.ts
- Email templates/service:
  - server/src/notifications/email/application/templates/welcome.template.ts
  - server/src/notifications/email/application/email.service.ts
- Main happy path manual:
  - docs/happypath.md

## Notes About Existing Implementation
- Create order frontend currently validates only > 0 for declaredWeightTon; add hard cap at 40.
- Backend CreateOrderDto has declaredWeightTon but no explicit Min/Max validation rule for 40 cap.
- Seed transport unit capacities currently peak around ~25.5 tons in TRANSPORT_UNIT_BLUEPRINTS; add high-capacity units for edge cases.
- Do not edit build artifacts under client/.next.

## Acceptance Criteria For Next Changes
- Order with 40.00 ton is accepted.
- Order > 40 ton is rejected in frontend and backend.
- "Crear Orden" button text is clearly readable in normal and hover states.
- Seed includes enough high-capacity units to prevent assignment bottlenecks in demo flows.
- No user-facing email text says "contrasena temporal".
- docs/happypath.md reflects updated real flow evidence where placeholders existed.

## Suggested Verification Commands
- docker-compose down -v --rmi all && docker-compose up -d --build
- docker-compose logs -f server
- docker-compose logs -f client
