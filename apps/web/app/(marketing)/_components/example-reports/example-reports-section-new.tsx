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
    <section className="bg-zinc-50 px-6 py-24" id="example-reports">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="mb-2 text-2xl font-semibold text-zinc-900">
            Example Reports
          </h2>
          <p className="text-sm text-zinc-500">
            Explore real innovation intelligence reports across industries
          </p>
        </div>

        {/* Report Selector Cards */}
        <div className="scrollbar-hide mb-8 flex gap-4 overflow-x-auto pb-4">
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <ReportViewer report={activeReport} />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
