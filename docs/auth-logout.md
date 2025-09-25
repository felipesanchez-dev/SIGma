# 🚪 Endpoint: User Logout

## 📋 Información General

| Propiedad | Valor |
|-----------|--------|
| **Método** | `POST` |
| **Ruta** | `/api/v1/auth/logout` |
| **Autenticación** | Bearer Token requerido |
| **Rate Limit** | 30 intentos por 5 minutos por IP |
| **Versión API** | v1 |

## 📖 Descripción

Cierra la sesión del usuario invalidando tanto el access token como el refresh token asociados. Opcionalmente puede cerrar todas las sesiones activas del usuario en todos los dispositivos (logout global).

## 📥 Datos de Entrada

### Headers Requeridos
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Request Body (Opcional)
```json
{
  "logoutAll": false,
  "deviceId": "string"
}
```

### Validaciones de Entrada

| Campo | Tipo | Requerido | Validaciones |
|-------|------|-----------|--------------|
| `Authorization` | header | ✅ | - Bearer token válido<br>- JWT no expirado<br>- Token en lista blanca |
| `logoutAll` | boolean | ❌ | - Si `true`, cierra todas las sesiones del usuario<br>- Por defecto: `false` |
| `deviceId` | string | ❌ | - UUID del dispositivo específico<br>- Si se proporciona, solo cierra esa sesión |

## 📤 Respuestas

### ✅ Logout Exitoso (200 OK)

```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente",
  "data": {
    "logout": {
      "sessionsClosed": 1,
      "deviceIds": ["550e8400-e29b-41d4-a716-446655440000"],
      "logoutType": "single_device",
      "loggedOutAt": "2025-09-25T15:30:00.000Z"
    },
    "user": {
      "id": "64f8a123b456c789d012e345",
      "email": "usuario@ejemplo.com",
      "activeSessions": 2
    }
  }
}
```

### ✅ Logout Global Exitoso (200 OK)

```json
{
  "success": true,
  "message": "Todas las sesiones han sido cerradas exitosamente",
  "data": {
    "logout": {
      "sessionsClosed": 4,
      "deviceIds": [
        "550e8400-e29b-41d4-a716-446655440000",
        "mobile-device-uuid-123456789",
        "tablet-device-uuid-987654321",
        "desktop-device-uuid-abcdef123"
      ],
      "logoutType": "all_devices",
      "loggedOutAt": "2025-09-25T15:30:00.000Z"
    },
    "user": {
      "id": "64f8a123b456c789d012e345",
      "email": "usuario@ejemplo.com",
      "activeSessions": 0
    }
  }
}
```

### ❌ Token Inválido (401 Unauthorized)

```json
{
  "status": 401,
  "code": "INVALID_ACCESS_TOKEN",
  "message": "Token de acceso inválido o expirado",
  "details": {
    "tokenStatus": "invalid",
    "requiresLogin": true
  }
}
```

### ❌ Token Expirado (401 Unauthorized)

```json
{
  "status": 401,
  "code": "ACCESS_TOKEN_EXPIRED",
  "message": "El token de acceso ha expirado",
  "details": {
    "expiredAt": "2025-09-25T15:00:00.000Z",
    "canRefresh": true,
    "refreshEndpoint": "/api/v1/auth/refresh"
  }
}
```

### ❌ Sesión Ya Cerrada (404 Not Found)

```json
{
  "status": 404,
  "code": "SESSION_NOT_FOUND",
  "message": "La sesión ya ha sido cerrada o no existe",
  "details": {
    "sessionStatus": "already_closed",
    "closedAt": "2025-09-25T14:00:00.000Z"
  }
}
```

### ❌ Device ID No Encontrado (404 Not Found)

```json
{
  "status": 404,
  "code": "DEVICE_SESSION_NOT_FOUND",
  "message": "No se encontró una sesión activa para este dispositivo",
  "details": {
    "deviceId": "non-existent-device-uuid",
    "userActiveSessions": 2
  }
}
```

### ❌ Rate Limit Excedido (429 Too Many Requests)

