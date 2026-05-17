'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Sidebar } from './sidebar';
import { UserRole } from '@/types';

interface MobileNavProps {
  role: UserRole;
}

export function MobileNav({ role }: MobileNavProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64 bg-slate-950 border-r-slate-800" showCloseButton={false}>
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        {/* We reuse the sidebar but override the 'hidden md:flex' class we added */}
        <div className="flex flex-col h-full bg-slate-950 text-slate-200 border-r border-slate-800 w-64">
           <Sidebar role={role} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
