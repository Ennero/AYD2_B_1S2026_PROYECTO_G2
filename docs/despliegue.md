# Despliegue de LogiTrans (Guia Profunda)

## 1. Objetivo

Este documento unifica el despliegue de LogiTrans en dos escenarios:

1. Entorno principal del proyecto con [docker-compose.yml](../docker-compose.yml).
2. Entorno productivo simulado con balanceo, SSL y replica usando [docker-compose.prod.yml](../docker-compose.prod.yml).

Tambien incluye validaciones, operacion diaria, respaldos y troubleshooting.

## 2. Arquitectura de despliegue

### 2.1 Entorno principal (compose base)

Componentes:

- `db` (PostgreSQL 15) en puerto host `5433`.
- `server` (NestJS) en puerto host `3006`.
- `client` (Next.js) en puerto host `3000`.
- `rabbitmq` (RabbitMQ 3) en puertos host `5672` (AMQP) y `15672` (Management UI).

Uso recomendado:

- Desarrollo funcional.
- Pruebas de happy path.
- Validacion de flujos por rol.

### 2.2 Entorno productivo simulado (compose prod)

Componentes:

- `db-primary` (PostgreSQL escritura + lectura general).
- `db-replica` (PostgreSQL solo lectura para escenarios de gerencia/consulta).
- `api-1` y `api-2` (NestJS en paralelo).
- `client` (Next.js).
- `nginx` (TLS, reverse proxy y load balancing).
- `rabbitmq` (RabbitMQ 3) sin puertos expuestos — solo accesible dentro de la red interna `backend`.

Uso recomendado:

- Pruebas de disponibilidad.
- Pruebas de proxy y certificados.
- Validaciones previas a un despliegue real on-prem/cloud.

## 3. Prerrequisitos

### 3.1 Sistema

- Docker Desktop (o Docker Engine) version reciente.
- Docker Compose disponible (`docker compose` o `docker-compose`).
- Git.
- Minimo recomendado: 4 GB RAM libres para ejecutar todo el stack.

### 3.2 Herramientas extra para modo productivo simulado

- OpenSSL (requerido para generar certificados autofirmados).
- Shell compatible con bash para [scripts/deploy.sh](../scripts/deploy.sh):
  - Linux/macOS: shell nativa.
  - Windows: Git Bash o WSL.

## 4. Variables de entorno y archivos de configuracion

## 4.1 Backend (base)

Archivo de referencia: [server/.env.example](../server/.env.example)

Archivo local usado por compose base: [server/.env](../server/.env)

Variables criticas:

- Conexion DB: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`.
- Backend: `PORT`, `NODE_ENV`, `JWT_SECRET`.
- CORS: `CORS_ORIGINS`.
- Correo: `MOCK_SMTP`, `RESEND_API_KEY`, `SES_FROM_EMAIL`, `SES_FROM_NAME`, `PORTAL_URL`.
- Storage externo (si aplica): `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` y buckets.
- RabbitMQ: `RABBITMQ_URL`.

Recomendaciones:

1. Nunca commitear secretos reales.
2. En pruebas funcionales locales, usar `MOCK_SMTP=true` para no depender de proveedor de correo.
3. Cambiar `JWT_SECRET` por un valor fuerte en cualquier ambiente no local.

### 4.2 Productivo simulado

El compose productivo usa `env_file: server/.env.production` para APIs.

Si no existe, crealo desde plantilla:

```bash
cp server/.env.example server/.env.production
```

Adicionalmente, el script [scripts/deploy.sh](../scripts/deploy.sh) carga variables desde `.env.production` en raiz (opcional). Si no existe, usa defaults.

Practica recomendada:

1. Mantener `server/.env.production` con variables de backend.
2. Mantener `.env.production` raiz para parametros globales de compose cuando sea necesario.
3. Usar secretos del entorno/CI en lugar de hardcodear valores.

## 5. Despliegue rapido del entorno principal

### 5.1 Levantar servicios

Desde raiz del proyecto:

```bash
docker-compose down -v --rmi all
docker-compose up -d --build
```

### 5.2 Verificar estado

```bash
docker-compose ps
docker-compose logs --no-color server | tail -n 200
docker-compose logs --no-color client | tail -n 200
```

### 5.3 Endpoints esperados

- Frontend: `http://localhost:3000`
- API: `http://localhost:3006`
- Health API: `http://localhost:3006/health`
- PostgreSQL: `localhost:5433`
- RabbitMQ Management UI: `http://localhost:15672` (usuario: `guest`, contraseña: `guest`)

### 5.4 Reinicio limpio de base de datos

Cuando se requiere estado limpio de seeds:

```bash
docker-compose down -v
docker-compose up -d --build
```

## 6. Despliegue productivo simulado

Este flujo usa [docker-compose.prod.yml](../docker-compose.prod.yml) y [nginx/nginx.conf](../nginx/nginx.conf).

### 6.1 Opcion A: Script automatizado

```bash
./scripts/deploy.sh
```

El script realiza:

1. Validacion de Docker, Compose y OpenSSL.
2. Carga de `.env.production` (si existe en raiz).
3. Generacion de certificados autofirmados en `nginx/ssl/`.
4. Build y arranque de stack productivo.
5. Verificacion basica de servicios.

### 6.2 Opcion B: Manual

```bash
# Generar certificados
bash nginx/ssl/generate-cert.sh

# Levantar stack productivo
docker compose -f docker-compose.prod.yml up -d --build

# Ver estado
docker compose -f docker-compose.prod.yml ps
```

### 6.3 Rutas y puertos esperados en modo productivo

