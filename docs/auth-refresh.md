# 🔄 Endpoint: Token Refresh

## 📋 Información General

| Propiedad | Valor |
|-----------|--------|
| **Método** | `POST` |
| **Ruta** | `/api/v1/auth/refresh` |
| **Autenticación** | Refresh Token requerido |
| **Rate Limit** | 20 intentos por 10 minutos por IP |
| **Versión API** | v1 |

## 📖 Descripción

Renueva un access token expirado utilizando un refresh token válido. Este endpoint permite mantener sesiones activas sin requerir que el usuario ingrese credenciales nuevamente, implementando un sistema de rotación de tokens por seguridad.

## 📥 Datos de Entrada (Request Body)

```json
{
  "refreshToken": "string",
  "deviceId": "string"
}
```

### Validaciones de Entrada

| Campo | Tipo | Requerido | Validaciones |
|-------|------|-----------|--------------|
| `refreshToken` | string | ✅ | - Token de 64 caracteres<br>- Debe estar activo en base de datos<br>- No debe haber expirado (7 días) |
| `deviceId` | string | ✅ | - UUID del dispositivo<br>- Debe coincidir con el token<br>- Sesión debe estar activa |

## 📤 Respuestas

### ✅ Renovación Exitosa (200 OK)

```json
{
  "success": true,
  "message": "Tokens renovados exitosamente",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4",
      "expiresIn": 900,
      "tokenType": "Bearer"
    },
    "session": {
      "id": "64f8b456c789d012e345f678",
      "deviceId": "550e8400-e29b-41d4-a716-446655440000",
      "expiresAt": "2025-10-02T14:45:00.000Z",
      "lastRefreshedAt": "2025-09-25T14:45:00.000Z"
    },
    "user": {
      "id": "64f8a123b456c789d012e345",
      "email": "usuario@ejemplo.com",
      "name": "Juan Pérez",
      "status": "active"
    }
  }
}
```

### ❌ Refresh Token Inválido (401 Unauthorized)

```json
{
  "status": 401,
  "code": "INVALID_REFRESH_TOKEN",
  "message": "El refresh token es inválido o ha expirado",
  "details": {
    "tokenStatus": "invalid",
    "requiresLogin": true,
    "loginEndpoint": "/api/v1/auth/login"
  }
}
```

### ❌ Refresh Token Expirado (401 Unauthorized)

```json
{
  "status": 401,
  "code": "REFRESH_TOKEN_EXPIRED",
  "message": "El refresh token ha expirado. Por favor, inicia sesión nuevamente.",
  "details": {
    "expiredAt": "2025-09-18T14:45:00.000Z",
    "maxAge": "7 days",
    "requiresLogin": true
  }
}
```

### ❌ Device ID No Coincide (403 Forbidden)

```json
{
  "status": 403,
  "code": "DEVICE_MISMATCH",
  "message": "El dispositivo no coincide con el token de sesión",
  "details": {
    "providedDeviceId": "550e8400-e29b-41d4-a716-446655440000",
    "expectedDeviceId": "different-device-uuid",
    "securityReason": "Token binding validation failed"
  }
}
```

### ❌ Sesión Inactiva (403 Forbidden)

```json
{
  "status": 403,
  "code": "SESSION_INACTIVE",
  "message": "La sesión ha sido cerrada o es inválida",
  "details": {
    "sessionStatus": "closed",
    "closedAt": "2025-09-25T12:00:00.000Z",
    "reason": "user_logout"
  }
}
```

### ❌ Usuario Suspendido (403 Forbidden)

```json
{
  "status": 403,
  "code": "USER_SUSPENDED",
  "message": "Tu cuenta ha sido suspendida. No se pueden renovar tokens.",
  "details": {
    "userStatus": "suspended",
    "suspendedAt": "2025-09-25T10:00:00.000Z",
    "supportEmail": "soporte@sigma.com"
  }
}
```

### ❌ Rate Limit Excedido (429 Too Many Requests)

