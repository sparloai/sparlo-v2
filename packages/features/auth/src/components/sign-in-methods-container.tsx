'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import type { Provider } from '@supabase/supabase-js';

import { isBrowser } from '@kit/shared/utils';
import { If } from '@kit/ui/if';
import { Separator } from '@kit/ui/separator';
import { Trans } from '@kit/ui/trans';

import { LastAuthMethodHint } from './last-auth-method-hint';
import { MagicLinkAuthContainer } from './magic-link-auth-container';
import { OauthProviders } from './oauth-providers';
import { OtpSignInContainer } from './otp-sign-in-container';
import { PasswordSignInContainer } from './password-sign-in-container';

/**
 * Get the app subdomain URL for a given path.
 * Strips /home prefix since app subdomain uses clean URLs.
 */
function getAppSubdomainUrl(path: string): string {
  const appSubdomain = process.env.NEXT_PUBLIC_APP_SUBDOMAIN || 'app';
  const productionDomain =
    process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN || 'sparlo.ai';

  // Strip /home prefix for clean app subdomain URLs
  const appPath = path.startsWith('/home')
    ? path.replace(/^\/home/, '') || '/'
    : path;

  return `https://${appSubdomain}.${productionDomain}${appPath}`;
}

/**
 * Check if a path is an app path (should redirect to app subdomain).
 */
function isAppPath(path: string): boolean {
  const mainDomainPaths = ['/auth', '/share', '/api', '/healthcheck'];
  return !mainDomainPaths.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

export function SignInMethodsContainer(props: {
  paths: {
    callback: string;
    joinTeam: string;
    returnPath: string;
  };

  providers: {
    password: boolean;
    magicLink: boolean;
    otp: boolean;
    oAuth: Provider[];
  };

  captchaSiteKey?: string;
}) {
  const router = useRouter();

  const redirectUrl = isBrowser()
    ? new URL(props.paths.callback, window?.location.origin).toString()
    : '';

  const onSignIn = useCallback(() => {
    const returnPath = props.paths.returnPath || '/home';
    const isProduction = process.env.NODE_ENV === 'production';

    // In production, redirect app paths to app subdomain
    if (isProduction && isAppPath(returnPath)) {
      window.location.href = getAppSubdomainUrl(returnPath);
      return;
    }

    router.replace(returnPath);
  }, [props.paths.returnPath, router]);

  return (
    <>
      <LastAuthMethodHint />

      <If condition={props.providers.password}>
        <PasswordSignInContainer
          onSignIn={onSignIn}
          captchaSiteKey={props.captchaSiteKey}
        />
      </If>

      <If condition={props.providers.magicLink}>
        <MagicLinkAuthContainer
          redirectUrl={redirectUrl}
          shouldCreateUser={false}
          captchaSiteKey={props.captchaSiteKey}
        />
      </If>

      <If condition={props.providers.otp}>
        <OtpSignInContainer
          shouldCreateUser={false}
          captchaSiteKey={props.captchaSiteKey}
        />
      </If>

      <If condition={props.providers.oAuth.length}>
        <If
          condition={
            props.providers.magicLink ||
            props.providers.password ||
            props.providers.otp
          }
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator />
            </div>

            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background text-muted-foreground px-2">
                <Trans i18nKey="auth:orContinueWith" />
              </span>
            </div>
          </div>
        </If>

        <OauthProviders
          enabledProviders={props.providers.oAuth}
          shouldCreateUser={false}
          paths={{
            callback: props.paths.callback,
            returnPath: props.paths.returnPath,
          }}
        />
      </If>
    </>
  );
}
