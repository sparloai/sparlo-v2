#!/usr/bin/env npx tsx
/**
 * UX/UI Audit Hook for Claude Code PostToolUse
 *
 * Triggers Playwright accessibility and design system tests after UI file changes.
 * Exit 0 = pass, Exit 2 = fail with errors sent to Claude via stderr.
 *
 * SECURITY: Validates all input paths, uses secure temp files.
 */
import { execSync, spawnSync } from 'child_process';
import {
  existsSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join, resolve, normalize } from 'path';

// Environment variables from Claude Code
const FILE_PATHS = process.env.CLAUDE_FILE_PATHS || '';
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const AUDIT_MODE = process.env.SPARLO_AUDIT_HOOK || 'enabled';

// Convergence protection
const MAX_ITERATIONS = 5;
const ITERATION_FILE = join(PROJECT_DIR, '.claude', 'hooks', '.iteration-count');

// Test mapping configuration
const TEST_MAPPING_FILE = join(
  PROJECT_DIR,
  '.claude',
  'hooks',
  'test-mapping.json'
);

interface TestMapping {
  mappings: Array<{
    pattern: string;
    tests: string[];
  }>;
  fallback: string[];
}

interface TestResult {
  title: string;
  file: string;
  line?: number;
  error: string;
  severity: 'critical' | 'serious' | 'moderate';
  suggestion?: string;
}

// Security: Validate and sanitize paths
function validatePath(path: string): boolean {
  const normalized = normalize(resolve(path));
  const projectNormalized = normalize(resolve(PROJECT_DIR));
  return normalized.startsWith(projectNormalized);
}

function isUIFile(filePath: string): boolean {
  if (!validatePath(filePath)) return false;
  const uiPattern = /\.(tsx|jsx|css)$/;
  const excludePattern = /(\.test\.|\.spec\.|_lib\/server|\/api\/)/;
  return uiPattern.test(filePath) && !excludePattern.test(filePath);
}

