/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CODETTE_API?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  // add other VITE_* env vars as needed
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
