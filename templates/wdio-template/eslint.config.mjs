import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { fileURLToPath } from 'node:url';

import architecturePlugin from './lint/architecture-plugin.cjs';

const configDirectory = fileURLToPath(new globalThis.URL('.', import.meta.url));

export default [
  {
    ignores: [
      'node_modules/**',
      'reports/**',
      'allure-results/**',
      'allure-report/**',
      'test-results/**',
      'playwright-report/**'
    ]
  },
  js.configs.recommended,
  {
    files: ['demo-apps/**/*.js'],
    languageOptions: {
      globals: {
        __dirname: 'readonly',
        console: 'readonly',
        module: 'readonly',
        process: 'readonly',
        require: 'readonly',
        URL: 'readonly'
      }
    }
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: configDirectory
      },
      globals: {
        browser: 'readonly',
        console: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        process: 'readonly',
        URL: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      architecture: architecturePlugin
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow'
        },
        {
          selector: 'typeLike',
          format: ['PascalCase']
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase']
        },
        {
          selector: 'objectLiteralProperty',
          modifiers: ['requiresQuotes'],
          format: null
        }
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-empty-pattern': 'off',
      'architecture/no-raw-locators-in-tests': 'error',
      'architecture/no-wait-for-timeout': 'error',
      'architecture/no-expect-in-page-objects': 'error'
    }
  }
];
