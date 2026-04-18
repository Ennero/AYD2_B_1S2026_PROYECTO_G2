# Copilot Continuation Context (GPT-5.3-Codex medium)

This repository is in MVP closure/refinement. Keep this as the handoff baseline.

## Session Snapshot
- Phase 3 multi-currency implementation is completed across SQL, backend, and frontend.
- Canonical invoice lifecycle is now: BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA.
- Payment lifecycle remains separate from invoice lifecycle: PENDIENTE -> APROBADO/RECHAZADO.
- Happy Path documentation is consolidated with updated visual evidence and validated image references.

## Latest Update (2026-04-05)

### 1) Operational notifications for order status
- Added 2 new transactional email templates in backend notifications:
  - `server/src/notifications/email/application/templates/order-dispatched.template.ts`
  - `server/src/notifications/email/application/templates/order-delivered.template.ts`
- Extended `EmailService` with:
  - `sendOrderDispatched(...)`
  - `sendOrderDelivered(...)`
- Integrated notification dispatch in pilot lifecycle use-cases:
  - `server/src/pilot/application/use-cases/start-trip.use-case.ts`
    - Sends customer email when order changes to `EN_TRANSITO` (left yard / dispatch).
  - `server/src/pilot/application/use-cases/deliver-order.use-case.ts`
    - Sends customer email when order changes to `ENTREGADA`.
- Updated pilot module wiring to import notifications:
  - `server/src/pilot/pilot.module.ts` now imports `NotificationsModule`.

Implementation policy used:
- Email sending is fire-and-forget and non-blocking for operational transitions.
- If email fails, order status transition remains valid; error is logged.

### 2) Client orders status refresh behavior
- Updated client orders page to auto-refresh status progression without relying only on manual refresh:
  - `client/app/(dashboard-cliente)/cliente/ordenes/page.tsx`
- Added controlled polling for orders list.
- Added controlled polling for tracking drawer while it is open.
- Added list re-sync on tracking drawer close.

State model kept unchanged (no enum migration):
- `REGISTRADA -> ASIGNADA -> LISTA_PARA_DESPACHO -> EN_TRANSITO -> ENTREGADA`
- UI keeps showing `LISTA_PARA_DESPACHO` as "Lista p/ despacho".

### 3) New documentation generated
- Added full user manual:
  - `docs/USER_MANUAL.md`
- Added full technical manual:
  - `docs/TECHNICAL_MANUAL.md`

Both include:
- Index, objectives, scope, software/hardware requirements.
- Internet-access operation considerations and AWS-oriented deployment requirements.
- Consolidated role-based procedures and maintenance guidance.

### 4) Root README synchronized
- Updated `README.md`:
  - Corrected invoice lifecycle ordering to `BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA`.
  - Explicitly documented separate payment lifecycle.
  - Added order lifecycle summary.
  - Linked the new user and technical manuals.
  - Updated documentation date.

### 5) Validation executed for this update
- `server`: `npm run build` succeeded.
- `server`: `npm run test -- --runInBand` succeeded (3 suites, 15 tests).
- `client`: `npm run build` succeeded.

### 6) Canonical business conventions preserved
- Invoice lifecycle unchanged and preserved: `BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA`.
- Payment lifecycle still separate: `PENDIENTE -> APROBADO/RECHAZADO`.
- No changes to 40-ton operational constraints.
- No changes to DB enum for order status.

### 7) Remaining risks / pending technical enhancements
- Client status updates currently rely on polling (not push events); consider SSE/WebSocket for large scale.
- New email notifications are non-blocking by design; delivery assurance may require retry queue/outbox pattern if strict guarantees are required.

## What Was Implemented In This Chat

### 1) Database and data model
- Added COUNTRY_CODE and CURRENCY_CODE enums in canonical SQL and DBML.
- Added EXCHANGE_RATES table and baseline seed rates (USD, GTQ, HNL).
- Added regional finance fields in core entities/tables:
  - clients: country_code, currency_code, tax_rate
  - contracts: currency_code, exchange_rate_from_usd, tax_rate
  - orders: currency_code, exchange_rate_from_usd, tax_rate
  - invoices: currency_code, exchange_rate_from_usd, tax_rate
  - payments: currency_code
