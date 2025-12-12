import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    rolldownOptions: {
      input: {
        main: 'index.html',
        help: 'help.html'
      }
    }
  },
  // proxy to local server for api calls during development
  server: {
    proxy: {
      '/api': 'http://nas.lan:9090'
    }
  }
})
