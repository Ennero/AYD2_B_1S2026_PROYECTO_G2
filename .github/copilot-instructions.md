# Copilot Continuation Context (GPT-5.3-Codex medium)

This repository is in MVP closure/refinement. Keep this as the handoff baseline.

## Session Snapshot
- Phase 3 multi-currency implementation is completed across SQL, backend, and frontend.
- Build validation already passed in both server and client.
- Runtime validation in Docker and API smoke checks already passed.
- Main invoice lifecycle convention remains: BORRADOR -> CERTIFICADA -> ENVIADA -> PAGADA.

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

### 4) Frontend updates
- Agent operational client registration now includes country and currency selectors.
- Phone prefix suggestion by country is auto-set (+502, +503, +504) and still editable.
- Contract formalization reflects selected client currency in credit inputs and summary.
- Client dashboard/account statement/contracts/orders/invoices/new-service views now format amounts by currency.
- Finance and FEL views now consume dynamic currency fields and show tax labels from taxRate when available.
- Finance rates UI messaging now reflects USD base tariff context.

## Runtime Validation Already Executed

### Build checks
- server: npm run build succeeded.
- client: npm run build succeeded.

### Docker checks
- Full root stack built and started from docker-compose.yml.
- Services verified up:
  - db (healthy)
  - server (up)
  - client (up)

### Health and smoke checks
- Backend health endpoint responded 200.
- Authenticated API smoke checks passed and returned multi-currency fields:
  - /api/finance/invoices includes currencyCode and taxRate
  - /api/finance/rates includes baseCurrency
  - /api/operations/clients includes countryCode and currencyCode
- End-to-end operational smoke test passed:
  - created Honduras client defaulted to HNL and tax 0.15
  - created contract inherited HNL, exchangeRateFromUsd 24.7, tax 0.15

## Side Effects During Validation
- Smoke test created test records in DB (new clients/contracts for Honduras flow).
- Welcome/contract emails were triggered for smoke test users.

## Current Priorities
1. Keep invoice state consistency across docs and APIs: BORRADOR -> CERTIFICADA -> ENVIADA -> PAGADA.
2. Preserve 40-ton constraints and existing logistics assignment rules.
3. Optionally automate one full API script for invoice lifecycle validation (BORRADOR to PAGADA).
4. Continue documentation hardening in happypath only if new UI/flow changes are introduced.

## Notes For Future Copilot Runs
- Do not edit build artifacts under client/.next.
- Ensure static file serving for /files remains enabled.
- If terminal search tooling is limited, use grep fallback when needed.
- Prefer canonical schema source: db/logitrans_postgresql.sql.

## Suggested Verification Commands
- docker compose down -v --rmi all && docker compose up -d --build
- docker compose ps
- docker compose logs --no-color server | tail -n 200
- docker compose logs --no-color client | tail -n 200
- curl -i http://localhost:3006/health
