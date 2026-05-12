/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleNameMapper: {
    '^next/server$': '<rootDir>/__tests__/__mocks__/next-server.js',
  },
  transform: {
    '^.+\\.js$': ['@swc/jest'],
  },
}
