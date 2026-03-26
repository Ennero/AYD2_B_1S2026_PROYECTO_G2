# Copilot Continuation Context (GPT-5.3-Codex medium)

This repository is in MVP closure/refinement. Keep this as the handoff baseline.

## Current Priority
1. Complete remaining real screenshots in docs/happypath.md (mainly Finance/FEL/Payments/Gerencia sections).
2. Validate runtime behavior end-to-end after recent invoice flow and media-tracking changes.
3. Keep consistency of invoice states across docs and APIs: BORRADOR -> CERTIFICADA -> ENVIADA -> PAGADA.
4. Preserve 40-ton rules and existing logistics assignment constraints.

## Verified State
- Full Docker rebuild/start succeeded:
  - docker-compose down -v --rmi all && docker-compose up -d --build
- Backend now starts clean after Finance DI fix (FinanceModule imports NotificationsModule).
- Implemented invoice behavior:
  - Draft invoice should remain BORRADOR without automatic service_description fill.
  - Client invoice email is sent from Finance send step (status ENVIADA).
  - FEL certifier now notifies AGENTE_FINANCIERO on certify/reject.
- Implemented route log optional image:
  - image_path added to order_route_logs.
  - Pilot can upload optional image per log.
  - Pilot and Client can view log images with "Ver Imagen" modal.
  - Delivery signature/evidence can be visualized in tracking/monitoring views.
- Seed image placeholders updated to picsum URLs in media-related fields touched.

## Key Files Recently Touched
- Finance flow:
  - server/src/finance/application/services/finance.service.ts
  - server/src/finance/finance.module.ts
- FEL flow:
  - server/src/certifier/application/services/certifier.service.ts
- Email notifications:
  - server/src/notifications/email/application/email.service.ts
- DB/bootstrap:
  - db/logitrans_postgresql.sql
  - server/src/infrastructure/database/bootstrap/initialize-schema.ts
  - server/src/infrastructure/database/typeorm/entities/order-route-log.entity.ts
- Pilot log image backend:
  - server/src/pilot/presentation/dtos/add-log.dto.ts
  - server/src/pilot/presentation/controller/pilot.controller.ts
  - server/src/pilot/application/use-cases/add-log.use-case.ts
  - server/src/pilot/application/use-cases/get-order.use-case.ts
  - server/src/main.ts
- Client tracking data exposure:
  - server/src/client/application/services/client.service.ts
- Frontend pilot/client tracking UI:
  - client/components/piloto/RegistrarEventoModal.tsx
  - client/components/piloto/BitacoraTimeline.tsx
  - client/app/(dashboard-nav)/piloto/monitoreo/[id]/page.tsx
  - client/app/(dashboard-cliente)/cliente/ordenes/page.tsx
  - client/types/pilot.ts
- Seed/docs:
  - server/src/infrastructure/database/seeds/database-seeder.ts
  - docs/happypath.md
  - docs/mvp_accessos_usuarios.md

## Notes About Existing Implementation
- Do not edit build artifacts under client/.next.
- In this workspace, rg may be unavailable in shell; use grep fallback when needed.
- Ensure static file serving remains enabled for /files paths.

## Acceptance Criteria For Next Changes
- New delivered-order draft appears in Finance BORRADOR tray and not prematurely in FEL tray.
- FEL certify/reject sends internal mail to finance users.
- Finance send marks ENVIADA and sends mail to client.
- Optional log image upload and visualization works for pilot and client.
- Signature and delivery evidence remain mandatory at delivery and visible later.
- docs/happypath.md reflects real captures in pending sections.

## Suggested Verification Commands
- docker-compose down -v --rmi all && docker-compose up -d --build
- docker-compose ps
- docker-compose logs --no-color server | tail -n 200
- docker-compose logs --no-color client | tail -n 200
