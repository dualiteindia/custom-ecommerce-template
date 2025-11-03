import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log("Initializing Supabase client...");
console.log("Supabase URL from env:", supabaseUrl);
console.log("Supabase Anon Key from env:", supabaseAnonKey ? "Loaded" : "Not Loaded");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be defined in .env file");
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log("Supabase client created.");
