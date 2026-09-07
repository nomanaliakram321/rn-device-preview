module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.js'],
  // The example/ directory is its own standalone RN app (its own
  // package.json, node_modules, jest config) scaffolded for manual
  // simulator testing — it is not part of this library's test suite and
  // its own Jest environment isn't wired up under the root config.
  testPathIgnorePatterns: ['/node_modules/', '<rootDir>/example/'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-async-storage)/)',
  ],
};
