const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');
const publicDir = path.join(projectRoot, 'public');
const destPublicDir = path.join(standaloneDir, 'public');
const startersDir = path.join(projectRoot, 'vibecode-starters');
const destStartersDir = path.join(standaloneDir, 'vibecode-starters');

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
    console.error('Public folder not found; skipping copy');
  } else if (!fs.existsSync(standaloneDir)) {
    console.error('.next/standalone not found; skipping public copy (non-standalone build)');
  }

  if (fs.existsSync(publicDir) && fs.existsSync(standaloneDir)) {
    console.error('Copying public folder to .next/standalone/public ...');
    if (!fs.existsSync(destPublicDir)) {
      fs.mkdirSync(destPublicDir, { recursive: true });
    }
    copyRecursive(publicDir, destPublicDir);
    console.error('✅ Public folder copied successfully');
  }

  // Copy vibecode-starters if present so templates are available in standalone output
  if (!fs.existsSync(startersDir)) {
    console.error('vibecode-starters not found; skipping copy');
  } else if (!fs.existsSync(standaloneDir)) {
    console.error('.next/standalone not found; skipping vibecode-starters copy (non-standalone build)');
  }

  if (fs.existsSync(startersDir) && fs.existsSync(standaloneDir)) {
    console.error('Copying vibecode-starters to .next/standalone/vibecode-starters ...');
    if (!fs.existsSync(destStartersDir)) {
      fs.mkdirSync(destStartersDir, { recursive: true });
    }
    copyRecursive(startersDir, destStartersDir);
    console.error('✅ vibecode-starters copied successfully');
  }
} catch (err) {
  console.error('Failed to copy public folder:', err);
  process.exit(1);
}
