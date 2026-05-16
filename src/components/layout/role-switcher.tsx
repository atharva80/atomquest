'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { UserRole } from '@/types';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface RoleSwitcherProps {
  currentRole: UserRole;
}

export function RoleSwitcher({ currentRole }: RoleSwitcherProps) {
  const router = useRouter();
  
  const switchRole = async (role: UserRole) => {
    const supabase = createClient();
    
    // In a real hackathon demo, you'd use predefined demo accounts
    const credentials = {
      employee: { email: 'employee@demo.com', password: 'password123' },
      manager: { email: 'manager@demo.com', password: 'password123' },
      admin: { email: 'admin@demo.com', password: 'password123' }
    };
    
    const target = credentials[role];
    if (!target) return;
    
    toast.loading(`Switching to ${role} view...`);
    
    // Sign out first
    await supabase.auth.signOut();
    
    // Sign in as target
    const { error } = await supabase.auth.signInWithPassword({
      email: target.email,
      password: target.password
    });
    
    toast.dismiss();
    
    if (error) {
      toast.error(`Failed to switch role: ${error.message}`);
      return;
    }
    
    toast.success(`Switched to ${role}`);
    
    // Redirect based on role
    router.push(`/${role}`);
    router.refresh();
  };

  return (
    <div className="flex flex-col space-y-2">
      <Button 
        variant={currentRole === 'employee' ? "default" : "outline"} 
        size="sm" 
        onClick={() => switchRole('employee')}
        className="w-full justify-start"
      >
        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
        Employee View
      </Button>
      <Button 
        variant={currentRole === 'manager' ? "default" : "outline"} 
        size="sm" 
        onClick={() => switchRole('manager')}
        className="w-full justify-start"
      >
        <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
        Manager View
      </Button>
      <Button 
        variant={currentRole === 'admin' ? "default" : "outline"} 
        size="sm" 
        onClick={() => switchRole('admin')}
        className="w-full justify-start"
      >
        <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
        Admin View
      </Button>
    </div>
  );
}
