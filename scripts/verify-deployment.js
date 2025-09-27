#!/usr/bin/env node
/**
 * Script de verificación pre-deployment para SIGma Backend
 * Verifica configuraciones, dependencias y variables de entorno
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración pre-deployment...\n');

let hasErrors = false;

// 1. Verificar archivos esenciales
const requiredFiles = [
  'api/index.ts',
  'vercel.json',
  'package.json',
  'tsconfig.json',
  '.env',
  '.env.example'
];

console.log('📁 Verificando archivos esenciales:');
const rootDir = path.join(__dirname, '..');
requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(rootDir, file))) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - FALTANTE`);
    hasErrors = true;
  }
});

// 2. Verificar variables de entorno
console.log('\n🔧 Verificando variables de entorno:');
const requiredEnvVars = [
  'NODE_ENV',
  'MONGODB_URI',
  'JWT_PRIVATE_KEY',
  'JWT_PUBLIC_KEY',
  'AES_ENCRYPTION_KEY',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS'
];

require('dotenv').config({ path: path.join(rootDir, '.env') });

requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    const value = process.env[envVar];
    const displayValue = envVar.includes('KEY') || envVar.includes('PASS') || envVar.includes('URI') 
      ? value.substring(0, 10) + '...' 
      : value;
    console.log(`  ✅ ${envVar}=${displayValue}`);
  } else {
    console.log(`  ❌ ${envVar} - NO CONFIGURADA`);
    hasErrors = true;
  }
});

// 3. Verificar formato de claves JWT
console.log('\n🔑 Verificando formato de claves JWT:');
if (process.env.JWT_PRIVATE_KEY) {
  if (process.env.JWT_PRIVATE_KEY.includes('BEGIN PRIVATE KEY') || 
      process.env.JWT_PRIVATE_KEY.includes('BEGIN RSA PRIVATE KEY')) {
    console.log('  ✅ JWT_PRIVATE_KEY tiene formato válido');
  } else {
    console.log('  ❌ JWT_PRIVATE_KEY formato inválido');
    hasErrors = true;
  }
}

if (process.env.JWT_PUBLIC_KEY) {
  if (process.env.JWT_PUBLIC_KEY.includes('BEGIN PUBLIC KEY')) {
    console.log('  ✅ JWT_PUBLIC_KEY tiene formato válido');
  } else {
    console.log('  ❌ JWT_PUBLIC_KEY formato inválido');
    hasErrors = true;
  }
}

// 4. Verificar longitud de AES key
if (process.env.AES_ENCRYPTION_KEY) {
  if (process.env.AES_ENCRYPTION_KEY.length >= 32) {
    console.log('  ✅ AES_ENCRYPTION_KEY tiene longitud adecuada');
  } else {
    console.log('  ❌ AES_ENCRYPTION_KEY debe tener al menos 32 caracteres');
    hasErrors = true;
  }
}

// 5. Verificar configuración de MongoDB
console.log('\n🗄️  Verificando configuración de MongoDB:');
if (process.env.MONGODB_URI) {
  if (process.env.MONGODB_URI.startsWith('mongodb://') || 
      process.env.MONGODB_URI.startsWith('mongodb+srv://')) {
    console.log('  ✅ MONGODB_URI tiene formato válido');
  } else {
    console.log('  ❌ MONGODB_URI formato inválido');
    hasErrors = true;
  }
}

// 6. Verificar package.json
console.log('\n📦 Verificando package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  
  const requiredDeps = ['fastify', 'mongoose', 'jsonwebtoken', 'argon2'];
  const requiredDevDeps = ['@vercel/node'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`  ✅ ${dep}@${packageJson.dependencies[dep]}`);
    } else {
      console.log(`  ❌ ${dep} - DEPENDENCIA FALTANTE`);
      hasErrors = true;
    }
  });
  
  requiredDevDeps.forEach(dep => {
    if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
      console.log(`  ✅ ${dep}@${packageJson.devDependencies[dep]} (dev)`);
    } else {
      console.log(`  ❌ ${dep} - DEPENDENCIA DEV FALTANTE`);
      hasErrors = true;
    }
  });
} catch (error) {
  console.log('  ❌ Error leyendo package.json:', error.message);
  hasErrors = true;
}

// 7. Verificar configuración de Vercel
console.log('\n☁️  Verificando configuración de Vercel:');
try {
  const vercelConfig = JSON.parse(fs.readFileSync(path.join(rootDir, 'vercel.json'), 'utf8'));
  
  if (vercelConfig.version === 2) {
    console.log('  ✅ Versión de Vercel correcta');
  }
  
  if (vercelConfig.builds && vercelConfig.builds.length > 0) {
    console.log('  ✅ Configuración de builds presente');
  }
  
  if (vercelConfig.routes && vercelConfig.routes.length > 0) {
    console.log('  ✅ Configuración de rutas presente');
  }
  
  if (vercelConfig.functions && vercelConfig.functions['api/index.ts']) {
    console.log('  ✅ Configuración de funciones presente');
  }
} catch (error) {
  console.log('  ❌ Error leyendo vercel.json:', error.message);
  hasErrors = true;
}

// Resultado final
console.log('\n' + '='.repeat(50));
if (hasErrors) {
  console.log('❌ VERIFICACIÓN FALLÓ - Corrige los errores antes del deployment');
  console.log('\n💡 Consulta DEPLOYMENT.md para más información');
  process.exit(1);
} else {
  console.log('✅ VERIFICACIÓN EXITOSA - Listo para deployment');
  console.log('\n🚀 Puedes proceder con el deployment en Vercel');
  console.log('\nPróximos pasos:');
  console.log('1. Conecta tu repositorio con Vercel');
  console.log('2. Configura las variables de entorno en Vercel');
  console.log('3. Despliega tu aplicación');
}