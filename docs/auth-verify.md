# ✅ Endpoint: Email Verification

## 📋 Información General

| Propiedad | Valor |
|-----------|--------|
| **Método** | `POST` |
| **Ruta** | `/api/v1/auth/verify` |
| **Autenticación** | No requerida |
| **Rate Limit** | 10 intentos por 5 minutos por IP |
| **Versión API** | v1 |

## 📖 Descripción

Verifica el email de un usuario recién registrado utilizando el token de verificación enviado por correo electrónico. Este endpoint activa la cuenta del usuario cambiando su estado de `pending_verification` a `active`.

## 📥 Datos de Entrada (Request Body)

```json
{
  "code": "string"
}
```

### Validaciones de Entrada

| Campo | Tipo | Requerido | Validaciones |
|-------|------|-----------|--------------|
| `code` | string | ✅ | - Código de verificación de 5 dígitos numéricos<br>- Debe coincidir exactamente<br>- No debe haber expirado (15 minutos) |

## 📤 Respuestas

### ✅ Verificación Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Email verificado exitosamente. Tu cuenta está ahora activa.",
  "data": {
    "user": {
      "id": "64f8a123b456c789d012e345",
      "email": "usuario@ejemplo.com",
      "name": "Juan Pérez",
      "status": "active",
      "verifiedAt": "2025-09-25T14:30:00.000Z",
      "createdAt": "2025-09-24T10:15:00.000Z"
    },
    "verification": {
      "verifiedAt": "2025-09-25T14:30:00.000Z",
      "codeUsed": "45052",
      "verificationMethod": "email_code"
    }
  }
}
```

### ❌ Token Inválido o Expirado (400 Bad Request)

```json
{
  "status": 400,
  "code": "INVALID_VERIFICATION_TOKEN",
  "message": "El token de verificación es inválido o ha expirado",
  "details": {
    "tokenStatus": "expired",
    "expiresAt": "2025-09-24T10:15:00.000Z",
    "canRequestNew": true
  }
}
```

### ❌ Usuario No Encontrado (404 Not Found)

```json
{
  "status": 404,
  "code": "USER_NOT_FOUND",
  "message": "No se encontró un usuario con este email",
  "details": {
    "email": "usuario@ejemplo.com",
    "suggestion": "Verifica que el email sea correcto"
  }
}
```

### ❌ Usuario Ya Verificado (409 Conflict)

```json
{
  "status": 409,
  "code": "USER_ALREADY_VERIFIED",
  "message": "Este usuario ya ha sido verificado anteriormente",
  "details": {
    "userStatus": "active",
    "verifiedAt": "2025-09-20T08:30:00.000Z",
    "canLogin": true
  }
}
```

### ❌ Token Ya Utilizado (410 Gone)

```json
{
  "status": 410,
  "code": "TOKEN_ALREADY_USED",
  "message": "Este token de verificación ya ha sido utilizado",
  "details": {
    "usedAt": "2025-09-25T12:00:00.000Z",
    "canRequestNew": false,
    "userStatus": "active"
  }
}
```

### ❌ Rate Limit Excedido (429 Too Many Requests)

```json
{
  "status": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Demasiados intentos de verificación. Intente nuevamente más tarde.",
  "details": {
    "retryAfter": 300,
    "limit": 10,
    "windowMs": 300000
  }
}
```

## 🔄 Flujo de Proceso

1. **Validación de entrada**: Verificación del formato del token y email
2. **Búsqueda del usuario**: Localizar usuario por email
3. **Verificación del token**: Comprobar validez y expiración
4. **Verificación de estado**: Confirmar que el usuario no esté ya verificado
5. **Activación de cuenta**: Cambiar estado a `active`
6. **Limpieza de tokens**: Eliminar token de verificación usado
7. **Registro de auditoría**: Log del evento de verificación
8. **Respuesta exitosa**: Confirmación de activación

## 🔒 Reglas de Negocio

### Estados de Usuario
- **Entrada válida**: `pending_verification`
- **Estado resultante**: `active`
- **Estados inválidos**: `suspended`, `deleted`, ya `active`

### Gestión de Códigos
- **Generación**: Al momento del registro
- **Duración**: 15 minutos desde la creación
- **Formato**: 5 dígitos numéricos (ej: 45052)
- **Uso único**: Código se elimina después de uso exitoso
- **Límite de intentos**: 3 intentos por código

### Flujo de Verificación
1. Usuario se registra → Token generado y enviado por email
2. Usuario hace clic en link o ingresa token manualmente
3. Sistema verifica token y activa cuenta
4. Usuario puede hacer login inmediatamente

## 🛡️ Seguridad

### Protección de Tokens
- **Entropía alta**: 32 caracteres hexadecimales (128 bits)
- **Expiración automática**: 24 horas máximo
- **Uso único**: Token inválido después del primer uso
- **Rate limiting**: Prevención de ataques de fuerza bruta

### Validaciones de Seguridad
- **Token format**: Validación estricta de formato hexadecimal
- **Email matching**: Token debe corresponder exactamente al email
- **Time-based expiration**: Verificación precisa de expiración
- **Status verification**: Solo usuarios en estado correcto pueden verificarse

### Prevención de Ataques
- **Brute force protection**: Rate limiting por IP
- **Token enumeration**: Tokens impredecibles
- **Replay attacks**: Tokens de un solo uso
- **Timing attacks**: Respuestas consistentes en tiempo

## 📧 Integración con Email

### Formato del Email de Verificación
- **Asunto**: "Verifica tu cuenta en SIGma"
- **Link de verificación**: `https://sigma.com/verify?token={token}&email={email}`
- **Token manual**: Opción de ingreso manual del token
- **Expiración mostrada**: "Este link expira en 24 horas"

