const fs = require('fs');
const path = require('path');

const standaloneDir = path.join(__dirname, '..', '.next', 'standalone');
const publicDir = path.join(__dirname, '..', 'public');
const destPublicDir = path.join(standaloneDir, 'public');

if (fs.existsSync(standaloneDir)) {
  console.log('Copying public folder to standalone build...');

  // Ensure public directory exists in standalone
  if (!fs.existsSync(destPublicDir)) {
    fs.mkdirSync(destPublicDir, { recursive: true });
  }

  // Copy files recursively
  function copyRecursive(src, dest) {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach(file => {
        copyRecursive(path.join(src, file), path.join(dest, file));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }

  copyRecursive(publicDir, destPublicDir);
  console.log('✅ Public folder copied successfully');
} else {
  console.log('⚠️ Standalone directory not found, skipping public copy');
}
