import Link from 'next/link';

import { SignUpMethodsContainer } from '@kit/auth/sign-up';
import { Trans } from '@kit/ui/trans';

import authConfig from '~/config/auth.config';
import pathsConfig from '~/config/paths.config';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();

  return {
    title: i18n.t('auth:signUp'),
  };
};

const paths = {
  callback: pathsConfig.auth.callback,
  appHome: pathsConfig.app.home,
};

async function SignUpPage() {
  return (
    <>
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[28px] font-semibold tracking-tight text-zinc-900">
          Create Account
        </h1>

        <p className="text-[15px] leading-relaxed text-zinc-500">
          First Analysis Free
        </p>
      </div>

      <SignUpMethodsContainer
        providers={authConfig.providers}
        displayTermsCheckbox={authConfig.displayTermsCheckbox}
        paths={paths}
        captchaSiteKey={authConfig.captchaTokenSiteKey}
      />

      <div className="flex justify-center">
        <Link
          href={pathsConfig.auth.signIn}
          prefetch={true}
          className="text-[14px] text-zinc-500 transition-colors hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <Trans i18nKey={'auth:alreadyHaveAnAccount'} />
        </Link>
      </div>
    </>
  );
}

export default withI18n(SignUpPage);
