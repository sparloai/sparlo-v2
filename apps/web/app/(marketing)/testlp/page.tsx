'use client';

import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { AnalysisAnimation } from '../_components/analysis-animation';
import { EngineeringHero } from '../_components/engineering-hero';
import { ExampleReportsSection } from '../_components/example-reports/example-reports-section';
import { MethodologySection } from '../_components/methodology-section';
import { type Mode, ModeTabs } from '../_components/mode-tabs';

/**
 * Get initial mode from URL hash (client-side only)
 */
function getInitialMode(): Mode {
  if (typeof window !== 'undefined' && window.location.hash === '#investors') {
    return 'investors';
  }
  return 'engineers';
}

/**
 * Test Landing Page
 *
 * Mirror of the main landing page for testing at /testlp
 */
function TestLandingPage() {
  const [mode, setMode] = useState<Mode>(getInitialMode);

  // Update URL hash on mode change
  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    window.history.replaceState(
      null,
      '',
      newMode === 'investors' ? '#investors' : window.location.pathname,
    );
  };

  return (
    <>
      <EngineeringHero />
      <AnalysisAnimation />
      <ModeTabs mode={mode} onModeChange={handleModeChange} />
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <MethodologySection mode={mode} />
          <ExampleReportsSection mode={mode} />
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default TestLandingPage;
