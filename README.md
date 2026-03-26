# LogiTrans - Sistema de Gestion Logistica y Transporte

> Curso: Analisis y Diseno de Sistemas 2 - Seccion B, 1S 2026  
> Grupo: 2

## Resumen

LogiTrans implementa el flujo operativo completo de transporte de carga:

1. Gestion comercial y contratos.
2. Registro y asignacion de ordenes.
3. Operacion de patio y despacho.
4. Seguimiento de viaje con bitacora y evidencias.
5. Facturacion y certificacion FEL.
6. Conciliacion de pagos y analitica gerencial.

El estado esperado de facturas durante el happy path es:

`BORRADOR -> CERTIFICADA -> ENVIADA -> PAGADA`

## Arquitectura y Stack

- Backend: NestJS modular (API REST).
- Frontend: Next.js (App Router).
- Base de datos: PostgreSQL 15.
- Contenedores: Docker / Docker Compose.
- Seguridad: JWT + RBAC.
- Proxy/LB productivo: Nginx con SSL y balanceo hacia multiples APIs.

## Inicio Rapido (entorno del proyecto)

Este flujo levanta todo el sistema principal con un solo comando usando [docker-compose.yml](docker-compose.yml).

### 1) Prerrequisitos

- Docker Desktop instalado y ejecutandose.
- Docker Compose disponible (`docker compose` o `docker-compose`).

### 2) Levantar el proyecto completo

```bash
git clone https://github.com/<org>/AYD2_B_1S2026_PROYECTO_G2.git
cd AYD2_B_1S2026_PROYECTO_G2

docker-compose down -v --rmi all
docker-compose up -d --build
```

### 3) Verificar servicios

```bash
docker-compose ps
docker-compose logs --no-color server | tail -n 200
docker-compose logs --no-color client | tail -n 200
```

### 4) URLs principales

- Frontend: http://localhost:3000
- API (NestJS): http://localhost:3006
- Health endpoint: http://localhost:3006/health
- PostgreSQL: localhost:5433

## Despliegue Completo y Operacion

Para despliegue detallado (local, productivo, variables, SSL, replica, validaciones, troubleshooting y operacion), consultar:

- [Guia profunda de despliegue](docs/despliegue.md)

Tambien esta disponible la guia productiva historica:

- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Documentacion Clave

Documentacion funcional, tecnica y de arquitectura en [docs/](docs/):

- [Happy Path con evidencia visual](docs/happypath.md)
- [Accesos por rol para pruebas MVP](docs/mvp_accessos_usuarios.md)
- [Arquitectura](docs/architecture.md)
- [DDA](docs/dda.md)
- [ADR](docs/adr.md)
- [Gestion Scrum](docs/scrum-management.md)
- [Tablas y endpoints](docs/endpoint_tables.md)

## Estructura General

```text
AYD2_B_1S2026_PROYECTO_G2/
|- client/        # Frontend Next.js
|- server/        # Backend NestJS
|- db/            # Scripts y esquema SQL
|- nginx/         # Reverse proxy y SSL
|- scripts/       # Automatizaciones (deploy, etc.)
|- docs/          # Documentacion funcional y tecnica
|- docker-compose.yml
|- docker-compose.prod.yml
`- README.md
```

## Equipo

| Carne | Nombre | Rol Scrum | Responsabilidad Principal |
|---|---|---|---|
| 202302220 | Enner Esai Mendizabal Castro | Scrum Master | Base de datos / DDA |
| 201807398 | Anyelo Gustavo Hernandez Ayala | Product Owner | Backend - Ordenes |
| 202004071 | Henry David Quel Santos | Development Team | Frontend / Testing E2E |
| 202200214 | Pablo Alejandro Marroquin Cutz | Development Team | Backend - BI y Reportes |
| 202202410 | Marcos Daniel Bonifasi de Leon | Development Team | Backend - Facturacion |
| 202300670 | David Estuardo Barrios Ramirez | Development Team | Frontend |

## Nota de Version

Ultima actualizacion documental: 25 de marzo de 2026.