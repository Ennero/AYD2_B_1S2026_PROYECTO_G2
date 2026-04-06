# LogiTrans Guatemala
## Manual Técnico — Plataforma de Gestión Logística

> **Versión:** 3.0
> **Fecha:** 05 de abril de 2026
> **Desarrollado por:** Grupo 2 — Análisis y Diseño de Sistemas 2
> **Estado:** Producción

---

## Tabla de Contenidos

- [1. Introducción](#1-introducción)
  - [1.1 Objetivo del documento](#11-objetivo-del-documento)
  - [1.2 Alcance técnico](#12-alcance-técnico)
  - [1.3 Audiencia técnica](#13-audiencia-técnica)
- [2. Arquitectura del sistema](#2-arquitectura-del-sistema)
  - [2.1 Vista lógica por capas](#21-vista-lógica-por-capas)
  - [2.2 Vista de despliegue local](#22-vista-de-despliegue-local)
  - [2.3 Vista de despliegue productivo simulado](#23-vista-de-despliegue-productivo-simulado)
  - [2.4 Principios arquitectónicos aplicados](#24-principios-arquitectónicos-aplicados)
  - [2.5 Patrones de diseño implementados](#25-patrones-de-diseño-implementados)
- [3. Stack tecnológico](#3-stack-tecnológico)
  - [3.1 Frontend](#31-frontend)
  - [3.2 Backend](#32-backend)
  - [3.3 Base de datos](#33-base-de-datos)
  - [3.4 Infraestructura y herramientas](#34-infraestructura-y-herramientas)
  - [3.5 Testing](#35-testing)
- [4. Estructura del repositorio](#4-estructura-del-repositorio)
- [5. Backend — NestJS](#5-backend--nestjs)
  - [5.1 Módulos de dominio](#51-módulos-de-dominio)
  - [5.2 Capas y patrones por módulo](#52-capas-y-patrones-por-módulo)
  - [5.3 Convenciones de API y seguridad](#53-convenciones-de-api-y-seguridad)
  - [5.4 Message Broker](#54-message-broker)
- [6. Catálogo completo de endpoints](#6-catálogo-completo-de-endpoints)
  - [6.1 Autenticación](#61-autenticación)
  - [6.2 Portal Cliente](#62-portal-cliente)
  - [6.3 Agente Operativo](#63-agente-operativo)
  - [6.4 Agente Logístico](#64-agente-logístico)
  - [6.5 Encargado de Patio](#65-encargado-de-patio)
  - [6.6 Portal Piloto](#66-portal-piloto)
  - [6.7 Agente Financiero](#67-agente-financiero)
  - [6.8 Certificador FEL](#68-certificador-fel)
  - [6.9 BI / Gerencia](#69-bi--gerencia)
  - [6.10 Health Check](#610-health-check)
- [7. Frontend — Next.js](#7-frontend--nextjs)
  - [7.1 Organización de rutas por rol](#71-organización-de-rutas-por-rol)
  - [7.2 Capa de consumo API](#72-capa-de-consumo-api)
  - [7.3 Estado y refresco en cliente](#73-estado-y-refresco-en-cliente)
- [8. Persistencia y base de datos](#8-persistencia-y-base-de-datos)
  - [8.1 Fuente canónica de esquema](#81-fuente-canónica-de-esquema)
  - [8.2 Entidades troncales](#82-entidades-troncales)
  - [8.3 Flujos de estado canónicos](#83-flujos-de-estado-canónicos)
  - [8.4 Triggers y reglas de consistencia](#84-triggers-y-reglas-de-consistencia)
  - [8.5 Vistas materializadas](#85-vistas-materializadas)
  - [8.6 Multi-moneda y multi-país](#86-multi-moneda-y-multi-país)
- [9. Integraciones externas](#9-integraciones-externas)
- [10. Seguridad técnica](#10-seguridad-técnica)
- [11. Despliegue y operación](#11-despliegue-y-operación)
  - [11.1 Variables de entorno requeridas](#111-variables-de-entorno-requeridas)
  - [11.2 Entorno local con Docker Compose](#112-entorno-local-con-docker-compose)
  - [11.3 Entorno productivo simulado](#113-entorno-productivo-simulado)
  - [11.4 Contexto cloud para operación a internet](#114-contexto-cloud-para-operación-a-internet)
- [12. Observabilidad y monitoreo](#12-observabilidad-y-monitoreo)
- [13. Pruebas y calidad](#13-pruebas-y-calidad)
  - [13.1 Pruebas unitarias](#131-pruebas-unitarias)
  - [13.2 Pruebas de integración](#132-pruebas-de-integración)
  - [13.3 Pruebas E2E](#133-pruebas-e2e)
  - [13.4 Pruebas de carga](#134-pruebas-de-carga)
  - [13.5 Pruebas de estrés](#135-pruebas-de-estrés)
- [14. Mantenimiento correctivo y evolutivo](#14-mantenimiento-correctivo-y-evolutivo)
- [15. Troubleshooting técnico](#15-troubleshooting-técnico)
- [16. Riesgos y mejoras recomendadas](#16-riesgos-y-mejoras-recomendadas)
- [17. Referencias técnicas](#17-referencias-técnicas)

---

## 1. Introducción

### 1.1 Objetivo del documento

Este manual técnico documenta de forma exhaustiva la arquitectura, decisiones técnicas, catálogo de endpoints, base de datos, integraciones y lineamientos de mantenimiento de **LogiTrans Guatemala**. Su propósito es asegurar la continuidad operativa, trazabilidad de cambios y evolución controlada del sistema.

### 1.2 Alcance técnico

**Incluye:**

- Arquitectura de frontend, backend y base de datos con sus patrones aplicados.
- Catálogo completo de endpoints REST implementados.
- Flujos de estado de entidades críticas (órdenes, facturas, pagos).
- Triggers y vistas de la base de datos.
- Soporte multi-moneda y multi-país (GT/SV/HN).
- Integraciones de correo transaccional, almacenamiento y certificación FEL.
- Procedimientos de despliegue local y productivo simulado.
- Cobertura de pruebas (unitarias, integración, E2E, carga y estrés).
- Lineamientos de mantenimiento y troubleshooting.

**No incluye:**

- Manual operativo para usuario final (ver `USER_MANUAL.md`).
- Procedimientos administrativos de negocio fuera de la plataforma.

### 1.3 Audiencia técnica

- Equipo de desarrollo (frontend, backend, DB).
- Soporte técnico L2/L3.
- Ingenieros DevOps responsables de despliegue.
- Arquitectura y QA técnico.

---

## 2. Arquitectura del sistema

### 2.1 Vista lógica por capas

LogiTrans implementa una arquitectura de tres capas con clara separación de responsabilidades:

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| **Presentación** | Next.js 16 (App Router) | SPA por rol, consumo de API REST, SSR parcial |
| **Aplicación** | NestJS 11, TypeORM 0.3 | API REST modular, RBAC, lógica de dominio |
| **Persistencia** | PostgreSQL 15 | Entidades relacionales, triggers, vistas |

Adicionalmente se conectan:

- **Servicio de correo** (Resend SDK) para notificaciones transaccionales.
- **Certificador FEL simulado** para validación tributaria.
- **Almacenamiento de archivos** para firmas y evidencias de entrega.
- **Message Broker** (RabbitMQ/similar) para eventos asíncronos entre servicios.

### 2.2 Vista de despliegue local

Composición del entorno base (`docker-compose.yml`):

| Servicio | Imagen | Puerto host | Descripción |
|---|---|---|---|
| `db` | `postgres:15` | `5433` | Base de datos principal |
| `server` | NestJS build | `3006` | API REST backend |
| `client` | Next.js build | `3000` | Aplicación web frontend |

```yaml
# Fragmento referencial docker-compose.yml
services:
  db:
    image: postgres:15
    ports: ["5433:5432"]
  server:
    build: ./server
    ports: ["3006:3006"]
    depends_on: [db]
  client:
    build: ./client
    ports: ["3000:3000"]
    depends_on: [server]
```

### 2.3 Vista de despliegue productivo simulado

Composición del entorno productivo simulado (`docker-compose.prod.yml`):

| Servicio | Cantidad | Descripción |
|---|---|---|
| `db-primary` | 1 | PostgreSQL primaria con WAL |
| `db-replica` | 1 | PostgreSQL réplica de lectura |
| `api-1`, `api-2` | 2 | Instancias del backend balanceadas |
| `nginx` | 1 | Proxy inverso con TLS y balanceo round-robin |
| `client` | 1 | Frontend servido desde contenedor |

```
Internet → Nginx (443/80) → [api-1 | api-2] → db-primary
                                             ↑
                            db-replica (lecturas)
```

### 2.4 Principios arquitectónicos aplicados

- **Separación de responsabilidades** por dominio de negocio.
- **Inversión de dependencias** (Dependency Injection de NestJS).
- **Bajo acoplamiento** entre módulos de dominio.
- **Alta cohesión** interna en cada módulo.
- **Flujos de estado** bien definidos y validados en capa de dominio.
- **Notificaciones no bloqueantes** (fire-and-forget) para correos.

### 2.5 Patrones de diseño implementados

| Patrón | Ubicación | Descripción |
|---|---|---|
| **Clean Architecture** | Backend completo | Capas presentation / application / domain / infrastructure |
| **Repository Pattern** | Infraestructura TypeORM | Abstracción sobre acceso a datos |
| **DTO + Validation** | Capa de presentación | Validación de entrada con class-validator |
| **Guard + RBAC** | API REST | Control de acceso por rol funcional |
| **Observer (polling)** | Frontend cliente | Seguimiento de estado de órdenes |
| **Factory/Trigger DB** | Base de datos | Creación automática de facturas borrador al entregar |

---

## 3. Stack tecnológico

### 3.1 Frontend

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 16.x | Aplicación web (App Router) |
| React | 19.x | Componentes UI |
| TypeScript | 5.x | Tipado estático en cliente |
| framer-motion | 12.x | Animaciones y transiciones |
| lucide-react | 0.577.x | Iconografía |
| tailwindcss | 3.x | Utilidades CSS |

### 3.2 Backend

| Tecnología | Versión | Uso |
|---|---|---|
| NestJS | 11.x | Framework API modular |
| TypeORM | 0.3.28 | ORM y persistencia |
| PostgreSQL driver (`pg`) | 8.20.x | Conexión directa a DB |
| JWT (`@nestjs/jwt`) | 11.x | Autenticación con tokens |
| Passport | 0.7.x | Estrategias de autenticación |
| Resend SDK | 6.9.x | Correo transaccional |
| class-validator | 0.14.x | Validación de DTOs |
| class-transformer | 0.5.x | Transformación de payload |

### 3.3 Base de datos

| Tecnología | Versión | Uso |
|---|---|---|
| PostgreSQL | 15 | Persistencia relacional principal |
| DBML | — | Documentación de modelo de datos |

### 3.4 Infraestructura y herramientas

| Herramienta | Uso |
|---|---|
| Docker / Docker Compose | Contenerización y orquestación |
| Nginx | Proxy inverso, TLS, balanceo de carga |
| GitHub Actions | CI/CD automatizado |
| Trello | Gestión de tareas Kanban |
| Figma | Diseño de mockups e interfaces |

### 3.5 Testing

| Herramienta | Tipo de prueba |
|---|---|
| Jest | Pruebas unitarias e integración (backend) |
| Playwright | Pruebas E2E (frontend) |
| k6 | Pruebas de carga y estrés |

---

## 4. Estructura del repositorio

```
AYD2_B_1S2026_PROYECTO_G2/
├── client/                  # Frontend Next.js
│   ├── app/                 # Rutas App Router por rol
│   │   ├── (auth)/          # Páginas públicas (login, recovery)
│   │   ├── (dashboard-cliente)/    # Portal del cliente
│   │   ├── (dashboard-nav)/        # Roles operativos con nav
│   │   └── (dashboard-sidebar)/    # Roles con sidebar
│   ├── lib/api/             # Servicios HTTP centralizados
│   ├── types/               # Contratos TypeScript
│   └── components/          # Componentes reutilizables
├── server/                  # Backend NestJS
│   └── src/
│       ├── auth/            # Autenticación y sesiones
│       ├── operations/      # Clientes, contratos, catálogos, patio
│       ├── logistics/       # Asignación de binomios
│       ├── pilot/           # Portal del piloto
│       ├── finance/         # Facturación y pagos
│       ├── certifier/       # Certificación FEL
│       ├── client/          # Portal del cliente
│       ├── bi/              # BI y gerencia
│       ├── notifications/   # Correo transaccional
│       ├── storage/         # Evidencias y archivos
│       ├── health/          # Endpoint de salud
│       └── domain/          # Enums y contratos de dominio
├── db/                      # Esquema SQL canónico y DBML
├── docs/                    # Documentación técnica y funcional
├── nginx/                   # Config proxy y certificados TLS
├── scripts/                 # Scripts de despliegue
├── e2e/                     # Pruebas Playwright
├── tests/                   # Pruebas de carga k6
├── docker-compose.yml       # Entorno local
└── docker-compose.prod.yml  # Entorno productivo simulado
```

---

## 5. Backend — NestJS

### 5.1 Módulos de dominio

| Módulo | Controlador base | Roles consumidores |
|---|---|---|
| `auth` | `/api/auth` | Todos |
| `operations` | `/api/operations` | Agente Operativo, Encargado de Patio |
| `logistics` | `/api/logistics` | Agente Logístico |
| `pilot` | `/api/pilot` | Piloto |
| `finance` | `/api/finance` | Agente Financiero, Gerencia |
| `certifier` | `/api/certifier` | Certificador FEL |
| `client` | `/api/client` | Cliente |
| `bi` | `/api/bi` | Gerencia |
| `health` | `/health` | Sistema / DevOps |
| `notifications` | interno | Disparado por otros módulos |
| `storage` | interno | Disparado por entrega |

### 5.2 Capas y patrones por módulo

Cada módulo sigue la siguiente estructura de directorios:

```
[modulo]/
├── presentation/
│   ├── controllers/        # Controladores NestJS (HTTP)
│   └── dtos/               # Data Transfer Objects (entrada/salida)
├── application/
│   └── use-cases/          # Casos de uso (lógica orquestada)
├── domain/
│   ├── enums/              # Estados y tipos
│   └── interfaces/         # Contratos de repositorios
└── infrastructure/
    └── repositories/       # Implementaciones TypeORM
```

**Principios aplicados:**

- Los controladores no contienen lógica de negocio.
- Los servicios de aplicación orquestan casos de uso.
- El dominio no depende de frameworks externos.
- La infraestructura implementa los contratos del dominio.

### 5.3 Convenciones de API y seguridad

- **Prefijo global:** `/api/[modulo]`
- **Autenticación:** JWT Bearer en header `Authorization`.
- **RBAC:** Guards de NestJS que validan el rol del token contra los roles permitidos por endpoint.
- **Respuesta estándar:**
  ```json
  { "message": "Descripción legible", "data": { ... } }
  ```
- **Errores estandarizados:** `400`, `401`, `403`, `404`, `409`, `500` con mensaje descriptivo.
- **Validación de entrada:** `class-validator` en todos los DTOs de escritura.

### 5.4 Message Broker

El sistema integra un message broker (RabbitMQ) para la gestión de eventos asíncronos entre módulos, principalmente para:

- Notificaciones de cambio de estado de órdenes.
- Despacho de correos transaccionales de forma desacoplada.
- Propagación de eventos de entrega al módulo financiero.

Esto garantiza que los cambios de estado no queden bloqueados por fallos en el sistema de correo.

---

## 6. Catálogo completo de endpoints

### 6.1 Autenticación

Base: `/api/auth`

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| `POST` | `/api/auth/login` | Público | Iniciar sesión y obtener JWT |
| `POST` | `/api/auth/refresh` | Sesión activa | Renovar token de sesión |
| `POST` | `/api/auth/logout` | Autenticado | Cerrar sesión y revocar token |
| `POST` | `/api/auth/recovery` | Público | Solicitar token de recuperación de contraseña |
| `POST` | `/api/auth/password` | Público (con token) | Restablecer contraseña con token recibido por correo |

**Detalles clave:**

- El login inserta una fila en `USER_SESSIONS` con `SESSION_UUID`, `SESSION_TOKEN`, `USER_REMOTE`, `USER_AGENT` y `EXPIRATION_AT`.
- El logout hace un `UPDATE USER_SESSIONS SET DELETED_AT = NOW()` (borrado lógico).
- El token de recuperación se hashea antes de guardarse en `PASSWORD_RECOVERY_TOKENS`; expira en 30 minutos y es de un solo uso.

---

### 6.2 Portal Cliente

Base: `/api/client` — Rol: `CLIENTE`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/client/dashboard/summary` | Resumen de crédito y órdenes activas |
| `GET` | `/api/client/cargo-types` | Tipos de carga autorizados por contrato vigente |
| `GET` | `/api/client/contracts` | Listado de contratos (con filtro por `status`) |
| `GET` | `/api/client/contracts/active` | Contrato vigente activo del cliente autenticado |
| `GET` | `/api/client/contracts/:contractId` | Detalle completo de un contrato |
| `PATCH` | `/api/client/contracts/:contractId/accept` | Aceptar propuesta de contrato |
| `PATCH` | `/api/client/contracts/:contractId/reject` | Rechazar propuesta de contrato |
| `GET` | `/api/client/orders` | Listado de órdenes (con filtros opcionales) |
| `POST` | `/api/client/orders` | Crear nueva orden de servicio |
| `GET` | `/api/client/orders/:orderId/tracking` | Tracking detallado de una orden |
| `GET` | `/api/client/invoices` | Historial de facturas |
| `GET` | `/api/client/contacts` | Contactos del cliente |
| `POST` | `/api/client/contacts` | Registrar nuevo contacto |
| `PATCH` | `/api/client/contacts/:contactId` | Actualizar contacto existente |
| `DELETE` | `/api/client/contacts/:contactId` | Desactivar contacto (borrado lógico) |
| `GET` | `/api/client/account-statement` | Estado de cuenta con aging de deuda |
| `GET` | `/api/client/profile` | Perfil del cliente autenticado |
| `PATCH` | `/api/client/profile` | Actualizar datos del perfil |
| `PATCH` | `/api/client/profile/password` | Cambiar contraseña desde portal |

**Notas importantes:**

- `POST /api/client/orders` aplica automáticamente el contrato vigente más reciente; rechaza tipos de carga no autorizados.
- `GET /api/client/orders` con `limit=3` sirve el dashboard; sin límite sirve el historial completo.
- `GET /api/client/contracts/active` retorna siempre el contrato vigente del cliente autenticado para pre-rellenar formularios.

---

### 6.3 Agente Operativo

Base: `/api/operations` — Rol: `AGENTE_OPERATIVO` / `ENCARGADO_PATIO`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/operations/clients` | Listado de clientes (con búsqueda por NIT / razón social) |
| `POST` | `/api/operations/clients` | Registrar nuevo cliente y crear usuario de portal |
| `GET` | `/api/operations/routes` | Catálogo de rutas activas |
| `POST` | `/api/operations/routes` | Agregar nueva ruta al catálogo |
| `DELETE` | `/api/operations/routes/:id` | Eliminar (desactivar) una ruta del catálogo |
| `GET` | `/api/operations/cargo-types` | Catálogo de tipos de carga |
| `POST` | `/api/operations/cargo-types` | Agregar tipo de carga |
| `DELETE` | `/api/operations/cargo-types/:id` | Eliminar (desactivar) tipo de carga |
| `GET` | `/api/operations/users` | Listado de usuarios del sistema |
| `PATCH` | `/api/operations/users/:id` | Actualizar datos o estado de un usuario |
| `POST` | `/api/operations/contracts` | Generar propuesta de contrato para un cliente |
| `GET` | `/api/operations/cargas` | Listado de órdenes asignadas para patio (Encargado de Patio) |
| `PATCH` | `/api/operations/cargas/:id/formalizar` | Formalizar carga y pasar a `LISTA_PARA_DESPACHO` |

**Notas importantes:**

- `POST /api/operations/clients` crea simultáneamente en `CLIENTS` y `USERS` (rol `CLIENTE`) y dispara correo de bienvenida.
- `POST /api/operations/contracts` inserta en `CONTRACTS`, `CONTRACT_ROUTES` y `CONTRACT_CARGO_TYPES` en una transacción; el trigger `SYNC_CONTRACT_DEFAULTS` genera `CONTRACT_RATES`.
- `PATCH /api/operations/cargas/:id/formalizar` valida que el peso cargado no exceda la capacidad de la unidad asignada antes de cambiar el estado.
- El endpoint `GET /api/operations/users` es accesible para administración interna del equipo; permite filtrar por rol y estado.

---

### 6.4 Agente Logístico

Base: `/api/logistics` — Rol: `AGENTE_LOGISTICO`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/logistics/dashboard/summary` | Resumen de órdenes pendientes y unidades disponibles |
| `GET` | `/api/logistics/orders` | Listado de órdenes (filtrable por estado, fecha, cliente) |
| `GET` | `/api/logistics/orders/:id` | Detalle de una orden específica |
| `GET` | `/api/logistics/unit-binomials` | Binomios (piloto + unidad) disponibles para una orden |
| `GET` | `/api/logistics/routes` | Catálogo de rutas (reutiliza el de Operativa) |
| `PATCH` | `/api/logistics/orders/:id/assignment` | Asignar binomio y ruta a una orden |

**Notas importantes:**

- `GET /api/logistics/unit-binomials` filtra por compatibilidad de peso, tipo de carga y documentación vigente de la unidad.
- `PATCH /api/logistics/orders/:id/assignment` actualiza `ORDERS.UNIT_ID`, `CONTRACT_ROUTE_ID`, `SCHEDULED_PICKUP_AT` y `STATUS`; el trigger `VALIDATE_ORDER_ASSIGNMENT` valida la compatibilidad antes de confirmar.

---

### 6.5 Encargado de Patio

Los endpoints del Encargado de Patio se encuentran bajo el módulo `operations`:

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/operations/cargas` | Listado de órdenes asignadas listas para despacho |
| `PATCH` | `/api/operations/cargas/:id/formalizar` | Registrar peso real y formalizar salida |

---

### 6.6 Portal Piloto

Base: `/api/pilot` — Rol: `PILOTO`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/pilot/orders` | Órdenes asignadas al piloto autenticado |
| `GET` | `/api/pilot/orders/:id` | Detalle de una orden específica del piloto |
| `PATCH` | `/api/pilot/orders/:id/status` | Cambiar estado de la orden (p. ej., a `EN_TRANSITO`) |
| `POST` | `/api/pilot/orders/:id/logs` | Registrar evento en la bitácora de la orden |
| `PATCH` | `/api/pilot/orders/:id/deliver` | Confirmar entrega con firma y evidencia fotográfica |

**Notas importantes:**

- `PATCH /api/pilot/orders/:id/deliver` almacena firma y evidencia en Base64 y genera las rutas de archivo correspondientes; dispara el trigger `TRG_AUTO_CREATE_DRAFT_INVOICE` que crea una factura `BORRADOR` automáticamente.
- `POST /api/pilot/orders/:id/logs` inserta en `ORDER_ROUTE_LOGS` y el historial queda disponible para el tracking del cliente.

---

### 6.7 Agente Financiero

Base: `/api/finance` — Rol: `AGENTE_FINANCIERO`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/finance/dashboard/summary` | Resumen financiero del período |
| `GET` | `/api/finance/invoices` | Listado de facturas (filtrable por estado) |
| `GET` | `/api/finance/invoices/:id` | Detalle de una factura |
| `PATCH` | `/api/finance/invoices/:id/submit-for-certification` | Completar borrador y enviarlo al certificador FEL |
| `PATCH` | `/api/finance/invoices/:id/send` | Enviar factura certificada al cliente |
| `GET` | `/api/finance/payments` | Listado de pagos pendientes de conciliación |
| `PATCH` | `/api/finance/payments/:id/approve` | Aprobar pago y actualizar factura a `PAGADA` |
| `GET` | `/api/finance/rates` | Tarifario base de tipos de vehículo |
| `PATCH` | `/api/finance/rates/:id` | Actualizar tarifa base de un tipo de vehículo |

**Notas importantes:**

- `PATCH /api/finance/invoices/:id/submit-for-certification` no crea nueva factura; completa el borrador autogenerado con `serviceDescription` y `dueDate`.
- `PATCH /api/finance/payments/:id/approve` actualiza `PAYMENTS.STATUS` y el trigger `SYNC_INVOICE_PAYMENT` cambia la factura a `PAGADA`.
- Solo se puede enviar una factura en estado `PAGADA`; intentarlo en otros estados retorna `409`.

---

### 6.8 Certificador FEL

Base: `/api/certifier` — Rol: `CERTIFICADOR_FEL`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/certifier/dashboard/summary` | Resumen de facturas pendientes y certificadas |
| `GET` | `/api/certifier/invoices` | Bandeja de facturas listos para certificar |
| `POST` | `/api/certifier/invoices/:id/validate-nit` | Validar NIT del cliente previo a certificación |
| `PATCH` | `/api/certifier/invoices/:id/certify` | Certificar factura con UUID FEL |
| `PATCH` | `/api/certifier/invoices/:id/reject` | Rechazar factura con motivo documentado |

**Notas importantes:**

- La bandeja `GET /api/certifier/invoices` solo muestra facturas en estado `BORRADOR` que ya tienen `SERVICE_DESCRIPTION` (procesadas por Finanzas).
- La certificación requiere que el `clientNit` sea válido y coincida con la factura; de lo contrario retorna `400`.
- El rechazo regresa la factura a revisión de Finanzas para corrección.

---

### 6.9 BI / Gerencia

Base: `/api/bi` — Rol: `GERENCIA`

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/bi/kpis` | KPIs operativos y financieros del período |
| `GET` | `/api/bi/branches/distribution` | Distribución de órdenes por sede |
| `GET` | `/api/bi/orders/recent` | Órdenes recientes para monitoreo |
| `GET` | `/api/bi/profitability` | Rentabilidad por contrato |
| `GET` | `/api/bi/alerts` | Alertas activas y proyecciones operativas |

**Notas importantes:**

- `GET /api/bi/kpis` soporta parámetros `period` (`MONTHLY`/`ANNUAL`), `year` y `month`.
- `GET /api/bi/profitability` se apoya en la vista `V_CONTRACT_PROFITABILITY`.
- `GET /api/bi/alerts` devuelve incidentes activos de `ORDER_ROUTE_LOGS` con tipo `INCIDENTE` y proyecciones calculadas.
- Todos los montos monetarios del módulo de gerencia se normalizan a **USD** para comparabilidad inter-país.

---

### 6.10 Health Check

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Verificación de salud del servicio backend |

Responde con `200 OK` y un payload indicando estado de la API y conectividad con la base de datos. Se usa en el pipeline CI/CD y en los healthchecks de Docker Compose.

---

## 7. Frontend — Next.js

### 7.1 Organización de rutas por rol

```
client/app/
├── (auth)/
│   ├── login/              # Pantalla de login y landing
│   └── recovery/           # Recuperación de contraseña
├── (dashboard-cliente)/
│   ├── ordenes/            # Historial y nueva orden
│   ├── contratos/          # Contratos y aceptación
│   ├── facturas/           # Historial de facturas FEL
│   ├── estado-cuenta/      # Estado de cuenta y aging
│   ├── contactos/          # Contactos del cliente
│   └── perfil/             # Datos empresariales y seguridad
├── (dashboard-nav)/
│   ├── logistica/          # Asignación y seguimiento logístico
│   ├── piloto/             # Portal del piloto
│   └── certificador/       # Bandeja FEL
└── (dashboard-sidebar)/
    ├── operativo/          # Clientes, contratos, catálogos, usuarios
    ├── finanzas/           # Facturación y pagos
    └── gerencia/           # KPIs, rentabilidad, alertas
```

### 7.2 Capa de consumo API

- **Servicios HTTP** centralizados en `client/lib/api/` por módulo.
- **Tipado de respuestas** en `client/types/` alineados con los DTOs del backend.
- **Manejo de errores** centralizado con interceptores.
- **Headers automáticos** con JWT del contexto de sesión.

### 7.3 Estado y refresco en cliente

Para el portal del cliente:

- **Polling controlado** para el listado de órdenes (refresco periódico).
- **Polling controlado** para el drawer de tracking cuando está abierto.
- **Re-sincronización** al cerrar el drawer de tracking.
- **Sin SSE/WebSocket** en esta versión (mejora futura recomendada).

---

## 8. Persistencia y base de datos

### 8.1 Fuente canónica de esquema

| Archivo | Descripción |
|---|---|
| `db/logitrans_postgresql.sql` | DDL canónico completo con tablas, índices, triggers y vistas |
| `db/logitrans_dbdiagram.dbml` | Modelo visual de entidades para documentación |

### 8.2 Entidades troncales

| Tabla | Descripción |
|---|---|
| `users` | Todos los usuarios del sistema con rol y credenciales |
| `user_sessions` | Sesiones activas con token, expiración y metadata |
| `password_recovery_tokens` | Tokens de recuperación hasheados con expiración |
| `clients` | Clientes de transporte con datos fiscales y riesgo |
| `client_contacts` | Contactos secundarios de cada cliente |
| `contracts` | Contratos con límite de crédito, plazo y descuento |
| `contract_routes` | Rutas autorizadas por contrato |
| `contract_cargo_types` | Tipos de carga permitidos por contrato |
| `contract_rates` | Tarifario calculado por contrato y tipo de vehículo |
| `routes` | Catálogo de rutas con distancia y estimación de tiempo |
| `cargo_types` | Catálogo de tipos de carga con indicador de refrigeración |
| `transport_units` | Unidades de transporte con capacidad y piloto asignado |
| `vehicle_types` | Tipos de vehículo con tarifa base por km |
| `orders` | Órdenes de servicio con estado, peso, evidencia y fechas |
| `order_route_logs` | Bitácora cronológica de eventos de cada orden |
| `invoices` | Facturas con UUID FEL, moneda, impuesto y estado |
| `payments` | Pagos registrados por el cliente con estado de conciliación |
| `exchange_rates` | Tipos de cambio históricos por moneda |
| `branches` | Sedes operativas de la empresa |

### 8.3 Flujos de estado canónicos

**Orden de servicio:**

```
REGISTRADA → ASIGNADA → LISTA_PARA_DESPACHO → EN_TRANSITO → ENTREGADA
```

**Factura:**

```
BORRADOR → CERTIFICADA → PAGADA → ENVIADA
                ↓
           RECHAZADA (si FEL rechaza)
```

**Pago:**

```
PENDIENTE → APROBADO / RECHAZADO
```

> **Regla crítica:** El envío de factura al cliente solo se habilita cuando la factura está en estado `PAGADA`. Intentarlo antes retorna error `409 Conflict`.

### 8.4 Triggers y reglas de consistencia

| Trigger | Tabla | Descripción |
|---|---|---|
| `TRG_AUTO_CREATE_DRAFT_INVOICE` | `orders` | Crea factura `BORRADOR` automáticamente al cambiar orden a `ENTREGADA` |
| `SYNC_CONTRACT_DEFAULTS` | `contracts` | Genera/sincroniza `CONTRACT_RATES` al insertar un contrato |
| `VALIDATE_ORDER_ASSIGNMENT` | `orders` | Valida capacidad, refrigeración y tarifa al asignar binomio |
| `SYNC_INVOICE_PAYMENT` | `payments` | Actualiza factura a `PAGADA` cuando el pago es aprobado |

### 8.5 Vistas materializadas

| Vista | Descripción |
|---|---|
| `V_CLIENT_BALANCES` | Saldo, crédito disponible e indicador de bloqueo por cliente |
| `V_CONTRACT_PROFITABILITY` | Rentabilidad bruta por contrato para módulo BI |

### 8.6 Multi-moneda y multi-país

LogiTrans soporta operación en tres países con monedas y tasas de impuesto específicas:

| País | Código | Moneda | Código | Impuesto (IVA) |
|---|---|---|---|---|
| Guatemala | GT | Quetzal | GTQ | 12% |
| El Salvador | SV | Dólar US | USD | 13% |
| Honduras | HN | Lempira | HNL | 15% |

**Campos propagados en entidades clave:**

- `currency_code` — código ISO de la moneda del cliente/contrato.
- `exchange_rate_from_usd` — tasa de cambio en el momento de la operación.
- `tax_rate` — tasa impositiva del país del cliente.

> Los KPIs de gerencia normalizan todos los montos a **USD** para permitir comparativas entre países.

---

## 9. Integraciones externas

| Integración | Tecnología | Modo | Descripción |
|---|---|---|---|
| **Correo transaccional** | Resend SDK | Fire-and-forget | Envío de bienvenida, propuesta de contrato, recuperación de contraseña, notificaciones operativas |
| **Certificador FEL** | Módulo interno simulado | Síncrono | Validación de NIT y emisión de UUID FEL para facturas electrónicas |
| **Almacenamiento de evidencia** | Sistema de archivos / S3 compatible | Síncrono | Persistencia de firmas digitales y fotografías de entrega |
| **Message Broker** | RabbitMQ (o equivalente) | Asíncrono | Propagación de eventos entre módulos |

**Política operativa de correos:**

- Las notificaciones de salida (EN_TRANSITO) y entrega (ENTREGADA) son **no bloqueantes**.
- Si el servidor de correo falla, la transición de estado de la orden **no se revierte**.
- Los correos se registran en logs del contenedor para auditoría.

---

## 10. Seguridad técnica

### Controles implementados

| Control | Descripción |
|---|---|
| **JWT** | Autenticación sin estado con expiración configurable |
| **RBAC** | Guards que validan rol del token contra permisos del endpoint |
| **Sesiones en DB** | `USER_SESSIONS` permite invalidación centralizada de tokens |
| **Hashing de contraseñas** | Contraseñas almacenadas con hash (bcrypt) |
| **Variables de entorno** | Secretos sensibles via `.env` (nunca hardcodeados) |
| **Validación de entrada** | `class-validator` en todos los DTOs de escritura |
| **TLS** | Obligatorio en entorno productivo (Nginx) |

### Buenas prácticas recomendadas

- Rotar secretos JWT periódicamente.
- Habilitar TLS con certificado válido en producción.
- Aplicar hardening de cabeceras HTTP en Nginx (`HSTS`, `X-Frame-Options`, `CSP`).
- Auditar acciones críticas (cambios de estado de orden, certificación, aprobación de pago).
- Limitar CORS al dominio del frontend en producción.

---

## 11. Despliegue y operación

### 11.1 Variables de entorno requeridas

**Backend (`server/.env`):**

```env
# Base de datos
DB_HOST=db
DB_PORT=5432
DB_NAME=logitrans
DB_USER=postgres
DB_PASSWORD=<secreto>

# JWT
JWT_SECRET=<secreto_jwt>
JWT_EXPIRATION=1d

# Correo
RESEND_API_KEY=<api_key_resend>
MAIL_FROM=noreply@logitrans.com.gt

# Storage
STORAGE_PATH=/files

# App
NODE_ENV=production
PORT=3006
```

**Frontend (`client/.env.local`):**

```env
NEXT_PUBLIC_API_URL=http://localhost:3006
```

### 11.2 Entorno local con Docker Compose

```bash
# Levantar entorno desde cero
docker compose down -v --remove-orphans
docker compose up -d --build

# Verificar estados
docker compose ps

# Validar API
curl -i http://localhost:3006/health

# Ver logs del backend
docker compose logs -f server
```

### 11.3 Entorno productivo simulado

**Opción automatizada:**

```bash
bash scripts/deploy.sh
```

**Opción manual:**

```bash
docker compose -f docker-compose.prod.yml down -v --remove-orphans
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps

# Verificar backend a través de Nginx
curl -i https://localhost/health
```

**Servicios clave:**

- `nginx` — entrada HTTPS, proxy y balanceo.
- `api-1` y `api-2` — instancias balanceadas del backend.
- `db-primary` — escrituras.
- `db-replica` — lecturas; replicación en streaming WAL.

### 11.4 Contexto cloud para operación a internet

Arquitectura objetivo recomendada (AWS o equivalente):

| Componente | Servicio sugerido | Descripción |
|---|---|---|
| **Balanceador** | ALB / CloudFront | Frontend y API bajo HTTPS |
| **Compute** | ECS / EKS | Contenedores de API y cliente |
| **Base de datos** | RDS PostgreSQL | DB administrada con backups automáticos |
| **Storage** | S3 | Evidencias de entrega y firmas digitales |
| **Secretos** | AWS Secrets Manager | Variables sensibles en runtime |
| **Monitoreo** | CloudWatch / Grafana | Logs, métricas y alertas |
| **CI/CD** | GitHub Actions | Build, test y deploy automatizados |

---

## 12. Observabilidad y monitoreo

### Indicadores mínimos a monitorear

| Indicador | Fuente | Umbral de alerta |
|---|---|---|
| Disponibilidad del endpoint `/health` | Polling externo | < 99.5% en 5 min |
| Latencia de endpoints críticos | Logs API | > 2s en p95 |
| Errores 5xx | Logs Nginx/API | > 1% de solicitudes |
| Disponibilidad de base de datos | Healthcheck Docker | Cualquier fallo |
| Fallos de correo | Logs módulo notifications | > 5 fallos consecutivos |
| Fallos de certificación FEL | Logs módulo certifier | Cualquier fallo en producción |

### Fuentes de diagnóstico

```bash
# Logs del contenedor backend
docker compose logs -f server

# Logs de Nginx
docker compose logs -f nginx

# Estado de todos los servicios
docker compose ps

# Conectividad directa a la DB
docker compose exec db psql -U postgres -d logitrans -c "SELECT NOW();"
```

---

## 13. Pruebas y calidad

### Flujo de validación mínimo por cambio

```bash
# 1. Build backend
cd server && npm run build

# 2. Tests unitarios e integración
cd server && npm run test -- --runInBand

# 3. Build frontend
cd client && npm run build

# 4. E2E (requiere entorno levantado)
cd e2e && npx playwright test

# 5. Smoke test manual del flujo impactado
```

### 13.1 Pruebas unitarias

- **Framework:** Jest.
- **Cobertura:** Casos de uso y servicios de aplicación.
- **Ubicación:** `server/src/**/*.spec.ts`.
- **Ejecución:** `cd server && npm run test`.

### 13.2 Pruebas de integración

- **Framework:** Jest con base de datos de prueba.
- **Cobertura:** Flujos completos de repositorio + base de datos.
- **Validación:** Triggers, constraints y vistas.

### 13.3 Pruebas E2E

- **Framework:** Playwright.
- **Cobertura:** Happy path completo por rol (login → operación → cierre de sesión).
- **Ubicación:** `e2e/`.
- **Ejecución:** `npx playwright test`.

### 13.4 Pruebas de carga

- **Framework:** k6.
- **Objetivo:** Validar rendimiento bajo carga sostenida en endpoints críticos.
- **Ubicación:** `tests/`.
- **Escenarios cubiertos:** Login masivo, creación de órdenes, consulta de tracking.

### 13.5 Pruebas de estrés

- **Framework:** k6 con ramp-up agresivo.
- **Objetivo:** Identificar punto de quiebre del sistema.
- **Resultado esperado:** El sistema debe degradar con gracia (no caerse abruptamente).

---

## 14. Mantenimiento correctivo y evolutivo

### Correctivo

1. Reproducir el incidente en entorno local.
2. Revisar logs del contenedor del módulo afectado.
3. Identificar la capa afectada (presentación, aplicación, dominio o infraestructura).
4. Aplicar el fix mínimo seguro con prueba asociada.
5. Validar `npm run build` y `npm run test`.
6. Verificar ausencia de regresiones en flujos adyacentes.
7. Desplegar y monitorear logs post-despliegue.

### Evolutivo

1. Definir impacto funcional y técnico del cambio.
2. Ajustar contratos API/DTO según nuevos requisitos.
3. Actualizar entidades y migraciones de base de datos.
4. Actualizar frontend (tipos, servicios, componentes) de forma compatible.
5. Ampliar cobertura de pruebas para los nuevos escenarios.
6. Actualizar documentación técnica (`TECHNICAL_MANUAL.md`) y funcional (`USER_MANUAL.md`).

---

## 15. Troubleshooting técnico

| Problema | Causa probable | Solución |
|---|---|---|
| API no responde en puerto 3006 | Contenedor `server` caído o en error | `docker compose ps && docker compose logs server` |
| Frontend sin datos / errores de red | `NEXT_PUBLIC_API_URL` incorrecto | Verificar `.env.local` y reiniciar contenedor `client` |
| DB no inicia o healthcheck falla | Volumen corrupto o conflicto de puerto | `docker compose down -v && docker compose up -d` |
| Correo no llega al cliente | API key de Resend inválida o modo mock activo | Verificar `RESEND_API_KEY` en `.env` del backend |
| Factura no se puede enviar | Factura no está en estado `PAGADA` | Verificar flujo: aprobar pago antes de enviar factura |
| Error 401 en todos los endpoints | Token JWT expirado o inválido | Re-autenticarse o renovar token con `/api/auth/refresh` |
| Error 403 en endpoint específico | Rol del usuario no tiene acceso | Verificar rol asignado en `USERS.ROLE` |
| Peso real rechazado en patio | Diferencia mayor a tolerancia permitida | Verificar peso declarado vs real; corregir el dato |
| Trigger no crea factura borrador | Orden no llegó a estado `ENTREGADA` | Verificar estado actual de la orden antes de la entrega |

---

## 16. Riesgos y mejoras recomendadas

### Riesgos vigentes

| Riesgo | Severidad | Descripción |
|---|---|---|
| **Polling cliente** | Media | El refresco de estados se hace por polling; no es tiempo real. |
| **Correos sin reintentos** | Media | Si falla el correo, no se reintenta automáticamente. |
| **Réplica sin failover automático** | Alta | En producción simulada, la falla de `db-primary` requiere intervención manual. |

### Mejoras recomendadas

| Mejora | Prioridad | Descripción |
|---|---|---|
| SSE / WebSocket para tracking | Alta | Reemplazar polling por notificaciones push en tiempo real. |
| Outbox pattern para correos | Alta | Garantizar entrega de correos con un sistema de reintentos. |
| Pruebas de regresión financiera | Alta | Ampliar cobertura de pruebas en flujos de factura y conciliación. |
| Failover automático de DB | Media | Implementar pgBouncer o Patroni para HA de base de datos. |
| Monitoreo centralizado | Media | Integrar Grafana/Prometheus o CloudWatch para visibilidad operativa. |
| Auditoría en DB | Baja | Registrar en tabla de auditoría todos los cambios de estado críticos. |

---

## 17. Referencias técnicas

| Documento | Ruta |
|---|---|
| README principal | `README.md` |
| Manual de usuario | `docs/USER_MANUAL.md` |
| Tabla de endpoints (legacy) | `docs/endpoint_tables.md` |
| Arquitectura detallada | `docs/architecture.md` |
| ADR (Decisiones arquitectónicas) | `docs/adr.md` |
| DDA (Drivers de diseño) | `docs/dda.md` |
| Manual de despliegue | `docs/despliegue.md` / `docs/DEPLOYMENT.md` |
| MVP Accesos y usuarios | `docs/mvp_accessos_usuarios.md` |
| Esquema SQL canónico | `db/logitrans_postgresql.sql` |
| Modelo DBML | `db/logitrans_dbdiagram.dbml` |

---

**© 2026 LogiTrans Guatemala — Grupo 2 — Análisis y Diseño de Sistemas 2**
