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
    <section className="bg-white px-6 py-24 md:px-8" id="example-reports">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-16">
          <h2 className="text-[36px] font-semibold tracking-tight text-zinc-900 md:text-[42px]">
            Example Reports
          </h2>
          <p className="mt-3 max-w-[50ch] text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-500">
            Explore real innovation intelligence reports across industries.
          </p>
        </div>

        {/* Report Selector */}
        <div className="scrollbar-hide mb-10 flex gap-0 overflow-x-auto border-b border-zinc-200">
          {exampleReports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              isActive={report.id === activeReportId}
              onClick={() => setActiveReportId(report.id)}
            />
          ))}
        </div>

        {/* Report Viewer */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeReportId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ReportViewer report={activeReport} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
