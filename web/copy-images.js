const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '..', 'data', 'imagenes_categorias');
const destDir = path.join(__dirname, 'public', 'imagenes_categorias');

console.log('Checking for local images in data folder...');

if (!fs.existsSync(srcDir)) {
  console.log('Local data/imagenes_categorias directory not found. Skipping auto-copy (this is normal in Vercel/production).');
  process.exit(0);
}

function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach((childItemName) => {
      copyRecursive(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    // Only copy if it's a file and not desktop.ini
    if (path.basename(src).toLowerCase() !== 'desktop.ini') {
      fs.copyFileSync(src, dest);
      console.log(`Copied: ${path.relative(srcDir, src)} -> ${path.relative(destDir, dest)}`);
    }
  }
}

try {
  copyRecursive(srcDir, destDir);
  console.log('Images sync completed successfully.');
} catch (error) {
  console.error('Error copying images:', error);
}