- Updated NIT validation from exact 13 digits to 8-14 digits.

### 2) SQL trigger/function behavior
- Contract default rate sync now uses exchange_rate_from_usd and recalculates rates from USD base.
- Order assignment tax calculation no longer hardcodes 0.12 and now uses tax_rate.
- Invoice population now copies currency_code, exchange_rate_from_usd, and tax_rate from order context.
- Payment validation now enforces payment currency from invoice currency.
- Trigger sync for contract rates now listens to discount and exchange rate updates.
- Payment approval flow updates invoice status from CERTIFICADA to PAGADA.

### 3) Backend propagation
- Added domain enums/constants:
  - server/src/domain/enums/country-code.enum.ts
  - server/src/domain/enums/currency-code.enum.ts
  - server/src/domain/constants/regional-finance.constants.ts
- Extended TypeORM entities for client/contract/order/invoice/payment with multi-currency fields.
- Operations create-client flow now accepts country/currency and applies regional defaults.
- Operations create-contract flow now resolves exchange rate from exchange_rates and persists currency context.
- Finance, Certifier, and Client services now expose currencyCode/taxRate/exchange metadata in responses where relevant.
- initialize-schema canonical checks now require new currency columns and exchange_rates table.
- Finance sending flow now requires invoice status PAGADA before ENVIADA.

### 4) Frontend updates
- Agent operational client registration now includes country and currency selectors.
- Phone prefix suggestion by country is auto-set (+502, +503, +504) and still editable.
- Contract formalization reflects selected client currency in credit inputs and summary.
- Client dashboard/account statement/contracts/orders/invoices/new-service views now format amounts by currency.
- Finance and FEL views now consume dynamic currency fields and show tax labels from taxRate when available.
- Finance rates UI messaging now reflects USD base tariff context.
- Finance invoice UI now treats PAGADA as the ready-to-send stage.
- Dashboard labels for send-ready invoices are aligned with PAGADA.

## Runtime Validation Already Executed

### Build checks
- server: npm run build succeeded.
- client: npm run build succeeded.

### Test checks
- server: npm run test passed (3 suites, 15 tests).

### Docker checks
- Clean restart executed with docker compose down -v --remove-orphans.
- Full root stack rebuilt and started from docker-compose.yml.
- Services verified up:
  - db (healthy)
  - server (up)
  - client (up)

### Health and smoke checks
- Backend health endpoint responded 200.
- Authenticated API smoke checks passed and returned multi-currency fields:
  - /api/finance/invoices includes currencyCode and taxRate
  - /api/finance/rates includes baseCurrency per rate item
  - /api/operations/clients includes countryCode and currencyCode
- End-to-end operational smoke test passed:
  - created Honduras client defaulted to HNL and tax 0.15
  - created contract inherited HNL, exchangeRateFromUsd 24.7, tax 0.15

## Side Effects During Validation
- Smoke test created test records in DB (new clients/contracts for Honduras flow).
- Welcome/contract emails were triggered for smoke test users.

## Current Priorities
1. Keep invoice state consistency across docs and APIs: BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA.
2. Preserve 40-ton constraints and existing logistics assignment rules.
3. Optionally automate one full API script for invoice lifecycle validation (BORRADOR to ENVIADA).
4. Continue documentation hardening in happypath only if new UI/flow changes are introduced.

## Mandatory Copilot Maintenance Rule
- ALWAYS update this file (.github/copilot-instructions.md) at the end of any task that changes code, SQL, docs, configs, runtime procedures, or validated behavior.
- Do not wait for user request to update this file.
- Minimum required refresh on each update:
  - What changed (high-level and key files).
  - What was validated (build, tests, docker, smoke checks).
  - Canonical business conventions affected (especially status flows).
  - Remaining risks or pending work.
- If a turn is strictly read-only (no changes, no new validation), no update is required.

