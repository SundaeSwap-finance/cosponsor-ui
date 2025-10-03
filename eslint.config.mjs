// dirname and __filename not needed for current config
import eslintPluginSimpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import vitest from '@vitest/eslint-plugin'
import reactHooks from 'eslint-plugin-react-hooks'
import { configs as sundaeConfigs } from '@sundaeswap/eslint-config'

const eslintConfig = [
  ...sundaeConfigs,
  {
    plugins: {
      'simple-import-sort': eslintPluginSimpleImportSort,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...vitest.environments.env.globals,
      },
    },
    rules: {
      'no-console': ['warn', { allow: ['error', 'warn'] }],
      curly: ['error', 'all'],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    ignores: ['node_modules', '.output', 'dist', 'src/components/shadcn', 'src/lib/cosponsor-sdk'],
  },
]

export default eslintConfig
