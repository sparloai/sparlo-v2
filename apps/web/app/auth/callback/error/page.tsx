import Link from 'next/link';

import type { AuthError } from '@supabase/supabase-js';

import { ResendAuthLinkForm } from '@kit/auth/resend-email-link';
import { Alert, AlertDescription, AlertTitle } from '@kit/ui/alert';
import { Trans } from '@kit/ui/trans';

import pathsConfig from '~/config/paths.config';
import { withI18n } from '~/lib/i18n/with-i18n';

interface AuthCallbackErrorPageProps {
  searchParams: Promise<{
    error: string;
    callback?: string;
    email?: string;
    code?: AuthError['code'];
  }>;
}

async function AuthCallbackErrorPage(props: AuthCallbackErrorPageProps) {
  const { error, callback, code } = await props.searchParams;
  const signInPath = pathsConfig.auth.signIn;
  const redirectPath = callback ?? pathsConfig.auth.callback;

  return (
    <div className={'flex flex-col space-y-4 py-4'}>
      <Alert variant={'warning'}>
        <AlertTitle>
          <Trans i18nKey={'auth:authenticationErrorAlertHeading'} />
        </AlertTitle>

        <AlertDescription>
          <Trans i18nKey={error ?? 'auth:authenticationErrorAlertBody'} />
        </AlertDescription>
      </Alert>

      <AuthCallbackForm
        code={code}
        signInPath={signInPath}
        redirectPath={redirectPath}
      />
    </div>
  );
}

function AuthCallbackForm(props: {
  signInPath: string;
  redirectPath?: string;
  code?: AuthError['code'];
}) {
  switch (props.code) {
    case 'otp_expired':
      return <ResendAuthLinkForm redirectPath={props.redirectPath} />;
    default:
      return <SignInButton signInPath={props.signInPath} />;
  }
}

function SignInButton(props: { signInPath: string }) {
  return (
    <Link
      href={props.signInPath}
      className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-ring inline-flex h-9 w-full cursor-pointer items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium shadow-xs transition-colors focus-visible:ring-1 focus-visible:outline-hidden active:scale-[0.98]"
    >
      <Trans i18nKey={'auth:signIn'} />
    </Link>
  );
}

export default withI18n(AuthCallbackErrorPage);
