import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import { typescript } from 'eslint-config-vizeat'

export default defineConfig(
  globalIgnores([
    'node_modules',
    'dist',
    'coverage',
    'lint-staged.config.js',
    'vite.config.ts',
    'commitlint.config.js',
  ]),
  typescript,
  {
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        ...globals.vitest,
      },
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
    },
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
)
