'use client';

import { motion } from 'framer-motion';
import { ArrowRight, FileText, FlaskConical, Lightbulb } from 'lucide-react';

import type { ExampleReport } from './data/types';

interface ReportCardProps {
  report: ExampleReport;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

const categoryIcons: Record<string, React.ReactNode> = {
  'Carbon Removal': <FlaskConical className="h-5 w-5" />,
  'Green H2': <Lightbulb className="h-5 w-5" />,
  'Advanced Materials': <FileText className="h-5 w-5" />,
  Waste: <FileText className="h-5 w-5" />,
};

export function ReportCard({
  report,
  isActive,
  onClick,
  index,
}: ReportCardProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative w-full text-left"
    >
      {/* Card container */}
      <div
        className={`
          relative overflow-hidden rounded-xl border p-6 transition-all duration-300
          ${
            isActive
              ? 'border-zinc-900 bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20'
              : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg'
          }
        `}
      >
        {/* Subtle gradient overlay for active state */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
        )}

        {/* Content */}
        <div className="relative">
          {/* Category with icon */}
          <div className="flex items-center gap-2">
            <span
              className={`${isActive ? 'text-zinc-400' : 'text-zinc-400'}`}
            >
              {categoryIcons[report.category] || <FileText className="h-5 w-5" />}
            </span>
            <span
              className={`text-[12px] font-semibold uppercase tracking-[0.08em] ${
                isActive ? 'text-zinc-400' : 'text-zinc-500'
              }`}
            >
              {report.category}
            </span>
          </div>

          {/* Title */}
          <h3
            className={`mt-4 text-[20px] font-semibold leading-tight tracking-[-0.02em] ${
              isActive ? 'text-white' : 'text-zinc-900'
            }`}
          >
            {report.title}
          </h3>

          {/* Subtitle */}
          <p
            className={`mt-2 text-[15px] leading-relaxed ${
              isActive ? 'text-zinc-400' : 'text-zinc-500'
            }`}
          >
            {report.subtitle}
          </p>

          {/* Stats row */}
          <div
            className={`mt-6 flex items-center gap-4 text-[13px] ${
              isActive ? 'text-zinc-500' : 'text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? 'bg-zinc-500' : 'bg-zinc-300'
                }`}
              />
              <span>{report.patents} patents</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? 'bg-zinc-500' : 'bg-zinc-300'
                }`}
              />
              <span>{report.papers} papers</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`h-1.5 w-1.5 rounded-full ${
                  isActive ? 'bg-zinc-500' : 'bg-zinc-300'
                }`}
              />
              <span>{report.readTime}</span>
            </div>
          </div>

          {/* Arrow indicator */}
          <div
            className={`absolute right-0 top-1/2 -translate-y-1/2 transition-all duration-300 ${
              isActive
                ? 'translate-x-0 opacity-100'
                : 'translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-50'
            }`}
          >
            <ArrowRight
              className={`h-5 w-5 ${isActive ? 'text-white' : 'text-zinc-400'}`}
            />
          </div>
        </div>
      </div>

      {/* Active indicator line */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute -bottom-3 left-1/2 h-1 w-12 -translate-x-1/2 rounded-full bg-zinc-900"
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      )}
    </motion.button>
  );
}
