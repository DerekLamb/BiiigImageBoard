# Backend Testing with Vitest

This directory contains unit tests for the backend models used in the BiiigImageBoard application. 

## Testing Strategy

We use Vitest as our testing framework with the following approach:

1. **Module Mocking**: We mock the entire module for testing to avoid dependencies on the database and external services.
2. **Unit Testing**: Each model is tested in isolation, focusing on its public API.
3. **Stubbed Dependencies**: We use mock functions to simulate database calls and service interactions.

## How Tests Are Organized

- Tests are located in the `__tests__` directory adjacent to the source files
- Each model has its own test file (e.g., `imageModel.test.ts` for `imageModel.ts`)
- Tests follow the Arrange-Act-Assert pattern

## Running Tests

Run all tests:
```bash
npm test
```

Run a specific test file:
```bash
npx vitest run src/lib/server/models/__tests__/imageModel.test.ts
```

Run tests with coverage reporting:
```bash
npm run test:coverage
```

## Writing New Tests

### 1. Create a Test File

Create a new file named `[modelName].test.ts` in the `__tests__` directory.

### 2. Mock the Dependencies

Setup mocks for any external dependencies using `vi.mock()`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Create mock functions
const mockFindOne = vi.fn();
const mockInsertOne = vi.fn();
// etc.

// Mock the module
vi.mock('../yourModule', () => ({
  YourModule: {
    someMethod: vi.fn(async () => {
      return mockFindOne();
    }),
    // other methods...
  }
}));

// Import the mocked module
import { YourModule } from '../yourModule';
```

### 3. Write Test Cases

Organize tests using `describe` blocks and test cases using `it`:

```typescript
describe('YourModule', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('someMethod', () => {
    it('should do something specific', async () => {
      // Setup
      const mockData = { /* test data */ };
      mockFindOne.mockResolvedValue(mockData);

      // Execute
      const result = await YourModule.someMethod();

      // Assert
      expect(mockFindOne).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    // More test cases...
  });
});
```

## Best Practices

1. Reset mocks in `beforeEach` to ensure test isolation
2. Test both success and failure cases
3. Test edge cases and boundary conditions
4. Keep test descriptions clear and specific
5. Focus on testing behavior, not implementation details
6. Use descriptive variable names in tests

## Notes on Mocking Strategy

We use a direct module mocking approach because:

1. It gives us complete control over the behavior of module methods
2. It avoids complex setup of database connections
3. It makes tests faster and more reliable
4. It allows testing specific scenarios that would be difficult to set up with real dependencies

The downside is that we need to keep the mocks in sync with the real implementation, so when changing the models, make sure to update the corresponding tests.