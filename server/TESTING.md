# Guía de Pruebas Unitarias — LogiTrans Server

## ¿Qué es una prueba unitaria?

Una prueba unitaria verifica que **una sola función o clase hace exactamente lo que debe**, sin depender de la base de datos, internet ni ningún servicio externo. Se usan objetos falsos ("mocks") que simulan esas dependencias. Si una prueba falla, sabes exactamente dónde está el problema.

---

## Cómo ejecutar las pruebas

Todos los comandos se corren desde la carpeta `/server`:

```bash
# Ejecutar todas las pruebas unitarias
npm run test:unit

# Ejecutar solo un archivo específico
npm run test:unit -- <nombre-del-archivo>

# Ejemplos:
npm run test:unit -- login.use-case
npm run test:unit -- logout.use-case
npm run test:unit -- create-client.use-case

# Ejecutar en modo watch (re-corre al guardar cambios)
npm run test:unit:watch

# Ver reporte de cobertura de código
npm run test:unit:cov
```

---

## Archivos de prueba y qué validan

### Módulo Auth

#### `login.use-case.spec.ts`
Valida el inicio de sesión de usuarios.

| # | Prueba | Qué verifica |
|---|--------|--------------|
| 1 | Credenciales válidas | Retorna token JWT y sessionToken correctos |
| 2 | Usuario no encontrado | Lanza `UnauthorizedException` |
| 3 | Usuario inactivo | Lanza `UnauthorizedException` con el mismo mensaje que "no encontrado" (anti-enumeración) |
| 4 | Contraseña incorrecta | Lanza `UnauthorizedException` |
| 5 | Expiración de sesión | La sesión creada expira en ~30 días |
| 6 | Payload del JWT | El token firmado contiene `sub`, `email`, `role`, `fullName` y `sessionUuid` |

#### `logout.use-case.spec.ts`
Valida el cierre de sesión.

| # | Prueba | Qué verifica |
|---|--------|--------------|
| 1 | Cierre por sessionToken | Revoca la sesión correcta usando el token de sesión |
| 2 | Cierre por sessionUuid | Revoca la sesión usando el UUID cuando no hay token |
| 3 | Idempotencia | No lanza error si la sesión ya expiró o no existe |
| 4 | Prioridad de token | Usa `sessionToken` antes que `sessionUuid` cuando ambos están presentes |

#### `refresh-session.use-case.spec.ts`
Valida la renovación del JWT sin re-login.

| # | Prueba | Qué verifica |
|---|--------|--------------|
| 1 | Sesión válida | Retorna nuevo token y el mismo `sessionUuid` |
| 2 | Sesión inexistente | Lanza `UnauthorizedException` sin consultar al usuario |
| 3 | Usuario inactivo | Lanza `UnauthorizedException` |
| 4 | Usuario no existe | Lanza `UnauthorizedException` |
| 5 | Contador de uso | Llama a `incrementUsage` en cada refresh exitoso |
| 6 | Payload del JWT | El token renovado contiene todos los campos correctos |

#### `reset-password.use-case.spec.ts`
Valida el cambio de contraseña mediante link de recuperación.

| # | Prueba | Qué verifica |
|---|--------|--------------|
| 1 | Passwords no coinciden | Lanza `BadRequestException` antes de consultar la BD |
| 2 | Token vacío | Lanza `UnauthorizedException` |
| 3 | Token inválido/expirado | Lanza `UnauthorizedException` sin consultar al usuario |
| 4 | Usuario no existe | Lanza `UnauthorizedException` |
| 5 | Misma contraseña | Lanza `BadRequestException` si la nueva contraseña es igual a la actual |
| 6 | Flujo exitoso | Actualiza el hash y marca el token como usado |

#### `request-password-recovery.use-case.spec.ts`
Valida la solicitud de recuperación de contraseña por email.

