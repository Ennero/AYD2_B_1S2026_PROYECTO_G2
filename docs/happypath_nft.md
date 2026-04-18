# Guía de Calificación — Pruebas NFT / E2E

Comandos listos para ejecutar durante la presentación. Cubre E2E (Playwright), carga y estrés (k6).

---

## Prerequisitos

```bash
# 1. Verificar que la app local está corriendo
docker compose ps

# 2. Verificar que producción responde
curl https://guatechnology.com/api/health
# Esperado: {"status":"ok","database":"connected"}
```

---

## E2E — Playwright

**Directorio:** `e2e/`  
**Entorno:** la app debe estar corriendo (local en `:3000` o apuntando a producción).

### Instalar (solo la primera vez)
```bash
cd e2e
npm install
npm run install:browsers
```

### Comandos de ejecución

```bash
cd e2e

# Correr todas las pruebas (headless, recomendado para calificación)
npm test

# Con navegador visible — útil para demostrar en vivo
npm run test:headed

# UI interactiva — para depurar un test específico
npm run test:ui

# Ver reporte HTML después de correr
npm run test:report
```

### Contra producción

```bash
cd e2e
BASE_URL=https://guatechnology.com npm test
```

### Tests disponibles (12 pasando)

| Archivo | Flujo cubierto |
|---|---|
| `auth/login.spec.ts` | Login + redirección por rol (5 casos) |
| `clientes/register-client.spec.ts` | Registro de cliente en 3 pasos |
| `clientes/manage-user.spec.ts` | Editar usuario existente |
| `certificador-fel/certificar-factura.spec.ts` | Validar NIT y certificar factura |
| `agente-financiero/revisar-borrador.spec.ts` | Revisar borrador y enviar a FEL |
| `gerencia/dashboard-ejecutivo.spec.ts` | Alertas y proyecciones de expansión |
| `piloto/transito-bitacora.spec.ts` | Iniciar viaje y registrar bitácora |
| `portal-cliente/contactos.spec.ts` | Agregar y editar contacto clave |

---

## Pruebas de Carga — k6

**Archivo:** `tests/k6/load/api.load.js`  
**Duración:** ~17 minutos | **5 escenarios escalantes**

| Escenario | Usuarios/min | Duración | Inicio |
|---|---|---|---|
| load_100 | 100 | 1 min | 0s |
| load_1000 | 1,000 | 3 min | 1m30s |
| load_2000 | 2,000 | 5 min | 5m |
| load_5000 | 5,000 | 1 min | 10m30s |
| load_10000 | 10,000 | 5 min | 12m |

### Comandos

```bash
# Smoke test — verificar antes de correr (5 segundos)
k6 run --env BASE_URL=https://guatechnology.com \
       --vus 1 --iterations 1 \
       tests/k6/load/api.load.js

# Test completo contra producción
k6 run --env BASE_URL=https://guatechnology.com \
       tests/k6/load/api.load.js

# Con reporte JSON
k6 run --env BASE_URL=https://guatechnology.com \
       --out json=tests/k6/reports/load-result.json \
       tests/k6/load/api.load.js
```

### Umbrales (deben pasar en verde ✓)

| Métrica | Límite |
|---|---|
| `http_req_duration` p(95) | < 500ms |
| `http_req_failed` rate | < 1% |
| `login_duration` p(95) | < 1000ms |
| `orders_duration` p(95) | < 500ms |
| `health_duration` p(95) | < 200ms |

---

## Pruebas de Estrés — k6

**Archivo:** `tests/k6/stress/api.stress.js`  
**Duración:** ~13 minutos | **Sube hasta 400 VUs para encontrar el límite**

| Fase | VUs | Tiempo |
|---|---|---|
| Baseline | 0 → 20 | 0:00 |
| Ramp stress | 20 → 100 | 1:00 |
| High stress | 100 → 200 | 3:00 |
| Near-break | 200 → 300 | 6:00 |
| Spike | 300 → 400 | 8:00 |
| Recovery | 400 → 0 | 9:00 |

### Comandos

```bash
# Smoke test de estrés
k6 run --env BASE_URL=https://guatechnology.com \
       --vus 1 --iterations 1 \
       tests/k6/stress/api.stress.js

# Test completo contra producción
k6 run --env BASE_URL=https://guatechnology.com \
       tests/k6/stress/api.stress.js

# Con reporte JSON
k6 run --env BASE_URL=https://guatechnology.com \
       --out json=tests/k6/reports/stress-result.json \
       tests/k6/stress/api.stress.js
```

### Umbrales (laxos por diseño)

| Métrica | Límite | Por qué |
|---|---|---|
| `http_req_duration` p(95) | < 3000ms | A 400 VUs la latencia sube, es esperado |
| `http_req_failed` rate | < 15% | Degradación parcial es aceptable |
| `error_rate` rate | < 15% | Lo crítico es que baje al hacer cool-down |

> En producción, el estrés puede activar el **auto-scaling de ECS** (CPU > 70% → hasta 6 Fargate tasks). Es comportamiento esperado y deseable — evidencia de que la infraestructura se adapta.

---

## Credenciales del seed

Usadas internamente por los scripts k6 y los tests E2E.

| Rol | Email | Contraseña |
|---|---|---|
| Agente Logístico | `2895884051401+l@ingenieria.usac.edu.gt` | `LogiLogistica` |
| Agente Operativo | `2895884051401+s@ingenieria.usac.edu.gt` | `LogiSAT` |
| Piloto | `2895884051401+t@ingenieria.usac.edu.gt` | `LogiPiloto` |
| Encargado Patio | `2895884051401+p@ingenieria.usac.edu.gt` | `LogiPatio` |
| Finanzas | `2895884051401+f@ingenieria.usac.edu.gt` | `LogiFinanzas` |
| Gerencia | `2895884051401@ingenieria.usac.edu.gt` | `LogiGerencia` |
| Cliente | login del portal cliente | según seed |

---

## Solución rápida de problemas

| Síntoma | Causa probable | Solución |
|---|---|---|
| `connection refused` en k6 | Backend no está corriendo | `docker compose up -d` |
| `401` en login (k6) | Seed no aplicado | `docker compose down -v && docker compose up -d --build` |
| E2E falla con `TimeoutError` | Frontend no responde | Verificar `docker compose ps` y esperar 30s al arranque |
| k6 termina con `exit code 99` | Threshold superado | Ver qué métrica falló en el output — puede ser RAM de Docker (mínimo 4GB) |
| Smoke test pasa pero test completo falla | Servidor se degrada bajo carga | Documentar el threshold observado — es un resultado válido |
| `request timeout` masivo en `load_10000` (local) | Un solo contenedor no aguanta 10,000 req/min de bcrypt | Esperado en local — correr contra producción para ver el auto-scaling real |

```bash
# Smoke test primero
k6 run --env BASE_URL=https://guatechnology.com \
       --vus 1 --iterations 1 \
       tests/k6/load/api.load.js

# Test completo contra producción
k6 run --env BASE_URL=https://guatechnology.com \
       tests/k6/load/api.load.js
```
