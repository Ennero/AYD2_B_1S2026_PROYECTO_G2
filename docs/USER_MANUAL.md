# LogiTrans Guatemala
## Manual de Usuario - Plataforma de Gestion Logistica

> **Version:** 2.0  
> **Fecha:** 05 de abril de 2026  
> **Desarrollado por:** Grupo 2 - Analisis y Diseno de Sistemas 2

---

## Tabla de Contenidos

- [1. Introduccion](#1-introduccion)
  - [1.1 Objetivo del documento](#11-objetivo-del-documento)
  - [1.2 Alcance del sistema](#12-alcance-del-sistema)
  - [1.3 Publico objetivo](#13-publico-objetivo)
- [2. Descripcion general del sistema](#2-descripcion-general-del-sistema)
  - [2.1 Que es LogiTrans](#21-que-es-logitrans)
  - [2.2 Modulos principales](#22-modulos-principales)
  - [2.3 Estados canonicos del negocio](#23-estados-canonicos-del-negocio)
- [3. Requisitos del sistema](#3-requisitos-del-sistema)
  - [3.1 Requisitos de hardware](#31-requisitos-de-hardware)
  - [3.2 Requisitos de software](#32-requisitos-de-software)
  - [3.3 Conexion a internet](#33-conexion-a-internet)
- [4. Operacion por internet y contexto AWS](#4-operacion-por-internet-y-contexto-aws)
- [5. Roles y funcionalidades](#5-roles-y-funcionalidades)
  - [5.1 Cliente](#51-cliente)
  - [5.2 Agente Operativo](#52-agente-operativo)
  - [5.3 Agente Logistico](#53-agente-logistico)
  - [5.4 Encargado de Patio](#54-encargado-de-patio)
  - [5.5 Piloto](#55-piloto)
  - [5.6 Agente Financiero](#56-agente-financiero)
  - [5.7 Certificador FEL](#57-certificador-fel)
  - [5.8 Gerencia](#58-gerencia)
- [6. Seguridad y privacidad](#6-seguridad-y-privacidad)
- [7. Preguntas frecuentes (FAQ)](#7-preguntas-frecuentes-faq)
- [8. Soporte y ayuda](#8-soporte-y-ayuda)
- [9. Glosario](#9-glosario)
- [10. Flujo de funcionalidades del programa](#10-flujo-de-funcionalidades-del-programa)
  - [10.1 Flujo completo integrado del Happy Path](#101-flujo-completo-integrado-del-happy-path)
- [11. Restricciones y reglas de negocio](#11-restricciones-y-reglas-de-negocio)
- [12. Anexos y referencias](#12-anexos-y-referencias)

---

## 1. Introduccion

### 1.1 Objetivo del documento

Este manual proporciona una guía completa para operar LogiTrans de forma correcta, segura y consistente. Su objetivo es estandarizar el trabajo diario de todos los roles que participan en el ciclo logístico, desde la creación de clientes y contratos hasta la entrega final y facturación. También sirve como referencia de consulta ante dudas operativas, errores del sistema y preguntas frecuentes.

### 1.2 Alcance del sistema

LogiTrans cubre el flujo **integral** de transporte de carga terrestre, abarcando los ámbitos comercial, operativo, logístico y financiero en una sola plataforma conectada.

#### Ámbito funcional cubierto

| Ámbito | Funcionalidades incluidas |
|---|---|
| **Comercial** | Registro de clientes con datos fiscales y perfil de riesgo; formalización de contratos con límites de crédito, rutas y tipos de carga autorizados; administración de catálogos |
| **Portal del cliente** | Aceptación de contratos; creación de órdenes de servicio; tracking en tiempo semi-real; consulta de facturas y estado de cuenta; gestión de contactos |
| **Logística** | Asignación de binomio piloto‑unidad; validación de compatibilidad de peso, refrigeración y tarifa; programación de salida |
| **Patio** | Verificación de identidad del piloto; registro de peso real; validación de estiba; formalización de despacho |
| **Operación del piloto** | Inicio de viaje; bitácora cronológica de eventos; confirmación de entrega con firma digital y evidencia fotográfica |
| **Finanzas** | Revisión de borradores autogenerados; envío a certificación FEL; conciliación de pagos; envío final de factura |
| **Certificación FEL** | Validación de NIT; certificación con UUID; rechazo con motivo documentado |
| **BI / Gerencia** | KPIs operativos y financieros; distribución por sede; rentabilidad por contrato; alertas y proyecciones |
| **Multi-país** | Soporte para Guatemala (GTQ / 12%), El Salvador (USD / 13%) y Honduras (HNL / 15%) |

#### Límites del sistema (fuera de alcance)

- No gestiona inventario de mercancías propiamente dicho (solo tipos y pesos declarados).
- No incluye gestión de flotas (mantenimiento preventivo, km recorridos, combustible).
- No emite facturas físicas; el documento tributario electrónico (DTE) lo genera el certificador FEL.
- No incluye cálculo de nómina ni gestión de RRHH.
- No gestiona aduanas (solo registra riesgo de aduana como campo de perfil del cliente).

### 1.3 Público objetivo

Este manual está dirigido a:

- Clientes de transporte de carga.
- Agentes Operativos.
- Agentes Logísticos.
- Encargados de Patio.
- Pilotos.
- Agentes Financieros.
- Certificadores FEL.
- Gerencia y usuarios de BI.

---

## 2. Descripcion general del sistema

### 2.1 Que es LogiTrans

LogiTrans es una plataforma web para administracion de transporte terrestre empresarial. Permite coordinar procesos comerciales, operativos y financieros en un solo sistema, con trazabilidad completa por cada orden.

### 2.2 Modulos principales

- Comercial: clientes, contratos y catalogos.
- Cliente: nuevas ordenes, tracking, estado de cuenta, facturas y perfil.
- Logistica: asignacion de binomio (piloto + unidad) y control de salida.
- Patio: validacion de carga y formalizacion para despacho.
- Piloto: inicio de viaje, bitacora y entrega.
- Finanzas: revision de factura, certificacion y conciliacion.
- Certificador FEL: validaciones tributarias y certificacion.
- BI/Gerencia: indicadores, alertas y rentabilidad.

### 2.3 Estados canonicos del negocio

Estados de orden:

`REGISTRADA -> ASIGNADA -> LISTA_PARA_DESPACHO -> EN_TRANSITO -> ENTREGADA`

Estados de factura:

`BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA`

Estados de pago (flujo separado):

`PENDIENTE -> APROBADO / RECHAZADO`

Nota: el envio de factura solo se habilita cuando la factura esta en estado `PAGADA`.

### 2.4 Diagrama de casos de uso

El siguiente diagrama representa de forma resumida todos los actores y las funcionalidades que el sistema pone a disposición de cada rol:

**Vista general del sistema (alto nivel):**

![Diagrama de casos de uso — Alto nivel](imgs/dda/high-level.png)

> Este diagrama muestra qué puede hacer cada actor dentro de LogiTrans. Los actores son los 8 roles del sistema; las elipses representan las funcionalidades disponibles para cada uno.

**Primera descomposición de casos de uso:**

![Diagrama de casos de uso — Primera descomposición](imgs/dda/first-descomposition.png)

> La primera descomposición detalla los casos de uso principales por dominio: comercial, operativo, logístico, financiero y de gerencia. Cada caso de uso se expande en flujos específicos cubiertos en las secciones 5 y 10 de este manual.

---

## 3. Requisitos del sistema

### 3.1 Requisitos de hardware

Minimos recomendados:

- Procesador de 2 nucleos.
- 4 GB de RAM.
- Resolucion 1366 x 768.

Recomendados:

- Procesador de 4 nucleos o superior.
- 8 GB de RAM o mas.
- Resolucion 1920 x 1080.

### 3.2 Requisitos de software

- Navegador actualizado:
  - Google Chrome.
  - Microsoft Edge.
  - Mozilla Firefox.
  - Safari (macOS).
- JavaScript habilitado.
- Cookies habilitadas para sesion/autenticacion.
- Cliente de correo para recibir notificaciones operativas.

### 3.3 Conexion a internet

- Conexion estable a internet.
- Velocidad recomendada: minimo 10 Mbps.
- Baja latencia para operacion en tiempo real (tracking y cambios de estado).

---

## 4. Operacion por internet y contexto AWS

El sistema esta preparado para operar por internet en un despliegue cloud orientado a AWS.

Consideraciones funcionales:

- Acceso por HTTPS con certificado valido.
- Disponibilidad de correo transaccional para notificaciones.
- Continuidad operativa en horarios de despacho y entrega.
- Politicas de seguridad para credenciales y perfiles.

Consideraciones de despliegue empresarial:

- Frontend y API publicados tras balanceador.
- Base de datos administrada con respaldo automatizado.
- Almacenamiento de evidencia digital en servicio de objetos.
- Monitoreo de salud de servicios y alertas de disponibilidad.

---

## 5. Roles y funcionalidades

### 5.1 Cliente

Puede:

- Consultar contratos y aceptarlos.
- Crear nuevas ordenes de servicio.
- Ver el tracking de sus ordenes.
- Consultar historial de facturas.
- Revisar estado de cuenta.
- Gestionar contactos y datos de perfil.

### 5.2 Agente Operativo

Puede:

- Registrar clientes con datos fiscales y riesgo.
- Formalizar contratos con limites, plazos y descuentos.
- Administrar catalogos de rutas y tipos de carga.

### 5.3 Agente Logistico

Puede:

- Tomar ordenes pendientes de asignacion.
- Asignar piloto y unidad de transporte.
- Confirmar salida programada operativa.

### 5.4 Encargado de Patio

Puede:

- Validar ordenes asignadas para despacho.
- Registrar peso/carga real.
- Formalizar orden para salida (`LISTA_PARA_DESPACHO`).

### 5.5 Piloto

Puede:

- Iniciar viaje cuando la orden esta lista para despacho.
- Registrar eventos en bitacora.
- Confirmar entrega con firma y evidencia.

### 5.6 Agente Financiero

Puede:

- Revisar facturas en estado `BORRADOR`.
- Enviar documentos a certificacion FEL.
- Conciliar pagos.
- Enviar factura final al cliente.

### 5.7 Certificador FEL

Puede:

- Validar NIT y datos tributarios.
- Certificar o rechazar facturas.
- Registrar motivo de rechazo para correccion.

### 5.8 Gerencia

Puede:

- Visualizar indicadores operativos.
- Revisar tendencias de rentabilidad.
- Consultar alertas y estado general de la operacion.

---

## 6. Seguridad y privacidad

Buenas practicas obligatorias:

- No compartir credenciales.
- Cambiar contrasena temporal en primer acceso.
- Cerrar sesion al terminar operaciones.
- Limitar acceso por rol y responsabilidad.
- No adjuntar evidencia no relacionada con la orden.

Privacidad de informacion:

- Los datos del cliente se usan para operacion logistica y facturacion.
- El sistema conserva trazabilidad de eventos relevantes.
- Los cambios criticos deben quedar auditados.

---

## 7. Preguntas frecuentes (FAQ)

**¿Se puede enviar una factura si no está pagada?**
No. Primero el Agente Financiero debe aprobar el pago, lo que mueve la factura a estado `PAGADA`. Solo entonces se habilita el botón de envío al cliente.

**¿Qué pasa si una factura es rechazada por FEL?**
Regresa a estado `RECHAZADA` y el Agente Financiero debe corregir los datos tributarios (especialmente el NIT) y reenviarla a certificación.

**¿Cómo se actualiza el estado de orden en el portal cliente?**
El listado de órdenes se refresca automáticamente mediante un mecanismo de polling y también se sincroniza al cerrar el panel de seguimiento.

**¿Qué notificaciones por correo recibe el cliente?**
- **Bienvenida:** al ser registrado por el Agente Operativo (incluye credenciales de acceso).
- **Propuesta de contrato:** cuando el Agente Operativo genera un nuevo contrato para su empresa.
- **Recuperación de contraseña:** token de 30 minutos cuando solicita restablecer su clave.
- **Orden en tránsito:** cuando el piloto inicia el viaje (`EN_TRANSITO`).
- **Orden entregada:** cuando el piloto confirma la entrega (`ENTREGADA`).
- **Factura emitida:** cuando el Agente Financiero envía la factura certificada.

**¿Qué pasa si falla el envío de correo?**
El cambio de estado de la orden es válido y no se revierte. El sistema desacopla notificaciones con una capa asíncrona (RabbitMQ + servicio de correo), por lo que un fallo de notificación no bloquea la operación logística principal. Si la infraestructura de mensajería/correo está degradada, la operación continúa y el incidente debe revisarse en monitoreo técnico.

**¿Puedo crear una orden sin contrato vigente?**
No. El sistema bloquea la creación de órdenes si el cliente no tiene un contrato en estado `VIGENTE`.

**¿Cómo sabe el sistema qué tipo de unidad necesito?**
El Agente Logístico selecciona la unidad; el sistema valida automáticamente que la capacidad sea suficiente para el peso declarado y que la unidad tenga habilitación para el tipo de carga (por ejemplo, refrigeración si la mercancía lo requiere).

**¿Qué ocurre si el peso real en patio difiere del declarado?**
El sistema acepta una tolerancia mínima. Si la diferencia supera el umbral, el Encargado de Patio no puede formalizar la carga hasta corregir el dato o actualizar el peso real.

**¿El piloto puede registrar múltiples eventos en la bitácora?**
Sí. Durante todo el trayecto el piloto puede agregar tantos puntos de control, pausas o incidentes como necesite. Todos quedan visibles en el tracking del cliente.

**¿En qué moneda se muestra la información en gerencia?**
Todos los montos financieros en el módulo de gerencia se normalizan a USD para permitir comparaciones entre países. El resto del sistema muestra la moneda del contrato del cliente.

**¿Cómo se recupera el acceso si olvidé mi contraseña?**
1. En el formulario de login, presiona “¿Olvidaste tu contraseña?”.
2. Ingresa tu correo electrónico registrado.
3. Revisa tu bandeja de entrada; recibirás un token de recuperación.
4. Ingresa el token en la pantalla de restablecimiento junto con tu nueva contraseña.
5. El token es de un solo uso y expira en 30 minutos.

---

## 8. Soporte y ayuda

Orden recomendado de atencion:

1. Revisar este manual y el Happy Path.
2. Confirmar estado de orden/factura en el modulo correspondiente.
3. Contactar al equipo de soporte funcional.
4. Escalar a soporte tecnico si hay error de plataforma.

Documentos de apoyo:

- `docs/happypath.md`
- `docs/mvp_accessos_usuarios.md`
- `docs/endpoint_tables.md`
- `docs/despliegue.md`

---

## 9. Glosario

| Término | Definición |
|---|---|
| **Orden de servicio** | Solicitud logística creada por el cliente para transportar mercancía de un punto A a un punto B |
| **Binomio** | Combinación de un piloto asignado y una unidad de transporte específica |
| **Formalizar carga** | Proceso de validateción en patio que verifica peso real, estiba y condiciones antes de autorizar la salida |
| **Bitácora** | Registro cronológico de eventos ocurridos durante un viaje (salidas, puntos de control, incidentes, entrega) |
| **FEL** | Factura Electrónica en Línea — régimen tributario electrónico de Guatemala |
| **DTE** | Documento Tributario Electrónico — representación digital de la factura certificada |
| **UUID FEL** | Código único asignado por el certificador al documento tributario electrónico |
| **Conciliación** | Proceso de validar y aprobar un pago registrado por el cliente para liberar la factura a estado `PAGADA` |
| **Tracking** | Seguimiento del estado actual y la bitácora de eventos de una orden en tiempo semi-real |
| **Borrador** | Estado inicial de una factura generada automáticamente al entregar una orden; aún no tiene descripción de servicio ni fecha de vencimiento |
| **Contrato vigente** | Contrato en estado `VIGENTE` (aceptado por el cliente) que habilita la creación de órdenes |
| **Perfil de riesgo** | Clasificación del cliente en cuatro dimensiones: riesgo de pago, aduanal, de mercancía y lavado de dinero |
| **Tipo de cambio** | Tasa de conversión de la moneda del contrato a USD, registrada en el momento de la operación |
| **KPI** | Indicador Clave de Desempeño (Key Performance Indicator) usado en el módulo de gerencia |

---

## 10. Flujo de funcionalidades del programa

### 10.1 Flujo completo integrado del Happy Path

A continuación se integra el flujo completo documentado en `docs/happypath.md`, incluyendo pasos, validaciones y evidencias visuales.

Videos de demostración relacionados:

- Video (YouTube): https://youtu.be/Wi7t-aH-_w0?si=5yoLN27F77zqG9eu
- Video (Google Drive): https://drive.google.com/file/d/1ufW0e0h3kbWgO5YF3zCcfsc26B3nqXem/view?usp=sharing

### Índice del Flujo

| # | Actor | Paso |
|---|-------|------|
| 1 | — | Pantalla de inicio y login |
| 2 | Agente Operativo | Registrar un nuevo cliente |
| 3 | Agente Operativo | Formalizar contrato |
| 4 | Cliente | Crear una orden de servicio |
| 5 | Agente Logístico | Asignar binomio piloto-vehículo |
| 6 | Encargado de Patio | Registrar despacho en patio |
| 7 | Piloto | Iniciar tránsito y registrar bitácora |
| 8 | Piloto | Confirmar entrega con evidencia |
| 9 | Agente Financiero | Revisar borrador y enviar a certificador |
| 10 | Certificador FEL | Validar NIT y certificar factura |
| 11 | Agente Financiero | Conciliar pago y enviar factura al cliente |

---

### 1. Pantalla de Inicio y Login

#### 1.1 Pantalla Principal

Al ingresar al Portal de Clientes LogiTrans, verás la pantalla de bienvenida de **LogiTrans Guatemala**.

- En el centro de la pantalla aparece lo que puede hacer este sistema.

- El fondo muestra los colores corporativos del sistema.

![Pantalla Principal Superior](imgs/happypath/01_landing_top.jpeg)
![Pantalla Principal Características](imgs/happypath/02_landing_middle.jpeg)

---

#### 1.2 Formulario de Login

Al presionar "Iniciar Sesión", aparece el formulario de autenticación con dos campos:
- **Correo electrónico**
- **Contraseña**

![Formulario de Login](imgs/happypath/03_login.jpeg)

---

### 2. Módulo Comercial — Registrar un Nuevo Cliente
**Actor**: Agente Operativo
**Credenciales**:
- Email: `2895884051401+v@ingenieria.usac.edu.gt`
- Password: `LogiVentas`

#### 2.1 Login como Agente Operativo

1. En el formulario de login, ingresa las credenciales del Agente Operativo.
2. Presiona **"Iniciar Sesión"**.
3. Serás redirigido al **Dashboard del Agente Operativo**, que muestra lo que se puede hacer dentro de este módulo

![Dashboard Agente Operativo](imgs/happypath/04_dashboard_operativo.jpeg)

---

#### 2.2 Navegar a "Registrar Cliente"

1. En el menú lateral izquierdo, haz clic en **"Clientes"** o en la opción de navegación correspondiente.
2. Haz clic en el botón **"Nuevo Cliente"** o **"Registrar Cliente"** (botón destacado en la esquina superior derecha).




---

#### 2.3 Rellenar el Formulario de Nuevo Cliente

Ingresa los siguientes datos de ejemplo para el nuevo cliente:

| Campo | Valor de ejemplo |
|-------|-------------------|
| Nombre Legal / Razón Social | `DISTRIBUIDORA EL PROGRESO, S.A.` |
| NIT | `1234567890123` *(válido entre 8 y 13 dígitos)* |
| País | `Honduras` *(evidencia actualizada con captura real)* |
| Moneda de operación | `HNL` |
| Dirección Fiscal | `Tegucigalpa` |
| Nombre Contacto Principal | `Henry Contreras` |
| Email Contacto | `deennerparaprobar@gmail.com` |
| Contraseña | `deennerparaprobar@gmail.com` |
| Teléfono Contacto | `+504` + `22012341` |
| Riesgo de Pago | `BAJO` |
| Riesgo en Aduanas | `MEDIO` |
| Riesgo de Mercancía | `BAJO` |
| Riesgo Lavado de Dinero | `BAJO` |

> Nota: el teléfono se captura en dos partes (prefijo y número local). El prefijo se sugiere automáticamente según la moneda elegida y puede cambiarse manualmente a `+502`, `+503` o `+504`.

4. Una vez completado, presiona el botón **"Guardar"** o **"Registrar"**.
5. El sistema mostrará un mensaje de confirmación: _"Cliente registrado exitosamente"_.

![Datos Generales Cliente Completados (HN/HNL)](imgs/happypath/90_registro_cliente_datos_generales_hn_hnl.jpeg)
![Datos Fiscales Cliente](imgs/happypath/91_registro_cliente_datos_fiscales_nit_13.jpeg)
![Perfil de Riesgo Cliente](imgs/happypath/92_registro_cliente_perfil_riesgo.jpeg)
![Confirmación Cliente Registrado](imgs/happypath/93_registro_cliente_confirmacion_modal.jpeg)

#### 2.3.1 Correo de bienvenida con credenciales

Después del registro exitoso, el cliente recibe un correo de bienvenida con sus credenciales de acceso.

![Correo - Bienvenida con credenciales](imgs/happypath/42_email_bienvenida_credenciales.png)




#### 2.4 Gestión de usuario

En esta pantalla, se pueden observar todos los usuario dentro de la plataforma y filtrar a gusto.

Y también se mostrarán las opciones de editar y eliminar usuario, así como activarlo o desactivarlo.

![Listado de Usuarios](imgs/happypath/11_gestion_usuarios_lista.jpeg)
![Gestión de Catálogos - Edición](imgs/happypath/17_catalogos_edicion.jpeg)


#### 2.5 Gestión de catálogo

En esta pantalla se administran rutas y tipos de carga permitidos.

1. Desde el menú lateral, ingresa a **"Gestión de Catálogos"**.
2. Verifica la vista general con ambos paneles: rutas y tipos de carga.
3. Prueba agregar un tipo de carga y confirma el mensaje de éxito.
4. Prueba agregar una ruta y confirma el mensaje de éxito.
5. Prueba eliminar un tipo de carga y confirma el mensaje de éxito.
6. Prueba editar un registro existente (ruta o tipo de carga).

![Gestión de Catálogos - Vista General](imgs/happypath/13_catalogos_vista_general.jpeg)
![Gestión de Catálogos - Tipo de Carga Agregada](imgs/happypath/14_catalogos_tipo_carga_agregada.jpeg)
![Gestión de Catálogos - Ruta Agregada](imgs/happypath/15_catalogos_ruta_agregada.jpeg)
![Gestión de Catálogos - Tipo de Carga Eliminada](imgs/happypath/16_catalogos_tipo_carga_eliminada.jpeg)
![Más del catálogo](imgs/happypath/12_editar_usuario_modal.jpeg)




---

### 3. Módulo Comercial — Formalizar Contrato
**Actor**: Agente Operativo (misma sesión)

#### 3.1 Navegar al módulo de Contratos

1. Desde el menú lateral, selecciona **"Contratos"** o navega al módulo correspondiente.
2. Verás que el cliente recién creado (`DISTRIBUIDORA EL PROGRESO, S.A.`) aparece en el listado una vez que se coloca su nit.
3. Haz clic en el botón **"Formalizar Contrato"** asociado al cliente.

---

#### 3.2 Rellenar los datos del Contrato

Ingresa los siguientes datos para el contrato:

| Campo | Valor de ejemplo |
|-------|-------------------|
| Límite de Crédito del Contrato | `50,000.00` *(se visualizará en la moneda del cliente: HNL en este flujo base)* |
| Días de Pago | `15 días` |
| Descuento Especial | `5%` |
| Rutas Autorizadas | `SPS-SAL` (San Pedro Sula ↔ San Salvador) |
| Tipos de Carga | `CARGA GENERAL` |

> Validación esperada: el formulario debe mostrar símbolo/moneda según el cliente seleccionado. Para recaptura multivisa, usa este mismo flujo con un cliente de otro país/moneda y conserva el resto de pasos.

4. Presiona **"Generar Propuesta"**.
5. Si el cliente ya tiene un contrato `VIGENTE` o `PENDIENTE`, el sistema bloquea la creación y muestra una alerta en rojo.
6. Si no existe restricción activa, el sistema muestra confirmación de propuesta generada correctamente.

![Formulario Formalizar Contrato](imgs/happypath/94_formalizar_contrato_hnl_pbar_sps.jpeg)
![Propuesta Generada Correctamente](imgs/happypath/95_formalizar_contrato_propuesta_generada_modal.jpeg)

#### 3.2.1 Correo de propuesta de contrato

Al generar la propuesta, el cliente recibe un correo con el código de contrato, rutas y pasos para revisión/aceptación.

![Correo - Propuesta de Contrato](imgs/happypath/43_email_propuesta_contrato.png)


---

#### 3.3 El cliente acepta el contrato

El cliente debe aceptar la propuesta para que el contrato pase a estado `VIGENTE`.

1. Cierra sesión del Agente Operativo: haz clic en el ícono de usuario o en "Cerrar Sesión".
2. Inicia sesión como el **Cliente** (ver sección 4.1).
3. Navega al módulo **"Contratos"** en el menú del portal cliente.
4. Verás la propuesta en estado `PENDIENTE` con un botón **"Aceptar"**.
5. Presiona **"Aceptar"**.
6. El contrato cambia a estado **`VIGENTE`**.

![Cliente - Contrato Pendiente](imgs/happypath/97_cliente_contrato_pendiente_lista.jpeg)
![Cliente - Detalle de Contrato Pendiente](imgs/happypath/98_cliente_contrato_detalle_pendiente_hnl.jpeg)
![Cliente - Contrato Aceptado y Vigente](imgs/happypath/23_cliente_contrato_aceptado_vigente.jpeg)

---

### 4. Portal del Cliente — Crear una Orden de Servicio
**Actor**: Cliente
**Credenciales**:
- Email: `deennerparaprobar@gmail.com` *(mismo usuario creado en 2.3)*
- Password: `deennerparaprobar@gmail.com` *(o la definida en 2.3)*

> **Nota**: Si ya iniciaste sesión como cliente en el paso 3.3, puedes continuar directamente.

#### 4.1 Login como Cliente

1. Ingresa al Portal de Clientes LogiTrans.
2. Ingresa las credenciales del cliente.
3. Serás redirigido al **Portal del Cliente**, que muestra un resumen de tus órdenes, saldo y contratos.

![Portal Cliente - Dashboard Inicio](imgs/happypath/96_cliente_dashboard_sin_ordenes_hnl.jpeg)

#### 4.1.1 Recuperación de contraseña por token

1. En "¿Olvidaste tu contraseña?", ingresa el correo del usuario.
2. Revisa el correo recibido: incluye un **token de recuperación** (sin enlaces ni botones).
3. Abre la pantalla de "Restablecer contraseña" en el portal.
4. Ingresa manualmente el token, nueva contraseña y confirmación.
5. Confirma el cambio.

> Nota: el token expira en 30 minutos y es de un solo uso.

![Cliente - Seguridad antes de solicitar token](imgs/happypath/31_cliente_seguridad_sin_token.jpeg)
![Cliente - Token de recuperación enviado](imgs/happypath/32_cliente_seguridad_token_enviado.jpeg)
![Correo - Recuperación de contraseña con token](imgs/happypath/44_email_recuperacion_contrasena.png)

#### 4.1.2 Módulos disponibles para el Cliente

Desde el menú lateral del portal cliente se puede acceder a estos módulos principales:

1. **Órdenes**: historial y creación de nuevas órdenes.
2. **Contratos**: visualización de contratos y estado vigente.
3. **Facturas**: historial de facturación FEL.
4. **Estado de Cuenta**: resumen de crédito y saldos.
5. **Contactos**: administración de contactos clave.
6. **Mis Datos**: perfil empresarial y seguridad de cuenta.

![Cliente - Historial de Órdenes](imgs/happypath/20_cliente_historial_ordenes.jpeg)
![Cliente - Contratos](imgs/happypath/97_cliente_contrato_pendiente_lista.jpeg)
![Cliente - Mis Facturas](imgs/happypath/24_cliente_mis_facturas.jpeg)
![Cliente - Estado de Cuenta](imgs/happypath/26_cliente_estado_cuenta.jpeg)
![Cliente - Contactos Clave](imgs/happypath/25_cliente_contactos_vacio.jpeg)
![Cliente - Mi Perfil Empresarial](imgs/happypath/30_cliente_perfil_empresarial.jpeg)

#### 4.1.3 Gestión de contactos del Cliente

1. Ingresa a **"Contactos"**.
2. Presiona **"Agregar Contacto"** para registrar un nuevo contacto.
3. Verifica que aparezca en el listado con mensaje de confirmación.
4. También puedes editar un contacto existente desde el mismo módulo.

![Cliente - Nuevo Contacto (Modal)](imgs/happypath/27_cliente_contacto_nuevo_modal.jpeg)
![Cliente - Contacto Agregado](imgs/happypath/29_cliente_contacto_agregado.jpeg)
![Cliente - Editar Contacto (Modal)](imgs/happypath/28_cliente_contacto_editar_modal.jpeg)

---

#### 4.2 Crear una Nueva Orden de Servicio

1. En el menú lateral, haz clic en **"Nuevo Servicio"** u **"Órdenes"** → **"Solicitar Servicio"**.
2. Se presenta el formulario de solicitud de orden.
3. El sistema aplica automáticamente el **contrato vigente más reciente** del cliente autenticado.
4. El selector de mercancía solo muestra **tipos autorizados por ese contrato vigente**.

Si aún no hay contrato vigente, el sistema bloquea la creación y muestra advertencia:

![Cliente - Nueva orden bloqueada por falta de contrato vigente](imgs/happypath/19_cliente_nueva_orden_formulario.jpeg)

Ingresa los siguientes datos:

| Campo | Valor de ejemplo |
|-------|-------------------|
| Contrato | `Aplicado automáticamente por el sistema` |
| Tipo de Carga | `CARGA GENERAL` |
| Descripción de la Carga | `Sacos de cemento de Dora la exploradora` |
| Peso Declarado | `40 Ton` *(límite funcional vigente en UI cliente)* |
| Dirección de Recogida | `Mi casita` |
| Dirección de Entrega | `La casita en puerto barrios` |

> Validación esperada: en resumen/detalle de orden, montos y crédito deben respetar la moneda del contrato.

5. Confirma presionando **"Solicitar Servicio"** o **"Crear Orden"**.
6. La orden será creada con estado **`REGISTRADA`** y se notifica al equipo logístico.

![Cliente - Nueva Orden con contrato vigente](imgs/happypath/99_cliente_nueva_orden_datos_operativos.jpeg)
![Cliente - Revisión y Confirmación de la Orden](imgs/happypath/100_cliente_nueva_orden_revision_confirmacion.jpeg)
![Cliente - Confirmación visual de orden creada](imgs/happypath/101_cliente_dashboard_orden_creada_hnl.jpeg)

> Nota: este caso se documenta como escenario extremo para validación operativa de asignación. En la versión actual, el formulario de cliente limita el peso máximo permitido a `40 Ton`.

![Cliente - Mis Facturas con monto en moneda dinámica (HNL)](imgs/happypath/79_multivisa_cliente_facturas_moneda.jpeg)
![Cliente - Estado de Cuenta con saldos actualizados en moneda dinámica (HNL)](imgs/happypath/80_multivisa_cliente_estado_cuenta_moneda.jpeg)

---

### 5. Módulo Logístico — Asignar Binomio Piloto-Vehículo
**Actor**: Agente Logístico
**Credenciales**:
- Email: `2895884051401+l@ingenieria.usac.edu.gt`
- Password: `LogiLogistica`

#### 5.1 Login como Agente Logístico

1. Cierra sesión del cliente.
2. Inicia sesión con las credenciales del Agente Logístico.
3. Tu dashboard mostrará las **órdenes pendientes de asignación**.

![Logística - Dashboard inicial](imgs/happypath/37_logistica_dashboard_inicio.jpeg)

---

#### 5.2 Seleccionar la Orden y Asignar Binomio

1. En el menú, navega a **"Órdenes"** o **"Asignación de Rutas"**.
2. Localiza la orden recién creada de `DISTRIBUIDORA EL PROGRESO, S.A.` en estado **`REGISTRADA`**.
3. Haz clic en la orden para ver su detalle.
4. Verás un botón **"Asignar Binomio"** o similar.
5. Para este caso de `40 Ton`, filtra la orden por cliente y verifica que el peso declarado coincide.
6. Al abrir **"Asignar Binomio"**, selecciona la ruta del contrato, el binomio compatible y la fecha/hora de salida.
7. Confirma la asignación.
8. El sistema muestra confirmación y la orden cambia a estado **`ASIGNADA`** con unidad y piloto visibles en el detalle.

![Logística - Catálogo de Rutas](imgs/happypath/38_logistica_catalogo_rutas.jpeg)
![Logística - Órdenes de Servicio (vista general)](imgs/happypath/39_logistica_ordenes_lista_general.jpeg)
![Logística - Orden filtrada por caso extremo](imgs/happypath/40_logistica_orden_filtrada_peso_extremo.jpeg)
![Logística - Validación sin unidad disponible (caso inicial)](imgs/happypath/41_logistica_modal_sin_unidad_disponible.jpeg)
![Logística - Detalle de orden en estado REGISTRADA](imgs/happypath/102_logistica_detalle_orden_registrada.jpeg)
![Logística - Modal Asignar Binomio](imgs/happypath/103_logistica_modal_asignar_binomio.jpeg)
![Logística - Confirmación de asignación exitosa](imgs/happypath/104_logistica_asignacion_exitosa_modal.jpeg)

> Resultado esperado del caso: la aplicación permite asignar correctamente cuando existe una unidad compatible de 40 Ton.

---

### 6. Encargado de Patio — Registrar Despacho
**Actor**: Encargado de Patio
**Credenciales**:
- Email: `2895884051401+p@ingenieria.usac.edu.gt`
- Password: `LogiPatio`

#### 6.1 Login como Encargado de Patio

1. Cierra sesión del Agente Logístico.
2. Inicia sesión con las credenciales del Encargado de Patio.
3. Serás llevado al **Dashboard de Patio** con las órdenes listas para despacho.

![Patio - Dashboard inicial](imgs/happypath/48_patio_dashboard_inicio.jpeg)
![Patio - Lista general de cargas por formalizar](imgs/happypath/49_patio_lista_cargas_formalizar_general.jpeg)

---

#### 6.2 Registrar el Despacho de la Orden

1. Navega a **"Cargas"** o **"Órdenes en Patio"**.
2. Localiza la orden de `DISTRIBUIDORA EL PROGRESO, S.A.` en estado **`ASIGNADA`**.
3. Haz clic en **"Registrar Despacho"** o **"Iniciar Checklist de Patio"**.
4. El sistema solicita:

| Campo | Valor |
|-------|-------|
| Verificación de ID del Piloto | Confirmar que el piloto en patio coincide con el asignado ✅ |
| Peso real cargado | `40.02 Ton` *(dentro de tolerancia respecto al declarado de 40.00 Ton)* |
| Estiba confirmada | `Sí` ✅ |
| Unidad sellada | `Sí` ✅ |

5. Completa el checklist y presiona **"Autorizar Despacho"**.
6. La orden cambia a estado **`LISTA_PARA_DESPACHO`**.
7. Si el peso cargado no cumple la tolerancia, el sistema muestra alerta y no formaliza hasta corregir el dato.

![Patio - Orden filtrada para formalizar (40.00 Ton)](imgs/happypath/50_patio_orden_40t_pendiente_formalizacion.jpeg)
![Patio - Validación de tolerancia de peso (error)](imgs/happypath/51_patio_alerta_tolerancia_peso.jpeg)
![Patio - Formalización exitosa de la carga](imgs/happypath/52_patio_formalizacion_exitosa_40_02t.jpeg)

---

### 7. Piloto — Iniciar Tránsito y Registrar Bitácora
**Actor**: Piloto
**Credenciales**:
- Email: `2895884051401+t@ingenieria.usac.edu.gt`
- Password: `LogiPiloto`

Pero puede variar dependiendo del piloto al cual fue asignado todo esto. Refiérase a mvp_accesssos_usuario.md

#### 7.1 Login como Piloto

1. Cierra sesión del Encargado de Patio.
2. Inicia sesión con las credenciales del Piloto.
3. Verás el **Dashboard del Piloto** con tu orden asignada.

![Piloto - Dashboard con orden lista para despacho](imgs/happypath/105_piloto_dashboard_lista_despacho_22t.jpeg)

---

#### 7.2 Iniciar el Viaje (Cambiar a "En Tránsito")

1. Navega a **"Mi Viaje"** o **"Mis Órdenes"**.
2. Selecciona la orden de `DISTRIBUIDORA EL PROGRESO, S.A.`.
3. Haz clic en **"Iniciar Viaje"** o **"Cambiar a En Tránsito"**.
4. La orden cambia a estado **`EN_TRANSITO`**.

![Piloto - Detalle de viaje antes de iniciar](imgs/happypath/106_piloto_detalle_viaje_pre_inicio.jpeg)
![Piloto - Viaje iniciado en EN_TRANSITO](imgs/happypath/107_piloto_viaje_iniciado_en_transito_bitacora.jpeg)

---

#### 7.3 Registrar un Punto de Control en la Bitácora

1. En el mismo detalle de la orden activa, ve a la sección **"Bitácora"** o **"Registrar Evento"**.
2. Ingresa un nuevo evento:

| Campo | Valor |
|-------|-------|
| Tipo de Evento | `PUNTO_CONTROL` |
| Descripción | `Paso por zona 6 de Barberena sin novedades, ruta libre.` |

3. Presiona **"Registrar"** o **"Agregar Evento"**.
4. El evento aparece en el historial de la bitácora con la hora automática del sistema.

![Piloto - Modal Registrar Evento (Punto de Control)](imgs/happypath/56_piloto_modal_registrar_evento_punto_control.jpeg)
![Piloto - Bitácora con evento de punto de control registrado](imgs/happypath/57_piloto_bitacora_eventos_registrados.jpeg)

Mientras el piloto registra eventos, el cliente puede visualizar el tracking en paralelo:

![Cliente - Tracking de orden en tránsito con bitácora actualizada](imgs/happypath/58_cliente_tracking_orden_en_transito.jpeg)

---

### 8. Piloto — Confirmar Entrega con Evidencia

#### 8.1 Confirmar la Entrega

1. Al llegar al destino, en el detalle de la orden activa, haz clic en **"Confirmar Entrega"** o **"Finalizar Viaje"**.
2. El sistema solicita:

| Campo | Valor |
|-------|-------|
| Nombre del receptor | `Almacén Central Puerto Barrios` |
| Firma del receptor | *(Captura o confirmación digital)* |
| Fotografía de evidencia | *(Adjunta una imagen de la entrega)* |

3. Completa los campos y presiona **"Confirmar Entrega"**.
4. La orden cambia a estado **`ENTREGADA`**.
5. **Automáticamente**, el sistema genera un **borrador de factura (FEL)** en estado `BORRADOR` para que Finanzas lo revise. Este borrador aparece en la bandeja del Agente Financiero sin descripción de servicio ni fecha de vencimiento (pendientes de completar).

![Piloto - Formulario de confirmación de entrega con evidencia](imgs/happypath/59_piloto_formulario_confirmacion_entrega.jpeg)
![Piloto - Confirmación de entrega (Misión cumplida)](imgs/happypath/108_piloto_confirmacion_entrega_mision_cumplida_modal.jpeg)
![Piloto - Orden en estado ENTREGADA en Mis Viajes](imgs/happypath/109_piloto_dashboard_orden_entregada.jpeg)
![Cliente - Historial de órdenes actualizado a ENTREGADA](imgs/happypath/62_cliente_historial_orden_entregada.jpeg)

---

### 9. Módulo Financiero — Revisar Borrador y Enviar a Certificador
**Actor**: Agente Financiero
**Credenciales**:
- Email: `2895884051401+f@ingenieria.usac.edu.gt`
- Password: `LogiFinanzas`

#### 9.1 Revisar el borrador generado por la entrega

1. Cierra sesión del Piloto e inicia sesión como Agente Financiero.
2. Entra a **"Bandeja de Facturación"**.
3. Verifica que la factura de la orden `[ORD-XXXX]` aparece en sección **BORRADORES** como `[FAC-XXXX]`.
4. Abre la factura para revisión comercial y tributaria.
5. Confirma que el detalle muestra `currencyCode` correcto según contrato.
6. Confirma que el detalle muestra `taxRate` correcto según país del cliente.

![Finanzas - Bandeja con FAC-000065 en BORRADOR](imgs/happypath/63_finanzas_bandeja_borrador_fac_000065.jpeg)
![Finanzas - Revisión de borrador con moneda e impuesto dinámicos (HNL/15%)](imgs/happypath/110_finanzas_revision_factura_borrador_hnl.jpeg)


#### 9.2 Enviar borrador al Certificador FEL

1. Desde la vista de revisión, valida los datos del cliente, NIT y totales.
2. Completa/valida descripción del servicio y fecha de vencimiento en el modal si aplica.
3. Presiona **"Enviar a Certificador FEL"**.
4. La factura deja la etapa de borrador en Finanzas y pasa a la bandeja FEL.

![Finanzas - Detalle listo para enviar a FEL](imgs/happypath/110_finanzas_revision_factura_borrador_hnl.jpeg)
![Finanzas - Modal de confirmación de envío a FEL](imgs/happypath/111_finanzas_modal_confirmar_envio_fel.jpeg)

---

### 10. Módulo Certificador FEL — Validar NIT, Rechazar/Certificar
**Actor**: Certificador FEL
**Credenciales**:
- Email: `2895884051401+s@ingenieria.usac.edu.gt`
- Password: `LogiSAT`

#### 10.1 Ver factura pendiente en bandeja de aprobación

1. Cierra sesión de Finanzas.
2. Inicia sesión como Certificador FEL y abre **"Bandeja de Aprobación"**.
3. Verifica que `[FAC-XXXX]` de tu cliente de prueba multivisa está pendiente.

4. Confirma que la columna de monto refleja la moneda correcta (no hardcodeada a GTQ).

![FEL - Bandeja con FAC-000065 pendiente y monto en moneda dinámica](imgs/happypath/113_fel_bandeja_pendiente_monto_multimoneda.jpeg)

#### 10.2 Flujo de validación de NIT y certificación

1. Haz clic en **"Certificar"** para abrir el modal.
2. Presiona **"Verificar NIT"**.
3. Confirma que aparece el mensaje **"NIT validado correctamente"** y se habilita la acción final.
4. Presiona **"Confirmar y Certificar"**.
5. El sistema muestra confirmación de éxito y la factura sale de pendientes.

![FEL - NIT validado correctamente](imgs/happypath/114_fel_modal_certificar_nit_validado_hnl.jpeg)
![FEL - Factura certificada con éxito](imgs/happypath/115_fel_certificacion_exitosa_toast.jpeg)
![FEL - Correo de notificación a Finanzas](imgs/happypath/125_email_finanzas_fel_certifico_fac_000065.png)

#### 10.3 Flujo alterno de rechazo documentado

Este escenario alterno también quedó registrado para evidenciar control tributario:

1. Abrir el modal de **rechazo**.
2. Ingresar motivo (ejemplo: `NIT no valido`).
3. Confirmar rechazo y validar que desaparece de pendientes.

![FEL - Modal de rechazo](imgs/happypath/69_fel_modal_rechazo_documento.jpeg)
![FEL - Documento rechazado correctamente](imgs/happypath/70_fel_rechazo_confirmado.jpeg)

---

### 11. Módulo Financiero — Conciliar Pago y Enviar Factura al Cliente
**Actor**: Agente Financiero

#### 11.1 Identificar factura certificada para conciliación

1. Regresa a la sesión de Finanzas.
2. Abre **"Bandeja de Facturación"**.
3. Verifica que `[FAC-XXXX]` aparece en la etapa **CERTIFICADA**.

![Finanzas - FAC-000065 certificada y lista para enviar](imgs/happypath/116_finanzas_bandeja_certificadas_envio_habilitado.jpeg)

#### 11.2 Conciliar pago (CERTIFICADA -> PAGADA)

1. En el menú lateral, abre **"Conciliar Pagos"**.
2. Localiza la factura `[FAC-XXXX]` en la lista de pagos con acción requerida.
3. Presiona **"Aprobar"** para conciliar el pago registrado.
4. Verifica que la factura pasa al estado interno **`PAGADA`** y queda habilitada para envío al cliente.
5. Valida que el pago use la misma moneda que la factura.

![Finanzas - Lista de pagos con acción requerida para conciliación](imgs/happypath/122_finanzas_conciliar_pagos_lista_accion_requerida.jpeg)
![Finanzas - Modal de confirmación de aprobación de pago](imgs/happypath/123_finanzas_modal_confirmar_aprobacion_pago.jpeg)
![Finanzas - Conciliación de pagos aprobada para habilitar envío](imgs/happypath/117_finanzas_conciliar_pagos_aprobado_toast.jpeg)
![Finanzas - Tarifario base referenciado en USD](imgs/happypath/112_finanzas_tarifario_base_usd.jpeg)

#### 11.3 Confirmar envío al cliente

1. Presiona **"Enviar"** sobre `[FAC-XXXX]`.
2. En el modal, confirma con **"Confirmar envío"**.
3. El sistema muestra toast de éxito: **"Factura [FAC-XXXX] enviada al cliente"**.
4. La factura queda en estado **`ENVIADA`**.

![Finanzas - Modal de confirmación de envío](imgs/happypath/72_finanzas_modal_confirmar_envio_cliente.jpeg)
![Finanzas - Confirmación de factura enviada](imgs/happypath/73_finanzas_envio_cliente_confirmado.jpeg)

#### 11.4 Evidencia de recepción en correo y portal del cliente

Después de que Finanzas marca la factura como `ENVIADA`, el cliente la recibe por correo y también puede verla en su módulo de facturas:

1. El correo del cliente recibe la notificación **"Factura [FAC-XXXX] emitida"** con datos de documento y monto en moneda correcta.
2. En el portal del cliente, módulo **"Mis Facturas"**, ya aparece `[FAC-XXXX]` con su monto y estado.

![Cliente - Correo de factura emitida FAC-000065 en HNL](imgs/happypath/124_email_cliente_factura_emitida_hnl.png)
![Cliente - Mis Facturas en estado ENVIADA](imgs/happypath/129_cliente_facturas_estado_enviada_fac_000065.jpeg)
![Cliente - Detalle de factura en estado ENVIADA](imgs/happypath/130_cliente_factura_detalle_estado_enviada_fac_000065.jpeg)

> Importante: el estado de **factura** evoluciona como `BORRADOR -> CERTIFICADA -> PAGADA -> ENVIADA` (o `RECHAZADA` si FEL la rechaza). El estado `PENDIENTE` corresponde al **pago** en tesorería, no al estado de la factura.

#### 11.5 Trazabilidad de estados en portal del cliente

1. Verifica que la factura aparezca inicialmente en **`BORRADOR`** cuando se genera automáticamente.
2. Después de certificación FEL, confirma visualización en **`CERTIFICADA`**.
3. Tras conciliación y envío desde Finanzas, confirma estado final **`ENVIADA`**.

![Cliente - Mis Facturas en estado BORRADOR](imgs/happypath/126_cliente_facturas_estado_borrador_fac_000065.jpeg)
![Cliente - Mis Facturas en estado CERTIFICADA](imgs/happypath/128_cliente_facturas_estado_certificada_fac_000065.jpeg)
![Cliente - Detalle de factura en estado CERTIFICADA](imgs/happypath/127_cliente_factura_detalle_estado_certificada_fac_000065.jpeg)

#### 11.6 Referencia rápida de estados (Factura vs Pago)

| Dominio | Estados válidos | Nota |
|---|---|---|
| Factura | `BORRADOR`, `CERTIFICADA`, `PAGADA`, `ENVIADA`, `RECHAZADA` | Se muestra en bandejas de factura y portal cliente. |
| Pago | `PENDIENTE`, `APROBADO`, `RECHAZADO` | Se muestra en conciliación de pagos y tesorería. |

> Al aprobar pago y luego enviar factura, el cliente debe ver la factura como `ENVIADA` (no `PENDIENTE`).

---

### 12. Módulo Gerencia — Validación Ejecutiva en USD
**Actor**: Gerencia
**Credenciales**:
- Email: `2895884051401@ingenieria.usac.edu.gt`
- Password: `LogiGerencia`

#### 12.1 Login y acceso al dashboard ejecutivo

1. Cierra sesión de Finanzas.
2. Inicia sesión con las credenciales de Gerencia.
3. Verifica acceso a las tres vistas del módulo:
	- **Operaciones y KPIs** (`/gerencia`)
	- **Rentabilidad** (`/gerencia/rentabilidad`)
	- **Alertas y Proyecciones** (`/gerencia/alertas`)

#### 12.2 Validar KPIs de facturación en USD

1. En **Operaciones y KPIs**, valida que el tablero ejecutivo muestre montos monetarios en USD.
2. Cambia período (mensual/anual) y confirma que el KPI de **Facturación**:
	- Se muestra en formato USD (`$`).
	- Conserva consistencia al refrescar (sin mezclar símbolos de moneda).

> Resultado esperado: la tarjeta de facturación mantiene visualización USD para cualquier período.

![Gerencia - KPI de Facturación en USD (anual)](imgs/happypath/118_gerencia_kpi_facturacion_usd.jpeg)

#### 12.3 Validar rentabilidad y montos por cliente en USD

1. En **Rentabilidad**, valida que:
	- **Facturación Total** aparece en USD.
	- El gráfico **Ingresos por Cliente** muestra etiquetas en USD.
	- El subtítulo de ingresos indica **Monto facturado (USD)**.
  - **Nuevo**: El gráfico de **Evolución Histórica de Rentabilidad** muestra la tendencia de los últimos 6 meses.
  - **Nuevo**: El gráfico de **Distribución de Costos Operativos** permite ver el desglose por categoría.
2. Cambia entre período anual y mensual para verificar estabilidad de cálculo.

> Resultado esperado: todos los montos monetarios del módulo de rentabilidad se muestran normalizados a USD y los nuevos gráficos cargan datos correctamente.

![Gerencia - Rentabilidad: Facturación Total e Ingresos por Cliente en USD](imgs/happypath/119_gerencia_rentabilidad_facturacion_total_usd.jpeg)
![Gerencia - Nuevos Gráficos de Rentabilidad](imgs/happypath/120_gerencia_kpi_facturacion_usd_mensual.jpeg)

#### 12.4 Validar alertas y proyecciones

1. En **Alertas y Proyecciones**, confirma que:
	- Incidentes y retrasos se mantienen funcionales.
	- Tendencia y proyección cargan sin errores al refrescar.
2. Verifica que no hay regresiones visuales tras normalizar montos de gerencia a USD en el backend.

> Resultado esperado: la vista de alertas conserva su comportamiento y tiempos de respuesta esperados.

![Gerencia - Alertas y Proyecciones con datos cargados](imgs/happypath/121_gerencia_alertas_proyecciones_dashboard.jpeg)

---

## 11. Restricciones y reglas de negocio

### Reglas de órdenes

- El límite máximo de peso declarado desde el portal del cliente es de **40 toneladas**.
- No se pueden saltar estados intermedios en el flujo de una orden (`REGISTRADA → ASIGNADA → LISTA_PARA_DESPACHO → EN_TRANSITO → ENTREGADA`).
- Una orden debe tener un contrato vigente asociado para ser creada.
- El tipo de carga de una orden debe estar autorizado en el contrato del cliente.
- El piloto solo puede ver y operar las órdenes asignadas a su unidad.

### Reglas de contrato

- Un cliente solo puede tener **un contrato vigente activo** a la vez.
- El contrato pasa a `VIGENTE` únicamente cuando el cliente lo acepta explícitamente.
- Las rutas y tipos de carga autorizados son los únicos que el cliente puede utilizar al crear órdenes.

### Reglas de facturación

- El flujo de **factura** y el flujo de **pago** son independientes; no deben confundirse.
- No se puede enviar una factura al cliente antes de que esté en estado `PAGADA`.
- Un pago debe coincidir exactamente con el monto total de la factura.
- Las validaciones tributarias (NIT) deben pasar por el Certificador FEL antes de emitir el UUID.
- Una factura rechazada por FEL regresa a revisión de Finanzas para corrección.

### Reglas de patio

- La diferencia entre peso declarado y peso real debe estar dentro de la tolerancia operativa configurada.
- Si el peso real excede la capacidad de la unidad asignada, el sistema bloquea la formalización.
- El piloto en patio debe coincidir con el piloto asignado a la orden.

### Reglas de seguridad

- Las contraseñas temporales deben cambiarse en el primer acceso.
- El token de recuperación de contraseña expira en **30 minutos** y es de un solo uso.
- No se pueden reutilizar contraseñas previamente usadas.

---

## 12. Guía de navegación por rol

### Cliente

| Acción | Ruta en el sistema |
|---|---|
| Ver mis órdenes | Portal Cliente → Órdenes |
| Crear nueva orden | Portal Cliente → Órdenes → Solicitar Servicio |
| Hacer seguimiento de orden | Portal Cliente → Órdenes → Ver Tracking |
| Ver mis contratos | Portal Cliente → Contratos |
| Aceptar contrato pendiente | Portal Cliente → Contratos → Aceptar |
| Ver mis facturas | Portal Cliente → Facturas |
| Registrar pago | Portal Cliente → Facturas → Registrar Pago |
| Ver estado de cuenta | Portal Cliente → Estado de Cuenta |
| Gestionar contactos | Portal Cliente → Contactos |
| Cambiar contraseña | Portal Cliente → Mis Datos → Seguridad |

### Agente Operativo

| Acción | Ruta en el sistema |
|---|---|
| Registrar cliente | Operativo → Clientes → Nuevo Cliente |
| Buscar cliente | Operativo → Clientes → Buscar |
| Generar contrato | Operativo → Contratos → Formalizar Contrato |
| Administrar rutas | Operativo → Catálogos → Rutas |
| Administrar tipos de carga | Operativo → Catálogos → Tipos de Carga |
| Administrar usuarios | Operativo → Usuarios |

### Agente Logístico

| Acción | Ruta en el sistema |
|---|---|
| Ver órdenes pendientes | Logística → Órdenes |
| Asignar binomio | Logística → Órdenes → Asignar Binomio |
| Ver catálogo de rutas | Logística → Rutas |

### Encargado de Patio

| Acción | Ruta en el sistema |
|---|---|
| Ver cargas por despachar | Patio → Cargas |
| Formalizar despacho | Patio → Cargas → Formalizar |

### Piloto

| Acción | Ruta en el sistema |
|---|---|
| Ver mis viajes | Piloto → Mis Viajes |
| Iniciar viaje | Piloto → Mis Viajes → Iniciar |
| Registrar evento en bitácora | Piloto → Mis Viajes → Registrar Evento |
| Confirmar entrega | Piloto → Mis Viajes → Confirmar Entrega |

### Agente Financiero

| Acción | Ruta en el sistema |
|---|---|
| Ver facturas borrador | Finanzas → Bandeja de Facturación → Borradores |
| Enviar a certificación FEL | Finanzas → Bandeja → Enviar a FEL |
| Conciliar pago | Finanzas → Conciliar Pagos → Aprobar |
| Enviar factura al cliente | Finanzas → Bandeja → Certificadas → Enviar |
| Ver tarifario base | Finanzas → Tarifas |

### Certificador FEL

| Acción | Ruta en el sistema |
|---|---|
| Ver facturas pendientes | FEL → Bandeja de Aprobación |
| Validar NIT | FEL → Bandeja → Certificar → Verificar NIT |
| Certificar factura | FEL → Bandeja → Confirmar y Certificar |
| Rechazar factura | FEL → Bandeja → Rechazar |

### Gerencia

| Acción | Ruta en el sistema |
|---|---|
| Ver KPIs operativos | Gerencia → Operaciones y KPIs |
| Ver rentabilidad | Gerencia → Rentabilidad |
| Ver alertas y proyecciones | Gerencia → Alertas y Proyecciones |

---

## 13. Flujo de estados y cómo afectan al usuario

### Estado de órdenes

| Estado | Quién lo puede ver | Acción requerida | Siguiente actor |
|---|---|---|---|
| `REGISTRADA` | Cliente, Agente Logístico | Asignar binomio | Agente Logístico |
| `ASIGNADA` | Cliente, Patio | Formalizar carga | Encargado de Patio |
| `LISTA_PARA_DESPACHO` | Cliente, Piloto | Iniciar viaje | Piloto |
| `EN_TRANSITO` | Cliente, Piloto | Registrar eventos / Confirmar entrega | Piloto |
| `ENTREGADA` | Cliente, Finanzas | Revisar factura borrador | Agente Financiero |

### Estado de facturas

| Estado | Visible para | Acción disponible |
|---|---|---|
| `BORRADOR` | Finanzas, Cliente (solo lectura) | Completar y enviar a FEL |
| `CERTIFICADA` | Finanzas, Cliente | Aprobar pago / Enviar al cliente |
| `PAGADA` | Finanzas, Cliente | Enviar factura final |
| `ENVIADA` | Finanzas, Cliente | Solo consulta |
| `RECHAZADA` | Finanzas | Corregir y reenviar a FEL |

### Estado de pagos

| Estado | Descripción |
|---|---|
| `PENDIENTE` | El cliente registró el pago; Finanzas debe conciliarlo |
| `APROBADO` | Finanzas aprobó el pago; la factura pasa a `PAGADA` |
| `RECHAZADO` | Finanzas rechazó el pago; el cliente debe registrar uno nuevo |

---

## 14. Consideraciones de seguridad para el usuario final

### Buenas prácticas obligatorias

- **No compartir credenciales** con otras personas, incluso dentro de la misma empresa.
- **Cambiar la contraseña temporal** en el primer acceso al sistema.
- **Cerrar sesión** al terminar de operar, especialmente en equipos compartidos.
- **No adjuntar evidencia** no relacionada con la orden al confirmar entrega.
- **Verificar el NIT** antes de enviar una factura a certificación para evitar rechazos.

### Privacidad de información

- Los datos del cliente se utilizan exclusivamente para operación logística y facturación.
- El sistema conserva trazabilidad completa de eventos relevantes (cambios de estado, eventos de bitácora, acciones de usuario).
- Los cambios críticos (certificación, aprobación de pago, envío de factura) quedan auditados con el usuario que los ejecutó.

---

## 15. Soporte y ayuda

### Orden recomendado de atención

1. Revisar este manual y la sección de preguntas frecuentes.
2. Consultar la guía de navegación por rol (Sección 12).
3. Confirmar el estado de la orden/factura en el módulo correspondiente.
4. Contactar al equipo de soporte funcional de LogiTrans.
5. Escalar a soporte técnico si hay error de plataforma.

### Documentos de apoyo

| Documento | Descripción |
|---|---|
| `docs/TECHNICAL_MANUAL.md` | Manual técnico para desarrolladores y DevOps |
| `docs/mvp_accessos_usuarios.md` | Credenciales y accesos por rol para entorno de pruebas |
| `docs/endpoint_tables.md` | Catálogo detallado de endpoints REST |
| `docs/despliegue.md` | Instrucciones de instalación y despliegue |

---

## 16. Anexos y referencias

- Happy Path completo: `docs/happypath.md`
- Manual Técnico: `docs/TECHNICAL_MANUAL.md`
- Arquitectura: `docs/architecture.md`
- DDA: `docs/dda.md`
- ADR: `docs/adr.md`
- Despliegue: `docs/despliegue.md`

---

**© 2026 LogiTrans Guatemala — Grupo 2 — Análisis y Diseño de Sistemas 2**
