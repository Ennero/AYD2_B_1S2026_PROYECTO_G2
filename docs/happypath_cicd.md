# Happypath CI/CD Workflow con Github Actions

## Tabla de Contenidos

1. [¿Qué es CI/CD y por qué importa?](#1-qué-es-cicd-y-por-qué-importa)
2. [Estructura de ramas](#2-estructura-de-ramas)
3. [Visión general de los workflows](#3-visión-general-de-los-workflows)
4. [Workflow 1 — Build & Test](#4-workflow-1--build--test)
5. [Workflow 2 — Deploy](#5-workflow-2--deploy)
6. [Workflow 3 — Validate source branch](#6-workflow-3--validate-source-branch)
7. [Flujo completo de extremo a extremo](#7-flujo-completo-de-extremo-a-extremo)
7. [Infraestructura AWS utilizada](#7-infraestructura-aws-utilizada)
8. [Secrets configurados en GitHub](#8-secrets-configurados-en-github)

---

## 1. ¿Qué es CI/CD y por qué importa?

**CI (Integración Continua):** cada vez que un desarrollador propone un cambio, el sistema lo compila y ejecuta los tests automáticamente. Si algo falla, el cambio no puede avanzar.

**CD (Despliegue Continuo):** una vez que el código está validado y aprobado, se construyen las imágenes Docker y se despliegan en producción de forma automática, sin intervención manual.

El beneficio concreto para LogiTrans:
- Nadie puede mergear código roto a `main` — los tests lo bloquean.
- Nadie puede olvidarse de desplegar — el push a `production` lo hace automáticamente.
- Cada imagen desplegada tiene el SHA del commit como tag — siempre se sabe exactamente qué versión está corriendo en producción.

---

## 2. Estructura de ramas

```
feature/* ──→ main ──→ production
                ↑            ↑
           Build & Test    Deploy
           (en cada PR)  (en cada push)
```

| Rama | Propósito |
|------|-----------|
| `feature/*` | Desarrollo de funcionalidades individuales |
| `main` | Código validado y listo para producción |
| `production` | Lo que está corriendo en AWS ahora mismo |

La separación es intencional: `main` es la fuente de verdad del código aprobado, `production` es el trigger del despliegue. Para que algo llegue a `production`, primero tuvo que pasar por el gate de `main`.

---

## 3. Visión general de los workflows

El proyecto tiene dos workflows en `.github/workflows/`:

| Archivo | Nombre | Se dispara en |
|---------|--------|---------------|
| `github-actions-colibri.yml` | `Build & Test` | PR hacia `main` |
| `deploy.yml` | `Deploy` | Push a `production` |
| `validate-production-source.yml` | `Validate source branch` | PR hacia `production` |

Cada uno tiene una responsabilidad única y no se solapan.

---

## 4. Workflow 1 — Build & Test

**Archivo:** `.github/workflows/github-actions-colibri.yml`
**Trigger:** cualquier Pull Request que apunte a la rama `main`
**Propósito:** ser la puerta de calidad — ningún código llega a `main` sin pasar por aquí

### Jobs y orden de ejecución

```
PR abierto hacia main
        ↓
build-server ──┐
               ├──→ test-unit ──→ test-integration
build-client ──┘
```

Los dos builds corren **en paralelo** porque son independientes. Los tests son **secuenciales** porque los de integración dependen de que los unitarios pasen primero.

---

### Job 1: `build-server` — Compilar el backend NestJS

**Corre en:** `ubuntu-latest`
**Node.js:** versión 22

```
1. Checkout del código
2. Setup Node.js 22 + caché de dependencias (package-lock.json)
3. npm ci               → instalación limpia y reproducible
4. npm run lint         → ESLint: si hay errores de estilo o código, el PR se bloquea
5. npm run build        → tsc: compila TypeScript a JavaScript, detecta errores de tipos
```

**Por qué Node 22 para el server:** la imagen Docker del servidor también usa Node 22 (`server/Dockerfile`). Se usa la misma versión en CI para garantizar paridad entre el entorno de build y el de producción.

**Por qué `npm ci` y no `npm install`:** `npm ci` instala exactamente lo que está en `package-lock.json` sin modificarlo. Garantiza builds reproducibles — el mismo código produce el mismo resultado en cualquier máquina.

---

### Job 2: `build-client` — Compilar el frontend Next.js

**Corre en:** `ubuntu-latest`
**Node.js:** versión 20
**Necesita:** nada (corre en paralelo con `build-server`)

```
1. Checkout del código
2. Setup Node.js 20 + caché de dependencias
3. npm ci
4. npm run lint
5. npm run build        → next build (con NEXT_PUBLIC_API_URL inyectada)
```

**Por qué se inyecta `NEXT_PUBLIC_API_URL` en build time:** Next.js bake las variables de entorno que empiezan con `NEXT_PUBLIC_` dentro del bundle de JavaScript en tiempo de compilación. Sin este valor, el frontend no sabe a qué URL apuntar para hacer las llamadas a la API.

---

### Job 3: `test-unit` — Pruebas unitarias

**Corre en:** `ubuntu-latest`
**Necesita:** `build-server` Y `build-client` (ambos deben haber pasado)

```
1. Checkout del código
2. Setup Node.js 22
3. npm ci
4. npm run test         → Jest: pruebas unitarias sin base de datos
```

Las pruebas unitarias verifican cada función y servicio en aislamiento, sin conexión a PostgreSQL ni servicios externos. Son las más rápidas del pipeline.

---

### Job 4: `test-integration` — Pruebas de integración con PostgreSQL real

**Corre en:** `ubuntu-latest`
**Necesita:** `test-unit` (debe haber pasado primero)

Este es el job más complejo. Levanta un contenedor de PostgreSQL como service de GitHub Actions — una base de datos real que vive únicamente durante la ejecución de este job.

**Service de PostgreSQL:**
```yaml
postgres:
  image: postgres:15-alpine
  POSTGRES_USER: postgres
  POSTGRES_PASSWORD: postgres_test
  POSTGRES_DB: logitrans_test
  puerto: 5432
  healthcheck: pg_isready cada 10s
```

El job no arranca hasta que el healthcheck de PostgreSQL confirma que la DB está lista.

**Variables de entorno inyectadas:**

| Variable | Valor |
|----------|-------|
| `DB_HOST` | `localhost` |
| `DB_AUTO_SEED` | `true` — el seed corre automáticamente al iniciar |
| `NODE_ENV` | `test` |
| `MOCK_SMTP` | `true` — los emails no se envían realmente |
| `JWT_SECRET` | desde GitHub Secrets |
| `RESEND_API_KEY` | desde GitHub Secrets |
| `SUPABASE_URL` | desde GitHub Secrets |
| `SUPABASE_SERVICE_KEY` | desde GitHub Secrets |

```
1. Checkout del código
2. Setup Node.js 22
3. npm ci
4. npm run test:integration   → Jest + SuperTest: HTTP real contra servidor real con DB real
```

**Por qué `MOCK_SMTP=true`:** las pruebas de integración no deben enviar emails reales a usuarios. Esta flag hace que el módulo de Resend no haga llamadas externas durante los tests.

---

## 5. Workflow 2 — Deploy

**Archivo:** `.github/workflows/deploy.yml`
**Trigger:** push directo a la rama `production`
**Propósito:** construir las imágenes Docker y desplegarlas en AWS ECS sin downtime

### Jobs y orden de ejecución

```
push a production
        ↓
build-image-server ──┐
                     ├──→ deploy-server
build-image-client ──┤
                     └──→ deploy-client
```

Los dos builds corren **en paralelo**. Los dos deploys esperan a que **ambas imágenes estén listas** y luego también corren en paralelo.

---

### Job 1: `build-image-server` — Construir y publicar imagen del backend

```
1. Checkout del código
2. Autenticación en AWS (con Access Key ID y Secret)
3. Login en Amazon ECR (registro privado de imágenes)
4. docker build -f server/Dockerfile -t <ECR_URL>/<REPO>:<SHA> .
5. docker push → imagen publicada en ECR
```

**Por qué el contexto de build es `.` (raíz) y no `./server`:** el `server/Dockerfile` usa un build multi-stage que necesita copiar archivos de la carpeta `db/` que está en la raíz del proyecto. Si el contexto fuera solo `./server`, Docker no podría acceder a esa carpeta.

**Por qué el tag es `${{ github.sha }}`:** el SHA del commit (ej: `a3f9c12...`) es único e inmutable. Esto permite saber exactamente qué commit está corriendo en producción en cualquier momento, y hacer rollback a cualquier versión anterior simplemente cambiando el tag.

---

### Job 2: `build-image-client` — Construir y publicar imagen del frontend

```
1. Checkout del código
2. Autenticación en AWS
3. Login en ECR
4. docker build -f client/Dockerfile
              --build-arg NEXT_PUBLIC_API_URL=<URL>
              -t <ECR_URL>/<REPO>:<SHA>
              ./client
5. docker push → imagen publicada en ECR
```

**Por qué `NEXT_PUBLIC_API_URL` va como build arg y no como env var en runtime:** Next.js reemplaza estas variables en tiempo de compilación dentro del bundle JavaScript. Una vez compilado, el bundle ya tiene la URL hardcodeada. No se puede cambiar en runtime sin recompilar.

---

### Job 3: `deploy-server` — Desplegar backend en ECS

**Necesita:** `build-image-server` Y `build-image-client`

```
1. Autenticación en AWS
2. Descargar la task definition actual de ECS (JSON con la config del contenedor)
3. Generar nueva task definition con la nueva imagen (mismo JSON, nueva URL de imagen)
4. Rolling update en ECS (aws ecs deploy)
5. Esperar a que el servicio esté estable (wait-for-service-stability: true)
```

**Qué es una task definition:** es el JSON que le dice a ECS qué imagen Docker correr, cuánta CPU y RAM asignar, qué variables de entorno inyectar (desde AWS SSM), y cómo configurar los logs en CloudWatch.

**Qué es un rolling update:** ECS va reemplazando las tasks (contenedores) viejas por las nuevas de forma gradual. En ningún momento el servicio queda sin instancias corriendo — hay downtime cero.

**Por qué esperar `wait-for-service-stability`:** sin esta flag, el job terminaría en verde tan pronto como ECS acepta la nueva task definition, aunque los contenedores nuevos aún no hayan arrancado. Con esta flag, el job solo termina (exitosamente) cuando ECS confirma que las nuevas tasks están healthy y las viejas fueron terminadas.

---

### Job 4: `deploy-client` — Desplegar frontend en ECS

Sigue exactamente el mismo patrón que `deploy-server` pero para el servicio Next.js. Corre en paralelo con el deploy del servidor.

---

## 6. Workflow 3 — Validate source branch

**Archivo:** `.github/workflows/validate-production-source.yml`
**Trigger:** cualquier Pull Request que apunte a la rama `production`
**Propósito:** garantizar que solo se pueda mergear a `production` desde `main`, bloqueando cualquier PR que venga de otra rama

### Por qué es necesario

GitHub no tiene una opción nativa que restrinja la rama de origen de un PR. Sin este workflow, cualquier desarrollador podría abrir un PR desde `feature/algo` directamente a `production`, saltándose el gate de `main` (y por tanto los tests de CI).

### Cómo funciona

```yaml
on:
  pull_request:
    branches: [production]
```

Se dispara en cada PR hacia `production`. El job `check-source` evalúa `github.head_ref` — la rama de origen del PR:

- Si la rama de origen **no es `main`** → el step falla con `exit 1` y muestra el nombre de la rama incorrecta
- Si la rama de origen **es `main`** → el step confirma que el merge está permitido

```
PR desde feature/x → production   ❌  exit 1 — bloqueado
PR desde develop   → production   ❌  exit 1 — bloqueado
PR desde main      → production   ✅  merge permitido
```

### Activar el bloqueo en GitHub

Para que este workflow realmente bloquee el merge (y no sea solo informativo), hay que registrar el status check en las Branch Protection Rules de `production`:

1. `GitHub → repositorio → Settings → Branches → Add ruleset`
2. **Branch name pattern:** `production`
3. Activar **Require status checks to pass before merging**
4. Agregar el check: `Only allow merges from main`
5. Activar **Require a pull request before merging** — prohíbe push directo a `production`
6. Guardar

Con esto configurado, el botón de merge queda bloqueado en cualquier PR a `production` que no venga de `main`.

---

## 7. Flujo completo de extremo a extremo

```
Desarrollador abre PR feature/nueva-funcionalidad → main
        ↓
GitHub Actions dispara Build & Test
        ↓
[build-server] [build-client]   ← en paralelo (~2 min)
        ↓
[test-unit]                     ← unitarios (~1 min)
        ↓
[test-integration]              ← integración con DB (~3 min)
        ↓
✓ Todos los checks verdes → PR puede ser mergeado
        ↓
Merge a main
        ↓
(revisión, QA, decisión de release)
        ↓
Merge main → production
        ↓
GitHub Actions dispara Deploy
        ↓
[build-image-server] [build-image-client]   ← en paralelo (~5 min)
        ↓
[deploy-server] [deploy-client]             ← en paralelo (~3 min)
        ↓
✓ ECS estable → nueva versión corriendo en producción
```

**Tiempo total aproximado:**
- PR gate (Build & Test): ~6 minutos
- Deploy a producción: ~8 minutos

---

## 7. Infraestructura AWS utilizada

| Servicio | Rol en el pipeline |
|----------|--------------------|
| **ECR** (Elastic Container Registry) | Almacena las imágenes Docker con tag por SHA de commit |
| **ECS Fargate** | Orquesta los contenedores — recibe las nuevas task definitions y hace el rolling update |
| **SSM Parameter Store** | Guarda los secrets (JWT, DB password, API keys) — se inyectan en los contenedores en runtime sin exponerlos en el código |
| **CloudWatch Logs** | Recibe los logs de los contenedores ECS |
| **ALB** (Application Load Balancer) | Distribuye el tráfico entre las instancias del servidor durante el rolling update |

---

## 8. Secrets configurados en GitHub

Configurados en **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Dónde se usa |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | Autenticación en AWS (ambos workflows) |
| `AWS_SECRET_ACCESS_KEY` | Autenticación en AWS (ambos workflows) |
| `AWS_REGION` | Región de los recursos AWS |
| `ECR_REPOSITORY_SERVER` | Nombre del repo ECR del backend |
| `ECR_REPOSITORY_CLIENT` | Nombre del repo ECR del frontend |
| `ECS_CLUSTER` | Nombre del cluster ECS |
| `ECS_SERVICE_SERVER` | Nombre del servicio ECS del backend |
| `ECS_SERVICE_CLIENT` | Nombre del servicio ECS del frontend |
| `ECS_TASK_DEF_SERVER` | Family name de la task definition del backend |
| `ECS_TASK_DEF_CLIENT` | Family name de la task definition del frontend |
| `NEXT_PUBLIC_API_URL` | URL del API inyectada en el bundle de Next.js |
| `APP_DOMAIN` | Dominio de producción (ej: `guatechnology.com`) |
| `JWT_SECRET` | Secret para firmar tokens JWT (usado en tests de integración) |
| `RESEND_API_KEY` | API key de Resend (usado en tests de integración) |
| `SUPABASE_URL` | URL del proyecto Supabase (usado en tests de integración) |
| `SUPABASE_SERVICE_KEY` | Service key de Supabase (usado en tests de integración) |
