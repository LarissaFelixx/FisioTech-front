// Testes de contrato contra o backend real: `npm run test:contract` (veja o README).
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/contract/**/*.contract.test.ts'],
};
