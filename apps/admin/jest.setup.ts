import '@testing-library/jest-dom';
import 'whatwg-fetch';

Object.defineProperty(globalThis, 'EventSource', {
  writable: true,
  value: undefined,
});
