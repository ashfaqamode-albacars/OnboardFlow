// src/api/supabaseClient.js
// Modern @supabase/supabase-js v2 client + helpers for a Vite + React app
// Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from import.meta.env

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase environment variables: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // keep session in localStorage (default) — adjust if you prefer in-memory
    persistSession: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      'x-client': 'onboardflow-vite-react'
    }
  }
});

// Uniform handler: returns { data, error }
const handle = async (promise) => {
  try {
    const result = await promise;
    if (result && Object.prototype.hasOwnProperty.call(result, 'error')) {
      return { data: result.data ?? null, error: result.error };
    }
    return { data: result ?? null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
};

export const list = async (table, opts = {}) => {
  // opts: { select: string, order: {column, ascending}, limit }
  let qb = supabase.from(table).select(opts.select ?? '*');
  if (opts.order) qb = qb.order(opts.order.column, { ascending: !!opts.order.ascending });
  if (opts.limit) qb = qb.limit(opts.limit);
  return handle(qb);
};

export const get = async (table, id, opts = {}) => {
  const idColumn = opts.idColumn ?? 'id';
  const select = opts.select ?? '*';
  return handle(supabase.from(table).select(select).eq(idColumn, id).limit(1).maybeSingle());
};

export const create = async (table, payload) => {
  return handle(supabase.from(table).insert(payload).select().single());
};

export const update = async (table, id, payload, opts = {}) => {
  const idColumn = opts.idColumn ?? 'id';
  return handle(supabase.from(table).update(payload).eq(idColumn, id).select().single());
};

export const remove = async (table, id, opts = {}) => {
  const idColumn = opts.idColumn ?? 'id';
  return handle(supabase.from(table).delete().eq(idColumn, id).select().single());
};

export const upsert = async (table, payload, opts = {}) => {
  const qb = supabase.from(table).upsert(payload, { onConflict: opts.onConflict, returning: opts.returning ?? 'representation' }).select();
  return handle(qb);
};

export const bulkInsert = async (table, items, opts = {}) => {
  return handle(supabase.from(table).insert(items, { returning: opts.returning ?? 'representation' }).select());
};

export const query = async (table, filters = [], opts = {}) => {
  let qb = supabase.from(table).select(opts.select ?? '*');
  for (const f of filters) {
    const method = (f.method || 'eq').toLowerCase();
    switch (method) {
      case 'eq': qb = qb.eq(f.column, f.value); break;
      case 'neq': qb = qb.neq(f.column, f.value); break;
      case 'in': qb = qb.in(f.column, f.value); break;
      case 'like': qb = qb.like(f.column, f.value); break;
      case 'ilike': qb = qb.ilike(f.column, f.value); break;
      case 'gt': qb = qb.gt(f.column, f.value); break;
      case 'lt': qb = qb.lt(f.column, f.value); break;
      case 'order': qb = qb.order(f.column, { ascending: !!f.ascending }); break;
      default: break;
    }
  }
  if (opts.limit) qb = qb.limit(opts.limit);
  return handle(qb);
};

export const paginate = async (table, page = 1, pageSize = 20, opts = {}) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let qb = supabase.from(table).select(opts.select ?? '*', { count: 'exact' }).range(from, to);
  if (opts.order) qb = qb.order(opts.order.column, { ascending: !!opts.order.ascending });
  return handle(qb);
};

export const rpc = async (functionName, params = {}) => {
  return handle(supabase.rpc(functionName, params));
};

export const storageUpload = async (bucket, path, file, opts = {}) => {
  return handle(supabase.storage.from(bucket).upload(path, file, opts));
};

export const storageDownload = async (bucket, path) => {
  try {
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
};

const subs = new Map();
export const subscribe = (table, callback, opts = {}) => {
  const label = opts.label ?? `${table}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;
  const channel = supabase.channel(label, { config: { broadcast: { self: true }, presence: false } });
  const event = opts.event ?? '';
  channel.on('broadcast', { event }, (payload) => { try { callback(null, payload); } catch (err) { callback(err); } });
  channel.subscribe();
  subs.set(label, channel);
  return channel;
};

export const unsubscribe = (subscriptionOrLabel) => {
  const label = typeof subscriptionOrLabel === 'string' ? subscriptionOrLabel : subscriptionOrLabel.topic || null;
  const channel = typeof subscriptionOrLabel === 'string' ? subs.get(label) : subscriptionOrLabel;
  if (!channel) return false;
  supabase.removeChannel(channel);
  for (const [k, v] of subs.entries()) { if (v === channel) subs.delete(k); }
  return true;
};

export const signUp = async (email, password, options = {}) => { return handle(supabase.auth.signUp({ email, password }, options)); };

export const signIn = async (email, password) => { return handle(supabase.auth.signInWithPassword({ email, password })); };

export const signOut = async () => { return handle(supabase.auth.signOut()); };

export const getUser = async () => {
  try {
    const session = await supabase.auth.getSession();
    return { data: session?.data?.session?.user ?? null, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
};

export const onAuthStateChange = (cb) => {
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    try { cb(event, session); } catch (err) { console.error('onAuthStateChange callback error', err); }
  });
  return () => listener.subscription.unsubscribe();
};

export default {
  supabase,
  list, get, create, update, remove, upsert, bulkInsert, query, paginate, rpc,
  storageUpload, storageDownload,
  subscribe, unsubscribe,
  signUp, signIn, signOut, getUser, onAuthStateChange
};
