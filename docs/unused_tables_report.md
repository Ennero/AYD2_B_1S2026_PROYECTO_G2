# Reporte de Tablas No Utilizadas

## Resultado

No se identificaron tablas completamente huérfanas en el MVP actual.

La revisión se hizo contrastando:
- `db/logitrans_postgresql.sql`
- `docs/endpoint_tables.md`
- Los mocks HTML por módulo

Todas las tablas del esquema participan en al menos uno de estos casos:
- autenticación o recuperación de acceso
- flujo operativo visible en mocks
- soporte a reglas/validaciones del backend
- agregaciones para dashboards o vistas analíticas

## Tablas con uso indirecto o de soporte

Estas tablas no siempre aparecen como una pantalla propia o un CRUD explícito, pero sí siguen siendo necesarias:

| Tabla | Uso actual | Motivo por el que no debe marcarse como eliminable |
| --- | --- | --- |
| `PASSWORD_RECOVERY_TOKENS` | Recuperación de contraseña | Soporta `/api/auth/recovery` y `/api/auth/password` |
| `BRANCHES` | Analítica / BI | Alimenta comparativos por sede mediante vistas y consultas gerenciales |
| `CONTRACT_RATES` | Soporte comercial-financiero | Se sincroniza desde contratos y sirve para tarifario pactado por ruta/tipo de vehículo |
| `USERS` | Identidad interna de plataforma | Sigue siendo clave para login, pilotos, patio, logística, finanzas y certificador |

## Cambio importante validado

`CLIENT_CONTACTS` ya sustituyó el uso incorrecto de `USERS` para contactos de cliente.

Eso significa que ahora:
- los contactos comerciales del cliente viven separados de los usuarios internos del sistema
- `USERS` ya no debe interpretarse como tabla de contactos de cliente
- el portal cliente y el catálogo de endpoints quedaron alineados con esa separación

## Conclusión

A nivel MVP, la base quedó consistente: no hay tablas claramente sobrantes.

Lo más cercano a "no usadas directamente" son tablas de soporte, auditoría operativa o alimentación analítica, pero todas tienen justificación funcional dentro del flujo definido.
