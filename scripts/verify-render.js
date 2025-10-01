#!/usr/bin/env node

/**
 * Script de Verificación Pre-Deployment para Render
 * Ejecutar: node scripts/verify-render.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const packageJsonPath = path.join(rootDir, 'package.json');
const tsconfigPath = path.join(rootDir, 'tsconfig.json');

console.log('🔍 Verificando configuración para Render...\n');

let errors = 0;
let warnings = 0;

// 1. Verificar package.json
console.log('📦 Verificando package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (packageJson.scripts.build === 'tsc && tsc-alias') {
    console.log('  ✅ Script "build" correcto');
  } else {
    console.log('  ❌ Script "build" debe ser "tsc && tsc-alias"');
    errors++;
  }
  
  if (packageJson.scripts.start === 'node dist/index.js') {
    console.log('  ✅ Script "start" correcto');
  } else {
    console.log('  ❌ Script "start" debe ser "node dist/index.js"');
    errors++;
  }
  
  if (packageJson.main === 'dist/index.js') {
    console.log('  ✅ Campo "main" correcto');
  } else {
    console.log('  ⚠️  Campo "main" debería ser "dist/index.js"');
    warnings++;
  }

  // Verificar que NO haya dependencias de Vercel
  if (packageJson.devDependencies && packageJson.devDependencies['@vercel/node']) {
    console.log('  ❌ Encontrada dependencia de Vercel: @vercel/node');
    console.log('     Ejecuta: npm uninstall @vercel/node');
    errors++;
  } else {
    console.log('  ✅ Sin dependencias de Vercel');
  }

  // Verificar engines
  if (packageJson.engines && packageJson.engines.node) {
    console.log(`  ✅ Node version especificada: ${packageJson.engines.node}`);
  } else {
    console.log('  ⚠️  No se especifica versión de Node (recomendado)');
    warnings++;
  }
} catch (error) {
  console.log(`  ❌ Error leyendo package.json: ${error.message}`);
  errors++;
}

// 2. Verificar tsconfig.json
console.log('\n⚙️  Verificando tsconfig.json:');
try {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  if (tsconfig.compilerOptions.outDir === './dist') {
    console.log('  ✅ outDir correcto: ./dist');
  } else {
    console.log(`  ❌ outDir debe ser "./dist", actual: ${tsconfig.compilerOptions.outDir}`);
    errors++;
  }
} catch (error) {
  console.log(`  ❌ Error leyendo tsconfig.json: ${error.message}`);
  errors++;
}

// 3. Verificar src/index.ts
console.log('\n📄 Verificando src/index.ts:');
try {
  const indexTs = fs.readFileSync(path.join(rootDir, 'src', 'index.ts'), 'utf8');
  
  if (indexTs.includes('@vercel/node')) {
    console.log('  ❌ Importa tipos de Vercel (@vercel/node)');
    errors++;
  } else {
    console.log('  ✅ Sin imports de Vercel');
  }
  
  if (indexTs.includes('process.env.PORT')) {
    console.log('  ✅ Usa process.env.PORT');
  } else {
    console.log('  ⚠️  No usa process.env.PORT (recomendado para Render)');
    warnings++;
  }
  
  if (indexTs.includes('0.0.0.0')) {
    console.log('  ✅ Escucha en 0.0.0.0');
  } else {
    console.log('  ⚠️  Debería escuchar en 0.0.0.0 para Render');
    warnings++;
  }
  
  if (indexTs.includes('bootstrap()')) {
    console.log('  ✅ Llama a bootstrap() para iniciar');
  } else {
    console.log('  ❌ No encuentra llamada a bootstrap()');
    errors++;
  }
} catch (error) {
  console.log(`  ❌ Error leyendo src/index.ts: ${error.message}`);
  errors++;
}

// 4. Intentar build local
console.log('\n🔨 Intentando build local:');
try {
  // Limpiar dist si existe
  if (fs.existsSync(distDir)) {
    console.log('  🗑️  Limpiando directorio dist/...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  
  console.log('  📦 Ejecutando: npm run build...');
  execSync('npm run build', { 
    cwd: rootDir, 
    stdio: 'pipe',
    encoding: 'utf8'
  });
  
  console.log('  ✅ Build exitoso');
  
  // Verificar que dist/index.js existe
  const distIndexPath = path.join(distDir, 'index.js');
  if (fs.existsSync(distIndexPath)) {
    console.log('  ✅ dist/index.js generado correctamente');
  } else {
    console.log('  ❌ dist/index.js NO fue generado');
    errors++;
  }
  
  // Contar archivos en dist/
  const countFiles = (dir) => {
    let count = 0;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        count += countFiles(fullPath);
      } else {
        count++;
      }
    });
    return count;
  };
  
  const fileCount = countFiles(distDir);
  console.log(`  ℹ️  ${fileCount} archivos generados en dist/`);
  
} catch (error) {
  console.log('  ❌ Build falló:');
  console.log(error.stdout || error.message);
  errors++;
}

// 5. Verificar variables de entorno
console.log('\n🔐 Verificando variables de entorno (.env):');
const envPath = path.join(rootDir, '.env');
if (fs.existsSync(envPath)) {
  console.log('  ✅ Archivo .env existe');
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NODE_ENV',
    'MONGODB_URI',
    'JWT_PRIVATE_KEY',
    'JWT_PUBLIC_KEY',
    'SMTP_HOST',
    'SMTP_USER',
    'SMTP_PASS',
    'AES_ENCRYPTION_KEY'
  ];
  
  const missingVars = requiredVars.filter(v => !envContent.includes(v + '='));
  
  if (missingVars.length === 0) {
    console.log('  ✅ Todas las variables críticas están presentes');
  } else {
    console.log(`  ⚠️  Variables faltantes en .env: ${missingVars.join(', ')}`);
    console.log('     (Asegúrate de configurarlas en Render)');
    warnings++;
  }
  
  // Verificar formato de claves JWT
  if (envContent.includes('JWT_PRIVATE_KEY=') && 
      envContent.includes('-----BEGIN RSA PRIVATE KEY-----')) {
    console.log('  ✅ JWT_PRIVATE_KEY tiene formato correcto');
  } else {
    console.log('  ❌ JWT_PRIVATE_KEY no tiene el formato correcto');
    console.log('     Debe empezar con: -----BEGIN RSA PRIVATE KEY-----');
    errors++;
  }
  
  if (envContent.includes('JWT_PUBLIC_KEY=') && 
      envContent.includes('-----BEGIN PUBLIC KEY-----')) {
    console.log('  ✅ JWT_PUBLIC_KEY tiene formato correcto');
  } else {
    console.log('  ❌ JWT_PUBLIC_KEY no tiene el formato correcto');
    console.log('     Debe empezar con: -----BEGIN PUBLIC KEY-----');
    errors++;
  }
} else {
  console.log('  ⚠️  No se encuentra .env (OK para producción)');
  console.log('     Asegúrate de configurar las variables en Render');
}

// 6. Verificar .gitignore
console.log('\n📝 Verificando .gitignore:');
const gitignorePath = path.join(rootDir, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  
  if (gitignore.includes('.env')) {
    console.log('  ✅ .env está en .gitignore');
  } else {
    console.log('  ❌ .env NO está en .gitignore (CRÍTICO)');
    errors++;
  }
  
  if (gitignore.includes('node_modules')) {
    console.log('  ✅ node_modules está en .gitignore');
  } else {
    console.log('  ⚠️  node_modules debería estar en .gitignore');
    warnings++;
  }
} else {
  console.log('  ⚠️  No se encuentra .gitignore');
  warnings++;
}

// Resumen final
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN DE VERIFICACIÓN\n');

if (errors === 0 && warnings === 0) {
  console.log('✅ ¡TODO PERFECTO! El proyecto está listo para Render.');
  console.log('\n📋 Siguiente paso:');
  console.log('   1. Sube los cambios a GitHub');
  console.log('   2. En Render Dashboard:');
  console.log('      - Build Command: npm install && npm run build');
  console.log('      - Start Command: npm start');
  console.log('   3. Configura las variables de entorno en Render');
  console.log('   4. Deploy!');
} else {
  if (errors > 0) {
    console.log(`❌ ${errors} error(es) encontrado(s)`);
  }
  if (warnings > 0) {
    console.log(`⚠️  ${warnings} advertencia(s)`);
  }
  console.log('\n👆 Corrige los errores antes de desplegar en Render');
}

console.log('='.repeat(60));

process.exit(errors > 0 ? 1 : 0);
