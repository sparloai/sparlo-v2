import { withI18n } from '~/lib/i18n/with-i18n';

import { EngineeringHero } from './_components/engineering-hero';
import { ExampleReportsSection } from './_components/example-reports/example-reports-section';
import { ProcessAnimation } from './_components/process-animation';

function Home() {
  // Default to 'engineers' mode - mode switching can be added later if needed
  const mode = 'engineers' as const;

  return (
    <>
      <EngineeringHero />
      <ProcessAnimation />
      <ExampleReportsSection mode={mode} />
    </>
  );
}

export default withI18n(Home);
