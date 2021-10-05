module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  ignorePatterns: ['babel.config.js', 'metro.config.js', '.eslintrc.js'],
  plugins: ['@typescript-eslint'],
  extends: ['plugin:@typescript-eslint/recommended', '@react-native-community', '../.eslintrc.js'],
};
