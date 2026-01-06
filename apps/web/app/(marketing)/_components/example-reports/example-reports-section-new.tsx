'use client';

import { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';

import { exampleReports } from './data/reports';
import { ReportCard } from './report-card';
import { ReportViewer } from './report-viewer';

export function ExampleReportsSectionNew() {
  const [activeReportId, setActiveReportId] = useState(exampleReports[0]!.id);
  const activeReport = exampleReports.find((r) => r.id === activeReportId)!;

  return (
    <section className="relative bg-zinc-50 px-6 py-24 md:px-8" id="example-reports">
      {/* Subtle background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-gradient-to-br from-zinc-200/50 to-transparent blur-3xl" />
        <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-zinc-200/50 to-transparent blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-[13px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
              Intelligence in Action
            </span>
            <h2 className="mt-4 text-[42px] font-semibold leading-[1.1] tracking-tight text-zinc-900 md:text-[52px]">
              See what a Sparlo report delivers
            </h2>
            <p className="mt-5 text-[18px] leading-relaxed text-zinc-600">
              Real reports. Real insights. Browse complete examples across
              industries—from carbon removal to advanced materials—and see how
              deep technical analysis unlocks breakthrough solutions.
            </p>
          </motion.div>
        </div>

        {/* Report Cards Grid */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {exampleReports.map((report, index) => (
            <ReportCard
              key={report.id}
              report={report}
              isActive={report.id === activeReportId}
              onClick={() => setActiveReportId(report.id)}
              index={index}
            />
          ))}
        </div>

        {/* Report Viewer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeReportId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <ReportViewer report={activeReport} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
