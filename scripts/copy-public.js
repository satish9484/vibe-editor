const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');
const standaloneDir = path.join(projectRoot, '.next', 'standalone');
const nextDir = path.join(projectRoot, '.next');
const publicDir = path.join(projectRoot, 'public');
const startersDir = path.join(projectRoot, 'vibecode-starters');

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
  // Handle standalone builds (Docker)
  if (fs.existsSync(standaloneDir)) {
    const destPublicDir = path.join(standaloneDir, 'public');
    const destStartersDir = path.join(standaloneDir, 'vibecode-starters');

    if (fs.existsSync(publicDir)) {
      console.error('Copying public folder to .next/standalone/public ...');
      if (!fs.existsSync(destPublicDir)) {
        fs.mkdirSync(destPublicDir, { recursive: true });
      }
      copyRecursive(publicDir, destPublicDir);
      console.error('✅ Public folder copied successfully');
    }

    if (fs.existsSync(startersDir)) {
      console.error('Copying vibecode-starters to .next/standalone/vibecode-starters ...');
      if (!fs.existsSync(destStartersDir)) {
        fs.mkdirSync(destStartersDir, { recursive: true });
      }
      copyRecursive(startersDir, destStartersDir);
      console.error('✅ vibecode-starters copied successfully');
    }
  }

  // Handle Vercel/non-standalone builds
  // NOTE: For Vercel, we do NOT copy vibecode-starters to avoid exceeding serverless function size limits
  // The template API will use fallback templates instead
  if (fs.existsSync(nextDir) && !fs.existsSync(standaloneDir)) {
    const isVercel = process.env.VERCEL === '1';
    if (isVercel) {
      console.error('Vercel build detected: Skipping vibecode-starters copy to reduce serverless function size');
      console.error('Template API will use built-in fallback templates');
    } else {
      // Only copy for local/non-Vercel builds
      const destStartersDir = path.join(nextDir, 'vibecode-starters');
      if (fs.existsSync(startersDir)) {
        console.error('Copying vibecode-starters to .next/vibecode-starters for local deployment...');
        if (!fs.existsSync(destStartersDir)) {
          fs.mkdirSync(destStartersDir, { recursive: true });
        }
        copyRecursive(startersDir, destStartersDir);
        console.error('✅ vibecode-starters copied successfully to .next/vibecode-starters');
      } else {
        console.error('vibecode-starters not found; skipping copy');
      }
    }
  }
} catch (err) {
  console.error('Failed to copy files:', err);
  process.exit(1);
}
