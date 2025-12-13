// functions/admin_write_workflow.ts
// Supabase Edge Function (TypeScript/Deno) example to perform admin-only writes.
// NOTE: This is a template — adapt to your Edge functions deployment method.

import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

serve(async (req: Request) => {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 401 });

    // Verify user using Supabase Admin endpoint
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 });

    const user = userData.user;
    const role = (user?.user_metadata?.role) || (user?.app_metadata?.claims && user.app_metadata.claims.role) || null;
    if (role !== 'admin') return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

    const body = await req.json();
    const { data, error } = await supabaseAdmin.from('workflow').insert(body).select().single();
    if (error) return new Response(JSON.stringify({ error }), { status: 400 });
    return new Response(JSON.stringify({ data }), { status: 201 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