## Notes For Future Copilot Runs
- Do not edit build artifacts under client/.next.
- Ensure static file serving for /files remains enabled.
- If terminal search tooling is limited, use grep fallback when needed.
- Prefer canonical schema source: db/logitrans_postgresql.sql.
- Keep payment status semantics separate from invoice status semantics in docs and UI copy.

## Suggested Verification Commands
- docker compose down -v --remove-orphans && docker compose up -d --build
- docker compose ps
- docker compose logs --no-color server | tail -n 200
- docker compose logs --no-color client | tail -n 200
- curl -i http://localhost:3006/health
- cd server && npm run build && npm run test -- --runInBand

## Documentation Rewrite Update (2026-04-05)

### 1) Markdown-indexed manuals fully reformatted
- Rewrote user manual with explicit Markdown TOC and section anchors in requested style:
  - `docs/USER_MANUAL.md`
- Rewrote technical manual with explicit Markdown TOC and maintenance-oriented structure (no program walkthrough section):
  - `docs/TECHNICAL_MANUAL.md`

Manual alignment decisions applied:
- Preserved canonical business lifecycles:
  - Invoice: `BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA`
  - Payment: `PENDIENTE -> APROBADO/RECHAZADO`
  - Order: `REGISTRADA -> ASIGNADA -> LISTA_PARA_DESPACHO -> EN_TRANSITO -> ENTREGADA`
- Kept explicit internet operation and AWS-oriented deployment context in both manuals.
- Kept user-manual functional flow and screenshots oriented to `docs/happypath.md` evidence.

### 2) Root README synchronized to requested structure style
- Rewrote root README using Markdown-indexed format inspired by requested template but adapted to real project stack/ports/files:
  - `README.md`
- Updated sections for:
  - project overview
  - canonical lifecycle states
  - stack versions from current `client/package.json` and `server/package.json`
  - quick start / detailed setup with `docker compose`
  - documentation links and project structure

### 3) Validation executed for this update
- Documentation consistency review completed for:
  - `README.md`
  - `docs/USER_MANUAL.md`
  - `docs/TECHNICAL_MANUAL.md`
- No build/test/runtime commands were required because this update is documentation-only.

### 4) Remaining risks / pending enhancements
- The user may request even more exhaustive screenshot-by-screenshot expansion in `docs/USER_MANUAL.md` similar to legacy long-form manuals.
- If required, next step is extending section 10 flow with deeper per-screen substeps while preserving current canonical states.

## User Manual Flow Expansion Update (2026-04-05)

### 1) Full Happy Path integrated into user manual flow section
- Expanded section `10. Flujo de funcionalidades del programa` in:
  - `docs/USER_MANUAL.md`
- Replaced summarized flow subsection content with the full flow from `docs/happypath.md`, including:
  - complete step-by-step sequence
  - role-by-role progression
  - all embedded evidentiary images used in happy path
  - multivisa context and validations documented in the same flow body

### 2) Structural consistency adjustments
- Updated user manual table of contents so section 10 points to the integrated full-flow subsection.
- Preserved sections 11 and 12 outside the integrated flow block.

### 3) Validation executed for this update
- Documentation consistency review completed for:
  - `docs/USER_MANUAL.md`
- No build/test/runtime commands were required because this update is documentation-only.

### 4) Remaining risks / pending enhancements
- The integrated flow is intentionally verbose; future updates to `docs/happypath.md` should be mirrored in `docs/USER_MANUAL.md` section 10 to prevent divergence.

## Documentation and Testing Report Alignment Update (2026-04-17)

### 1) New testing report manual created
- Created full testing report at:
  - `docs/testing-report.md`
- Included:
  - scope and strategy for unit, integration, E2E, load, and stress tests
  - exact execution commands from repository scripts/workflows
  - explicit CI section confirming only unit + integration run automatically
  - result templates intentionally left blank for future completion (date, executor, environment, pass/fail, metrics, evidence, observations, scoring)

### 2) Architecture narrative synchronized to current implementation
- Updated `docs/architecture.md` to explain architecture style at the beginning as:
  - hybrid model: synchronous REST + shared PostgreSQL as primary coordination
  - asynchronous RabbitMQ events as secondary non-blocking side-effects
