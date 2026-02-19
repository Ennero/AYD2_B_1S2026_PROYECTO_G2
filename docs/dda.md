# Documento de Decisión de Arquitectura (DDA)


| Actor | Descripción |
|---|---|
| Cliente | Empresa externa que solicita servicios de transporte, consulta el estado de sus envíos y gestiona sus contratos. |
| Agente Operativo | Encargado de la gestión comercial: registra clientes, perfila riesgos y formaliza los contratos y tarifas. |
| Agente Logístico | Responsable de la operación de transporte: asigna pilotos, selecciona vehículos y planifica las rutas de las órdenes generadas. |
| Encargado de Patio | Personal en sitio responsable del despacho físico, validación de seguridad, pesaje y estiba de la carga. |
| Piloto | Conductor de la unidad de transporte encargado de la ejecución del viaje, reporte de bitácora y confirmación de entrega. |
| Agente Financiero | Responsable de la configuración de precios base, facturación electrónica y gestión de cobros. |
| Gerencia | Usuario estratégico que visualiza reportes de rendimiento y KPIs para la toma de decisiones. |





### CDU001



| Campo | Descripción |
|---|---|
| **Nombre** | Gestión Comercial y Contratos |
| **Código** | CDU001 |
| **Actores** | **Primarios:** Agente Operativo, Agente Financiero. **Secundarios:** Cliente. |
| **Descripción** | Gestiona el ciclo de vida de la relación comercial, abarcando desde la parametrización de tarifas financieras y el registro de nuevos clientes (con su respectiva validación de riesgo y generación de accesos), hasta la formalización y aceptación legal de contratos digitales que habilitan la operación logística. |
| **Precondiciones** | 1. El Agente Financiero y Operativo deben estar autenticados en el sistema. 2. No debe existir un contrato vigente duplicado para el mismo cliente. |
| **Post Condiciones** | **Éxito:** Cliente registrado con usuario activo y un Contrato Digital en estado "Vigente" aceptado por ambas partes. **Fallo:** Cliente registrado pero inhabilitado por riesgo financiero o falta de aceptación del contrato. |
| **Flujo Principal** | 1. El Agente Financiero mantiene actualizado el esquema de precios en Configurar Tarifario Base (CDU001.4). 2. El Agente Operativo realiza el Registro y Perfilamiento del cliente (CDU001.1), capturando datos fiscales y contactos. 3. El sistema genera y envía automáticamente las claves mediante Gestionar Credenciales de Acceso (CDU001.2). 4. El Cliente ingresa al sistema y puede Gestionar su Perfil (CDU001.7) para actualizar datos seguros. 5. El Agente Operativo crea una propuesta legal mediante Formalizar Contrato Digital (CDU001.3), definiendo rutas y plazos. 6. El sistema ejecuta la Validación de Riesgo y Crédito (CDU001.5) para asegurar la solvencia del cliente. 7. El Cliente recibe la propuesta y procede a Aceptar el Contrato (CDU001.8), finalizando el acuerdo legal. |
| **Flujos Alternos** | **FA1: Rechazo por Riesgo Crediticio** — Si en el paso 6 la validación detecta mora o riesgo alto, el sistema bloquea la creación del contrato y notifica a Gerencia. **FA2: Negociación de Tarifas (Descuentos)** — Durante el paso 5, el Agente puede activar Aplicar Descuento Especial (CDU001.6), lo cual requiere una justificación y recalcula los montos del contrato antes de enviarlo al cliente. **FA3: Rechazo de Contrato por el Cliente** — En el paso 7, el Cliente puede Rechazar el Contrato (CDU001.8) si no está de acuerdo con las tarifas, regresando el flujo al Agente Operativo para renegociación. |
| **Reglas de Negocio** | • **Validación Fiscal:** El sistema debe validar que el NIT del cliente cumpla con el algoritmo de la SAT y no esté en listas negras. • **Parametrización Financiera:** Las tarifas base deben diferenciar entre Unidad Ligera (3.5 Ton), Camión Pesado (10-12 Ton) y Cabezal (22 Ton+). • **Bloqueo Automático:** El sistema impedirá cualquier operación si el cliente excede su límite de crédito o tiene facturas vencidas según los plazos pactados (15, 30, 45 días). |
| **Reglas de Calidad** | • **Seguridad:** Las credenciales de acceso (CDU001.2) deben enviarse encriptadas y el sistema debe forzar un cambio de contraseña en el primer inicio de sesión. • **Disponibilidad:** El módulo de aceptación de contratos por parte del Cliente (CDU001.8) debe estar disponible 24/7 para no retrasar la operación logística. • **Auditabilidad:** Toda modificación en el tarifario o aceptación de contrato debe registrar fecha, hora, IP y usuario responsable. |





