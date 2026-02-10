import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { buildSync } from 'esbuild'

// Custom plugin to build Electron main and preload scripts
const electronBuildPlugin = () => ({
  name: 'electron-build',
  closeBundle: () => {
    buildSync({
      entryPoints: ['electron/main.ts', 'electron/preload.ts'],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outdir: 'dist-electron',
      external: ['electron', 'uiohook-napi'],
      format: 'cjs',
    })
    console.log('✓ Electron main & preload built')
  },
})

export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === 'production' && electronBuildPlugin()].filter(Boolean),
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