function checkDevServer(): boolean {
  try {
    execSync('curl -sf --max-time 2 http://localhost:3000 >/dev/null 2>&1', {
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
}

function incrementIteration(): number {
  let count = 1;
  if (existsSync(ITERATION_FILE)) {
    try {
      count = parseInt(readFileSync(ITERATION_FILE, 'utf-8'), 10) + 1;
    } catch {
      count = 1;
    }
  }
  writeFileSync(ITERATION_FILE, count.toString());
  return count;
}

function resetIteration(): void {
  if (existsSync(ITERATION_FILE)) rmSync(ITERATION_FILE);
}

function loadTestMapping(): TestMapping {
  try {
    if (existsSync(TEST_MAPPING_FILE)) {
      return JSON.parse(readFileSync(TEST_MAPPING_FILE, 'utf-8'));
    }
  } catch {
    // Fall through to default
  }
  return {
    mappings: [],
    fallback: ['learning-loop/'],
  };
}

function matchesPattern(filePath: string, pattern: string): boolean {
  // Simple glob matching
  const regexPattern = pattern
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\//g, '\\/');
  return new RegExp(regexPattern).test(filePath);
}

function getTestsForFiles(files: string[]): string[] {
  const mapping = loadTestMapping();
  const tests = new Set<string>();

  for (const file of files) {
    let matched = false;
    for (const m of mapping.mappings) {
      if (matchesPattern(file, m.pattern)) {
        m.tests.forEach((t) => tests.add(t));
        matched = true;
      }
    }
    if (!matched) {
      mapping.fallback.forEach((t) => tests.add(t));
    }
  }

  return Array.from(tests);
}

function parsePlaywrightOutput(outputPath: string): TestResult[] {
  try {
    const output = JSON.parse(readFileSync(outputPath, 'utf-8'));
    const results: TestResult[] = [];

    const processSpecs = (specs: any[], file: string) => {
      for (const spec of specs || []) {
        if (!spec.ok) {
          for (const test of spec.tests || []) {
            for (const result of test.results || []) {
              if (result.error) {
                results.push({
                  title: spec.title,
                  file: file || spec.file || 'unknown',
                  line: spec.line,
                  error: result.error.message || 'Unknown error',
                  severity: getSeverity(spec.title, result.error.message),
                  suggestion: getSuggestion(spec.title, result.error.message),
                });
              }
            }
          }
        }
      }
    };

    const processSuite = (suite: any, file: string) => {
      processSpecs(suite.specs, file);
      for (const innerSuite of suite.suites || []) {
        processSuite(innerSuite, suite.file || file);
      }
    };

    for (const suite of output.suites || []) {
      processSuite(suite, suite.file || '');
    }

    return results;
  } catch {
    return [];
  }
}

function getSeverity(
  title: string,
  error: string
): 'critical' | 'serious' | 'moderate' {
  if (
    title.includes('WCAG') ||
    error.includes('color-contrast') ||
    error.includes('critical')
  ) {
    return 'critical';
  }
  if (
    error.includes('touch target') ||
    error.includes('label') ||
    title.includes('accessibility')
  ) {
    return 'serious';
  }
  return 'moderate';
}

function getSuggestion(title: string, error: string): string {
  if (error.includes('color-contrast')) {
    return 'Use zinc-700 or darker for text on white backgrounds. Ref: docs/SPARLO-DESIGN-SYSTEM.md#color-palette';
  }
  if (error.includes('touch target') || error.includes('44x44')) {
    return 'Add min-h-[44px] min-w-[44px] to interactive elements.';
  }
  if (error.includes('label')) {
    return 'Add aria-label or associate with <label for="id">.';
  }
  if (error.includes('typography') || error.includes('font-size')) {
    return 'Use text-lg (18px) for body or text-sm (13px) for captions. Ref: docs/SPARLO-DESIGN-SYSTEM.md#typography';
  }
  if (error.includes('color') || error.includes('zinc')) {
    return 'Use only design system colors: zinc-950, zinc-700, zinc-500, zinc-400. Ref: docs/SPARLO-DESIGN-SYSTEM.md#color-palette';
  }
  if (error.includes('border-l')) {
    return 'Use left border accent pattern: border-l-2 border-zinc-900 pl-10. Ref: docs/SPARLO-DESIGN-SYSTEM.md#patterns';
  }
  if (error.includes('screenshot') || error.includes('visual')) {
    return 'Visual regression detected. Run `npx playwright test --update-snapshots` if change is intentional.';
  }
  return 'See docs/SPARLO-DESIGN-SYSTEM.md for design patterns.';
}

function formatErrors(results: TestResult[]): string {
  if (results.length === 0) return '';

  const critical = results.filter((r) => r.severity === 'critical');
  const serious = results.filter((r) => r.severity === 'serious');
  const moderate = results.filter((r) => r.severity === 'moderate');

  let output = `UX/UI AUDIT FAILED (${critical.length} critical, ${serious.length} serious, ${moderate.length} moderate)\n\n`;

  if (critical.length > 0) {
    output += 'CRITICAL:\n';
    for (const r of critical.slice(0, 3)) {
      output += `  [${r.file}${r.line ? `:${r.line}` : ''}] ${r.title}\n`;
      output += `   Error: ${r.error.slice(0, 200)}\n`;
      if (r.suggestion) output += `   Fix: ${r.suggestion}\n`;
      output += '\n';
    }
  }

  if (serious.length > 0) {
    output += 'SERIOUS:\n';
    for (const r of serious.slice(0, 2)) {
      output += `  [${r.file}${r.line ? `:${r.line}` : ''}] ${r.title}\n`;
      output += `   Error: ${r.error.slice(0, 200)}\n`;
      if (r.suggestion) output += `   Fix: ${r.suggestion}\n`;
      output += '\n';
    }
  }

  if (moderate.length > 0 && critical.length === 0 && serious.length === 0) {
    output += 'MODERATE:\n';
    for (const r of moderate.slice(0, 2)) {
      output += `  [${r.file}${r.line ? `:${r.line}` : ''}] ${r.title}\n`;
      output += `   Error: ${r.error.slice(0, 150)}\n`;
      output += '\n';
    }
  }

  return output;
}

// Main execution
function main(): void {
  // Check if disabled
  if (AUDIT_MODE === 'disabled') {
    process.exit(0);
  }

  // Check if any file paths provided
  if (!FILE_PATHS.trim()) {
    process.exit(0);
  }

  // Filter to UI files only
  const files = FILE_PATHS.split(' ').filter((f) => f.trim());
  const uiFiles = files.filter(isUIFile);

  if (uiFiles.length === 0) {
    console.log('No UI files changed, skipping audit');
    process.exit(0);
  }

  // Check dev server
  if (!checkDevServer()) {
    console.error('ERROR: Dev server not running at http://localhost:3000');
    console.error('Start with: pnpm dev');
    process.exit(2);
  }

  // Convergence protection
  const iteration = incrementIteration();
  if (iteration > MAX_ITERATIONS) {
    console.error(`WARNING: ${iteration} consecutive audit failures.`);
    console.error('Consider: SPARLO_AUDIT_HOOK=disabled to skip temporarily.');
    // Continue but warn - don't block forever
  }

  // Get tests to run based on changed files
  const testsToRun = getTestsForFiles(uiFiles);

  // Create secure temp directory
  const tempDir = mkdtempSync(join(tmpdir(), 'ux-audit-'));
  const outputPath = join(tempDir, 'results.json');

  try {
    // Build test arguments
    const testArgs = testsToRun.map((t) =>
      t.startsWith('learning-loop/') ? `tests/${t}` : `tests/learning-loop/${t}`
    );

    // Run Playwright tests with learning-loop project (no auth required)
    // Use line reporter for readable output
    const result = spawnSync(
      'npx',
      ['playwright', 'test', ...testArgs, '--project=learning-loop', '--reporter=line'],
      {
        cwd: join(PROJECT_DIR, 'apps', 'e2e'),
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 60000,
        env: { ...process.env, CI: 'true', DOTENV_CONFIG_QUIET: 'true' },
      }
    );

    const stdout = result.stdout?.toString() || '';
    const stderr = result.stderr?.toString() || '';

    if (result.status !== 0) {
      console.error('UX/UI AUDIT FAILED\n');

      // Extract meaningful error lines from output
      const allOutput = stdout + '\n' + stderr;
      const lines = allOutput.split('\n');

      // Filter to show relevant error information
      const relevantLines = lines.filter((line) => {
        const lower = line.toLowerCase();
        return (
          line.includes('ACCESSIBILITY VIOLATIONS') ||
          line.includes('COLOR CONTRAST') ||
          line.includes('TOUCH TARGET') ||
          line.includes('KEYBOARD NAVIGATION') ||
          line.includes('MISSING ACCESSIBLE') ||
          line.includes('FORM LABEL') ||
          line.includes('COLOR VIOLATIONS') ||
          line.includes('Error:') ||
          line.includes('failed') ||
          line.includes('Fix:') ||
          line.includes('Ref:') ||
          (line.includes('[') && (lower.includes('critical') || lower.includes('serious')))
        );
      });

      if (relevantLines.length > 0) {
        console.error(relevantLines.slice(0, 15).join('\n'));
      } else {
        // Fallback: show last few lines of output
        const lastLines = lines.filter((l) => l.trim()).slice(-10);
        console.error(lastLines.join('\n'));
      }

      console.error('\nRef: docs/SPARLO-DESIGN-SYSTEM.md');

      if (AUDIT_MODE === 'warnings-only') {
        process.exit(0);
      }
      process.exit(2);
    }

    // Success - reset iteration counter
    resetIteration();
    console.log('UX/UI audit passed');
    process.exit(0);
  } finally {
    // Cleanup temp files
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

main();
