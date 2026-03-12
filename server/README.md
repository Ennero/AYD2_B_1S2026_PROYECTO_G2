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

### Paso 2: Generar y Ejecutar la Migración Inicial manualmente (Si corres Node localmente)

Si prefieres trabajar localmente sin la imagen de Node conectándote a la base de Docker:
```bash
# Instalar dependencias
npm install

# Inicias únicamente la base de datos
docker-compose up -d db

# Ejecutar las migraciones pendientes en TypeORM para crear el esquema en la DB
npm run migration:run

# Insertar datos iniciales (Ramas, Tipos de vehículos, Tipos de Carga)
npm run seed

# Correr en modo desarrollo
npm run start:dev
```

### Paso 3: Probar los Datos Seed

Actualmente el sistema inserta los siguientes datos maestros iniciales de forma automática:
- **Sucursales**: Sede Central (GT-C), Sede Xela (GT-X)
- **Tipos de Vehículos**: Panel Cerrada, Camión Pequeño, Cabezal Articulado.
- **Tipos de Carga**: Carga General Seca, Perecederos/Frigoríficos, Material Peligroso.

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
