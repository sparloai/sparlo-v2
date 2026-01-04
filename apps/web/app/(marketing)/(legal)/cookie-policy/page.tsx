import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:cookiePolicy'),
  };
}

async function CookiePolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing:cookiePolicy`)}
        subtitle={t(`marketing:cookiePolicyDescription`)}
      />

      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <p className="text-muted-foreground text-sm">
            Last updated: January 3, 2025
          </p>

          <Section title="What Are Cookies">
            <p>
              Cookies are small text files stored on your device when you visit
              a website. They help websites remember your preferences, keep you
              logged in, and understand how you use the site. This policy
              explains how Sparlo uses cookies and similar technologies.
            </p>
          </Section>

          <Section title="How We Use Cookies">
            <p>
              We use a minimal set of cookies necessary to provide and improve
              our Service. We prioritize your privacy and avoid unnecessary
              tracking.
            </p>

            <h4>Essential Cookies</h4>
            <p>
              These cookies are required for the Service to function and cannot
              be disabled:
            </p>
            <CookieTable
              cookies={[
                {
                  name: 'Authentication',
                  purpose: 'Keeps you logged in and maintains your session',
                  duration: 'Session / 30 days',
                },
                {
                  name: 'Security',
                  purpose: 'CSRF protection and security tokens',
                  duration: 'Session',
                },
                {
                  name: 'Preferences',
                  purpose: 'Remembers your theme and language settings',
                  duration: '1 year',
                },
              ]}
            />

            <h4>Functional Cookies</h4>
            <p>These cookies enhance your experience but are not essential:</p>
            <CookieTable
              cookies={[
                {
                  name: 'Recent Activity',
                  purpose: 'Remembers your recent reports and searches',
                  duration: '30 days',
                },
                {
                  name: 'UI State',
                  purpose: 'Preserves sidebar and panel states',
                  duration: 'Session',
                },
              ]}
            />

            <h4>Analytics Cookies (Consent Required)</h4>
            <p>
              We use PostHog for privacy-focused product analytics. These
              cookies are only set after you accept analytics cookies via our
              consent banner:
            </p>
            <CookieTable
              cookies={[
                {
                  name: 'ph_*',
                  purpose:
                    'PostHog analytics: tracks page views, feature usage, and conversion funnels to improve the Service',
                  duration: '1 year',
                },
                {
                  name: 'posthog_session_id',
                  purpose: 'Groups page views into sessions for usage analysis',
                  duration: 'Session',
                },
              ]}
            />
            <p className="text-sm">
              You can withdraw consent at any time by clearing cookies or using
              browser privacy settings. Analytics data is not used for
              advertising and is not shared with third parties.
            </p>
          </Section>

          <Section title="Cookies We Do Not Use">
            <p>We respect your privacy and do not use:</p>
            <ul>
              <li>
                <strong>Advertising cookies</strong> - We do not show ads or
                track you for advertising purposes
              </li>
              <li>
                <strong>Third-party tracking cookies</strong> - We do not allow
                social media or ad networks to track you on our site
              </li>
              <li>
                <strong>Cross-site tracking</strong> - We do not track your
                activity across other websites
              </li>
            </ul>
          </Section>

          <Section title="Third-Party Services">
            <p>
              Some features of our Service use third-party providers that may
              set their own cookies:
            </p>
            <ul>
              <li>
                <strong>Stripe</strong> - For payment processing. Stripe may set
                cookies to prevent fraud and process payments securely.{' '}
                <a
                  href="https://stripe.com/privacy"
                  className="text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Stripe Privacy Policy
                </a>
              </li>
              <li>
                <strong>Supabase</strong> - For authentication. Supabase sets
                cookies to maintain your login session.{' '}
                <a
                  href="https://supabase.com/privacy"
                  className="text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Supabase Privacy Policy
                </a>
              </li>
              <li>
                <strong>PostHog</strong> - For product analytics (consent
                required). PostHog helps us understand how users interact with
                the Service.{' '}
                <a
                  href="https://posthog.com/privacy"
                  className="text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PostHog Privacy Policy
                </a>
              </li>
            </ul>
          </Section>

          <Section title="Managing Cookies">
            <h4>Browser Settings</h4>
            <p>
              You can control cookies through your browser settings. Most
              browsers allow you to:
            </p>
            <ul>
              <li>View what cookies are stored</li>
              <li>Delete cookies individually or all at once</li>
              <li>Block cookies from specific sites</li>
              <li>Block all cookies (may affect site functionality)</li>
            </ul>

            <h4>Browser-Specific Instructions</h4>
            <ul>
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  className="text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                  className="text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                  className="text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                  className="text-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>

            <h4>Impact of Disabling Cookies</h4>
            <p>
              If you disable essential cookies, some features of the Service may
              not work properly:
            </p>
            <ul>
              <li>You may need to log in repeatedly</li>
              <li>Your preferences may not be saved</li>
              <li>Some security features may be affected</li>
            </ul>
          </Section>

          <Section title="Local Storage">
            <p>
              In addition to cookies, we use browser local storage to save
              preferences and improve performance. Local storage works similarly
              to cookies but can store more data. You can clear local storage
              through your browser&apos;s developer tools or settings.
            </p>
          </Section>

          <Section title="Updates to This Policy">
            <p>
              We may update this Cookie Policy from time to time. We will notify
              you of significant changes by posting the updated policy on our
              website. Your continued use of the Service after changes
              constitutes acceptance of the updated policy.
            </p>
          </Section>

          <Section title="Contact Us">
            <p>
              If you have questions about our use of cookies, please contact us
              at{' '}
              <a href="mailto:privacy@sparlo.ai" className="text-primary">
                privacy@sparlo.ai
              </a>
              .
            </p>
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

function CookieTable({
  cookies,
}: {
  cookies: { name: string; purpose: string; duration: string }[];
}) {
  return (
    <div className="my-4 overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2 text-left font-medium">Cookie</th>
            <th className="px-4 py-2 text-left font-medium">Purpose</th>
            <th className="px-4 py-2 text-left font-medium">Duration</th>
          </tr>
        </thead>
        <tbody>
          {cookies.map((cookie, index) => (
            <tr key={index} className="border-t">
              <td className="px-4 py-2 font-medium">{cookie.name}</td>
              <td className="text-muted-foreground px-4 py-2">
                {cookie.purpose}
              </td>
              <td className="text-muted-foreground px-4 py-2">
                {cookie.duration}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default withI18n(CookiePolicyPage);
