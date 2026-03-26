# Accesos MVP - Usuarios clave

Este documento resume los accesos más útiles para pruebas del MVP con la seed actual.

## Credenciales de acceso

Regla de seed vigente:

- Cuentas con contraseña explícita en seed: usan su contraseña definida por rol.
- Cuentas sin contraseña explícita: usan contraseña por defecto `Logi2026`.

## Usuarios recomendados para pruebas

| Rol | Nombre | Email | Password | Uso sugerido MVP |
| --- | --- | --- | --- | --- |
| GERENCIA | Ricardo Solís | **2895884051401@ingenieria.usac.edu.gt** | **LogiGerencia** | Dashboard BI y rentabilidad |
| AGENTE_FINANCIERO | Silvia Monterroso | **2895884051401+f@ingenieria.usac.edu.gt** | **LogiFinanzas** | Flujo FEL y conciliación de pagos |
| AGENTE_OPERATIVO | Andrea Solares | **2895884051401+v@ingenieria.usac.edu.gt** | **LogiVentas** | Comercial: clientes y contratos |
| AGENTE_LOGISTICO | Karla Menéndez | **2895884051401+l@ingenieria.usac.edu.gt** | **LogiLogistica** | Asignación de unidades y monitoreo |
| ENCARGADO_PATIO | Mario Caal | **2895884051401+p@ingenieria.usac.edu.gt** | **LogiPatio** | Control de pesaje y despacho |
| PILOTO | Carlos Méndez | **2895884051401+t@ingenieria.usac.edu.gt** | **LogiPiloto** | Bitácoras y entregas |
| CLIENTE | Paola Estrada | **2895884051401+c@ingenieria.usac.edu.gt** | **Logi2026** | Portal cliente: contrato y órdenes |
| CERTIFICADOR_FEL | Simulador FEL SAT | **2895884051401+s@ingenieria.usac.edu.gt** | **LogiSAT** | Simulador técnico FEL |

## Accesos de pilotos (seed)

- `2895884051401+t@ingenieria.usac.edu.gt` - Carlos Méndez - `LogiPiloto`
- `piloto.02@logitrans.gt` - Edgar Choc - `Logi2026`
- `piloto.03@logitrans.gt` - Miguel Ixcoy - `Logi2026`
- `piloto.04@logitrans.gt` - José Tum - `Logi2026`
- `piloto.05@logitrans.gt` - Víctor Quej - `Logi2026`
- `piloto.06@logitrans.gt` - Byron Cuxum - `Logi2026`
- `piloto.07@logitrans.gt` - Kevin Cholotio - `Logi2026`
- `piloto.08@logitrans.gt` - Ángel Sucuc - `Logi2026`
- `piloto.09@logitrans.gt` - Marco Cañiz - `Logi2026`
- `piloto.10@logitrans.gt` - Jhonny Lux - `Logi2026`
- `piloto.11@logitrans.gt` - René Tecún - `Logi2026`
- `piloto.12@logitrans.gt` - Samuel Colop - `Logi2026`
- `piloto.13@logitrans.gt` - Otto Chaj - `Logi2026`
- `piloto.14@logitrans.gt` - Fredy Us - `Logi2026`

## Notas útiles para pruebas FEL y Finanzas

- Pagos por conciliar: el sistema considera como "Pagos por conciliar" los pagos registrados en estado `PENDIENTE`.
- Flujo de facturación (Finanzas):
  - Las facturas nacen como `BORRADOR` automáticamente al entregar la orden.
  - El Agente Financiero debe completar Descripción del servicio y Fecha de vencimiento al enviar al certificador.
  - Tras esta revisión, la factura deja la bandeja de Finanzas y aparece en la del Certificador FEL.
- Flujo de certificación (FEL):
  - Solo se muestran facturas `BORRADOR` ya revisadas por Finanzas (con descripción).
  - Antes de certificar, es obligatorio validar NIT.
  - Al certificar o rechazar en FEL, el sistema notifica por correo al agente financiero para seguimiento.
- Estado `ENVIADA`: representa factura certificada y enviada por Finanzas al cliente; en ese momento se dispara el correo al cliente.

## Notas útiles de autenticación y comunicaciones

- Recuperación de contraseña: el correo envía un token hexadecimal largo (64 caracteres), sin enlace directo.
- Política de correos MVP: los correos transaccionales se envían sin botones ni links; incluyen instrucciones operativas y datos de referencia.
- Teléfonos de contacto: en formularios clave se capturan con prefijo de país (`+502`, `+503`, `+504`) y se persisten en formato canónico prefijado.

## Endpoints técnicos (FEL)

- Endpoint de validación NIT: `POST /api/certifier/invoices/{INVOICE_ID}/validate-nit`.
- Endpoint de rechazo FEL: `PATCH /api/certifier/invoices/{INVOICE_ID}/reject`.

## Advertencia

Estas credenciales son solo para ambiente local de desarrollo con seed del MVP. No usar en producción.
