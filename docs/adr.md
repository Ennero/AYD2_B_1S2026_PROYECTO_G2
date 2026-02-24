# Justificación de Decisiones Arquitectónicas

El es porceso documentado que explica el _porque_ detrás de una elección de diseño, considerando restricciones, requisitos técnicos (non-functional requirements) y las alternativas evaluadas.

## Decisión Arquitectónica 1: Estilo Arquitectónico Principal y Estrategia de Despliegue

- **Título:** Implementación de Arquitectura de Monolíto Modular Contenerizado (Docker).

- **Contexto:** LogiTrans requiere una plataforma que soporte sus operaciones actuales y una expasión del 200% en volumen transaccional regional. Sin Embargo, el equipo de desarrollo cuenta con un plazo estricto de 4 semanas, y la Gerencia General exige reutilizar los servidores físicos locales, aunque preparando el terreno para una futura migración a la nube.

- **Decisión:** Se adopta un patrón de diseño de **Monolíto Modular** encapsulado en **contenedores Docker**, descartando una arquitectura pura de Microservicios.

- **Justificación:**
  - **Atiende a RES-03 (Tiempo de Entrega) y RES-04 (Tecnología Madura):** Una arquitectura orientada a miscroservicios requiere una configuración compleja de red, descubrimiento de servicios y gestión de bases de datos distribuidas que es inviable completar en 4 semanas. El molito modular utiliza tecnologías maduras que garantizan la entrega a tiempo.

  - **Atiende a EAC-04 (Modificabilidad):** Aunque es un único entregable (monolito), el código se estructurará en módulos lógicos estrictamente separados (Ej. Gestión Comercial, Operaciones, Facturación). Esto permite que, en el futuro, el módulo de Aduanas se agregue sin alterar el "core" logísitico.

  - **Atiende a RES-01 (Infraestructura Local), RES-02 (Cloud-Ready) y EAC-06 (Portabilidad):** Al contenerizar la aplicación con Docker, la solución puede ejectuarse de inmediate en los servidores _on-premise_ actuales. Al mismo tiempo, el uso de contenedores garantiza que el salto a la nube está transparente, cumpliendo la portabilidad exigida con un esfuerzo menor a una semana.

- **Consecuencias (Trade-offs):**
  - _Positivo:_ Despliegue rápido, menor costo inicial de infraestructura y cumplimiento total del cronograma.
  - _Negativo:_ Si un módulo experimenta un fallo de memoria crítico (Memory Leak), podría afectar temporalmente a los demás módulos al compartir el mismo entorno de ejecución base.

## Decisión Arquitectónica 2: Sistema de Gestión de Base de Datos (Persistencia)

- **Título:** Selección de Motor de Base de Datos Realacional (RDBMS) PostgreSQL.

- **Contexto:** El sistema manejará información crítica como tarifas, contratos legales, bitácoras de seguridad inalterables y, sobre todo, integraciones obligatorias de Facturación electrónica (FEL) exigida por la SAT.

- **Decisión:** Se utilizará un motor de base de datos **Relacional (RDBMS)**, específicamente **PostgreSQL**,configurado con replicación activo-pasivo o respaldos transaccionales continuos, descratando soluciones NoSQL (MongoDB, Cassandra) o bases de datos en memoria (Redis).

- **Justificación:**
  - **Atiende a EAC-03 (Seguridad y Auditabilidad) y RES-05 (Cumplimiento Legal FEL):** Las operaciones financieras y la facturación ante la SAT exigen cumplimiento estricto de las propiedades ACID (Atomicidad, Consistencia, Aislamiento, Durabilidad) para garantizar la integridad de los datos. Un modelo relacional garantiza que no haya "registros huérfanos" (ejemplo: un cobro sin un contrato asociado), asegurando la integridad de la bitácora de auditoria.

  - **Atiende a EAC-02 (Escalabilidad y Rendimiento):** Para soportar el crecimiento del 200% manteniendo respuestas menores a 3 segundos, los motores RDBMS modernos permiten particionamiento de tablas y creación de índices optimizados, los cuales son más que suficientes para el volumen de la industría logísitica sin tener que recurrir a bases de datos distribuidas complejas.

- **Consecuencias (Trade-offs):**
  - _Positivo:_ Integridad referencial absoluta, seguridad financiera y facilidad para generar reportes cruzados
  - _Negativo:_ El esquema de la base de datos es rígido. Cualquier cambio en la estructura de datos (ejemplo: agregar un nuevo campo a la tabla de contratos) requerirá una migración de base de datos, lo cual podría generar tiempos de inactividad si no se planifica adecuadamente.

## Decisión Arquitectónica 3: Estrategia de Alta Disponibilidad e Integración

- **Título:** Implementación de Balanceador de Carga Local y API Gateway RESTful.

