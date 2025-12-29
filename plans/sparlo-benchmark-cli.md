# Sparlo Benchmark CLI Tool

**Date:** 2025-12-26
**Type:** Enhancement
**Priority:** High

---

## Overview

Build a single-file Python CLI (~200 lines) to benchmark Sparlo vs Claude Opus 4.5 for ~50 engineering problems. Validates if Sparlo produces meaningfully better research than raw Claude with good prompting.

**Scope:** Simple script, not a product. Run manually, analyze results in Excel.

---

## Problem Statement

**Business Need:** Validate Sparlo's value proposition - does it produce better engineering research than Claude with good prompting?

**Scale:** ~50 problems total. Manual execution is fine.

**Success Metrics:**
- Win rate comparison (Sparlo vs Claude)
- Score breakdown by 6 evaluation dimensions
- Segment-based analysis (PDC/RDH/DTS/IDF)

---

## File Structure (Simplified)

```
sparlo-benchmark/
├── benchmark.py          # Single file with everything (~200 lines)
├── results.csv           # All data in one flat CSV
├── .env                  # API keys
├── .env.example
├── requirements.txt
└── README.md
```

**No separate modules.** Everything in one file for a 50-problem benchmark.

---

## Data Model

### Single CSV Schema (All-in-One)

One flat CSV file with all inputs, outputs, and scores:

```csv
# Inputs (from your spec)
problem_id              # UUID
created_at              # ISO timestamp
problem_text            # Full engineering problem
segment                 # PDC/RDH/DTS/IDF
problem_summary         # Short description
prior_art               # Low/Medium/High
domain_spec             # Single/Cross
contradiction           # Vague/Clear/Sharp
sweetspot_pred          # 1-5
expected_grade          # A/B/C/D/F

# Outputs
sparlo_output           # Full markdown report
claude_output           # Full markdown report
sparlo_status           # complete/error/timeout
claude_status           # complete/error/timeout
sparlo_time_sec         # Seconds to complete
claude_time_sec         # Seconds to complete

# Evaluation Scores (1-10 each)
sparlo_understanding
sparlo_novelty
sparlo_relevance
sparlo_credibility
sparlo_actionability
sparlo_citations
sparlo_total            # Sum

claude_understanding
claude_novelty
claude_relevance
claude_credibility
claude_actionability
claude_citations
claude_total            # Sum

# Comparison
winner                  # Sparlo/Claude/Tie
score_margin            # Difference in totals
sparlo_strengths        # Bullet points
claude_strengths        # Bullet points
key_insight             # One sentence
cross_domain_sparlo     # Count
cross_domain_claude     # Count
would_pay               # true/false
notes                   # Optional

# Status
evaluated               # true/false
```

### Evaluation Dimensions (6 scores, 1-10 each)

| Dimension | Description |
|-----------|-------------|
| **Understanding** | Correctly identified the core engineering contradiction |
| **Novelty** | Surfaced ideas the user wouldn't easily find |
| **Relevance** | Solutions are actually applicable to the problem |
| **Credibility** | An engineer would take this seriously |
| **Actionability** | Can pursue with information given |
| **Citations** | References are credible and verifiable |

---

## CLI Commands

### `benchmark generate`
Run a problem through both Sparlo and Claude APIs, save outputs.

```bash
benchmark generate \
  --problem "Our fruit gripper damages 12% of apples..." \
  --segment PDC \
  --summary "Fruit gripper damage" \
  --prior-art Medium \
  --domain Cross \
  --contradiction Sharp \
  --sweetspot 5 \
  --expected A
```

**Flow:**
1. Generate UUID for problem_id
2. Call Sparlo API (poll every 30 seconds until complete, ~25 min)
3. Call Claude API with engineering prompt (~30 seconds)
4. Write row to results.csv with `evaluated=false`
5. Print: "Done. Run 'benchmark evaluate' to score."

### `benchmark evaluate`
Score all unevaluated rows in results.csv.

```bash
benchmark evaluate
```

**Flow:**
1. Read results.csv, filter `evaluated=false`
2. For each row, call Claude with evaluation prompt (tool use for structured JSON)
3. Update row with all 12 scores + comparison fields
4. Set `evaluated=true`
5. Print summary: "Sparlo wins: X, Claude wins: Y, Ties: Z"

---

## Implementation

### benchmark.py (~200 lines)

