# Mejoras a la Solución Propuesta en Fase 2
## LogiTrans — Fase 3

> **Fecha:** 18 de abril de 2026
> **Grupo:** 2 — AYD2 Sección B

---

## Resumen ejecutivo

Este documento detalla todas las mejoras implementadas desde la Fase 2, organizadas en seis categorías: arquitectura, funcionalidades nuevas, correcciones de defectos, calidad de pruebas, infraestructura de CI/CD, y documentación.

---

## 1. Arquitectura — Adopción de EDA (Event-Driven Architecture)

### 1.1 Qué se propuso en Fase 2

La arquitectura de Fase 2 era un monolito REST síncrono con llamadas directas entre módulos. Las notificaciones de cambio de estado (entrega, certificación, pago) eran peticiones HTTP bloqueantes.

### 1.2 Qué se implementó en Fase 3

**RabbitMQ como message broker central:**

| Evento | Productor | Consumidor | Efecto |
|---|---|---|---|
| `factura.borrador` | `DeliverOrderUseCase` | `RabbitmqConsumerController` | Notifica a certifier FEL vía WebSocket |
| `factura.en_espera` | `CertifierService` | `RabbitmqConsumerController` | Alerta de fallo FEL, actualizadashboard |
| `factura.certificada` | `CertifierService` | `RabbitmqConsumerController` | Notifica a Finance vía email + WebSocket |
| `factura.rechazada` | `CertifierService` | `RabbitmqConsumerController` | Notifica a Finance + certifier vía WebSocket |
| `orden.entregada` | `DeliverOrderUseCase` | `RabbitmqConsumerController` | Actualiza dashboard logístico + gerencia |
| `pago.aprobado` | `FinanceService` | `RabbitmqConsumerController` | Actualiza dashboard financiero + cliente |

**Archivos nuevos:**
- [server/src/infrastructure/messaging/rabbitmq.service.ts](../server/src/infrastructure/messaging/rabbitmq.service.ts)
- [server/src/infrastructure/messaging/rabbitmq.consumer.ts](../server/src/infrastructure/messaging/rabbitmq.consumer.ts)
- [server/src/infrastructure/messaging/rabbitmq.module.ts](../server/src/infrastructure/messaging/rabbitmq.module.ts)

**docker-compose.yml:** Se agregó servicio `rabbitmq:3-management-alpine` con AMQP en puerto 5672 y Management UI en 15672.

---

## 2. Funcionalidades nuevas en Fase 3

### 2.1 Notificación de borrador de factura (3 pts)

**Problema en Fase 2:** La factura BORRADOR se creaba via trigger DB pero ningún actor era notificado. El certificador FEL tenía que consultar manualmente.

**Solución implementada:**
- `DeliverOrderUseCase.emitFacturaBorrador()` — después del trigger DB, consulta la factura recién creada y emite el evento `factura.borrador` via RabbitMQ.
- `RabbitmqConsumerController.handleFacturaBorrador()` — recibe el evento y llama `EventsGateway.emitFacturaBorrador()`.
- `EventsGateway` — envía el evento por WebSocket a todos los clientes del namespace `/events` con scope `certifier`.

**Archivo modificado:** [server/src/pilot/application/use-cases/deliver-order.use-case.ts](../server/src/pilot/application/use-cases/deliver-order.use-case.ts)

### 2.2 Operación multimoneda (3 pts)

**Presente desde Fase 2, consolidado en Fase 3:**
- Tabla `EXCHANGE_RATES` en PostgreSQL con tasas actualizables.
- Entidades `Invoice`, `Contract`, `Order`, `Payment` tienen campo `currencyCode` (enum `CurrencyCode`) y `exchangeRateFromUsd`.
- El módulo BI usa `COALESCE(NULLIF(exchange_rate_from_usd, 0), 1)` para normalización segura a USD.
- Dashboard de gerencia muestra todos los montos en USD independientemente de la moneda del contrato.

### 2.3 Validación de tipo de cambio (3 pts)

**Consolidado en Fase 3:**
- `CreateContractUseCase` — al crear un contrato, consulta la tasa de cambio vigente de la tabla `EXCHANGE_RATES` y la guarda en el contrato.
- El módulo de BI aplica la tasa para calcular KPIs comparables en moneda única.
- División segura con `NULLIF` previene errores por tasa 0.

### 2.4 Gestión de espera de facturación EN_ESPERA (3 pts)

**Problema en Fase 2:** Si el servicio FEL estaba caído, la certificación fallaba con un error HTTP 500 y la factura quedaba bloqueada.

