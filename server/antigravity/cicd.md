# Despliegue

## Cloud Services
- Docker HUB
- Supabase: como servicio cloud serverless para manejo de la base de datos
- 


## Uso de CI/CD
Para lograr un despliegue eficiente y escalable del proyecto, se implementará un proceso de Integración Continua/Despliegue Continuo (CI/CD). Este proceso asegura que cada cambio en el código sea integrado, probado, y desplegado de manera automatizada, reduciendo errores humanos y acelerando la entrega de nuevas versiones del software. A continuación, se describen los tres pipelines clave que se utilizarán en este proceso:

- Build: En esta etapa, el código fuente se compila y se generan los artefactos necesarios para el despliegue, asegurando que el código sea válido y esté listo para ser probado.
- Test: Durante esta fase, se ejecutan pruebas automatizadas para validar la funcionalidad del código. Esto incluye pruebas unitarias y de integración, para garantizar la calidad del software.
*No se debe hacer deploy si las pruebas no pasan*
- Deploy: En esta etapa final, el código que ha pasado las pruebas es desplegado en los entornos de producción o de pruebas. Este paso puede incluir el despliegue a servidores, contenedores, o servicios en la nube, garantizando que la aplicación esté disponible para los usuarios finales.


## Docker 

Permite crear, desplegar y gestionar aplicaciones en contenedores, los cuales son entornos de ejecución aislados que incluyen todo lo necesario para que una aplicación funcione: el código, las bibliotecas, las dependencias, y el sistema operativo base. A diferencia de las máquinas virtuales, los contenedores son más livianos y se inician mucho más rápido, ya que comparten el núcleo del sistema operativo subyacente.
Docker es fundamental en una arquitectura de software, ya que permite crear contenedores que garantizan la consistencia de las aplicaciones en diferentes entornos, eliminando problemas de compatibilidad y simplificando tanto el desarrollo como el despliegue. Al encapsular todas las dependencias necesarias, Docker asegura que las aplicaciones funcionen de manera idéntica en desarrollo, pruebas y producción, y proporciona portabilidad al permitir que los contenedores se ejecuten en cualquier sistema con Docker. Además, facilita la escalabilidad y la gestión eficiente de recursos al permitir la ejecución de múltiples contenedores en un solo servidor, optimizando así el uso de recursos y mejorando la capacidad de respuesta ante la demanda.

Para esta fase se le solicita al estudiante que utilice Docker tanto en el Backend como en el Frontend. Debe incluirse en el proceso de CI/CD.