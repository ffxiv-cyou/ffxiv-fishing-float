import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
  ssr: {
    noExternal: ['pinyinlite']
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      input: {
        main: 'index.html',
        'web': 'web/index.html',
      },
      output: [
        {
          name: 'web',
        },
      ]
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:9090',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})
