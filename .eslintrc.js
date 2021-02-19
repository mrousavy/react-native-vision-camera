module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  globals: {
    Logger: true,
    performance: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'react', 'react-native', '@react-native-community', 'prettier', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
    '@react-native-community',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // eslint
    semi: 'off',
    curly: ['warn', 'multi-or-nest', 'consistent'],
    'no-mixed-spaces-and-tabs': ['warn', 'smart-tabs'],
    'no-async-promise-executor': 'warn',
    'require-await': 'warn',
    'no-return-await': 'warn',
    'no-await-in-loop': 'warn',
    'comma-dangle': 'off', // prettier already detects this
    'no-restricted-syntax': [
      'error',
      {
        selector: 'TSEnumDeclaration',
        message: "Enums have various disadvantages, use TypeScript's union types instead.",
      },
    ],
    // prettier
    'prettier/prettier': ['warn'],
    // typescript
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
      },
    ],
    '@typescript-eslint/no-namespace': 'off',
    // react plugin
    'react/no-unescaped-entities': 'off',
    // react native plugin
    'react-native/no-unused-styles': 'warn',
    'react-native/split-platform-components': 'warn',
    'react-native/no-inline-styles': 'warn',
    'react-native/no-color-literals': 'warn',
    'react-native/no-raw-text': 'off',
    'react-native/no-single-element-style-arrays': 'warn',

    // react hooks
    'react-hooks/exhaustive-deps': [
      'warn',
      {
        additionalHooks: '(useDerivedValue|useAnimatedStyle|useAnimatedProps|useWorkletCallback)',
      },
    ],
  },
  env: {
    node: true,
    'react-native/react-native': true,
  },
  settings: {
    react: {
      version: 'latest',
    },
    'import/resolver': {
      extensions: [
        '.js',
        '.jsx',
        '.ts',
        '.tsx',
        '.d.ts',
        '.android.js',
        '.android.jsx',
        '.android.ts',
        '.android.tsx',
        '.ios.js',
        '.ios.jsx',
        '.ios.ts',
        '.ios.tsx',
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
      ],
    },
  },
};
