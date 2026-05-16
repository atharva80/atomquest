'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, User, Briefcase, ShieldCheck } from 'lucide-react';
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
        
        if (profile?.role) {
          router.push(`/${profile.role}`);
        } else {
          router.push('/');
        }
        router.refresh();
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
        
        if (profile?.role) {
          router.push(`/${profile.role}`);
        } else {
          router.push('/');
        }
        router.refresh();
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl ring-1 ring-slate-200 dark:ring-slate-800 rounded-2xl overflow-hidden">
      <CardHeader className="space-y-3 pb-6 pt-8 px-8 text-center bg-white dark:bg-slate-900 border-b dark:border-slate-800">
        <CardTitle className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back</CardTitle>
        <CardDescription className="text-base text-slate-500">
          Sign in to your AtomQuest account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-8 bg-white dark:bg-slate-900 space-y-6">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Mail size={16} />
              </div>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@atomberg.com" 
                className="pl-10 h-11"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-xs font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">Forgot password?</a>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Lock size={16} />
              </div>
              <Input 
                id="password" 
                type="password" 
                className="pl-10 h-11"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Sign In
          </Button>
        </form>
        
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-2 text-muted-foreground font-semibold">
              Quick Demo Login
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <Button variant="outline" type="button" onClick={() => handleDemoLogin('employee')} className="flex flex-col h-auto py-3 gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
            <User size={18} className="text-blue-500" />
            <span className="text-xs font-medium">Employee</span>
          </Button>
          <Button variant="outline" type="button" onClick={() => handleDemoLogin('manager')} className="flex flex-col h-auto py-3 gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
            <Briefcase size={18} className="text-purple-500" />
            <span className="text-xs font-medium">Manager</span>
          </Button>
          <Button variant="outline" type="button" onClick={() => handleDemoLogin('admin')} className="flex flex-col h-auto py-3 gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800">
            <ShieldCheck size={18} className="text-red-500" />
            <span className="text-xs font-medium">Admin</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
