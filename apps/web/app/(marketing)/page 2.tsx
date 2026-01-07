'use client';

import { EngineeringHero } from './_components/engineering-hero';
import { ExampleReportsSectionNew } from './_components/example-reports/example-reports-section-new';
import { ProcessAnimation } from './_components/process-animation';

/**
 * Landing Page
 */
function Home() {
  return (
    <>
      <EngineeringHero />
      <ProcessAnimation />
      <ExampleReportsSectionNew />
    </>
  );
}

export default Home;
