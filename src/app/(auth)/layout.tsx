import { ReactNode } from 'react';
import { Target } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left side: branding/gradient */}
      <div className="hidden lg:flex w-1/2 bg-indigo-600 p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-indigo-900 z-0"></div>
        <div className="absolute -left-[10%] -top-[10%] w-96 h-96 rounded-full bg-indigo-500/30 blur-3xl"></div>
        <div className="absolute -right-[10%] -bottom-[10%] w-96 h-96 rounded-full bg-indigo-800/50 blur-3xl"></div>
        
        <div className="relative z-10 flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg text-indigo-600">
            <Target size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight">AtomQuest</span>
        </div>
        
        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-4xl font-bold leading-tight">
            Goal Setting & Tracking for Modern Teams
          </h1>
          <p className="text-indigo-100 text-lg">
            Align employee objectives with company goals, track quarterly progress, and foster a culture of high performance.
          </p>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 text-sm text-indigo-200">
          <span>© {new Date().getFullYear()} Atomberg Technologies</span>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
      
      {/* Right side: auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
}