```python
#!/usr/bin/env python3
"""Sparlo vs Claude benchmark CLI - Single file implementation"""

import csv
import os
import time
import uuid
from datetime import datetime
from pathlib import Path

import click
import requests
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

# Config
SPARLO_URL = os.getenv("SPARLO_API_URL", "https://sparlo-production.up.railway.app")
ANTHROPIC_KEY = os.getenv("ANTHROPIC_API_KEY")
CSV_FILE = Path("results.csv")

# CSV columns (flat structure)
CSV_COLUMNS = [
    "problem_id", "created_at", "problem_text", "segment", "problem_summary",
    "prior_art", "domain_spec", "contradiction", "sweetspot_pred", "expected_grade",
    "sparlo_output", "claude_output", "sparlo_status", "claude_status",
    "sparlo_time_sec", "claude_time_sec",
    "sparlo_understanding", "sparlo_novelty", "sparlo_relevance",
    "sparlo_credibility", "sparlo_actionability", "sparlo_citations", "sparlo_total",
    "claude_understanding", "claude_novelty", "claude_relevance",
    "claude_credibility", "claude_actionability", "claude_citations", "claude_total",
    "winner", "score_margin", "sparlo_strengths", "claude_strengths",
    "key_insight", "cross_domain_sparlo", "cross_domain_claude", "would_pay", "notes",
    "evaluated"
]

ENGINEERING_PROMPT = """You are a senior mechanical engineering consultant with 20+ years
of experience and deep expertise in TRIZ methodology. Your specialty is finding cross-domain
solutions — identifying mechanisms from unrelated industries that can solve novel engineering challenges.

Provide a comprehensive engineering research report:

## 1. Problem Analysis
- Core engineering contradiction
- Key constraints and success metrics
- Relevant TRIZ principles

## 2. Solution Concepts (6-10)
For each: Name, Mechanism (specific), Source Domain, Feasibility (H/M/L), Key Risks, First Test

## 3. Cross-Domain Opportunities
2-3 solutions from unrelated industries with explanation of the analogy

## 4. Recommendations
Top 2-3 to pursue, resources needed, 90-day timeline

Be specific, cite real examples, acknowledge uncertainty."""

EVALUATION_TOOL = {
    "name": "submit_evaluation",
    "description": "Submit structured evaluation scores",
    "input_schema": {
        "type": "object",
        "properties": {
            "sparlo_scores": {
                "type": "object",
                "properties": {
                    "understanding": {"type": "integer", "minimum": 1, "maximum": 10},
                    "novelty": {"type": "integer", "minimum": 1, "maximum": 10},
                    "relevance": {"type": "integer", "minimum": 1, "maximum": 10},
                    "credibility": {"type": "integer", "minimum": 1, "maximum": 10},
                    "actionability": {"type": "integer", "minimum": 1, "maximum": 10},
                    "citations": {"type": "integer", "minimum": 1, "maximum": 10}
                },
                "required": ["understanding", "novelty", "relevance", "credibility", "actionability", "citations"]
            },
            "claude_scores": {
                "type": "object",
                "properties": {
                    "understanding": {"type": "integer", "minimum": 1, "maximum": 10},
                    "novelty": {"type": "integer", "minimum": 1, "maximum": 10},
                    "relevance": {"type": "integer", "minimum": 1, "maximum": 10},
                    "credibility": {"type": "integer", "minimum": 1, "maximum": 10},
                    "actionability": {"type": "integer", "minimum": 1, "maximum": 10},
                    "citations": {"type": "integer", "minimum": 1, "maximum": 10}
                },
                "required": ["understanding", "novelty", "relevance", "credibility", "actionability", "citations"]
            },
            "winner": {"type": "string", "enum": ["Sparlo", "Claude", "Tie"]},
            "sparlo_strengths": {"type": "string"},
            "claude_strengths": {"type": "string"},
            "key_insight": {"type": "string"},
            "cross_domain_sparlo": {"type": "integer"},
            "cross_domain_claude": {"type": "integer"},
            "would_pay_for_sparlo": {"type": "boolean"},
            "notes": {"type": "string"}
        },
        "required": ["sparlo_scores", "claude_scores", "winner", "sparlo_strengths",
                     "claude_strengths", "key_insight", "cross_domain_sparlo",
                     "cross_domain_claude", "would_pay_for_sparlo"]
    }
}


def init_csv():
    """Create CSV with headers if it doesn't exist."""
    if not CSV_FILE.exists():
        with open(CSV_FILE, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
            writer.writeheader()


def run_sparlo(problem_text: str) -> tuple[str, str, float]:
    """Call Sparlo API and poll until complete. Returns (output, status, duration)."""
    start = time.time()

    # Create report
    resp = requests.post(
        f"{SPARLO_URL}/api/hybrid/reports",
        json={"designChallenge": problem_text},
        timeout=60
    )
    resp.raise_for_status()
    report_id = resp.json()["reportId"]
    click.echo(f"  Sparlo report created: {report_id}")

    # Poll until complete (max 35 minutes)
    while time.time() - start < 2100:
        time.sleep(30)  # Poll every 30 seconds

        status_resp = requests.get(f"{SPARLO_URL}/api/reports/{report_id}", timeout=30)
        data = status_resp.json()
        status = data.get("status")
        step = data.get("currentStep", "unknown")
        progress = data.get("phaseProgress", 0)

        click.echo(f"  Sparlo: {status} - {step} ({progress}%)")

        if status == "complete":
            duration = time.time() - start
            # Extract the report text from reportData
            report_data = data.get("reportData", {})
            if isinstance(report_data, dict):
                output = str(report_data.get("report", report_data))
            else:
                output = str(report_data)
            return (output, "complete", duration)
        elif status == "error":
            return ("", "error", time.time() - start)

    return ("", "timeout", time.time() - start)


def run_claude(problem_text: str) -> tuple[str, str, float]:
    """Call Claude API for engineering report. Returns (output, status, duration)."""
    start = time.time()
    client = Anthropic(api_key=ANTHROPIC_KEY)

    try:
        response = client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=8192,
            system=ENGINEERING_PROMPT,
            messages=[{"role": "user", "content": problem_text}]
        )
        duration = time.time() - start
        return (response.content[0].text, "complete", duration)
    except Exception as e:
        return (str(e), "error", time.time() - start)


def evaluate_outputs(problem_text: str, metadata: dict, sparlo_out: str, claude_out: str) -> dict:
    """Call Claude to evaluate both outputs. Returns structured scores."""
    client = Anthropic(api_key=ANTHROPIC_KEY)

    eval_prompt = f"""Evaluate these two engineering research outputs objectively.

METADATA:
- Segment: {metadata['segment']}
- Summary: {metadata['problem_summary']}
- Prior Art: {metadata['prior_art']}
- Domain: {metadata['domain_spec']}
- Contradiction: {metadata['contradiction']}
- Sweetspot: {metadata['sweetspot_pred']}
- Expected: {metadata['expected_grade']}

PROBLEM:
{problem_text}

OUTPUT A (SPARLO):
{sparlo_out[:50000]}

OUTPUT B (CLAUDE):
{claude_out[:50000]}

Score each on these dimensions (1-10):
1. Understanding - correctly identified contradiction?
2. Novelty - surfaced ideas user wouldn't find?
3. Relevance - solutions actually applicable?
4. Credibility - engineer would take seriously?
5. Actionability - can pursue with info given?
6. Citations - credible and verifiable?

Use the submit_evaluation tool with your scores."""

    response = client.messages.create(
        model="claude-opus-4-5-20251101",
        max_tokens=2048,
        tools=[EVALUATION_TOOL],
        tool_choice={"type": "tool", "name": "submit_evaluation"},
        messages=[{"role": "user", "content": eval_prompt}]
    )

    # Extract tool use result
    for block in response.content:
        if block.type == "tool_use":
            return block.input

    raise ValueError("No evaluation tool response received")


@click.group()
def cli():
    """Sparlo vs Claude benchmark CLI."""
    init_csv()


@cli.command()
@click.option('--problem', required=True, help='Engineering problem text')
@click.option('--segment', required=True, type=click.Choice(['PDC', 'RDH', 'DTS', 'IDF']))
@click.option('--summary', required=True, help='Short problem summary')
@click.option('--prior-art', required=True, type=click.Choice(['Low', 'Medium', 'High']))
@click.option('--domain', required=True, type=click.Choice(['Single', 'Cross']))
@click.option('--contradiction', required=True, type=click.Choice(['Vague', 'Clear', 'Sharp']))
@click.option('--sweetspot', required=True, type=click.IntRange(1, 5))
@click.option('--expected', required=True, type=click.Choice(['A', 'B', 'C', 'D', 'F']))
def generate(problem, segment, summary, prior_art, domain, contradiction, sweetspot, expected):
    """Run problem through Sparlo and Claude, save outputs."""
    problem_id = str(uuid.uuid4())
    click.echo(f"Starting benchmark {problem_id}...")
    click.echo(f"Problem: {problem[:100]}...")

    # Run Sparlo (this takes ~25 minutes)
    click.echo("\nRunning Sparlo API (this takes ~25 minutes)...")
    sparlo_out, sparlo_status, sparlo_time = run_sparlo(problem)
    click.echo(f"  Sparlo completed: {sparlo_status} in {sparlo_time:.0f}s")

    # Run Claude (this takes ~30 seconds)
    click.echo("\nRunning Claude API...")
    claude_out, claude_status, claude_time = run_claude(problem)
    click.echo(f"  Claude completed: {claude_status} in {claude_time:.0f}s")

    # Write to CSV
    row = {
        "problem_id": problem_id,
        "created_at": datetime.now().isoformat(),
        "problem_text": problem,
        "segment": segment,
        "problem_summary": summary,
        "prior_art": prior_art,
        "domain_spec": domain,
        "contradiction": contradiction,
        "sweetspot_pred": sweetspot,
        "expected_grade": expected,
        "sparlo_output": sparlo_out,
        "claude_output": claude_out,
        "sparlo_status": sparlo_status,
        "claude_status": claude_status,
        "sparlo_time_sec": sparlo_time,
        "claude_time_sec": claude_time,
        "evaluated": "false"
    }

    with open(CSV_FILE, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writerow(row)

    click.echo(f"\n✓ Saved to {CSV_FILE}")
    click.echo("Run 'benchmark evaluate' to score outputs.")


@cli.command()
def evaluate():
    """Evaluate all unevaluated rows in results.csv."""
    # Read all rows
    rows = []
    with open(CSV_FILE, 'r', newline='') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Find unevaluated rows
    to_evaluate = [r for r in rows if r.get('evaluated') == 'false'
                   and r.get('sparlo_status') == 'complete'
                   and r.get('claude_status') == 'complete']

    if not to_evaluate:
        click.echo("No rows to evaluate (all complete rows already evaluated)")
        return

    click.echo(f"Evaluating {len(to_evaluate)} problems...")

    for i, row in enumerate(to_evaluate):
        click.echo(f"\n[{i+1}/{len(to_evaluate)}] Evaluating {row['problem_id'][:8]}...")

        metadata = {
            'segment': row['segment'],
            'problem_summary': row['problem_summary'],
            'prior_art': row['prior_art'],
            'domain_spec': row['domain_spec'],
            'contradiction': row['contradiction'],
            'sweetspot_pred': row['sweetspot_pred'],
            'expected_grade': row['expected_grade']
        }

        try:
            result = evaluate_outputs(
                row['problem_text'],
                metadata,
                row['sparlo_output'],
                row['claude_output']
            )

            # Update row with scores
            sparlo = result['sparlo_scores']
            claude = result['claude_scores']

            row['sparlo_understanding'] = sparlo['understanding']
            row['sparlo_novelty'] = sparlo['novelty']
            row['sparlo_relevance'] = sparlo['relevance']
            row['sparlo_credibility'] = sparlo['credibility']
            row['sparlo_actionability'] = sparlo['actionability']
            row['sparlo_citations'] = sparlo['citations']
            row['sparlo_total'] = sum(sparlo.values())

            row['claude_understanding'] = claude['understanding']
            row['claude_novelty'] = claude['novelty']
            row['claude_relevance'] = claude['relevance']
            row['claude_credibility'] = claude['credibility']
            row['claude_actionability'] = claude['actionability']
            row['claude_citations'] = claude['citations']
            row['claude_total'] = sum(claude.values())

            row['winner'] = result['winner']
            row['score_margin'] = row['sparlo_total'] - row['claude_total']
            row['sparlo_strengths'] = result['sparlo_strengths']
            row['claude_strengths'] = result['claude_strengths']
            row['key_insight'] = result['key_insight']
            row['cross_domain_sparlo'] = result['cross_domain_sparlo']
            row['cross_domain_claude'] = result['cross_domain_claude']
            row['would_pay'] = str(result['would_pay_for_sparlo']).lower()
            row['notes'] = result.get('notes', '')
            row['evaluated'] = 'true'

            click.echo(f"  Winner: {result['winner']} (Sparlo: {row['sparlo_total']}, Claude: {row['claude_total']})")

        except Exception as e:
            click.echo(f"  Error evaluating: {e}")
            continue

    # Write all rows back
    with open(CSV_FILE, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
        writer.writeheader()
        writer.writerows(rows)

    # Summary
    evaluated = [r for r in rows if r.get('evaluated') == 'true']
    sparlo_wins = sum(1 for r in evaluated if r.get('winner') == 'Sparlo')
    claude_wins = sum(1 for r in evaluated if r.get('winner') == 'Claude')
    ties = sum(1 for r in evaluated if r.get('winner') == 'Tie')

    click.echo(f"\n{'='*40}")
    click.echo(f"RESULTS: Sparlo {sparlo_wins} | Claude {claude_wins} | Ties {ties}")
    click.echo(f"{'='*40}")


@cli.command()
def status():
    """Show benchmark status summary."""
    if not CSV_FILE.exists():
        click.echo("No results.csv found. Run 'benchmark generate' first.")
        return

    with open(CSV_FILE, 'r', newline='') as f:
        rows = list(csv.DictReader(f))

    total = len(rows)
    complete = sum(1 for r in rows if r.get('sparlo_status') == 'complete' and r.get('claude_status') == 'complete')
    evaluated = sum(1 for r in rows if r.get('evaluated') == 'true')
    sparlo_wins = sum(1 for r in rows if r.get('winner') == 'Sparlo')
    claude_wins = sum(1 for r in rows if r.get('winner') == 'Claude')

    click.echo(f"Total problems: {total}")
    click.echo(f"Complete (both APIs): {complete}")
    click.echo(f"Evaluated: {evaluated}")
    click.echo(f"Pending evaluation: {complete - evaluated}")
    if evaluated > 0:
        click.echo(f"\nResults: Sparlo {sparlo_wins} | Claude {claude_wins} | Ties {evaluated - sparlo_wins - claude_wins}")


if __name__ == '__main__':
    cli()
```

