// Environment typings to allow import.meta.env in TypeScript when using Vite
interface ImportMetaEnv {
  readonly VITE_CODETTE_API?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly DEV?: boolean;
  // add other env vars as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
