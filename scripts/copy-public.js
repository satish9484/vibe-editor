const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');
const publicDir = path.join(projectRoot, 'public');
const destPublicDir = path.join(standaloneDir, 'public');

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  if (!fs.existsSync(publicDir)) {
    console.log('Public folder not found; skipping copy');
    process.exit(0);
  }
  if (!fs.existsSync(standaloneDir)) {
    console.log('.next/standalone not found; skipping public copy (non-standalone build)');
    process.exit(0);
  }

  console.log('Copying public folder to .next/standalone/public ...');
  if (!fs.existsSync(destPublicDir)) {
    fs.mkdirSync(destPublicDir, { recursive: true });
  }
  copyRecursive(publicDir, destPublicDir);
  console.log('✅ Public folder copied successfully');
} catch (err) {
  console.error('Failed to copy public folder:', err);
  process.exit(1);
}
