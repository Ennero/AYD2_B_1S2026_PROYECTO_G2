# Pruebas

1. Pruebas unitarias
Las pruebas unitarias se pueden definir simplemente como un procedimiento que se ejecuta para validar que cada unidad o componente individual de una aplicación funcione correctamente. Este tipo de pruebas confirman que cada módulo en aislamiento produce el resultado esperado dado un conjunto de entradas. Por ende, se verifican partes específicas del código sin interacción con dependencias externas. Tiene opciones a utilizar como Jest, Mocha o cualquier Framework que se adapte a su proyecto, para realizar pruebas unitarias y asegurar que cada función individual trabaje según lo esperado. Deberá implementar un mínimo de 5 pruebas para cubrir todos los escenarios posibles.

Technologies: Jest, Faker

1. Pruebas de integración
Las pruebas de integración se pueden definir simplemente como un procedimiento que se ejecuta para verificar la interacción entre diferentes módulos o componentes de una aplicación. Este tipo de pruebas confirman que los módulos integrados funcionan juntos como se espera, detectando posibles errores en las interfaces y flujos de datos entre ellos. Por ende, se valida la correcta comunicación y coordinación entre los componentes que se combinan para realizar funciones más complejas. Tiene opciones de herramientas como Jest, Mocha, pytest o cualquier otra herramienta para realizar pruebas de integración, asegurando que las distintas partes del sistema se integren de manera fluida y correcta. Deberá implementar un mínimo de 5 pruebas.

Technologies: Jest, SuperTest (Enables HTTP), Faker

3. Pruebas de carga
Las pruebas de carga se pueden definir como un procedimiento que se ejecuta para evaluar el comportamiento de una aplicación cuando se somete a una carga específica de usuarios, transacciones o peticiones simultáneas. Este tipo de pruebas confirman que el sistema mantiene un desempeño aceptable bajo condiciones esperadas de uso, verificando tiempos de respuesta, consumo de recursos y estabilidad general. Por ende, se evalúa la capacidad del software para operar de manera eficiente en escenarios que reflejan la demanda real de producción. Deberá implementar un mínimo de 5 pruebas de carga.

Technologies: [k6](https://k6.io/)

4. Pruebas de estrés
Las pruebas de estrés se pueden definir como un procedimiento que se ejecuta para evaluar el comportamiento de una aplicación cuando se somete a condiciones extremas de carga, superiores a las esperadas en su operación normal. Este tipo de pruebas confirman cómo responde el sistema ante picos inesperados de demanda, identificando puntos de falla, cuellos de
botella y límites de capacidad. Por ende, se evalúa la resiliencia del software, su capacidad de recuperación y la estabilidad posterior a situaciones de sobrecarga. Deberá implementar un mínimo de 5 pruebas de estrés.

Technologies: [k6](https://k6.io/)

5. Pruebas E2E
Las pruebas end-to-end (E2E) son un tipo de prueba que valida todo el flujo de un sistema de principio a fin, asegurando que todos los componentes, módulos y dependencias externas funcionan juntos como se espera en un entorno lo más cercano posible a producción.


Technologies: Playwright, Faker