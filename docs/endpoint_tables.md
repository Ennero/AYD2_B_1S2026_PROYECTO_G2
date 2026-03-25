# Catalogo de Endpoints por Modulo

Este documento consolida los endpoints definidos en los mocks y los aterriza al esquema real de la base de datos.

Los ejemplos usan UUIDs, tokens y valores ilustrativos.

## AUTENTICACION / PUBLICO

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Endpoint</th>
      <th>Request (Query / Body)</th>
      <th>Response</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>POST</td>
      <td>/api/auth/login</td>
      <td><pre>{
  "body": {
    "email": "patio@logitrans.com",
    "password": "miClaveSecreta"
  }
}</pre></td>
      <td><pre>{
  "message": "Usuario logueado",
  "data": {
    "userId": "5d3fd0c3-2c18-4f1a-9c5f-53a6f0c5fb4a",
    "sessionUuid": "7de0be95-cd56-4209-b6df-9a1d24536c44",
    "role": "ENCARGADO_PATIO",
    "fullName": "Pablo Perez",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}</pre></td>
      <td>Valida <strong>USERS.EMAIL</strong> contra el correo recibido.<br>Compara la clave plana contra <strong>USERS.PASSWORD_HASH</strong>.<br>Inserta una sesion en <strong>USER_SESSIONS</strong> guardando <strong>USER_REMOTE</strong>, <strong>USER_AGENT</strong>, <strong>USER_UUID</strong>, <strong>SESSION_UUID</strong>, <strong>SESSION_TOKEN</strong>, <strong>SESSION_SOURCE</strong> y <strong>EXPIRATION_AT</strong>.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/auth/refresh</td>
      <td><pre>{
  "cookies": {
    "sessionToken": "&lt;httpOnly_session_token&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Sesion renovada correctamente",
  "data": {
    "sessionUuid": "7de0be95-cd56-4209-b6df-9a1d24536c44",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}</pre></td>
      <td>Busca la sesion activa en <strong>USER_SESSIONS</strong> por <strong>SESSION_TOKEN</strong>.<br>Valida <strong>EXPIRATION_AT</strong>, incrementa <strong>USAGE_COUNT</strong>, actualiza <strong>LAST_USED_AT</strong> y puede rotar el token si la implementacion lo requiere.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/auth/logout</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt&gt;"
  },
  "cookies": {
    "sessionToken": "&lt;httpOnly_session_token&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Sesion cerrada correctamente",
  "data": {}
}</pre></td>
      <td>Revoca la sesion actual haciendo <strong>UPDATE USER_SESSIONS</strong> con <strong>DELETED_AT</strong>.<br>Permite invalidar el token de sesion sin borrar historico.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/auth/recovery</td>
      <td><pre>{
  "body": {
    "email": "cliente@empresa.com"
  }
}</pre></td>
      <td><pre>{
  "message": "Correo con token unico enviado correctamente (via Resend)",
  "data": {
    "expiresInMinutes": 30
  }
}</pre></td>
      <td>Busca el usuario por <strong>USERS.EMAIL</strong>.<br>Inserta un registro en <strong>PASSWORD_RECOVERY_TOKENS</strong> con <strong>TOKEN_HASH</strong>, <strong>EXPIRES_AT</strong> y <strong>USER_ID</strong>.<br>El token real se envia por correo mediante <strong>Resend</strong>; no se guarda en texto plano.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/auth/password</td>
      <td><pre>{
  "body": {
    "token": "<token_hex_64>",
    "password": "NuevaClave2026!",
    "confirmation": "NuevaClave2026!"
  }
}</pre></td>
      <td><pre>{
  "message": "Contrasena modificada correctamente",
  "data": {}
}</pre></td>
  <td>Actualiza <strong>USERS.PASSWORD_HASH</strong>.<br>Marca <strong>PASSWORD_RECOVERY_TOKENS.USED_AT</strong> para inutilizar el token.<br>El token de recuperacion se envia en el cuerpo de la solicitud (no en Authorization).<br>Debe impedir reutilizar la misma contrasena actual.</td>
    </tr>
  </tbody>
</table>

## PORTAL CLIENTE

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Endpoint</th>
      <th>Request (Query / Body)</th>
      <th>Response</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>GET</td>
      <td>/api/client/dashboard/summary</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Resumen del cliente obtenido correctamente",
  "data": {
    "creditLimit": 50000.0,
    "outstandingBalance": 18750.0,
    "availableCredit": 31250.0,
    "activeOrders": 3,
    "overdueInvoices": 1,
    "shouldBlockOrders": true
  }
}</pre></td>
      <td>Se apoya principalmente en la vista <strong>V_CLIENT_BALANCES</strong>.<br>Cuenta ordenes activas desde <strong>ORDERS</strong> por cliente autenticado.<br>No modifica datos.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/cargo-types</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Tipos de mercancia obtenidos correctamente",
  "data": [
    {
      "cargoTypeId": 1,
      "cargoName": "GENERAL",
      "requiresRefrigeration": false
    },
    {
      "cargoTypeId": 2,
      "cargoName": "REFRIGERADO",
      "requiresRefrigeration": true
    }
  ]
}</pre></td>
      <td>Devuelve solo tipos de mercancia autorizados por el contrato vigente mas reciente del cliente autenticado.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/client/orders</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  },
  "body": {
    "cargoTypeId": 2,
    "declaredWeightTon": 10.5,
    "cargoDescription": "Producto refrigerado",
    "pickupAddress": "Zona 12, Ciudad de Guatemala",
    "deliveryAddress": "San Salvador, El Salvador"
  }
}</pre></td>
      <td><pre>{
  "message": "Orden creada correctamente",
  "data": {
    "orderId": 85,
    "orderNumber": "ORD-2026-0085",
    "status": "REGISTRADA"
  }
}</pre></td>
      <td>Inserta en <strong>ORDERS</strong> con <strong>REQUESTED_BY_USER_ID</strong> y usa automaticamente el contrato vigente mas reciente del cliente autenticado.<br>No recibe <strong>contractId</strong> en el payload.<br>El tipo de mercancia se valida contra los autorizados por contrato vigente; si no pertenece, retorna error 400.<br>La <strong>CONTRACT_ROUTE_ID</strong> todavia no viene en esta etapa; la asigna Logistica despues.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/orders</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  },
  "query": {
    "limit": 3,
    "status": "EN_TRANSITO",
    "search": "ORD-000085"
  }
}</pre></td>
      <td><pre>{
  "message": "Ordenes obtenidas correctamente",
  "data": [
    {
      "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
      "orderNumber": "ORD-000085",
      "origin": "Ciudad de Guatemala",
      "destination": "San Salvador",
      "status": "EN_TRANSITO",
      "requestedAt": "2026-04-01T08:30:00Z"
    }
  ]
}</pre></td>
      <td>Hace SELECT sobre <strong>ORDERS</strong> filtrando por el cliente del token mediante <strong>CONTRACTS.CLIENT_ID</strong>.<br>Con <strong>limit=3</strong> alimenta el dashboard y sin limite sirve el historial completo.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/orders/catalog</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Catalogo de ordenes obtenido correctamente",
  "data": [
    {
      "ORDER_ID": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
      "ORDER_NUMBER": "ORD-000085"
    }
  ]
}</pre></td>
      <td>Devuelve una lista reducida con <strong>ORDER_ID</strong> y <strong>ORDER_NUMBER</strong> para poblar el combobox del tracking.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/orders/{ORDER_ID}/tracking</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Tracking obtenido correctamente",
  "data": {
    "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
    "status": "EN_TRANSITO",
    "logs": [
      {
        "eventType": "SALIDA",
        "eventTime": "2026-04-01T14:00:00Z",
        "description": "Unidad sale de patio"
      },
      {
        "eventType": "PUNTO_CONTROL",
        "eventTime": "2026-04-01T18:15:00Z",
        "description": "Paso por control km 85"
      }
    ]
  }
}</pre></td>
      <td>Lee de <strong>ORDERS</strong> y <strong>ORDER_ROUTE_LOGS</strong>.<br>Este endpoint alimenta el tracking visible al cliente sin exponer tablas internas.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/contracts</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  },
  "query": {
    "status": "PENDIENTE"
  }
}</pre></td>
      <td><pre>{
  "message": "Contratos obtenidos correctamente",
  "data": [
    {
      "contractId": "a73b5271-6cb9-4c91-bd67-3794c5eb5a7b",
      "contractNumber": "CONT-00012",
      "status": "PENDIENTE",
      "startDate": "2026-04-01",
      "endDate": "2027-04-01"
    }
  ]
}</pre></td>
      <td>Consulta <strong>CONTRACTS</strong> por cliente autenticado.<br>No modifica datos.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/contracts/{CONTRACT_ID}</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Detalle del contrato obtenido correctamente",
  "data": {
    "contractId": "a73b5271-6cb9-4c91-bd67-3794c5eb5a7b",
    "creditLimit": 50000.0,
    "paymentTermDays": 30,
    "discountPercentage": 5.0,
    "routes": [
      {
        "routeId": 7,
        "origin": "CIUDAD DE GUATEMALA",
        "destination": "SAN SALVADOR"
      }
    ],
    "cargoTypes": [
      {
        "cargoTypeId": 2,
        "cargoName": "PERECEDEROS"
      }
    ]
  }
}</pre></td>
      <td>Hace JOIN entre <strong>CONTRACTS</strong>, <strong>CONTRACT_ROUTES</strong>, <strong>ROUTES</strong>, <strong>CONTRACT_CARGO_TYPES</strong> y <strong>CARGO_TYPES</strong>.<br>Puede sumar tambien <strong>CONTRACT_RATES</strong> para mostrar tarifario pactado.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/client/contracts/{CONTRACT_ID}/accept</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Contrato aceptado correctamente",
  "data": {
    "contractId": "a73b5271-6cb9-4c91-bd67-3794c5eb5a7b",
    "status": "VIGENTE",
    "acceptedAt": "2026-04-02T10:20:00Z"
  }
}</pre></td>
      <td>Actualiza <strong>CONTRACTS.STATUS</strong> a <strong>VIGENTE</strong> y guarda <strong>ACCEPTED_AT</strong>.<br>En este MVP no se persiste archivo firmado; debe respetar el indice de contrato activo por cliente.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/client/contracts/{CONTRACT_ID}/reject</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  },
  "body": {
    "reason": "No aceptamos el plazo de pago propuesto"
  }
}</pre></td>
      <td><pre>{
  "message": "Contrato rechazado correctamente",
  "data": {
    "contractId": "a73b5271-6cb9-4c91-bd67-3794c5eb5a7b",
    "status": "RECHAZADO"
  }
}</pre></td>
      <td>Actualiza <strong>CONTRACTS.STATUS</strong> a <strong>RECHAZADO</strong>.<br>El motivo puede guardarse en <strong>CONTRACTS.NOTES</strong> o en una bitacora comercial si luego se agrega.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/invoices</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  },
  "query": {
    "status": "ENVIADA",
    "search": "FAC-"
  }
}</pre></td>
      <td><pre>{
  "message": "Facturas obtenidas correctamente",
  "data": [
    {
      "invoiceId": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
      "invoiceNumber": "FAC-000031",
      "status": "ENVIADA",
      "felUuid": "3C7D8A4E-3D23-4ED8-B410-ABC123456789",
      "totalAmount": 23520.0,
      "dueDate": "2026-05-01"
    }
  ]
}</pre></td>
      <td>Lee de <strong>INVOICES</strong> filtrando por <strong>CLIENT_ID</strong>.<br>Puede incluir enlaces a <strong>PDF_PATH</strong> cuando la factura ya fue enviada.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/account-statement</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Estado de cuenta obtenido correctamente",
  "data": {
    "outstandingBalance": 18750.0,
    "availableCredit": 31250.0,
    "overdueInvoices": 1,
    "aging": {
      "current": 12000.0,
      "over30": 6750.0,
      "over60": 0.0
    }
  }
}</pre></td>
      <td>Puede apoyarse en <strong>V_CLIENT_BALANCES</strong> y en agregaciones de <strong>INVOICES</strong> por vencimiento.<br>No modifica datos.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/client/payments</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  },
  "body": {
    "INVOICE_ID": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
    "PAYMENT_METHOD": "TRANSFERENCIA",
    "BANK_NAME": "BANCO INDUSTRIAL",
    "BANK_ACCOUNT_NUMBER": "001-9999-2",
    "BANK_REFERENCE": "TRX-882771",
    "SUPPORT_DOCUMENT_PATH": "/files/receipts/TRX-882771.png",
    "AMOUNT": 23520.0
  }
}</pre></td>
      <td><pre>{
  "message": "Pago registrado correctamente",
  "data": {
    "paymentId": "ec08b307-09bb-4f5c-98d6-c6a4fa32bcb3",
    "status": "PENDIENTE"
  }
}</pre></td>
      <td>Inserta en <strong>PAYMENTS</strong>.<br>El trigger valida que <strong>AMOUNT</strong> coincida exactamente con el total de la factura.<br>Si es <strong>TRANSFERENCIA</strong> o <strong>CHEQUE</strong> exige <strong>BANK_NAME</strong>, <strong>BANK_ACCOUNT_NUMBER</strong>, <strong>BANK_REFERENCE</strong> y <strong>SUPPORT_DOCUMENT_PATH</strong>; si es tarjeta exige <strong>CARD_ID</strong>.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/cards</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Tarjetas obtenidas correctamente",
  "data": [
    {
      "CARD_ID": "89f38437-22b9-4941-adfd-c3d9d4048267",
      "CARD_ALIAS": "Visa corporativa",
      "CARDHOLDER_NAME": "Ana Morales",
      "CARD_BRAND": "VISA",
      "LAST_FOUR": "4455",
      "IS_ACTIVE": true
    }
  ]
}</pre></td>
      <td>Consulta <strong>CLIENT_CARDS</strong> por <strong>CLIENT_ID</strong> del usuario autenticado.<br>Devuelve tarjetas activas sin manejar una bandera de tarjeta predeterminada en este MVP.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/client/cards</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  },
  "body": {
    "CARD_ALIAS": "Visa corporativa",
    "CARDHOLDER_NAME": "Ana Morales",
    "CARD_BRAND": "VISA",
    "LAST_FOUR": "4455",
    "EXPIRATION_MONTH": 12,
    "EXPIRATION_YEAR": 2028
  }
}</pre></td>
      <td><pre>{
  "message": "Tarjeta registrada correctamente",
  "data": {
    "CARD_ID": "89f38437-22b9-4941-adfd-c3d9d4048267",
    "IS_ACTIVE": true
  }
}</pre></td>
      <td>Inserta en <strong>CLIENT_CARDS</strong>.<br>Debe respetar la unicidad de <strong>(CLIENT_ID, CARD_ALIAS)</strong>.<br>No se guarda numero completo de tarjeta en este modelo MVP.</td>
    </tr>
    <tr>
      <td>DELETE</td>
      <td>/api/client/cards/{CARD_ID}</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Tarjeta desactivada correctamente",
  "data": {
    "cardId": "89f38437-22b9-4941-adfd-c3d9d4048267",
    "isActive": false
  }
}</pre></td>
      <td>No borra fisicamente.<br>Hace <strong>UPDATE CLIENT_CARDS SET IS_ACTIVE = FALSE</strong> para conservar historico de pagos.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/profile</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Perfil obtenido correctamente",
  "data": {
    "CLIENT_ID": "fe3fc5a5-7f42-48cf-963b-ea854aa0e2ff",
    "LEGAL_NAME": "Comercializadora Maya, S.A.",
    "NIT": "1234567-8",
    "PRIMARY_CONTACT_PHONE": "5555-1212"
  }
}</pre></td>
      <td>Consulta <strong>CLIENTS</strong> y puede enriquecer con <strong>CLIENT_CONTACTS</strong> para contactos secundarios.<br>No modifica datos.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/client/profile/password</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  },
  "body": {
    "currentPassword": "ClaveActual123",
    "newPassword": "NuevaClave2026!",
    "confirmation": "NuevaClave2026!"
  }
}</pre></td>
      <td><pre>{
  "message": "Contrasena actualizada correctamente",
  "data": {}
}</pre></td>
      <td>Actualiza <strong>USERS.PASSWORD_HASH</strong> del usuario autenticado.<br>Debe validar la clave actual antes del cambio.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/client/contacts</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Contactos obtenidos correctamente",
  "data": [
    {
      "CONTACT_ID": "0b5c4c3d-9bc7-4ee0-b7fe-9b9c4f7168b0",
      "CONTACT_NAME": "Ana Morales",
      "CONTACT_EMAIL": "ana.morales@empresa.com",
      "CONTACT_PHONE": "5566-7788",
      "POSITION_TITLE": "Compras",
      "IS_ACTIVE": true
    }
  ]
}</pre></td>
      <td>Consulta <strong>CLIENT_CONTACTS</strong> del cliente autenticado.<br>No crea ni expone usuarios de plataforma.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/client/contacts</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  },
  "body": {
    "CONTACT_NAME": "Ana Morales",
    "CONTACT_EMAIL": "ana.morales@empresa.com",
    "CONTACT_PHONE": "5566-7788",
    "POSITION_TITLE": "Compras"
  }
}</pre></td>
      <td><pre>{
  "message": "Contacto registrado correctamente",
  "data": {
    "CONTACT_ID": "0b5c4c3d-9bc7-4ee0-b7fe-9b9c4f7168b0"
  }
}</pre></td>
      <td>Inserta en <strong>CLIENT_CONTACTS</strong>.<br>El contacto principal del cliente se administra directamente en <strong>CLIENTS.PRIMARY_CONTACT_*</strong>, no con una bandera adicional.</td>
    </tr>
    <tr>
      <td>PUT</td>
      <td>/api/client/contacts/{CONTACT_ID}</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  },
  "body": {
    "CONTACT_NAME": "Ana Morales",
    "CONTACT_EMAIL": "ana.morales@empresa.com",
    "CONTACT_PHONE": "5566-7788"
  }
}</pre></td>
      <td><pre>{
  "message": "Contacto actualizado correctamente",
  "data": {
    "CONTACT_ID": "0b5c4c3d-9bc7-4ee0-b7fe-9b9c4f7168b0"
  }
}</pre></td>
      <td>Hace UPDATE sobre <strong>CLIENT_CONTACTS</strong> del cliente correspondiente.<br>Debe impedir modificar contactos de otro cliente.</td>
    </tr>
    <tr>
      <td>DELETE</td>
      <td>/api/client/contacts/{CONTACT_ID}</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_cliente&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Contacto desactivado correctamente",
  "data": {
    "CONTACT_ID": "0b5c4c3d-9bc7-4ee0-b7fe-9b9c4f7168b0",
    "IS_ACTIVE": false
  }
}</pre></td>
      <td>No borra el registro.<br>Hace borrado logico con <strong>CLIENT_CONTACTS.IS_ACTIVE = FALSE</strong>.</td>
    </tr>
  </tbody>
