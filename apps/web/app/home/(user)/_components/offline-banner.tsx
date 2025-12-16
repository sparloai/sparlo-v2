'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';

import { useOnlineStatus } from '../_lib/use-online-status';

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          className="fixed top-0 right-0 left-0 z-[100] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-white"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <WifiOff className="h-4 w-4" />
          <span>
            You're offline. Some features may not work until you're back online.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