### CDU002

| Campo | Descripción |
|---|---|
| **Nombre** | Gestión de Órdenes y Transporte |
| **Código** | CDU002 |
| **Actores** | **Primarios:** Cliente, Agente Logístico, Encargado de Patio, Piloto. |
| **Descripción** | Gestiona el flujo operativo del transporte. Inicia con la solicitud del cliente, pasa por la asignación de recursos (piloto/camión) por parte del área logística, el despacho físico en patio, y el monitoreo del viaje hasta la entrega final. |
| **Precondiciones** | 1. El Cliente debe tener un contrato vigente y crédito disponible. 2. Deben existir unidades y pilotos disponibles en el sistema. |
| **Post Condiciones** | **Éxito:** Mercancía entregada, evidencia registrada y orden lista para facturación. **Fallo:** Orden rechazada por crédito o detenida en patio por incumplimiento de normas de seguridad. |
| **Flujo Principal** | 1. El Cliente ingresa al sistema y ejecuta Generar Orden de Servicio (CDU002.1). 2. El sistema realiza automáticamente Validar Crédito y Contrato (CDU002.2). 3. El Agente Logístico recibe la solicitud y procede a Planificar y Asignar Recursos (CDU002.3). 4. El sistema ejecuta Validar Requisitos Técnicos y Legales (CDU002.4) para asegurar la compatibilidad del camión y licencia del piloto. 5. En la salida, el Encargado de Patio ejecuta Registrar Despacho en Patio (CDU002.5). 6. El sistema fuerza la validación Validar ID, Pesaje y Estiba (CDU002.6). 7. Al salir, el Piloto actualiza el estado mediante Cambiar Estado a "En Tránsito" (CDU002.7). 8. Durante el viaje, el Piloto realiza Registrar Bitácora de Viaje (CDU002.8) para reportar novedades. 9. Al llegar al destino, el Piloto finaliza con Confirmar Entrega y Evidencia (CDU002.9). |
| **Flujos Alternos** | **FA1: Cliente Moroso (Paso 2)** — Si la validación de crédito falla, el sistema bloquea la orden y notifica al cliente que contacte a Cobros. **FA2: Recursos Insuficientes (Paso 4)** — Si el Agente Logístico asigna un camión con capacidad menor al peso de la orden, el sistema impide la asignación. **FA3: Rechazo en Patio (Paso 6)** — Si el pesaje real difiere de lo declarado o la estiba es insegura, el Encargado de Patio no puede autorizar la salida hasta corregirlo. |
| **Reglas de Negocio** | • **Validación de Crédito:** No se permiten órdenes si el cliente ha excedido su límite de crédito o tiene facturas vencidas. • **Normativa de Peso:** El sistema no permitirá despachar una unidad si el peso ingresado en patio supera la capacidad técnica del vehículo (Ligera 3.5T, Pesada 12T, Trailer 22T+). |
| **Reglas de Calidad** | • **Trazabilidad:** Cada cambio de estado (Despachado, En Tránsito, Entregado) debe registrar fecha, hora y geolocalización. • **Usabilidad:** La interfaz del Piloto (Bitácora y Entrega) debe ser optimizada para móviles y funcionar con baja conectividad (modo offline-sync). |




### CDU003


