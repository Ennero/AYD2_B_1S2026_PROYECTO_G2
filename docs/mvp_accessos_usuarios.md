# Accesos MVP - Usuarios Clave

Este documento resume los accesos mas utiles para pruebas MVP con la seed actual.

## Regla de contrasena usada por la seed

Para usuarios internos, la seed genera la contrasena con esta regla:

- `password = seed$<email_del_usuario>`

Ejemplo:

- email: `certificador.fel@sat.gob.gt`
- password: `seed$certificador.fel@sat.gob.gt`

## Top 7 usuarios recomendados para pruebas

| Rol               | Nombre            | Email                    | Password seed                 | Uso sugerido MVP                                       |
| ----------------- | ----------------- | ------------------------ | ----------------------------- | ------------------------------------------------------ |
| CERTIFICADOR_FEL  | Simulador FEL SAT | certificador.fel@sat.gob.gt| seed$certificador.fel@sat.gob.gt| Aprobacion y simulacion de SAT                         |
| AGENTE_OPERATIVO  | Andrea Solares    | operativo.1@logitrans.gt | seed$operativo.1@logitrans.gt | Alta de clientes, contratos y flujo comercial          |
| AGENTE_LOGISTICO  | Karla Menendez    | logistica.1@logitrans.gt | seed$logistica.1@logitrans.gt | Planificacion y asignacion de ordenes                  |
| ENCARGADO_PATIO   | Mario Caal        | patio.1@logitrans.gt     | seed$patio.1@logitrans.gt     | Registro en patio, validacion y despacho               |
| AGENTE_FINANCIERO | Silvia Monterroso | finanzas.1@logitrans.gt  | seed$finanzas.1@logitrans.gt  | Flujo FEL (borrador, validar NIT, certificar/rechazar) |
| GERENCIA          | Ricardo Solis     | gerencia@logitrans.gt    | seed$gerencia@logitrans.gt    | Dashboard BI y revision de KPIs                        |
| PILOTO            | Carlos Mendez     | piloto.01@logitrans.gt   | seed$piloto.01@logitrans.gt   | Monitoreo de viaje, bitacora y entrega                 |

## Usuario cliente recomendado

La seed tambien crea usuarios cliente con este patron:

- email: `portal.<client_key>@clientes.logitrans.gt`
- password: `seed$portal.<client_key>`

Ejemplo util:

- email: `portal.alimentos-norte@clientes.logitrans.gt`
- password: `seed$portal.alimentos-norte`

## Notas utiles para pruebas FEL

- El flujo FEL usa facturas en estado `BORRADOR`.
- Antes de certificar, ahora es obligatorio validar NIT en la bandeja FEL.
- Endpoint de validacion NIT: `POST /api/certifier/invoices/{INVOICE_ID}/validate-nit`.
- Endpoint de rechazo FEL: `PATCH /api/certifier/invoices/{INVOICE_ID}/reject`.

## Advertencia

Estas credenciales son solo para ambiente local de desarrollo con seed de MVP. No usar en produccion.
