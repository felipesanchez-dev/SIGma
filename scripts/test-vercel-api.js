// Test de la API para simular entorno de Vercel
const { exec } = require('child_process');
const path = require('path');

console.log('🧪 Simulando compilación de Vercel...\n');

// Simular compilación con tsx (similar a como Vercel maneja TypeScript)
exec('npx tsx api/index.ts', { 
  cwd: path.join(__dirname, '..'),
  timeout: 10000 
}, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Error durante la simulación:', error.message);
    return;
  }
  
  if (stderr) {
    console.log('⚠️  Warnings:', stderr);
  }
  
  if (stdout) {
    console.log('📤 Output:', stdout);
  }
  
  console.log('✅ Simulación completada');
});