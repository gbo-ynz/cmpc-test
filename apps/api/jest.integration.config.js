// Integration tests: real PostgreSQL through Testcontainers (requires Docker).
// Kept out of `npm test` and the pre-push hook so unit tests stay fast and Docker-free.
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.int-spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  setupFiles: ['reflect-metadata'],
  // Each spec starts its own container: run them one at a time and allow for image pulls.
  maxWorkers: 1,
  testTimeout: 120_000,
};
