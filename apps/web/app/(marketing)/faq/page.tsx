import Link from 'next/link';

import { ArrowRight, ChevronDown } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Trans } from '@kit/ui/trans';

import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:faq'),
  };
};

async function FAQPage() {
  const { t } = await createI18nServerInstance();

  const faqItems = [
    {
      question: `What is Sparlo?`,
      answer: `Sparlo is an AI-powered engineering research platform. Describe your engineering problem, and we deliver comprehensive research including innovation concepts from across industries, technical validation, IP landscape, and strategic recommendations — all in about 25 minutes.`,
    },
    {
      question: `How long does report generation take?`,
      answer: `Most reports complete in 20-30 minutes. This thorough research process is what makes Sparlo valuable — we're analyzing your problem, exploring cross-industry solutions, and synthesizing actionable insights.`,
    },
    {
      question: `What's included in each pricing tier?`,
      answer: `Core ($199/mo) includes ~10 reports/month for 1 user. Pro ($499/mo) includes ~30 reports/month for up to 5 team members. Max ($999/mo) includes ~70 reports/month for up to 10 team members. All plans include post-report chat, PDF export, and share links.`,
    },
    {
      question: `Can I ask follow-up questions about my report?`,
      answer: `Yes! Every report includes a chat feature. Ask follow-up questions, request more detail on specific concepts, or explore "what if" scenarios.`,
    },
    {
      question: `Is my engineering data secure?`,
      answer: `Yes. Your data is encrypted in transit and at rest. We use middleware encryption in our processing pipeline, and our infrastructure partners are all SOC 2 compliant. We cannot casually browse or view your reports.`,
    },
    {
      question: `Do you use my data to train AI models?`,
      answer: `No. Your engineering problems and reports are never used to train AI models. Anthropic (Claude) explicitly does not use API data for training. Your research remains your intellectual property.`,
    },
    {
      question: `Can I upgrade or downgrade my plan?`,
      answer: `Yes, you can change your plan at any time from Settings → Billing. Upgrades take effect immediately. Downgrades take effect at your next billing date.`,
    },
    {
      question: `What's your refund policy?`,
      answer: `To request a refund, email help@sparlo.ai with your account email and reason. We handle refunds on a case-by-case basis, typically responding within 2 business days.`,
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => {
      return {
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      };
    }),
  };

  return (
    <>
      <script
        key={'ld:json'}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className={'flex flex-col space-y-4 xl:space-y-8'}>
        <SitePageHeader
          title={t('marketing:faq')}
          subtitle={t('marketing:faqSubtitle')}
        />

        <div className={'container flex flex-col items-center space-y-8 pb-16'}>
          <div className="divide-border flex w-full max-w-xl flex-col divide-y divide-dashed rounded-md border">
            {faqItems.map((item, index) => {
              return <FaqItem key={index} item={item} />;
            })}
          </div>

          <div>
            <Button asChild variant={'outline'}>
              <Link href={'/contact'}>
                <span>
                  <Trans i18nKey={'marketing:contactFaq'} />
                </span>

                <ArrowRight className={'ml-2 w-4'} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default withI18n(FAQPage);

function FaqItem({
  item,
}: React.PropsWithChildren<{
  item: {
    question: string;
    answer: string;
  };
}>) {
  return (
    <details
      className={
        'hover:bg-muted/70 [&:open]:bg-muted/70 [&:open]:hover:bg-muted transition-all'
      }
    >
      <summary
        className={'flex items-center justify-between p-4 hover:cursor-pointer'}
      >
        <h2 className={'cursor-pointer font-sans text-base'}>
          <Trans i18nKey={item.question} defaults={item.question} />
        </h2>

        <div>
          <ChevronDown
            className={'h-5 transition duration-300 group-open:-rotate-180'}
          />
        </div>
      </summary>

      <div className={'text-muted-foreground flex flex-col gap-y-2 px-4 pb-2'}>
        <Trans i18nKey={item.answer} defaults={item.answer} />
      </div>
    </details>
  );
}
