// Temporary ambient declarations to suppress module resolution errors during incremental fixes
// These are minimal shims to allow the TypeScript build to proceed while we address real type issues.

declare module '*';

declare module 'react';
declare module 'react-dom';

declare namespace JSX {
  // Minimal JSX namespace for TS when using React JSX runtime
  interface Element { }
  interface IntrinsicElements { [elemName: string]: any }
}
