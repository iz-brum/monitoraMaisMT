// backend/eslint.config.js

import js from '@eslint/js'
import globals from 'globals'
import complexityPlugin from 'eslint-plugin-complexity'
import sonarjsPlugin from 'eslint-plugin-sonarjs'

export default [
  { ignores: ['dist'] },

  // 🔧 Regras comuns para todo JS
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
        ...globals.browser,
        jest: true,
        test: true,
        expect: true,
        describe: true,
        beforeEach: true,
        it: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module'
      }
    },
    plugins: {
      complexity: complexityPlugin,
      sonarjs: sonarjsPlugin
    },
    rules: {
      ...js.configs.recommended.rules,
      'complexity': ['warn', 15],
      'sonarjs/cognitive-complexity': ['warn', 20],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    }
  },

  // 🧠 Services (CC ≤ 10)
  {
    files: ['**/services/**/*.js'],
    rules: {
      'complexity': ['warn', 10],
      'sonarjs/cognitive-complexity': ['warn', 12],
    }
  },

  // 📦 Controllers (CC ≤ 12)
  {
    files: ['**/controllers/**/*.js'],
    rules: {
      'complexity': ['warn', 12],
      'sonarjs/cognitive-complexity': ['warn', 15],
    }
  },

  // 🔧 Utils/helpers (CC ≤ 5)
  {
    files: ['**/utils/**/*.js'],
    rules: {
      'complexity': ['warn', 5],
      'sonarjs/cognitive-complexity': ['warn', 7],
    }
  },

  // (Opcional) Testes com regras mais relaxadas
  {
    files: ['**/__tests__/**/*.js', '**/*.spec.js'],
    rules: {
      'complexity': 'off',
      'sonarjs/cognitive-complexity': 'off',
    }
  }
];