</table>

## AGENTE OPERATIVO

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Endpoint</th>
      <th>Request (Query / Body)</th>
      <th>Response</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>POST</td>
      <td>/api/operations/clients</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_operativo&gt;"
  },
  "body": {
    "legalName": "Comercializadora Maya, S.A.",
    "nit": "1234567890123",
    "taxAddress": "Zona 12, Ciudad de Guatemala",
    "primaryContactName": "Ana Morales",
    "primaryContactEmail": "ana.morales@empresa.com",
    "portalPassword": "#ClaveTemporal2026",
    "primaryContactPhone": "5566-7788",
    "paymentRisk": "MEDIO",
    "customsRisk": "MEDIO",
    "cargoRisk": "BAJO",
    "amlRisk": "MEDIO"
  }
}</pre></td>
      <td><pre>{
  "message": "Cliente creado correctamente",
  "data": {
    "clientId": 12,
    "clientCode": "CLI-00012",
    "portalUserEmail": "ana.morales@empresa.com"
  }
}</pre></td>
      <td>Inserta en <strong>CLIENTS</strong> y crea un usuario en <strong>USERS</strong> con rol <strong>CLIENTE</strong> usando <strong>primaryContactEmail</strong> y <strong>portalPassword</strong>.<br>Dispara el envío de credenciales de bienvenida al correo del contacto principal.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/operations/clients</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_operativo&gt;"
  },
  "query": {
    "search": "Maya"
  }
}</pre></td>
      <td><pre>{
  "message": "Clientes obtenidos correctamente",
  "data": [
    {
      "clientId": "fe3fc5a5-7f42-48cf-963b-ea854aa0e2ff",
      "clientCode": "CLI-00012",
      "legalName": "Comercializadora Maya, S.A.",
      "nit": "1234567-8"
    }
  ]
}</pre></td>
      <td>Hace SELECT sobre <strong>CLIENTS</strong> por razon social, nombre comercial o NIT.<br>No modifica datos.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/operations/cargo-types</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_operativo&gt;"
  },
  "query": {
    "isActive": true
  }
}</pre></td>
      <td><pre>{
  "message": "Tipos de mercancia obtenidos correctamente",
  "data": [
    {
      "cargoTypeId": 1,
      "cargoName": "GENERAL",
      "requiresRefrigeration": false
    }
  ]
}</pre></td>
      <td>Consulta <strong>CARGO_TYPES</strong> para mantener el catalogo que luego usan contratos y clientes.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/operations/cargo-types</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_operativo&gt;"
  },
  "body": {
    "cargoName": "QUIMICOS",
    "requiresRefrigeration": false
  }
}</pre></td>
      <td><pre>{
  "message": "Tipo de mercancia registrado correctamente",
  "data": {
    "cargoTypeId": 5,
    "cargoName": "QUIMICOS"
  }
}</pre></td>
      <td>Inserta una nueva fila en <strong>CARGO_TYPES</strong> para ampliar el catalogo operativo disponible en contratos y ordenes.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/operations/routes</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_operativo&gt;"
  },
  "query": {
    "isActive": true
  }
}</pre></td>
      <td><pre>{
  "message": "Rutas obtenidas correctamente",
  "data": [
    {
      "routeId": 7,
      "routeCode": "GUA-SAL",
      "origin": "CIUDAD DE GUATEMALA",
      "destination": "SAN SALVADOR",
      "estimatedHours": 5.5
    }
  ]
}</pre></td>
      <td>Consulta <strong>ROUTES</strong> filtrando rutas activas.<br>Alimenta el panel de seleccion del contrato y tambien se reutiliza desde Logistica.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/operations/routes</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_operativo&gt;"
  },
  "body": {
    "routeCode": "GUA-ZAC",
    "origin": "CIUDAD DE GUATEMALA",
    "destination": "ZACAPA",
    "distanceKm": 145.5,
    "estimatedHours": 3.5,
    "isInternational": false
  }
}</pre></td>
      <td><pre>{
  "message": "Ruta registrada correctamente",
  "data": {
    "ROUTE_ID": 9,
    "ROUTE_CODE": "RTE-00009"
  }
}</pre></td>
      <td>Inserta una nueva fila en <strong>ROUTES</strong> para ampliar el catalogo operativo reutilizado por contratos y asignaciones logisticas.<br>El <strong>ROUTE_CODE</strong> lo genera automaticamente la base de datos.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/operations/contracts</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_operativo&gt;"
  },
  "body": {
    "clientId": "fe3fc5a5-7f42-48cf-963b-ea854aa0e2ff",
    "creditLimit": 50000.0,
    "paymentTermDays": 30,
    "discountPercentage": 5.0,
    "notes": "Cliente exportador premium",
    "routeIds": [7, 8],
    "cargoTypeIds": [1, 2]
  }
}</pre></td>
      <td><pre>{
  "message": "Contrato generado correctamente",
  "data": {
    "contractId": "a73b5271-6cb9-4c91-bd67-3794c5eb5a7b",
    "contractNumber": "CONT-00012",
    "status": "PENDIENTE"
  }
}</pre></td>
      <td>Inserta en <strong>CONTRACTS</strong>, <strong>CONTRACT_ROUTES</strong> y <strong>CONTRACT_CARGO_TYPES</strong> dentro de una transaccion.<br>El trigger <strong>SYNC_CONTRACT_DEFAULTS</strong> genera o sincroniza <strong>CONTRACT_RATES</strong> segun el descuento del contrato.</td>
    </tr>
  </tbody>
