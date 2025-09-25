# 🔐 Endpoint: Register User

## 📋 Información General

| Propiedad         | Valor                     |
| ----------------- | ------------------------- |
| **Método**        | `POST`                    |
| **Ruta**          | `/api/v1/auth/register`   |
| **Autenticación** | No requerida              |
| **Rate Limit**    | 5 intentos por 15 minutos |
| **Versión API**   | v1                        |

## 📖 Descripción

Registra un nuevo usuario en el sistema SIGma, ya sea profesional o empresa. Este endpoint crea un usuario en estado `pending_verification` y envía un código de verificación al email proporcionado.

## 📥 Datos de Entrada (Request Body)

```json
{
  "email": "string",
  "phone": "string",
  "name": "string",
  "country": "string",
  "city": "string",
  "password": "string",
  "tenantType": "professional" | "enterprise"
}
```

### Validaciones de Entrada

| Campo        | Tipo   | Requerido | Validaciones                                                                                                                       |
| ------------ | ------ | --------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `email`      | string | ✅        | - Formato email válido<br>- Máximo 320 caracteres<br>- Único en el sistema                                                         |
| `phone`      | string | ✅        | - Formato internacional: `+[código país][número]`<br>- Ejemplo: `+573001234567`                                                    |
| `name`       | string | ✅        | - Mínimo 2 caracteres<br>- Máximo 100 caracteres<br>- Solo letras, espacios, guiones                                               |
| `country`    | string | ✅        | - Mínimo 2 caracteres<br>- Máximo 50 caracteres                                                                                    |
| `city`       | string | ✅        | - Mínimo 2 caracteres<br>- Máximo 50 caracteres                                                                                    |
| `password`   | string | ✅        | - Mínimo 8 caracteres<br>- Al menos 1 mayúscula<br>- Al menos 1 minúscula<br>- Al menos 1 número<br>- Al menos 1 carácter especial |
| `tenantType` | enum   | ✅        | - `"professional"`: Profesional independiente<br>- `"enterprise"`: Empresa                                                         |

## 📤 Respuestas

### ✅ Registro Exitoso (201 Created)

```json
{
  "success": true,
  "message": "Usuario registrado exitosamente. Se ha enviado un código de verificación a tu email.",
  "data": {
    "user": {
      "id": "64f8a123b456c789d012e345",
      "email": "usuario@ejemplo.com",
      "name": "Juan Pérez",
      "phone": "+573001234567",
      "country": "Colombia",
      "city": "Ibague",
      "tenantType": "professional",
      "status": "pending_verification",
      "createdAt": "2025-09-25T10:30:00.000Z",
      "updatedAt": "2025-09-25T10:30:00.000Z"
    },
    "verificationSent": true,
    "codeExpiresIn": 900
  }
}
```

### ❌ Email ya registrado (409 Conflict)

```json
{
  "status": 409,
  "code": "EMAIL_ALREADY_EXISTS",
  "message": "El email proporcionado ya está registrado en el sistema",
  "details": {
    "field": "email",
    "value": "usuario@ejemplo.com"
  }
}
```

### ❌ Datos inválidos (400 Bad Request)

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Los datos proporcionados no son válidos",
  "details": {
    "errors": [
      {
        "field": "email",
        "message": "El email no tiene un formato válido"
      },
      {
        "field": "password",
        "message": "La contraseña debe tener al menos 8 caracteres"
      }
    ]
  }
}
```

### ❌ Rate Limit Excedido (429 Too Many Requests)

```json
{
  "status": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Demasiados intentos de registro. Intente nuevamente más tarde.",
  "details": {
    "retryAfter": 900,
    "limit": 5,
    "windowMs": 900000
  }
}
```

## 🔄 Flujo de Proceso

1. **Validación de entrada**: Verificación de formato y reglas de negocio
2. **Verificación de unicidad**: Chequeo si el email ya existe
3. **Hash de contraseña**: Encriptación con Argon2id
4. **Creación de usuario**: Almacenamiento en base de datos
5. **Generación de código**: Código de verificación de 5 dígitos
6. **Envío de email**: Código de verificación vía SMTP
7. **Respuesta**: Confirmación de registro exitoso

## 🔒 Reglas de Negocio

### Validaciones de Email

- Formato RFC 5322 compliant
- Dominio válido y existente
- No puede ser email temporal o desechable

### Política de Contraseñas

- Mínimo 8 caracteres, máximo 128
- Al menos una letra mayúscula (A-Z)
- Al menos una letra minúscula (a-z)
- Al menos un número (0-9)
- Al menos un carácter especial (!@#$%^&\*)
- No puede ser una contraseña común

### Tipos de Usuario (tenantType)

- **Professional**: Profesionales independientes, freelancers
- **Enterprise**: Empresas, corporaciones, organizaciones

### Estados de Usuario

- **pending_verification**: Usuario creado, esperando verificación de email
- **active**: Usuario verificado y activo
- **suspended**: Usuario suspendido por administrador

## 🛡️ Seguridad

### Protecciones Implementadas

- **Rate Limiting**: 5 intentos por IP cada 15 minutos
- **Validación de entrada**: Sanitización y validación estricta
- **Hash de contraseña**: Argon2id con salt automático
- **Prevención de enumeración**: Misma respuesta para emails existentes
- **Headers de seguridad**: CORS, CSP, X-Frame-Options

### Logs de Seguridad

- Intentos de registro con emails duplicados
- Intentos de registro con datos malformados
- Excesos de rate limiting
- Fallos en envío de emails

## 📧 Integración con Email

### Plantilla de Email de Verificación

- **Asunto**: "Verifica tu cuenta en SIGma"
- **Código**: 5 dígitos numéricos
- **Expiración**: 15 minutos
- **Límite de intentos**: 3 intentos por código

## 🧪 Ejemplos de Uso

### Registro de Profesional

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "juan.perez@gmail.com",
    "phone": "+573001234567",
    "name": "Juan Pérez García",
    "country": "Colombia",
    "city": "Medellín",
    "password": "MiPassword123!",
    "tenantType": "professional"
  }'
```

### Registro de Empresa

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "contacto@empresa.co",
    "phone": "+571234567890",
    "name": "Tecnologías Avanzadas S.A.S.",
    "country": "Colombia",
    "city": "Bogotá",
    "password": "EmpresaSegura456$",
    "tenantType": "enterprise"
  }'
```

## 🔍 Casos de Prueba

### Casos Exitosos

- ✅ Registro con todos los datos válidos
- ✅ Registro con nombre con tildes y espacios
- ✅ Registro con teléfono de diferentes países

### Casos de Error

- ❌ Email sin formato válido
- ❌ Contraseña muy débil
- ❌ Teléfono sin código de país
- ❌ Campos requeridos faltantes
- ❌ Email ya registrado

## 📊 Métricas y Monitoreo

### Métricas Clave

- **Tiempo de respuesta**: < 200ms promedio
- **Tasa de éxito**: > 95%
- **Emails enviados**: 100% de códigos de verificación
- **Rate limiting**: Activaciones por abuso

### Alertas Configuradas

- Alto número de registros fallidos
- Fallos en envío de emails
- Tiempo de respuesta > 500ms
- Rate limiting excesivo

---

**Documentación actualizada**: 25 de septiembre de 2025  
**Versión del endpoint**: v1.0  
**Estado**: ✅ Completamente operativo
