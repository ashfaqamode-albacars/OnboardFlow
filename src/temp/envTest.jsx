import { list } from '@/api/supabaseClient';

function mask(v) {
  if (!v) return 'MISSING';
  return `${String(v).slice(0, 12)}...`;
}

export default function TestEnv() {
  // Print masked env values so you can confirm Vite picked them up
  // These logs are intentionally non-sensitive (masked) and temporary.
  try {
    // eslint-disable-next-line no-console
    console.log('[envTest] VITE_SUPABASE_URL:', mask(import.meta.env.VITE_SUPABASE_URL));
    // eslint-disable-next-line no-console
    console.log('[envTest] VITE_SUPABASE_ANON_KEY present:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[envTest] env read error', e);
  }

  // Quick runtime test: call `list('workflows')` and log result
  (async () => {
    try {
      const res = await list('workflow', { select: '*' });
      // eslint-disable-next-line no-console
      console.log('[envTest] workflows list result:', res?.data ? `received ${res.data.length} rows` : res.error || 'no data');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[envTest] error calling list("workflows")', err);
    }
  })();

  return null;
}
