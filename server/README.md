# LogiTrans — Backend Server

Sistema backend para gestión logística, construido con **NestJS**, **TypeORM** y **PostgreSQL**, siguiendo **Clean Architecture** (DDD 4 capas).

> Quick start
```bash
docker-compose down -v 
cd ./server && docker compose down -v && cd ..
docker-compose up -d db
cd server
npm install
npm run seed
npm run start:dev
```


---

## Requisitos Previos

| Herramienta | Versión mínima |
|---|---|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | 24+ |
| Node.js (solo desarrollo local) | 20+ |
| npm | 10+ |

---

## Levantar en Desarrollo (modo recomendado)

Este es el flujo que usa el equipo actualmente.

### Paso 1 — Variables de entorno

```bash
cp .env.example .env
```

Edita `.env` si necesitas cambiar la clave JWT o los datos de Resend:

```env
# Mínimo para desarrollo local
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=logitrans_db
DB_AUTO_SEED=true

PORT=3000
NODE_ENV=development
JWT_SECRET=dev_secret_cambiame_en_prod

# Email — Resend (obtén tu key en https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
SES_FROM_EMAIL=onboarding@resend.dev   # Solo para testing sin dominio verificado
SES_FROM_NAME=LogiTrans
PORTAL_URL=http://localhost:3001
```

### Paso 2 — Levantar solo la base de datos

```bash
docker-compose up -d db
```

Esto levanta `logitrans_db` en el puerto **5432**.

### Paso 3 — Instalar dependencias y arrancar la API

```bash
npm install
npm run start:dev
```

Al arrancar, el backend hace automáticamente:
1. Crea la base `logitrans_db` si no existe.
2. Aplica el esquema canónico desde `../db/logitrans_postgresql.sql`.
3. Ejecuta el seed con clientes, contratos, sesiones, órdenes, facturas y pagos.

La API queda disponible en **http://localhost:3000**.

> **Reset del schema** (si la DB tiene datos viejos incompatibles):
> ```bash
> DB_RESET_ON_BOOT=true npm run start:dev
> ```

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Modo watch con hot-reload |
| `npm run start:prod` | Producción (requiere `npm run build` previo) |
| `npm run build` | Compila TypeScript a `dist/` |
| `npm run lint` | ESLint con auto-fix |
| `npm run format` | Prettier sobre `src/` |
| `npm test` | Tests unitarios (Jest) |
| `npm run test:e2e` | Tests end-to-end |

---

## Levantar en Producción (on-premise simulado con Docker)

```bash
# 1. Configurar variables de producción
cp .env.example .env.production
nano .env.production   # Cambiar DB_PASSWORD, JWT_SECRET, RESEND_API_KEY, CORS_ORIGINS

# 2. Desplegar todo (Nginx + 2 instancias API + DB + frontend)
cd ..
./scripts/deploy.sh
```

El script levanta:
- **Nginx** en `:80` (redirige a HTTPS) y `:443` (SSL auto-generado)
- **api-1** y **api-2** (NestJS, balanceo por least-connections)
- **logitrans_db** (PostgreSQL 15, volumen persistente)
- **client** (Next.js frontend)

Verificar:
```bash
docker-compose -f docker-compose.prod.yml ps
curl https://localhost/health --insecure
```

---

## Arquitectura del proyecto (Clean Architecture — 4 capas)

```
src/
├── domain/               # Enums, interfaces de repositorio — sin dependencia de frameworks
├── application/          # Casos de uso — lógica de negocio pura
├── infrastructure/       # TypeORM entities, repos concretos, DB config, seeds
├── presentation/         # Controllers NestJS — solo HTTP, sin lógica de negocio
│
├── auth/                 # Módulo de autenticación (ver sección Auth)
├── operations/           # Módulo de Agente Operativo
├── notifications/        # Servicio de email con Resend (ver sección Email)
└── health/               # GET /health — monitoreo
```

Cada módulo de negocio replica esta misma estructura internamente:
```
<módulo>/
├── domain/repositories/   # Interfaces (contratos)
├── application/use-cases/ # Casos de uso — un archivo por operación
├── infrastructure/repositories/ # Implementaciones TypeORM
└── presentation/
    ├── controllers/
    └── dtos/
```

---

## Módulo de Autenticación (`/api/auth`)

Todos los endpoints son públicos salvo `/logout`.

| Método | Endpoint | Descripción |
|---|---|---|
| `POST` | `/api/auth/login` | Login con email + password. Devuelve JWT y setea cookie `sessionToken`. |
| `POST` | `/api/auth/refresh` | Renueva el JWT usando la cookie `sessionToken`. |
| `POST` | `/api/auth/logout` | Revoca la sesión. Requiere JWT válido. |
| `POST` | `/api/auth/recovery` | Envía email de recuperación de contraseña (Resend). |
| `POST` | `/api/auth/password` | Establece nueva contraseña con el token del email. |

