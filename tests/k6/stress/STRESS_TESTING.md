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

El test escala los VUs de forma agresiva para encontrar el punto de quiebre:

```javascript
stages: [
  { duration: '1m',  target: 20  },  // baseline — comportamiento normal
  { duration: '2m',  target: 100 },  // ramp a nivel de estrés
  { duration: '3m',  target: 200 },  // estrés alto sostenido
  { duration: '2m',  target: 300 },  // cerca del límite: 300 VUs
  { duration: '1m',  target: 400 },  // spike: encontrar el punto de quiebre
  { duration: '2m',  target: 200 },  // recuperación parcial
  { duration: '2m',  target: 0   },  // enfriamiento completo + verificación de recuperación
]
```

| Stage                  | Duración | VUs     | Objetivo                                   |
| ---------------------- | -------- | ------- | ------------------------------------------ |
| Baseline               | 1 min    | 0 → 20  | Establecer métricas base                   |
| Ramp de estrés         | 2 min    | 20 → 100| Primera zona de estrés                     |
| Estrés alto            | 3 min    | 100 → 200| Estrés sostenido — detectar degradación    |
| Near-break             | 2 min    | 200 → 300| Acercarse al límite del sistema            |
| Spike                  | 1 min    | 300 → 400| Pico máximo — punto de quiebre             |
| Recuperación parcial   | 2 min    | 400 → 200| ¿Se recupera el sistema al bajar la carga? |
| Enfriamiento           | 2 min    | 200 → 0 | ¿Vuelve a la normalidad?                   |

**Duración total:** ~13 minutos

---

## 7. Umbrales definidos

Bajo estrés extremo se toleran umbrales más amplios que en las pruebas de carga normales:

```javascript
thresholds: {
  http_req_duration: ['p(95)<3000'],  // p95 bajo 3 segundos (vs 500ms en carga normal)
  http_req_failed:   ['rate<0.15'],   // hasta 15% de fallos tolerados
  error_rate:        ['rate<0.15'],   // errores de negocio < 15%
}
```

| Métrica             | Umbral de estrés | Umbral de carga normal | Justificación                            |
| ------------------- | ---------------- | ---------------------- | ---------------------------------------- |
| `http_req_duration` | p95 < 3000 ms    | p95 < 500 ms           | Bajo 400 VUs la latencia se degrada      |
| `http_req_failed`   | rate < 15%       | rate < 1%              | Algunos fallos son esperados bajo spike  |
| `error_rate`        | rate < 15%       | rate < 1%              | Incluye 429 (rate limit) como no-error   |

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
| Fecha de ejecución     | 2026-04-16                                     |
| Versión del sistema    | LogiTrans v2.0 (1S 2026)                       |
| Ambiente               | NestJS local + PostgreSQL Docker (WSL2)        |
| Base URL               | `http://localhost:3000`                        |
| VUs máximos alcanzados | 400                                            |
| Duración total         | 13m 18s                                        |
| k6                     | Docker `grafana/k6:latest`                     |
| Total iteraciones      | 13,171                                         |
| Total requests HTTP    | 56,332 (70.6 req/s)                            |

---

### Smoke test (1 VU, 1 iteración) — PASÓ ✓

```
█ THRESHOLDS
  ✓ error_rate        rate=0.00%
  ✓ http_req_duration p(95)=121ms
  ✓ http_req_failed   rate=12.50%

█ CHECKS
  ✓ health survives stress
  ✓ login survives stress
  ✓ orders survives stress
  ✓ bi survives stress
  ✓ rapid auth → not 500

  checks_succeeded: 100.00% 8 out of 8
  response_duration: avg=57ms  p(95)=125ms  max=131ms
```

---

### Prueba completa de estrés (0→400 VUs) — PUNTO DE QUIEBRE ENCONTRADO

