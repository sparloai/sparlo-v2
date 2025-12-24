import { SparloPricing } from '~/(marketing)/_components/sparlo-pricing';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:pricing'),
  };
};

async function PricingPage() {
  return <SparloPricing />;
}

export default withI18n(PricingPage);
