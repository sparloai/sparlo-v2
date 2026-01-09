'use server';

import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { RefinedPasswordSchema } from '../schemas/password.schema';

export async function updatePasswordAction(params: { password: string }) {
  const parseResult = RefinedPasswordSchema.safeParse(params.password);

  if (!parseResult.success) {
    throw new Error('weak_password');
  }

  const client = getSupabaseServerClient();

  const { error } = await client.auth.updateUser({
    password: params.password,
  });

  if (error) {
    throw error;
  }

  return { success: true };
}