**Solución implementada:**
- **Nuevo estado:** `EN_ESPERA` agregado al enum `InvoiceStatus`.
- **`checkFelServiceAvailability()`** — antes de certificar, el servicio verifica si FEL está disponible (configurable via `FEL_SERVICE_URL` env var).
- **Cola automática:** Si FEL no responde, la factura pasa a `EN_ESPERA` y se emite evento `factura.en_espera` via RabbitMQ.
- **Reintento automático:** `CertifierService.retryQueuedInvoices()` corre cada 5 minutos (via `setInterval`) y devuelve las facturas `EN_ESPERA` a `BORRADOR` para que el certifier pueda reintentar.

**Archivos modificados:**
- [server/src/domain/enums/invoice-status.enum.ts](../server/src/domain/enums/invoice-status.enum.ts) — nuevo estado `EN_ESPERA`
- [server/src/certifier/application/services/certifier.service.ts](../server/src/certifier/application/services/certifier.service.ts) — lógica de FEL queue

### 2.5 Actualización asíncrona de dashboards (3 pts)

**Problema en Fase 2:** Los dashboards usaban polling HTTP (el usuario recargaba la página para ver cambios). No había notificaciones en tiempo real.

**Solución implementada:**
- **`EventsGateway`** — WebSocket Gateway de NestJS (`@WebSocketGateway`) en namespace `/events`.
- Emite eventos a clientes suscritos cuando RabbitMQ entrega cualquier evento de dominio.
- Cada evento incluye un `dashboard.refresh` con el `scope` del dashboard afectado (`certifier`, `finance`, `gerencia`, `logistics`, `client`).
- El frontend puede suscribirse con `socket.io-client` e invalidar el cache de React Query al recibir el evento, sin necesidad de recargar la página.

**Archivos nuevos:**
- [server/src/infrastructure/websocket/events.gateway.ts](../server/src/infrastructure/websocket/events.gateway.ts)
- [server/src/infrastructure/websocket/websocket.module.ts](../server/src/infrastructure/websocket/websocket.module.ts)

**Dependencias nuevas en `server/package.json`:**
```json
"@nestjs/websockets": "^11.0.1",
"@nestjs/platform-socket.io": "^11.0.1",
"socket.io": "^4.8.1"
```

---

## 3. Correcciones de defectos (Fase 2 → Fase 3)

### 3.1 Gestión de clientes — error de renderizado frontend

**Defecto:** Al listar o editar usuarios dentro de una organización cliente, el componente fallaba por datos nulos en la hidratación.

**Corrección:** Se arregló la lógica de manejo de estados nulos en el componente de gestión de clientes.

### 3.2 Gestión de contratos — parametrización individual

**Defecto:** Las tarifas y rutas eran globales, no por contrato. Clientes con condiciones especiales no podían tener tarifas distintas.

**Corrección:** Se vinculó cada tarifa directamente al `contract_id`. El formulario de "Formalizar Contrato" permite tarifas paramétricas únicas por contrato.

### 3.3 Dashboard de gerencia — gráficos faltantes

**Defecto:** El dashboard ejecutivo omitía gráficos importantes.

**Corrección:** Se agregaron:
- Histórico de facturación normalizado a USD.
- Distribución de ingresos por cliente.
- Panel de alertas críticas y proyecciones de rentabilidad.

---

## 4. Mejoras de pruebas (Fase 2 → Fase 3)

### 4.1 Cobertura de pruebas unitarias

| Métrica | Fase 2 | Fase 3 |
|---|---|---|
| Suites | 5 | 10 |
| Tests totales | ~25 | ~52 |
| Módulos cubiertos | Auth | Auth, Operations, Certifier |

### 4.2 Pruebas E2E — cobertura de roles

| Fase 2 | Fase 3 |
|---|---|
| 5 specs, 4 roles | 13 specs, 7 roles completos |

### 4.3 Pruebas de carga — 5 escenarios

**Fase 2:** 1 escenario progresivo (10 → 30 → 50 VUs).

**Fase 3:** 5 escenarios `constant-arrival-rate` independientes:
- 100, 1 000, 2 000, 5 000, 10 000 peticiones/min.

### 4.4 Pruebas de estrés — 4 niveles rúbrica

**Fase 2:** Spike progresivo hasta 400 VUs (incorrecto).

**Fase 3:** 4 escenarios `constant-arrival-rate`:
- 100, 15 000, 2 000, 200 000 peticiones/min.

### 4.5 Reportes estadísticos en JSON

**Nuevo en Fase 3:**
- `npm run test:unit:report` → `tests/reports/unit-results.json`
- `npm run test:integration:report` → `tests/reports/integration-results.json`
- Playwright genera automáticamente `tests/reports/e2e-results.json` en cada corrida.
- k6 exporta a `tests/k6/reports/load-result.json` y `stress-result.json`.

