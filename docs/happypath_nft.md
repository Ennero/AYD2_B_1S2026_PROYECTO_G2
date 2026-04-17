# Happypath Live: Load and Stress tests

Guía paso a paso para ejecutar y demostrar las pruebas de carga y estrés de LogiTrans en una sesión de calificación. Cubre el contexto teórico, la herramienta utilizada, la preparación del entorno, la corrección de inconsistencias encontradas en los scripts, y la ejecución completa — tanto en entorno local como contra producción.

---

## Tabla de Contenidos

1. [¿Qué es k6 y por qué se usa?](#1-qué-es-k6-y-por-qué-se-usa)
2. [Diferencia entre prueba de carga y prueba de estrés](#2-diferencia-entre-prueba-de-carga-y-prueba-de-estrés)
3. [Arquitectura del proyecto relevante para las pruebas](#3-arquitectura-del-proyecto-relevante-para-las-pruebas)
4. [Credenciales del seed](#4-credenciales-del-seed)
5. [Inconsistencias detectadas en api.stress.js](#5-inconsistencias-detectadas-en-apistressjs)
6. [Flujo de trabajo: Local vs Producción](#6-flujo-de-trabajo-local-vs-producción)
7. [Paso 1 — Instalar k6](#paso-1--instalar-k6)
8. [Paso 2 — Levantar el proyecto con Docker](#paso-2--levantar-el-proyecto-con-docker)
9. [Paso 3 — Verificar que el backend responde](#paso-3--verificar-que-el-backend-responde)
10. [Paso 4 — Smoke test (verificación rápida antes de correr)](#paso-4--smoke-test-verificación-rápida-antes-de-correr)
11. [Paso 5 — Ejecutar pruebas de CARGA](#paso-5--ejecutar-pruebas-de-carga)
12. [Paso 6 — Ejecutar pruebas de ESTRÉS](#paso-6--ejecutar-pruebas-de-estrés)
13. [Cómo leer el output de k6](#cómo-leer-el-output-de-k6)
14. [Qué se está probando en cada test](#qué-se-está-probando-en-cada-test)
15. [Guardar resultados para entrega](#guardar-resultados-para-entrega)
16. [Solución de problemas comunes](#solución-de-problemas-comunes)

---

## 6. Flujo de trabajo: Local vs Producción

Las pruebas se pueden ejecutar contra dos entornos. La única diferencia entre ellos es el valor de `BASE_URL` — los scripts y comandos son idénticos.

### Comparativa de entornos

| Dimensión | Local (Docker) | Producción (AWS) |
|-----------|---------------|-----------------|
| **BASE_URL** | `http://localhost:3006` | `https://guatechnology.com` |
| **Infraestructura** | 1 contenedor NestJS + PostgreSQL local | 2 Fargate Tasks + ALB + Supabase |
| **HTTPS** | No (HTTP plano) | Sí (ACM cert en el ALB) |
| **Auto-scaling** | No | Sí (min 2, max 6 tasks si CPU > 70%) |
| **Seed** | Corre automáticamente al levantar | Ya aplicado en el primer deploy |
| **Propósito en calificación** | Demostrar que los scripts funcionan | Demostrar rendimiento en infraestructura real |

---

### Entorno Local — flujo completo

```
1. docker compose up -d --build          ← levanta API, DB, frontend
2. curl http://localhost:3006/api/health     ← verificar que responde
3. Smoke test (1 VU)                     ← confirmar credenciales y rutas
4. k6 run load   (BASE_URL=localhost)    ← prueba de carga (~7 min)
5. k6 run stress (BASE_URL=localhost)    ← prueba de estrés (~13 min)
```

**Cuándo usarlo:** desarrollo, validación de scripts nuevos, cuando no hay acceso a producción o no se quiere arriesgar afectar usuarios reales.

---

### Entorno Producción (AWS) — flujo completo

```
1. Verificar que la app está desplegada    ← curl https://guatechnology.com/api/health
2. Verificar credenciales en producción   ← curl POST /api/auth/login
3. Smoke test (1 VU)                      ← confirmar que los endpoints responden
4. k6 run load   (BASE_URL=producción)    ← prueba de carga (~7 min)
5. [coordinado] k6 run stress             ← prueba de estrés (~13 min)
```

**Cuándo usarlo:** para la calificación final, para demostrar que el sistema real aguanta la carga especificada (200 TPS, p95 < 500ms, error rate < 1%).

> **Importante:** la prueba de estrés a 400 VUs contra producción activa el **auto-scaling de ECS** (CPU > 70% → escala hasta 6 tasks). Esto es comportamiento esperado y es un punto a favor en la calificación — demuestra que la infraestructura se adapta automáticamente.

---

### Comportamiento diferencial en producción

Hay tres diferencias técnicas clave respecto a local que conviene mencionar en el video:

**1. El ALB distribuye las requests entre 2 instancias**

En local, todas las requests van a un solo proceso NestJS. En producción, el ALB usa round-robin entre las 2 Fargate Tasks. Bajo carga, esto significa que la latencia p95 en producción puede ser **mejor** que en local, porque la carga se reparte.

**2. Auto-scaling puede dispararse durante el stress test**

Cuando ECS detecta CPU > 70% en las tasks, escala automáticamente hasta 6 instancias. Durante el stress test se puede observar cómo la tasa de error baja y la latencia mejora a medida que AWS levanta tasks adicionales — esto es evidencia de que la infraestructura está bien configurada.

**3. El seed de producción puede no tener órdenes**

Si el seed de producción no generó órdenes (o fueron procesadas), el Test 4 (detalle de orden) se omitirá automáticamente. No es un error — el script lo maneja con el `setup()` que busca la primera orden disponible.

---

### Comandos lado a lado

```bash
# ── LOCAL ──────────────────────────────────────────────────────────────────────

# Smoke test local
k6 run --env BASE_URL=http://localhost:3006 --vus 1 --iterations 1 \
       tests/k6/load/api.load.js

# Carga local
k6 run --env BASE_URL=http://localhost:3006 \
       tests/k6/load/api.load.js

# Estrés local
k6 run --env BASE_URL=http://localhost:3006 \
       tests/k6/stress/api.stress.js


# ── PRODUCCIÓN ─────────────────────────────────────────────────────────────────

# Smoke test producción
k6 run --env BASE_URL=https://guatechnology.com --vus 1 --iterations 1 \
       tests/k6/load/api.load.js

# Carga producción
k6 run --env BASE_URL=https://guatechnology.com \
       tests/k6/load/api.load.js

# Estrés producción (coordinar con el equipo antes de ejecutar)
k6 run --env BASE_URL=https://guatechnology.com \
       tests/k6/stress/api.stress.js
```

---

### Pre-flight checks de producción

Antes de correr cualquier prueba contra producción, ejecutar estos tres comandos:

```bash
# 1. Health check — confirmar que el servidor y la DB están up
curl https://guatechnology.com/api/health
# Esperado: {"status":"ok","database":"connected"}

# 2. Login — confirmar que el seed existe y las credenciales son válidas
curl -s -X POST https://guatechnology.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"2895884051401+l@ingenieria.usac.edu.gt","password":"LogiLogistica"}' \
  | python3 -m json.tool
# Esperado: { "data": { "token": "eyJ..." } }

# 3. Verificar endpoint de órdenes logísticas
TOKEN=$(curl -s -X POST https://guatechnology.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"2895884051401+l@ingenieria.usac.edu.gt","password":"LogiLogistica"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['data']['token'])")

curl -s https://guatechnology.com/api/logistics/orders \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20
```

Si los tres responden correctamente, el entorno de producción está listo para las pruebas.

---

## 1. ¿Qué es k6 y por qué se usa?

**k6** es una herramienta open-source de pruebas de rendimiento creada por Grafana Labs. Los scripts se escriben en JavaScript moderno y se ejecutan desde la terminal. Genera métricas de latencia, throughput y tasa de errores en tiempo real.

Se eligió k6 para este proyecto porque:

- Los scripts son código JavaScript legible y versionable en el repositorio.
- Permite definir **stages** (fases de VUs) y **thresholds** (umbrales de aprobación/fallo) de forma declarativa.
- Produce métricas estándar (`http_req_duration`, `http_req_failed`) y métricas personalizadas (`Trend`, `Rate`, `Counter`).
- Actualmente en este repositorio las pruebas k6 se ejecutan **manualmente** (local o entorno productivo simulado) y no forman parte del workflow automático de `Build & Test`.

**VU (Virtual User):** un usuario simulado que ejecuta el script en un loop continuo. 50 VUs simultáneos = 50 usuarios haciendo requests al mismo tiempo.

---

## 2. Diferencia entre prueba de carga y prueba de estrés

| Dimensión            | Prueba de Carga (`api.load.js`)            | Prueba de Estrés (`api.stress.js`)              |
|----------------------|--------------------------------------------|-------------------------------------------------|
| **Objetivo**         | ¿Aguanta la carga normal?                  | ¿Dónde se rompe? ¿Se recupera?                  |
| **VUs máximos**      | 50                                         | 400                                             |
| **Duración total**   | ~7 minutos                                 | ~13 minutos                                     |
| **Thresholds**       | Estrictos: p95 < 500ms, errores < 1%       | Laxos: p95 < 3000ms, errores < 15%              |
| **Resultado esperado** | Todos los thresholds en verde ✓          | El sistema puede degradarse; lo importante es que no colapse y se recupere |
| **Pregunta que responde** | "¿funciona bien en producción normal?" | "¿cuánto aguanta antes de caer?"               |

### ¿Por qué umbrales más laxos en estrés?

En una prueba de estrés el objetivo **no es pasar todos los checks** — es empujar el sistema hasta encontrar su límite. Un 15% de error rate a 400 VUs es información valiosa: el sistema no murió, sólo se degradó. Lo crítico es que al bajar la carga (cool-down) los errores vuelvan a 0%.

---

## 3. Arquitectura del proyecto relevante para las pruebas

El backend es un servidor **NestJS** corriendo en el puerto interno `3000`. Al levantarlo con Docker, ese puerto se mapea al `3006` del host:

```
Host (tu máquina)          Docker
localhost:3006    ←──────  NestJS :3000  (api service)
localhost:3000    ←──────  Next.js :3000 (client service)
localhost:5433    ←──────  PostgreSQL :5432
```

Todos los endpoints del backend usan el prefijo `/api/` (definido en cada `@Controller`), excepto el health check:

| Endpoint | Ruta completa |
|----------|---------------|
| Health check | `GET http://localhost:3006/api/health` |
| Login | `POST http://localhost:3006/api/auth/login` |
| Listar órdenes logísticas | `GET http://localhost:3006/api/logistics/orders` |
| Detalle de una orden | `GET http://localhost:3006/api/logistics/orders/:id` |
| Binomios disponibles | `GET http://localhost:3006/api/logistics/unit-binomials` |
| BI / analytics | `GET http://localhost:3006/api/bi/...` |

---

## 4. Credenciales del seed

El seed crea estos usuarios de sistema. Son las únicas credenciales válidas para las pruebas:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Agente Logístico | `2895884051401+l@ingenieria.usac.edu.gt` | `LogiLogistica` |
| Agente Operativo | `2895884051401+s@ingenieria.usac.edu.gt` | `LogiSAT` |
| Piloto | `2895884051401+t@ingenieria.usac.edu.gt` | `LogiPiloto` |
| Encargado Patio | `2895884051401+p@ingenieria.usac.edu.gt` | `LogiPatio` |
| Finanzas | `2895884051401+f@ingenieria.usac.edu.gt` | `LogiFinanzas` |
| Gerencia | `2895884051401@ingenieria.usac.edu.gt` | `LogiGerencia` |

Fuente: `server/src/infrastructure/database/seeds/database-seeder.ts`

---

## 5. Inconsistencias detectadas en api.stress.js

Al revisar `tests/k6/stress/api.stress.js` contra los controladores reales del backend, se encontraron dos tipos de problemas que harían fallar la prueba con errores 404/401 masivos:

### Problema 1 — Rutas incorrectas

El script de estrés usa rutas sin el prefijo `/api/`:

| En el script (incorrecto) | Ruta real del backend |
|---------------------------|----------------------|
| `POST /auth/login` | `POST /api/auth/login` |
| `GET /orders` | `GET /api/logistics/orders` |
| `GET /bi/summary` | `GET /api/bi/...` |

### Problema 2 — Credenciales inexistentes

El script usa emails `@logitrans.com` con password `password123`, que **no existen en el seed**:

```javascript
// INCORRECTO — estos usuarios no están en la DB
{ email: 'agente.operativo@logitrans.com', password: 'password123' },
{ email: 'agente.logistico@logitrans.com', password: 'password123' },
```

### Corrección aplicada

Editar `tests/k6/stress/api.stress.js` con las rutas y credenciales correctas:

```javascript
// Rutas corregidas — agregar prefijo /api/
`${BASE_URL}/api/auth/login`       // stressLogin
`${BASE_URL}/api/logistics/orders` // stressOrders
`${BASE_URL}/api/bi/summary`       // stressBi (si el endpoint existe)

// Credenciales corregidas — usuarios reales del seed
const USERS = [
  { email: '2895884051401+l@ingenieria.usac.edu.gt', password: 'LogiLogistica' },
  { email: '2895884051401+t@ingenieria.usac.edu.gt', password: 'LogiPiloto'    },
  { email: '2895884051401+p@ingenieria.usac.edu.gt', password: 'LogiPatio'     },
  { email: '2895884051401+f@ingenieria.usac.edu.gt', password: 'LogiFinanzas'  },
];
```

También cambiar el campo leído del token — el backend devuelve `data.token`, no `access_token`:

```javascript
// INCORRECTO
return res.json('access_token');

// CORRECTO
try { return res.json('data.token'); } catch { return null; }
```

---

## Paso 1 — Instalar k6

```bash
# macOS
brew install k6

# Verificar instalación
k6 version
# Output esperado: k6 v0.x.x (go1.x.x, ...)
```

Si no tienes Homebrew, también puedes correrlo con Docker (sin instalar nada):

```bash
# Prueba de carga via Docker
docker run --rm -i --network host grafana/k6 run - < tests/k6/load/api.load.js

# Prueba de estrés via Docker
docker run --rm -i --network host grafana/k6 run - < tests/k6/stress/api.stress.js
```

---

## Paso 2 — Levantar el proyecto con Docker

Este es el entorno recomendado. Levanta el backend, la base de datos y el frontend en un solo comando:

```bash
# Desde la raíz del proyecto
docker compose up -d --build

# Verificar que todos los servicios estén corriendo
docker compose ps
```

Output esperado (todos en estado `Up` o `running`):

```
NAME                STATUS          PORTS
logitrans-api       Up              0.0.0.0:3006->3000/tcp
logitrans-client    Up              0.0.0.0:3000->3000/tcp
logitrans-db        Up              0.0.0.0:5433->5432/tcp
```

> El seed se ejecuta automáticamente al iniciar porque `DB_AUTO_SEED=true` está configurado
> en el docker-compose. Las credenciales de la tabla anterior quedan disponibles de inmediato.

Si necesitas forzar un seed limpio:

```bash
docker compose down -v          # borra volúmenes (DB se reinicia)
docker compose up -d --build    # reconstruye y vuelve a seedear
```

---

## Paso 3 — Verificar que el backend responde

Antes de lanzar cualquier prueba, confirma que el servidor está activo y el seed funcionó:

```bash
# 1. Health check — debe devolver 200 con status "ok"
curl http://localhost:3006/api/health
# Esperado: {"status":"ok","database":"connected"}

# 2. Login con el usuario de pruebas — debe devolver token
curl -s -X POST http://localhost:3006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"2895884051401+l@ingenieria.usac.edu.gt","password":"LogiLogistica"}' \
  | python3 -m json.tool

# Esperado: { "message": "...", "data": { "token": "eyJ..." } }
```

Si el login devuelve `401 Credenciales inválidas`, el seed no se ejecutó. Solución:

```bash
docker compose down -v && docker compose up -d --build
```

---

## Paso 4 — Smoke test (verificación rápida antes de correr)

El smoke test ejecuta el script con **1 VU y 1 iteración** — confirma que el script funciona, las credenciales son válidas y los endpoints responden, sin generar carga real.

**Siempre hacer esto primero.**

```bash
# Smoke test — prueba de carga
k6 run --env BASE_URL=http://localhost:3006 \
       --vus 1 --iterations 1 \
       tests/k6/load/api.load.js

# Smoke test — prueba de estrés
k6 run --env BASE_URL=http://localhost:3006 \
       --vus 1 --iterations 1 \
       tests/k6/stress/api.stress.js
```

Output esperado (todos los checks en verde):

```
✓ health → 200
✓ login → 200
✓ login → has token
✓ logistics-orders → 200
✓ order-detail → 200
✓ binomials → 200

checks.........................: 100.00% ✓ 6  ✗ 0
```

Si algún check falla aquí, **no continuar** con la prueba completa. Revisar la sección de [Solución de problemas](#solución-de-problemas-comunes).

---

## Paso 5 — Ejecutar pruebas de CARGA

**Archivo:** `tests/k6/load/api.load.js`
**Duración total:** ~7 minutos
**VUs máximos:** 50

### ¿Qué simula?

Simula el tráfico **normal esperado en producción**: múltiples agentes logísticos consultando el sistema de forma concurrente durante un turno de trabajo.

### Stages de la prueba

```
Tiempo  VUs    Descripción
0:00    0→10   Warm-up: el servidor se calienta gradualmente
1:00    10→30  Ramp-up: carga esperada en horas pico
3:00    30→50  Peak: carga máxima sostenida por 3 minutos
6:00    50→0   Cool-down: bajada gradual
```

### Ejecutar

```bash
k6 run --env BASE_URL=http://localhost:3006 tests/k6/load/api.load.js
```

### Umbrales que deben pasar (✓)

| Métrica | Umbral | Significado |
|---------|--------|-------------|
| `http_req_duration` p(95) | < 500ms | El 95% de todas las requests responde en menos de 500ms |
| `http_req_failed` rate | < 1% | Menos del 1% de requests falla (red o 5xx) |
| `health_duration` p(95) | < 200ms | El health check es casi instantáneo |
| `login_duration` p(95) | < 1000ms | El login incluye bcrypt, se le da más tiempo |
| `orders_duration` p(95) | < 500ms | Listar órdenes con JOIN es rápido |
| `order_detail_duration` p(95) | < 500ms | Detalle de una orden individual |
| `binomials_duration` p(95) | < 500ms | Consulta de binomios disponibles |
| `error_rate` rate | < 1% | Errores de negocio (checks fallidos) |

### Output esperado al pasar todas las pruebas

```
█ THRESHOLDS

  health_duration............: p(95)=15ms   ✓ p(95)<200
  http_req_duration..........: p(95)=180ms  ✓ p(95)<500
  http_req_failed............: rate=0.00%   ✓ rate<0.01
  login_duration.............: p(95)=220ms  ✓ p(95)<1000
  orders_duration............: p(95)=95ms   ✓ p(95)<500
  order_detail_duration......: p(95)=80ms   ✓ p(95)<500
  binomials_duration.........: p(95)=110ms  ✓ p(95)<500
  error_rate.................: rate=0.00%   ✓ rate<0.01

█ TOTAL RESULTS

  checks_succeeded...........: 100.00% ✓ 6 out of 6
  http_reqs...................: 2702    11.22/s
  vus.........................: 50      (max)
```

---

## Paso 6 — Ejecutar pruebas de ESTRÉS

**Archivo:** `tests/k6/stress/api.stress.js`
**Duración total:** ~13 minutos
**VUs máximos:** 400

### ¿Qué simula?

Simula condiciones **extremas y anómalas**: picos de tráfico inesperados (como Black Friday), ataques de abuso en el login, o un bug que hace que todos los clientes reintenten al mismo tiempo. El objetivo es encontrar el punto de quiebre y verificar que el sistema **se recupera** una vez que la carga baja.

### Stages de la prueba

```
Tiempo  VUs      Descripción
0:00    0→20     Baseline: tráfico mínimo de referencia
1:00    20→100   Ramp stress: entrando a territorio de estrés
3:00    100→200  High stress: estrés alto sostenido
6:00    200→300  Near-break: cerca del límite del sistema
8:00    300→400  Spike: buscando el punto de quiebre
9:00    400→200  Partial recovery: ¿el sistema respira?
11:00   200→0    Full cool-down: el sistema debe recuperarse completamente
```

### Ejecutar

```bash
k6 run --env BASE_URL=http://localhost:3006 tests/k6/stress/api.stress.js
```

### Umbrales (laxos por diseño)

| Métrica | Umbral | Por qué tan laxo |
|---------|--------|------------------|
| `http_req_duration` p(95) | < 3000ms | A 400 VUs es normal que tarde más |
| `http_req_failed` rate | < 15% | Cierto nivel de fallo bajo estrés extremo es aceptable |
| `error_rate` rate | < 15% | Idem |

> **Lo que realmente se observa:** la tasa de errores sube al acercarse a 400 VUs, y luego **vuelve a bajar** durante el cool-down. Eso es recuperación exitosa — el comportamiento esperado.

### Qué observar durante la ejecución

k6 imprime una línea de estado cada pocos segundos. Lo que hay que monitorear:

```
default ↑ [  23% ] 92 VUs    2m10s/13m0s   1102 complete, 87 interrupted
http_req_failed.......: 0.51%  ✓ rate<0.15
http_req_duration.....: p(95)=312ms
```

- El `↑` indica que los VUs están subiendo (ramp-up).
- Cuando llega a 400 VUs el p(95) puede superar 1000ms — eso es esperado.
- Si `http_req_failed` supera 15% y se mantiene después del cool-down, hay un problema real.

---

## Cómo leer el output de k6

Al finalizar cada prueba, k6 imprime un resumen completo. Esta es la guía de interpretación:

### Sección THRESHOLDS

```
✓ 'p(95)<500'  p(95)=164ms   ← PASA: el valor real (164ms) está por debajo del límite (500ms)
✗ 'rate<0.01'  rate=5.00%    ← FALLA: el valor real (5%) supera el límite (1%)
```

El símbolo `✗` hace que k6 termine con **exit code 99** (fallo). En CI/CD esto detiene el pipeline.

### Sección CHECKS

```
checks_succeeded: 100.00% 6 out of 6
✓ health → 200              (todas las requests al health respondieron 200)
✓ login → 200
✓ login → has token
✓ logistics-orders → 200
✓ order-detail → 200
✓ binomials → 200
```

Cada `check` es una aserción de negocio. Si falla, el endpoint no está respondiendo como se espera.

### Sección HTTP metrics

```
http_reqs..................: 15420    21.42/s       ← throughput (requests por segundo)
http_req_duration..........: avg=58ms  p(90)=138ms  p(95)=164ms  max=890ms
                                        ↑ 90% bajo   ↑ 95% bajo  ↑ peor caso
http_req_failed............: 0.00%
```

### Métricas personalizadas

```
health_duration............: avg=12ms  p(95)=18ms
login_duration.............: avg=95ms  p(95)=210ms
orders_duration............: avg=45ms  p(95)=92ms
order_detail_duration......: avg=38ms  p(95)=75ms
binomials_duration.........: avg=52ms  p(95)=108ms
```

Estas métricas permiten identificar **qué endpoint específico** está siendo el cuello de botella si el p(95) global supera el umbral.

---

## Qué se está probando en cada test

### Pruebas de carga — 5 tests

#### Test 1: Health Check (`GET /api/health`)
- **Qué verifica:** que el servidor NestJS está vivo y la conexión a PostgreSQL está activa.
- **Por qué importa:** si este falla bajo carga, el servidor está saturado al punto de no poder responder ni al endpoint más simple.
- **Umbral:** p(95) < 200ms — debe ser casi instantáneo ya que no hace queries complejas.

#### Test 2: Login (`POST /api/auth/login`)
- **Qué verifica:** que el sistema de autenticación aguanta múltiples logins simultáneos.
- **Por qué importa:** bcrypt (el algoritmo de hash de contraseñas) es computacionalmente costoso por diseño. Bajo 50 VUs, el servidor puede quedarse sin threads de CPU para procesar los hashes.
- **Umbral:** p(95) < 1000ms — se da 2x más tiempo que otros endpoints justamente por bcrypt.

#### Test 3: Listar Órdenes (`GET /api/logistics/orders`)
- **Qué verifica:** que la consulta de órdenes pendientes aguanta carga concurrente.
- **Por qué importa:** este endpoint hace un JOIN entre `ORDERS`, `CONTRACTS` y `CLIENTS` — es representativo de la carga real sobre PostgreSQL.
- **Umbral:** p(95) < 500ms.

#### Test 4: Detalle de Orden (`GET /api/logistics/orders/:id`)
- **Qué verifica:** el tiempo de respuesta al cargar una orden individual.
- **Mecánica especial:** el `ORDER_ID` se obtiene automáticamente en la función `setup()` — corre una sola vez antes de todos los VUs, obtiene la primera orden del seed y la reutiliza en todos los VUs. Esto evita hardcodear IDs que cambian entre entornos.
- **Umbral:** p(95) < 500ms.

#### Test 5: Binomios Disponibles (`GET /api/logistics/unit-binomials`)
- **Qué verifica:** el tiempo de la consulta de binomios (pares piloto + vehículo) disponibles para asignación.
- **Por qué importa:** esta es la consulta más compleja del módulo logístico — filtra `TRANSPORT_UNITS` y `USERS` validando documentación vigente, capacidad de carga y tipo de mercancía.
- **Umbral:** p(95) < 500ms.

---

### Pruebas de estrés — 5 tests

#### Test 1: Health Check bajo estrés (`stressHealth`)
- **Qué verifica:** que el servidor siga respondiendo al endpoint más básico cuando hay 400 VUs.
- **Timeout:** 5 segundos (vs el timeout default de 30s) — bajo estrés extremo el servidor puede tardar en responder incluso al health check.
- **Métrica adicional:** `timeouts` counter — registra cuántas veces el servidor no respondió en 5s.

#### Test 2: Login bajo estrés (`stressLogin`)
- **Qué verifica:** que el sistema no colapse ni devuelva 500 cuando recibe autenticaciones masivas simultáneas.
- **Acepta 429:** un status `429 Too Many Requests` se considera una respuesta válida — significa que el rate limiter está funcionando, no que el servidor esté caído.

#### Test 3: Órdenes bajo estrés (`stressOrders`)
- **Qué verifica:** que las lecturas de órdenes sigan funcionando cuando el servidor está al límite.
- **Threshold relajado:** acepta cualquier respuesta `< 500` (no solo 200). Un 503 bajo estrés extremo es tolerable; un 500 (error interno) indica bug real.

#### Test 4: BI / Analytics bajo estrés (`stressBi`)
- **Qué verifica:** que el módulo de analytics (ruta de read-replica en producción) aguante la carga simultánea con los demás módulos.
- **Timeout extendido:** 8 segundos (las queries de BI son más pesadas — aggregations, GROUP BY).

#### Test 5: Rapid Auth Spike (`stressRapidAuth`)
- **Qué verifica:** que el servidor no se caiga ante un burst de 3 logins consecutivos rápidos del mismo usuario (simula un cliente reintentando o un script de abuso).
- **Frecuencia:** se ejecuta en el 20% de las iteraciones aleatoriamente (`Math.random() < 0.2`), mezclado con los otros tests.
- **Threshold:** el servidor no debe devolver 500 — puede devolver 429 (rate limit) o 200, ambos son válidos.

---

## Guardar resultados para entrega

Para generar un reporte en JSON que pueda entregarse como evidencia:

```bash
# Prueba de carga con reporte
k6 run --env BASE_URL=http://localhost:3006 \
       --out json=tests/k6/load/resultado-load.json \
       tests/k6/load/api.load.js

# Prueba de estrés con reporte
k6 run --env BASE_URL=http://localhost:3006 \
       --out json=tests/k6/stress/resultado-stress.json \
       tests/k6/stress/api.stress.js
```

El archivo JSON contiene cada datapoint de cada métrica con timestamps — se puede importar a Grafana para visualizar las curvas de latencia vs VUs.

Para ver un resumen de texto en archivo:

```bash
k6 run --env BASE_URL=http://localhost:3006 \
       tests/k6/load/api.load.js 2>&1 | tee tests/k6/load/resultado-load.txt
```

---

## Solución de problemas comunes

### `connection refused` al correr k6

```
ERRO dial tcp 127.0.0.1:3006: connect: connection refused
```

El backend no está corriendo. Verificar:

```bash
docker compose ps          # ¿está el servicio "api" en estado Up?
docker compose logs api    # ¿hay errores de startup?
curl http://localhost:3006/api/health
```

---

### `401 Credenciales inválidas` en el login

El seed no se ejecutó o las contraseñas son incorrectas. Verificar con curl primero:

```bash
curl -s -X POST http://localhost:3006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"2895884051401+l@ingenieria.usac.edu.gt","password":"LogiLogistica"}'
```

Si falla, reiniciar con seed limpio:

```bash
docker compose down -v && docker compose up -d --build
```

---

### `orders_duration` aparece como `0s` / Test 3-5 no se ejecutan

**Causa:** el login falló y `token` es `null` — los tests autenticados se saltean.
**Solución:** resolver primero el error de login (ver arriba).

---

### `order-detail` no aparece en los checks

**Causa normal:** no hay órdenes en la DB (seed no corrió o fue reiniciado).
**Comportamiento esperado:** el Test 4 se omite automáticamente cuando `orderId` está vacío — NO cuenta como error.
**Para que se ejecute:** reiniciar el seed.

---

### k6 termina con exit code 99

```
ERRO some thresholds have failed
```

Significa que uno o más thresholds fueron superados. El output muestra exactamente cuál:

```
✗ 'p(95)<500'  p(95)=823ms   ← este threshold falló
```

Posibles causas:
- El servidor está bajo recursos (Docker en Mac con poca RAM asignada).
- Hay queries sin índice que se degradan bajo carga.
- El seed tiene muy pocos datos y las queries de binomios no tienen nada que filtrar.

Aumentar recursos de Docker Desktop: Settings → Resources → Memory → mínimo 4GB.

---

### Smoke test pasa pero la prueba completa falla los thresholds

Bajo carga real (50+ VUs) el servidor puede degradarse. Esto es información válida — significa que el sistema necesita optimización (índices, pool de conexiones, caché). Para la calificación, documentar el resultado observado y el threshold superado.
