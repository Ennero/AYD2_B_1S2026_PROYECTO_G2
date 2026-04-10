# Despliegue

## Cloud Services

| Servicio | Rol |
|---|---|
| **AWS ECR** | Registro privado de imágenes Docker (server + client) |
| **AWS ECS Fargate** | Orquestador serverless de containers — corre las tasks sin gestionar EC2 |
| **AWS ALB** | Application Load Balancer gestionado — distribuye tráfico entre tasks, termina SSL |
| **AWS ACM** | Certificado SSL/TLS gratuito asociado al ALB |
| **AWS Route 53** | DNS: dominio → ALB |
| **AWS SSM Parameter Store** | Secrets (JWT, API keys, DB) inyectados como env vars en los containers |
| **AWS CloudWatch Logs** | Logs de los containers ECS |
| **Supabase** | PostgreSQL + Storage de archivos |
| **GitLab CI/CD** | Pipelines CI/CD (reemplaza GitHub Actions) |
| **EC2 t3.medium** | GitLab Runner self-hosted con Docker executor e IAM Role |
| **Resend** | Envío de emails a demanda |


## Arquitectura de Despliegue

```
Internet
  ↓
Route 53 → ALB (HTTPS/443, ACM cert)
              ├── /api/* → Target Group: logitrans-server-tg
              │              └── ECS Service: logitrans-server
              │                    ├── Fargate Task 1 (NestJS :3000)
              │                    └── Fargate Task 2 (NestJS :3000)
              │                    Auto Scaling: min 2, max 6 (CPU > 70%)
              │
              └── /*     → Target Group: logitrans-client-tg
                             └── ECS Service: logitrans-client
                                   └── Fargate Task (Next.js :3000)

Cluster: logitrans-cluster (ECS Fargate)
Secrets: AWS SSM Parameter Store → inyectados en containers vía ecsTaskExecutionRole
DB/Storage: Supabase (externo)
MQ: RabbitMQ (ECS service o CloudAMQP)
```


## Uso de CI/CD con GitLab

Pipeline definido en `.gitlab-ci.yml` en la raíz del repositorio.
Runner: EC2 t3.medium self-hosted, executor Docker, con IAM Role (sin credenciales hardcoded).

### Stages del pipeline

| Stage | Jobs | Se ejecuta en |
|---|---|---|
| `lint` | lint:server, lint:client | Todo push / MR |
| `test` | test:unit, test:integration | Todo push / MR |
| `build` | build:server, build:client → ECR | Solo rama `main` |
| `deploy` | deploy:server, deploy:client → ECS rolling | Solo rama `main` |
| `post-deploy` | e2e (Playwright), k6-load, k6-stress | Manual, post-deploy |

**Regla crítica:** No se hace deploy si lint o tests fallan (`*No se debe hacer deploy si las pruebas no pasan*`).

### Flujo completo

```
git push → main
  ↓ lint (ESLint server + client)
  ↓ test:unit (Jest sin DB)
  ↓ test:integration (Jest + SuperTest + PostgreSQL service container)
  ↓ build:server (docker build → ECR, tag: $CI_COMMIT_SHA + latest)
  ↓ build:client (docker build --build-arg NEXT_PUBLIC_API_URL → ECR)
  ↓ deploy:server (registrar nueva task def + update ECS service + wait stable)
  ↓ deploy:client (registrar nueva task def + update ECS service + wait stable)
  ↓ [manual] post-deploy:e2e → k6-load → k6-stress
```


## Docker

Docker se usa tanto en Backend como en Frontend, incluido en el proceso de CI/CD.

Permite crear, desplegar y gestionar aplicaciones en contenedores — entornos aislados que incluyen todo lo necesario para que la aplicación funcione. A diferencia de las máquinas virtuales, los contenedores son más livianos y arrancan más rápido al compartir el núcleo del SO subyacente. Garantizan que la aplicación funcione de manera idéntica en desarrollo, pruebas y producción.

Dockerfiles del proyecto:
- `server/Dockerfile` — multi-stage Node 22 Alpine; contexto de build es la raíz (`.`) porque copia `db/`
- `client/Dockerfile` — multi-stage Node 20 Alpine; contexto `./client`, acepta `NEXT_PUBLIC_API_URL` como build arg

Task definitions ECS: `aws/task-definitions/server.json`, `aws/task-definitions/client.json`


## Variables de GitLab CI/CD

Configurar en **GitLab → Settings → CI/CD → Variables** (Protected + Masked):

| Variable | Descripción |
|---|---|
| `AWS_ACCOUNT_ID` | ID numérico de la cuenta AWS |
| `AWS_REGION` | Región (ej. `us-east-1`) |
| `ECR_REPOSITORY_SERVER` | Nombre del repo ECR (ej. `logitrans/server`) |
| `ECR_REPOSITORY_CLIENT` | Nombre del repo ECR (ej. `logitrans/client`) |
| `ECS_CLUSTER` | Nombre del cluster (ej. `logitrans-cluster`) |
| `ECS_SERVICE_SERVER` | Nombre del servicio ECS server |
| `ECS_SERVICE_CLIENT` | Nombre del servicio ECS client |
| `ECS_TASK_DEF_SERVER` | Family name de la task def server |
| `ECS_TASK_DEF_CLIENT` | Family name de la task def client |
| `JWT_SECRET` | Secret JWT (también en SSM) |
| `RESEND_API_KEY` | API key de Resend (también en SSM) |
| `SUPABASE_URL` | URL del proyecto Supabase (también en SSM) |
| `SUPABASE_SERVICE_KEY` | Service key de Supabase (también en SSM) |
| `NEXT_PUBLIC_API_URL` | URL pública del API (baked en Next.js build) |
| `APP_DOMAIN` | Dominio sin `https://` (ej. `guatechnology.com`) |

> Los secrets también se registran en AWS SSM Parameter Store bajo `/logitrans/prod/*`
> para ser inyectados en los containers de ECS en runtime sin exponerlos en GitLab.
