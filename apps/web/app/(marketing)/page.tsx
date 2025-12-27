import { withI18n } from '~/lib/i18n/with-i18n';

import { EngineeringHero } from './_components/engineering-hero';
import { ExampleReportsSection } from './_components/example-reports/example-reports-section';

function Home() {
  return (
    <>
      <EngineeringHero />
      <ExampleReportsSection />
    </>
  );
}

export default withI18n(Home);
