// src/lib/clientAuthSnippet.js
// Client-side sign-in snippet using helpers from supabaseClient.js
import supabaseClient from '@/api/supabaseClient';

export async function signInUser(email, password) {
  const { data, error } = await supabaseClient.signIn(email, password);
  if (error) {
    console.error('Sign-in error', error);
    return null;
  }
  return data;
}
