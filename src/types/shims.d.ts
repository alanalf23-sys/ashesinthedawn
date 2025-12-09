declare module '*.css';
declare module '*.svg';

declare global {
  interface Window { app?: any }
}

// Keep file as an ambient global declaration; do not export anything.
