# LogiTrans Guatemala
## Manual Tecnico - Plataforma de Gestion Logistica

> **Version:** 2.0  
> **Fecha:** 05 de abril de 2026  
> **Desarrollado por:** Grupo 2 - Analisis y Diseno de Sistemas 2

---

## Tabla de Contenidos

- [1. Introduccion](#1-introduccion)
  - [1.1 Objetivo del documento](#11-objetivo-del-documento)
  - [1.2 Alcance tecnico](#12-alcance-tecnico)
  - [1.3 Audiencia tecnica](#13-audiencia-tecnica)
- [2. Arquitectura de alto nivel](#2-arquitectura-de-alto-nivel)
  - [2.1 Vista logica](#21-vista-logica)
  - [2.2 Vista de despliegue local](#22-vista-de-despliegue-local)
  - [2.3 Vista de despliegue productivo simulado](#23-vista-de-despliegue-productivo-simulado)
- [3. Stack tecnologico](#3-stack-tecnologico)
  - [3.1 Frontend](#31-frontend)
  - [3.2 Backend](#32-backend)
  - [3.3 Base de datos](#33-base-de-datos)
  - [3.4 Infraestructura y herramientas](#34-infraestructura-y-herramientas)
- [4. Estructura del repositorio](#4-estructura-del-repositorio)
- [5. Backend (NestJS)](#5-backend-nestjs)
  - [5.1 Modularidad por dominio](#51-modularidad-por-dominio)
  - [5.2 Capas y patrones](#52-capas-y-patrones)
  - [5.3 Convenciones de API y seguridad](#53-convenciones-de-api-y-seguridad)
- [6. Frontend (Next.js)](#6-frontend-nextjs)
  - [6.1 Organizacion de rutas](#61-organizacion-de-rutas)
  - [6.2 Capa de consumo API](#62-capa-de-consumo-api)
  - [6.3 Estado y refresco en cliente](#63-estado-y-refresco-en-cliente)
- [7. Persistencia y base de datos](#7-persistencia-y-base-de-datos)
  - [7.1 Fuente canonica de esquema](#71-fuente-canonica-de-esquema)
  - [7.2 Entidades troncales](#72-entidades-troncales)
  - [7.3 Reglas de consistencia](#73-reglas-de-consistencia)
  - [7.4 Multi-moneda](#74-multi-moneda)
- [8. Integraciones externas](#8-integraciones-externas)
- [9. Seguridad tecnica](#9-seguridad-tecnica)
- [10. Despliegue y operacion](#10-despliegue-y-operacion)
  - [10.1 Entorno local con Docker Compose](#101-entorno-local-con-docker-compose)
  - [10.2 Entorno productivo simulado](#102-entorno-productivo-simulado)
  - [10.3 Contexto AWS para operacion internet](#103-contexto-aws-para-operacion-internet)
- [11. Observabilidad y monitoreo](#11-observabilidad-y-monitoreo)
- [12. Pruebas y calidad](#12-pruebas-y-calidad)
- [13. Mantenimiento correctivo y evolutivo](#13-mantenimiento-correctivo-y-evolutivo)
- [14. Troubleshooting tecnico](#14-troubleshooting-tecnico)
- [15. Riesgos actuales y trabajo pendiente](#15-riesgos-actuales-y-trabajo-pendiente)
- [16. Referencias tecnicas](#16-referencias-tecnicas)

---

## 1. Introduccion

### 1.1 Objetivo del documento

Este manual tecnico documenta la arquitectura, decisiones tecnicas y lineamientos de mantenimiento de LogiTrans para asegurar continuidad operativa, trazabilidad de cambios y evolucion controlada del sistema.

### 1.2 Alcance tecnico

Incluye:

- Frontend, backend y base de datos.
- Integraciones de correo, almacenamiento y certificacion.
- Despliegue local y despliegue productivo simulado.
- Buenas practicas de mantenimiento, pruebas y observabilidad.

No incluye:

- Manual operativo para usuario final.
- Procedimientos administrativos de negocio fuera de la plataforma.

### 1.3 Audiencia tecnica

- Equipo de desarrollo.
- Soporte tecnico L2/L3.
- DevOps y responsables de despliegue.
- Arquitectura y QA tecnico.

---

## 2. Arquitectura de alto nivel

### 2.1 Vista logica

El sistema se divide en tres capas principales:

- **Presentacion:** cliente web en Next.js.
- **Aplicacion:** API REST modular en NestJS.
- **Persistencia:** PostgreSQL con entidades de dominio logistico-financiero.

Adicionalmente, se usan servicios externos para correo transaccional y almacenamiento de evidencias.

### 2.2 Vista de despliegue local

Composicion del entorno base (`docker-compose.yml`):

- `db`: PostgreSQL 15 (host `5433`).
- `server`: NestJS (host `3006`).
- `client`: Next.js (host `3000`).

### 2.3 Vista de despliegue productivo simulado

Composicion del entorno productivo simulado (`docker-compose.prod.yml`):

- `db-primary` y `db-replica`.
- `api-1` y `api-2` (balanceados).
- `nginx` para TLS, proxy y balanceo.
- `client` para interfaz web.

---

## 3. Stack tecnologico

### 3.1 Frontend

| Tecnologia | Version | Uso |
|---|---|---|
| Next.js | 16.1.6 | Aplicacion web (App Router) |
| React | 19.2.3 | Componentes UI |
| TypeScript | 5.x | Tipado estatico |
| framer-motion | 12.x | Animaciones |
| lucide-react | 0.577.x | Iconografia |

### 3.2 Backend

| Tecnologia | Version | Uso |
|---|---|---|
| NestJS | 11.x | API modular |
| TypeORM | 0.3.28 | ORM y persistencia |
| PostgreSQL driver (`pg`) | 8.20.x | Conexion DB |
| JWT/Passport | 11.x / 0.7.x | Autenticacion y autorizacion |
| Resend SDK | 6.9.x | Correo transaccional |

### 3.3 Base de datos

| Tecnologia | Version | Uso |
|---|---|---|
| PostgreSQL | 15 | Persistencia relacional |

### 3.4 Infraestructura y herramientas

| Herramienta | Uso |
|---|---|
| Docker / Docker Compose | Contenerizacion y orquestacion local |
| Nginx | Proxy, TLS y balanceo |
| Jest | Pruebas backend |
| Playwright | Pruebas E2E |
| k6 | Pruebas de carga |

---

## 4. Estructura del repositorio

Estructura principal:

- `client/`: frontend Next.js.
- `server/`: backend NestJS.
- `db/`: SQL canonico, DBML y scripts DB.
- `docs/`: documentacion funcional y tecnica.
- `nginx/`: configuracion proxy y certificados.
- `scripts/`: automatizaciones de despliegue.
- `e2e/`: pruebas end-to-end.
- `tests/`: carga y utilidades de pruebas.

---

## 5. Backend (NestJS)

### 5.1 Modularidad por dominio

Modulos principales bajo `server/src`:

- `auth`
- `operations`
- `logistics`
- `pilot`
- `finance`
- `certifier`
- `client`
- `bi`
- `notifications`
- `health`

### 5.2 Capas y patrones

Patron por capas:

- `presentation`: controladores, DTOs, guards.
- `application`: casos de uso y servicios.
- `domain`: enums, contratos y reglas.
- `infrastructure`: TypeORM, adaptadores externos.

Principios aplicados:

- Inversion de dependencias.
- Bajo acoplamiento entre dominios.
- Validaciones de entrada con DTOs.

### 5.3 Convenciones de API y seguridad

- API REST versionada por modulo.
- JWT para autenticacion.
- RBAC por rol funcional.
- Errores estandarizados en capa de presentacion.

---

## 6. Frontend (Next.js)

### 6.1 Organizacion de rutas

Rutas por contexto de usuario en `client/app/`:

- `(auth)`
- `(dashboard-cliente)`
- `(dashboard-nav)`
- `(dashboard-sidebar)`

### 6.2 Capa de consumo API

- Servicios HTTP centralizados en `client/lib/api`.
- Tipado de contratos en `client/types`.
- Mapeo de respuesta para estados operativos y financieros.

### 6.3 Estado y refresco en cliente

Para ordenes de cliente:

- Polling controlado para listado.
- Polling controlado para drawer de tracking abierto.
- Re-sincronizacion al cierre del tracking.

---

## 7. Persistencia y base de datos

### 7.1 Fuente canonica de esquema

Archivo canonico:

- `db/logitrans_postgresql.sql`

Modelo complementario:

- `db/logitrans_dbdiagram.dbml`

### 7.2 Entidades troncales

- `clients`
- `contracts`
- `orders`
- `order_route_logs`
- `invoices`
- `payments`
- `exchange_rates`

### 7.3 Reglas de consistencia

Convenciones criticas:

- Flujo de factura canonico: `BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA`.
- Flujo de pago separado: `PENDIENTE -> APROBADO/RECHAZADO`.
- Flujo de orden: `REGISTRADA -> ASIGNADA -> LISTA_PARA_DESPACHO -> EN_TRANSITO -> ENTREGADA`.
- No enviar factura antes de estado `PAGADA`.

### 7.4 Multi-moneda

Campos propagados en entidades clave:

- `currency_code`
- `exchange_rate_from_usd`
- `tax_rate`

Soporte regional:

- Paises: GT, SV, HN.
- Monedas: GTQ, USD, HNL.

---

## 8. Integraciones externas

- **Correo transaccional:** envio de notificaciones operativas y financieras.
- **Certificador FEL:** validacion tributaria y certificacion DTE.
- **Storage de evidencia:** almacenamiento de archivos asociados a entrega.

Politica operativa importante:

- Las notificaciones de salida/entrega son no bloqueantes (fire-and-forget).
- Si falla el correo, la transicion de estado no se revierte.

---

## 9. Seguridad tecnica

Controles implementados:

- JWT para autenticacion.
- RBAC para autorizacion por rol.
- Validaciones de entrada en backend.
- Variables sensibles via `.env`.

Buenas practicas recomendadas:

- Rotacion periodica de secretos.
- TLS obligatorio en internet.
- Hardening de cabeceras en proxy.
- Registro auditado de acciones criticas.

---

## 10. Despliegue y operacion

### 10.1 Entorno local con Docker Compose

Comandos base:

```bash
docker compose down -v --remove-orphans
docker compose up -d --build
docker compose ps
```

Validacion rapida:

```bash
curl -i http://localhost:3006/health
```

### 10.2 Entorno productivo simulado

Opciones:

- Script: `scripts/deploy.sh`
- Manual: `docker compose -f docker-compose.prod.yml up -d --build`

Servicios clave:

- `nginx` como entrada HTTPS.
- `api-1` y `api-2` balanceadas.
- `db-primary` y `db-replica`.

### 10.3 Contexto AWS para operacion internet

Arquitectura objetivo sugerida:

- Balanceador para frontend/API.
- Compute contenerizado para API/client.
- DB administrada con backups.
- Servicio de objetos para evidencias.
- Secret manager para variables sensibles.
- Monitoreo centralizado y alertas.

---

## 11. Observabilidad y monitoreo

Indicadores minimos:

- Salud de API y frontend.
- Latencia de endpoints criticos.
- Errores 4xx/5xx.
- Disponibilidad de DB.
- Fallos de correo y certificacion.

Fuentes de diagnostico:

- Logs de contenedores Docker.
- Logs de backend por modulo.
- Endpoint de salud.

---

## 12. Pruebas y calidad

Cobertura de validacion recomendada por cambio:

1. `cd server && npm run build`
2. `cd server && npm run test -- --runInBand`
3. `cd client && npm run build`
4. Smoke test del flujo impactado.

Tipos de pruebas existentes:

- Unitarias e integracion (backend).
- End-to-end (Playwright).
- Carga (k6).

---

## 13. Mantenimiento correctivo y evolutivo

### Correctivo

1. Reproducir incidente.
2. Revisar logs y modulo afectado.
3. Aplicar fix minimo seguro.
4. Validar build/tests.
5. Verificar regresiones.

### Evolutivo

1. Definir impacto funcional y tecnico.
2. Ajustar contratos API/DTO.
3. Actualizar frontend y backend de forma compatible.
4. Actualizar documentacion tecnica y funcional.

---

## 14. Troubleshooting tecnico

Problemas frecuentes:

- **API no responde en 3006:** revisar `docker compose ps` y logs de `server`.
- **Frontend sin datos:** validar `NEXT_PUBLIC_API_URL`.
- **DB no inicia:** revisar volumenes y healthcheck de PostgreSQL.
- **Correo no llega:** validar credenciales de proveedor y modo mock.
- **Factura no se envia:** confirmar que este en `PAGADA`.

---

## 15. Riesgos actuales y trabajo pendiente

Riesgos vigentes:

- Refresco de estados de cliente basado en polling (sin push realtime).
- Entrega de correos operativos sin cola/reintentos garantizados.

Mejoras recomendadas:

- Migrar estados cliente a SSE/WebSocket.
- Implementar outbox/retry para notificaciones criticas.
- Expandir pruebas de regresion para flujos financieros.

---

## 16. Referencias tecnicas

- `README.md`
- `docs/despliegue.md`
- `docs/DEPLOYMENT.md`
- `docs/architecture.md`
- `docs/adr.md`
- `docs/dda.md`
- `db/logitrans_postgresql.sql`

---

**© 2026 LogiTrans Guatemala - Grupo 2 - AyD2**