```json
{
  "status": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Demasiados intentos de logout. Intente nuevamente más tarde.",
  "details": {
    "retryAfter": 300,
    "limit": 30,
    "windowMs": 300000
  }
}
```

## 🔄 Flujo de Proceso

### Logout Simple (Dispositivo Actual)
1. **Validación de token**: Verificar JWT access token válido
2. **Extracción de claims**: Obtener userId y sessionId del JWT
3. **Búsqueda de sesión**: Localizar sesión activa en base de datos
4. **Invalidación de tokens**: Marcar access y refresh tokens como inválidos
5. **Cierre de sesión**: Actualizar estado de sesión a "closed"
6. **Limpieza de cache**: Remover tokens de blacklist/whitelist cache
7. **Registro de auditoría**: Log del evento de logout
8. **Respuesta confirmación**: Éxito con detalles de sesiones cerradas

### Logout Global (Todos los Dispositivos)
1. **Validación de token**: Verificar JWT access token válido
2. **Identificación de usuario**: Extraer userId del JWT
3. **Búsqueda de sesiones**: Localizar todas las sesiones activas del usuario
4. **Invalidación masiva**: Marcar todos los tokens del usuario como inválidos
5. **Cierre de sesiones**: Actualizar estado de todas las sesiones a "closed"
6. **Limpieza completa**: Remover todos los tokens del usuario del cache
7. **Registro detallado**: Log con lista de todas las sesiones cerradas
8. **Respuesta completa**: Confirmación con detalles de logout global

## 🔒 Reglas de Negocio

### Tipos de Logout
- **Single Device**: Cierra solo la sesión del dispositivo actual
- **Specific Device**: Cierra sesión de un deviceId específico
- **All Devices**: Cierra todas las sesiones activas del usuario
- **Emergency Logout**: Admin puede cerrar sesiones de cualquier usuario

### Gestión de Tokens
- **Access Token**: Agregado a blacklist (15 min expiración natural)
- **Refresh Token**: Eliminado de base de datos inmediatamente
- **Cache invalidation**: Tokens removidos de cache de autenticación
- **JWT revocation**: JTI agregado a revocation list

### Estados de Sesión
- **Antes del logout**: `active`
- **Después del logout**: `closed`
- **Logout reason**: `user_logout`, `admin_logout`, `security_logout`

## 🛡️ Seguridad

### Token Revocation Strategy
- **JWT Blacklisting**: Access tokens agregados a blacklist hasta expiración natural
- **Refresh Token Deletion**: Eliminación inmediata de base de datos
- **Cache Invalidation**: Limpieza de cache distribuido
- **Real-time Propagation**: Cambios propagados a todos los servidores

### Protecciones de Seguridad
- **Rate Limiting**: Prevención de logout automatizado malicioso
- **Audit Logging**: Registro completo de todos los logouts
- **Concurrent Session Control**: Manejo de múltiples sesiones simultáneas
- **Emergency Procedures**: Capacidad de logout forzado por admin

### Validaciones de Autorización
- **Token Ownership**: Solo el propietario puede hacer logout de sus sesiones
- **Device Binding**: Verificación de que token corresponde al dispositivo
- **Session Validation**: Confirmación de sesión activa antes de cerrar

## 🔄 Casos Especiales

### Logout Después de Compromiso de Seguridad
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"logoutAll": true}'
```

### Logout de Dispositivo Específico
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "mobile-device-uuid-123456789"
  }'
```

### Logout de Emergencia (Admin)
```bash
curl -X POST http://localhost:3000/api/v1/admin/users/force-logout \
  -H "Authorization: Bearer admin_token..." \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "64f8a123b456c789d012e345",
    "reason": "security_incident"
  }'
```

## 🧪 Ejemplos de Uso

### Logout Simple
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json"
```

### Logout Global
```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"logoutAll": true}'
```

### Integración con Frontend (JavaScript)
```javascript
// Logout simple
async function logout() {
  try {
    const response = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      // Limpiar localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('deviceId');
      
      // Redirect a login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error during logout:', error);
  }
}

