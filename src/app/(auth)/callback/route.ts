import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/response';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Determine the user's role to redirect correctly
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (profile?.role) {
          return NextResponse.redirect(new URL(`/${profile.role}`, request.url));
        }
      }
      
      // Fallback redirect if no role is found
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return to login with error
  return NextResponse.redirect(new URL('/login?error=Could not authenticate user', request.url));
}
