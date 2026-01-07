'use client';

import { EngineeringHero } from './_components/engineering-hero';
import { ExampleReportsFull } from './_components/example-reports/example-reports-full';
import { ProcessAnimation } from './_components/process-animation';

/**
 * Landing Page
 */
function Home() {
  return (
    <>
      <EngineeringHero />
      <ProcessAnimation />
      <ExampleReportsFull />
    </>
  );
}

export default Home;
