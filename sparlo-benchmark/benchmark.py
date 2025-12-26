#!/usr/bin/env python3
"""Sparlo vs Claude benchmark CLI - Single file implementation"""

import csv
import json
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
BENCHMARK_API_KEY = os.getenv("BENCHMARK_API_KEY")
CSV_FILE = Path("results.csv")
REPORTS_DIR = Path("reports")

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
    "key_insight", "cross_domain_sparlo", "cross_domain_claude",
    "cross_domain_list_sparlo", "cross_domain_list_claude",
    "would_pay", "would_pay_rationale", "verdict_summary", "scoring_rationale",
    "notes", "evaluated"
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
    "description": "Submit structured evaluation with detailed scoring rationale",
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
            "scoring_rationale": {
                "type": "object",
                "description": "Detailed per-dimension analysis with quotes and evidence",
                "properties": {
                    "understanding": {"type": "string", "description": "Analysis of how each output identified the core contradiction, with specific quotes"},
                    "novelty": {"type": "string", "description": "Analysis of unique insights surfaced, with specific quotes from each output"},
                    "relevance": {"type": "string", "description": "Analysis of practical applicability of solutions proposed"},
                    "credibility": {"type": "string", "description": "Analysis of technical depth and whether an engineer would take it seriously"},
                    "actionability": {"type": "string", "description": "Analysis of whether solutions can be pursued with information given"},
                    "citations": {"type": "string", "description": "Analysis of citation quality - patents, papers, named researchers vs generic references"}
                },
                "required": ["understanding", "novelty", "relevance", "credibility", "actionability", "citations"]
            },
            "winner": {"type": "string", "enum": ["Sparlo", "Claude", "Tie"]},
            "sparlo_strengths": {"type": "string", "description": "Key strengths of Sparlo output with specific examples"},
            "claude_strengths": {"type": "string", "description": "Key strengths of Claude output with specific examples"},
            "key_insight": {"type": "string", "description": "The single most important differentiator between the outputs"},
            "cross_domain_sparlo": {"type": "integer", "description": "Count of cross-domain solutions in Sparlo output"},
            "cross_domain_claude": {"type": "integer", "description": "Count of cross-domain solutions in Claude output"},
            "cross_domain_list_sparlo": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of cross-domain sources cited by Sparlo (e.g., 'Laboratory hot plate stirrers', 'Medical blood warmers')"
            },
            "cross_domain_list_claude": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of cross-domain sources cited by Claude"
            },
            "would_pay_for_sparlo": {"type": "boolean", "description": "Would you pay $50+ for the Sparlo report?"},
            "would_pay_rationale": {"type": "string", "description": "Justification for would_pay decision - what specific value justifies (or doesn't justify) the cost"},
            "verdict_summary": {"type": "string", "description": "2-4 sentence summary of why the winner won, citing specific evidence"},
            "notes": {"type": "string"}
        },
        "required": ["sparlo_scores", "claude_scores", "scoring_rationale", "winner", "sparlo_strengths",
                     "claude_strengths", "key_insight", "cross_domain_sparlo", "cross_domain_claude",
                     "cross_domain_list_sparlo", "cross_domain_list_claude",
                     "would_pay_for_sparlo", "would_pay_rationale", "verdict_summary"]
    }
}


