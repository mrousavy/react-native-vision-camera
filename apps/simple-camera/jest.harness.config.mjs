const config = {
  preset: 'react-native-harness',
  testMatch: ['<rootDir>/__tests__/**/*.harness.{js,jsx,ts,tsx}'],
  setupFilesAfterEnv: ['<rootDir>/harness.setup.ts'],
}

export default config
