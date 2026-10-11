module.exports = {
  ...require('./jest.config.cjs'),
  testEnvironment: 'node',
  setupFilesAfterEnv: [],
  testMatch: ['**/EndtoEnd.test.js'],
};
