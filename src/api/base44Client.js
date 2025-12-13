import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "693ba688c127cfb3b2fe4936", 
  requiresAuth: true // Ensure authentication is required for all operations
});


/*
import { createClient } from '@supabase/supabase-js'
const supabaseUrl = 'https://imfqqyuymoxoqnuhvnpr.supabase.co'
const supabaseKey = process.env.SUPABASE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
*/