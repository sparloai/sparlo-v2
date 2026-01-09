'use client';

import { useState, useTransition } from 'react';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { useRouter } from 'next/navigation';

import type { AuthError } from '@supabase/supabase-js';

import { zodResolver } from '@hookform/resolvers/zod';
import { ExclamationTriangleIcon } from '@radix-ui/react-icons';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import type { z } from 'zod';

import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@kit/ui/form';
import { Heading } from '@kit/ui/heading';
import { Trans } from '@kit/ui/trans';

import { PasswordResetSchema } from '../schemas/password-reset.schema';
import { PasswordInput } from './password-input';
import { updatePasswordAction } from './update-password.action';

export function UpdatePasswordForm(params: {
  redirectTo: string;
  heading?: React.ReactNode;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<{ code: string } | null>(null);
  const router = useRouter();
  const { t } = useTranslation();

  const form = useForm<z.infer<typeof PasswordResetSchema>>({
    resolver: zodResolver(PasswordResetSchema),
    defaultValues: {
      password: '',
      repeatPassword: '',
    },
  });

  if (error) {
    return <ErrorState error={error} onRetry={() => setError(null)} />;
  }

  return (
    <div className={'flex w-full flex-col space-y-6'}>
      <div className={'flex justify-center'}>
        {params.heading && (
          <Heading className={'text-center'} level={4}>
            {params.heading}
          </Heading>
        )}
      </div>

      <Form {...form}>
        <form
          className={'flex w-full flex-1 flex-col'}
          onSubmit={form.handleSubmit(async ({ password }) => {
            startTransition(async () => {
              try {
                await updatePasswordAction({ password });

                router.replace(params.redirectTo);

                toast.success(t('account:updatePasswordSuccessMessage'));
              } catch (err) {
                if (isRedirectError(err)) {
                  throw err;
                }

                const authError = err as AuthError;
                setError({ code: authError.code || 'resetPasswordError' });
              }
            });
          })}
        >
          <div className={'flex-col space-y-2.5'}>
            <FormField
              name={'password'}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput autoComplete={'new-password'} {...field} />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name={'repeatPassword'}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PasswordInput autoComplete={'new-password'} {...field} />
                  </FormControl>

                  <FormDescription>
                    <Trans i18nKey={'common:repeatPassword'} />
                  </FormDescription>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button disabled={isPending} type="submit" className={'w-full'}>
              <Trans i18nKey={'auth:passwordResetLabel'} />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function ErrorState(props: {
  onRetry: () => void;
  error: {
    code: string;
  };
}) {
  const { t } = useTranslation('auth');

  const errorMessage = t(`errors.${props.error.code}`, {
    defaultValue: t('errors.resetPasswordError'),
  });

  return (
    <div className={'flex flex-col space-y-4'}>
      <Alert variant={'destructive'}>
        <ExclamationTriangleIcon className={'s-6'} />

        <AlertTitle>
          <Trans i18nKey={'common:genericError'} />
        </AlertTitle>

        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>

      <Button onClick={props.onRetry} variant={'outline'}>
        <Trans i18nKey={'common:retry'} />
      </Button>
    </div>
  );
}
