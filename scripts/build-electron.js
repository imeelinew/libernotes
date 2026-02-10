const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');

const rootDir = path.join(__dirname, '..');

async function build() {
  try {
    await esbuild.build({
      entryPoints: [
        path.join(rootDir, 'electron', 'main.ts'),
        path.join(rootDir, 'electron', 'preload.ts'),
      ],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outdir: path.join(rootDir, 'dist-electron'),
      external: ['electron', 'uiohook-napi'],
      format: 'cjs',
    });

    // Copy icon to dist-electron
    const iconSource = path.join(rootDir, 'build', 'icon.ico');
    const iconDest = path.join(rootDir, 'dist-electron', 'icon.ico');
    if (fs.existsSync(iconSource)) {
      fs.copyFileSync(iconSource, iconDest);
      console.log('✓ Icon copied to dist-electron');
    }

    console.log('✓ Electron build complete');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
