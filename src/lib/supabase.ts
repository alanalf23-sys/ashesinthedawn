import { createClient } from '@supabase/supabase-js';

// Demo/Fallback credentials - for production, set environment variables
// Using a valid Supabase URL format with demo placeholder
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://demoproject.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-anon-key-placeholder';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('[Supabase] Using demo credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for production.');
}

// Create client with error handling
let supabase: any;
try {
  // Only create real client if we have valid environment variables
  if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
  } else {
    throw new Error('Supabase credentials not configured - using fallback mock client');
  }
} catch (error) {
  console.warn('[Supabase] Using fallback mock client:', error instanceof Error ? error.message : String(error));
  // Return a mock client that won't crash the app
  supabase = {
    from: () => ({ 
      select: () => Promise.resolve({ data: null, error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: { 
      onAuthStateChange: () => () => {},
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    },
  } as any;
}

export { supabase };
