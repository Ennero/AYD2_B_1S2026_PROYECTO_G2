<div align="center">

# 🚛 LogiTrans — Plataforma de Gestión Logística y Transporte

**Plataforma web integral para gestionar operaciones comerciales, logísticas y financieras de transporte de carga**

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![University](https://img.shields.io/badge/USAC-An%C3%A1lisis_y_Dise%C3%B1o_2-003366?style=for-the-badge)](https://ingenieria.usac.edu.gt/)

</div>

---

## Tabla de Contenidos

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
- [Arquitectura Actual](#arquitectura-actual)
- [Videos de Demostracion](#videos-de-demostracion)
- [Inicio Rapido](#inicio-rapido)
  - [Requisitos previos](#requisitos-previos)
  - [3 pasos](#3-pasos)
  - [URLs esperadas](#urls-esperadas)
- [Certificados de desarrollo](#certificados-de-desarrollo)
- [Instalacion Detallada](#instalacion-detallada)
  - [Con Docker (recomendado)](#con-docker-recomendado)
  - [Sin Docker (desarrollo)](#sin-docker-desarrollo)
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
- [Licencia y verificación](#licencia-y-verificaci%C3%B3n)

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

## Arquitectura Actual

El sistema se implementa como una **arquitectura híbrida**:

- Coordinación principal **sincrónica** por API REST + PostgreSQL.
- Capa **asíncrona** con RabbitMQ para eventos de dominio y notificaciones no bloqueantes.

Esta implementación mantiene consistencia transaccional en el flujo principal y desacopla efectos secundarios sin clasificar al sistema como EDA puro.

---

## Videos de Demostracion

- Video (YouTube): https://youtu.be/Wi7t-aH-_w0?si=5yoLN27F77zqG9eu
- Video (Google Drive): https://drive.google.com/file/d/1ufW0e0h3kbWgO5YF3zCcfsc26B3nqXem/view?usp=sharing

---

## Inicio Rapido

### Requisitos previos

- Docker Desktop o Docker Engine.
- Docker Compose v2.
- Git.

### 3 pasos

```bash
# 1) Clonar repositorio
git clone https://github.com/Ennero/AYD2_B_1S2026_PROYECTO_G2.git
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

## Certificados de desarrollo

El entorno HTTPS simulado requiere generar certificados en la computadora que lo ejecuta:

```bash
bash nginx/ssl/generate-cert.sh
```

Las claves `.pem` quedan ignoradas por Git. Para reemplazar una pareja local anterior, usar `bash nginx/ssl/generate-cert.sh --force`. En un despliegue público se deben configurar certificados propios. Copiar `server/.env.production.example` a `server/.env.production` y configurar secretos e integraciones antes de usar el Compose de producción simulada. Los datos iniciales y migraciones deben prepararse según la guía de despliegue; el ejemplo no activa borrado de esquema ni seeds automáticamente.

## Instalacion Detallada

### Con Docker (recomendado)

#### Stack completo

```bash
docker compose down --remove-orphans
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
| [Reporte de Pruebas](docs/testing-report.md) | Estrategia, ejecucion y plantillas de resultados |
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
docker compose down --remove-orphans
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

**Ultima actualizacion documental:** 17 de abril de 2026.

## Licencia y verificación

La raíz conserva la licencia MIT. El backend NestJS mantiene `UNLICENSED` en su manifiesto: la licencia de la raíz no cambia automáticamente esa declaración del componente. Conservar también los créditos del equipo en la documentación de la entrega.

Los informes de pruebas son evidencia de ejecuciones históricas, no garantía del último commit. Para validar cambios, ejecutar las suites de `server/TESTING.md` y Playwright en una base aislada.
