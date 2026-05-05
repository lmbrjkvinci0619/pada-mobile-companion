module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind|tailwindcss|react-native-reanimated|react-native-worklets-core|react-native-worklets)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^expo$': '<rootDir>/__mocks__/expo.js',
    '^expo/src/winter$': '<rootDir>/__mocks__/expoWinter.js',
    '^react-native-mmkv$': '<rootDir>/__mocks__/react-native-mmkv.js',
  },
  setupFiles: ['./jest.setup.js'],
};