- **Contexto:** Se requiere que el sistema soporte picos de tráfico de 3 sedes (Guatemala, Xela, Puerto Barrios), recupere su operatividad en menos de 10 minutos ante fallos y exponga datos de geolocalización a clientes externos de forma segura.

- **Decisión:** Se colocará un **Balanceador de Carga / Proxy Inverso** (ejemplo: NGINX) para distribuir la carga entre múltiples instancias del backend, y se expondra los servicios de integración mediante una **API Gateway RESTful** con autenticación basada en tokens JWT, descartando arquitecturas de eventos o colas de mensajes (ejemplo: Kafka) por su complejidad y tiempo de implementación.

- **Justificación:**
  - **Atiende a EAC-01 (Disponibilidad):** El balanceador de carga implementa _Health Checks_. Si el contenedor principal en el servidor físico cae (Estímulo de EAC-01), el balanceador redirigirá automáticamente el tráfico a un contenedor secundario (Failover) de forma instantánea, cumpliendo con creces el requisito de recuperación menor a 10 minutos.

  - **Atiende a EAC-05 (Interoperabilidad):** La API RESTful proprociona una interfaz estándar en la industria. Los ERPs de los clientes podrán consultar la geolocalización en tiempo real consumiendo estas interfaces sin acceder directamente a la base de datos de LogiTrans.

  - **Atiende a EAC-03 (Seguridad):** El uso de tokens JWT en el API Gateway asegura el control de acceso estricto basado en roles, garantizando que el ERP externo solo vea sus propias órdenes y no el tarifario interno.

- **Consecuencias (Trade-offs):**
  - _Positivo:_ Garantía el 99.5% de disponibilidad, resiliencia entre caídas y comunicación segura con terceros.
  - _Negativo:_ Añade un componente extra a la infraestructura (balanceador de carga) que debe ser configurado y mantenido por el equipo on-premise.

## Decisión Arquitectónica 4: Estrategia de Seguridad, Control de Acceso y Auditoría

- **Título:** Implementación de Control de Acceso Basado en Roles (RBAC) y Bitácora de Auditoría Centralizada.

- **Contexto:** El sistema maneja información sensible que es la "ventaja competitiva" de LogiTrans (Tarifarios Base y Contratos). Existe el riesgo de que personal interno (ejemplo: Pilotos o Encargados de Patio) o externos intenten acceder a estos datos. Además, se requiere un registro histórico de todas las acciones.

- **Decisión:** Se implementará un modelo de seguridad **RBAC (Role-Based Access Control)** gestionado a través de Middlewares en el backend, acoplado a un patrón de diseño de **Interceptores (o Decoradores)** que registrarán automáticamente cada transacción de modificación en una tabla de auditoría de solo lectura (Append-Only).

- **Justificación:**
  - **Atiende a EAC-03 (Seguridad y Auditabilidad):** El uso de RBAC garantiza matemáticamente que una petición al módulo financiero sea rechazada si el token del usuario no tiene el rol explicíto de "Agente Financiero" o "Gerencia". Por otro lado, el patrón de interceptores asegura que ningún desarrollador olvide programar el registro en la bitácora, ya que la arquitectura misma intercepta la petición y guarda el "quien, qué, cuándo" de forma automatizada e inalterable.

  - **Atiende a RNF-03:** Cumple el requisito no funcional de proteger los datos tarifarios de accesos no autorizados

- **Consecuencias (Trade-offs):**
  - _Positivo:_ Seguridad máxima, cumplimiento normativo y trazabilidad total para la gerencia.
  - _Negativo:_ Aumenta ligeramente el tiempo de procesamiento de cada petición (latencia), ya que el sistema debe validar los permisos y escribir en la base de datos de auditoría antes de ejectutar la acción principal.

## Decisión Arquitectónica 5: Gestión de Configuración y Control de Versiones

- **Título:** Adopción de la Metodología Git-Flow y CI/CD Básico.

- **Contexto:** El equipo de desarrollo tiene la restricción estricta de trabajar en un repositorio privado especifíco de GitHub bajo una nomenclatura establecida por la cátedra, además de tener solo 4 semanas para integrar todo el código sin romper la aplicación.

- **Decisión:** Se adopta de forma obligatoria la estrategia de ramificación **Git-flow** (ramas `main`, `develop`, `release` y `feature`), acompañada de protección de ramas mediante Pull Requests y revisiones de código (Code Reviews).

- **Justificación:**
  - **Atiende a RES-06 (Gestión de Configuración):** Cumple explícitamente con la restricción impuesta por los estándares del proyecto (Cátedra) sobre el uso del repositorio.
  - **Atiende a RES-03 (Tiempo de Entrega) y EAC-04 (Modificabilidad):** Al tener múltiples desarrolladores trabajando en módulo distintos (ejemplos: Comercial vs Facturación) en un plazo corto, Git-flow evita que el código de uno rompa el del otro. Las nuevas funcionalides se trabajan de forma aislada en ramas `feature`, y solo se integran a `develop` una vez que han pasado las pruebas y revisiones, garantizando la estabilidad del código base.

