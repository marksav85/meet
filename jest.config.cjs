module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  transform: { '^.+\\.[jt]sx?$': 'babel-jest' },
  moduleNameMapper: { '\\.(css)$': '<rootDir>/scripts/test-style-mock.cjs' },
  testTimeout: 30000,
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/index.jsx', '!src/setupTests.js', '!src/mock-data.js', '!src/test-utils.js', '!src/serviceWorkerRegistration.js'],
};