</table>

## AGENTE LOGISTICO

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Endpoint</th>
      <th>Request (Query / Body)</th>
      <th>Response</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>GET</td>
      <td>/api/logistics/dashboard/summary</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_logistico&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Resumen logistico obtenido correctamente",
  "data": {
    "pendingOrders": 2,
    "availableUnits": 5
  }
}</pre></td>
      <td>Hace agregaciones sobre <strong>ORDERS</strong> pendientes de asignacion y <strong>TRANSPORT_UNITS</strong> disponibles para poblar la pantalla inicial.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/logistics/orders</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_logistico&gt;"
  },
  "query": {
    "status": "REGISTRADA",
    "startDate": "2026-04-01",
    "clientId": "fe3fc5a5-7f42-48cf-963b-ea854aa0e2ff"
  }
}</pre></td>
      <td><pre>{
  "message": "Ordenes obtenidas correctamente",
  "data": [
    {
      "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
      "orderNumber": "ORD-000085",
      "clientName": "Comercializadora Maya, S.A.",
      "origin": "Ciudad de Guatemala",
      "destination": "San Salvador",
      "declaredWeightTon": 10.5,
      "status": "REGISTRADA"
    }
  ]
}</pre></td>
      <td>Hace JOIN entre <strong>ORDERS</strong>, <strong>CONTRACTS</strong> y <strong>CLIENTS</strong>.<br>Sirve para listar ordenes pendientes de asignacion.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/logistics/orders/{ORDER_ID}</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_logistico&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Detalle de orden obtenido correctamente",
  "data": {
    "ORDER_ID": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
    "ORDER_NUMBER": "ORD-000085",
    "PICKUP_ADDRESS": "Planta 3",
    "DELIVERY_ADDRESS": "Bodega Central",
    "DECLARED_WEIGHT_TON": 10.5,
    "STATUS": "REGISTRADA"
  }
}</pre></td>
      <td>Expone el detalle puntual de la orden antes de asignar unidad y ruta.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/operations/routes</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_logistico&gt;"
  },
  "query": {
    "isActive": true
  }
}</pre></td>
      <td><pre>{
  "message": "Rutas obtenidas correctamente",
  "data": [
    {
      "ROUTE_ID": 7,
      "ROUTE_CODE": "RTE-00007"
    }
  ]
}</pre></td>
      <td>Logistica reutiliza el catalogo de <strong>ROUTES</strong> ya administrado por Operativa para evitar duplicar mantenimiento.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/logistics/unit-binomials</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_logistico&gt;"
  },
  "query": {
    "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45"
  }
}</pre></td>
      <td><pre>{
  "message": "Binomios obtenidos correctamente",
  "data": [
    {
      "binomialId": "unit:5f1c0f39-2577-44f3-82ff-6bce1b8faed8",
      "unitId": "5f1c0f39-2577-44f3-82ff-6bce1b8faed8",
      "pilotUserId": "6cc675dc-df55-4ad8-9b8e-b2ecedcdf2d7",
      "pilotName": "Pablo Perez",
      "plateNumber": "HT44343",
      "vehicleType": "CAMION PESADO",
      "capacityTon": 12.0
    }
  ]
}</pre></td>
      <td>Consulta <strong>TRANSPORT_UNITS</strong> y <strong>USERS</strong> del piloto asociado.<br>Debe filtrar solo unidades activas, documentacion vigente y compatibles con el peso y el tipo de carga.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/logistics/orders/{ORDER_ID}/assignment</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_agente_logistico&gt;"
  },
  "body": {
    "contractRouteId": "963d1f1f-d914-4e07-8852-a95e8f7073f3",
    "binomialId": "unit:5f1c0f39-2577-44f3-82ff-6bce1b8faed8",
    "scheduledDeparture": "2026-04-01T14:00:00Z"
  }
}</pre></td>
      <td><pre>{
  "message": "Orden asignada correctamente",
  "data": {
    "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
    "status": "ASIGNADA",
    "unitId": "5f1c0f39-2577-44f3-82ff-6bce1b8faed8",
    "scheduledPickupAt": "2026-04-01T14:00:00Z"
  }
}</pre></td>
      <td>Actualiza <strong>ORDERS.UNIT_ID</strong>, <strong>CONTRACT_ROUTE_ID</strong>, <strong>SCHEDULED_PICKUP_AT</strong> y <strong>STATUS</strong>.<br>El trigger <strong>VALIDATE_ORDER_ASSIGNMENT</strong> valida capacidad, refrigeracion, tarifa y distancia.</td>
    </tr>
  </tbody>