- **Consecuencias (Trade-offs):**
  - _Positivo:_ Orden Absoluto en el código, prevención de errores en producción y facilidad para auditar el trabajo individual de cada miembro del equipo (vital para la evaluación).
  - _Negativo:_ Requiere disciplina estricta en el equipo para seguir la metodología. Si un desarrollador olvida crear una rama `feature` y trabaja directamente en `develop`, podría generar conflictos o incluso romper la aplicación si no se detecta a tiempo.

## Decisión Arquitectónica 6: Protocolo de Comunicación Cliente-Servidor e Integración

- **Título:** Adopción del Protocolo HTTP2 para Counicaciones y Exposición de APIs.

- **Contexto:** El sistema debe mantener tiempos de respuesta menores a 3 segundos incluso cuando el volumen transaccional aumente un 200% debido a la expansión regional. Además debe exponer APIs para intercambiar datos de geolocalización en tiempo real con los ERPs de los clientes.

- **Decisión:** Se establece el uso obligatorio del protocolo **HTTP2 (sobre TLS)** para toda la comunicación entre el frontend (navegadores) y el backend, así como para la capa de interoperabilidad con terceros, reemplazando el tradicional HTTP/1.1.

- **Justificación:**
  - **Atiende a EAC-02 (Escalabilidad y Rendimiento):** HTTP/2 introduce la "multiplexación" (enviar múltiples peticiones simultáneas por una sola conexión TCP) y la compresión de cabeceras (HPACK). Esto elimina el cuello de botella tecnológico de HTTP/1.1, reduciendo drásticamente la latencia de red y garantizando que el sistema responda en menos de 3 segundos, incluso con cargar concurrentes masivas de 3 sedes.

  - **Atiende a EAC-05 (Interoperabilidad):** Los ERPs modernos consumirán la API de LogiTrans de forma muchos más eficiente al mantener una conexión viva y rápida mediante HTTP/2, ideal para la transmisión de estados de órdenes en tiempo real.

  - **Atiende a EAC-03 (Seguridad):** La implementación práctica de HTTP/2 exige obligatoriamente cifrado (HTTPS/LTS), blindado las comunicaciones contra interceptaciones de intermediarios (ataques Man-in-the-Middle).

- **Consecuencias (Trade-offs):**
  - _Positivo:_ Reducción del tiempo de carga, optimización del ancho de banda y cifrado de extremo a extremo garantizado.

  - _Negativo:_ Requiere configurar certicados SSL/TLS en el servidor local (on-premise) desde el día uno y configurar el Balanceador de Carga (NGINX) para manejar y terminar conexiones HTTP/2, lo que añade complejidad a la infraestructura inicial.

## Decisión Arquitectónica 7: Estrategia de Gestión de Identidad y Sesiones

- **Título:** Implementación de Caducidad de Sesión Estrictra (Short-Lived Tokens) y Rotación.

- **Contexto:** El sistema gestiona datos altamente sensibles (tarifarios base, contratos, auditorías de la SAT) accesibles desde ubicaciones remotas (patios, fronteras, sedes departamentales). Un dispositivo dejado desbloqueado o una sesión interceptada representa un riesgo crítico de fuga de información y manipulación financiera.

- **Decisión:** Se implementará una arquitectura de autenticación Stateless utilizando **JSON Web Tokens (JWT)** de corta duración, acompañados de mecanismos de _Refresh Tokens_ almacenados de forma segura (HttpOnly Cookies).

- **Justificación:**
  - **Atiende a EAC-03 (Seguridad y Auditabilidad):** Al establecer un tiempo de expiración muy corto, se minimiza la "ventana de oportunidad" para un atacante. Si un token es robado de un navegador en la sede de Puerto Barrios, ese token será inutil en cuestión de minutos. El _Refresh Token_ asegura que el usuario legítimo no tenga que poner su contraseña a cada rato, pero permite al sistema invalidar el acceso instantáneamente si se detecta una anomalía.

  - **Atiende a RES-05 (Cumplimiento Legal - FEL):** Para garantizar que solo personal autorizado emita facturas certificadas por la SAT, la sesión debe validar continuamente la identidad del agente financiero, evitando que sesiones zombis ejecuten cobros.

  - **Atiende a RNF-03:** Refuerza el control de acceso estrictor protegiendo la ventaja comptetiva de la empresa.

- **Consecuencias (Trade-offs):**
  - _Positivo:_ Mitigación drástica de ataques de secuestro de sesión (Session Hijacking) y cumplimiento de estándares de seguridad corporativa.

  - _Negativo:_ Aumenta la complejidad del desarrollo en el Frontend (el cual debe programarse para solicitar un nuevo token de acceso silenciosamente antes de que expiere el actual) y genera una leve sobrecarga computacional en el servidor al tener que validar firmas criptográficas constantemente.
