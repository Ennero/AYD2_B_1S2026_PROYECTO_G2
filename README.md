# LogiTrans - Plataforma de Gestion Logistica y Transporte

> **Plataforma web integral para gestionar operaciones comerciales, logisticas y financieras de transporte de carga.**

[![Version](https://img.shields.io/badge/version-2.0-blue)](https://github.com)
[![Estado](https://img.shields.io/badge/estado-MVP%20cerrado-brightgreen)](https://github.com)
[![Licencia](https://img.shields.io/badge/licencia-MIT-green)](LICENSE)
[![Periodo](https://img.shields.io/badge/periodo-1S%202026-lightblue)](https://github.com)

---

## Tabla de Contenidos

- [LogiTrans - Plataforma de Gestion Logistica y Transporte](#logitrans---plataforma-de-gestion-logistica-y-transporte)
  - [Tabla de Contenidos](#tabla-de-contenidos)
  - [Descripcion General](#descripcion-general)
    - [Objetivo del Proyecto](#objetivo-del-proyecto)
  - [Estados Canonicos del Negocio](#estados-canonicos-del-negocio)
    - [Ordenes](#ordenes)
    - [Facturas](#facturas)
    - [Pagos (flujo separado)](#pagos-flujo-separado)
  - [Caracteristicas Principales](#caracteristicas-principales)
    - [Para Cliente](#para-cliente)
    - [Para Operaciones](#para-operaciones)
    - [Para Piloto y Operacion en Ruta](#para-piloto-y-operacion-en-ruta)
    - [Para Finanzas y FEL](#para-finanzas-y-fel)
    - [Para Gerencia](#para-gerencia)
  - [Stack Tecnologico](#stack-tecnologico)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Infraestructura](#infraestructura)
  - [Inicio Rapido](#inicio-rapido)
    - [Requisitos previos](#requisitos-previos)
    - [3 pasos](#3-pasos)
    - [URLs esperadas](#urls-esperadas)
  - [Instalacion Detallada](#instalacion-detallada)
    - [Con Docker (recomendado)](#con-docker-recomendado)
      - [Stack completo](#stack-completo)
      - [Entorno productivo simulado](#entorno-productivo-simulado)
    - [Sin Docker (desarrollo)](#sin-docker-desarrollo)
      - [Backend](#backend-1)
      - [Frontend](#frontend-1)
  - [Documentacion Completa](#documentacion-completa)
  - [Estructura del Proyecto](#estructura-del-proyecto)
  - [URLs y Endpoints Importantes](#urls-y-endpoints-importantes)
    - [Desarrollo local](#desarrollo-local)
    - [Produccion simulada](#produccion-simulada)
  - [Equipo de Desarrollo](#equipo-de-desarrollo)
  - [Comandos Utiles](#comandos-utiles)
    - [Docker](#docker)
    - [Backend](#backend-2)
    - [Frontend](#frontend-2)
  - [Licencia](#licencia)

---

## Descripcion General

**LogiTrans** es una plataforma web para administracion integral de transporte terrestre de carga. El sistema integra en una sola solucion:

- Gestion comercial de clientes y contratos.
- Gestion operativa de ordenes, patio y viaje.
- Seguimiento de entregas con bitacora y evidencia.
- Facturacion, certificacion FEL y conciliacion de pagos.
- Analitica de operaciones y rentabilidad.

### Objetivo del Proyecto

Proveer una plataforma confiable para digitalizar el ciclo logistico completo, reduciendo tiempos operativos y mejorando trazabilidad, control de riesgo y cumplimiento financiero.

---

## Estados Canonicos del Negocio

### Ordenes

`REGISTRADA -> ASIGNADA -> LISTA_PARA_DESPACHO -> EN_TRANSITO -> ENTREGADA`

### Facturas

`BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA`

### Pagos (flujo separado)

`PENDIENTE -> APROBADO / RECHAZADO`

Regla critica: la factura solo puede enviarse al cliente cuando esta en estado `PAGADA`.

---

## Caracteristicas Principales

### Para Cliente

- Creacion de ordenes de servicio.
- Seguimiento de estado y tracking de ordenes.
- Gestion de contratos y aceptacion de propuestas.
- Consulta de facturas y estado de cuenta.
- Gestion de contactos y perfil empresarial.

### Para Operaciones

- Registro de clientes con perfil fiscal y de riesgo.
- Formalizacion de contratos con rutas y tipos de carga.
- Asignacion de binomio piloto-vehiculo.
- Formalizacion de carga en patio.

### Para Piloto y Operacion en Ruta

- Inicio de viaje con control de estado.
- Registro de eventos en bitacora.
- Confirmacion de entrega con firma y evidencia.
- Notificacion automatica al cliente en salida y entrega.

### Para Finanzas y FEL

- Generacion de factura borrador por entrega.
- Envio a certificacion FEL.
- Conciliacion de pagos y cambio a `PAGADA`.
- Envio de factura final al cliente.

### Para Gerencia

- Dashboard de KPI operativos.
- Analisis de rentabilidad.
- Seguimiento de alertas de operacion.

---

## Stack Tecnologico

### Frontend

| Tecnologia | Version | Descripcion |
|---|---|---|
| Next.js | 16.1.6 | Framework web (App Router) |
| React | 19.2.3 | Libreria de UI |
| TypeScript | 5.x | Tipado estatico |
| framer-motion | 12.x | Animaciones |

### Backend

| Tecnologia | Version | Descripcion |
|---|---|---|
| NestJS | 11.x | Framework API modular |
| TypeORM | 0.3.28 | ORM |
| PostgreSQL Driver (`pg`) | 8.20.x | Conexion a DB |
| JWT + Passport | 11.x / 0.7.x | Autenticacion y autorizacion |
| Resend | 6.9.x | Correo transaccional |

### Infraestructura

| Herramienta | Funcion |
|---|---|
| Docker | Contenerizacion |
| Docker Compose | Orquestacion local |
| Nginx | Reverse proxy y TLS |
| PostgreSQL 15 | Persistencia relacional |
| Playwright | Pruebas E2E |
| Jest | Pruebas backend |
| k6 | Pruebas de carga |

---

## Inicio Rapido

### Requisitos previos

- Docker Desktop o Docker Engine.
- Docker Compose v2.
- Git.

### 3 pasos

```bash
# 1) Clonar repositorio
git clone <repository-url>
cd AYD2_B_1S2026_PROYECTO_G2

# 2) Configurar entorno backend
cp server/.env.example server/.env

# 3) Levantar stack base
docker compose up -d --build
```

### URLs esperadas

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3006`
- Health API: `http://localhost:3006/health`
- PostgreSQL: `localhost:5433`

---

## Instalacion Detallada

### Con Docker (recomendado)

#### Stack completo

```bash
docker compose down -v --remove-orphans
docker compose up -d --build
docker compose ps
docker compose logs --no-color server | tail -n 200
docker compose logs --no-color client | tail -n 200
```

#### Entorno productivo simulado

```bash
# Opcion automatizada
./scripts/deploy.sh

# Opcion manual
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

### Sin Docker (desarrollo)

#### Backend

```bash
cd server
npm install
cp .env.example .env
npm run build
npm run start:dev
```

#### Frontend

```bash
cd client
npm install
npm run dev
```

---

## Documentacion Completa

| Documento | Descripcion |
|---|---|
| [Manual de Usuario](docs/USER_MANUAL.md) | Guia completa por rol con flujo funcional |
| [Manual Tecnico](docs/TECHNICAL_MANUAL.md) | Arquitectura, mantenimiento y operacion tecnica |
| [Happy Path](docs/happypath.md) | Evidencia visual end-to-end del MVP |
| [Despliegue Profundo](docs/despliegue.md) | Guia operativa completa de despliegue |
| [Deployment Prod](docs/DEPLOYMENT.md) | Despliegue productivo simulado con Nginx |
| [Arquitectura](docs/architecture.md) | Vista estructural del sistema |
| [DDA](docs/dda.md) | Diseno de arquitectura detallado |
| [ADR](docs/adr.md) | Decisiones de arquitectura |

---

## Estructura del Proyecto

```text
AYD2_B_1S2026_PROYECTO_G2/
|- client/                  # Frontend Next.js
|- server/                  # Backend NestJS
|- db/                      # SQL canonico, DBML y scripts de DB
|- docs/                    # Documentacion funcional y tecnica
|- e2e/                     # Pruebas E2E (Playwright)
|- tests/                   # Pruebas de carga (k6)
|- nginx/                   # Proxy, TLS y balanceo
|- scripts/                 # Scripts de despliegue
|- docker-compose.yml       # Stack base
|- docker-compose.prod.yml  # Stack productivo simulado
`- README.md
```

---

## URLs y Endpoints Importantes

### Desarrollo local

| Servicio | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Backend API | `http://localhost:3006` |
| Health API | `http://localhost:3006/health` |
| PostgreSQL | `localhost:5433` |

### Produccion simulada

| Servicio | URL |
|---|---|
| Entrada HTTPS | `https://localhost` |
| API via Nginx | `https://localhost/api/` |
| Health via Nginx | `https://localhost/health` |

---

## Equipo de Desarrollo

**Grupo 2 - Analisis y Diseno de Sistemas 2**

| Carne | Nombre | Rol Scrum | Responsabilidad Principal |
|---|---|---|---|
| 202302220 | Enner Esai Mendizabal Castro | Scrum Master | Base de datos / DDA |
| 201807398 | Anyelo Gustavo Hernandez Ayala | Product Owner | Backend - Ordenes |
| 202004071 | Henry David Quel Santos | Development Team | Frontend / Testing E2E |
| 202200214 | Pablo Alejandro Marroquin Cutz | Development Team | Backend - BI y Reportes |
| 202202410 | Marcos Daniel Bonifasi de Leon | Development Team | Backend - Facturacion |
| 202300670 | David Estuardo Barrios Ramirez | Development Team | Frontend |

---

## Comandos Utiles

### Docker

```bash
docker compose up -d --build
docker compose ps
docker compose logs --no-color server | tail -n 200
docker compose logs --no-color client | tail -n 200
docker compose down
docker compose down -v --remove-orphans
```

### Backend

```bash
cd server
npm run build
npm run test -- --runInBand
npm run start:dev
```

### Frontend

```bash
cd client
npm run dev
npm run build
npm run lint
```

---

## Licencia

Este proyecto utiliza licencia MIT. Consulta el archivo [LICENSE](LICENSE).

---

**Ultima actualizacion documental:** 05 de abril de 2026.
