import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'

export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    tailwindcss(),
    Components({
      resolvers: [PrimeVueResolver()]
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'https://metschoo-ils.my.id',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
