# Endpoint: User Login

## Información General

| Propiedad         | Valor                            |
| ----------------- | -------------------------------- |
| **Método**        | `POST`                           |
| **Ruta**          | `/api/v1/auth/login`             |
| **Autenticación** | No requerida                     |
| **Rate Limit**    | 5 intentos por 15 minutos por IP |
| **Versión API**   | v1                               |

## Descripción

Autentica un usuario en el sistema SIGma y genera tokens de acceso (JWT) y renovación. Solo usuarios con estado `active` pueden iniciar sesión exitosamente.

## Datos de Entrada (Request Body)

```json
{
  "email": "string",
  "password": "string",
  "deviceId": "string",
  "deviceMeta": {
    "userAgent": "string",
    "ipAddress": "string",
    "platform": "string",
    "browser": "string",
    "os": "string"
  }
}
```

### Validaciones de Entrada

| Campo                  | Tipo   | Requerido | Validaciones                                                        |
| ---------------------- | ------ | --------- | ------------------------------------------------------------------- |
| `email`                | string | ✅        | - Formato email válido<br>- Usuario debe existir en el sistema      |
| `password`             | string | ✅        | - Contraseña en texto plano<br>- Se verificará contra hash Argon2id |
| `deviceId`             | string | ✅        | - Identificador único del dispositivo<br>- UUID v4 recomendado      |
| `deviceMeta.userAgent` | string | ✅        | - User Agent del navegador/cliente                                  |
| `deviceMeta.ipAddress` | string | ✅        | - Dirección IP del cliente                                          |
| `deviceMeta.platform`  | string | ❌        | - Plataforma (web, mobile, desktop)                                 |
| `deviceMeta.browser`   | string | ❌        | - Navegador utilizado                                               |
| `deviceMeta.os`        | string | ❌        | - Sistema operativo                                                 |

## Respuestas

### ✅ Login Exitoso (200 OK)

```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "user": {
      "id": "64f8a123b456c789d012e345",
      "email": "usuario@ejemplo.com",
      "name": "Juan Pérez",
      "phone": "+573001234567",
      "country": "Colombia",
      "city": "Bogotá",
      "tenantType": "professional",
      "status": "active",
      "createdAt": "2025-09-25T10:30:00.000Z",
      "lastLoginAt": "2025-09-25T14:45:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
      "expiresIn": 900,
      "tokenType": "Bearer"
    },
    "session": {
      "id": "64f8b456c789d012e345f678",
      "deviceId": "550e8400-e29b-41d4-a716-446655440000",
      "expiresAt": "2025-10-02T14:45:00.000Z",
      "createdAt": "2025-09-25T14:45:00.000Z"
    }
  }
}
```

### ❌ Credenciales Inválidas (401 Unauthorized)

```json
{
  "status": 401,
  "code": "INVALID_CREDENTIALS",
  "message": "Email o contraseña incorrectos",
  "details": {
    "attemptNumber": 2,
    "remainingAttempts": 3,
    "lockoutTime": null
  }
}
```

### ❌ Usuario No Verificado (403 Forbidden)

```json
{
  "status": 403,
  "code": "USER_NOT_VERIFIED",
  "message": "Debes verificar tu cuenta antes de iniciar sesión",
  "details": {
    "userStatus": "pending_verification",
    "verificationRequired": true
  }
}
```

### ❌ Usuario Suspendido (403 Forbidden)

```json
{
  "status": 403,
  "code": "USER_SUSPENDED",
  "message": "Tu cuenta ha sido suspendida. Contacta soporte.",
  "details": {
    "userStatus": "suspended",
    "supportEmail": "soporte@sigma.com"
  }
}
```

### ❌ Demasiados Intentos (423 Locked)

```json
{
  "status": 423,
  "code": "ACCOUNT_TEMPORARILY_LOCKED",
  "message": "Cuenta bloqueada temporalmente por múltiples intentos fallidos",
  "details": {
    "lockoutExpiresAt": "2025-09-25T15:00:00.000Z",
    "attemptCount": 5,
    "lockoutDurationMinutes": 15
  }
}
```

### ❌ Rate Limit Excedido (429 Too Many Requests)

```json
{
  "status": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Demasiados intentos de inicio de sesión. Intente nuevamente más tarde.",
  "details": {
    "retryAfter": 900,
    "limit": 5,
    "windowMs": 900000
  }
}
```

## Flujo de Proceso

1. **Validación de entrada**: Verificación de formato de datos
2. **Búsqueda de usuario**: Localizar usuario por email
3. **Verificación de estado**: Usuario debe estar `active`
4. **Verificación de contraseña**: Comparación con hash Argon2id
5. **Control de intentos**: Verificar límites de intentos fallidos
6. **Gestión de sesiones**: Crear o actualizar sesión del dispositivo
7. **Generación de tokens**: JWT (access) y string aleatorio (refresh)
8. **Respuesta**: Tokens y datos del usuario

