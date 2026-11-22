module.exports = {
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: ['<rootDir>/src/tests/sistema/**/*.sistema.test.js'],
  setupFiles: ['<rootDir>/src/tests/sistema/ambiente.js'],
  globalSetup: '<rootDir>/src/tests/sistema/preparoBanco.js',
  testTimeout: 30000,
  maxWorkers: 1,
};
