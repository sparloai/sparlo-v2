import { useMutation } from '@tanstack/react-query';

import { useSupabase } from './use-supabase';

export function useSignOut() {
  const client = useSupabase();

  return useMutation({
    mutationFn: async () => {
      const result = await client.auth.signOut();

      // Force redirect after signOut completes
      // The auth change listener should handle this, but as a fallback
      // we redirect manually to ensure the user is logged out
      if (!result.error) {
        window.location.href = '/';
      }

      return result;
    },
  });
}
