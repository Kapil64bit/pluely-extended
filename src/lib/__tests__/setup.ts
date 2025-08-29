// Test setup and global declarations

// Global test functions (Jest-like API)
declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function beforeAll(fn: () => void): void;
  function afterAll(fn: () => void): void;
  
  namespace jest {
    interface Matchers<R> {
      toBe(expected: any): R;
      toEqual(expected: any): R;
      toBeGreaterThan(expected: number): R;
      toBeLessThan(expected: number): R;
      toBeGreaterThanOrEqual(expected: number): R;
      toBeLessThanOrEqual(expected: number): R;
      toContain(expected: any): R;
      toHaveLength(expected: number): R;
      toBeDefined(): R;
      toBeUndefined(): R;
      toBeNull(): R;
      toBeTruthy(): R;
      toBeFalsy(): R;
    }
  }
  
  function expect<T>(actual: T): jest.Matchers<void>;
}

// Mock implementations for testing (basic)
const mockDescribe = (name: string, fn: () => void) => {
  console.log(`\n--- ${name} ---`);
  fn();
};

const mockIt = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.log(`✗ ${name}: ${error}`);
  }
};

const mockBeforeEach = (fn: () => void) => {
  // Store for later execution
  (global as any).__beforeEach = fn;
};

const createExpect = <T>(actual: T) => ({
  toBe: (expected: any) => {
    if (actual !== expected) {
      throw new Error(`Expected ${actual} to be ${expected}`);
    }
  },
  toEqual: (expected: any) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  toBeGreaterThan: (expected: number) => {
    if (typeof actual !== 'number' || actual <= expected) {
      throw new Error(`Expected ${actual} to be greater than ${expected}`);
    }
  },
  toBeLessThan: (expected: number) => {
    if (typeof actual !== 'number' || actual >= expected) {
      throw new Error(`Expected ${actual} to be less than ${expected}`);
    }
  },
  toBeGreaterThanOrEqual: (expected: number) => {
    if (typeof actual !== 'number' || actual < expected) {
      throw new Error(`Expected ${actual} to be greater than or equal to ${expected}`);
    }
  },
  toBeLessThanOrEqual: (expected: number) => {
    if (typeof actual !== 'number' || actual > expected) {
      throw new Error(`Expected ${actual} to be less than or equal to ${expected}`);
    }
  },
  toContain: (expected: any) => {
    if (Array.isArray(actual)) {
      if (!actual.includes(expected)) {
        throw new Error(`Expected array to contain ${expected}`);
      }
    } else if (typeof actual === 'string') {
      if (!actual.includes(expected)) {
        throw new Error(`Expected string to contain ${expected}`);
      }
    } else {
      throw new Error(`Cannot check contains on ${typeof actual}`);
    }
  },
  toHaveLength: (expected: number) => {
    if (!actual || typeof (actual as any).length !== 'number') {
      throw new Error(`Expected ${actual} to have length property`);
    }
    if ((actual as any).length !== expected) {
      throw new Error(`Expected length ${(actual as any).length} to be ${expected}`);
    }
  },
  toBeDefined: () => {
    if (actual === undefined) {
      throw new Error(`Expected ${actual} to be defined`);
    }
  },
  toBeUndefined: () => {
    if (actual !== undefined) {
      throw new Error(`Expected ${actual} to be undefined`);
    }
  },
  toBeNull: () => {
    if (actual !== null) {
      throw new Error(`Expected ${actual} to be null`);
    }
  },
  toBeTruthy: () => {
    if (!actual) {
      throw new Error(`Expected ${actual} to be truthy`);
    }
  },
  toBeFalsy: () => {
    if (actual) {
      throw new Error(`Expected ${actual} to be falsy`);
    }
  }
});

// Assign to global
if (typeof global !== 'undefined') {
  (global as any).describe = mockDescribe;
  (global as any).it = mockIt;
  (global as any).beforeEach = mockBeforeEach;
  (global as any).expect = createExpect;
}

// For browser environment
if (typeof window !== 'undefined') {
  (window as any).describe = mockDescribe;
  (window as any).it = mockIt;
  (window as any).beforeEach = mockBeforeEach;
  (window as any).expect = createExpect;
}

export {};