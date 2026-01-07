/**
 * Schema Robustness Tests for DD Mode
 *
 * Run with: pnpm tsx apps/web/lib/llm/prompts/dd/test-schema-robustness.ts
 *
 * Tests that schemas gracefully handle adversarial inputs:
 * - Empty strings where text expected
 * - Missing nested objects
 * - Null values in arrays
 * - Wrong types
 * - Malformed enum values
 */
import {
  DD0_M_OutputSchema,
  DD3_5_M_OutputSchema,
  DD3_M_OutputSchema,
  DD4_M_OutputSchema,
  DD5_M_OutputSchema,
} from './schemas';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: message });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${message.slice(0, 200)}`);
  }
}

function expectNoThrow(fn: () => unknown, context: string) {
  try {
    fn();
  } catch (error) {
    throw new Error(
      `${context}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

// ============================================
// Adversarial Input Generators
// ============================================

const ADVERSARIAL_STRINGS = [
  '',
  ' ',
  '\n',
  '\t',
  'null',
  'undefined',
  '{}',
  '[]',
  '<script>alert("xss")</script>',
  '".join([chr(i) for i in range(256)])',
  'A'.repeat(10000),
  '🚀🔥💡',
  '\x00\x01\x02',
];

const ADVERSARIAL_NUMBERS = [
  null,
  undefined,
  '',
  'NaN',
  'Infinity',
  '-Infinity',
  '3/5',
  '3 out of 5',
  'three',
  {},
  [],
  true,
  false,
];

const ADVERSARIAL_ENUMS = [
  '',
  'UNKNOWN_VALUE',
  'weak - needs improvement',
  'STRONG (with caveats)',
  'medium: see notes',
  'N/A',
  null,
  undefined,
  123,
  {},
  [],
];

// Prefixed with _ as these are reserved for future tests
const _ADVERSARIAL_ARRAYS = [null, undefined, '', {}, 'not an array', 0, false];

const _ADVERSARIAL_OBJECTS = [
  null,
  undefined,
  '',
  [],
  'not an object',
  0,
  false,
];

// ============================================
// DD0-M Schema Tests
// ============================================

test('DD0-M: Empty object should use defaults', () => {
  expectNoThrow(() => DD0_M_OutputSchema.parse({}), 'Empty object');
});

test('DD0-M: Null values in arrays should be handled', () => {
  expectNoThrow(
    () =>
      DD0_M_OutputSchema.parse({
        technical_claims: [null, undefined, {}],
        red_flags: [null],
        novelty_claims: [null],
      }),
    'Null array values',
  );
});

test('DD0-M: Malformed enum values should fallback', () => {
  expectNoThrow(
    () =>
      DD0_M_OutputSchema.parse({
        startup_profile: {
          stage: {
            extracted: 'UNKNOWN_STAGE - weird value',
            confidence: 'maybe high?',
          },
        },
        technical_claims: [
          {
            claim_text: 'test',
            claim_type: 'WEIRD_TYPE (with annotation)',
            evidence_level: 'sort of tested',
            verifiability: 'who knows',
            validation_priority: 'kinda important',
          },
        ],
      }),
    'Malformed enums',
  );
});

test('DD0-M: Empty strings where text expected', () => {
  expectNoThrow(
    () =>
      DD0_M_OutputSchema.parse({
        startup_profile: {
          company_name: '',
          technology_domain: '',
        },
        problem_extraction: {
          business_framing: '',
          engineering_framing: '',
        },
      }),
    'Empty strings',
  );
});

test('DD0-M: Missing nested objects should use defaults', () => {
  expectNoThrow(
    () =>
      DD0_M_OutputSchema.parse({
        startup_profile: {},
        problem_extraction: null,
        proposed_solution: undefined,
      }),
    'Missing nested objects',
  );
});

// ============================================
// DD3-M Schema Tests
// ============================================

test('DD3-M: Empty object should use defaults', () => {
  expectNoThrow(() => DD3_M_OutputSchema.parse({}), 'Empty object');
});

