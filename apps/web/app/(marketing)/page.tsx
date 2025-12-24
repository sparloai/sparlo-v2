import { withI18n } from '~/lib/i18n/with-i18n';

import { ExampleReportsSection } from './_components/example-reports/example-reports-section';
import { SparloHero } from './_components/sparlo-hero';

function Home() {
  return (
    <>
      <SparloHero />
      <ExampleReportsSection />
    </>
  );
}

export default withI18n(Home);