</table>

## ENCARGADO DE PATIO

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Endpoint</th>
      <th>Request (Query / Body)</th>
      <th>Response</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>GET</td>
      <td>/api/operations/cargas</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_encargado_patio&gt;"
  },
  "query": {
    "status": "ASIGNADA",
    "plateNumber": "HT44343",
    "startDate": "2026-04-01"
  }
}</pre></td>
      <td><pre>{
  "message": "Cargas obtenidas",
  "data": [
    {
      "id": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
      "codigo": "ORD-000085",
      "unitId": "fbf1d967-9cde-4a10-b728-0e9493190a14",
      "vehicleModel": "Hino 500 2021",
      "plateNumber": "HT44343",
      "origen": "Planta 3",
      "destino": "Bodega Central",
      "estado": "PENDIENTE"
    }
  ]
}</pre></td>
      <td>Mapeo principal:<br><strong>ORDER_ID</strong>, <strong>ORDER_NUMBER</strong>, <strong>STATUS</strong> salen de <strong>ORDERS</strong>.<br><strong>PLATE_NUMBER</strong> sale de <strong>TRANSPORT_UNITS</strong>.<br><strong>FULL_NAME</strong> sale de <strong>USERS</strong>.<br><strong>ORIGIN</strong> y <strong>DESTINATION</strong> salen de <strong>ORDERS</strong> o de la ruta asociada.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/operations/cargas/{ORDER_ID}/formalizar</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_encargado_patio&gt;"
  },
  "body": {
    "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
    "loadedWeightTon": 10.2,
    "stowageConfirmed": true
  }
}</pre></td>
      <td><pre>{
  "message": "Carga formalizada correctamente",
  "data": {
    "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
    "orderNumber": "ORD-000085",
    "status": "LISTA_PARA_DESPACHO"
  }
}</pre></td>
      <td>Hace UPDATE sobre <strong>ORDERS</strong> colocando <strong>LOADED_WEIGHT_TON</strong>, <strong>STOWAGE_CONFIRMED</strong> y <strong>STATUS</strong>.<br>El trigger de orden puede rechazar el cambio si el peso excede la capacidad de la unidad asignada.</td>
    </tr>
  </tbody>
