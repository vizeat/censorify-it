// Configure Vitest (https://vitest.dev/config/)
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'censorify-it',
      formats: ['es', 'cjs'],
      // the package is an ES module: the CommonJS build needs the .cjs extension to be loaded as such
      fileName: (format) => (format === 'cjs' ? 'censorify-it.cjs' : 'censorify-it.js'),
    },
    sourcemap: true,
    rollupOptions: {
      external: ['linkify-it'],
      // the class is both the default export and a named one: `require('censorify-it').default` keeps working
      output: { exports: 'named' },
    },
  },
  plugins: [dts({ tsconfigPath: './tsconfig.json', bundleTypes: true })],
  test: {
    globals: true,
    reporters: process.env.GITHUB_ACTIONS ? ['dot', 'junit', 'github-actions'] : ['dot'],
    coverage: {
      reporter: ['text-summary', 'lcov', 'clover'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
    },
    outputFile: process.env.GITHUB_ACTIONS ? 'test-report.junit.xml' : undefined,
  },
})
