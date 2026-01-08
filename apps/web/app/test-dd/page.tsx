import { DDReportDisplay } from '../app/reports/[id]/_components/brand-system/dd-report-display';
import exampleData from '~/lib/llm/prompts/dd/example-dd5-output.json';

export default function TestDDPage() {
  return (
    <div className="min-h-screen bg-white">
      <DDReportDisplay
        reportData={{
          mode: 'dd',
          report: exampleData,
        }}
        title="ThermoCapture Inc - Test Report"
        showActions={false}
      />
    </div>
  );
}