</table>

## PORTAL DE PILOTOS

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Endpoint</th>
      <th>Request (Query / Body)</th>
      <th>Response</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>GET</td>
      <td>/api/pilot/orders</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_piloto&gt;"
  },
  "query": {
    "status": "LISTA_PARA_DESPACHO"
  }
}</pre></td>
      <td><pre>{
  "message": "Viajes obtenidos correctamente",
  "data": [
    {
      "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
      "orderNumber": "ORD-000085",
      "origin": "Ciudad de Guatemala",
      "destination": "San Salvador",
      "cargoDescription": "Producto refrigerado",
      "declaredWeightTon": 10.5,
      "status": "LISTA_PARA_DESPACHO"
    }
  ]
}</pre></td>
      <td>Consulta <strong>ORDERS</strong> por <strong>UNIT_ID</strong> de la unidad asociada al piloto autenticado en <strong>TRANSPORT_UNITS.PILOT_USER_ID</strong>.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/pilot/orders/{ORDER_ID}/status</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_piloto&gt;"
  },
  "body": {
    "status": "EN_TRANSITO"
  }
}</pre></td>
      <td><pre>{
  "message": "Estado actualizado correctamente",
  "data": {
    "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
    "status": "EN_TRANSITO",
    "dispatchedAt": "2026-04-01T14:05:00Z"
  }
}</pre></td>
      <td>Actualiza <strong>ORDERS.STATUS</strong> a <strong>EN_TRANSITO</strong> y registra <strong>DISPATCHED_AT</strong>.<br>Normalmente debe validar que la orden ya este en <strong>LISTA_PARA_DESPACHO</strong>.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/pilot/orders/{ORDER_ID}/logs</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_piloto&gt;"
  },
  "body": {
    "eventType": "PUNTO_CONTROL",
    "description": "Paso por control km 85 sin novedad"
  }
}</pre></td>
      <td><pre>{
  "message": "Evento registrado correctamente",
  "data": {
    "logId": "b2c2e3d7-3d97-4d07-8251-b262c03d0562",
    "eventTime": "2026-04-01T18:15:00Z"
  }
}</pre></td>
      <td>Inserta en <strong>ORDER_ROUTE_LOGS</strong> con <strong>ORDER_ID</strong>, <strong>EVENT_TYPE</strong> y <strong>DESCRIPTION</strong>.<br>Este historial luego alimenta el tracking del cliente.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/pilot/orders/{ORDER_ID}/deliver</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_piloto&gt;"
  },
  "body": {
    "receiverName": "Carlos Estrada",
    "receiverSignatureBase64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "deliveryEvidenceBase64": [
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
    ]
  }
}</pre></td>
      <td><pre>{
  "message": "Entrega registrada correctamente",
  "data": {
    "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
    "status": "ENTREGADA",
    "deliveredAt": "2026-04-01T22:10:00Z",
    "receiverSignaturePath": "/files/signatures/ORD-000085.png",
    "deliveryEvidencePaths": ["/files/evidence/ORD-000085-1.jpg"]
  }
}</pre></td>
      <td>Actualiza <strong>ORDERS.STATUS</strong> a <strong>ENTREGADA</strong> y guarda <strong>RECEIVER_NAME</strong>, <strong>DELIVERED_AT</strong> y la evidencia derivada del contenido Base64.<br>El backend genera <strong>RECEIVER_SIGNATURE_PATH</strong> y <strong>DELIVERY_EVIDENCE_PATH</strong> para persistencia.<br>La transicion dispara <strong>TRG_AUTO_CREATE_DRAFT_INVOICE</strong>, que inserta una factura <strong>BORRADOR</strong> lista para revision financiera.</td>
    </tr>
  </tbody>