def init_csv():
    """Create CSV with headers if it doesn't exist, and create reports directory."""
    if not CSV_FILE.exists():
        with open(CSV_FILE, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
            writer.writeheader()
    REPORTS_DIR.mkdir(exist_ok=True)


def run_sparlo(problem_text: str, problem_id: str = None) -> tuple[str, str, float, dict]:
    """Call Sparlo benchmark API and poll until complete. Returns (output, status, duration, full_json)."""
    start = time.time()

    if not BENCHMARK_API_KEY:
        click.echo("  ERROR: BENCHMARK_API_KEY not set in .env")
        return ("", "error", 0, {})

    headers = {"x-benchmark-api-key": BENCHMARK_API_KEY}

    # Create report via benchmark endpoint
    resp = requests.post(
        f"{SPARLO_URL}/api/benchmark/reports",
        json={"designChallenge": problem_text},
        headers=headers,
        timeout=60
    )

    if resp.status_code != 200:
        click.echo(f"  ERROR: Failed to create report: {resp.status_code} - {resp.text[:200]}")
        return ("", "error", time.time() - start, {})

    report_id = resp.json()["reportId"]
    click.echo(f"  Sparlo report created: {report_id}")

    # Poll until complete (max 35 minutes)
    while time.time() - start < 2100:
        time.sleep(30)  # Poll every 30 seconds

        status_resp = requests.get(
            f"{SPARLO_URL}/api/benchmark/reports/{report_id}",
            headers=headers,
            timeout=30
        )

        if status_resp.status_code != 200:
            click.echo(f"  ERROR: Failed to get status: {status_resp.status_code}")
            continue

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

            # Save full JSON to reports directory
            if problem_id:
                full_report = {
                    "benchmark_id": problem_id,
                    "sparlo_report_id": report_id,
                    "problem_text": problem_text,
                    "generated_at": datetime.now().isoformat(),
                    "duration_seconds": duration,
                    "status": status,
                    "title": data.get("title"),
                    "report_data": report_data
                }
                report_file = REPORTS_DIR / f"{problem_id}_sparlo.json"
                with open(report_file, 'w') as f:
                    json.dump(full_report, f, indent=2, default=str)
                click.echo(f"  Saved full report to {report_file}")

            return (output, "complete", duration, report_data)
        elif status == "error":
            return ("", "error", time.time() - start, {})

    return ("", "timeout", time.time() - start, {})


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
    """Call Claude to evaluate both outputs. Returns structured scores with detailed rationale."""
    client = Anthropic(api_key=ANTHROPIC_KEY)

    eval_prompt = f"""You are an expert engineering consultant evaluating two research outputs for the same problem.
Your evaluation must be thorough, evidence-based, and include specific quotes from each output.

METADATA:
- Segment: {metadata['segment']}
- Summary: {metadata['problem_summary']}
- Prior Art Level: {metadata['prior_art']}
- Domain Specificity: {metadata['domain_spec']}
- Contradiction Clarity: {metadata['contradiction']}
- Sweetspot Prediction: {metadata['sweetspot_pred']}
- Expected Grade: {metadata['expected_grade']}

PROBLEM:
{problem_text}

OUTPUT A (SPARLO):
{sparlo_out[:50000]}

OUTPUT B (CLAUDE):
{claude_out[:50000]}

EVALUATION CRITERIA (Score 1-10 for each dimension):

1. **Understanding** - Did it correctly identify the core engineering contradiction?
   - Look for: Physics-based reframing, first-principles analysis, identification of what's actually impossible vs difficult
   - Quote specific passages that show depth of understanding

2. **Novelty** - Did it surface ideas the user wouldn't easily find themselves?
   - Look for: Cross-domain transfers, academic citations, "someone already solved this" insights
   - Identify the single most novel contribution from each output

3. **Relevance** - Are the solutions actually applicable to the stated problem?
   - Look for: Solutions that address the specific constraints, not generic advice
   - Assess whether recommendations match the problem's scale and context

4. **Credibility** - Would an experienced engineer take this seriously?
   - Look for: Accurate physics, realistic feasibility assessments, acknowledgment of uncertainty
   - Flag any claims that seem dubious or unsupported

5. **Actionability** - Can the user pursue these solutions with the information given?
   - Look for: Specific next steps, validation experiments, cost estimates, timelines
   - Identify the clearest "what to do Monday morning" guidance

6. **Citations** - Are references credible and verifiable?
   - Look for: Patent numbers, academic papers, named researchers, specific products
   - Generic references ("studies show") score lower than specific citations

CROSS-DOMAIN ANALYSIS:
- Count distinct cross-domain sources in each output (different industries, fields, or applications)
- List each cross-domain source explicitly (e.g., "Medical blood warmers", "Aerospace thermal management")

WOULD PAY $50+ ASSESSMENT:
Consider: Does this output provide value beyond what a senior engineer could produce with 2 hours of research?
- Killer citations that de-risk technical approaches
- Novel insights that reframe the problem
- Actionable IP analysis or patent landscape review
- Strategic recommendations with evidence

VERDICT:
Determine winner based on total scores and provide a 2-4 sentence summary explaining WHY the winner won, citing specific evidence from the outputs.

Use the submit_evaluation tool with your complete analysis."""

    response = client.messages.create(
        model="claude-opus-4-5-20251101",
        max_tokens=8192,
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

    # Metadata for JSON files
    metadata = {
        "problem_id": problem_id,
        "segment": segment,
        "problem_summary": summary,
        "prior_art": prior_art,
        "domain_spec": domain,
        "contradiction": contradiction,
        "sweetspot_pred": sweetspot,
        "expected_grade": expected
    }

    # Run Sparlo (this takes ~25 minutes)
    click.echo("\nRunning Sparlo API (this takes ~25 minutes)...")
    sparlo_out, sparlo_status, sparlo_time, _ = run_sparlo(problem, problem_id)
    click.echo(f"  Sparlo completed: {sparlo_status} in {sparlo_time:.0f}s")

    # Run Claude (this takes ~30 seconds)
    click.echo("\nRunning Claude API...")
    claude_out, claude_status, claude_time = run_claude(problem)
    click.echo(f"  Claude completed: {claude_status} in {claude_time:.0f}s")

    # Save Claude output to JSON file
    if claude_status == "complete":
        claude_report = {
            "benchmark_id": problem_id,
            "problem_text": problem,
            "metadata": metadata,
            "generated_at": datetime.now().isoformat(),
            "duration_seconds": claude_time,
            "status": claude_status,
            "output": claude_out
        }
        claude_file = REPORTS_DIR / f"{problem_id}_claude.json"
        with open(claude_file, 'w') as f:
            json.dump(claude_report, f, indent=2)
        click.echo(f"  Saved Claude output to {claude_file}")

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
            row['score_margin'] = int(row['sparlo_total']) - int(row['claude_total'])
            row['sparlo_strengths'] = result['sparlo_strengths']
            row['claude_strengths'] = result['claude_strengths']
            row['key_insight'] = result['key_insight']
            row['cross_domain_sparlo'] = result['cross_domain_sparlo']
            row['cross_domain_claude'] = result['cross_domain_claude']
            row['cross_domain_list_sparlo'] = ', '.join(result.get('cross_domain_list_sparlo', []))
            row['cross_domain_list_claude'] = ', '.join(result.get('cross_domain_list_claude', []))
            row['would_pay'] = str(result['would_pay_for_sparlo']).lower()
            row['would_pay_rationale'] = result.get('would_pay_rationale', '')
            row['verdict_summary'] = result.get('verdict_summary', '')

            # Build full scoring rationale from per-dimension analysis
            rationale = result.get('scoring_rationale', {})
            full_rationale = f"""SCORING RATIONALE

Understanding (Sparlo: {sparlo['understanding']}, Claude: {claude['understanding']})
{rationale.get('understanding', 'N/A')}

Novelty (Sparlo: {sparlo['novelty']}, Claude: {claude['novelty']})
{rationale.get('novelty', 'N/A')}

Relevance (Sparlo: {sparlo['relevance']}, Claude: {claude['relevance']})
{rationale.get('relevance', 'N/A')}

Credibility (Sparlo: {sparlo['credibility']}, Claude: {claude['credibility']})
{rationale.get('credibility', 'N/A')}

Actionability (Sparlo: {sparlo['actionability']}, Claude: {claude['actionability']})
{rationale.get('actionability', 'N/A')}

Citations (Sparlo: {sparlo['citations']}, Claude: {claude['citations']})
{rationale.get('citations', 'N/A')}

Cross-Domain Count
Sparlo ({result['cross_domain_sparlo']}): {', '.join(result.get('cross_domain_list_sparlo', []))}
Claude ({result['cross_domain_claude']}): {', '.join(result.get('cross_domain_list_claude', []))}

Would Pay $50+?
Sparlo: {'YES' if result['would_pay_for_sparlo'] else 'NO'}. {result.get('would_pay_rationale', '')}

Verdict
{result['winner'].upper()} wins by {abs(int(row['score_margin']))} points (Sparlo: {row['sparlo_total']}, Claude: {row['claude_total']}).
{result.get('verdict_summary', '')}"""

            row['scoring_rationale'] = full_rationale
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