## Reglas de Negocio

### Estados de Usuario Válidos

- ✅ **active**: Puede iniciar sesión
- ❌ **pending_verification**: Debe verificar email primero
- ❌ **suspended**: No puede acceder, contactar soporte

### Gestión de Sesiones

- **Límite por usuario**: 5 sesiones activas simultáneas
- **Expiración**: 7 días para refresh token, 15 minutos para access token
- **Limpieza automática**: Sesiones expiradas eliminadas cada hora
- **Dispositivo único**: Una sesión por `deviceId` por usuario

### Control de Intentos Fallidos

- **Límite**: 5 intentos fallidos por cuenta
- **Ventana de tiempo**: 15 minutos
- **Bloqueo temporal**: 15 minutos después del 5to intento
- **Reset**: Contador se resetea tras login exitoso

## Seguridad

### Tokens JWT (Access Token)

- **Algoritmo**: RS256 (RSA con SHA-256)
- **Expiración**: 15 minutos
- **Claims incluidos**:
  - `userId`: ID del usuario
  - `sessionId`: ID de la sesión
  - `iat`: Tiempo de emisión
  - `exp`: Tiempo de expiración
  - `iss`: Emisor (SIGma-System)
  - `aud`: Audiencia (SIGma-Users)

### Refresh Tokens

- **Formato**: String aleatorio de 64 caracteres
- **Almacenamiento**: Base de datos con hash
- **Expiración**: 7 días
- **Rotación**: Nuevo token en cada renovación
- **Invalidación**: Al hacer logout

### Protecciones Implementadas

- **Rate Limiting**: Por IP y por cuenta
- **Argon2id**: Hash de contraseñas resistente a ataques
- **Session Management**: Control estricto de sesiones activas
- **Audit Logging**: Registro de todos los intentos de login
- **Device Tracking**: Seguimiento por dispositivo único

## Gestión de Dispositivos

### Identificación de Dispositivo

- `deviceId`: UUID único generado por el cliente
- Permite múltiples sesiones en diferentes dispositivos
- Limita a una sesión por dispositivo por usuario

### Metadatos de Dispositivo

- **Obligatorios**: userAgent, ipAddress
- **Opcionales**: platform, browser, os
- **Uso**: Análisis de seguridad, detección de anomalías

## Renovación de Tokens

### Access Token Expirado

- Cliente debe usar refresh token para obtener nuevo access token
- Endpoint: `POST /api/v1/auth/refresh`
- No requiere re-autenticación completa

### Refresh Token Expirado

- Usuario debe hacer login completo nuevamente
- Todos los tokens previos son invalidados

## Ejemplos de Uso

### Login Básico

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@gmail.com",
    "password": "MiPassword123!",
    "deviceId": "550e8400-e29b-41d4-a716-446655440000",
    "deviceMeta": {
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "ipAddress": "192.168.1.100",
      "platform": "web",
      "browser": "Chrome",
      "os": "Windows"
    }
  }'
```

### Login desde Mobile

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@gmail.com",
    "password": "MiPassword123!",
    "deviceId": "mobile-uuid-123456789",
    "deviceMeta": {
      "userAgent": "SIGmaApp/1.0 (iOS 15.0)",
      "ipAddress": "10.0.0.5",
      "platform": "mobile",
      "browser": "native",
      "os": "iOS"
    }
  }'
```

## Casos de Prueba

### Casos Exitosos

- ✅ Login con credenciales válidas
- ✅ Login desde múltiples dispositivos
- ✅ Login después de registro y verificación

### Casos de Error

- ❌ Email no registrado
- ❌ Contraseña incorrecta
- ❌ Usuario no verificado
- ❌ Usuario suspendido
- ❌ Múltiples intentos fallidos
- ❌ Rate limiting activado

### Casos de Seguridad

- 🛡️ Intento de brute force
- 🛡️ Login desde IP sospechosa
- 🛡️ Device ID reutilizado

## Métricas y Monitoreo

### Métricas Clave

- **Tiempo de respuesta**: < 150ms promedio
- **Tasa de éxito**: > 95%
- **Intentos fallidos**: < 5% del total
- **Sesiones activas**: Monitoreo en tiempo real

### Alertas de Seguridad

- Alto número de intentos fallidos por IP
- Múltiples logins desde ubicaciones distintas
- Patrones de bot o automatización
- Intentos de login en cuentas suspendidas

### Logs de Auditoría

```json
{
  "timestamp": "2025-09-25T14:45:00.000Z",
  "event": "login_attempt",
  "userId": "64f8a123b456c789d012e345",
  "email": "juan.perez@gmail.com",
  "success": true,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "sessionId": "64f8b456c789d012e345f678"
}
```

---

**Documentación actualizada**: 25 de septiembre de 2025  
**Versión del endpoint**: v1.0  
**Estado**: ✅ Completamente operativo