</table>

## AGENTE FINANCIERO

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Endpoint</th>
      <th>Request (Query / Body)</th>
      <th>Response</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>GET</td>
      <td>/api/finance/dashboard/summary</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_finanzas&gt;"
  },
  "query": {
    "period": "MONTHLY",
    "year": 2026,
    "month": 4
  }
}</pre></td>
      <td><pre>{
  "message": "Resumen financiero obtenido correctamente",
  "data": {
    "draftInvoicesPendingReview": 4,
    "paymentsPendingReconciliation": 3,
    "collectedAmount": 23520.0
  }
}</pre></td>
      <td>Combina agregaciones sobre <strong>ORDERS</strong>, <strong>INVOICES</strong> y <strong>PAYMENTS</strong>.<br><strong>draftInvoicesPendingReview</strong> sale de facturas <strong>BORRADOR</strong> generadas automaticamente al entregar la orden.<br><strong>collectedAmount</strong> resume los pagos aprobados del periodo consultado.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/finance/invoices</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_finanzas&gt;"
  },
  "query": {
    "status": "BORRADOR"
  }
}</pre></td>
      <td><pre>{
  "message": "Facturas borrador obtenidas correctamente",
  "data": [
    {
      "invoiceId": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
      "invoiceNumber": "FAC-000031",
      "orderNumber": "ORD-000085",
      "clientName": "Comercializadora Maya, S.A.",
      "status": "BORRADOR",
      "totalAmount": 23520.0,
      "deliveredAt": "2026-04-01T22:10:00Z"
    }
  ]
}</pre></td>
      <td>Consulta <strong>INVOICES</strong> filtrando por <strong>STATUS = BORRADOR</strong> y <strong>SERVICE_DESCRIPTION = ''</strong>.<br>Esta es la bandeja principal de Finanzas donde se revisan los borradores recién generados que aún no tienen detalle de cobro.</td>
    </tr>
      <tr>
        <td>GET</td>
        <td>/api/finance/invoices/{INVOICE_ID}</td>
        <td><pre>{
    "headers": {
      "Authorization": "Bearer &lt;jwt_finanzas&gt;"
    }
  }</pre></td>
        <td><pre>{
    "message": "Factura borrador obtenida correctamente",
    "data": {
      "invoiceId": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
      "invoiceNumber": "FAC-000031",
      "orderId": "87086e66-cb0c-45b1-b70f-d5b74c915d45",
      "clientId": "fe3fc5a5-7f42-48cf-963b-ea854aa0e2ff",
      "serviceDescription": "Servicio logistico de exportacion",
      "totalAmount": 23520.0,
      "dueDate": "2026-05-01"
    }
  }</pre></td>
        <td>Devuelve el borrador ya insertado en <strong>INVOICES</strong> con datos precargados desde <strong>ORDERS</strong>, <strong>CONTRACTS</strong> y <strong>CLIENTS</strong>.</td>
      </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/finance/invoices/{INVOICE_ID}/submit-for-certification</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_finanzas&gt;"
  },
  "body": {
    "serviceDescription": "Servicio logistico de exportacion",
    "dueDate": "2026-05-01",
    "reviewConfirmed": true
  }
}</pre></td>
      <td><pre>{
  "message": "Factura borrador enviada a certificacion correctamente",
  "data": {
    "invoiceId": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
    "invoiceNumber": "FAC-000031",
    "status": "BORRADOR",
    "nextStep": "PATCH /api/certifier/invoices/{INVOICE_ID}/certify"
  }
}</pre></td>
      <td>No crea una nueva factura.<br>Confirma la revision financiera del borrador autogenerado, actualiza la descripción y fecha de vencimiento, y lo deja listo para que FEL lo procese (se vuelve visible para el certificador).</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/finance/invoices/{INVOICE_ID}/send</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_finanzas&gt;"
  },
  "body": {
    "serviceDescription": "Servicio logistico de exportacion",
    "pdfPath": "/files/invoices/FAC-000031.pdf"
  }
}</pre></td>
      <td><pre>{
  "message": "Factura enviada correctamente",
  "data": {
    "invoiceId": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
    "status": "ENVIADA",
    "sentAt": "2026-04-02T09:00:00Z"
  }
}</pre></td>
      <td>No conviene unificarlo con la creacion de factura.<br>Este paso actualiza <strong>INVOICES.STATUS</strong>, <strong>PDF_PATH</strong> y <strong>SENT_AT</strong> una vez que la factura ya esta certificada.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/finance/invoices</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_finanzas&gt;"
  },
  "query": {
    "status": "CERTIFICADA"
  }
}</pre></td>
      <td><pre>{
  "message": "Facturas certificadas obtenidas correctamente",
  "data": [
    {
      "invoiceId": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
      "invoiceNumber": "FAC-000031",
      "clientName": "Comercializadora Maya, S.A.",
      "felUuid": "3C7D8A4E-3D23-4ED8-B410-ABC123456789",
      "status": "CERTIFICADA"
    }
  ]
}</pre></td>
      <td>Consulta <strong>INVOICES</strong> filtrando facturas <strong>CERTIFICADA</strong> y no enviadas.<br>Esta es la bandeja post-FEL desde donde Finanzas despacha el comprobante al cliente.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/finance/payments</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_finanzas&gt;"
  },
  "query": {
    "status": "PENDIENTE"
  }
}</pre></td>
      <td><pre>{
  "message": "Pagos obtenidos correctamente",
  "data": [
    {
      "paymentId": "ec08b307-09bb-4f5c-98d6-c6a4fa32bcb3",
      "invoiceNumber": "FAC-000031",
      "method": "TRANSFERENCIA",
      "bankReference": "TRX-882771",
      "amount": 23520.0,
      "status": "PENDIENTE"
    }
  ]
}</pre></td>
      <td>Consulta <strong>PAYMENTS</strong> con JOIN a <strong>INVOICES</strong>.<br>Sirve para la conciliacion financiera.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/finance/payments/{PAYMENT_ID}/approve</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_finanzas&gt;"
  },
  "body": {
    "status": "APROBADO"
  }
}</pre></td>
      <td><pre>{
  "message": "Pago aprobado correctamente",
  "data": {
    "paymentId": "ec08b307-09bb-4f5c-98d6-c6a4fa32bcb3",
    "status": "APROBADO",
    "invoiceStatus": "PAGADA"
  }
}</pre></td>
  <td>Actualiza <strong>PAYMENTS.STATUS</strong> y <strong>REVIEWED_BY_USER_ID</strong> durante la conciliacion de tesoreria posterior al envio y certificacion FEL.<br>El trigger <strong>SYNC_INVOICE_PAYMENT</strong> actualiza la factura a <strong>PAGADA</strong>.<br>La regla de pago aprobado unico por factura ya esta cubierta por indice y trigger.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/finance/rates</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_finanzas&gt;"
  }
}</pre></td>
      <td><pre>{
  "message": "Tarifas obtenidas correctamente",
  "data": [
    {
      "vehicleTypeId": 2,
      "typeName": "CAMION PESADO",
      "ratePerKm": 12.5
    }
  ]
}</pre></td>
      <td>Consulta <strong>VEHICLE_TYPES</strong> para cargar el tarifario base visible en la vista de configuracion.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/finance/rates/{VEHICLE_TYPE_ID}</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_finanzas&gt;"
  },
  "body": {
    "ratePerKm": 13.25
  }
}</pre></td>
      <td><pre>{
  "message": "Tarifa actualizada correctamente",
  "data": {
    "vehicleTypeId": 2,
    "ratePerKm": 13.25
  }
}</pre></td>
      <td>Actualiza <strong>VEHICLE_TYPES.RATE_PER_KM</strong>.<br>Afecta contratos y ordenes futuras; no debe recalcular retroactivamente documentos historicos.</td>
    </tr>
  </tbody>
