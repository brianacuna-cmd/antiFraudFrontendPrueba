import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@app': fileURLToPath(new URL('./src/app', import.meta.url)),
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@features': fileURLToPath(new URL('./src/features', import.meta.url)),
    },
    dedupe: ['monaco-editor', 'react', 'react-dom'],
  },
  server: {
    warmup: {
      clientFiles: ['./src/features/rules/ui/JdmEditor.tsx', './src/main.tsx'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['@gorules/jdm-editor', 'monaco-editor', '@monaco-editor/react'],
    exclude: ['@gorules/zen-engine-wasm'],
  },
  assetsInclude: ['**/*.wasm'],
})
