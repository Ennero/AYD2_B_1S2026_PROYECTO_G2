# Copilot Temp Notes (Temporal)

Este archivo es temporal y sirve para mantener contexto de implementación durante esta sesión.

## Objetivo activo
- Prefijo telefónico con combobox (+502/+503/+504) y persistencia canónica en DB.
- Correos sin links/botones; solo instrucciones.
- Recuperación de contraseña por token manual (sin URL).
- Corrección de aprobación de contrato (creditLimit opcional al aceptar).
- Actualización de documentación durante la ejecución.

## Estado
- Completado (implementación técnica principal).

## Implementado
- Prefijo telefónico con combobox y persistencia canónica `+502/+503/+504` en vistas de registro/edición clave.
- Validación backend para teléfonos en formato prefijado.
- Corrección de aceptación de contrato: `creditLimit` opcional al aceptar.
- Recuperación de contraseña por token manual (sin URL):
	- Backend reset por body con `token`.
	- Frontend envía `token`, `password`, `confirmation` en body.
	- Plantilla de correo de recuperación con token e instrucciones.
- Correos de bienvenida, propuesta y factura ajustados a política sin links/botones.
- Documentación base actualizada (`happypath`, `endpoint_tables`, `mvp_accessos_usuarios`).
