# LogiTrans Guatemala
## Reporte de Pruebas

> **Version:** 1.0  
> **Fecha:** 17 de abril de 2026  
> **Proyecto:** AYD2_B_1S2026_PROYECTO_G2

---

## Tabla de Contenidos

- [LogiTrans Guatemala](#logitrans-guatemala)
  - [Reporte de Pruebas](#reporte-de-pruebas)
  - [Tabla de Contenidos](#tabla-de-contenidos)
  - [1. Objetivo del reporte](#1-objetivo-del-reporte)
  - [2. Alcance](#2-alcance)
  - [3. Estrategia general de pruebas](#3-estrategia-general-de-pruebas)
  - [4. Pruebas automatizadas en pipeline (CI)](#4-pruebas-automatizadas-en-pipeline-ci)
    - [Registro de corrida CI (llenado manual)](#registro-de-corrida-ci-llenado-manual)
  - [5. Pruebas unitarias (backend)](#5-pruebas-unitarias-backend)
    - [5.1 Que validan](#51-que-validan)
    - [5.2 Como se ejecutan](#52-como-se-ejecutan)
    - [5.3 Resultado de ejecucion (llenado manual)](#53-resultado-de-ejecucion-llenado-manual)
  - [6. Pruebas de integracion (backend + PostgreSQL)](#6-pruebas-de-integracion-backend--postgresql)
    - [6.1 Que validan](#61-que-validan)
    - [6.2 Como se ejecutan](#62-como-se-ejecutan)
    - [6.3 Resultado de ejecucion (llenado manual)](#63-resultado-de-ejecucion-llenado-manual)
  - [7. Pruebas E2E (Playwright)](#7-pruebas-e2e-playwright)
    - [7.1 Que validan](#71-que-validan)
    - [7.2 Como se ejecutan](#72-como-se-ejecutan)
  - [8. Pruebas de carga (k6)](#8-pruebas-de-carga-k6)
    - [8.1 Que validan](#81-que-validan)
    - [8.2 Como se ejecutan](#82-como-se-ejecutan)
  - [9. Pruebas de estres (k6)](#9-pruebas-de-estres-k6)
    - [9.1 Que validan](#91-que-validan)
    - [9.2 Como se ejecutan](#92-como-se-ejecutan)
    - [9.3 Resultado de ejecucion (llenado manual)](#93-resultado-de-ejecucion-llenado-manual)
  - [10. Matriz de resultados para evaluacion](#10-matriz-de-resultados-para-evaluacion)
  - [11. Evidencia de ejecucion](#11-evidencia-de-ejecucion)
    - [11.1 Video de pruebas y pipeline](#111-video-de-pruebas-y-pipeline)
  - [13. Aprobacion final](#13-aprobacion-final)

---

## 1. Objetivo del reporte

Documentar formalmente las pruebas del proyecto LogiTrans, indicando:

- Que valida cada tipo de prueba.
- Como se ejecuta cada tipo de prueba.
- Que pruebas se ejecutan en CI/CD y cuales son manuales.
- Espacios de resultados para completar al momento de aprobar cada ejecucion.

---

## 2. Alcance

Este reporte cubre las pruebas identificadas en el repositorio:

- Unitarias backend (Jest).
- Integracion backend con base de datos real (Jest + PostgreSQL).
- E2E funcional por roles (Playwright).
- Carga (k6).
- Estres (k6).

Fuentes base de validacion de comandos y alcance:

- `.github/workflows/github-actions-colibri.yml`
- `server/package.json`
- `e2e/package.json`
- `tests/k6/load/LOAD_TESTING.md`
- `tests/k6/stress/STRESS_TESTING.md`

---

## 3. Estrategia general de pruebas

| Tipo | Herramienta | Objetivo | Ejecucion |
|---|---|---|---|
| Unitarias | Jest | Validar logica aislada de casos de uso y servicios | Automatica en CI + manual |
| Integracion | Jest + PostgreSQL | Validar endpoints/flujo con DB real y configuracion de test | Automatica en CI + manual |
| E2E | Playwright | Validar flujo funcional por rol de punta a punta | Manual |
| Carga | k6 | Medir comportamiento bajo demanda esperada | Manual |
| Estres | k6 | Medir limite de degradacion y recuperacion | Manual |

---

## 4. Pruebas automatizadas en pipeline (CI)

Workflow de referencia: `.github/workflows/github-actions-colibri.yml`

Actualmente, el pipeline ejecuta automaticamente solo dos pruebas:

| Job CI | Comando | Tipo de prueba | Estado esperado |
|---|---|---|---|
| `test-unit` | `cd server && npm run test` | Unitarias backend | Exito (`pass`) |
| `test-integration` | `cd server && npm run test:integration` | Integracion backend | Exito (`pass`) |

### Registro de corrida CI (llenado manual)

| Campo | Valor |
|---|---|
| Fecha y hora de ejecucion | |
| Pull Request / Rama | |
| Commit SHA | |
| Resultado `test-unit` | |
| Resultado `test-integration` | |
| Enlace a corrida en GitHub Actions | |
| Observaciones | |

---

## 5. Pruebas unitarias (backend)

### 5.1 Que validan

- Reglas de negocio en casos de uso de autenticacion.
- Reglas de negocio en operaciones (clientes/cargas/rutas).
- Servicios/controladores del modulo certificador.
- Manejo de errores, validaciones y estados esperados.

### 5.2 Como se ejecutan

```bash
cd server
npm run test
```

Opcionales:

```bash
cd server
npm run test:unit
npm run test:unit:watch
npm run test:unit:cov
```

### 5.3 Resultado de ejecucion (llenado manual)

| Campo | Valor |
|---|---|
| Fecha y hora | |
| Ejecutado por | |
| Ambiente (local/CI) | |
| Comando exacto | |
| Resultado general (PASS/FAIL) | |
| Total de suites | |
| Total de tests | |
| Duracion total | |
| Evidencia (captura/log) | |
| Observaciones | |

---

## 6. Pruebas de integracion (backend + PostgreSQL)

### 6.1 Que validan

- Integracion real entre API backend y PostgreSQL de pruebas.
- Endpoints criticos (auth, health y flujos de cliente en integracion).
- Inicializacion de esquema/seed de entorno de prueba.
- Comportamiento de validaciones y respuestas HTTP en flujo integrado.

### 6.2 Como se ejecutan

```bash
cd server
npm run test:integration
```

### 6.3 Resultado de ejecucion (llenado manual)

| Campo | Valor |
|---|---|
| Fecha y hora | |
| Ejecutado por | |
| Ambiente (local/CI) | |
| Comando exacto | |
| Resultado general (PASS/FAIL) | |
| DB de pruebas disponible (SI/NO) | |
| Suites ejecutadas | |
| Tests ejecutados | |
| Duracion total | |
| Evidencia (captura/log) | |
| Observaciones | |

---

## 7. Pruebas E2E (Playwright)

### 7.1 Que validan

- Flujos funcionales completos por rol.
- Navegacion, formularios, transiciones de estado y validaciones visibles.
- Integracion frontend-backend en escenarios de negocio de punta a punta.

### 7.2 Como se ejecutan

```bash
cd e2e
npm test
```

Opcionales:

```bash
cd e2e
npm run test:headed
npm run test:ui
npm run test:debug
npm run test:report
```



## 8. Pruebas de carga (k6)

### 8.1 Que validan

- Desempeno bajo carga esperada.
- Latencia y tasa de error bajo concurrencia sostenida.
- Estabilidad de endpoints principales durante demanda normal-alta.

### 8.2 Como se ejecutan

```bash
k6 run tests/k6/load/api.load.js
```



## 9. Pruebas de estres (k6)

### 9.1 Que validan

- Comportamiento en condiciones por encima de la carga esperada.
- Punto de degradacion y resiliencia del sistema.
- Recuperacion del sistema durante la fase de descenso de carga.

### 9.2 Como se ejecutan

```bash
k6 run tests/k6/stress/api.stress.js
```

### 9.3 Resultado de ejecucion (llenado manual)

| Campo | Valor |
|---|---|
| Fecha y hora | |
| Ejecutado por | |
| Ambiente (local/prod-simulado) | |
| Comando exacto | |
| Resultado general (PASS/FAIL) | |
| p95 (`http_req_duration`) | |
| error rate (`http_req_failed`) | |
| pico de VUs alcanzado | |
| recuperacion observada (SI/NO) | |
| Evidencia (captura/log/export) | |
| Observaciones | |

---

## 10. Matriz de resultados para evaluacion

> Completar esta tabla cuando se cierre cada bloque de pruebas.

| Bloque | Peso | Resultado | Observaciones | Puntaje |
|---|---:|---|---|---:|
| Pruebas unitarias | 3 | | | |
| Pruebas de integracion | 3 | | | |
| Pruebas E2E | 3 | | | |
| Pruebas de carga | 3 | | | |
| Pruebas de estres | 3 | | | |

---

## 11. Evidencia de ejecucion

### 11.1 Video de pruebas y pipeline

- Video (Google Drive): https://drive.google.com/file/d/1ufW0e0h3kbWgO5YF3zCcfsc26B3nqXem/view?usp=sharing
- Video (YouTube): https://youtu.be/Wi7t-aH-_w0?si=5yoLN27F77zqG9eu


---

## 13. Aprobacion final

| Campo | Valor |
|---|---|
| Fecha de cierre del reporte | |
| Responsable QA / Equipo | |
| Estado final del reporte (APROBADO / PENDIENTE) | |
| Comentario de cierre | |

