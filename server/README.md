# Proyecto LogiTrans - Backend Server

Sistema backend para la gestión logística (LogiTrans), construido utilizando **NestJS**, **TypeORM**, y **PostgreSQL** aplicando el patrón de diseño **Clean Architecture**.

## Requisitos Previos

- [Docker](https://www.docker.com/products/docker-desktop/) y docker-compose instalados en la máquina.
- Node.js (opcional, para desarrollo local sin docker).

## Arrancar la aplicación desde CERO utilizando Docker

El proyecto viene con un archivo `docker-compose.yml` que levanta tanto la base de datos PostgreSQL como la API de NestJS. 

### Paso 1: Levantar Servicios
Abre una terminal en la raíz de este proyecto (donde se encuentra el archivo `docker-compose.yml`) y ejecuta:
```bash
docker-compose up -d --build
```
Esto levantará dos contenedores:
1. `logitrans_db`: La base de datos en PostgreSQL expuesta en el puerto 5432.
2. `logitrans_api`: La API en NestJS expuesta en el puerto 3000.

> **Nota:** La API está configurada para correr automáticamente todas las migraciones publicadas y ejecutar los scripts de seeding al iniciar en caso de ser necesario.

### Paso 2: Arrancar localmente con bootstrap automatico (Si corres Node localmente)

Si prefieres trabajar localmente sin la imagen de Node conectándote a la base de Docker:
```bash
# Instalar dependencias
npm install

# Inicias únicamente la base de datos
docker-compose up -d db

# Correr en modo desarrollo
npm run start:dev
```

Al iniciar, el backend ahora hace este flujo automaticamente:
- crea la base `logitrans_db` si no existe
- aplica el SQL canonico de `../db/logitrans_postgresql.sql`
- inserta un seed amplio e idempotente para clientes, contratos, sesiones, ordenes, facturas y pagos

Si ya existe una base vieja creada con el esquema incorrecto, puedes recrearla una vez con:
```bash
DB_RESET_ON_BOOT=true npm run start:dev
```

### Paso 3: Probar los Datos Seed

Actualmente el sistema deja una base poblada con datos coherentes del MVP:
- catalogos base y rutas nacionales/internacionales
- clientes con perfiles de riesgo, contactos y tarjetas
- usuarios internos por rol y usuarios portal cliente
- contratos, rutas y tarifas derivadas
- unidades de transporte y pilotos asignados
- ordenes en estados mixtos, bitacoras, facturas y pagos

Para verificar que el backend funciona, puedes llamar al endpoint de pruebas de creación de usuarios (Clean architecture Use-Case).

```bash
curl -X POST http://localhost:3000/users \
-H "Content-Type: application/json" \
-d '{
  "fullName": "Juan Perez",
  "email": "juan.perez@example.com",
  "passwordHash": "hash123",
  "role": "AGENTE_OPERATIVO"
}'
```

---

## Estructura del Proyecto (Clean Architecture)

- **`src/domain`**: Entidades core del negocio, Enums (`RiskLevel`, `UserRole`, etc.) e Interfaces Repository abstractas (`IUserRepository`). No depende de ningún framework (ej. TypeORM).
- **`src/application`**: Casos de uso (`CreateUserUseCase`), DTOs y lógica de orquestación. Interactúa con las interfaces del dominio.
- **`src/infrastructure/database`**: Implementaciones técnicas. TypeORM Entidades (`client.entity.ts`, etc.), Repositorios que implementan interfaces del dominio, Configuración y Migraciones.
- **`src/presentation`**: Controladores de NestJS expuestos como una API REST.
