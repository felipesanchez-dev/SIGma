# 👤 Endpoint: User Profile

## 📋 Información General

| Propiedad | Valor |
|-----------|--------|
| **Método** | `GET` |
| **Ruta** | `/api/v1/auth/me` |
| **Autenticación** | Bearer Token requerido |
| **Rate Limit** | 100 solicitudes por 5 minutos por usuario |
| **Versión API** | v1 |

## 📖 Descripción

Obtiene el perfil completo del usuario autenticado, incluyendo información personal, preferencias, estadísticas de uso y sesiones activas. Este endpoint es comúnmente utilizado para cargar datos del usuario al inicializar aplicaciones frontend.

## 📥 Datos de Entrada

### Headers Requeridos
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Query Parameters (Opcionales)

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `include` | string | Campos adicionales: `sessions`, `preferences`, `stats`, `security` |
| `fields` | string | Campos específicos separados por coma |

### Ejemplos de Query Parameters
```http
GET /api/v1/auth/me?include=sessions,stats
GET /api/v1/auth/me?fields=id,email,name,status
GET /api/v1/auth/me?include=security&fields=id,email,lastLoginAt
```

## 📤 Respuestas

### ✅ Perfil Obtenido Exitosamente (200 OK)

```json
{
  "success": true,
  "message": "Perfil de usuario obtenido exitosamente",
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
      "isVerified": true,
      "avatar": {
        "url": "https://storage.sigma.com/avatars/64f8a123b456c789d012e345.jpg",
        "thumbnailUrl": "https://storage.sigma.com/avatars/thumbs/64f8a123b456c789d012e345.jpg"
      },
      "createdAt": "2025-09-20T10:15:00.000Z",
      "updatedAt": "2025-09-25T14:30:00.000Z",
      "lastLoginAt": "2025-09-25T14:45:00.000Z",
      "emailVerifiedAt": "2025-09-20T11:30:00.000Z"
    },
    "preferences": {
      "language": "es",
      "timezone": "America/Bogota",
      "theme": "light",
      "notifications": {
        "email": true,
        "push": true,
        "sms": false
      },
      "privacy": {
        "profileVisibility": "public",
        "showOnlineStatus": true,
        "allowContactByEmail": true
      }
    },
    "stats": {
      "totalLogins": 47,
      "currentStreak": 5,
      "longestStreak": 12,
      "averageSessionDuration": 1800000,
      "lastActiveAt": "2025-09-25T15:30:00.000Z",
      "accountAgeInDays": 5
    },
    "security": {
      "twoFactorEnabled": false,
      "passwordLastChanged": "2025-09-20T10:15:00.000Z",
      "activeSessions": 3,
      "lastSecurityEvent": {
        "type": "login",
        "timestamp": "2025-09-25T14:45:00.000Z",
        "ipAddress": "192.168.1.100",
        "location": "Bogotá, Colombia"
      }
    },
    "sessions": [
      {
        "id": "64f8b456c789d012e345f678",
        "deviceId": "550e8400-e29b-41d4-a716-446655440000",
        "current": true,
        "device": {
          "platform": "web",
          "browser": "Chrome",
          "os": "Windows",
          "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        },
        "location": {
          "ipAddress": "192.168.1.100",
          "country": "Colombia",
          "city": "Bogotá",
          "coordinates": {
            "latitude": 4.7110,
            "longitude": -74.0721
          }
        },
        "createdAt": "2025-09-25T14:45:00.000Z",
        "lastActiveAt": "2025-09-25T15:30:00.000Z",
        "expiresAt": "2025-10-02T14:45:00.000Z"
      },
      {
        "id": "64f8c567d890e123f456g789",
        "deviceId": "mobile-device-uuid-123456789",
        "current": false,
        "device": {
          "platform": "mobile",
          "browser": "native",
          "os": "iOS",
          "userAgent": "SIGmaApp/1.0 (iOS 15.0)"
        },
        "location": {
          "ipAddress": "10.0.0.5",
          "country": "Colombia",
          "city": "Medellín"
        },
        "createdAt": "2025-09-24T08:20:00.000Z",
        "lastActiveAt": "2025-09-25T12:15:00.000Z",
        "expiresAt": "2025-10-01T08:20:00.000Z"
      }
    ]
  }
}
```

### ✅ Perfil Básico (sin includes) (200 OK)

