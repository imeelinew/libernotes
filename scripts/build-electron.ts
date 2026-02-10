import type { BuildOptions } from 'esbuild';
import { build } from 'esbuild';
import path from 'path';

export function buildElectron() {
  return {
    name: 'build-electron',
    closeBundle: async () => {
      const buildOptions: BuildOptions = {
        entryPoints: [
          path.resolve(__dirname, 'electron/main.ts'),
          path.resolve(__dirname, 'electron/preload.ts'),
        ],
        bundle: true,
        platform: 'node',
        target: 'node20',
        outdir: path.resolve(__dirname, 'dist-electron'),
        external: ['electron'],
        format: 'cjs',
      };

      await build(buildOptions);
      console.log('Electron build complete');
    },
  };
}