| # | Prueba | Qué verifica |
|---|--------|--------------|
| 1 | Email no registrado | Retorna éxito igual (anti-enumeración: no revela si el email existe) |
| 2 | Usuario inactivo | Retorna éxito igual (anti-enumeración) |
| 3 | Usuario activo | Crea el registro de recuperación en BD |
| 4 | Hash del token | Guarda el hash SHA-256 del token, nunca el token en texto plano |
| 5 | Expiración | El registro expira exactamente en ~30 minutos |
| 6 | Respuesta fija | Siempre retorna `expiresInMinutes: 30` |

---

### Módulo Operations

#### `create-cargo-type.use-case.spec.ts`
Valida la creación de tipos de carga en el catálogo.

| # | Prueba | Qué verifica |
|---|--------|--------------|
| 1 | Normalización | El nombre se guarda en MAYÚSCULAS |
| 2 | Trim | Se eliminan espacios al inicio y fin del nombre |
| 3 | Duplicado | Lanza `ConflictException` si ya existe ese nombre |
| 4 | Duplicado case-insensitive | Detecta duplicados aunque el usuario escriba en minúsculas |
| 5 | Refrigeración | Persiste `requiresRefrigeration: true` correctamente |

#### `create-route.use-case.spec.ts`
Valida la creación de rutas de transporte.

| # | Prueba | Qué verifica |
|---|--------|--------------|
| 1 | Normalización | Código, origen y destino se guardan en MAYÚSCULAS |
| 2 | Trim | Se eliminan espacios del código de ruta |
| 3 | Duplicado | Lanza `ConflictException` si el código ya existe |
| 4 | Duplicado case-insensitive | Detecta duplicados con código en minúsculas |
| 5 | Campos numéricos | Persiste `distanceKm`, `estimatedHours` e `isInternational` correctamente |

#### `create-client.use-case.spec.ts`
Valida la creación de clientes empresa junto con su usuario de portal.

| # | Prueba | Qué verifica |
|---|--------|--------------|
| 1 | NIT muy corto | Lanza `BadRequestException` si el NIT tiene menos de 8 dígitos |
| 2 | NIT muy largo | Lanza `BadRequestException` si el NIT tiene más de 13 dígitos |
| 3 | NIT con letras | Lanza `BadRequestException` si el NIT contiene caracteres no numéricos |
| 4 | Contraseña corta | Lanza `BadRequestException` si tiene menos de 12 caracteres |
| 5 | NIT duplicado | Lanza `BadRequestException` si ya existe un cliente con ese NIT |
| 6 | Email duplicado | Lanza `BadRequestException` si ya existe un usuario con ese email |
| 7 | Creación exitosa | Retorna `clientId`, `clientCode`, `nit` y `portalUserEmail` |
| 8 | Normalización email | El email del portal se guarda en minúsculas |
| 9 | Defaults regionales | Sin especificar país: usa `GT` (Guatemala) y `GTQ` con tasa 12% |

---

## Estructura de las pruebas

Todas las pruebas siguen el mismo patrón:

```
describe('NombreDelCasoDeUso', () => {
  // 1. Crear mocks (objetos falsos que simulan la BD)
  // 2. Configurar el módulo de NestJS con los mocks
  
  it('descripción del escenario', async () => {
    // Arrange — preparar datos y configurar mocks
    // Act     — ejecutar el caso de uso
    // Assert  — verificar el resultado con expect()
  });
});
```

---

## Resumen

| Archivo | Pruebas |
|---------|---------|
| `login.use-case.spec.ts` | 6 |
| `logout.use-case.spec.ts` | 4 |
| `refresh-session.use-case.spec.ts` | 6 |
| `reset-password.use-case.spec.ts` | 6 |
| `request-password-recovery.use-case.spec.ts` | 6 |
| `create-cargo-type.use-case.spec.ts` | 5 |
| `create-route.use-case.spec.ts` | 5 |
| `create-client.use-case.spec.ts` | 9 |
| `certifier.service.spec.ts` *(preexistente)* | 8 |
| `certifier.controller.spec.ts` *(preexistente)* | 1 |
| **Total** | **56** |
