# Sparlo Benchmark CLI

Compare Sparlo's AI engineering research output against Claude Opus 4.5 with expert prompting.

## Setup

```bash
cd sparlo-benchmark
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for Claude |
| `SPARLO_API_URL` | Sparlo backend URL (default: production) |
| `BENCHMARK_API_KEY` | API key for benchmark endpoints (set in Sparlo backend) |

The Sparlo backend also needs these env vars:
- `BENCHMARK_API_KEY` - Same key as above
- `BENCHMARK_ACCOUNT_ID` - UUID of account to use for benchmark reports

## Usage

### Run a Benchmark

```bash
python benchmark.py generate \
  --problem "Our automated fruit harvesting gripper damages 12% of apples during pick. We need to reduce damage to <2% while maintaining 1.5 second cycle time." \
  --segment PDC \
  --summary "Fruit gripper damage" \
  --prior-art Medium \
  --domain Cross \
  --contradiction Sharp \
  --sweetspot 5 \
  --expected A
```

This runs the problem through both Sparlo (~25 min) and Claude (~30 sec), saving outputs to `results.csv`.

### Evaluate Completed Benchmarks

```bash
python benchmark.py evaluate
```

Scores all unevaluated problems on 6 dimensions and declares a winner.

### Check Status

```bash
python benchmark.py status
```

Shows counts of total, complete, evaluated problems and current win rate.

## Segments

- **PDC** - Product Development Challenges
- **RDH** - R&D Hardware
- **DTS** - Design-to-Spec
- **IDF** - Industrial Design & Fabrication

## Evaluation Dimensions (1-10)

1. **Understanding** - Correctly identified the core engineering contradiction
2. **Novelty** - Surfaced ideas the user wouldn't easily find
3. **Relevance** - Solutions are actually applicable to the problem
4. **Credibility** - An engineer would take this seriously
5. **Actionability** - Can pursue with information given
6. **Citations** - References are credible and verifiable

## Output Fields

The `results.csv` includes detailed evaluation data:

| Field | Description |
|-------|-------------|
| `scoring_rationale` | Full narrative analysis with per-dimension breakdown, quotes, and evidence |
| `cross_domain_list_sparlo` | Comma-separated list of cross-domain sources cited |
| `cross_domain_list_claude` | Comma-separated list of cross-domain sources cited |
| `would_pay_rationale` | Justification for the $50+ value assessment |
| `verdict_summary` | 2-4 sentence summary of why the winner won |

## Case Study Reports

Full JSON reports are saved to the `reports/` directory for each benchmark run:

```
reports/
├── {problem_id}_sparlo.json   # Full Sparlo report with all structured data
└── {problem_id}_claude.json   # Claude's response for comparison
```

**Sparlo JSON structure:**
```json
{
  "benchmark_id": "uuid",
  "sparlo_report_id": "uuid",
  "problem_text": "...",
  "generated_at": "ISO timestamp",
  "duration_seconds": 1500,
  "title": "Report title",
  "report_data": {
    "mode": "hybrid",
    "report": { ... },
    "concepts": [ ... ],
    "evaluation": { ... },
    "literature": { ... },
    "teaching_examples": { ... },
    "problem_framing": { ... },
    "methodology": { ... },
    "tokenUsage": { ... }
  }
}
```

These JSON files can be used as case studies or imported into the marketing site as example reports.

## Analysis

Open `results.csv` in Excel or Google Sheets to:
- Filter by segment, prior_art, etc.
- Create pivot tables for aggregation
- Calculate averages and compare scores
- Read the `scoring_rationale` column for detailed per-problem analysis
