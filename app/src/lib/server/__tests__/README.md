# Testing Setup for BiiigImageBoard

Welcome to testing! This guide will help you get started with testing your Node.js/SvelteKit backend code.

## What Testing Framework Are We Using?

We use **Vitest** - it's a modern testing framework that works great with JavaScript/TypeScript and is very beginner-friendly.

## How to Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs when you save files)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Basic Test Structure

A test file follows this simple pattern:

```typescript
import { describe, it, expect } from 'vitest';

describe('YourFunctionName', () => {
  it('should do something', () => {
    // 1. Setup (prepare test data)
    const input = 'hello';
    
    // 2. Execute (call the function)
    const result = yourFunction(input);
    
    // 3. Assert (check if result is correct)
    expect(result).toBe('HELLO');
  });
});
```

## Common Test Functions

- `describe('name', () => { ... })` - Groups related tests together
- `it('name', () => { ... })` - A single test case
- `expect(value).toBe(expected)` - Checks if two values are equal
- `expect(value).not.toBe(expected)` - Checks if two values are NOT equal
- `expect(value).toBeTruthy()` - Checks if value is true
- `expect(value).toBeFalsy()` - Checks if value is false
- `expect(value).toEqual(expected)` - Checks if two objects are equal

## Creating Your First Test

1. Create a new file in the `__tests__` directory next to your source file
2. Name it `[filename].test.ts`
3. Import the test functions from vitest
4. Write your test cases

Example:
```typescript
// myFunction.ts
export function add(a: number, b: number) {
  return a + b;
}

// myFunction.test.ts
import { describe, it, expect } from 'vitest';
import { add } from './myFunction';

describe('add', () => {
  it('should add two numbers', () => {
    expect(add(2, 3)).toBe(5);
  });
  
  it('should handle negative numbers', () => {
    expect(add(-1, -2)).toBe(-3);
  });
});
```

## Tips for Beginners

1. **Keep tests simple** - Test one thing at a time
2. **Use clear names** - Your test names should describe what they're testing
3. **Test happy paths first** - Test the normal case before edge cases
4. **Use `describe` blocks** - Organize tests by feature or function
5. **Run tests often** - Run them as you write code to catch errors early

## Need Help?

If you're stuck, look at the existing test files in `app/src/lib/server/models/__tests__/` for examples!
