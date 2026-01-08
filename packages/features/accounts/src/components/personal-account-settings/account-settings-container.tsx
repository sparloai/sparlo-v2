'use client';

import type { Provider } from '@supabase/supabase-js';

import { useTranslation } from 'react-i18next';

import { If } from '@kit/ui/if';
import { LanguageSelector } from '@kit/ui/language-selector';
import { LoadingOverlay } from '@kit/ui/loading-overlay';
import { Trans } from '@kit/ui/trans';

import { usePersonalAccountData } from '../../hooks/use-personal-account-data';
import { AccountDangerZone } from './account-danger-zone';
import { UpdateEmailFormContainer } from './email/update-email-form-container';
import { LinkAccountsList } from './link-accounts';
import { MultiFactorAuthFactorsList } from './mfa/multi-factor-auth-list';
import { UpdatePasswordFormContainer } from './password/update-password-container';
import { UpdateAccountDetailsFormContainer } from './update-account-details-form-container';

function SectionHeader({
  title,
  description,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <div className="mb-6 border-l-4 border-zinc-950 py-1 pl-6">
      <h2 className="mb-1 text-lg font-semibold tracking-tight text-zinc-950">
        {title}
      </h2>
      <p className="max-w-2xl text-[15px] leading-relaxed text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
      {children}
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <SectionHeader title={title} description={description} />
      <SettingsCard>{children}</SettingsCard>
    </div>
  );
}

export function PersonalAccountSettingsContainer(
  props: React.PropsWithChildren<{
    userId: string;

    features: {
      enableAccountDeletion: boolean;
      enablePasswordUpdate: boolean;
      enableAccountLinking: boolean;
      showLinkEmailOption: boolean;
    };

    paths: {
      callback: string;
    };

    providers: Provider[];
  }>,
) {
  const supportsLanguageSelection = useSupportMultiLanguage();
  const user = usePersonalAccountData(props.userId);

  if (!user.data || user.isPending) {
    return <LoadingOverlay fullPage />;
  }

  return (
    <div className="flex w-full flex-col space-y-10 pb-32">
      {/* Profile Section */}
      <SettingsSection
        title={<Trans i18nKey={'account:name'} />}
        description={<Trans i18nKey={'account:nameDescription'} />}
      >
        <UpdateAccountDetailsFormContainer user={user.data} />
      </SettingsSection>

      {/* Language Section */}
      <If condition={supportsLanguageSelection}>
        <SettingsSection
          title={<Trans i18nKey={'account:language'} />}
          description={<Trans i18nKey={'account:languageDescription'} />}
        >
          <LanguageSelector />
        </SettingsSection>
      </If>

      {/* Security Section */}
      <div className="space-y-6">
        <div className="mb-8 border-l-4 border-zinc-950 py-1 pl-6">
          <span className="text-[13px] font-semibold tracking-[0.06em] text-zinc-500 uppercase">
            <Trans i18nKey={'account:securitySection'} defaults="Security" />
          </span>
        </div>

        <SettingsSection
          title={<Trans i18nKey={'account:updateEmailCardTitle'} />}
          description={<Trans i18nKey={'account:updateEmailCardDescription'} />}
        >
          <UpdateEmailFormContainer callbackPath={props.paths.callback} />
        </SettingsSection>

        <If condition={props.features.enablePasswordUpdate}>
          <SettingsSection
            title={<Trans i18nKey={'account:updatePasswordCardTitle'} />}
            description={
              <Trans i18nKey={'account:updatePasswordCardDescription'} />
            }
          >
            <UpdatePasswordFormContainer callbackPath={props.paths.callback} />
          </SettingsSection>
        </If>

        <SettingsSection
          title={<Trans i18nKey={'account:multiFactorAuth'} />}
          description={<Trans i18nKey={'account:multiFactorAuthDescription'} />}
        >
          <MultiFactorAuthFactorsList userId={props.userId} />
        </SettingsSection>

        <SettingsSection
          title={<Trans i18nKey={'account:linkedAccounts'} />}
          description={<Trans i18nKey={'account:linkedAccountsDescription'} />}
        >
          <LinkAccountsList
            providers={props.providers}
            enabled={props.features.enableAccountLinking}
            showEmailOption={props.features.showLinkEmailOption}
            showPasswordOption={props.features.enablePasswordUpdate}
            redirectTo={'/home/settings'}
          />
        </SettingsSection>
      </div>

      {/* Danger Zone */}
      <If condition={props.features.enableAccountDeletion}>
        <div className="space-y-4">
          <div className="mb-6 border-l-4 border-red-500 py-1 pl-6">
            <h2 className="mb-1 text-lg font-semibold tracking-tight text-zinc-950">
              <Trans i18nKey={'account:dangerZone'} />
            </h2>
            <p className="max-w-2xl text-[15px] leading-relaxed text-zinc-500">
              <Trans i18nKey={'account:dangerZoneDescription'} />
            </p>
          </div>
          <div className="rounded-xl border border-red-200 bg-white p-8 shadow-sm">
            <AccountDangerZone />
          </div>
        </div>
      </If>
    </div>
  );
}

function useSupportMultiLanguage() {
  const { i18n } = useTranslation();
  const langs = (i18n?.options?.supportedLngs as string[]) ?? [];

  const supportedLangs = langs.filter((lang) => lang !== 'cimode');

  return supportedLangs.length > 1;
}
