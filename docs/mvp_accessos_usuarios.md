# Accesos MVP - Usuarios Clave

Este documento resume los accesos mas utiles para pruebas MVP con la seed actual.

## Regla de contrasena usada por la seed

Para usuarios internos, la seed genera la contrasena con esta regla:

- `password = seed$<email_del_usuario>`

Ejemplo:

- email: `2895884051401+certificador.fel@ingenieria.usac.edu.gt`
- password: `seed$2895884051401+certificador.fel@ingenieria.usac.edu.gt`

## Top 7 usuarios recomendados para pruebas

| Rol               | Nombre            | Email                    | Password seed                 | Uso sugerido MVP                                       |
| ----------------- | ----------------- | ------------------------ | ----------------------------- | ------------------------------------------------------ |
| CERTIFICADOR_FEL  | Simulador FEL SAT | 2895884051401+certificador.fel@ingenieria.usac.edu.gt| seed$2895884051401+certificador.fel@...| Aprobacion y simulacion de SAT                         |
| AGENTE_OPERATIVO  | Andrea Solares    | 2895884051401+operativo.1@ingenieria.usac.edu.gt | seed$2895884051401+operativo.1@... | Alta de clientes, contratos y flujo comercial          |
| AGENTE_LOGISTICO  | Karla Menendez    | 2895884051401+logistica.1@ingenieria.usac.edu.gt | seed$2895884051401+logistica.1@... | Planificacion y asignacion de ordenes                  |
| ENCARGADO_PATIO   | Mario Caal        | 2895884051401+patio.1@ingenieria.usac.edu.gt     | seed$2895884051401+patio.1@...     | Registro en patio, validacion y despacho               |
| AGENTE_FINANCIERO | Silvia Monterroso | 2895884051401+finanzas.1@ingenieria.usac.edu.gt  | seed$2895884051401+finanzas.1@...  | Flujo FEL (borrador, validar NIT, certificar/rechazar) |
| GERENCIA          | Ricardo Solis     | 2895884051401+gerencia@ingenieria.usac.edu.gt    | seed$2895884051401+gerencia@...    | Dashboard BI y revision de KPIs                        |
| PILOTO            | Carlos Mendez     | 2895884051401+piloto.01@ingenieria.usac.edu.gt   | seed$2895884051401+piloto.01@...   | Monitoreo de viaje, bitacora y entrega                 |

## Usuario cliente recomendado

La seed tambien crea usuarios cliente con este patron:

- email: `2895884051401+portal.<client_key>@ingenieria.usac.edu.gt`
- password: `seed$2895884051401+portal.<client_key>`

Ejemplo util:

- email: `2895884051401+portal.alimentos-norte@ingenieria.usac.edu.gt`
- password: `seed$2895884051401+portal.alimentos-norte`

## Notas utiles para pruebas FEL

- El flujo FEL usa facturas en estado `BORRADOR`.
- Antes de certificar, ahora es obligatorio validar NIT en la bandeja FEL.
- Endpoint de validacion NIT: `POST /api/certifier/invoices/{INVOICE_ID}/validate-nit`.
- Endpoint de rechazo FEL: `PATCH /api/certifier/invoices/{INVOICE_ID}/reject`.

## Advertencia

Estas credenciales son solo para ambiente local de desarrollo con seed de MVP. No usar en produccion.
