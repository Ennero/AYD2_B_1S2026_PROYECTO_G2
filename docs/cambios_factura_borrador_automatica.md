# Cambios aplicados para factura borrador automática

## Objetivo

Se reemplazó el flujo principal de creación manual de prefactura por un flujo donde la factura en estado `BORRADOR` se genera automáticamente cuando una orden cambia a `ENTREGADA`.

## Cambios en base de datos

- En `db/logitrans_postgresql.sql` se agregó la función `AUTO_CREATE_DRAFT_INVOICE()`.
- En `db/logitrans_postgresql.sql` se agregó el trigger `TRG_AUTO_CREATE_DRAFT_INVOICE` sobre `ORDERS`.
- El nuevo trigger se ejecuta `AFTER UPDATE OF STATUS` cuando la orden pasa a `ENTREGADA`.
- El trigger inserta una fila en `INVOICES` usando solo `ORDER_ID`.
- La unicidad de `INVOICES.ORDER_ID` sigue evitando duplicados por entrega.
- El trigger ya existente `TRG_POPULATE_INVOICE_FROM_ORDER` sigue completando cliente, NIT, dirección, montos, descripción y vencimiento.

## Cambios en modelo y documentación técnica

- En `db/logitrans_dbdiagram.dbml` se anotó que `INVOICES.ORDER_ID` corresponde a un borrador generado automáticamente al entregar la orden.
- En `db/README.md` se documentó que la factura borrador nace automáticamente al pasar la orden a `ENTREGADA`.
- En `db/README.md` se aclaró que `ORDER_ID` garantiza un solo borrador por entrega.
- En `db/README.md` se actualizó la sección de reglas inteligentes para reflejar la inserción automática de la factura.

## Cambios en contrato API

- En `docs/endpoint_tables.md` el endpoint de entrega del piloto ahora indica que genera automáticamente una factura `BORRADOR`.
- En `docs/endpoint_tables.md` el resumen financiero cambió de `ordersPendingInvoice` a `draftInvoicesPendingReview`.
- En `docs/endpoint_tables.md` la bandeja principal de Finanzas cambió de `GET /api/finance/orders-to-invoice` a `GET /api/finance/invoices?status=BORRADOR`.
- En `docs/endpoint_tables.md` la carga de revisión cambió de `GET /api/finance/orders/{ORDER_ID}/pre-invoice` a `GET /api/finance/invoices/{INVOICE_ID}`.
- En `docs/endpoint_tables.md` el paso operativo de Finanzas cambió de `POST /api/finance/invoices` a `PATCH /api/finance/invoices/{INVOICE_ID}/submit-for-certification`.
- En `docs/endpoint_tables.md` se conservó el envío al cliente como un paso posterior y separado mediante `PATCH /api/finance/invoices/{INVOICE_ID}/send`.

## Cambios en mocks

- En `docs/mocks/finance.html` la bandeja principal ahora muestra facturas `BORRADOR` en vez de órdenes entregadas sin factura.
- En `docs/mocks/finance.html` el KPI principal cambió de órdenes sin facturar a borradores por revisar.
- En `docs/mocks/finance.html` la revisión ahora carga un borrador existente por `INVOICE_ID`.
- En `docs/mocks/finance.html` el envío a FEL ya no crea la factura, sino que remite el borrador existente al flujo de certificación.
- En `docs/mocks/finance.html` se dejó `Crear Manual (Contingencia)` para indicar que ya no es el flujo normal.
- En `docs/mocks/pilot.html` la confirmación de entrega ahora explica que también se genera un borrador automático para Finanzas.
- En `docs/mocks/pilot.html` el modal de éxito comunica que el borrador ya fue creado.

## Cambios en documentación funcional

- En `docs/Descripcion_mocks.md` se actualizó la descripción del panel financiero para que hable de borradores autogenerados.
- En `docs/Descripcion_mocks.md` se actualizó la descripción de la revisión de prefactura para reflejar que el borrador ya existe.
- En `docs/dda.md` se ajustaron postcondiciones y flujo financiero para reflejar que la factura borrador se genera automáticamente al confirmar la entrega.
- En `docs/dda.md` se actualizó la HU-12 para que el resultado esperado incluya el borrador automático.

## Efecto funcional final

1. El piloto confirma la entrega.
2. La orden cambia a `ENTREGADA`.
3. La base crea automáticamente una factura `BORRADOR`.
4. Finanzas revisa ese borrador ya existente.
5. Finanzas lo envía al flujo FEL.
6. FEL certifica o rechaza.
7. Finanzas envía la factura certificada al cliente.