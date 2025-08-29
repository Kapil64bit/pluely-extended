// Global type declarations for test environment

declare global {
  function describe(name: string, fn: () => void): void;
  function it(name: string, fn: () => void): void;
  function beforeEach(fn: () => void): void;
  function afterEach(fn: () => void): void;
  function beforeAll(fn: () => void): void;
  function afterAll(fn: () => void): void;
  
  interface ExpectMatchers<R = void> {
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
  
  function expect<T>(actual: T): ExpectMatchers<void>;
}

export {};