import { revalidatePath } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('[Signout] Error:', error.message);
      // Still redirect even on error - user wants to leave
    }
  }

  // Clear all cached data
  revalidatePath('/', 'layout');

  // Redirect to home page
  const redirectUrl = new URL('/', req.url);
  return NextResponse.redirect(redirectUrl, { status: 302 });
}
