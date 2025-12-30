'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@kit/ui/form';
import { If } from '@kit/ui/if';
import { Trans } from '@kit/ui/trans';

import { PasswordSignUpSchema } from '../schemas/password-sign-up.schema';
import { EmailInput } from './email-input';
import { PasswordInput } from './password-input';
import { TermsAndConditionsFormField } from './terms-and-conditions-form-field';

interface PasswordSignUpFormProps {
  defaultValues?: {
    email: string;
  };

  displayTermsCheckbox?: boolean;

  onSubmit: (params: {
    email: string;
    password: string;
    repeatPassword: string;
  }) => unknown;

  loading: boolean;
  captchaLoading: boolean;
}

export function PasswordSignUpForm({
  defaultValues,
  displayTermsCheckbox,
  onSubmit,
  loading,
  captchaLoading,
}: PasswordSignUpFormProps) {
  const form = useForm({
    resolver: zodResolver(PasswordSignUpSchema),
    defaultValues: {
      email: defaultValues?.email ?? '',
      password: '',
      repeatPassword: '',
    },
  });

  return (
    <Form {...form}>
      <form
        className={'flex w-full flex-col gap-y-4'}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <div className={'flex flex-col space-y-2.5'}>
          <FormField
            control={form.control}
            name={'email'}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <EmailInput data-test={'email-input'} {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={'password'}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput {...field} />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={'repeatPassword'}
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <PasswordInput
                    data-test={'repeat-password-input'}
                    {...field}
                  />
                </FormControl>

                <FormDescription className="text-zinc-500">
                  <Trans i18nKey={'auth:repeatPasswordDescription'} />
                </FormDescription>

                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <If condition={displayTermsCheckbox}>
          <TermsAndConditionsFormField />
        </If>

        <button
          data-test="auth-submit-button"
          type="submit"
          disabled={loading || captchaLoading}
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-zinc-900 text-[15px] font-medium text-white transition-all hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <If condition={captchaLoading}>
            <span className="animate-in fade-in slide-in-from-bottom-24">
              <Trans i18nKey="auth:verifyingCaptcha" />
            </span>
          </If>

          <If condition={loading && !captchaLoading}>
            <span className="animate-in fade-in slide-in-from-bottom-24">
              <Trans i18nKey="auth:signingUp" />
            </span>
          </If>

          <If condition={!loading && !captchaLoading}>
            <span className="animate-in fade-in slide-in-from-bottom-24 flex items-center gap-1.5">
              <Trans i18nKey="auth:signUpWithEmail" />
              <ArrowRight className="zoom-in animate-in slide-in-from-left-2 fill-mode-both h-4 w-4 delay-500 duration-500" />
            </span>
          </If>
        </button>
      </form>
    </Form>
  );
}
