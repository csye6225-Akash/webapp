

module.exports = {
    //rootDir: __dirname, // or './' if jest.config.js is in the root of the webapp directory
    testEnvironment: 'node',
    roots: ['./test'], // This indicates where Jest should look for test files
    testMatch: ['**/?(*.)+(test).[jt]s'], // Matches test files ending with .test.js
    testPathIgnorePatterns: ['/node_modules/'], // Ignore node_modules directory
  };
  