import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    // Build tooling runs in Node, not the browser: it reads process.env, exits
    // with a status code and measures byte lengths with Buffer. Under the
    // browser globals above, every one of those is an undefined variable.
    files: ['scripts/**/*.js', '*.config.{js,mjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // These modules are infrastructure rather than Fast Refresh boundaries:
    // Astro island entry points export mounts/HOCs, context modules export
    // their matching hooks, and the router shim intentionally mirrors a
    // library's mixed component/hook API.
    files: [
      'astro/islands/ProductActions.jsx',
      'astro/islands/exitIntentModal.jsx',
      'astro/islands/withProviders.jsx',
      'astro/lib/shims/**/*.jsx',
      'src/context/**/*.jsx',
      'src/i18n/LanguageContext.jsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // Product data is loaded while Astro runs under Node during prerendering.
    files: ['astro/lib/products.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    // Capitalized HOC parameters are rendered as JSX components. ESLint's
    // base unused-variable rule does not infer that use for function args.
    files: ['astro/islands/withProviders.jsx'],
    rules: {
      'no-unused-vars': ['error', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^[A-Z_]',
      }],
    },
  },
])
