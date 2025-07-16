import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import vitest from '@vitest/eslint-plugin'
import pluginJs from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  // ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      'simple-import-sort': eslintPluginSimpleImportSort,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },
  },
  // js
  pluginJs.configs.recommended,
  {
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-console': ['warn'],
      curly: ['error', 'all'],
    },
  },
  // ts
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['node_modules', '.output', 'dist', 'src/components/shadcn'],
  },

  reactHooks.configs['recommended-latest'],
]

export default eslintConfig