```json
{
  "status": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Demasiados intentos de renovación. Intente nuevamente más tarde.",
  "details": {
    "retryAfter": 600,
    "limit": 20,
    "windowMs": 600000
  }
}
```

## 🔄 Flujo de Proceso

1. **Validación de entrada**: Verificar formato de refresh token y device ID
2. **Búsqueda de sesión**: Localizar sesión activa por refresh token
3. **Verificación de dispositivo**: Confirmar que device ID coincida
4. **Verificación de expiración**: Confirmar que token no haya expirado
5. **Verificación de usuario**: Confirmar estado activo del usuario
6. **Rotación de tokens**: Generar nuevo access token y refresh token
7. **Actualización de sesión**: Actualizar timestamp de último refresh
8. **Invalidación del token anterior**: Revocar refresh token previo
9. **Respuesta con nuevos tokens**: Devolver tokens actualizados

## 🔒 Reglas de Negocio

### Rotación de Tokens
- **Access Token**: Nuevo JWT con expiración de 15 minutos
- **Refresh Token**: Nuevo string aleatorio de 64 caracteres
- **Token anterior**: Inmediatamente invalidado tras uso exitoso
- **Período de gracia**: 30 segundos para manejar concurrencia

### Gestión de Sesiones
- **Una sesión por device ID**: Un dispositivo = una sesión activa
- **Expiración extendida**: Cada refresh extiende vida útil por 7 días
- **Límite de renovaciones**: Máximo 200 renovaciones por sesión
- **Cleanup automático**: Sesiones inactivas >7 días eliminadas

### Estados de Usuario Válidos
- ✅ **active**: Puede renovar tokens
- ❌ **pending_verification**: No puede renovar, debe completar verificación
- ❌ **suspended**: No puede renovar tokens
- ❌ **deleted**: Sesiones automáticamente invalidadas

## 🛡️ Seguridad

### Token Rotation Security
- **Refresh token único**: Cada renovación genera token completamente nuevo
- **Invalidación inmediata**: Token anterior se vuelve inútil instantáneamente
- **Detección de reutilización**: Si se intenta usar token ya rotado, se invalida toda la sesión
- **Binding de dispositivo**: Token vinculado específicamente a device ID

### Access Token (JWT) Properties
- **Algoritmo**: RS256 (RSA con SHA-256)
- **Expiración**: 15 minutos desde emisión
- **Claims incluidos**:
  - `userId`: ID del usuario
  - `sessionId`: ID de la sesión
  - `deviceId`: ID del dispositivo
  - `iat`: Timestamp de emisión
  - `exp`: Timestamp de expiración
  - `iss`: "SIGma-System"
  - `aud`: "SIGma-Users"
  - `jti`: JWT ID único para rastreo

### Refresh Token Properties
- **Formato**: String alfanumérico de 64 caracteres
- **Entropía**: 256 bits de entropía criptográfica
- **Almacenamiento**: Hash SHA-256 en base de datos
- **Expiración**: 7 días (extensible con cada uso)
- **Revocación**: Instantánea al hacer logout

### Protecciones Implementadas
- **Rate Limiting**: 20 intentos por 10 minutos por IP
- **Device Binding**: Tokens vinculados a dispositivos específicos
- **Concurrent Use Detection**: Prevención de uso simultáneo de tokens
- **Session Hijacking Protection**: Invalidación automática ante uso sospechoso
- **Audit Logging**: Registro completo de todas las renovaciones

## 🔄 Manejo de Concurrencia

### Requests Simultáneos
- **Período de gracia**: 30 segundos para manejar múltiples requests
- **Idempotencia**: Mismo token puede usarse múltiples veces en período de gracia
- **Race Condition Handling**: Locks a nivel de sesión para prevenir corruption

### Detección de Uso Anómalo
- **Múltiples IPs**: Alerta si renovaciones desde IPs muy diferentes
- **Frecuencia alta**: Límite de renovaciones por minuto por sesión
- **Geolocalización**: Detección de cambios geográficos súbitos

## 🧪 Ejemplos de Uso

### Renovación Estándar
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a1b2c3d4e5f6",
    "deviceId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Renovación desde Mobile App
