import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { offlineAssets } from './build/offline.ts'
import { contentStudio } from './build/studio'

export default defineConfig(({ command, mode }) => ({
  // Root on localhost; a Pages build supplies its actual project/custom-domain path.
  base: process.env.STUDY990_BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss(),
    offlineAssets(),
    ...(command === 'serve' && mode === 'content-studio' ? [contentStudio()] : []),
  ],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true, host: '127.0.0.1' },
  build: { target: 'es2022', manifest: true },
}))
