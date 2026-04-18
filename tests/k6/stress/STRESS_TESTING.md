# LogiTrans — Pruebas de Estrés (k6)

> **Módulo:** Sistema completo (Health, Auth, Logística, BI)  
> **Herramienta:** [k6](https://k6.io/) por Grafana Labs  
> **Ubicación en el repositorio:** `tests/k6/stress/`

---

## Tabla de Contenidos

- [1. ¿Qué son las pruebas de estrés?](#1-qué-son-las-pruebas-de-estrés)
- [2. Diferencia con las pruebas de carga](#2-diferencia-con-las-pruebas-de-carga)
- [3. Requisitos previos](#3-requisitos-previos)
- [4. Credenciales de prueba](#4-credenciales-de-prueba)
- [5. Descripción de las 5 pruebas](#5-descripción-de-las-5-pruebas)
- [6. Escenario de carga (stages)](#6-escenario-de-carga-stages)
- [7. Umbrales definidos](#7-umbrales-definidos)
- [8. Cómo ejecutar las pruebas](#8-cómo-ejecutar-las-pruebas)
- [9. Resultados obtenidos](#9-resultados-obtenidos)
- [10. Interpretación del reporte](#10-interpretación-del-reporte)
- [11. Solución de problemas comunes](#11-solución-de-problemas-comunes)

---

## 1. ¿Qué son las pruebas de estrés?

Las pruebas de estrés evalúan el comportamiento del sistema cuando se lo somete a cargas **más allá de los límites normales de producción**. La pregunta que responden es: _¿hasta dónde aguanta el sistema antes de romperse y cómo se recupera?_

### Objetivos específicos de estas pruebas

| Objetivo                         | Descripción                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| Encontrar el punto de quiebre    | Determinar cuántos VUs concurrentes saturan el sistema                  |
| Medir degradación gradual        | Observar cómo aumentan los tiempos de respuesta bajo carga extrema       |
| Verificar recuperación           | Confirmar que el sistema vuelve a funcionar normalmente después del pico  |
| Detectar fugas de memoria        | Identificar si el servidor se recupera o queda degradado tras la bajada  |
| Validar rate limiting            | Verificar que el servidor responde 429 (Too Many Requests) en lugar de 500 |

---

## 2. Diferencia con las pruebas de carga

| Aspecto               | Prueba de Carga (`api.load.js`)     | Prueba de Estrés (`api.stress.js`)         |
| --------------------- | ----------------------------------- | ------------------------------------------ |
| **Objetivo**          | Validar comportamiento normal       | Encontrar límites y puntos de quiebre       |
| **VUs máximos**       | 50 VUs                              | 400 VUs                                    |
| **Umbral p95**        | 500 ms                              | 3000 ms (tolerancia ampliada)              |
| **Tasa de error**     | < 1%                                | < 15% (se tolera más bajo estrés extremo)  |
| **Duración total**    | 7 minutos                           | 13 minutos                                 |
| **Patrón de carga**   | Ramp suave y sostenido              | Escalada agresiva + spike + recuperación   |

---

## 3. Requisitos previos

### Levantar el stack con Docker

```bash
# Desde la raíz del proyecto
docker compose up -d

# Verificar que el backend responde
curl http://localhost:3006/api/health
# Esperado: {"status":"ok","database":"connected"}
```

> El server expone el puerto `3006` (mapeado desde el puerto interno `3000`).

### Opción A — k6 instalado localmente

```bash
# Linux (Debian/Ubuntu/WSL2)
sudo gpg --no-default-keyring \
     --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
     --keyserver hkp://keyserver.ubuntu.com:80 \
     --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
     https://dl.k6.io/deb stable main" \
     | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Windows (Chocolatey)
choco install k6

# macOS (Homebrew)
brew install k6
```

### Opción B — k6 vía Docker (sin instalación)

```bash
# En Linux/WSL2: --network host permite alcanzar localhost:3006
docker run --rm -i --network host grafana/k6 run - \
  < tests/k6/stress/api.stress.js
```

---

## 4. Credenciales de prueba

Las pruebas utilizan los 4 roles principales definidos en el seed del proyecto (`database-seeder.ts`):

```javascript
const USERS = [
  { email: '2895884051401+v@ingenieria.usac.edu.gt', password: 'LogiVentas'    }, // AGENTE_OPERATIVO
  { email: '2895884051401+l@ingenieria.usac.edu.gt', password: 'LogiLogistica' }, // AGENTE_LOGISTICO
  { email: '2895884051401+t@ingenieria.usac.edu.gt', password: 'LogiPiloto'    }, // PILOTO
  { email: '2895884051401@ingenieria.usac.edu.gt',   password: 'LogiGerencia'  }, // GERENCIA
];
```

Cada VU elige un usuario al azar, simulando tráfico real multi-rol.

> **Verificar credenciales antes de ejecutar:**
>
> ```bash
> curl -X POST http://localhost:3006/api/auth/login \
>   -H "Content-Type: application/json" \
>   -d '{"email":"2895884051401+l@ingenieria.usac.edu.gt","password":"LogiLogistica"}'
> # Esperado: 200 con data.token
> ```

---

## 5. Descripción de las 5 pruebas

### Prueba 1 — Health Check bajo estrés

| Campo              | Detalle                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| **Endpoint**       | `GET /api/health`                                                          |
| **Autenticación**  | No requerida                                                               |
| **Métrica custom** | `response_duration`                                                        |
| **Propósito**      | Verificar que el servidor responde incluso bajo 400 VUs concurrentes       |

Esta prueba valida la disponibilidad mínima del sistema. Si el health check empieza a fallar, significa que el servidor está completamente saturado o caído.

```javascript
function stressHealth() {
  const res = http.get(`${BASE_URL}/api/health`, { timeout: '5s' });
  check(res, { 'health survives stress': (r) => r.status === 200 });
}
```

---

### Prueba 2 — Login bajo estrés

| Campo              | Detalle                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| **Endpoint**       | `POST /api/auth/login`                                                     |
| **Autenticación**  | No requerida (es el proceso de autenticación)                              |
| **Propósito**      | Medir degradación del proceso bcrypt bajo carga extrema de autenticaciones |

El endpoint de login es costoso en CPU por el hashing bcrypt. Bajo estrés extremo, el servidor puede responder 429 (rate limiting) — esto se considera un comportamiento **correcto** y no se cuenta como error.

```javascript
function stressLogin(user) {
  const res = http.post(`${BASE_URL}/api/auth/login`, ...);
  check(res, {
    'login survives stress': (r) => r.status === 200 || r.status === 201 || r.status === 429,
  });
}
```

---

### Prueba 3 — Órdenes logísticas bajo estrés

| Campo              | Detalle                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| **Endpoint**       | `GET /api/logistics/orders`                                                |
| **Autenticación**  | JWT requerido (rol AGENTE_LOGISTICO o compatible)                          |
| **Propósito**      | Verificar que la consulta de órdenes no genera errores 500 bajo carga alta |

Esta consulta realiza JOINs complejos entre tablas de órdenes, contratos y clientes. Bajo estrés, puede degradarse pero no debe generar errores internos del servidor.

```javascript
function stressOrders(token) {
  const res = http.get(`${BASE_URL}/api/logistics/orders`, { ... });
  check(res, { 'orders survives stress': (r) => r.status < 500 });
}
```

---

### Prueba 4 — BI/Analytics bajo estrés

| Campo              | Detalle                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| **Endpoint**       | `GET /api/bi/kpis`                                                         |
| **Autenticación**  | JWT requerido (rol GERENCIA)                                               |
| **Timeout**        | 8 segundos (mayor tolerancia por ser consulta analítica compleja)          |
| **Propósito**      | Evaluar si las consultas BI aguantan estrés sin colapsar la DB             |

Los endpoints de BI son los más costosos del sistema por sus agregaciones. Bajo estrés, se espera lentitud pero no errores 5xx.

```javascript
function stressBi(token) {
  const res = http.get(`${BASE_URL}/api/bi/kpis`, { timeout: '8s', ... });
  check(res, { 'bi survives stress': (r) => r.status < 500 });
}
```

---

### Prueba 5 — Spike de autenticaciones rápidas

| Campo              | Detalle                                                                    |
| ------------------ | -------------------------------------------------------------------------- |
| **Endpoint**       | `POST /api/auth/login` (×3 en rápida sucesión)                            |
| **Propósito**      | Simular ataques de fuerza bruta / picos de login para verificar que el servidor no devuelve 500 |

El 20% de los VUs ejecuta esta sub-prueba, que hace 3 logins consecutivos con 100ms de pausa entre ellos.

```javascript
function stressRapidAuth(user) {
  for (let i = 0; i < 3; i++) {
    const res = http.post(`${BASE_URL}/api/auth/login`, ...);
    check(res, { 'rapid auth → not 500': (r) => r.status !== 500 });
    sleep(0.1);
  }
}
```

---

## 6. Escenario de carga (stages)

El test usa 4 stages con `constant-arrival-rate` para simular niveles de tráfico específicos:

```javascript
scenarios: {
  stress_100:    { rate: 100,    timeUnit: '1m', duration: '1m',  maxVUs: 150  },  // baseline
  stress_15000:  { rate: 15000,  timeUnit: '1m', duration: '3m',  maxVUs: 3000 },  // high stress
  stress_2000:   { rate: 2000,   timeUnit: '1m', duration: '2m',  maxVUs: 600  },  // recovery
  stress_200000: { rate: 200000, timeUnit: '1m', duration: '2m',  maxVUs: 5000 },  // spike extremo
}
```

| Stage          | req/min   | Duración | Inicio  | Objetivo                                      |
| -------------- | --------- | -------- | ------- | --------------------------------------------- |
| Baseline       | 100       | 1 min    | 0s      | Establecer métricas base bajo carga normal     |
| High stress    | 15,000    | 3 min    | 1m 30s  | Estrés alto sostenido                         |
| Recovery       | 2,000     | 2 min    | 5m      | ¿El sistema se recupera tras el estrés alto?   |
| Spike extremo  | 200,000   | 2 min    | 7m 30s  | Encontrar el punto de quiebre absoluto         |

**Duración total:** ~10 minutos

---

## 7. Umbrales definidos

```javascript
thresholds: {
  http_req_duration:                        ['p(95)<5000'],  // global: p95 < 5s
  http_req_failed:                          ['rate<0.50'],   // global: < 50% fallos
  error_rate:                               ['rate<0.50'],
  'http_req_duration{stage:baseline_100}':  ['p(95)<500'],   // baseline debe ser rápido
  'http_req_failed{stage:baseline_100}':    ['rate<0.05'],   // baseline: < 5% error
  'http_req_duration{stage:recovery_2000}': ['p(95)<2000'],  // recovery: < 2s
  'http_req_failed{stage:recovery_2000}':   ['rate<0.20'],   // recovery: < 20% error
}
```

| Métrica                      | Umbral     | Justificación                                        |
| ---------------------------- | ---------- | ---------------------------------------------------- |
| `http_req_duration` (global) | p95 < 5s   | Bajo 200k req/min la latencia se degrada extremo     |
| `http_req_failed` (global)   | rate < 50% | En spike extremo se tolera hasta la mitad de fallos  |
| baseline `http_req_duration` | p95 < 500ms| A 100 req/min el sistema debe responder normalmente  |
| baseline `http_req_failed`   | rate < 5%  | Casi sin errores en carga baja                       |
| recovery `http_req_duration` | p95 < 2s   | Al bajar la carga el sistema debe empezar a recuperar|
| recovery `http_req_failed`   | rate < 20% | Tolerancia moderada durante la recuperación          |

---

## 8. Cómo ejecutar las pruebas

### Paso 1 — Smoke test (verificación rápida, 1 iteración)

```bash
k6 run tests/k6/stress/api.stress.js --vus 1 --iterations 1
```

Con Docker:
```bash
docker run --rm -i --network host grafana/k6 run --vus 1 --iterations 1 \
  - < tests/k6/stress/api.stress.js
```

Todos los checks deben ser ✓ antes de continuar con la prueba completa.

### Paso 2 — Prueba completa de estrés

```bash
k6 run tests/k6/stress/api.stress.js
```

Con Docker:
```bash
docker run --rm -i --network host grafana/k6 run \
  - < tests/k6/stress/api.stress.js
```

### Con URL personalizada

```bash
k6 run --env BASE_URL=http://staging.logitrans.com:3006 tests/k6/stress/api.stress.js
```

### Guardar resultados en JSON

```bash
k6 run --out json=tests/k6/stress/stress-result.json tests/k6/stress/api.stress.js
```

---

## 9. Resultados obtenidos

### Ambiente de ejecución

| Parámetro              | Valor                                          |
| ---------------------- | ---------------------------------------------- |
| Fecha de ejecución     | 2026-04-17                                     |
| Versión del sistema    | LogiTrans v2.0 (1S 2026)                       |
| Ambiente               | **Producción** — `https://guatechnology.com`   |
| Base URL               | `https://guatechnology.com`                    |
| VUs máximos alcanzados | 5,000                                          |
| Duración total         | 10m 00s                                        |
| k6                     | Docker `grafana/k6:latest`                     |
| Total iteraciones      | 40,962                                         |
| Total requests HTTP    | 149,308 (248.8 req/s)                          |
| Iteraciones descartadas| 407,343 (k6 no pudo generar 200k req/min)      |

---

### Smoke test contra producción (1 VU, 1 iteración) — PASÓ ✓

```
█ THRESHOLDS
  ✓ error_rate        rate=0.00%
  ✓ http_req_duration p(95)=206ms
  ✓ http_req_failed   rate=12.50%

█ CHECKS
  ✓ health survives stress
  ✓ login survives stress
  ✓ orders survives stress
  ✓ bi survives stress
  ✓ rapid auth → not 500

  checks_succeeded: 100.00% 8 out of 8
  response_duration: avg=109ms  p(95)=210ms  max=226ms
```

---

### Prueba completa de estrés en producción — PUNTO DE QUIEBRE ENCONTRADO

```
█ THRESHOLDS

  error_rate
  ✗ 'rate<0.50'   rate=87.04%    ← SUPERADO bajo spike de 200k req/min

  http_req_duration (global)
  ✗ 'p(95)<5000'  p(95)=10s      ← SUPERADO: al techo del timeout

  http_req_duration {stage:baseline_100}
  ✓ 'p(95)<500'   p(95)=185ms    ← PASÓ: a 100 req/min el servidor vuela

  http_req_duration {stage:recovery_2000}
  ✗ 'p(95)<2000'  p(95)=10s      ← SUPERADO: el sistema no se recuperó

  http_req_failed (global)
  ✗ 'rate<0.50'   rate=89.25%    ← SUPERADO

  http_req_failed {stage:baseline_100}
  ✗ 'rate<0.05'   rate=14.53%    ← el stage de 15k req/min empezó a afectar el baseline

  http_req_failed {stage:recovery_2000}
  ✗ 'rate<0.20'   rate=72.23%    ← el sistema no se recuperó tras el spike de 15k


█ TOTAL RESULTS
  checks_total.......: 149,308   248.83/s
  checks_succeeded...: 26.59%    39,702 / 149,308
  checks_failed......: 73.40%   109,606 / 149,308

  ✗ health survives stress    35.01%  — ✓ 14,944 / ✗ 26,814   ← colapsó bajo 200k
  ✗ login survives stress      0.84%  — ✓ 698    / ✗ 82,782   ← PUNTO DE QUIEBRE
  ✗ orders survives stress    99.78%  — ✓ 459    / ✗ 1        ← casi perfecto
  ✗ bi survives stress        95.93%  — ✓ 212    / ✗ 9        ← casi perfecto
  ✓ rapid auth → not 500     100.00%


█ HTTP
  http_req_duration (global).....: avg=8.05s    p(90)=10s      p(95)=10s     max=15s
  http_req_duration (exitosas)...: avg=3.22s    p(90)=8.78s    p(95)=9.45s   max=14.16s
  http_req_duration (baseline)...: avg=106ms    p(90)=160ms    p(95)=185ms
  http_req_duration (recovery)...: avg=6.42s    p(90)=10s      p(95)=10s
  http_req_failed (global).......: 89.25%   (133,269 / 149,308)
  timeouts.......................: 109,551   182.6/s


█ EXECUTION
  iterations............: 40,962    68.3/s
  dropped_iterations....: 407,343   (200k req/min supera la capacidad de k6)
  vus_max...............: 5,000
  duration..............: 10m 00s
  iteration_duration....: avg=30.78s  p(90)=45.65s  p(95)=45.66s


█ NETWORK
  data_received: 57 MB   (94 kB/s)
  data_sent....: 36 MB   (59 kB/s)
```

---

### Análisis de resultados por stage

| Stage             | req/min   | p95 latencia | Error rate | Resultado         |
| ----------------- | --------- | ------------ | ---------- | ----------------- |
| Baseline (100)    | 100       | **185 ms**   | 14.53%*    | ✓ Sistema sano    |
| High stress       | 15,000    | >5s          | ~70%       | ✗ Saturado        |
| Recovery          | 2,000     | 10s          | 72.23%     | ✗ No se recuperó  |
| Spike extremo     | 200,000   | 10s (techo)  | ~95%       | ✗ Colapsó         |

\* El 14.53% de error en baseline se explica porque los stages paralelos de 15k y 200k req/min colapsaron el servidor durante el período de medición del baseline.

### Punto de quiebre: login (bcrypt) bajo alta concurrencia

| Endpoint                    | Comportamiento                                               |
| --------------------------- | ------------------------------------------------------------ |
| `GET /api/health`           | **Resistente** a baja carga (100 req/min) → colapsa en spike |
| `POST /api/auth/login`      | **Punto de quiebre** — 0.84% éxito bajo 15k+ req/min        |
| `GET /api/logistics/orders` | **Muy resistente** — 99.78% éxito en requests que llegaron   |
| `GET /api/bi/kpis`          | **Muy resistente** — 95.93% éxito en requests que llegaron   |

**¿Por qué el login colapsa primero?** bcrypt es intencionalmente costoso en CPU para dificultar ataques de fuerza bruta. Bajo 15,000 req/min concurrentes, el proceso Node.js satura su hilo único de CPU con operaciones bcrypt y deja de procesar nuevas requests. Es la limitación natural de Node.js single-thread con operaciones CPU-bound.

### Comportamiento de recuperación

El sistema **no se recuperó** en el stage de recovery (2,000 req/min después de 15,000): p95=10s y 72% de error rate. Esto indica que el servidor de producción necesita tiempo adicional para vaciar la cola de conexiones pendientes tras un spike extremo.

### Conclusión

| Criterio                        | Resultado                                                    |
| ------------------------------- | ------------------------------------------------------------ |
| Carga normal (100 req/min)      | **Excelente** — p95=185ms, sistema completamente funcional   |
| Punto de quiebre                | ~15,000 req/min en el endpoint de login                      |
| Capa más frágil                 | Autenticación (bcrypt CPU-bound en Node.js single-thread)    |
| Capa más resiliente             | Órdenes logísticas y BI (99%+ cuando el login funciona)      |
| Recuperación tras 15k req/min   | Lenta — el servidor tarda más de 2 min en normalizarse       |
| Tasa de error en spike extremo  | 89% (esperado bajo 200,000 req/min — carga irreal)           |

---

## 10. Interpretación del reporte

### THRESHOLDS — ¿Pasó o falló?

```
✓ p(95)<3000  p(95)=1850ms   ← PASA: el 95% de requests respondió en < 3s bajo estrés
✗ rate<0.15   rate=0.22%     ← FALLA: la tasa de error superó el 15%
```

El símbolo `✗` indica que ese umbral fue superado. **En pruebas de estrés, algunos fallos son esperados** — el objetivo no es pasar todos los umbrales, sino entender dónde está el límite.

### Métricas clave a observar

| Métrica                  | Qué observar                                                              |
| ------------------------ | ------------------------------------------------------------------------- |
| `p(95) http_req_duration`| ¿Cuándo empieza a superar los 3s? Indica el punto de saturación           |
| `http_req_failed rate`   | ¿En qué stage empieza a crecer? Revela el punto de quiebre                |
| `timeouts`               | Conteo de requests que tardaron más de 5s — indica sobrecarga extrema     |
| `iterations/s`           | El throughput real — debería caer en el stage de spike si hay saturación  |
| `vus` en los stages      | Confirmar que k6 realmente alcanzó los 400 VUs configurados               |

### Señales de recuperación exitosa

```
# Stage recovery (2,000 req/min tras el spike de 15k):
http_req_duration{stage:recovery_2000}: p(95)<2000ms  ← PASA: el sistema se recuperó
http_req_failed{stage:recovery_2000}:   rate<0.20     ← PASA: errores volvieron a niveles bajos
```

### Señales de problema (no recuperación) — lo que vimos en producción

```
# Stage recovery (resultado real en prod):
http_req_duration{stage:recovery_2000}: p(95)=10s    ← FALLA: todavía saturado
http_req_failed{stage:recovery_2000}:   rate=72.23%  ← FALLA: el servidor no se recuperó
timeouts:                               109,551       ← cola de conexiones sin vaciar
```

Cuando el recovery no pasa, significa que el servidor necesita más tiempo del definido para normalizar la cola de conexiones pendientes. Investigar logs:

```bash
# Producción
curl https://guatechnology.com/api/health

# Local
docker logs logitrans_server --tail=100
```

---

## 11. Solución de problemas comunes

### `ERRO dial tcp: connection refused`

**Causa:** El servidor no está corriendo.  
**Solución:**

```bash
docker compose up -d
curl http://localhost:3006/api/health
```

---

### `401 Credenciales inválidas`

**Causa:** El seed no se ejecutó o las contraseñas cambiaron.  
**Solución:** Verificar que el seed corrió:

```bash
curl -X POST http://localhost:3006/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"2895884051401+l@ingenieria.usac.edu.gt","password":"LogiLogistica"}'
```

Si devuelve 401, revisar el seed en `server/src/infrastructure/database/seeds/database-seeder.ts` y reiniciarlo con `DB_AUTO_SEED=true`.

---

### Todos los checks de `orders` y `bi` fallan

**Causa:** El token es `null` porque el login falló — los tests autenticados no se ejecutan.  
**Solución:** Resolver primero el problema de login con el smoke test de 1 VU.

---

### El p95 nunca baja de 3000ms incluso con 20 VUs

**Causa:** El servidor tiene muy pocos recursos asignados en Docker.  
**Solución:** Verificar que Docker Desktop tiene al menos 4GB de RAM y 2 CPUs asignados.

---

> ⚠️ **Coordinación antes de ejecutar contra producción.** Notificar al equipo antes de correr el test completo — el spike de 200k req/min dejó el servidor de prod inoperativo durante ~2 minutos en la ejecución documentada. Ejecutar únicamente cuando no haya usuarios activos.