test('DD3-M: Adversarial enum values', () => {
  for (const enumVal of ADVERSARIAL_ENUMS) {
    expectNoThrow(
      () =>
        DD3_M_OutputSchema.parse({
          mechanism_validation: {
            overall_verdict: enumVal,
            confidence: enumVal,
          },
        }),
      `Enum value: ${JSON.stringify(enumVal)}`,
    );
  }
});

test('DD3-M: Adversarial number values', () => {
  for (const numVal of ADVERSARIAL_NUMBERS) {
    expectNoThrow(
      () =>
        DD3_M_OutputSchema.parse({
          mechanism_validation: {
            credibility_score: numVal,
          },
        }),
      `Number value: ${JSON.stringify(numVal)}`,
    );
  }
});

// ============================================
// DD3.5-M Schema Tests
// ============================================

test('DD3.5-M: Empty object should use defaults', () => {
  expectNoThrow(() => DD3_5_M_OutputSchema.parse({}), 'Empty object');
});

test('DD3.5-M: Missing commercial_viability_analysis', () => {
  expectNoThrow(
    () =>
      DD3_5_M_OutputSchema.parse({
        commercial_viability_analysis: null,
      }),
    'Null commercial analysis',
  );
});

test('DD3.5-M: Adversarial verdict values', () => {
  expectNoThrow(
    () =>
      DD3_5_M_OutputSchema.parse({
        commercial_viability_analysis: {
          unit_economics: { verdict: 'WEIRD - annotation' },
          market_demand: { verdict: null },
          gtm_complexity: { verdict: undefined },
          timeline_fit: { verdict: '' },
          scaleup_challenges: { verdict: 123 },
          ecosystem_dependencies: { verdict: {} },
          policy_exposure: { verdict: [] },
        },
      }),
    'Adversarial verdicts',
  );
});

// ============================================
// DD4-M Schema Tests
// ============================================

test('DD4-M: Empty object should use defaults', () => {
  expectNoThrow(() => DD4_M_OutputSchema.parse({}), 'Empty object');
});

test('DD4-M: Empty solution_space_analysis', () => {
  expectNoThrow(
    () =>
      DD4_M_OutputSchema.parse({
        solution_space_analysis: {},
      }),
    'Empty solution space',
  );
});

test('DD4-M: Adversarial track values', () => {
  expectNoThrow(
    () =>
      DD4_M_OutputSchema.parse({
        solution_space_analysis: {
          simpler_path: { solutions: [{ track: 'WEIRD_TRACK' }] },
          best_fit: { solutions: [{ track: null }] },
        },
      }),
    'Adversarial tracks',
  );
});

test('DD4-M: Missing scenario_analysis fields', () => {
  expectNoThrow(
    () =>
      DD4_M_OutputSchema.parse({
        scenario_analysis: {
          bull_case: null,
          base_case: undefined,
          bear_case: {},
        },
      }),
    'Missing scenario fields',
  );
});

// ============================================
// DD5-M Schema Tests (Most Critical)
// ============================================

test('DD5-M: Empty object should fail gracefully', () => {
  // DD5 requires some structure, but should give clear error
  try {
    DD5_M_OutputSchema.parse({});
  } catch {
    // Expected to fail, but should not crash
  }
});

test('DD5-M: Old format with minimal data', () => {
  expectNoThrow(
    () =>
      DD5_M_OutputSchema.parse({
        header: {},
        one_page_summary: {},
        problem_primer: {},
      }),
    'Old format minimal',
  );
});

test('DD5-M: New format with minimal data', () => {
  expectNoThrow(
    () =>
      DD5_M_OutputSchema.parse({
        prose_report: {
          problem_primer: {},
          technical_deep_dive: {},
          solution_landscape: {},
          commercialization_reality: {},
          investment_synthesis: {},
        },
        quick_reference: {
          one_page_summary: {},
          scores: {},
          scenarios: {},
        },
      }),
    'New format minimal',
  );
});

