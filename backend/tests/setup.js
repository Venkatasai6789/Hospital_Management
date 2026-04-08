// Global test setup
console.log('🔧 Initializing test environment...\n');

//Set timeout for all tests
jest.setTimeout(30000);

// Suppress console warnings during tests (optional)
global.console = {
    ...console,
    // Uncomment to suppress logs
    // log: jest.fn(),
    // warn: jest.fn(),
};
