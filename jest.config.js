module.exports = {
  preset: 'jest-expo',
  verbose: true,
  testMatch: ['**/src/__tests__/**/*.test.ts?(x)'],
  // Exclude the Claude worktrees directory to prevent haste module collisions
  testPathIgnorePatterns: ['/node_modules/', '/.claude/'],
  watchPathIgnorePatterns: ['/.claude/'],
  roots: ['<rootDir>/src'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lottie-react-native)',
  ],
  moduleNameMapper: {
    '^expo-crypto$': '<rootDir>/src/__tests__/__mocks__/expo-crypto.ts',
    // Supabase client: stub out so env vars are not required in unit tests
    '^../lib/supabase$': '<rootDir>/src/__tests__/__mocks__/supabase.ts',
    '^../../lib/supabase$': '<rootDir>/src/__tests__/__mocks__/supabase.ts',
    '^src/lib/supabase$': '<rootDir>/src/__tests__/__mocks__/supabase.ts',
    // AsyncStorage: redirect to the official in-memory Jest mock
    '^@react-native-async-storage/async-storage$': '@react-native-async-storage/async-storage/jest/async-storage-mock',
    // Stub the Expo Winter runtime — it uses import.meta which Jest cannot handle
    '^expo/src/winter/.*': '<rootDir>/src/__tests__/__mocks__/expo-winter-stub.ts',
    '^expo/src/winter$': '<rootDir>/src/__tests__/__mocks__/expo-winter-stub.ts',
  },
};
