import globals from 'globals'
import neostandard from 'neostandard'
import jsdoc from 'eslint-plugin-jsdoc'
import eslintPluginUnicorn from 'eslint-plugin-unicorn'

export default [
  {
    ignores: [
      '**/*.min.js',
      '**/build',
      '**/node_modules',
      '**/dist',
    ],
  },
  ...neostandard(),
  jsdoc.configs['flat/recommended-typescript-flavor'],
  {
    plugins: {
      unicorn: eslintPluginUnicorn,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'unicorn/prefer-code-point': ['warn'],
      'unicorn/prefer-string-slice': ['warn'],
      'unicorn/prefer-at': ['warn'],
      'unicorn/prefer-modern-dom-apis': ['warn'],
      'unicorn/no-array-push-push': ['warn'],
      'unicorn/prefer-node-protocol': ['error'],
      'unicorn/prefer-array-find': ['error'],
      'jsdoc/valid-types': 0,
      'jsdoc/require-returns': ['warn', { publicOnly: true }],
      'max-lines-per-function': ['warn', 75],
      'jsdoc/tag-lines': ['error', 'any', { startLines: null }]
    },
  }, {
    files: [
      '**/*.spec.js',
      '**/*.spec.ts',
    ],
    rules: {
      'jsdoc/require-param-description': 0,
      'jsdoc/require-returns': 0,
      'jsdoc/require-returns-description': 0,
      '@cspell/spellchecker': 0,
      'max-lines-per-function': 0,
    }
  },
]
