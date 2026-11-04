import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
export default defineConfig({
  root: fileURLToPath(new URL('./mobile', import.meta.url)),
  base: '/patrol-h5/',
  plugins: [vue()],
  define: { 'import.meta.env.VITE_TOKEN_KEY': JSON.stringify('X-Access-Token') },
  resolve: { dedupe: ['vue', 'vue-i18n'] },
  server: { host: '127.0.0.1', port: 9301, strictPort: true,
    fs: { allow: [fileURLToPath(new URL('.', import.meta.url))] },
    proxy: { '/api': { target: 'http://127.0.0.1:9300', changeOrigin: true } } },
  build: { outDir: '../dist-mobile', emptyOutDir: true },
})