| Campo | Descripción |
|---|---|
| **Nombre** | Gestión Financiera y Facturación |
| **Código** | CDU003 |
| **Actores** | **Primarios:** Agente Financiero, Cliente. |
| **Descripción** | Módulo que centraliza las operaciones fiscales y de tesorería. Permite la emisión automática de facturas (FEL) asegurando el cumplimiento tributario, y habilita un portal de gestión de cuentas donde clientes y agentes interactúan para el reporte y conciliación de pagos. |
| **Precondiciones** | 1. Existir una Orden de Servicio con estado "Entregado". 2. El Cliente debe tener un NIT válido registrado en el sistema. |
| **Post Condiciones** | **Éxito:** Factura emitida y entregada; saldos de cuenta actualizados tras el registro del pago. **Fallo:** Emisión detenida por error fiscal o pago no procesado por falta de fondos. |
| **Flujo Principal A (Emisión de Factura)** | 1. El Agente Financiero inicia el proceso en Generar y Emitir Factura FEL (CDU003.1). 2. El sistema ejecuta Validar Reglas Fiscales (CDU003.2) verificando montos y NIT. 3. El sistema procede a Certificar DTE ante SAT (CDU003.3) obteniendo la firma electrónica. 4. El sistema finaliza con Emitir Factura Física (CDU003.4), generando y enviando la representación gráfica (PDF). |
| **Flujo Principal B (Gestión de Cuentas)** | 1. El Cliente o Agente Financiero acceden a Gestionar Estado de Cuenta (CDU003.5). 2. El sistema muestra el saldo actual y facturas pendientes. 3. Se pueden ejecutar las extensiones de pago (ver Flujos Alternos). |
| **Flujos Alternos** | **FA1: Reporte de Pago del Cliente (Extensión CDU003.7)** — Desde el Estado de Cuenta, el Cliente ejecuta Registrar Información de Pago. Sube la boleta de depósito o transferencia. El sistema marca la factura como "Pago en Revisión". **FA2: Aplicación del Pago (Extensión CDU003.6)** — El Agente Financiero revisa la información y ejecuta Generar Pagos de Facturas. El sistema valida el monto y rebaja el saldo de la deuda del cliente. |
| **Reglas de Negocio** | • **Validación Fiscal:** El sistema no permitirá certificar (CDU003.3) si el NIT no cumple con el algoritmo de la SAT. • **Bloqueo por Mora:** Si el Estado de Cuenta (CDU003.5) muestra facturas con más de 45 días de vencimiento, se bloquean nuevos servicios automáticamente. • **Traza Bancaria:** Para registrar un pago (CDU003.7/3.6) es obligatorio ingresar el Banco de Origen y Número de Autorización. |
| **Reglas de Calidad** | • **Integridad:** La Factura Física (PDF) debe ser idéntica a los datos certificados en el XML de la SAT. • **Seguridad:** El Cliente puede registrar información de pago, pero solo el Agente Financiero tiene permisos para confirmar y "Generar el Pago" real en el libro contable. |




### CDU004

| Campo | Descripción |
|---|---|
| **Nombre** | Inteligencia de Negocio y Reportes |
| **Código** | CDU004 |
| **Actores** | **Primarios:** Gerente. |
| **Descripción** | Módulo de soporte a la decisión que centraliza la data operativa. Provee un Dashboard Gerencial para monitorear el rendimiento diario y una herramienta de simulación para proyectar el crecimiento de la flota y la infraestructura necesaria para la expansión regional. |
| **Precondiciones** | 1. Existir datos históricos de órdenes y facturas procesadas. 2. El usuario debe tener rol de "Alta Gerencia". |
| **Post Condiciones** | **Éxito:** Visualización correcta de indicadores y generación de escenarios de proyección. **Fallo:** Inconsistencia en los datos mostrados o fallo en el motor de cálculo de proyecciones. |
| **Flujo Principal A (Visualización Dashboard)** | 1. El Gerente accede al módulo y selecciona Visualizar Dashboard Gerencial (CDU004.1). 2. El sistema ejecuta obligatoriamente Generar Corte Diario (CDU004.2), consolidando la data de las tres sedes. 3. El sistema ejecuta Calcular KPIs y Rentabilidad (CDU004.3), procesando márgenes y tiempos de entrega. 4. El sistema despliega el tablero de control con los gráficos actualizados. |
| **Flujo Principal B (Proyección)** | 1. El Gerente selecciona la herramienta Proyectar Capacidad Operativa (CDU004.5). 2. El sistema solicita variables (ej. % crecimiento anual, nuevos territorios). 3. El Gerente ingresa los parámetros de simulación. 4. El sistema calcula los recursos necesarios y muestra el reporte de estimación de flota. |
| **Flujos Alternos** | **FA1: Detección de Anomalías (Extensión CDU004.4)** — Si durante el cálculo de KPIs (Paso 3 del Flujo A) el sistema detecta valores fuera de rango (ej. Rentabilidad < 10% o Retrasos > 5%), se ejecuta Alertar Desviaciones. El sistema superpone una notificación crítica y resalta en rojo las rutas afectadas en el mapa. **FA2: Sin Datos para Proyección** — Si en el Flujo B no existe suficiente historial (menos de 6 meses), el sistema advierte que la proyección tendrá un margen de error alto. |
| **Reglas de Negocio** | • **Corte Diario:** Debe integrar transacciones hasta las 23:59 del día anterior de todas las sucursales. • **Umbrales de Alerta:** Las desviaciones se configuran paramétricamente; por defecto, cualquier caída de ingresos del 15% semanal dispara la extensión. • **Privacidad:** La información de rentabilidad es confidencial y solo visible para roles de Gerencia General y Financiera. |
| **Reglas de Calidad** | • **Rendimiento:** El tiempo de carga del Dashboard (CDU004.1) no debe exceder los 5 segundos. • **Usabilidad:** Las alertas de desviación (CDU004.4) deben ser "accionables", permitiendo al usuario hacer clic en la alerta para ir directamente a la orden o contrato problemático. |