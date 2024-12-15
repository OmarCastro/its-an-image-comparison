import globals from 'globals'
import neostandard from 'neostandard'
import jsdoc from 'eslint-plugin-jsdoc'
import js from '@eslint/js'
import cspellESLintPluginRecommended from '@cspell/eslint-plugin/recommended'
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
  js.configs.recommended,
  jsdoc.configs['flat/recommended-typescript-flavor'],
  cspellESLintPluginRecommended,
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
      'max-lines-per-function': ['warn', { max: 75, skipComments: true }],
      'jsdoc/tag-lines': ['error', 'any', { startLines: null }],
      '@cspell/spellchecker': 0
    },
  },
  {
    files: ['src/**/*.js'],
    rules: {
      '@cspell/spellchecker': ['warn', {
        cspell: {
          words: [
            'CIEDE', 'NTSC', 'Kotsarenko', 'Vysniauskas', 'Tristimulus', 'Sylvania', 'Ultralume',
            'CIELAB', 'Gaurav', 'Sharma', 'Wencheng', 'Edul', 'Dalal', 'Ultralume',
          ]
        }
      }]
    }
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
    }
  },
]
