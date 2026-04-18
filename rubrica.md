| DESCRIPCIÓN DE PONDERACIÓN | VALOR | OBSERVACIONES | PUNTEO |
|---|---|---|---|
| **ATRIBUTOS DE CALIDAD** | **20** | | |
| Escalabilidad | 8 | | |
| Mantenibilidad | 7 | | |
| Seguridad | 5 | | |
| **NUEVO ESTILO ARQUITECTÓNICO** | **10** | | |
| Elección del nuevo estilo arquitectónico | 2 | | |
| Diagrama de componentes | 2 | | |
| Diagrama de despliegue | 4 | | |
| Diagrama de distribución | 2 | | |
| **FUNCIONALIDADES** | **15** | | |
| *NOTA: Para optar a la calificación de esta sección se debe haber seleccionado el estilo arquitectónico correcto (EDA)* | | | |
| Notificación borrador de factura | 3 | | |
| Operación multimoneda | 3 | | |
| Validación de tipo de cambio | 3 | | |
| Gestión de espera de facturación | 3 | | |
| Actualización asíncrona de dashboards | 3 | | |
| **PRUEBAS** | **15** | | |
| Pruebas unitarias | 3 | | |
| Pruebas de integración | 3 | | |
| Pruebas E2E | 3 | | |
| Pruebas de carga (100, 1000, 2000, 5000, 10000 usuarios) | 3 | | |
| Pruebas de estrés (100, 15000, 2000, 200000 usuarios) | 3 | | |
| **CI/CD** | **10** | | |
| Stages correctos | 2 | | |
| Despliegue correcto | 4 | | |
| Vídeo publicado | 2 | | |
| Uso de nube | 2 | | |
| **DOCUMENTACIÓN** | **15** | | |
| Manual técnico | 3 | | |
| Manual de usuario | 2 | | |
| Reporte de pruebas | 5 | | |
| Mejoras a la solución propuesta en la fase 2 debidamente documentadas | 5 | | |
| **TOTAL** | **85** | | |









| Categoría | Escenario |
|---|---|
| Escalabilidad | **Fuente del estímulo:** Equipo de trabajo<br>**Estímulo:** Variaciones en los requerimientos actuales<br>**Artefacto:** Componentes del nuevo estilo arquitectónico integrados adecuadamente<br>**Entorno:** Pruebas funcionales<br>**Respuesta:** Notificaciones emitidas en tiempo real<br>**Medida de la respuesta:** Todos los documentos emitidos deben ser certificados cuando el servicio de facturación se encuentre disponible. |
| Mantenibilidad | **Fuente del estímulo:** Equipo de trabajo<br>**Estímulo:** Variaciones en los requerimientos actuales<br>**Artefacto:** Detección del cambio cuando se integra a la rama principal<br>**Entorno:** Ambiente configurado con las herramientas de CI/CD<br>**Respuesta:** Reacción al cambio integrado y ejecución del proceso CI/CD<br>**Medida de la respuesta:** Siempre que se integra un cambio a la rama principal se ejecuta el proceso de CI/CD |
| Seguridad | **Fuente del estímulo:** Roles definidos en el sistema (Cliente, agente operativo, agente financiero, etc.)<br>**Estímulo:** Ingreso al sistema con credenciales<br>**Artefacto:** Despliegue arquitectónico<br>**Entorno:** Ingreso con roles específicos durante la calificación<br>**Respuesta:** El sistema permite la visualización de pantallas y brinda acceso a las opciones permitidas para el rol autenticado<br>**Medida de la respuesta:** En todos los casos, las opciones mostradas al usuario autenticado deben ser únicamente las permitidas para su rol. |







| Pruebas de carga |
|---|
| Usuarios virtuales / min |
| 100 usuarios / 1 min |
| 1000 usuarios / 3 min |
| 2000 usuarios / 5 min |
| 5000 usuarios / 1 min |
| 10000 usuarios / 5 min |