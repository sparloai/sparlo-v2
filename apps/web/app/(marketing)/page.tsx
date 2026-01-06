'use client';

import { EngineeringHero } from './_components/engineering-hero';
import { ExampleReportsSection } from './_components/example-reports/example-reports-section';
import { ProcessAnimation } from './_components/process-animation';

/**
 * Landing Page
 */
function Home() {
  return (
    <>
      <EngineeringHero />
      <ProcessAnimation />
      <ExampleReportsSection mode="engineers" />
    </>
  );
}

export default Home;
