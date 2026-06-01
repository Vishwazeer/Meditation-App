/*
 * File: jest.config.js
 *
 * Description: Jest configuration for React Native test runner, including
 * transform ignore patterns, setup files, and module name mappings.
 *
 * Author: Navnit(Ninjacode911)
 */

module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|@react-navigation|react-native-keychain|react-native-reanimated|nativewind|react-native-css-interop)/'
  ],
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
  },
};
