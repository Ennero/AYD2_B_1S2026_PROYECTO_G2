# LogiTrans — Pruebas de Carga (k6)

> **Módulo:** Agente Logístico  
> **Herramienta:** [k6](https://k6.io/) por Grafana Labs  
> **Responsable:** David (Pruebas de Carga)  
> **Ubicación en el repositorio:** `tests/k6/`

---

## Tabla de Contenidos

- [1. ¿Qué son las pruebas de carga?](#1-qué-son-las-pruebas-de-carga)
- [2. Requisitos previos](#2-requisitos-previos)
- [3. Estructura de archivos](#3-estructura-de-archivos)
- [4. Credenciales de prueba](#4-credenciales-de-prueba)
- [5. Descripción de las 5 pruebas](#5-descripción-de-las-5-pruebas)
- [6. Umbrales definidos](#6-umbrales-definidos)
- [7. Cómo ejecutar las pruebas](#7-cómo-ejecutar-las-pruebas)
- [8. Resultados esperados](#8-resultados-esperados)
- [9. Interpretación del reporte](#9-interpretación-del-reporte)
- [10. Solución de problemas comunes](#10-solución-de-problemas-comunes)

---

## 1. ¿Qué son las pruebas de carga?

Las pruebas de carga evalúan el comportamiento del sistema cuando se somete a una **demanda esperada real de producción**. La pregunta que responden es: _¿el sistema aguanta el tráfico normal sin degradarse?_

A diferencia de las pruebas de estrés (que buscan romper el sistema), las pruebas de carga simulan condiciones **normales pero concurrentes**, verificando que los tiempos de respuesta y la tasa de errores se mantengan dentro de los límites aceptables.

### Objetivos específicos de estas pruebas

Según el enunciado del proyecto (Fase 3), el sistema debe cumplir:

| Requisito                  | Valor exigido                       |
| -------------------------- | ----------------------------------- |
| Transacciones simultáneas  | 200 TPS (transacciones por segundo) |
| Latencia máxima            | 500 ms (p95)                        |
| Tasa de error máxima       | < 1%                                |
| Disponibilidad del sistema | 99.9%                               |

### Decisión de diseño: un solo rol

Las pruebas usan exclusivamente el rol `AGENTE_LOGISTICO` para evitar respuestas 403 mezcladas con errores reales. Usar múltiples roles con un solo token causaba que endpoints de un rol devolvieran 403 al token de otro, lo que disparaba `http_req_failed` por encima del umbral permitido del 1%.

Con un solo rol se garantiza que **todos los endpoints devuelven 200**, manteniendo la integridad de las métricas.

---

## 2. Requisitos previos

### Instalar k6

```bash
# Windows (Chocolatey)
choco install k6

# macOS (Homebrew)
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg --no-default-keyring \
     --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
     --keyserver hkp://keyserver.ubuntu.com:80 \
     --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] \
     https://dl.k6.io/deb stable main" \
     | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# Docker (sin instalación local)
docker run --rm -i grafana/k6 run - < api.load.js
```

Verificar instalación:

```bash
k6 version
# Output esperado: k6 v0.x.x (...)
```

### Levantar el backend

Las pruebas apuntan al backend en `http://localhost:3000`. Asegúrate de que esté corriendo:

```bash
# Opción A — desarrollo local
cd server && npm run start:dev

# Opción B — Docker
docker compose up -d

# Verificar que responde
curl http://localhost:3000/health
# Esperado: {"status":"ok","database":"connected"}
```

---

## 3. Estructura de archivos

```
tests/
└── k6/
    ├
    ├── helpers/
    │   └── base.js              ← Funciones compartidas (login, headers, check200)
    └── load/
        └── api.load.js          ← Script principal de pruebas de carga
        └── LOAD_TESTING.md          ← Este manual
```

### `helpers/base.js`

Contiene utilidades reutilizables por todos los scripts de k6 del proyecto:

| Función                     | Descripción                              |
| --------------------------- | ---------------------------------------- |
| `getToken(email, password)` | Hace POST al login y retorna el JWT      |
| `jsonHeaders()`             | Headers JSON sin autenticación           |
| `authHeaders(token)`        | Headers JSON con `Authorization: Bearer` |
| `check200(res, label)`      | Verifica status 200 y registra métrica   |

### `api.load.js`

Script principal que orquesta los 5 escenarios de prueba. Usa una función `setup()` que corre **una sola vez** antes de todos los VUs para obtener un `ORDER_ID` real del seed, evitando hardcodear IDs que pueden cambiar.

---

## 4. Credenciales de prueba

Las pruebas usan el usuario `AGENTE_LOGISTICO` creado por el seed del backend:

```javascript
const USER = {
  email: "2895884051401+l@ingenieria.usac.edu.gt",
  password: "LogiLogistica",
};
```

> **Importante:** Si el seed fue reiniciado o las contraseñas cambiaron, actualiza estas credenciales antes de ejecutar. Verifica con:
>
> ```bash
> curl -X POST http://localhost:3000/api/auth/login \
>   -H "Content-Type: application/json" \
>   -d '{"email":"2895884051401+l@ingenieria.usac.edu.gt","password":"LogiLogistica"}'
> ```
>
> Debe devolver `200` con un `data.token`.

---

## 5. Descripción de las 5 pruebas

### Prueba 1 — Health Check

| Campo              | Detalle                                                              |
| ------------------ | -------------------------------------------------------------------- |
| **Endpoint**       | `GET /health`                                                        |
| **Autenticación**  | No requerida                                                         |
| **Métrica custom** | `health_duration`                                                    |
| **Umbral**         | `p(95) < 200ms`                                                      |
| **Propósito**      | Verificar que el servidor responde y la DB está conectada bajo carga |

Esta es la prueba base. Si falla, el sistema entero está caído y las demás pruebas no tienen sentido.

```javascript
function testHealth() {
  const res = http.get(`${BASE_URL}/health`);
  healthDuration.add(res.timings.duration);
  check(res, { "health → 200": (r) => r.status === 200 });
}
```

---

### Prueba 2 — Login

| Campo              | Detalle                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| **Endpoint**       | `POST /api/auth/login`                                                   |
| **Autenticación**  | No requerida (es el proceso de autenticación)                            |
| **Métrica custom** | `login_duration`                                                         |
| **Umbral**         | `p(95) < 1000ms`                                                         |
| **Propósito**      | Medir el tiempo de autenticación bajo carga concurrente (incluye bcrypt) |

El umbral de 1000ms (no 500ms) se justifica porque `bcrypt` introduce un delay intencional de seguridad al comparar contraseñas. Bajo 50 VUs simultáneos, este proceso puede acumularse en el servidor.

```javascript
function testLogin() {
  const res = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email: USER.email, password: USER.password }),
    { headers: { "Content-Type": "application/json" } },
  );
  loginDuration.add(res.timings.duration);
  check(res, {
    "login → 200": (r) => r.status === 200,
    "login → has token": (r) => !!r.json("data.token"),
  });
  return res.json("data.token");
}
```

---

### Prueba 3 — Listar Órdenes Logísticas

| Campo              | Detalle                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| **Endpoint**       | `GET /api/logistics/orders`                                              |
| **Autenticación**  | JWT con rol `AGENTE_LOGISTICO`                                           |
| **Métrica custom** | `orders_duration`                                                        |
| **Umbral**         | `p(95) < 500ms`                                                          |
| **Propósito**      | Simular múltiples agentes consultando órdenes pendientes simultáneamente |

Este endpoint realiza un JOIN entre `ORDERS`, `CONTRACTS` y `CLIENTS`, por lo que es representativo de la carga real sobre la base de datos.

```javascript
function testListOrders(token) {
  const res = http.get(`${BASE_URL}/api/logistics/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  ordersDuration.add(res.timings.duration);
  check(res, { "logistics-orders → 200": (r) => r.status === 200 });
}
```

---

### Prueba 4 — Detalle de una Orden

| Campo              | Detalle                                                                   |
| ------------------ | ------------------------------------------------------------------------- |
| **Endpoint**       | `GET /api/logistics/orders/:id`                                           |
| **Autenticación**  | JWT con rol `AGENTE_LOGISTICO`                                            |
| **Métrica custom** | `order_detail_duration`                                                   |
| **Umbral**         | `p(95) < 500ms`                                                           |
| **Propósito**      | Medir el tiempo de respuesta al cargar el detalle de una orden individual |

El `ORDER_ID` se obtiene automáticamente en la función `setup()` consultando la primera orden disponible del seed. Si no hay órdenes disponibles, este test se omite sin contar como error.

```javascript
function testOrderDetail(token, orderId) {
  if (!orderId) return; // sin orden del seed — omitir
  const res = http.get(`${BASE_URL}/api/logistics/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  orderDetailDuration.add(res.timings.duration);
  check(res, { "order-detail → 200": (r) => r.status === 200 });
}
```

---

### Prueba 5 — Binomios Disponibles

| Campo              | Detalle                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| **Endpoint**       | `GET /api/logistics/unit-binomials`                                                     |
| **Autenticación**  | JWT con rol `AGENTE_LOGISTICO`                                                          |
| **Métrica custom** | `binomials_duration`                                                                    |
| **Umbral**         | `p(95) < 500ms`                                                                         |
| **Propósito**      | Medir el tiempo de consulta de binomios (piloto + vehículo) disponibles para asignación |

Este endpoint filtra `TRANSPORT_UNITS` y `USERS` validando documentación vigente, capacidad de carga y tipo de mercancía. Es una de las consultas más complejas del módulo logístico.

```javascript
function testBinomials(token, orderId) {
  const url = orderId
    ? `${BASE_URL}/api/logistics/unit-binomials?orderId=${orderId}`
    : `${BASE_URL}/api/logistics/unit-binomials`;
  const res = http.get(url, { headers: { Authorization: `Bearer ${token}` } });
  binomialsDuration.add(res.timings.duration);
  check(res, { "binomials → 200": (r) => r.status === 200 });
}
```

---

## 6. Umbrales definidos

Los thresholds determinan si la prueba **pasa (✓) o falla (✗)**:

```javascript
thresholds: {
  http_req_duration:     ['p(95)<500'],   // 95% de todas las requests < 500ms
  http_req_failed:       ['rate<0.01'],   // menos del 1% de requests fallidas
  health_duration:       ['p(95)<200'],   // health check muy rápido
  login_duration:        ['p(95)<1000'],  // login puede tardar más (bcrypt)
  orders_duration:       ['p(95)<500'],   // lista de órdenes < 500ms
  order_detail_duration: ['p(95)<500'],   // detalle de orden < 500ms
  binomials_duration:    ['p(95)<500'],   // binomios disponibles < 500ms
  error_rate:            ['rate<0.01'],   // errores de negocio < 1%
}
```

---

## 7. Cómo ejecutar las pruebas

### Paso 1 — Smoke test (verificación rápida)

Siempre ejecuta esto primero para confirmar que el script funciona y las credenciales son correctas:

```bash
cd tests/k6/load
k6 run api.load.js --vus 1 --iterations 1
```

Todos los checks deben ser ✓ antes de continuar.

### Paso 2 — Prueba completa de carga

```bash
cd tests/k6/load
k6 run api.load.js
```

### Con URL diferente

```bash
# Staging
k6 run --env BASE_URL=http://staging.logitrans.com api.load.js

# Docker local en otro puerto
k6 run --env BASE_URL=http://localhost:3006 api.load.js
```

### Con reporte en archivo JSON

```bash
k6 run --out json=resultado.json api.load.js
```

---

## 8. Resultados esperados

### Stages de carga

| Stage     | Duración | VUs     | Descripción                 |
| --------- | -------- | ------- | --------------------------- |
| Warm-up   | 1 min    | 0 → 10  | Calentamiento gradual       |
| Ramp-up   | 2 min    | 10 → 30 | Incremento a carga esperada |
| Peak      | 3 min    | 30 → 50 | Carga máxima sostenida      |
| Cool-down | 1 min    | 50 → 0  | Bajada gradual              |

### Output esperado al pasar todas las pruebas

```
█ THRESHOLDS
  health_duration
  ✓ 'p(95)<200'    p(95)=15ms
  http_req_duration
  ✓ 'p(95)<500'    p(95)=180ms
  http_req_failed
  ✓ 'rate<0.01'    rate=0.00%
  login_duration
  ✓ 'p(95)<1000'   p(95)=220ms
  orders_duration
  ✓ 'p(95)<500'    p(95)=95ms
  order_detail_duration
  ✓ 'p(95)<500'    p(95)=80ms
  binomials_duration
  ✓ 'p(95)<500'    p(95)=110ms
  error_rate
  ✓ 'rate<0.01'    rate=0.00%

█ TOTAL RESULTS
  checks_succeeded: 100.00%
  ✓ health → 200
  ✓ login → 200
  ✓ login → has token
  ✓ logistics-orders → 200
  ✓ order-detail → 200
  ✓ binomials → 200
```

---

## 9. Interpretación del reporte

### THRESHOLDS

```
✓ 'p(95)<500'  p(95)=164ms   ← PASA: 95% de requests < 500ms
✗ 'rate<0.01'  rate=5.00%    ← FALLA: demasiados errores
```

El símbolo `✗` significa que ese umbral fue cruzado y la prueba falló ese criterio.

### CHECKS

```
checks_succeeded: 100.00% 6 out of 6
✓ health → 200
✓ login → 200
```

Cada línea representa una aserción. Si alguna muestra `✗`, ese endpoint no respondió como se esperaba.

### Métricas HTTP

```
http_req_duration: avg=58ms  p(90)=138ms  p(95)=164ms  max=250ms
```

El **p95** es el indicador más importante — el 95% de las requests respondió en ese tiempo o menos.

### EXECUTION

```
iterations:  2702   11.22/s
vus:         50     (máximo alcanzado)
```

`iterations/s` es el throughput real. Para 200 TPS se necesita que supere 200 con todos los checks en verde.

---

## 10. Solución de problemas comunes

### `401 Credenciales inválidas`

```
Login status: 401, body: {"message":"Credenciales inválidas."}
```

**Causa:** Las contraseñas del seed cambiaron o el seed no se ejecutó.  
**Solución:** Verificar credenciales directamente:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"2895884051401+l@ingenieria.usac.edu.gt","password":"LogiLogistica"}'
```

Si devuelve error, buscar la contraseña correcta en:

```
server/src/infrastructure/database/seeds/database-seeder.ts
```

---

### `connection refused`

```
ERRO dial tcp 127.0.0.1:3000: connect: connection refused
```

**Causa:** El backend no está corriendo.  
**Solución:**

```bash
curl http://localhost:3000/health
cd server && npm run start:dev
```

---

### `orders_duration` siempre muestra `0s`

**Causa:** El login falló y el token fue `null`, por lo que los tests autenticados nunca se ejecutaron.  
**Solución:** Resolver primero el error de login con el smoke test de 1 VU.

---

### `order-detail` no aparece en los checks

**Causa:** No hay órdenes en la DB (el seed no se ejecutó o fue reiniciado).  
**Solución:** El test de detalle se omite automáticamente cuando `orderId` está vacío — no es un error. Para que se ejecute, asegúrate de que el seed haya creado órdenes:

```bash
# Reiniciar el seed
DB_AUTO_SEED=true npm run start:dev
```

---

> ⚠️ **No ejecutar pruebas de carga contra producción** sin coordinación con el equipo, ya que puede afectar a usuarios reales.