```json
{
  "success": true,
  "message": "Perfil de usuario obtenido exitosamente",
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
      "isVerified": true,
      "createdAt": "2025-09-20T10:15:00.000Z",
      "updatedAt": "2025-09-25T14:30:00.000Z",
      "lastLoginAt": "2025-09-25T14:45:00.000Z"
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

### ❌ Usuario No Encontrado (404 Not Found)

```json
{
  "status": 404,
  "code": "USER_NOT_FOUND",
  "message": "El usuario asociado al token no existe",
  "details": {
    "userId": "64f8a123b456c789d012e345",
    "possibleCauses": ["Usuario eliminado", "Token corrupto"]
  }
}
```

### ❌ Usuario Suspendido (403 Forbidden)

```json
{
  "status": 403,
  "code": "USER_SUSPENDED",
  "message": "Tu cuenta ha sido suspendida y no puede acceder al perfil",
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
  "message": "Demasiadas solicitudes al perfil. Intente nuevamente más tarde.",
  "details": {
    "retryAfter": 300,
    "limit": 100,
    "windowMs": 300000
  }
}
```

## 🔄 Flujo de Proceso

1. **Validación de token**: Verificar JWT access token válido y no expirado
2. **Extracción de usuario**: Obtener userId del JWT claims
3. **Verificación de estado**: Confirmar que usuario esté activo
4. **Obtención de perfil base**: Cargar datos básicos del usuario
5. **Procesamiento de includes**: Cargar datos adicionales según parámetros
6. **Filtrado de campos**: Aplicar filtro de campos si se especifica
7. **Enriquecimiento de datos**: Agregar URLs de avatar, datos calculados
8. **Respuesta formateada**: Devolver perfil completo con estructura consistente

## 🔒 Reglas de Negocio

### Estados de Usuario Válidos
- ✅ **active**: Puede acceder a perfil completo
- ✅ **pending_verification**: Acceso limitado a perfil básico
- ❌ **suspended**: No puede acceder al perfil
- ❌ **deleted**: Usuario no existe

### Campos de Información
- **Básicos**: id, email, name, phone, country, city, status
- **Timestamps**: createdAt, updatedAt, lastLoginAt, emailVerifiedAt
- **Configurables**: avatar, tenantType, preferences
- **Calculados**: stats, security info, sessions

### Privacy Levels
- **Public**: Información visible para otros usuarios
- **Private**: Solo visible para el propio usuario
- **Internal**: Solo para uso del sistema
- **Admin**: Solo para administradores

## 🛡️ Seguridad y Privacidad

### Protección de Datos Sensibles
- **Contraseñas**: Nunca incluidas en respuestas
- **Tokens internos**: Filtrados de respuestas
- **Información bancaria**: No expuesta en perfil básico
- **Datos de sesión**: Solo sesión actual por defecto

### Control de Acceso
- **Propio perfil únicamente**: Usuario solo puede ver su propio perfil
- **Token validation**: Verificación estricta de autenticación
- **Rate limiting**: Prevención de scraping de perfiles
- **Audit logging**: Registro de accesos al perfil

### Campos Sensibles (Solo con Permisos)
- **security.lastSecurityEvent**: Requiere include=security
- **sessions**: Lista completa requiere include=sessions
- **stats.detailedActivity**: Análisis detallado de actividad
- **preferences.privacy**: Configuración de privacidad

## 📊 Campos Incluibles

### `include=sessions`
Información detallada de todas las sesiones activas:
- Dispositivos conectados
- Ubicaciones de acceso
- Timestamps de actividad
- Estados de sesión

### `include=preferences`
Configuraciones y preferencias del usuario:
- Idioma e internacionalización
- Configuración de notificaciones
- Preferencias de privacidad
- Configuración de tema y UI

### `include=stats`
Estadísticas de uso y actividad:
- Número de logins totales
- Racha de días consecutivos
- Tiempo promedio de sesión
- Métricas de engagement

### `include=security`
Información de seguridad de la cuenta:
- Estado de 2FA
- Último cambio de contraseña
- Eventos de seguridad recientes
- Número de sesiones activas

## 🧪 Ejemplos de Uso

### Obtener Perfil Básico
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Perfil Completo con Sesiones
```bash
curl -X GET "http://localhost:3000/api/v1/auth/me?include=sessions,stats,security" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Solo Campos Específicos
```bash
curl -X GET "http://localhost:3000/api/v1/auth/me?fields=id,email,name,status,lastLoginAt" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Integración Frontend (JavaScript)
```javascript
// Obtener perfil básico
async function getUserProfile() {
  try {
    const response = await fetch('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data.user;
    }
  } catch (error) {
    console.error('Error loading profile:', error);
  }
}

