import { Check, X } from 'lucide-react';

interface TestGateProps {
  gate: {
    name: string;
    what_it_tests: string;
    method: string;
    go_criteria: string;
    no_go_criteria: string;
    effort: string;
  };
  gateNumber: number;
}

export function TestGate({ gate, gateNumber }: TestGateProps) {
  return (
    <div className="module">
      {/* Module Header */}
      <div className="module-header">
        <div className="module-header-left">
          <span className="module-type">Gate</span>
          <span className="module-id">{gateNumber}</span>
          <span className="gate-name">{gate.name}</span>
        </div>
        <div className="module-header-right">
          <span className="timeline-badge">{gate.effort}</span>
        </div>
      </div>

      {/* Module Body */}
      <div className="module-body module-body--compact">
        {/* What it tests */}
        <p className="gate-tests">{gate.what_it_tests}</p>

        {/* Method */}
        <div className="gate-method">
          <p className="gate-method-label">Method</p>
          <p className="gate-method-text">{gate.method}</p>
        </div>

        {/* GO / NO-GO validation framework */}
        <div className="validation-framework">
          <div className="validation-gate validation-gate--go">
            <div className="validation-gate-header">
              <Check className="validation-gate-icon" />
              <span className="validation-gate-label">GO if</span>
            </div>
            <p className="validation-gate-condition">{gate.go_criteria}</p>
          </div>
          <div className="validation-gate validation-gate--nogo">
            <div className="validation-gate-header">
              <X className="validation-gate-icon" />
              <span className="validation-gate-label">NO-GO if</span>
            </div>
            <p className="validation-gate-condition">{gate.no_go_criteria}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