</table>

## CERTIFICADOR FEL

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Endpoint</th>
      <th>Request (Query / Body)</th>
      <th>Response</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>GET</td>
      <td>/api/certifier/dashboard/summary</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_certificador&gt;"
  },
  "query": {
    "period": "MONTHLY",
    "year": 2026,
    "month": 4
  }
}</pre></td>
      <td><pre>{
  "message": "Resumen FEL obtenido correctamente",
  "data": {
    "pendingInvoices": 3,
    "certifiedCount": 7
  }
}</pre></td>
      <td>Hace agregaciones sobre <strong>INVOICES</strong>.<br><strong>pendingInvoices</strong> sale de facturas en <strong>BORRADOR</strong>.<br><strong>certifiedCount</strong> usa <strong>CERTIFIED_AT</strong> para el periodo solicitado.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/certifier/invoices</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_certificador&gt;"
  },
  "query": {
    "status": "BORRADOR"
  }
}</pre></td>
      <td><pre>{
  "message": "Facturas obtenidas correctamente",
  "data": [
    {
      "invoiceId": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
      "invoiceNumber": "FAC-000031",
      "clientName": "Comercializadora Maya, S.A.",
      "clientNit": "1234567-8",
      "totalAmount": 23520.0,
      "status": "BORRADOR"
    }
  ]
}</pre></td>
      <td>Consulta <strong>INVOICES</strong> en estado <strong>BORRADOR</strong> que ya tienen <strong>SERVICE_DESCRIPTION</strong> (procesadas por Finanzas).<br>Esta es la bandeja operativa del certificador.</td>
    </tr>
    <tr>
      <td>POST</td>
      <td>/api/certifier/invoices/{INVOICE_ID}/validate-nit</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_certificador&gt;"
  },
  "body": {
    "clientNit": "1234567890123"
  }
}</pre></td>
      <td><pre>{
  "message": "NIT validado correctamente",
  "data": {
    "invoiceId": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
    "clientNit": "1234567890123",
    "isValid": true
  }
}</pre></td>
      <td>Simula la validación del NIT previo a la certificación FEL.<br>En el MVP se usa para cumplir la regla funcional de verificar la identidad fiscal antes de emitir el UUID.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/certifier/invoices/{INVOICE_ID}/certify</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_certificador&gt;"
  },
  "body": {
    "felUuid": "3C7D8A4E-3D23-4ED8-B410-ABC123456789",
    "clientNit": "1234567890123"
  }
}</pre></td>
      <td><pre>{
  "message": "Factura certificada correctamente",
  "data": {
    "invoiceId": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
    "status": "CERTIFICADA",
    "felUuid": "3C7D8A4E-3D23-4ED8-B410-ABC123456789",
    "certifiedAt": "2026-04-02T08:40:00Z"
  }
}</pre></td>
      <td>Actualiza <strong>INVOICES.STATUS</strong> a <strong>CERTIFICADA</strong>, guarda <strong>FEL_UUID</strong> y <strong>CERTIFIED_AT</strong>.<br>Requiere <strong>clientNit</strong> valido y coincidente con la factura para poder certificar.<br>Es la base para el KPI del panel FEL.</td>
    </tr>
    <tr>
      <td>PATCH</td>
      <td>/api/certifier/invoices/{INVOICE_ID}/reject</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_certificador&gt;"
  },
  "body": {
    "reason": "NIT invalido para emision FEL"
  }
}</pre></td>
      <td><pre>{
  "message": "Factura rechazada correctamente",
  "data": {
    "invoiceId": "965b0a6f-35c4-430d-bf87-4fbd1ff2b6c6",
    "status": "RECHAZADA"
  }
}</pre></td>
      <td>Actualiza <strong>INVOICES.STATUS</strong> a <strong>RECHAZADA</strong>.<br>El motivo puede guardarse en bitacora externa o en una extension posterior del modelo.</td>
    </tr>
  </tbody>