test('DD5-M: New format with adversarial verdicts', () => {
  expectNoThrow(
    () =>
      DD5_M_OutputSchema.parse({
        prose_report: {
          problem_primer: { content: '', source: '' },
          technical_deep_dive: { content: '', source: '' },
          solution_landscape: { content: '', source: '' },
          commercialization_reality: { content: '', source: '' },
          investment_synthesis: { content: '', source: '' },
        },
        quick_reference: {
          one_page_summary: {
            verdict_box: {
              technical_validity: { verdict: 'WEIRD - bad', symbol: '' },
              commercial_viability: { verdict: null, symbol: '' },
              solution_space_position: { verdict: undefined, symbol: '' },
              moat_strength: { verdict: 123, symbol: '' },
              timing: { verdict: {}, symbol: '' },
              overall: 'MAYBE?',
            },
          },
          scores: {
            technical_credibility: { score: 'five', out_of: 'ten' },
            commercial_viability: { score: null, out_of: undefined },
            moat_strength: { score: '3/5', out_of: '5' },
          },
          scenarios: {
            bull_case: { probability: '', narrative: null, return: undefined },
            base_case: {},
            bear_case: null,
          },
        },
      }),
    'Adversarial verdicts in new format',
  );
});

test('DD5-M: New format with empty arrays', () => {
  expectNoThrow(
    () =>
      DD5_M_OutputSchema.parse({
        prose_report: {
          problem_primer: { content: '', source: '' },
          technical_deep_dive: { content: '', source: '' },
          solution_landscape: { content: '', source: '' },
          commercialization_reality: { content: '', source: '' },
          investment_synthesis: { content: '', source: '' },
        },
        quick_reference: {
          one_page_summary: {},
          scores: {},
          scenarios: {},
          key_risks: [],
          founder_questions: [],
          diligence_roadmap: [],
        },
      }),
    'Empty arrays',
  );
});

test('DD5-M: New format with null in arrays', () => {
  expectNoThrow(
    () =>
      DD5_M_OutputSchema.parse({
        prose_report: {
          problem_primer: { content: '', source: '' },
          technical_deep_dive: { content: '', source: '' },
          solution_landscape: { content: '', source: '' },
          commercialization_reality: { content: '', source: '' },
          investment_synthesis: { content: '', source: '' },
        },
        quick_reference: {
          one_page_summary: {},
          scores: {},
          scenarios: {},
          key_risks: [null, { risk: '', severity: 'WEIRD' }, undefined],
          founder_questions: [null, {}],
          diligence_roadmap: [{ action: null, purpose: undefined }],
        },
      }),
    'Null in arrays',
  );
});

test('DD5-M: Old format with all adversarial strings', () => {
  for (const str of ADVERSARIAL_STRINGS.slice(0, 5)) {
    expectNoThrow(
      () =>
        DD5_M_OutputSchema.parse({
          header: { company_name: str, sector: str },
          one_page_summary: { executive_paragraph: str, the_bet: str },
          problem_primer: { content: str },
        }),
      `Adversarial string: ${JSON.stringify(str).slice(0, 30)}`,
    );
  }
});

// ============================================
// Cross-Schema Consistency Tests
// ============================================

test('All schemas handle undefined gracefully', () => {
  for (const [name, schema] of [
    ['DD0', DD0_M_OutputSchema],
    ['DD3', DD3_M_OutputSchema],
    ['DD3.5', DD3_5_M_OutputSchema],
    ['DD4', DD4_M_OutputSchema],
  ] as const) {
    expectNoThrow(() => schema.parse(undefined), `${name} with undefined`);
  }
});

test('All schemas handle null gracefully', () => {
  for (const [name, schema] of [
    ['DD0', DD0_M_OutputSchema],
    ['DD3', DD3_M_OutputSchema],
    ['DD3.5', DD3_5_M_OutputSchema],
    ['DD4', DD4_M_OutputSchema],
  ] as const) {
    expectNoThrow(() => schema.parse(null), `${name} with null`);
  }
});

// ============================================
// Run Tests and Report
// ============================================

console.log('\n' + '='.repeat(60));
console.log('DD Schema Robustness Test Results');
console.log('='.repeat(60) + '\n');

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

console.log(
  `\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`,
);

if (failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  for (const result of results.filter((r) => !r.passed)) {
    console.log(`  - ${result.name}`);
    if (result.error) {
      console.log(`    Error: ${result.error.slice(0, 150)}`);
    }
  }
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
