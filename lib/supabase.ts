// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'YOUR_SUPABASE_URL') {
  // Hanya menampilkan warning agar app tidak crash saat build/dev tanpa key
  console.warn('⚠️ Supabase environment variables are missing or invalid.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder_key'
);

export type Letter = {
  id?: string;
  slug: string;
  sender_name: string;
  recipient_name: string;
  content: string;
  image_url?: string;
  music_url?: string;
  theme?: string;
  created_at?: string;
};
