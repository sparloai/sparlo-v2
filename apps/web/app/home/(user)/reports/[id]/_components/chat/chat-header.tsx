'use client';

import { memo } from 'react';

import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
}

export const ChatHeader = memo(function ChatHeader({
  onClose,
}: ChatHeaderProps) {
  return (
    <header
      className="relative flex items-center justify-between px-5 py-4"
      style={{
        background:
          'linear-gradient(180deg, rgba(21, 27, 38, 0.9) 0%, rgba(13, 17, 23, 0.6) 100%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Left section - Branding */}
      <div className="flex items-center gap-3">
        {/* Icon container */}
        <motion.div
          className="relative flex h-9 w-9 items-center justify-center rounded-lg"
          style={{
            background:
              'linear-gradient(135deg, rgba(100, 181, 246, 0.12) 0%, rgba(100, 181, 246, 0.06) 100%)',
            border: '1px solid rgba(100, 181, 246, 0.15)',
            boxShadow: '0 0 20px -5px rgba(100, 181, 246, 0.2)',
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
        >
          <Sparkles className="h-4 w-4" style={{ color: '#64b5f6' }} />
        </motion.div>

        {/* Title & subtitle */}
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <h2
            className="text-[14px] font-normal tracking-[-0.01em]"
            style={{
              color: '#f0f4f8',
              fontFamily: 'var(--font-heading), system-ui, sans-serif',
            }}
          >
            Report Assistant
          </h2>
          <p
            className="mt-0.5 text-[11px] tracking-normal"
            style={{
              color: '#5a6b8c',
              fontFamily: 'var(--font-heading), system-ui, sans-serif',
            }}
          >
            Ask questions about your analysis
          </p>
        </motion.div>
      </div>

      {/* Right section - Close */}
      <div className="flex items-center gap-3">
        {/* Status indicator */}
        <motion.div
          className="flex items-center gap-2 rounded-full px-2.5 py-1"
          style={{
            background: 'rgba(100, 181, 246, 0.08)',
            border: '1px solid rgba(100, 181, 246, 0.12)',
          }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: '#64b5f6',
              boxShadow: '0 0 8px 2px rgba(100, 181, 246, 0.4)',
            }}
          />
          <span
            className="text-[10px] font-normal tracking-wide"
            style={{
              color: '#64b5f6',
              fontFamily: 'var(--font-heading), system-ui, sans-serif',
            }}
          >
            Ready
          </span>
        </motion.div>

        {/* Close button */}
        <motion.button
          onClick={onClose}
          className="group flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
          whileHover={{
            background: 'rgba(255, 255, 255, 0.06)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
          whileTap={{ scale: 0.95 }}
          aria-label="Close assistant"
        >
          <X
            className="h-4 w-4 transition-colors duration-200"
            style={{ color: '#5a6b8c' }}
          />
        </motion.button>
      </div>

      {/* Bottom gradient line accent */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 10%, rgba(100, 181, 246, 0.15) 50%, transparent 90%)',
        }}
      />
    </header>
  );
});
