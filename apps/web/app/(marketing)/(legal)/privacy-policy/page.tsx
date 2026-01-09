import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:privacyPolicy'),
  };
}

async function PrivacyPolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t('marketing:privacyPolicy')}
        subtitle={t('marketing:privacyPolicyDescription')}
      />

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-sm">
            Last updated: January 9, 2025
          </p>

          <Section title="We Cannot See Your Data">
            <Highlight>
              <strong>
                Sparlo cannot read your queries, your research data, or your
                generated reports.
              </strong>{' '}
              Your content is processed by a third-party AI provider and
              returned directly to you. No human at Sparlo has access to it.
            </Highlight>

            <p>
              We built Sparlo for R&D teams working on sensitive problems. If we
              could see your data, we would not be able to serve you.
            </p>
          </Section>

          <Section title="How Your Data Flows">
            <p>Here is exactly what happens when you use Sparlo:</p>
            <ul>
              <li>
                <strong>Encrypted everywhere:</strong> Your data is encrypted in
                transit (TLS 1.3) and at rest (AES-256).
              </li>
              <li>
                <strong>We cannot access your content:</strong> Your queries and
                generated reports are stored in your account. Our team has no
                way to view them.
              </li>
              <li>
                <strong>Processed via third-party AI:</strong> Your queries are
                sent to a third-party AI API provider for processing. The
                results come back to your account.
              </li>
              <li>
                <strong>Not used for AI training:</strong> We use an enterprise
                API tier where the provider does not train on customer data.
                This is their policy, not just ours.
              </li>
              <li>
                <strong>Not sold or shared:</strong> Your data is never sold to
                advertisers, data brokers, or any other third parties.
              </li>
            </ul>
          </Section>

          <Section title="Your IP Stays Yours">
            <p>
              We make no claims on anything you submit or anything we generate
              for you.
            </p>
            <ul>
              <li>
                <strong>No ownership claims:</strong> Your content and generated
                solutions belong entirely to you.
              </li>
              <li>
                <strong>Isolated processing:</strong> Your queries are processed
                in isolation. Nothing crosses between accounts.
              </li>
              <li>
                <strong>Full deletion:</strong> Request deletion anytime. We
                permanently remove everything.
              </li>
            </ul>
          </Section>

          <Section title="What We Can Access">
            <p>Our team can see:</p>
            <ul>
              <li>Your email address and subscription status.</li>
              <li>Anonymized usage statistics (page views, feature usage).</li>
              <li>
                Technical logs for debugging (timestamped events, not content).
              </li>
            </ul>

            <p>Our team cannot see:</p>
            <ul>
              <li>Your queries or prompts.</li>
              <li>Your generated reports.</li>
              <li>Your research data or uploaded content.</li>
              <li>Your payment details (Stripe handles this directly).</li>
            </ul>

            <p>
              Any access to account data requires justification, approval, and
              audit logging.
            </p>
          </Section>

          <Section title="Security">
            <ul>
              <li>
                <strong>Infrastructure:</strong> Hosted on SOC 2 Type II
                certified cloud providers.
              </li>
              <li>
                <strong>Access controls:</strong> Strict authentication and
                authorization at every level.
              </li>
              <li>
                <strong>Regular audits:</strong> Security testing and
                vulnerability scanning.
              </li>
            </ul>
          </Section>

          <Section title="Third-Party Services">
            <p>We rely on third-party services to operate Sparlo:</p>
            <ul>
              <li>
                <strong>AI processing:</strong> Your queries are processed by a
                third-party AI API provider. We use their enterprise tier, which
                contractually prohibits training on customer data.
              </li>
              <li>
                <strong>Authentication:</strong> Account login handled by
                Supabase Auth.
              </li>
              <li>
                <strong>Payments:</strong> Payment processing handled by Stripe.
                We never see your card details.
              </li>
              <li>
                <strong>Analytics:</strong> PostHog for usage analytics (opt-in
                only, privacy-focused).{' '}
                <a
                  href="https://posthog.com/privacy"
                  className="text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PostHog Privacy Policy
                </a>
                .
              </li>
            </ul>
          </Section>

          <Section title="What We Collect">
            <h4>Account information</h4>
            <p>
              Email, authentication credentials, and basic profile info from
              social logins.
            </p>

            <h4>Usage data</h4>
            <p>
              Pages visited, features used, and timestamps. This helps us
              improve the product.
            </p>

            <h4>Content you submit</h4>
            <p>
              Your queries and research topics are processed to generate
              solutions. This data stays in your account.
            </p>

            <h4>Payment</h4>
            <p>
              Handled entirely by Stripe. We never see or store card numbers.
            </p>
          </Section>

          <Section title="What We Do Not Do">
            <ul>
              <li>Sell your data to anyone.</li>
              <li>Share your data with advertisers or data brokers.</li>
              <li>Share data between customers.</li>
              <li>
                Use your queries for AI training (our provider&apos;s enterprise
                terms prohibit this).
              </li>
              <li>Access your reports or research content.</li>
            </ul>
          </Section>

          <Section title="Data Retention">
            <ul>
              <li>
                <strong>Active accounts:</strong> Data retained while active.
              </li>
              <li>
                <strong>Deletion:</strong> Permanently removed within 30 days of
                account deletion.
              </li>
              <li>
                <strong>Legal holds:</strong> May retain longer if required by
                law.
              </li>
            </ul>
          </Section>

          <Section title="Your Rights">
            <p>You can:</p>
            <ul>
              <li>Access a copy of your data.</li>
              <li>Correct inaccurate information.</li>
              <li>Delete your data and account.</li>
              <li>Export your data.</li>
              <li>Opt out of marketing.</li>
            </ul>
            <p>
              Contact{' '}
              <a href="mailto:privacy@sparlo.ai" className="text-primary">
                privacy@sparlo.ai
              </a>{' '}
              to exercise these rights.
            </p>
          </Section>

          <Section title="International Transfers">
            <p>
              Data is processed in the United States. We maintain appropriate
              safeguards for international transfers.
            </p>
          </Section>

          <Section title="Policy Changes">
            <p>
              We may update this policy. Material changes will be posted here
              and emailed to you. Continued use after changes means acceptance.
            </p>
          </Section>

          <Section title="Contact">
            <ul>
              <li>
                Privacy:{' '}
                <a href="mailto:privacy@sparlo.ai" className="text-primary">
                  privacy@sparlo.ai
                </a>
                .
              </li>
              <li>
                General:{' '}
                <a href="mailto:hello@sparlo.ai" className="text-primary">
                  hello@sparlo.ai
                </a>
                .
              </li>
            </ul>
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8 first:mt-0">
      <h3 className="mb-4 text-xl font-semibold tracking-tight">{title}</h3>
      <div className="text-muted-foreground space-y-3 leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-primary/30 bg-primary/5 my-4 rounded-lg border-l-4 p-4">
      <p className="text-foreground m-0">{children}</p>
    </div>
  );
}

export default withI18n(PrivacyPolicyPage);