// Obtener perfil completo con sesiones
async function getFullProfile() {
  try {
    const response = await fetch('/api/v1/auth/me?include=sessions,stats,preferences', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        user: data.data.user,
        sessions: data.data.sessions,
        stats: data.data.stats,
        preferences: data.data.preferences
      };
    }
  } catch (error) {
    console.error('Error loading full profile:', error);
  }
}

// React Hook para perfil de usuario
function useUserProfile(includeOptions = []) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadProfile() {
      const includes = includeOptions.length > 0 ? `?include=${includeOptions.join(',')}` : '';
      
      try {
        const response = await fetch(`/api/v1/auth/me${includes}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setProfile(data.data);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadProfile();
  }, [includeOptions]);
  
  return { profile, loading };
}
```

## 🔍 Casos de Prueba

### Casos Exitosos
- ✅ Obtener perfil básico con token válido
- ✅ Perfil completo con todos los includes
- ✅ Filtrado de campos específicos
- ✅ Perfil de usuario recién verificado

### Casos de Error
- ❌ Acceso con token expirado
- ❌ Token inválido o malformado
- ❌ Usuario eliminado después de login
- ❌ Cuenta suspendida durante sesión activa
- ❌ Include con campos inexistentes

### Casos de Rate Limiting
- 🚫 Más de 100 requests en 5 minutos
- 🚫 Patrones de scraping automatizado
- 🚫 Requests excesivamente frecuentes

## ⚡ Optimizaciones

### Performance
- **Lazy Loading**: Campos include solo se cargan cuando se solicitan
- **Cache de perfiles**: Perfiles cacheados por 5 minutos
- **Database indexes**: Índices optimizados para user lookups
- **Field projection**: Solo campos solicitados se recuperan de BD

### Caching Strategy
- **User base data**: Cache de 5 minutos para datos básicos
- **Sessions data**: Cache de 1 minuto para sesiones
- **Stats calculation**: Cache de 15 minutos para estadísticas
- **Avatar URLs**: Cache de 1 hora para URLs de imágenes

## 📊 Métricas y Monitoreo

### Métricas de Uso
- **Frecuencia de acceso**: Requests por usuario por día
- **Campos más solicitados**: Análisis de parámetros include
- **Tiempo de respuesta**: Latencia promedio por tipo de request
- **Cache hit rate**: Efectividad del caching

### Patrones de Uso
- **Profile checks per session**: Promedio de verificaciones de perfil
- **Include parameters usage**: Distribución de campos solicitados
- **Mobile vs web requests**: Diferencias por plataforma
- **Time-based patterns**: Picos de uso durante el día

### Alertas de Sistema
- **High error rate**: Tasa de errores >5%
- **Slow response time**: Latencia >200ms promedio
- **Unusual access patterns**: Posible scraping o abuso
- **Cache miss spikes**: Problemas con sistema de cache

### Logs de Auditoría
```json
{
  "timestamp": "2025-09-25T15:30:00.000Z",
  "event": "profile_access",
  "userId": "64f8a123b456c789d012e345",
  "email": "usuario@ejemplo.com",
  "include": ["sessions", "stats"],
  "fields": null,
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "responseTime": 125,
  "cacheHit": false,
  "dataSize": 2048
}
```

## 🎯 Mejores Prácticas

### Para Desarrolladores Frontend
- Cachear datos del perfil en estado global de la aplicación
- Usar includes específicos según las necesidades de cada pantalla
- Implementar loading states para mejor UX
- Manejar casos de error gracefully (token expirado, etc.)

### Para Desarrollo Backend
- Implementar paginación para listas largas (ej: sesiones)
- Optimizar queries con field projection
- Mantener consistency en formato de respuestas
- Implementar rate limiting apropiado

### Para Seguridad
- Regular audit de logs de acceso al perfil
- Monitorear patrones anómalos de acceso
- Implementar alertas para accesos sospechosos
- Mantener datos sensibles fuera del perfil básico

### Para Performance
- Usar caching agresivo para datos que no cambian frecuentemente
- Implementar CDN para avatares y recursos estáticos
- Optimizar serialización JSON de respuestas
- Monitorear y optimizar queries N+1

---

**Documentación actualizada**: 25 de septiembre de 2025  
**Versión del endpoint**: v1.0  
**Estado**: ✅ Completamente operativo