### Template del Email
```html
<h2>¡Bienvenido a SIGma!</h2>
<p>Hola {{name}},</p>
<p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
<a href="https://sigma.com/verify?token={{token}}&email={{email}}">Verificar mi cuenta</a>
<p>O ingresa manualmente este código: <strong>{{token}}</strong></p>
<p><em>Este enlace expira en 24 horas.</em></p>
```

## 🔄 Renovación de Token

### Solicitar Nuevo Token
- **Endpoint**: `POST /api/v1/auth/resend-verification`
- **Condición**: Solo si token actual expiró
- **Límite**: 3 solicitudes por hora por usuario

### Invalidación de Tokens Previos
- Al generar nuevo token, los anteriores se invalidan
- Previene acumulación de tokens válidos
- Usuario siempre tiene un solo token activo

## 🧪 Ejemplos de Uso

### Verificación con Código de Email
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "code": "45052"
  }'
```

### Verificación Manual
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{
    "code": "67890"
  }'
```

### Respuesta de Verificación Exitosa
```json
{
  "success": true,
  "message": "Email verificado exitosamente. Tu cuenta está ahora activa.",
  "data": {
    "user": {
      "id": "64f8a123b456c789d012e345",
      "email": "juan.perez@gmail.com",
      "name": "Juan Pérez",
      "status": "active",
      "verifiedAt": "2025-09-25T14:30:00.000Z"
    }
  }
}
```

## 🔍 Casos de Prueba

### Casos Exitosos
- ✅ Verificación con token válido y no expirado
- ✅ Verificación inmediatamente después del registro
- ✅ Verificación cerca del límite de 24 horas

### Casos de Error
- ❌ Token con formato inválido (no hexadecimal)
- ❌ Token expirado (>24 horas)
- ❌ Token inexistente en base de datos
- ❌ Email que no corresponde al token
- ❌ Usuario ya verificado previamente
- ❌ Usuario en estado suspendido

### Casos de Rate Limiting
- 🚫 Más de 10 intentos en 5 minutos
- 🚫 Múltiples IPs intentando mismo token
- 🚫 Patrones automatizados de verificación

## ⚡ Optimizaciones

### Performance
- **Índice de base de datos**: Token indexado para búsqueda rápida
- **Cache de tokens**: Tokens frecuentemente verificados en memoria
- **Limpieza automática**: Job que elimina tokens expirados cada hora

### User Experience
- **Respuestas claras**: Mensajes específicos para cada situación
- **Links directos**: Verificación en un clic desde email
- **Feedback inmediato**: Confirmación visual de verificación exitosa

## 📊 Métricas y Monitoreo

### Métricas de Verificación
- **Tasa de verificación**: % de usuarios que completan verificación
- **Tiempo promedio**: Desde registro hasta verificación
- **Tokens expirados**: % de tokens que expiran sin uso
- **Intentos fallidos**: Análisis de patrones de error

### Alertas de Sistema
- Alta tasa de tokens expirados (>30%)
- Múltiples intentos fallidos por IP
- Tiempo de verificación anormalmente bajo (<1 minuto)
- Patrones de verificación automatizada

### Logs de Auditoría
```json
{
  "timestamp": "2025-09-25T14:30:00.000Z",
  "event": "email_verification",
  "userId": "64f8a123b456c789d012e345",
  "email": "juan.perez@gmail.com",
  "success": true,
  "tokenUsed": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "verificationTime": 1440,
  "previousStatus": "pending_verification",
  "newStatus": "active"
}
```

## 🎯 Mejores Prácticas

### Para Desarrolladores
- Siempre verificar expiración antes de validar token
- Usar transacciones para cambios de estado atómicos
- Implementar logging detallado para depuración
- Validar formato de token antes de consulta en BD

### Para Usuarios
- Verificar email inmediatamente después del registro
- Revisar carpeta de spam si no se recibe email
- Usar link directo en lugar de copia manual del token
- Contactar soporte si token expira sin usar

---

**Documentación actualizada**: 25 de septiembre de 2025  
**Versión del endpoint**: v1.0  
**Estado**: ✅ Completamente operativo