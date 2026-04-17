# Reporte de Arreglos — Fase de Calificación LogiTrans

Este documento detalla los arreglos realizados para solventar las observaciones durante la fase de calificación del proyecto LogiTrans.

---

## 1. Gestión de Clientes: Corrección de Error en Pantalla

Se detectó un error en el frontend al intentar visualizar una pantalla específica dentro de la gestión de clientes (especialmente al listar o editar usuarios). Se procedió a:
- Identificar el componente que causaba el fallo de renderizado.
- Corregir la lógica de hidratación de datos y manejo de estados nulos.
- Validar que el listado de usuarios y la edición funcionen correctamente.

### Evidencia de Solución
> Espacio para pegar la captura de pantalla del listado de clientes/usuarios funcionando correctamente sin errores.

![Evidencia Gestión de Clientes](insertar_imagen_aqui.jpg)

---

## 2. Gestión de Contratos: Parametrización Individual

Anteriormente, las parametrizaciones de rutas y tarifas se manejaban de forma global, lo cual impedía que cada cliente tuviera condiciones específicas. Se realizaron los siguientes cambios:
- Se vinculó cada tarifa y ruta directamente al ID del contrato (`contract_id`).
- El formulario de **Formalizar Contrato** ahora permite definir tarifas paramétricas únicas para el contrato en curso.
- El sistema de facturación y órdenes ahora respeta estas tarifas individuales en lugar de las globales.

### Evidencia de Solución
> Espacio para pegar la captura de pantalla del formulario de formalización mostrando las tarifas individuales para un contrato específico.

![Evidencia Contrato Individual](insertar_imagen_aqui.jpg)

---

## 3. Dashboard de Gerente: Inclusión de Gráficos Faltantes

Se agregaron los gráficos y métricas que se encontraban ausentes en el dashboard ejecutivo, permitiendo una visión integral para el actor Gerencia:
- Gráfico de **Histórico de Facturación** normalizado a USD.
- Gráfico de **Distribución de Ingresos por Cliente**.
- Panel de **Alertas Críticas y Proyecciones** de rentabilidad.

### Evidencia de Solución
> Espacio para pegar la captura de pantalla del dashboard de gerencia con todos sus gráficos cargados.

![Evidencia Dashboard Gerente](insertar_imagen_aqui.jpg)


