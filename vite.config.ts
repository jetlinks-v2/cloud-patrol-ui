import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// 模块产物保留宿主依赖；宿主集成仍需在 runtime-ui 中按官方模块机制构建。
export default defineConfig({
  plugins: [vue()],
  build: {
    lib: { entry: 'index.ts', formats: ['es'], fileName: 'index' },
    cssCodeSplit: true,
    rollupOptions: {
      external: (id) => !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('\0'),
    },
  },
})
