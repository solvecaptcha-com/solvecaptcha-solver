import { defineConfig, mergeConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { join, resolve } from 'path';
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest';

// https://vitejs.dev/config/
export default
defineConfig({
  // prevent src/ prefix on extension urls
  root: resolve(__dirname, 'src'),
  base: "./",
  build: {
    outDir: resolve(__dirname, 'extension/app'),
    rollupOptions: {
      input: {
        // see web_accessible_resources in the manifest config
        app: join(__dirname, 'src/index.html'),
      },
      output: {
        manualChunks: undefined,
        entryFileNames: () => {
          return '[name]-[hash].js';
        }
      },
    },
  },
  plugins: [
    react(),
    cssInjectedByJsPlugin()
    // crx({ manifest })
  ],
})
