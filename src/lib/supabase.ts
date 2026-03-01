import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  'https://hlvaztyvrpyfpgojitvu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdmF6dHl2cnB5ZnBnb2ppdHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjgyNDIsImV4cCI6MjA4NzQ0NDI0Mn0.anRSg7ng7_1ylb8-S6v8gPmrEuNTkG_FWUCwBXX24Sw',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
