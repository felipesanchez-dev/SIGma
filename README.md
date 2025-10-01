# SIGma (Σ) - Sistema de Gestión Modular

## 🎯 Descripción del Proyecto

SIGma es una plataforma SaaS/PaaS escalable y segura desarrollada con arquitectura modular, diseñada siguiendo las mejores prácticas de seguridad (NTC-ISO/IEC 27017) y utilizando tecnologías modernas.

## 🏗️ Arquitectura

### Capas Implementadas

- **Domain Layer**: Entidades de negocio, Value Objects y reglas de dominio
- **Application Layer**: Casos de uso y ports (interfaces)
- **Infrastructure Layer**: Adaptadores para bases de datos, servicios externos
- **Interface Layer**: Controllers HTTP/HTTPS y middlewares

### Tecnologías Principales

- **Runtime**: Node.js >= 18 con TypeScript
- **Framework Web**: Fastify (alta escalabilidad)
- **Base de datos**: MongoDB con Mongoose
- **Cache**: Redis con ioredis
- **Seguridad**:
  - Hashing: Argon2 con parámetros seguros
  - JWT: RS256 con claves asimétricas
  - Encriptación: AES-GCM para datos sensibles
- **Email**: Nodemailer con SMTP seguro

## 🔐 Características de Seguridad

### Autenticación y Autorización
- Contraseñas con validación robusta (mín. 12 caracteres, complejidad)
- Hashing con Argon2id (64MB memoria, 3 iteraciones)
- JWT con RS256 y claves asimétricas rotables
- Verificación por email con códigos de 5 dígitos (15 min expiración)
- Control de sesiones concurrentes (máx. 4 por usuario)
- Bloqueo automático tras 5 intentos fallidos (30 min)

### Cifrado y Protección de Datos
- Encriptación E2E con AES-GCM para datos sensibles
- Soporte opcional para KMS (AWS/GCP)
- Conexiones TLS 1.2+ obligatorias
- Validación estricta de entrada de datos

### Cumplimiento y Auditoría
- Logging estructurado para auditoría
- Métricas integradas (Prometheus/Grafana)
- Documentación de decisiones de seguridad
- Checklist NTC-ISO/IEC 27017

## 🚀 Funcionalidades Implementadas

### Core Authentication
- ✅ **POST /api/v1/auth/register**: Registro de usuario (profesional/empresa)
- ✅ **POST /api/v1/auth/verify**: Verificación por código de email
- ✅ **POST /api/v1/auth/login**: Autenticación con control de sesiones
- ✅ **POST /api/v1/auth/refresh**: Renovación de tokens
- ✅ **POST /api/v1/auth/logout**: Cierre de sesión individual o masivo

### Multi-tenant Support
- Soporte para tipos: "profesional" y "empresa"
- Campos personalizados según tipo de tenant
- Aislamiento de datos por organización

## 📊 Estado del Proyecto (60% Completado)

### ✅ Completado
- Diseño de arquitectura modular
- Domain Layer con entidades y value objects
- Application Layer con casos de uso
- Infrastructure Layer (servicios principales)
- Configuración de desarrollo (TypeScript, ESLint, Jest)
- Modelos de base de datos (MongoDB/Mongoose)

### 🚧 En Progreso
- Implementación de repositorios
- Configuración de Redis para cache
- Controllers HTTP con Fastify
- Middlewares de autenticación y validación

### ⏳ Pendiente
- Configuración de contenedores (Docker)
- Pipeline CI/CD (GitHub Actions)
- Testing completo (Unit + E2E)
- Documentación OpenAPI/Swagger
- Scripts de seed y utilidades
- Configuración de métricas y monitoring

## 🛠️ Instalación y Desarrollo

### Prerrequisitos
```bash
Node.js >= 18.0.0
MongoDB >= 5.0
Redis >= 6.0
```

### Configuración
1. Clonar repositorio
2. Instalar dependencias: `npm install`
3. Copiar `.env.example` a `.env` y configurar variables
4. Generar claves JWT: `npm run generate-keys`
5. Iniciar servicios: `npm run docker:dev`
6. Ejecutar migraciones: `npm run seed`

### Scripts Disponibles
```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Compilar para producción
npm run test         # Tests unitarios
npm run test:e2e     # Tests end-to-end
npm run lint         # Verificar código
npm run format       # Formatear código
```

## 🔒 Configuración de Seguridad

### Variables de Entorno Críticas
```env
# JWT Keys (generar con OpenSSL)
JWT_PRIVATE_KEY=     # Clave privada RSA 2048-bit
JWT_PUBLIC_KEY=      # Clave pública RSA

# Argon2 Configuration
ARGON2_MEMORY_SIZE=65536    # 64MB
ARGON2_TIME_COST=3          # 3 iteraciones
ARGON2_PARALLELISM=1        # 1 hilo

# AES Encryption
AES_ENCRYPTION_KEY=         # 32 caracteres
```

### Rotación de Claves JWT
1. Generar nuevas claves asimétricas
2. Actualizar variable `JWT_PRIVATE_KEY`
3. Mantener clave pública anterior por periodo de gracia
4. Migrar gradualmente usuarios activos

## 🚢 Despliegue en Render

### Configuración del Servicio Web

1. **Crear un nuevo Web Service** en [Render](https://render.com)
2. **Conectar tu repositorio** de GitHub/GitLab
3. **Configurar los comandos de build y start**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

### Variables de Entorno Requeridas

Configura las siguientes variables de entorno en el dashboard de Render:

```env
NODE_ENV=production
MONGODB_URI=tu_conexion_mongodb
JWT_PRIVATE_KEY=tu_clave_privada_rsa
JWT_PUBLIC_KEY=tu_clave_publica_rsa
SMTP_HOST=tu_smtp_host
SMTP_PORT=587
SMTP_USER=tu_smtp_user
SMTP_PASS=tu_smtp_password
SMTP_FROM=noreply@tudominio.com
AES_ENCRYPTION_KEY=tu_clave_aes_32_caracteres
ARGON2_MEMORY_SIZE=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=1
```

### Notas Importantes

- El puerto es asignado automáticamente por Render a través de la variable `PORT`
- La aplicación escucha en `0.0.0.0` para aceptar conexiones externas
- Asegúrate de que tu base de datos MongoDB sea accesible desde Render
- Redis puede ser configurado usando el add-on de Redis de Render

## 👥 Equipo de Desarrollo

Este proyecto ha sido desarrollado siguiendo las mejores prácticas de ingeniería de software y arquitectura empresarial, con enfoque en seguridad, escalabilidad y mantenibilidad.

---

**© 2025 SIGma System - Todos los derechos reservados**