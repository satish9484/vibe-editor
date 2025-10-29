import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const projectRoot = join(__dirname, '..');
const standaloneDir = join(projectRoot, '.next', 'standalone');
const publicDir = join(projectRoot, 'public');
const destPublicDir = join(standaloneDir, 'public');

function copyRecursive(src, dest) {
  const stat = statSync(src);
  if (stat.isDirectory()) {
    if (!existsSync(dest)) {
      mkdirSync(dest, { recursive: true });
    }
    for (const entry of readdirSync(src)) {
      copyRecursive(join(src, entry), join(dest, entry));
    }
  } else {
    copyFileSync(src, dest);
  }
}

try {
  if (!existsSync(publicDir)) {
    console.log('Public folder not found; skipping copy');
    process.exit(0);
  }
  if (!existsSync(standaloneDir)) {
    console.log('.next/standalone not found; skipping public copy (non-standalone build)');
    process.exit(0);
  }

  console.log('Copying public folder to .next/standalone/public ...');
  if (!existsSync(destPublicDir)) {
    mkdirSync(destPublicDir, { recursive: true });
  }
  copyRecursive(publicDir, destPublicDir);
  console.log('✅ Public folder copied successfully');
} catch (err) {
  console.error('Failed to copy public folder:', err);
  process.exit(1);
}