```
█ THRESHOLDS
  error_rate
  ✗ 'rate<0.15'   rate=35.64%    ← SUPERADO: el sistema se saturó bajo 400 VUs

  http_req_duration
  ✗ 'p(95)<3000'  p(95)=5000ms   ← SUPERADO: latencia al techo del timeout (5s)

  http_req_failed
  ✗ 'rate<0.15'   rate=46.57%    ← SUPERADO: casi la mitad de requests fallaron


█ TOTAL RESULTS
  checks_total.......: 56,332   70.59/s
  checks_succeeded...: 69.27%   39,026 / 56,332
  checks_failed......: 30.72%   17,306 / 56,332

  ✗ health survives stress     99.97%  — ✓ 13,167 / ✗ 4
  ✗ login survives stress      34.32%  — ✓ 9,040  / ✗ 17,302   ← PUNTO DE QUIEBRE
  ✓ orders survives stress    100.00%  — requests exitosas sin errores 5xx
  ✓ bi survives stress        100.00%  — requests exitosas sin errores 5xx
  ✓ rapid auth → not 500      100.00%


█ HTTP
  http_req_duration (todas).....: avg=2.19s   p(90)=5s     p(95)=5s     max=6.03s
  http_req_duration (exitosas)..: avg=680ms   p(90)=2.21s  p(95)=2.64s  max=6.03s
  http_req_failed...............: 46.57%   (26,235 / 56,332)
  timeouts......................: 17,310


█ EXECUTION
  iterations...: 13,171   16.5/s
  vus..........: max=400
  duration.....: 13m 18s
  iteration_duration: avg=10.35s  p(90)=20.22s  p(95)=20.24s


█ NETWORK
  data_received: 57 MB   (71 kB/s)
  data_sent....: 14 MB   (18 kB/s)
```

---

### Análisis de resultados

#### Punto de quiebre: endpoint de login (bcrypt)

El sistema aguantó bien hasta los ~100–200 VUs. El quiebre ocurrió en el stage de 300–400 VUs y fue causado específicamente por el endpoint `POST /api/auth/login`:

| Endpoint                | Comportamiento bajo 400 VUs                                          |
| ----------------------- | -------------------------------------------------------------------- |
| `GET /api/health`       | **Resistente** — 99.97% de éxito incluso en el pico                 |
| `POST /api/auth/login`  | **Punto de quiebre** — 34% de éxito, 17,310 timeouts                |
| `GET /api/logistics/orders` | **Resistente** — 100% de checks pasados (requests que llegaron) |
| `GET /api/bi/kpis`      | **Resistente** — 100% de checks pasados (requests que llegaron)     |

**¿Por qué el login colapsa?** El endpoint de login usa `bcrypt` para verificar contraseñas, una operación intencionalmente costosa en CPU. Con 300–400 VUs ejecutando logins simultáneos, el proceso Node.js satura su hilo de CPU, dejando de procesar nuevas requests (timeouts a los 5s). Esta es una limitación conocida de Node.js single-thread con operaciones CPU-bound.

#### Comportamiento de recuperación

Durante el stage de recuperación (400→200→0 VUs), el health check volvió a responder con normalidad, lo que indica que el servidor **sí se recupera** tras el pico — no hubo caída permanente ni crash del proceso.

#### Conclusión

| Criterio                   | Resultado                                       |
| -------------------------- | ----------------------------------------------- |
| Punto de quiebre           | ~300 VUs concurrentes en el endpoint de login   |
| Capa más frágil            | Autenticación (bcrypt CPU-bound)                |
| Capa más resiliente        | Health check, órdenes logísticas, BI            |
| Recuperación post-estrés   | Sí — el servidor se recuperó tras el enfriamiento |
| Tasa de error en el pico   | 46.57% (esperado y normal en prueba de estrés)  |

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
# Stage 6 (200 VUs tras el spike):
http_req_duration: p(95)=400ms   ← vuelve a tiempos normales
http_req_failed:   rate=0.01%    ← errores casi eliminados

# Stage 7 (enfriamiento):
http_req_duration: p(95)=120ms   ← sistema recuperado completamente
```

Si el p95 vuelve a valores normales durante el enfriamiento, el sistema se recupera correctamente del estrés.

### Señales de problema (no recuperación)

```
# Stage 7 (se esperaba recuperación):
http_req_duration: p(95)=2800ms  ← todavía alto — posible memory leak
http_req_failed:   rate=0.12%    ← errores siguen altos — el server no se recuperó
timeouts:          450           ← demasiados timeouts acumulados
```

Si los tiempos permanecen altos tras el enfriamiento, investigar logs del servidor:

```bash
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

> ⚠️ **Nunca ejecutar pruebas de estrés contra producción.** Estas pruebas están diseñadas para ambientes de desarrollo/staging y pueden dejar el servidor temporalmente inoperativo durante el spike de 400 VUs.