// Logout global (cerrar todas las sesiones)
async function logoutAll() {
  try {
    const response = await fetch('/api/v1/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ logoutAll: true })
    });
    
    if (response.ok) {
      const result = await response.json();
      alert(`Cerraste ${result.data.logout.sessionsClosed} sesiones activas`);
      
      // Limpiar y redirect
      localStorage.clear();
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Error during global logout:', error);
  }
}
```

## 🔍 Casos de Prueba

### Casos Exitosos
- ✅ Logout con token válido
- ✅ Logout global cerrando múltiples sesiones
- ✅ Logout de dispositivo específico
- ✅ Logout después de cambio de contraseña

### Casos de Error
- ❌ Logout con token expirado
- ❌ Logout con token inválido
- ❌ Logout de sesión ya cerrada
- ❌ Logout con deviceId inexistente
- ❌ Multiple logout requests simultáneos

### Casos de Seguridad
- 🛡️ Logout después de detección de compromiso
- 🛡️ Logout forzado por administrador
- 🛡️ Logout automático por inactividad
- 🛡️ Logout por cambio de IP sospechoso

## ⚡ Optimizaciones

### Performance
- **Batch Operations**: Logout multiple optimizado para múltiples sesiones
- **Async Processing**: Limpieza de cache en background
- **Database Indexing**: Índices optimizados para búsquedas de sesión
- **Connection Pooling**: Pool de conexiones para operaciones concurrentes

### Escalabilidad
- **Distributed Cache**: Cache distribuido para blacklists
- **Event-Driven**: Eventos de logout propagados via message queue
- **Horizontal Scaling**: Logout funciona en cluster de servidores
- **Database Sharding**: Sesiones distribuidas por user hash

## 📊 Métricas y Monitoreo

### Métricas de Logout
- **Tasa de logout**: Logouts exitosos vs fallidos
- **Tiempo de respuesta**: Latencia promedio del endpoint
- **Logout patterns**: Análisis de comportamiento de logout
- **Session duration**: Duración promedio de sesiones antes del logout

### Distribución por Tipo
- **Single device logouts**: 85%
- **Global logouts**: 12%
- **Admin forced logouts**: 2%
- **Automatic logouts**: 1%

### Alertas de Sistema
- **High logout rate**: Pico inusual de logouts (posible ataque)
- **Failed logout attempts**: Múltiples intentos fallidos por IP
- **Suspicious patterns**: Logouts masivos de usuarios específicos
- **Performance issues**: Latencia alta en logout operations

### Logs de Auditoría
```json
{
  "timestamp": "2025-09-25T15:30:00.000Z",
  "event": "user_logout",
  "userId": "64f8a123b456c789d012e345",
  "sessionId": "64f8b456c789d012e345f678",
  "deviceId": "550e8400-e29b-41d4-a716-446655440000",
  "logoutType": "single_device",
  "sessionsClosed": 1,
  "reason": "user_initiated",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "sessionDuration": 7200000,
  "success": true
}
```

## 🎯 Mejores Prácticas

### Para Desarrolladores Frontend
- Limpiar todos los tokens del localStorage después del logout
- Implementar logout automático en caso de 401 responses
- Ofrecer opción de "cerrar todas las sesiones" en configuración
- Manejar errores de logout gracefully

### Para Desarrolladores Backend
- Implementar cleanup automático de tokens expirados
- Usar transacciones para operaciones de logout atómicas
- Mantener audit logs detallados para compliance
- Implementar rate limiting adecuado

### Para Administradores de Sistema
- Monitorear patrones anómalos de logout
- Configurar alertas para picos de actividad
- Implementar políticas de logout automático
- Mantener logs de auditoría para compliance

### Para Usuarios Finales
- Usar logout global si sospechas compromiso de cuenta
- Revisar sesiones activas regularmente
- Hacer logout al usar dispositivos compartidos
- Reportar actividad sospechosa de inmediato

---

**Documentación actualizada**: 25 de septiembre de 2025  
**Versión del endpoint**: v1.0  
**Estado**: ✅ Completamente operativo