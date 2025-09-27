#!/usr/bin/env node
/**
 * Script de verificación específica para deployment en Vercel
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificación específica para Vercel\n');

let hasErrors = false;

// 1. Verificar que api/index.ts existe y tiene export default
console.log('📁 Verificando punto de entrada de Vercel:');

const apiIndexPath = path.join(__dirname, '..', 'api', 'index.ts');
if (fs.existsSync(apiIndexPath)) {
  const content = fs.readFileSync(apiIndexPath, 'utf8');
  
  if (content.includes('export default')) {
    console.log('  ✅ api/index.ts tiene export default');
  } else {
    console.log('  ❌ api/index.ts NO tiene export default');
    hasErrors = true;
  }
  
  if (content.includes('@vercel/node')) {
    console.log('  ✅ Importa tipos de @vercel/node');
  } else {
    console.log('  ❌ NO importa tipos de @vercel/node');
    hasErrors = true;
  }
  
  if (content.includes('VercelRequest') && content.includes('VercelResponse')) {
    console.log('  ✅ Usa tipos VercelRequest y VercelResponse');
  } else {
    console.log('  ❌ NO usa tipos correctos de Vercel');
    hasErrors = true;
  }
} else {
  console.log('  ❌ api/index.ts NO existe');
  hasErrors = true;
}

// 2. Verificar que vercel.json está correctamente configurado
console.log('\n☁️  Verificando vercel.json:');
const vercelConfigPath = path.join(__dirname, '..', 'vercel.json');
if (fs.existsSync(vercelConfigPath)) {
  const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
  
  if (vercelConfig.builds && vercelConfig.builds[0] && vercelConfig.builds[0].src === 'api/index.ts') {
    console.log('  ✅ Build apunta a api/index.ts');
  } else {
    console.log('  ❌ Build NO apunta a api/index.ts');
    hasErrors = true;
  }
  
  if (vercelConfig.builds[0] && vercelConfig.builds[0].use === '@vercel/node') {
    console.log('  ✅ Usa @vercel/node runtime');
  } else {
    console.log('  ❌ NO usa @vercel/node runtime');
    hasErrors = true;
  }
  
  if (vercelConfig.routes && vercelConfig.routes.length > 0) {
    console.log('  ✅ Tiene rutas configuradas');
  } else {
    console.log('  ❌ NO tiene rutas configuradas');
    hasErrors = true;
  }
} else {
  console.log('  ❌ vercel.json NO existe');
  hasErrors = true;
}

// 3. Verificar dependencias críticas para Vercel
console.log('\n📦 Verificando dependencias para Vercel:');
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const criticalDeps = {
    '@vercel/node': 'devDependencies',
    'fastify': 'dependencies',
    'dotenv': 'dependencies'
  };
  
  for (const [dep, depType] of Object.entries(criticalDeps)) {
    if (packageJson[depType] && packageJson[depType][dep]) {
      console.log(`  ✅ ${dep} en ${depType}`);
    } else {
      console.log(`  ❌ ${dep} faltante en ${depType}`);
      hasErrors = true;
    }
  }
  
  // Verificar que Node version sea compatible
  if (packageJson.engines && packageJson.engines.node) {
    console.log(`  ✅ Node engine definido: ${packageJson.engines.node}`);
  } else {
    console.log('  ⚠️  Node engine no definido (recomendado)');
  }
}

// 4. Verificar estructura de directorios
console.log('\n📂 Verificando estructura:');
const requiredDirs = ['src', 'api'];
requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    console.log(`  ✅ Directorio ${dir} existe`);
  } else {
    console.log(`  ❌ Directorio ${dir} faltante`);
    hasErrors = true;
  }
});

// 5. Verificar que no hay conflictos de build
console.log('\n🔧 Verificando configuración de build:');
if (!fs.existsSync(path.join(__dirname, '..', 'dist', 'api'))) {
  console.log('  ✅ No hay conflictos con dist/api (correcto para Vercel)');
} else {
  console.log('  ⚠️  Existe dist/api (no necesario para Vercel)');
}

// Resultado final
console.log('\n' + '='.repeat(60));
if (hasErrors) {
  console.log('❌ VERIFICACIÓN FALLÓ - Hay problemas con la configuración de Vercel');
  process.exit(1);
} else {
  console.log('✅ CONFIGURACIÓN DE VERCEL EXITOSA');
  console.log('\n🚀 Tu API está PERFECTAMENTE configurada para Vercel!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. 📤 Haz push de tu código a GitHub');
  console.log('2. 🌐 Conecta tu repo con Vercel');
  console.log('3. ⚙️  Configura las variables de entorno en Vercel');
  console.log('4. 🚀 ¡Despliega!');
  console.log('\n💡 Las variables de entorno están en tu archivo .env local');
}