### Ejemplo — Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"agente@logitrans.com","password":"mi_clave"}'
```

Respuesta:
```json
{
  "message": "Usuario logueado",
  "data": {
    "userId": "...",
    "sessionUuid": "...",
    "role": "AGENTE_OPERATIVO",
    "fullName": "...",
    "token": "eyJhbG..."
  }
}
```

### Doble token de sesión

| Token | Ubicación | Duración | Uso |
|---|---|---|---|
| **JWT** | `Authorization: Bearer <token>` | 1 día | Autenticar llamadas a la API |
| **sessionToken** | Cookie `httpOnly` | 30 días | Renovar el JWT sin re-login |

### Proteger un endpoint

```typescript
@Get('mi-recurso')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(USER_ROLE.AGENTE_OPERATIVO)
async miEndpoint(@CurrentUser() user: JwtPayload) {
  // user.sub, user.email, user.role, user.fullName, user.sessionUuid
}
```

---

## Servicio de Email — Resend (`NotificationsModule`)

El módulo `notifications/` encapsula todo el envío de email. Los módulos de negocio **no importan Resend directamente**, solo inyectan `EmailService`.

### Templates disponibles

| Método | Cuándo usarlo |
|---|---|
| `emailService.sendWelcome(...)` | Alta de usuario cliente en el portal |
| `emailService.sendPasswordRecovery(...)` | Recuperación de contraseña |
| `emailService.sendContractProposal(...)` | Nueva propuesta de contrato al cliente |
| `emailService.sendInvoice(...)` | Envío de factura certificada al cliente |

### Cómo usar en un nuevo módulo

```typescript
// 1. Importar NotificationsModule en tu módulo
@Module({
  imports: [NotificationsModule],
  providers: [MiUseCase],
})
export class MiModulo {}

// 2. Inyectar EmailService en el use-case
@Injectable()
export class MiUseCase {
  constructor(private readonly emailService: EmailService) {}

  async execute() {
    // Fire-and-forget — no bloquea la respuesta
    this.emailService
      .sendWelcome({ to: 'cliente@empresa.com', clientName: 'ACME', ... })
      .catch((err) => this.logger.error(err.message));
  }
}
```

### Configuración de Resend

1. Crear cuenta en [resend.com](https://resend.com) y obtener una API Key.
2. Agregar al `.env`:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
   SES_FROM_EMAIL=noreply@tudominio.com   # Dominio verificado en Resend
   SES_FROM_NAME=LogiTrans
   PORTAL_URL=https://tudominio.com
   ```
3. **Desarrollo sin dominio verificado**: usar `onboarding@resend.dev` como `SES_FROM_EMAIL`. Solo enviará a la dirección de tu cuenta Resend.

---

## Endpoint de referencia con email — `POST /api/operations/contracts`

Este endpoint implementa el patrón completo: **transacción multi-tabla + email post-commit**.

```bash
# Primero autentícate como AGENTE_OPERATIVO
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"operativo@logitrans.com","password":"mi_clave"}' \
  | jq -r '.data.token')

# Crear contrato
curl -X POST http://localhost:3000/api/operations/contracts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "clientId": "<uuid-del-cliente>",
    "creditLimit": 50000.00,
    "paymentTermDays": 30,
    "discountPercentage": 5.0,
    "routeIds": [1, 2],
    "cargoTypeIds": [1]
  }'
```

Respuesta:
```json
{
  "message": "Contrato generado correctamente",
  "data": {
    "contractId": "...",
    "contractNumber": "CONT-00001",
    "status": "PENDIENTE"
  }
}
```

Al ejecutarse, el sistema:
1. Valida que el cliente exista.
2. Abre una transacción y crea `CONTRACTS` + `CONTRACT_ROUTES` + `CONTRACT_CARGO_TYPES`.
3. Confirma la transacción.
4. Envía el email de propuesta al `primaryContactEmail` del cliente vía Resend (**fire-and-forget** — un fallo de email no revierte el contrato).

---

## Crear un nuevo módulo — checklist

Sigue el patrón de `auth/` o `operations/`:

```
src/mi-modulo/
├── mi-modulo.module.ts
├── domain/repositories/
│   └── mi-entidad.repository.interface.ts   # Interfaz + Symbol token
├── application/use-cases/
│   └── mi-operacion.use-case.ts             # @Injectable, @Inject(TOKEN)
├── infrastructure/repositories/
│   └── mi-entidad.repository.ts             # implements la interfaz
└── presentation/
    ├── controllers/mi-modulo.controller.ts
    └── dtos/mi-operacion.dto.ts
```

Checklist:
- [ ] Registrar el módulo en `app.module.ts → imports[]`
- [ ] Importar `NotificationsModule` si el módulo envía emails
- [ ] Usar `import type { ImiRepo }` para interfaces en constructores decorados (`isolatedModules`)
- [ ] Los controllers deben tener `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(...)`
- [ ] Los use-cases usan `DataSource` directamente para transacciones multi-entidad

---

## Roles disponibles

| Rol | Módulo de API |
|---|---|
| `CLIENTE` | `/api/client/*` |
| `AGENTE_OPERATIVO` | `/api/operations/*` |
| `AGENTE_LOGISTICO` | `/api/logistics/*` |
| `ENCARGADO_PATIO` | `/api/patio/*` |
| `PILOTO` | `/api/pilot/*` |
| `AGENTE_FINANCIERO` | `/api/finance/*` |
| `GERENCIA` | `/api/bi/*` |
| `ADMIN` | Sin restricción de módulo |

---

## Health check

```bash
curl http://localhost:3000/health
# {"status":"ok","database":"connected"}
```

En producción: `https://localhost/health --insecure`