```bash
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "f6e5d4c3b2a1z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4",
    "deviceId": "mobile-device-uuid-123456789abcdef"
  }'
```

### Integración con Interceptors (JavaScript)
```javascript
// Axios interceptor para renovación automática
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const deviceId = localStorage.getItem('deviceId');
      
      try {
        const response = await axios.post('/api/v1/auth/refresh', {
          refreshToken,
          deviceId
        });
        
        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
        
        // Actualizar tokens almacenados
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        // Reintentar request original
        return axios(error.config);
      } catch (refreshError) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

## 🔍 Casos de Prueba

### Casos Exitosos
- ✅ Renovación con tokens válidos
- ✅ Renovación cerca de la expiración del access token
- ✅ Renovación múltiple en período de gracia
- ✅ Renovación después de período de inactividad

### Casos de Error Comunes
- ❌ Refresh token ya usado (después del período de gracia)
- ❌ Device ID incorrecto o modificado
- ❌ Refresh token expirado (>7 días)
- ❌ Sesión cerrada manualmente por usuario
- ❌ Usuario suspendido durante sesión activa

### Casos de Seguridad
- 🛡️ Intento de usar refresh token desde IP diferente
- 🛡️ Renovación excesivamente frecuente (posible bot)
- 🛡️ Device ID spoofing attempts
- 🛡️ Token reutilización después de rotación

## ⚡ Optimizaciones

### Performance
- **Índices de base de datos**: refresh_token, device_id, user_id indexados
- **Cache de sesiones**: Sesiones activas en Redis para acceso rápido
- **JWT stateless**: Access tokens no requieren consulta a base de datos
- **Batch cleanup**: Limpieza de sesiones expiradas cada hora

### Escalabilidad
- **Stateless design**: Servidores sin estado para tokens JWT
- **Horizontal scaling**: Refresh logic compatible con múltiples instancias
- **Database sharding**: Sesiones distribuidas por user_id hash

## 📊 Métricas y Monitoreo

### Métricas de Renovación
- **Tasa de renovación**: Renovaciones exitosas vs fallidas
- **Tiempo de respuesta**: Latencia promedio del endpoint
- **Frecuencia de uso**: Renovaciones por sesión activa
- **Duración de sesiones**: Tiempo promedio de vida de sesiones

### Alertas de Seguridad
- **Renovaciones anómalas**: Frecuencia inusual por sesión
- **Geolocalización sospechosa**: Renovaciones desde ubicaciones distantes
- **Tokens comprometidos**: Patrones de uso que sugieren filtración
- **Rate limiting activado**: Múltiples IPs excediendo límites

### Logs de Auditoría
```json
{
  "timestamp": "2025-09-25T14:45:00.000Z",
  "event": "token_refresh",
  "userId": "64f8a123b456c789d012e345",
  "sessionId": "64f8b456c789d012e345f678",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "success": true,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "oldRefreshToken": "a1b2c3d4...(hash)",
  "newRefreshToken": "f6e5d4c3...(hash)",
  "accessTokenId": "jti_12345",
  "refreshCount": 42,
  "sessionAge": 3600000
}
```

## 🎯 Mejores Prácticas

### Para Desarrolladores Frontend
- Implementar renovación automática en interceptors HTTP
- Manejar casos de refresh fallido con redirect a login
- Almacenar refresh tokens de forma segura (HttpOnly cookies preferido)
- Implementar retry logic para requests durante renovación

### Para Desarrolladores Backend
- Usar transacciones para operaciones atómicas de rotación
- Implementar rate limiting adecuado por IP y por sesión
- Monitorear patrones anómalos de renovación
- Mantener logs detallados para debugging de seguridad

### Para DevOps
- Configurar alertas para picos de renovaciones fallidas
- Monitorear latencia del endpoint (crítico para UX)
- Implementar circuit breakers para proteger base de datos
- Configurar cleanup automático de sesiones expiradas

---

**Documentación actualizada**: 25 de septiembre de 2025  
**Versión del endpoint**: v1.0  
**Estado**: ✅ Completamente operativo