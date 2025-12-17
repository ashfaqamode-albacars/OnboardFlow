import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from '@/api/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!email) {
      setMessage('Email required');
      setLoading(false);
      return;
    }

    try {
      console.log('[auth] signup start', { email });
      const { data, error } = await signUp(email, password);
      if (error) {
        console.error('[auth] signup error', error);
        setMessage(error.message || 'Signup failed');
      } else {
        console.log('[auth] signup success', data);
        setMessage('Check your email for confirmation (if enabled).');
        setTimeout(() => navigate('/Login'), 1200);
      }
    } catch (err) {
      console.error('[auth] signup exception', err);
      setMessage(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Sign up</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Email</Label>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <Label>Password</Label>
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        <Button type="submit" className="w-full">{loading ? 'Signing up…' : 'Sign up'}</Button>
      </form>

      <p className="text-sm text-slate-600 mt-4">Already have an account? <Link to="/Login" className="text-emerald-600">Sign in</Link></p>

      {message && <p className="mt-4 text-sm text-red-600">{message}</p>}
    </div>
  );
}