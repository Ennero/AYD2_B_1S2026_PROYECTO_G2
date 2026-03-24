# Guía de Pruebas - LogiTrans MVP Fase 2 (11 de Abril de 2026)

Esta guía detalla los pasos para probar el **Happy Path** completo del sistema, tomando en cuenta las actualizaciones ingresadas por el equipo de QA y los requerimientos de la Fase 2.

## Preparación del Entorno
1. Asegúrate de tener un archivo `.env` configurado en el backend.
   - **Simulación (Recomendado)**: `MOCK_SMTP=true` (Los correos se ven en la consola del server, sin errores de API).
   - **Envío Real**: `MOCK_SMTP=false` (Requiere `RESEND_API_KEY` válida y dominio verificado para que lleguen al inbox).
2. Ejecuta `docker-compose down -v && docker-compose up --build -d` para restaurar la base de datos limpia con los nuevos *seeds* al 11 de Abril de 2026.

## Paso 1: Comercial (Creación de Cliente y Contrato)
- **Usuario**: `2895884051401+v@ingenieria.usac.edu.gt` (Password: `LogiVentas`)
- **Acción**: Ingresa CRM y asocia un nuevo cliente, configurando un límite de crédito. Luego, genera un **Contrato de Servicio**.
- **Resultado Esperado**: El contrato debe quedar en estado `PENDIENTE` para el cliente.

## Paso 2: Cliente (Aceptación de Contrato y Orden)
- **Usuario**: `2895884051401+c@ingenieria.usac.edu.gt` (Password: `Logi2026`).
- **Acción**: 
  1. Ve a "Contratos" y acepta el contrato creado en el Paso 1.
  2. Crea una nueva **Orden de Servicio** utilizando las rutas pactadas.

## Paso 3: Logística y Patio (Asignación y Pesaje)
- **Usuario**: `2895884051401+l@ingenieria.usac.edu.gt` (Password: `LogiLogistica`)
- **Acción**: Asigna un piloto y camión a la orden y ponla en estado de tránsito hacia patio.
- **Usuario**: `2895884051401+p@ingenieria.usac.edu.gt` (Password: `LogiPatio`)
- **Acción**: Registra el pesaje, confirma la estiba y autoriza el despacho. Si el peso supera la capacidad, el sistema bloqueará la acción.

## Paso 4: Piloto (Bitácora de Viaje y Entrega)
- **Usuario**: `2895884051401+t@ingenieria.usac.edu.gt` (Password: `LogiPiloto`)
- **Acción**: Reporta la entrega final del servicio desde la vista del piloto.

## Paso 5: FEL y Finanzas (Certificación y Cobro)
Al marcarse como `ENTREGADA`, se genera automáticamente la Pre-Factura (`BORRADOR`).
- **Usuario**: `2895884051401+f@ingenieria.usac.edu.gt` (Password: `LogiFinanzas`)
- **Acción**: 
  1. Revisa la factura borrador y presiona **Enviar a FEL**.
  2. El Simulador tomará acción inmediata pasando la factura a `CERTIFICADA` y luego se enviará para quedar `ENVIADA`.
- **Usuario (Cliente)**: Accede nuevamente al portal de cliente (`2895884051401+c@ingenieria.usac.edu.gt`) y sube comprobante de transferencia bancaria (`PENDIENTE`).
- **Usuario (Agente Financiero)**: Ve a la bandeja de Conciliación de Pagos y **Aprueba** el pago por transferencia.
- **Resultado**: La factura pasa a `PAGADA` y se recarga el límite de crédito disponible del cliente en su dashboard.

## Paso 6: Gerencia (Módulo BI y Rentabilidad)
- **Usuario**: `2895884051401@ingenieria.usac.edu.gt` (Password: `LogiGerencia`)
- **Acción**: Ingresa a Análisis de Rentabilidad.
- **Resultado Esperado**: Las gráficas muestran la rentabilidad de las órdenes descontando los costos de operación (`Total - (Fuel + Viatics + Maintenance)`), además del cumplimiento de entregas a tiempo.