- HTTPS principal: `https://localhost`
- HTTP principal (redireccion a HTTPS): `http://localhost`
- API via proxy: `https://localhost/api/`
- API versionada via proxy: `https://localhost/api/v1/`
- Health por Nginx: `https://localhost/health`

Nota: al usar certificado autofirmado, el navegador mostrara advertencia de seguridad. Es esperado para entorno local/simulado.

## 7. Validacion funcional post-despliegue

### 7.1 Salud de servicios

```bash
# Compose base
docker-compose ps

# Compose prod
docker compose -f docker-compose.prod.yml ps
```

```bash
# RabbitMQ
curl -s http://localhost:15672/api/healthchecks/node -u guest:guest
```

### 7.2 Logs de diagnostico

```bash
# Base
docker-compose logs --no-color server | tail -n 200
docker-compose logs --no-color client | tail -n 200

# Prod
docker compose -f docker-compose.prod.yml logs --no-color nginx | tail -n 200
docker compose -f docker-compose.prod.yml logs --no-color api-1 | tail -n 200
docker compose -f docker-compose.prod.yml logs --no-color api-2 | tail -n 200
```

### 7.3 Pruebas HTTP/HTTPS

```bash
# Base
curl http://localhost:3006/health

# Prod (autofirmado)
curl -k https://localhost/health
curl -k https://localhost/api/v1/health
```

```bash
# Verificar cola RabbitMQ
curl -s http://localhost:15672/api/queues/%2F/logitrans_queue -u guest:guest | python -m json.tool
```

### 7.4 Verificacion de replica (modo prod)

```bash
# Revisar estado de streaming replication en replica
docker compose -f docker-compose.prod.yml exec db-replica \
  psql -U postgres -d logitrans_db -c "SELECT pg_is_in_recovery();"
```

Resultado esperado:

- `t` (true), indicando que la replica esta en modo recovery/standby.

## 8. Operacion diaria

### 8.1 Reiniciar servicios

```bash
# Base
docker-compose restart rabbitmq server client

# Prod
docker compose -f docker-compose.prod.yml restart api-1 api-2 nginx client
```

### 8.2 Apagar servicios

```bash
# Base
docker-compose down

# Prod
docker compose -f docker-compose.prod.yml down
```

### 8.3 Actualizar imagenes tras cambios

```bash
# Base
docker-compose up -d --build

# Prod
docker compose -f docker-compose.prod.yml up -d --build
```

## 9. Respaldos y restauracion

### 9.1 Backup (base o prod)

```bash
# Ejemplo en entorno base
docker-compose exec db pg_dump -U postgres -d logitrans_db > backup_logitrans.sql
```

Para prod:

```bash
docker compose -f docker-compose.prod.yml exec db-primary \
  pg_dump -U postgres -d logitrans_db > backup_logitrans_prod.sql
```

### 9.2 Restore

```bash
# Base
docker-compose exec -T db psql -U postgres -d logitrans_db < backup_logitrans.sql

# Prod
docker compose -f docker-compose.prod.yml exec -T db-primary \
  psql -U postgres -d logitrans_db < backup_logitrans_prod.sql
```

## 10. Troubleshooting rapido

### 10.1 Error de dependencias NestJS en arranque

Sintoma:

- Mensajes `Nest can't resolve dependencies` en logs de `server` o `api-*`.

Acciones:

1. Revisar imports/exports de modulo involucrado.
2. Rebuild completo sin cache de imagenes:

```bash
docker-compose down -v --rmi all
docker-compose up -d --build
```

3. Ver logs detallados del servicio.

### 10.2 Puerto ocupado

Sintoma:

- Error `port is already allocated`.

Acciones:

1. Liberar puerto en host.
2. Ajustar mapping en compose.
3. Reiniciar Docker Desktop si hay bloqueo de recursos.

### 10.3 Certificado no encontrado en nginx

Sintoma:

- `nginx` no levanta y reporta archivos faltantes en `/etc/nginx/ssl/`.

Acciones:

1. Ejecutar `bash nginx/ssl/generate-cert.sh`.
2. Confirmar presencia de `nginx/ssl/cert.pem` y `nginx/ssl/key.pem`.
3. Relanzar stack prod.

### 10.4 API accesible pero frontend no carga

Acciones:

1. Revisar logs de `client`.
2. Confirmar `NEXT_PUBLIC_API_URL` en compose/env.
3. Verificar que Nginx tenga rutas `location /` y `location /api/` correctas.

### 10.5 RabbitMQ no conecta al arrancar el servidor

Sintoma:

- Log del server: `RabbitMQ not available, events will be dropped`
- El servidor arranca igualmente (degradacion elegante)

Acciones:

1. Verificar que el contenedor `logitrans_rabbitmq` esta healthy: `docker compose ps`
2. Confirmar que `RABBITMQ_URL` esta seteado correctamente en `server/.env`
3. Recrear el contenedor del server para recargar el env: `docker compose up -d --force-recreate server`
4. Acceder a la Management UI: http://localhost:15672 (guest/guest)

## 11. Checklist de seguridad minima

Antes de un despliegue real:

1. Reemplazar secretos de ejemplo (`JWT_SECRET`, DB passwords, API keys).
2. No exponer `.env` con claves reales al repositorio.
3. Restringir CORS a dominios autorizados.
4. Reemplazar certificado autofirmado por certificado valido del dominio final.
5. Activar politicas de backup y monitoreo continuo.

## 12. Referencias relacionadas

- [README de raiz](../README.md)
- [Guia productiva historica](DEPLOYMENT.md)
- [Happy Path de validacion funcional](happypath.md)
- [Accesos de usuarios MVP](mvp_accessos_usuarios.md)
