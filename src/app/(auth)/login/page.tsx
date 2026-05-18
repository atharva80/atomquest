'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // Fetch profile to redirect based on role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        toast.success('Logged in successfully');
        
        // Small delay to ensure cookies are persisted
        setTimeout(() => {
          if (profile?.role) {
            window.location.href = `/${profile.role}`;
          } else {
            window.location.href = '/';
          }
        }, 500);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'employee' | 'manager' | 'admin') => {
    let demoEmail = '';
    if (role === 'admin') demoEmail = 'admin@atomberg.com';
    if (role === 'manager') demoEmail = 'eng.lead@atomberg.com';
    if (role === 'employee') demoEmail = 'dev1@atomberg.com';
    
    setEmail(demoEmail);
    setPassword('password123');
    
    setLoading(true);
    const supabase = createClient();
    
    try {
      // Sign out any existing session first
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: 'password123',
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();
          
        toast.success('Logged in successfully');
        
        // Small delay to ensure cookies are persisted
        setTimeout(() => {
          if (profile?.role) {
            window.location.href = `/${profile.role}`;
          } else {
            window.location.href = '/';
          }
        }, 500);
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Side: Branding Canvas */}
      <div className="hidden lg:flex lg:w-1/2 bg-zinc-950 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            alt="Sleek abstract digital art with luminous curves and light trails in a Zinc-950 palette"
            className="w-full h-full object-cover opacity-20 grayscale animate-pulse"
            data-alt="A hyper-minimalist, sleek abstract digital art piece for a corporate login page background. The composition features pure geometric forms—fine luminous curves and sharp, precise light trails—suggesting high-speed motion, rotation, and energy efficiency. The aesthetic is architectural and industrial, using a monochromatic Zinc-950 and charcoal palette with deep shadows and subtle metallic highlights. No literal objects, just the suggestion of an 'orbit' and 'precision in motion' through clean geometry and cinematic lighting. 8k resolution, premium corporate feel."
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDNp7ntVsMv9IzZMsWkrRMep7UwDEGVrufsQGa3fIjztM5Ngnzv6amUIxFYQVmL6_u28muyL7D5FRXeeco4-nhnLNgivzPo8Hfywvp-AJLigwnGGMZwH-_9q7JSKc7qPWAaTGhBLOw9I20FyjtLI84DBuR7vKB3JTtC41I7cGWsK05Htkp_nOcpVZE7w1vRn--7RL3JziDfOYFmT5UkFiVxj1cziI48eD_rnQG92-rn53awtvJJx8FCN3J4QOUjGsOg5o0NqZ-lyto"
            style={{ animation: 'zoomIn 20s infinite alternate' }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
        </div>
        {/* Content Container */}
        <div className="relative z-10 flex flex-col h-full justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img
              alt="Orbit Logo"
              className="h-16 w-auto brightness-0 invert"
              src="/orbit-logo.png"
            />
          </div>
          {/* Mission Statement */}
          <div className="max-w-md">
            <h1
              className="font-page-title text-[32px] leading-[40px] text-white mb-4 opacity-0 animate-fade-in"
              style={{ animationDelay: '400ms' }}
            >
              Goal Setting &amp; Tracking for Modern Teams
            </h1>
            <p
              className="font-body-relaxed text-body-relaxed text-zinc-400 opacity-0 animate-fade-in"
              style={{ animationDelay: '600ms' }}
            >
              Atomberg&apos;s mission is to empower teams with unparalleled precision and operational clarity. Orbit aligns
              individual objectives with organizational benchmarks through a rigorous, transparent tracking system
              designed for high-performance execution.
            </p>
          </div>
        </div>
      </div>
      {/* Right Side: Login Canvas */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-zinc-50">
        <div className="w-full max-w-[420px]">
          {/* Mobile Branding (Visible only on small screens) */}
          <div className="flex lg:hidden items-center justify-center mb-12">
            <img
              alt="Orbit Logo"
              className="h-14 w-auto"
              src="/orbit-logo.png"
            />
          </div>
          {/* Login Card */}
          <div
            className="bg-white border border-zinc-200 rounded shadow-sm p-8 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '200ms' }}
          >
            {/* Header */}
            <div className="mb-8">
              <h2 className="font-page-title text-page-title text-zinc-900 mb-1">Access Gateway</h2>
              <p className="font-body-sm text-body-sm text-zinc-500">Authenticate to enter the secure dashboard.</p>
            </div>
            {/* Form */}
            <form className="space-y-6" onSubmit={handleLogin}>
              {/* Email Field */}
              <div className="flex flex-col gap-field-gap">
                <label className="font-section-label text-section-label text-zinc-700 uppercase" htmlFor="email">
                  Email Address
                </label>
                <input
                  id="email"
                  className="w-full px-3 py-2 border border-zinc-200 rounded bg-white text-zinc-900 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900 focus:ring-0 transition-colors"
                  placeholder="name@atomberg.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {/* Password Field */}
              <div className="flex flex-col gap-field-gap">
                <div className="flex justify-between items-center">
                  <label className="font-section-label text-section-label text-zinc-700 uppercase" htmlFor="password">Password</label>
                </div>
                <input
                  id="password"
                  className="w-full px-3 py-2 border border-zinc-200 rounded bg-white text-zinc-900 font-body-sm text-body-sm focus:outline-none focus:border-zinc-900 focus:ring-0 transition-colors"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {/* Submit Action */}
              <div className="pt-2">
                <button
                  className="w-full bg-zinc-900 text-white font-table-cell-primary text-table-cell-primary py-2.5 rounded hover:bg-zinc-800 transition-colors flex justify-center items-center gap-2 duration-300"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In'}
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                    arrow_forward
                  </span>
                </button>
              </div>
            </form>
            {/* Divider */}
            <div className="my-8 flex items-center">
              <div className="flex-grow border-t border-zinc-200"></div>
              <span className="mx-4 font-section-label text-section-label text-zinc-400 uppercase">
                Quick Demo Login
              </span>
              <div className="flex-grow border-t border-zinc-200"></div>
            </div>
            {/* Role Selectors */}
            <div className="grid grid-cols-3 gap-3">
              <button
                className="flex flex-col items-center justify-center p-3 border border-zinc-200 rounded bg-white hover:bg-zinc-50 transition-colors group"
                type="button"
                onClick={() => handleDemoLogin('employee')}
              >
                <span
                  className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-900 mb-1.5"
                  style={{ fontSize: '20px' }}
                >
                  badge
                </span>
                <span className="font-badge-label text-badge-label text-zinc-700 group-hover:text-zinc-900">
                  Employee
                </span>
              </button>
              <button
                className="flex flex-col items-center justify-center p-3 border border-zinc-200 rounded bg-white hover:bg-zinc-50 transition-colors group"
                type="button"
                onClick={() => handleDemoLogin('manager')}
              >
                <span
                  className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-900 mb-1.5"
                  style={{ fontSize: '20px' }}
                >
                  supervisor_account
                </span>
                <span className="font-badge-label text-badge-label text-zinc-700 group-hover:text-zinc-900">
                  Manager
                </span>
              </button>
              <button
                className="flex flex-col items-center justify-center p-3 border border-zinc-200 rounded bg-white hover:bg-zinc-50 transition-colors group"
                type="button"
                onClick={() => handleDemoLogin('admin')}
              >
                <span
                  className="material-symbols-outlined text-zinc-400 group-hover:text-zinc-900 mb-1.5"
                  style={{ fontSize: '20px' }}
                >
                  admin_panel_settings
                </span>
                <span className="font-badge-label text-badge-label text-zinc-700 group-hover:text-zinc-900">
                  Admin
                </span>
              </button>
            </div>
          </div>
          {/* Footer Links */}
          <div className="mt-8 flex justify-center gap-6">
            <a className="font-caption text-caption text-zinc-500 hover:text-zinc-900 transition-colors" href="#">
              Forgot Password?
            </a>
            <a className="font-caption text-caption text-zinc-500 hover:text-zinc-900 transition-colors" href="#">
              IT Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
