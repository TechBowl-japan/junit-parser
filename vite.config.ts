/// <reference types="vitest" />

import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: '@techtrain/junit-parser',
      fileName: 'junit-parser',
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [],
      output: {},
    },
  },
  resolve: {
    alias: {
      '~': `${__dirname}/src`,
    },
  },
  test: {
    environment: 'node',
    setupFiles: [],
  },
})
