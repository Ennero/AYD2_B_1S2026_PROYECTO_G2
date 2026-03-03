# LogiTrans — Sistema de Gestión Logística y Transporte

> **Curso:** Análisis y Diseño de Sistemas 2 — Sección B, 1S 2026
> **Grupo:** 2

---

## Descripción del Proyecto

**LogiTrans** es una plataforma integral de gestión logística y transporte de carga diseñada para operar en múltiples sedes (Ciudad de Guatemala, Xela y Puerto Barrios). El sistema cubre el ciclo de vida completo del negocio de transporte, desde la negociación comercial y formalización de contratos digitales, pasando por la generación de órdenes de servicio, planificación logística, despacho en patio y monitoreo de viajes, hasta la facturación electrónica (FEL) certificada ante la SAT y la inteligencia de negocio gerencial.

### Módulos Principales

| Módulo | Descripción |
|--------|-------------|
| **CDU001 — Gestión Comercial y Contratos** | Registro de clientes, validación de NIT, gestión de tarifas, formalización de contratos digitales y validación de riesgo crediticio. |
| **CDU002 — Gestión de Órdenes y Transporte** | Generación de órdenes, asignación de recursos (piloto/vehículo), despacho en patio, bitácora de viaje y confirmación de entrega con evidencia. |
| **CDU003 — Gestión Financiera y Facturación** | Emisión de facturas FEL, certificación DTE ante SAT, gestión de estados de cuenta y conciliación de pagos. |
| **CDU004 — Inteligencia de Negocio y Reportes** | Dashboard gerencial con KPIs, alertas de desviaciones y proyección de capacidad operativa. |

### Stack Tecnológico

- **Arquitectura:** Monolito Modular Contenerizado
- **Backend:** API REST modular por dominio
- **Frontend:** SPA (Single Page Application)
- **Base de Datos:** PostgreSQL con replicación activo-pasivo
- **Contenedores:** Docker
- **Seguridad:** RBAC + JWT (Short-Lived Tokens)
- **Protocolo:** HTTP/2 sobre TLS
- **Infraestructura:** On-premise con diseño Cloud-Ready
- **Control de versiones:** Git-Flow

---

## Integrantes del Equipo

| Carné | Nombre | Rol Scrum | Responsabilidad Técnica Principal |
|-------|--------|-----------|-----------------------------------|
| 202302220 | Enner Esaí Mendizabal Castro | Scrum Master | Base de datos / DDA |
| 201807398 | Anyelo Gustavo Hernández Ayala | Product Owner | Backend — Gestión de Órdenes |
| 202004071 | Henry David Quel Santos | Development Team | Frontend / Testing E2E |
| 202200214 | Pablo Alejandro Marroquin Cutz | Development Team | Backend — BI y Reportes |
| 202202410 | Marcos Daniel Bonifasi de León | Development Team | Backend — Facturación |
| 202300670 | David Estuardo Barrios Ramírez | Development Team | Frontend |

---

## Documentación

Toda la documentación técnica del proyecto se encuentra en la carpeta [`docs/`](docs/):

| Documento | Descripción | Enlace |
|-----------|-------------|--------|
| **Arquitectura del Sistema** | Diagramas de contexto, bloques, componentes y despliegue. Estilo arquitectónico, decisiones clave e infraestructura. | [architecture.md](docs/architecture.md) |
| **Documento de Decisión de Arquitectura (DDA)** | Caso de negocio, stakeholders, requisitos funcionales (RF), requisitos no funcionales (RNF), historias de usuario (HU), escenarios de calidad (EAC), restricciones y matrices de trazabilidad. | [dda.md](docs/dda.md) |
| **Justificación de Decisiones Arquitectónicas (ADR)** | Justificación detallada de las 7 decisiones arquitectónicas: Monolito Modular Docker, PostgreSQL, API Gateway + Balanceador, RBAC + Auditoría, Git-Flow, HTTP/2 y JWT. | [adr.md](docs/adr.md) |
| **Gestión Ágil (Scrum)** | Roles del equipo, división del trabajo por módulo, sprints, ceremonias (plannings, dailys, retrospectivas) y métricas del proyecto. | [scrum-management.md](docs/scrum-management.md) |
| **Diagramas de Arquitectura** | Diagramas en formato imagen (PNG/JPG) y PDF editables. | [docs/imgs/architecture/](docs/imgs/architecture/) — [docs/architecture/](docs/architecture/) |
| **Diagramas de Casos de Uso** | Diagramas de alto nivel, primera descomposición y CDUs individuales. | [docs/imgs/dda/](docs/imgs/dda/) — [docs/cdu/](docs/cdu/) |

---

## Inicio Rápido

> _Esta sección se completará cuando inicie la fase de desarrollo (Fase 2)._

### Prerrequisitos

<!-- TODO: Agregar versiones específicas cuando se defina el stack -->

- Docker y Docker Compose
- Node.js
- PostgreSQL

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/<org>/AYD2_B_1S2026_PROYECTO_G2.git
cd AYD2_B_1S2026_PROYECTO_G2

# Levantar los servicios con Docker
# docker-compose up -d

# Instalar dependencias del frontend
# cd client && npm install

# Instalar dependencias del backend
# cd server && npm install
```

### Ejecución

```bash
# TODO: Agregar comandos de ejecución
```

### Variables de Entorno

```bash
# TODO: Documentar variables de entorno necesarias
```

---

## Estructura del Proyecto

```
AYD2_B_1S2026_PROYECTO_G2/
├── client/                  # Frontend (SPA)
├── server/                  # Backend (API REST modular)
├── docs/                    # Documentación técnica
│   ├── architecture.md      # Arquitectura del sistema
│   ├── dda.md               # Documento de decisión de arquitectura
│   ├── adr.md               # Justificación de decisiones
│   ├── scrum-management.md  # Gestión ágil
│   ├── architecture/        # PDFs editables de diagramas de arquitectura
│   ├── cdu/                 # PDFs editables de casos de uso
│   └── imgs/                # Imágenes de diagramas
│       ├── architecture/    # Diagramas de arquitectura (PNG/JPG)
│       └── dda/             # Diagramas de casos de uso (PNG)
├── LICENSE
└── README.md
```

---

**Fecha de última actualización:** 2 de marzo de 2026
**Equipo:** Grupo 2 — Análisis y Diseño de Sistemas 2, Sección B