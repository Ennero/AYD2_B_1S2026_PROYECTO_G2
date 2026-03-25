# Accesos MVP - Usuarios Clave

Este documento resume los accesos mas utiles para pruebas MVP con la seed actual.

## Credenciales de Acceso (Simplificadas)

Todas las cuentas de prueba comparten la misma contrasena para facilitar la calificacion:

- **Password Universal**: `LogiTrans2026` -> **Actualizada a**: `Logi2026`

## Top usuarios recomendados para pruebas

| Rol               | Nombre            | Email                                       | Password       | Uso sugerido MVP                                       |
| ----------------- | ----------------- | ------------------------------------------- | -------------- | ------------------------------------------------------ |
| GERENCIA          | Ricardo Solis     | **2895884051401@ingenieria.usac.edu.gt**    | **LogiGerencia**| Dashboard BI y rentabilidad                            |
| AGENTE_FINANCIERO | Silvia Monterroso | **2895884051401+f@ingenieria.usac.edu.gt**  | **LogiFinanzas**| Flujo FEL y conciliacion de pagos                      |
| AGENTE_OPERATIVO  | Andrea Solares    | **2895884051401+v@ingenieria.usac.edu.gt**  | **LogiVentas**  | Comercial: Clientes y contratos                        |
| AGENTE_LOGISTICO  | Karla Menendez    | **2895884051401+l@ingenieria.usac.edu.gt**  | **LogiLogistica**| Asignacion de unidades y monitoreo                     |
| ENCARGADO_PATIO   | Mario Caal        | **2895884051401+p@ingenieria.usac.edu.gt**  | **LogiPatio**   | Control de pesaje y despacho                           |
| PILOTO            | Carlos Mendez     | **2895884051401+t@ingenieria.usac.edu.gt**  | **LogiPiloto**  | Bitacoras y entregas                                   |
| CLIENTE           | Paola Estrada     | **2895884051401+c@ingenieria.usac.edu.gt**  | **Logi2026**   | Portal cliente: contrato y ordenes                     |
| CERTIFICADOR_FEL  | SAT Simulator     | **2895884051401+s@ingenieria.usac.edu.gt**  | **LogiSAT**     | Simulador tecnico FEL                                  |

## Patrones de otros usuarios

- **Otros Pilotos**: `piloto.02@logitrans.gt` (etc) con password `Logi123`.
- **Otros Clientes**: `cliente.<key>@lt.com` con password `Logi123`.


## Notas utiles para pruebas FEL y Finanzas

- **Pagos por conciliar**: El sistema toma como "Pagos por conciliar" aquellos pagos registrados por clientes que tienen el estado **`PENDIENTE`** (esperando aprobacion del Agente Financiero).
- **Flujo de Facturacion (Finanzas)**:
  - Las facturas nacen como `BORRADOR` automaticamente al entregar la orden.
  - El Agente Financiero **debe** completar la *Descripcion del servicio* y *Fecha de vencimiento* al presionar "Enviar a certificador".
  - Una vez procesada por Finanzas, desaparece de su bandeja y aparece en la del Certificador FEL.
- **Flujo de Certificacion (FEL)**:
  - Solo se muestran facturas `BORRADOR` que ya fueron revisadas por Finanzas (tienen descripcion).
  - Antes de certificar, es obligatorio validar NIT en la bandeja FEL.
- **Estado ENVIADA**: Significa que la factura ya fue **certificada** (tiene UUID FEL) y **enviada** por correo al cliente final.

## Notas utiles de autenticacion y comunicaciones

- **Recuperacion de contrasena**: el correo envia un token hexadecimal largo (64 caracteres), sin enlace directo. El usuario debe copiarlo y pegarlo en la pantalla de restablecimiento.
- **Politica de correos MVP**: los correos transaccionales se envian sin botones ni links; incluyen instrucciones operativas y datos de referencia (portal, contrato, factura, token).
- **Telefonos de contacto**: en formularios clave se capturan con prefijo de pais (`+502`, `+503`, `+504`) y se persisten en formato canonico prefijado.

### Endpoints tecnicos (FEL)
- Endpoint de validacion NIT: `POST /api/certifier/invoices/{INVOICE_ID}/validate-nit`.
- Endpoint de rechazo FEL: `PATCH /api/certifier/invoices/{INVOICE_ID}/reject`.


## Advertencia

Estas credenciales son solo para ambiente local de desarrollo con seed de MVP. No usar en produccion.
