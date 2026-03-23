import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
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
})