- Avoided framing the platform as pure EDA.

### 3) Cross-document consistency updates
- Updated `docs/TECHNICAL_MANUAL.md`:
  - added hybrid architecture clarification in architecture section
  - reinforced RabbitMQ as auxiliary async layer in message broker section
  - aligned testing section with real CI behavior (automatic: unit/integration; manual: E2E/k6)
  - linked detailed report `docs/testing-report.md`
- Updated `docs/USER_MANUAL.md`:
  - corrected FAQ statement about notification failure semantics to avoid overclaiming queue guarantees
  - added demo video references in section 10
- Updated `README.md`:
  - added hybrid architecture summary section
  - added demo video section
  - added `docs/testing-report.md` in documentation table
  - refreshed documentation date
- Updated `docs/happypath_cicd.md` with updated demo video references.
- Updated `docs/happypath_nft.md` to correct CI claim: k6 is manual in current repo workflows.

### 4) Video references inserted where requested
- Added both links to the agreed documentation points:
  - `https://drive.google.com/file/d/1ufW0e0h3kbWgO5YF3zCcfsc26B3nqXem/view?usp=sharing`
  - `https://youtu.be/Wi7t-aH-_w0?si=5yoLN27F77zqG9eu`
- Files updated with video references:
  - `docs/testing-report.md`
  - `docs/architecture.md`
  - `docs/TECHNICAL_MANUAL.md`
  - `docs/USER_MANUAL.md`
  - `README.md`
  - `docs/happypath_cicd.md`

### 5) Validation executed for this update
- Documentation consistency review completed for:
  - `docs/testing-report.md`
  - `docs/architecture.md`
  - `docs/TECHNICAL_MANUAL.md`
  - `docs/USER_MANUAL.md`
  - `README.md`
  - `docs/happypath_cicd.md`
  - `docs/happypath_nft.md`
- Workflow/source alignment verified against:
  - `.github/workflows/github-actions-colibri.yml`
  - `server/package.json`
  - `e2e/package.json`
  - `tests/k6/load/LOAD_TESTING.md`
  - `tests/k6/stress/STRESS_TESTING.md`
- No build/test/runtime execution required (documentation-only update).

### 6) Canonical conventions preserved
- Invoice lifecycle preserved: `BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA`.
- Payment lifecycle preserved and separate: `PENDIENTE -> APROBADO/RECHAZADO`.
- Order lifecycle preserved: `REGISTRADA -> ASIGNADA -> LISTA_PARA_DESPACHO -> EN_TRANSITO -> ENTREGADA`.

### 7) Remaining risks / pending enhancements
- Testing report templates are intentionally empty and require team execution evidence to be completed.
- If k6 is later integrated into CI, docs must be updated again to avoid drift with current workflow reality.
- If strict notification delivery guarantees are needed, consider outbox/retry strategy and update docs accordingly.

## UI Fix Update (2026-04-17)

### 1) What changed
- Fixed operational contract formalization client combobox so it actually queries and displays client options while typing in:
  - `client/app/(dashboard-nav)/agente-operativo/formalizar-contrato/page.tsx`
- Added a dedicated `useEffect` for client search with:
  - debounce (`250ms`)
  - request to `GET /api/operations/clients?search=...`
  - safe reset behavior when query is empty or a client is already selected
  - silent failure handling for transient lookup errors

### 2) Validation executed
- TypeScript/problems check for modified file: no errors.
- Client lint run for target page succeeded (only pre-existing warning: unused `ratesRes` in the same page).
- Client production build succeeded after ensuring workspace dependencies are installed.

### 3) Canonical business conventions affected
- No business lifecycle changes.
- Preserved canonical invoice lifecycle: `BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA`.
- Preserved separate payment lifecycle: `PENDIENTE -> APROBADO/RECHAZADO`.

### 4) Remaining risks / pending work
- Current combobox UX requires typing at least one character to trigger lookup; if a full initial dropdown is desired, add preload behavior on focus.
- `ratesRes` remains unused in `formalizar-contrato` and can be removed in a cleanup pass to keep lint output clean.