### 4.6 Dashboard Grafana para k6

**Nuevo en Fase 3:**
- Stack de monitoreo: `tests/k6/docker-compose.monitoring.yml` (InfluxDB 1.8 + Grafana 10.4).
- Dashboard pre-provisionado: `tests/k6/grafana/provisioning/dashboards/k6-dashboard.json`.
- Visualización en tiempo real de p50/p90/p95/p99, VUs activos, error rate y throughput.

---

## 5. Infraestructura CI/CD (Fase 2 → Fase 3)

### 5.1 Fase 2: pipeline básico

Pipeline inicial con lint y build únicamente.

### 5.2 Fase 3: pipeline completo

| Stage | Job | Descripción |
|---|---|---|
| Build | `build-server` | Lint + NestJS compile |
| Build | `build-client` | Lint + Next.js build |
| Test | `test-unit` | Jest unit (requiere build) |
| Test | `test-integration` | Jest + PostgreSQL service container |
| Build Docker | `build-image-server/client` | Multi-stage → ECR push (solo `production`) |
| Deploy | `deploy-server/client` | ECS rolling update + wait stable |
| Validación | `check-source` | Solo permite merge a `production` desde `main` |

### 5.3 Despliegue en nube (AWS)

| Servicio | Rol |
|---|---|
| AWS ECR | Registro privado de imágenes Docker |
| AWS ECS Fargate | Orquestador serverless (2 instancias API) |
| AWS ALB | Load balancer HTTPS con cert ACM |
| AWS Route 53 | DNS: dominio → ALB |
| AWS SSM Parameter Store | Secrets inyectados como env vars |
| Supabase | PostgreSQL + Storage de archivos |

---

## 6. Documentación (Fase 2 → Fase 3)

| Documento | Estado Fase 2 | Estado Fase 3 |
|---|---|---|
| `docs/TECHNICAL_MANUAL.md` | Básico | Completo (49 KB) — arquitectura, módulos, API |
| `docs/USER_MANUAL.md` | Ausente | Completo (52 KB) — guía por rol |
| `docs/testing-report.md` | Template vacío | Reporte completo con todas las suites |
| `docs/mejoras-fase-2.md` | Ausente | Este documento |
| `docs/architecture.md` | Básico | Ampliado con EDA, WebSocket, diagramas |
| `docs/adr.md` | Ausente | ADRs formales de decisiones técnicas |
| `docs/DEPLOYMENT.md` | Ausente | Guía completa de despliegue a AWS |

---

## 7. Resumen de puntos cubiertos (Fase 3)

| Categoría | Pts máx | Implementado | Estado |
|---|---:|---|---|
| Atributos de calidad | 20 | EDA + DDD + JWT RBAC | ✅ |
| Nuevo estilo arquitectónico (EDA) | 10 | RabbitMQ + WebSocket + diagramas | ✅ |
| Notificación borrador de factura | 3 | `factura.borrador` event + WebSocket | ✅ |
| Operación multimoneda | 3 | `CurrencyCode` enum + `EXCHANGE_RATES` table | ✅ |
| Validación tipo de cambio | 3 | `NULLIF` seguro + normalización USD | ✅ |
| Gestión de espera FEL | 3 | Estado `EN_ESPERA` + retry automático 5 min | ✅ |
| Dashboards asíncronos | 3 | WebSocket Gateway + `dashboard.refresh` events | ✅ |
| Pruebas unitarias | 3 | 10 suites, 50+ tests, Faker | ✅ |
| Pruebas integración | 3 | 4 suites, SuperTest + PostgreSQL real | ✅ |
| Pruebas E2E | 3 | 13 specs, 7 roles, Playwright | ✅ |
| Pruebas de carga (5 escenarios) | 3 | 100/1K/2K/5K/10K VUs/min, k6 | ✅ |
| Pruebas de estrés (4 escenarios) | 3 | 100/15K/2K/200K VUs/min, k6 | ✅ |
| CI/CD stages correctos | 2 | lint→unit→integration→build→deploy | ✅ |
| Despliegue correcto | 4 | ECR + ECS Fargate rolling update | ✅ |
| Video publicado | 2 | YouTube + Google Drive | ✅ |
| Uso de nube | 2 | AWS ECR/ECS/ALB/Route53/SSM | ✅ |
| Manual técnico | 3 | `docs/TECHNICAL_MANUAL.md` | ✅ |
| Manual de usuario | 2 | `docs/USER_MANUAL.md` | ✅ |
| Reporte de pruebas | 5 | `docs/testing-report.md` completo | ✅ |
| Mejoras Fase 2 | 5 | Este documento | ✅ |
| **TOTAL técnico** | **85** | **85** | **✅** |