---

## Dependencies

### requirements.txt
```
click>=8.1.0
requests>=2.31.0
anthropic>=0.40.0
python-dotenv>=1.0.0
```

**Removed:** httpx, tenacity, polars, pydantic, tqdm (not needed for 50 problems)

### .env.example
```bash
ANTHROPIC_API_KEY=sk-ant-...
SPARLO_API_URL=https://sparlo-production.up.railway.app
```

---

## Usage

### Setup
```bash
cd sparlo-benchmark
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
```

### Run Benchmarks (One at a Time)
```bash
# Run a single problem
python benchmark.py generate \
  --problem "Our automated fruit harvesting gripper damages 12% of apples during pick. We need to reduce damage to <2% while maintaining 1.5 second cycle time." \
  --segment PDC \
  --summary "Fruit gripper damage" \
  --prior-art Medium \
  --domain Cross \
  --contradiction Sharp \
  --sweetspot 5 \
  --expected A

# Wait ~25 minutes for Sparlo to complete...

# Run more problems...
```

### Evaluate All Completed Benchmarks
```bash
python benchmark.py evaluate
```

### Check Status
```bash
python benchmark.py status
```

### Analyze in Excel
1. Open `results.csv` in Excel/Google Sheets
2. Create pivot tables by segment, prior_art, etc.
3. Calculate averages, compare scores

---

## Acceptance Criteria

- [ ] `benchmark generate` runs problem through both APIs
- [ ] Sparlo polling handles 25-minute waits correctly
- [ ] `benchmark evaluate` scores all 6 dimensions for both outputs
- [ ] All metadata fields captured in CSV
- [ ] `benchmark status` shows summary counts
- [ ] Results analyzable in Excel (flat CSV structure)

---

## Notes

**Why single file?**
- ~50 problems doesn't justify multi-file architecture
- Easier to read, debug, and modify
- Can refactor later if needed (you won't need to)

**Why synchronous requests instead of async?**
- You're running one problem at a time manually
- Polling every 30 seconds doesn't benefit from async
- simpler error handling

**Why no batch mode?**
- For 50 problems, run the command 50 times (or use a shell loop)
- Batch mode adds complexity for minimal value
- If you need it later, add a simple loop

**Analysis approach:**
- Open results.csv in Excel
- Filter by segment, prior_art, etc.
- Pivot tables for aggregation
- No need to build custom analysis tooling