</table>

## BI / GERENCIA

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Endpoint</th>
      <th>Request (Query / Body)</th>
      <th>Response</th>
      <th>Observaciones</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>GET</td>
      <td>/api/bi/kpis</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_gerencia&gt;"
  },
  "query": {
    "period": "MONTHLY",
    "year": 2026,
    "month": 4
  }
}</pre></td>
      <td><pre>{
  "message": "KPIs obtenidos correctamente",
  "data": {
    "completedServices": 142,
    "billingAmount": 145000.0,
    "activeIncidents": 2
  }
}</pre></td>
      <td>Hace agregaciones por periodo sobre <strong>ORDERS</strong>, <strong>INVOICES</strong> y <strong>PAYMENTS</strong>.<br>Los incidentes activos pueden salir de <strong>ORDER_ROUTE_LOGS</strong> con eventos de tipo <strong>INCIDENTE</strong>.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/bi/branches/distribution</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_gerencia&gt;"
  },
  "query": {
    "period": "MONTHLY",
    "year": 2026,
    "month": 4
  }
}</pre></td>
      <td><pre>{
  "message": "Distribucion por sedes obtenida correctamente",
  "data": [
    {
      "branchId": 1,
      "branchName": "SEDE GUATEMALA",
      "totalOrders": 12
    },
    {
      "branchId": 2,
      "branchName": "SEDE QUETZALTENANGO",
      "totalOrders": 6
    }
  ]
}</pre></td>
      <td>Se alimenta de agregaciones por periodo y de <strong>BRANCHES</strong> para comparativos por sede.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/bi/profitability</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_gerencia&gt;"
  },
  "query": {
    "contractId": "a73b5271-6cb9-4c91-bd67-3794c5eb5a7b"
  }
}</pre></td>
      <td><pre>{
  "message": "Rentabilidad obtenida correctamente",
  "data": {
    "contractId": "a73b5271-6cb9-4c91-bd67-3794c5eb5a7b",
    "revenueAmount": 225000.0,
    "operatingCostAmount": 143500.0,
    "grossMarginAmount": 81500.0
  }
}</pre></td>
      <td>Se apoya en <strong>V_CONTRACT_PROFITABILITY</strong>.<br>Usa ingresos facturados y costos operativos de ordenes para calcular margen bruto.</td>
    </tr>
    <tr>
      <td>GET</td>
      <td>/api/bi/orders/recent</td>
      <td><pre>{
  "headers": {
    "Authorization": "Bearer &lt;jwt_gerencia&gt;"
  },
  "query": {
    "limit": 10
  }
}</pre></td>
      <td><pre>{
  "message": "Ordenes recientes obtenidas correctamente",
  "data": [
    {
      "orderNumber": "ORD-000085",
      "clientName": "Comercializadora Maya, S.A.",
      "route": "CIUDAD DE GUATEMALA -> SAN SALVADOR",
      "status": "EN_TRANSITO"
    }
  ]
}</pre></td>
      <td>Hace JOIN entre <strong>ORDERS</strong>, <strong>CONTRACTS</strong> y <strong>CLIENTS</strong>.<br>Es una consulta de monitoreo; no modifica datos.</td>
    </tr>
  </tbody>
</table>
