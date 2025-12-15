import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from '@/api/supabaseClient';
import { supabase } from '@/api/supabaseClient';
import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
      if (error) setMessage(error.message || 'OAuth error');
    } catch (err) {
      setMessage(String(err));
    }
  };

  const handleEmailLogin = async (e) => {
    e?.preventDefault?.();
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        setMessage(error.message || 'Login failed');
      } else {
        setMessage('Logged in');
      }
    } catch (err) {
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Sign in</h1>
      <p className="text-sm text-slate-600 mb-6">Sign in with Google or use email and password.</p>

      <form onSubmit={handleEmailLogin} className="space-y-4 mb-4">
        <div>
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </div>
        <div>
          <Label>Password</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
        </div>
        <Button type="submit" className="w-full">{loading ? 'Signing in…' : 'Sign in'}</Button>
      </form>

      <div className="flex items-center gap-2 my-4">
        <hr className="flex-1" />
        <span className="text-sm text-slate-400">or</span>
        <hr className="flex-1" />
      </div>

      <div className="space-y-3">
        <Button onClick={handleGoogle} className="w-full flex items-center justify-center gap-2">
          <LogIn className="h-4 w-4" /> Sign in with Google
        </Button>
      </div>

      <p className="text-sm text-slate-600 mt-4">Don't have an account? <Link to="/Signup" className="text-emerald-600">Sign up</Link></p>

      {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
    </div>
  );
}
