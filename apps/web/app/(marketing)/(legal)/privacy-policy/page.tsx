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
            Last updated: January 2, 2025
          </p>

          <Section title="Our Commitment to Your Privacy">
            <p>
              At Sparlo, we understand that R&D teams work with sensitive
              technical information and proprietary research. Protecting your
              intellectual property and maintaining the confidentiality of your
              data is fundamental to our service. This Privacy Policy explains
              how we collect, use, protect, and handle your information.
            </p>
          </Section>

          <Section title="1. Intellectual Property Protection">
            <Highlight>
              <strong>Your IP remains yours.</strong> We do not claim any
              ownership rights to the research data, technical specifications,
              or other content you submit to Sparlo. Your intellectual property
              is protected.
            </Highlight>

            <h4>Key IP Protections</h4>
            <ul>
              <li>
                <strong>No IP Claims:</strong> We make no claims to ownership of
                your submitted content or the solutions generated from it
              </li>
              <li>
                <strong>No Training on Your Data:</strong> Your proprietary data
                is not used to train our AI models or improve services for other
                customers
              </li>
              <li>
                <strong>Isolated Processing:</strong> Your queries and data are
                processed in isolation and are not shared across customer
                accounts
              </li>
              <li>
                <strong>Data Deletion:</strong> You can request deletion of your
                data at any time, and we will permanently remove it from our
                systems
              </li>
            </ul>
          </Section>

          <Section title="2. Information We Collect">
            <h4>Account Information</h4>
            <p>
              When you create an account, we collect your email address and
              authentication credentials. If you use social login providers, we
              receive basic profile information from those services.
            </p>

            <h4>Usage Data</h4>
            <p>
              We collect information about how you interact with our Service,
              including pages visited, features used, and timestamps. This helps
              us improve the user experience.
            </p>

            <h4>Technical Queries and Content</h4>
            <p>
              When you use our analysis features, we process the technical
              questions, research topics, and specifications you submit. This
              data is necessary to provide the Service and generate relevant
              solutions.
            </p>

            <h4>Payment Information</h4>
            <p>
              Payment processing is handled by Stripe. We do not store your
              credit card numbers or banking information on our servers. Stripe
              maintains PCI DSS compliance.
            </p>
          </Section>

          <Section title="3. Security Infrastructure">
            <Highlight>
              We implement enterprise-grade security measures to protect your
              data at every level.
            </Highlight>

            <h4>Data Encryption</h4>
            <ul>
              <li>
                <strong>In Transit:</strong> All data transmitted between your
                browser and our servers is encrypted using TLS 1.3
              </li>
              <li>
                <strong>At Rest:</strong> Data stored in our databases is
                encrypted using AES-256 encryption
              </li>
            </ul>

            <h4>Infrastructure Security</h4>
            <ul>
              <li>
                <strong>Cloud Infrastructure:</strong> We use industry-leading
                cloud providers with SOC 2 Type II certification
              </li>
              <li>
                <strong>Network Security:</strong> Our infrastructure is
                protected by firewalls, intrusion detection systems, and regular
                security monitoring
              </li>
              <li>
                <strong>Access Controls:</strong> Strict authentication and
                authorization controls limit access to systems and data
              </li>
            </ul>

            <h4>Application Security</h4>
            <ul>
              <li>Regular security audits and penetration testing</li>
              <li>Secure coding practices and code review processes</li>
              <li>Dependency monitoring and vulnerability scanning</li>
            </ul>
          </Section>

          <Section title="4. Team Access Restrictions">
            <Highlight>
              <strong>We operate on a principle of minimal access.</strong> Our
              team does not have routine access to your proprietary content.
            </Highlight>

            <h4>What Our Team Cannot Access</h4>
            <ul>
              <li>
                The specific content of your technical queries and research data
              </li>
              <li>Generated reports and solutions specific to your account</li>
              <li>Your payment card details (handled exclusively by Stripe)</li>
            </ul>

            <h4>What Our Team Can Access (When Necessary)</h4>
            <ul>
              <li>
                Account information (email, subscription status) for customer
                support
              </li>
              <li>
                Aggregated, anonymized usage statistics for service improvement
              </li>
              <li>
                Technical logs for debugging critical issues (with strict access
                controls and audit logging)
              </li>
            </ul>

            <p>
              Access to any customer data requires explicit justification,
              manager approval, and is logged for audit purposes.
            </p>
          </Section>

          <Section title="5. How We Use Your Information">
            <p>We use collected information to:</p>
            <ul>
              <li>Provide, maintain, and improve the Service</li>
              <li>Process your technical queries and generate solutions</li>
              <li>Send important account notifications and updates</li>
              <li>Respond to customer support requests</li>
              <li>
                Analyze aggregated usage patterns to improve user experience
              </li>
              <li>Prevent fraud and ensure security</li>
            </ul>

            <h4>What We Do Not Do</h4>
            <ul>
              <li>Sell your personal information to third parties</li>
              <li>Use your proprietary data for advertising purposes</li>
              <li>Share your data with other customers</li>
              <li>
                Train AI models on your specific queries without explicit
                consent
              </li>
            </ul>
          </Section>

          <Section title="6. Third-Party Services">
            <p>
              We use carefully selected third-party services that adhere to
              strict security and privacy standards:
            </p>
            <ul>
              <li>
                <strong>Authentication:</strong> Supabase Auth (SOC 2 compliant)
              </li>
              <li>
                <strong>Payment Processing:</strong> Stripe (PCI DSS Level 1
                compliant)
              </li>
              <li>
                <strong>AI Processing:</strong> Anthropic Claude (enterprise
                security standards)
              </li>
              <li>
                <strong>Analytics:</strong> Privacy-focused analytics that do
                not track individual users
              </li>
            </ul>
            <p>
              These providers are contractually bound to protect your data and
              use it only for the purposes specified.
            </p>
          </Section>

          <Section title="7. Data Retention">
            <p>
              We retain your data only as long as necessary to provide the
              Service:
            </p>
            <ul>
              <li>
                <strong>Active Accounts:</strong> Data is retained while your
                account is active
              </li>
              <li>
                <strong>Account Deletion:</strong> Upon account deletion, your
                data is permanently removed within 30 days
              </li>
              <li>
                <strong>Legal Requirements:</strong> Some data may be retained
                longer if required by law
              </li>
            </ul>
          </Section>

          <Section title="8. Your Rights">
            <p>You have the right to:</p>
            <ul>
              <li>
                <strong>Access:</strong> Request a copy of the data we hold
                about you
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate
                information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your data and
                account
              </li>
              <li>
                <strong>Export:</strong> Export your data in a portable format
              </li>
              <li>
                <strong>Opt-out:</strong> Unsubscribe from marketing
                communications
              </li>
            </ul>
            <p>
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@sparlo.ai" className="text-primary">
                privacy@sparlo.ai
              </a>
              .
            </p>
          </Section>

          <Section title="9. International Data Transfers">
            <p>
              Your data may be processed in the United States where our servers
              are located. We ensure appropriate safeguards are in place for
              international data transfers in compliance with applicable data
              protection laws.
            </p>
          </Section>

          <Section title="10. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of material changes by posting the updated policy on
              our website and, where appropriate, by email. Your continued use
              of the Service after changes constitutes acceptance of the updated
              policy.
            </p>
          </Section>

          <Section title="11. Contact Us">
            <p>
              If you have questions about this Privacy Policy or our data
              practices, please contact us:
            </p>
            <ul>
              <li>
                Email:{' '}
                <a href="mailto:privacy@sparlo.ai" className="text-primary">
                  privacy@sparlo.ai
                </a>
              </li>
              <li>
                General inquiries:{' '}
                <a href="mailto:hello@sparlo.ai" className="text-primary">
                  hello@sparlo.ai
                </a>
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
