'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

/**
 * Server Action for signing out.
 * Uses Next.js built-in CSRF protection.
 */
export async function signOutAction() {
  const supabase = getSupabaseServerClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('[Signout] Error:', error.message);
  }

  // Clear all cached data
  revalidatePath('/', 'layout');

  // Redirect to home page
  redirect('/');
}
