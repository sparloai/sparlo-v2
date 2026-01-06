'use client';

import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { EngineeringHero } from './_components/engineering-hero';
import { ExampleReportsSection } from './_components/example-reports/example-reports-section';
import { type Mode, ModeTabs } from './_components/mode-tabs';
import { ProcessAnimation } from './_components/process-animation';

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
 * Landing Page
 *
 * Features:
 * - Mode tabs for Engineers/Investors switching
 * - URL hash support for shareability (/#investors)
 * - Animated content transitions
 */
function Home() {
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
      <ModeTabs mode={mode} onModeChange={handleModeChange} />
      <ProcessAnimation />
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <ExampleReportsSection mode={mode} />
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default Home;
