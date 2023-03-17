/// <reference types="vitest" />

import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        mocha: resolve(__dirname, 'src/mocha/index.ts'),
      },
      name: '@techtrain/junit-parser',
      formats: ['es', 'cjs'],
      fileName: (format, entryName) => {
        return `${format}/${entryName}.${format === 'cjs' ? 'cjs' : 'js'}`
      },
    },
    rollupOptions: {
      external: ['fast-xml-parser', 'he'],
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
