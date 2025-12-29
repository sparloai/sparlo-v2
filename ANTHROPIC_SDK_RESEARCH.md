# Anthropic Python SDK Research

**Research Date:** December 26, 2025
**Context:** Building a benchmark tool for Claude-powered engineering reports
**SDK Version:** Latest (as of Dec 2025)

---

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [API Calls & Model Configuration](#api-calls--model-configuration)
3. [Timeouts & Request Configuration](#timeouts--request-configuration)
4. [Structured JSON Output](#structured-json-output)
5. [Prompt Engineering Best Practices](#prompt-engineering-best-practices)
6. [Rate Limiting & Error Handling](#rate-limiting--error-handling)
7. [Async Usage Patterns](#async-usage-patterns)
8. [Message Batches API](#message-batches-api)
9. [Prompt Caching](#prompt-caching)
10. [Complete Implementation Examples](#complete-implementation-examples)

---

## Installation & Setup

### Installation

```bash
# Standard SDK
pip install anthropic

# With aiohttp support for better async performance
pip install anthropic[aiohttp]
```

**Requirements:** Python 3.7+ (3.10+ for Agent SDK)

### API Key Setup

1. **Obtain API Key:**
   - Navigate to [Anthropic Console](https://console.anthropic.com/)
   - Click **Settings** → **API Keys**
   - Click **Create Key**, name it, and save securely
   - Set up billing (one-time payment or auto-reload)

2. **Authentication:**

```python
import os
from anthropic import Anthropic

# Option 1: Environment variable (recommended)
# Set ANTHROPIC_API_KEY in your environment
client = Anthropic()  # Automatically uses ANTHROPIC_API_KEY

# Option 2: Explicit API key
client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
```

**Sources:**
- [GitHub - anthropics/anthropic-sdk-python](https://github.com/anthropics/anthropic-sdk-python)
- [Claude API Integration Guide 2025](https://collabnix.com/claude-api-integration-guide-2025-complete-developer-tutorial-with-code-examples/)

---

## API Calls & Model Configuration

### Basic Synchronous Call

```python
from anthropic import Anthropic

client = Anthropic()

message = client.messages.create(
    model="claude-opus-4-5-20251101",  # Your specific model
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Hello, Claude"
        }
    ]
)

print(message.content[0].text)
```

### Using System Prompts

System prompts provide context, instructions, and guidelines before the user query:

```python
message = client.messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=4096,
    system="You are an expert engineering report evaluator. Analyze reports for technical accuracy, clarity, and completeness. Return structured JSON scores.",
    messages=[
        {
            "role": "user",
            "content": "Evaluate this report: [report content here]"
        }
    ]
)
```

### Response Format

The response object contains:
- `message.content[0].text` - The text response
- `message.id` - Unique message ID
- `message.model` - Model used
- `message.role` - Always "assistant"
- `message.stop_reason` - Why generation stopped ("end_turn", "max_tokens", "tool_use")
- `message.usage` - Token usage statistics

---

## Timeouts & Request Configuration

### Setting Timeouts

Default timeout is **10 minutes**. For long-running report generation:

```python
import httpx
from anthropic import Anthropic

# Global timeout configuration
client = Anthropic(
    timeout=300.0  # 5 minutes in seconds
)

# Granular timeout control
client = Anthropic(
    timeout=httpx.Timeout(
        total=300.0,    # Total request timeout
        read=60.0,      # Time to read response
        write=10.0,     # Time to send request
        connect=5.0     # Connection timeout
    )
)

# Per-request timeout override
response = client.with_options(timeout=600.0).messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=4096,
    messages=[{"role": "user", "content": "Generate comprehensive report..."}]
)
```

**Best Practice for Benchmark Tool:**
- Set global timeout to 300-600 seconds for report generation
- Use per-request timeouts for evaluation tasks (shorter)
- Handle timeout exceptions gracefully

---

## Structured JSON Output

### Structured Outputs Feature (Beta)

As of **November 14, 2025**, Anthropic introduced **Structured Outputs** in public beta. This guarantees zero JSON parsing errors through constrained decoding.

**Supported Models:**
- Claude Opus 4.1, 4
- Claude Sonnet 4.5, 4, 3.7
- Claude Haiku 4.5, 3.5, 3

### Using Structured Outputs

```python
from anthropic import Anthropic

client = Anthropic()

# Set the beta header
response = client.messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=2048,
    messages=[
        {
            "role": "user",
            "content": "Analyze this engineering report and provide scores."
        }
    ],
    # Enable structured outputs
    extra_headers={
        "anthropic-beta": "structured-outputs-2025-11-13"
    },
    # Define your JSON schema
    output_format={
        "type": "json_schema",
        "json_schema": {
            "name": "report_evaluation",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {
                    "technical_accuracy": {
                        "type": "number",
                        "description": "Score from 0-100"
                    },
                    "clarity": {
                        "type": "number",
                        "description": "Score from 0-100"
                    },
                    "completeness": {
                        "type": "number",
                        "description": "Score from 0-100"
                    },
                    "overall_score": {
                        "type": "number",
                        "description": "Weighted average score"
                    },
                    "feedback": {
                        "type": "string",
                        "description": "Detailed feedback"
                    }
                },
                "required": ["technical_accuracy", "clarity", "completeness", "overall_score", "feedback"]
            }
        }
    }
)

# Parse the guaranteed-valid JSON
import json
result = json.loads(response.content[0].text)
```

### Alternative: Tool Use for Structured Output

Before structured outputs, the recommended approach was tool use:

```python
tools = [
    {
        "name": "print_evaluation",
        "description": "Prints the evaluation results.",
        "input_schema": {
            "type": "object",
            "properties": {
                "technical_accuracy": {
                    "type": "number",
                    "description": "Score from 0.0 to 100.0"
                },
                "clarity": {
                    "type": "number",
                    "description": "Score from 0.0 to 100.0"
                },
                "completeness": {
                    "type": "number",
                    "description": "Score from 0.0 to 100.0"
                },
                "strengths": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of report strengths"
                },
                "weaknesses": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of areas for improvement"
                }
            },
            "required": ["technical_accuracy", "clarity", "completeness", "strengths", "weaknesses"]
        }
    }
]

response = client.messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=4096,
    tools=tools,
    messages=[{"role": "user", "content": f"Evaluate this report: {report_content}"}]
)

# Extract JSON from tool use
json_result = None
for content in response.content:
    if content.type == "tool_use" and content.name == "print_evaluation":
        json_result = content.input
        break

if json_result:
    print(f"Technical Accuracy: {json_result['technical_accuracy']}")
    print(f"Clarity: {json_result['clarity']}")
```

### XML Tags for Structured Output (Traditional Approach)

```python
# Using XML tags with prefill
prompt = """
Evaluate this engineering report and provide scores.

<report>
{report_content}
</report>

Return your evaluation in JSON format with these keys:
- technical_accuracy (0-100)
- clarity (0-100)
- completeness (0-100)
- overall_score (weighted average)
- feedback (detailed string)
"""

response = client.messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=2048,
    messages=[
        {"role": "user", "content": prompt},
        {"role": "assistant", "content": "{"}  # Prefill to encourage JSON
    ]
)

# Parse the JSON response
import json
json_text = "{" + response.content[0].text
result = json.loads(json_text)
```

**Sources:**
- [Structured outputs - Claude Docs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [A Hands-On Guide to Anthropic's New Structured Output Capabilities](https://towardsdatascience.com/hands-on-with-anthropics-new-structured-output-capabilities/)
- [Zero-Error JSON with Claude](https://medium.com/@meshuggah22/zero-error-json-with-claude-how-anthropics-structured-outputs-actually-work-in-real-code-789cde7aff13)

---

## Prompt Engineering Best Practices

### System Prompt Structure

For your benchmark evaluator, use this structure:

```python
system_prompt = """
You are a highly experienced technical evaluator specializing in engineering reports. Your role is to:

1. Analyze reports for technical accuracy, scientific rigor, and factual correctness
2. Evaluate clarity of communication and accessibility to the target audience
3. Assess completeness of coverage for the given topic
4. Provide constructive, actionable feedback

Evaluation Criteria:
- Technical Accuracy (0-100): Correctness of facts, methodologies, and conclusions
- Clarity (0-100): How well ideas are communicated
- Completeness (0-100): Coverage of essential aspects of the topic
- Overall Score: Weighted average with 50% technical, 25% clarity, 25% completeness

You must be objective, fair, and provide specific examples to support your scores.
"""
```

### Prompt Engineering Elements (Optimal Ordering)

1. **Task Context** (in system prompt)
2. **Specific Instructions** (in user message)
3. **Input Data** (wrapped in XML tags)
4. **Examples** (few-shot if needed)
5. **Output Format** (specify structure)
6. **Special Cases** (edge scenarios to handle)

### Using XML Tags for Organization

```python
prompt = f"""
Evaluate the following engineering report against the Sparlo report.

<sparlo_report>
{sparlo_report_content}
</sparlo_report>

<claude_generated_report>
{claude_report_content}
</claude_generated_report>

<evaluation_criteria>
1. Technical depth and accuracy
2. Citation quality and relevance
3. Structure and organization
4. Clarity of explanations
5. Completeness of coverage
</evaluation_criteria>

Analyze both reports and provide:
1. A comparative analysis in <analysis> tags
2. Scores for each criterion in <scores> tags (JSON format)
3. Final recommendation in <recommendation> tags
"""
```

### Prefilling Responses

Guide Claude's output format by prefilling the assistant's turn:

```python
response = client.messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=2048,
    messages=[
        {"role": "user", "content": prompt},
        {"role": "assistant", "content": '{"evaluation": {'}
    ]
)
```

---

## Rate Limiting & Error Handling

### Retry Configuration

The SDK automatically retries certain errors (connection issues, timeouts, 5xx errors).

```python
from anthropic import Anthropic

# Configure max retries globally
client = Anthropic(
    max_retries=5  # Default is 2
)

# Per-request retry configuration
response = client.with_options(max_retries=10).messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Generate report..."}]
)
```

### Error Handling

```python
import anthropic
from anthropic import Anthropic
import time

client = Anthropic()

def call_claude_with_retry(prompt, max_retries=5):
    """Call Claude with exponential backoff for rate limits."""

    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-opus-4-5-20251101",
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )
            return response

        except anthropic.RateLimitError as e:
            if attempt == max_retries - 1:
                raise

            # Exponential backoff: 2^attempt seconds
            wait_time = 2 ** attempt
            print(f"Rate limit hit. Waiting {wait_time}s before retry {attempt + 1}/{max_retries}")
            time.sleep(wait_time)

        except anthropic.APIConnectionError as e:
            print(f"Connection error: {e.__cause__}")
            if attempt == max_retries - 1:
                raise
            time.sleep(5)

        except anthropic.APIStatusError as e:
            print(f"API error {e.status_code}: {e.response}")
            raise  # Don't retry on other status errors

    raise Exception("Max retries exceeded")

# Usage
try:
    response = call_claude_with_retry("Generate an engineering report on quantum computing")
    print(response.content[0].text)
except Exception as e:
    print(f"Failed after all retries: {e}")
```

### Rate Limit Best Practices

1. **Implement exponential backoff** for 429 errors
2. **Use Message Batches API** for bulk processing (see below)
3. **Monitor token usage** via `response.usage`
4. **Cache prompts** to reduce token consumption (see Prompt Caching section)
5. **Track rate limits** through response headers

```python
# Access rate limit headers
response = client.messages.with_raw_response.create(
    model="claude-opus-4-5-20251101",
    max_tokens=1024,
    messages=[{"role": "user", "content": "Hello"}]
)

print(f"Requests remaining: {response.headers.get('anthropic-ratelimit-requests-remaining')}")
print(f"Tokens remaining: {response.headers.get('anthropic-ratelimit-tokens-remaining')}")

message = response.parse()
```

---

## Async Usage Patterns

### Basic Async Client

```python
import asyncio
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def generate_report(topic: str) -> str:
    """Generate an engineering report asynchronously."""

    message = await client.messages.create(
        model="claude-opus-4-5-20251101",
        max_tokens=4096,
        system="You are an expert engineering report writer.",
        messages=[
            {
                "role": "user",
                "content": f"Generate a comprehensive engineering report on: {topic}"
            }
        ]
    )

    return message.content[0].text

# Run async function
async def main():
    report = await generate_report("mRNA therapeutics")
    print(report)

asyncio.run(main())
```

### Concurrent Requests

For your benchmark tool, process multiple reports concurrently:

```python
import asyncio
from anthropic import AsyncAnthropic
from typing import List, Dict

client = AsyncAnthropic()

async def evaluate_report(report_content: str, report_id: str) -> Dict:
    """Evaluate a single report."""

    try:
        response = await client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=2048,
            system="You are an expert report evaluator.",
            messages=[
                {
                    "role": "user",
                    "content": f"Evaluate this report:\n\n{report_content}"
                },
                {
                    "role": "assistant",
                    "content": "{"
                }
            ]
        )

        import json
        scores = json.loads("{" + response.content[0].text)

        return {
            "report_id": report_id,
            "scores": scores,
            "status": "success"
        }

    except Exception as e:
        return {
            "report_id": report_id,
            "error": str(e),
            "status": "failed"
        }

async def evaluate_batch(reports: List[Dict[str, str]]) -> List[Dict]:
    """Evaluate multiple reports concurrently."""

    tasks = [
        evaluate_report(report["content"], report["id"])
        for report in reports
    ]

    # Run all evaluations concurrently
    results = await asyncio.gather(*tasks, return_exceptions=True)

    return results

# Usage
async def main():
    reports = [
        {"id": "report_1", "content": "Report 1 content..."},
        {"id": "report_2", "content": "Report 2 content..."},
        {"id": "report_3", "content": "Report 3 content..."},
    ]

    results = await evaluate_batch(reports)

    for result in results:
        if isinstance(result, Exception):
            print(f"Error: {result}")
        else:
            print(f"Report {result['report_id']}: {result['status']}")

asyncio.run(main())
```

### Streaming Responses (Async)

For real-time feedback during report generation:

```python
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def stream_report_generation(topic: str):
    """Stream report generation with real-time output."""

    async with client.messages.stream(
        model="claude-opus-4-5-20251101",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": f"Generate an engineering report on: {topic}"
            }
        ]
    ) as stream:
        async for text in stream.text_stream:
            print(text, end="", flush=True)
        print()

    # Get final message after streaming completes
    message = await stream.get_final_message()
    print(f"\n\nTokens used: {message.usage}")

    return await stream.get_final_text()

# Usage
asyncio.run(stream_report_generation("quantum computing"))
```

### Using aiohttp Backend

For better async performance:

```bash
pip install anthropic[aiohttp]
```

```python
from anthropic import AsyncAnthropic, DefaultAioHttpClient

async def main():
    async with AsyncAnthropic(
        http_client=DefaultAioHttpClient()
    ) as client:
        message = await client.messages.create(
            model="claude-opus-4-5-20251101",
            max_tokens=1024,
            messages=[{"role": "user", "content": "Hello"}]
        )
        print(message.content[0].text)

asyncio.run(main())
```

---

## Message Batches API

For your benchmark tool, the **Message Batches API** is ideal for processing multiple reports efficiently.

### Key Benefits

- **50% cost reduction** compared to standard API
- Process up to **10,000 requests** per batch
- **24-hour processing window**
- Results available for **30 days**

### Creating a Batch

```python
from anthropic import AsyncAnthropic

client = AsyncAnthropic()

async def create_evaluation_batch(reports: List[Dict]):
    """Create a batch of report evaluations."""

    # Prepare batch requests
    requests = []
    for i, report in enumerate(reports):
        requests.append({
            "custom_id": f"eval_{report['id']}",
            "params": {
                "model": "claude-opus-4-5-20251101",
                "max_tokens": 2048,
                "system": "You are an expert report evaluator.",
                "messages": [
                    {
                        "role": "user",
                        "content": f"Evaluate this report:\n\n{report['content']}"
                    }
                ]
            }
        })

    # Create batch
    batch = await client.messages.batches.create(requests=requests)

    print(f"Batch created: {batch.id}")
    print(f"Status: {batch.processing_status}")

    return batch.id

# Usage
async def main():
    reports = [
        {"id": "1", "content": "Report 1..."},
        {"id": "2", "content": "Report 2..."},
        {"id": "3", "content": "Report 3..."},
    ]

    batch_id = await create_evaluation_batch(reports)
```

### Retrieving Batch Results

```python
async def get_batch_results(batch_id: str):
    """Retrieve and process batch results."""

    # Check batch status first
    batch = await client.messages.batches.retrieve(batch_id)

    print(f"Status: {batch.processing_status}")
    print(f"Requests: {batch.request_counts}")

    if batch.processing_status != "ended":
        print("Batch still processing...")
        return None

    # Get results
    results = []
    result_stream = await client.messages.batches.results(batch_id)

    async for entry in result_stream:
        if entry.result.type == "succeeded":
            results.append({
                "custom_id": entry.custom_id,
                "content": entry.result.message.content[0].text,
                "usage": entry.result.message.usage
            })
        elif entry.result.type == "errored":
            results.append({
                "custom_id": entry.custom_id,
                "error": entry.result.error
            })

    return results

# Usage
async def main():
    batch_id = "msgbatch_abc123"
    results = await get_batch_results(batch_id)

    if results:
        for result in results:
            print(f"ID: {result['custom_id']}")
            if "content" in result:
                print(f"Content: {result['content'][:100]}...")
            else:
                print(f"Error: {result['error']}")
```

### Listing and Managing Batches

```python
async def list_all_batches():
    """List all message batches."""

    all_batches = []
    async for batch in client.messages.batches.list(limit=20):
        all_batches.append({
            "id": batch.id,
            "status": batch.processing_status,
            "created": batch.created_at,
            "requests": batch.request_counts
        })

    return all_batches

async def cancel_batch(batch_id: str):
    """Cancel a running batch."""

    batch = await client.messages.batches.cancel(batch_id)
    print(f"Batch {batch_id} cancelled")
    return batch
```

---

## Prompt Caching

**Prompt Caching** can reduce costs by up to **90%** and latency by up to **85%** for repeated prompts.

### How It Works

- **Cache Duration:** 5 minutes (default) or 1 hour (premium)
- **Auto-refresh:** Each use extends the cache lifetime
- **Pricing:**
  - Cache writes: 25% more than base input tokens (one-time)
  - Cache reads: 10% of base input token price
  - **Break-even:** Just 2 API calls

### Supported Models

- Claude Opus 4.1, 4, 3
- Claude Sonnet 4.5, 4, 3.7
- Claude Haiku 4.5, 3.5, 3

### Using Prompt Caching

For your benchmark tool, cache the evaluation instructions:

```python
from anthropic import Anthropic

client = Anthropic()

# Define your system prompt with cache control
system_prompt = [
    {
        "type": "text",
        "text": """You are an expert engineering report evaluator with deep expertise in:

1. Scientific accuracy and rigor
2. Technical depth and completeness
3. Citation quality and relevance
4. Clarity of communication
5. Practical applicability

Evaluation Criteria:
- Technical Accuracy (0-100): Factual correctness, methodology soundness
- Clarity (0-100): Communication effectiveness, accessibility
- Completeness (0-100): Coverage of essential topics
- Citation Quality (0-100): Relevance and authority of sources

You must provide detailed, objective evaluations with specific examples.""",
        "cache_control": {"type": "ephemeral"}  # Cache this system prompt
    }
]

# First call - writes to cache
response1 = client.messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=2048,
    system=system_prompt,
    messages=[
        {"role": "user", "content": "Evaluate report 1: [content]"}
    ]
)

print(f"Cache creation tokens: {response1.usage.get('cache_creation_input_tokens', 0)}")
print(f"Input tokens: {response1.usage.get('input_tokens', 0)}")

# Second call within 5 minutes - reads from cache
response2 = client.messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=2048,
    system=system_prompt,  # Same system prompt
    messages=[
        {"role": "user", "content": "Evaluate report 2: [content]"}
    ]
)

print(f"Cache read tokens: {response2.usage.get('cache_read_input_tokens', 0)}")
print(f"Input tokens: {response2.usage.get('input_tokens', 0)}")
```

### Caching with Tools

Cache your tool definitions for structured outputs:

```python
tools = [
    {
        "name": "print_evaluation",
        "description": "Prints report evaluation scores.",
        "input_schema": {
            "type": "object",
            "properties": {
                "technical_accuracy": {"type": "number"},
                "clarity": {"type": "number"},
                "completeness": {"type": "number"},
                "citation_quality": {"type": "number"},
                "strengths": {"type": "array", "items": {"type": "string"}},
                "weaknesses": {"type": "array", "items": {"type": "string"}},
                "overall_score": {"type": "number"}
            },
            "required": ["technical_accuracy", "clarity", "completeness", "citation_quality", "overall_score"]
        },
        "cache_control": {"type": "ephemeral"}  # Cache tool definition
    }
]

response = client.messages.create(
    model="claude-opus-4-5-20251101",
    max_tokens=2048,
    tools=tools,
    messages=[{"role": "user", "content": "Evaluate this report..."}]
)
```

### Cost Savings Example

For Claude Sonnet 4.5:
- Base rate: $3 per million input tokens
- Cache write: $3.75 per million tokens (25% markup, one-time)
- Cache read: $0.30 per million tokens (90% discount)

**Scenario:** 1000 evaluations with 2000-token system prompt

Without caching:
- 1000 calls × 2000 tokens × $3/1M = $6.00

With caching:
- First call: 2000 tokens × $3.75/1M = $0.0075
- 999 calls: 999 × 2000 × $0.30/1M = $0.60
- **Total: $0.61** (90% savings)

**Sources:**
- [Prompt caching with Claude](https://www.anthropic.com/news/prompt-caching)
- [Prompt caching - Claude Docs](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Token-saving updates on the Anthropic API](https://www.anthropic.com/news/token-saving-updates)

---

## Complete Implementation Examples

### Benchmark Tool Architecture

```python
import asyncio
import json
from typing import List, Dict, Optional
from anthropic import AsyncAnthropic
import anthropic

class ClaudeBenchmarkTool:
    """Benchmark tool for comparing Claude-generated reports with Sparlo."""

    def __init__(self, api_key: str):
        self.client = AsyncAnthropic(
            api_key=api_key,
            max_retries=5,
            timeout=600.0
        )

        # Evaluation system prompt with caching
        self.eval_system = [
            {
                "type": "text",
                "text": """You are an expert engineering report evaluator with deep expertise in scientific accuracy, technical depth, citation quality, and communication clarity.

Evaluation Criteria:
1. Technical Accuracy (0-100): Factual correctness, scientific rigor, methodology soundness
2. Clarity (0-100): Communication effectiveness, structure, accessibility to target audience
3. Completeness (0-100): Coverage of essential topics, depth of analysis
4. Citation Quality (0-100): Relevance, authority, and proper attribution of sources
5. Overall Score: Weighted average (40% technical, 25% clarity, 20% completeness, 15% citations)

You must be objective, provide specific examples, and justify your scores.""",
                "cache_control": {"type": "ephemeral"}
            }
        ]

    async def generate_report(self, topic: str, style: str = "comprehensive") -> Dict:
        """Generate an engineering report using Claude."""

        prompt = f"""Generate a comprehensive engineering report on the following topic:

Topic: {topic}

Style: {style}

Requirements:
- Include an executive summary
- Cover key technical concepts
- Cite relevant research and sources
- Provide practical applications
- Include challenges and future directions
- Aim for 2000-3000 words"""

        try:
            response = await self.client.messages.create(
                model="claude-opus-4-5-20251101",
                max_tokens=8192,
                system="You are an expert engineering report writer specializing in clear, accurate, and well-researched technical content.",
                messages=[{"role": "user", "content": prompt}]
            )

            return {
                "content": response.content[0].text,
                "usage": {
                    "input_tokens": response.usage.input_tokens,
                    "output_tokens": response.usage.output_tokens
                },
                "model": response.model,
                "status": "success"
            }

        except Exception as e:
            return {
                "error": str(e),
                "status": "failed"
            }

    async def evaluate_report(
        self,
        report_content: str,
        reference_report: Optional[str] = None
    ) -> Dict:
        """Evaluate a report and return structured JSON scores."""

        # Define evaluation tool
        tools = [
            {
                "name": "submit_evaluation",
                "description": "Submit the final evaluation scores and feedback.",
                "input_schema": {
                    "type": "object",
                    "properties": {
                        "technical_accuracy": {
                            "type": "number",
                            "description": "Score 0-100 for technical accuracy"
                        },
                        "clarity": {
                            "type": "number",
                            "description": "Score 0-100 for clarity and communication"
                        },
                        "completeness": {
                            "type": "number",
                            "description": "Score 0-100 for completeness"
                        },
                        "citation_quality": {
                            "type": "number",
                            "description": "Score 0-100 for citation quality"
                        },
                        "overall_score": {
                            "type": "number",
                            "description": "Weighted overall score"
                        },
                        "strengths": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of report strengths"
                        },
                        "weaknesses": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "List of areas for improvement"
                        },
                        "detailed_feedback": {
                            "type": "string",
                            "description": "Comprehensive feedback paragraph"
                        }
                    },
                    "required": [
                        "technical_accuracy",
                        "clarity",
                        "completeness",
                        "citation_quality",
                        "overall_score",
                        "strengths",
                        "weaknesses",
                        "detailed_feedback"
                    ]
                },
                "cache_control": {"type": "ephemeral"}
            }
        ]

        # Build evaluation prompt
        eval_prompt = f"""Evaluate the following engineering report:

<report>
{report_content}
</report>"""

        if reference_report:
            eval_prompt += f"""

<reference_report>
{reference_report}
</reference_report>

Compare the report against the reference report for context, but evaluate it independently on its own merits."""

        eval_prompt += """

Provide a thorough evaluation using the submit_evaluation tool. Be specific and provide concrete examples to justify your scores."""

        try:
            response = await self.client.messages.create(
                model="claude-opus-4-5-20251101",
                max_tokens=4096,
                system=self.eval_system,
                tools=tools,
                messages=[{"role": "user", "content": eval_prompt}]
            )

            # Extract evaluation from tool use
            for content in response.content:
                if content.type == "tool_use" and content.name == "submit_evaluation":
                    return {
                        "scores": content.input,
                        "usage": {
                            "input_tokens": response.usage.input_tokens,
                            "output_tokens": response.usage.output_tokens,
                            "cache_creation_input_tokens": getattr(response.usage, 'cache_creation_input_tokens', 0),
                            "cache_read_input_tokens": getattr(response.usage, 'cache_read_input_tokens', 0)
                        },
                        "status": "success"
                    }

            return {"error": "No evaluation tool call found", "status": "failed"}

        except Exception as e:
            return {"error": str(e), "status": "failed"}

    async def run_benchmark(
        self,
        topics: List[str],
        sparlo_reports: Optional[Dict[str, str]] = None
    ) -> Dict:
        """Run a full benchmark comparing Claude reports to Sparlo."""

        results = {
            "topics": [],
            "summary": {
                "total_topics": len(topics),
                "successful_generations": 0,
                "successful_evaluations": 0,
                "average_scores": {}
            }
        }

        for topic in topics:
            print(f"Processing: {topic}")

            # Generate report
            report_result = await self.generate_report(topic)

            if report_result["status"] != "success":
                results["topics"].append({
                    "topic": topic,
                    "generation_error": report_result.get("error"),
                    "status": "failed"
                })
                continue

            results["summary"]["successful_generations"] += 1

            # Evaluate report
            reference = sparlo_reports.get(topic) if sparlo_reports else None
            eval_result = await self.evaluate_report(
                report_result["content"],
                reference
            )

            if eval_result["status"] != "success":
                results["topics"].append({
                    "topic": topic,
                    "report": report_result["content"][:500] + "...",
                    "evaluation_error": eval_result.get("error"),
                    "status": "partial"
                })
                continue

            results["summary"]["successful_evaluations"] += 1

            # Store results
            results["topics"].append({
                "topic": topic,
                "report_length": len(report_result["content"]),
                "generation_tokens": report_result["usage"],
                "evaluation": eval_result["scores"],
                "evaluation_tokens": eval_result["usage"],
                "status": "success"
            })

        # Calculate average scores
        if results["summary"]["successful_evaluations"] > 0:
            score_keys = ["technical_accuracy", "clarity", "completeness", "citation_quality", "overall_score"]

            for key in score_keys:
                scores = [
                    t["evaluation"][key]
                    for t in results["topics"]
                    if t["status"] == "success"
                ]
                results["summary"]["average_scores"][key] = sum(scores) / len(scores)

        return results

# Usage Example
async def main():
    # Initialize benchmark tool
    benchmark = ClaudeBenchmarkTool(api_key="your-api-key")

    # Define test topics
    topics = [
        "mRNA Therapeutics: Delivery Mechanisms and Challenges",
        "Quantum Computing: Current State and Applications",
        "CRISPR Gene Editing: Ethical Considerations and Future Directions"
    ]

    # Optional: Provide Sparlo reference reports
    sparlo_reports = {
        "mRNA Therapeutics: Delivery Mechanisms and Challenges": "Sparlo report content here..."
    }

    # Run benchmark
    results = await benchmark.run_benchmark(topics, sparlo_reports)

    # Save results
    with open("benchmark_results.json", "w") as f:
        json.dump(results, f, indent=2)

    # Print summary
    print("\n=== Benchmark Summary ===")
    print(f"Topics processed: {results['summary']['total_topics']}")
    print(f"Successful generations: {results['summary']['successful_generations']}")
    print(f"Successful evaluations: {results['summary']['successful_evaluations']}")

    if results['summary']['average_scores']:
        print("\nAverage Scores:")
        for key, value in results['summary']['average_scores'].items():
            print(f"  {key}: {value:.2f}")

if __name__ == "__main__":
    asyncio.run(main())
```

### Batch Processing Example

For larger scale benchmarks:

```python
async def run_batch_benchmark(topics: List[str]) -> str:
    """Run benchmark using Message Batches API for cost efficiency."""

    client = AsyncAnthropic()

    # Step 1: Create batch for report generation
    generation_requests = [
        {
            "custom_id": f"gen_{i}",
            "params": {
                "model": "claude-opus-4-5-20251101",
                "max_tokens": 8192,
                "system": "You are an expert engineering report writer.",
                "messages": [
                    {
                        "role": "user",
                        "content": f"Generate a comprehensive engineering report on: {topic}"
                    }
                ]
            }
        }
        for i, topic in enumerate(topics)
    ]

    gen_batch = await client.messages.batches.create(requests=generation_requests)
    print(f"Generation batch created: {gen_batch.id}")

    # Step 2: Wait for batch completion (poll every 60 seconds)
    while True:
        batch_status = await client.messages.batches.retrieve(gen_batch.id)

        if batch_status.processing_status == "ended":
            break

        print(f"Status: {batch_status.processing_status}, Progress: {batch_status.request_counts}")
        await asyncio.sleep(60)

    # Step 3: Retrieve generated reports
    generated_reports = {}
    result_stream = await client.messages.batches.results(gen_batch.id)

    async for entry in result_stream:
        if entry.result.type == "succeeded":
            topic_idx = int(entry.custom_id.split("_")[1])
            generated_reports[topics[topic_idx]] = entry.result.message.content[0].text

    # Step 4: Create evaluation batch
    eval_requests = [
        {
            "custom_id": f"eval_{i}",
            "params": {
                "model": "claude-opus-4-5-20251101",
                "max_tokens": 4096,
                "system": [
                    {
                        "type": "text",
                        "text": "You are an expert report evaluator...",
                        "cache_control": {"type": "ephemeral"}
                    }
                ],
                "messages": [
                    {
                        "role": "user",
                        "content": f"Evaluate this report:\n\n{content}"
                    },
                    {
                        "role": "assistant",
                        "content": "{"
                    }
                ]
            }
        }
        for i, (topic, content) in enumerate(generated_reports.items())
    ]

    eval_batch = await client.messages.batches.create(requests=eval_requests)
    print(f"Evaluation batch created: {eval_batch.id}")

    return eval_batch.id

# Usage
asyncio.run(run_batch_benchmark(["Topic 1", "Topic 2", "Topic 3"]))
```

---

## Key Takeaways for Your Benchmark Tool

1. **Use Structured Outputs** with the beta header for guaranteed JSON parsing
2. **Implement Prompt Caching** for your evaluation system prompt (90% cost savings)
3. **Use Async Clients** for concurrent processing of multiple reports
4. **Leverage Message Batches API** for large-scale benchmarks (50% cost reduction)
5. **Implement Retry Logic** with exponential backoff for rate limits
6. **Set Appropriate Timeouts** (5-10 minutes for report generation)
7. **Monitor Token Usage** through response.usage to track costs
8. **Use System Prompts** to establish evaluation criteria consistently
9. **Structure Prompts with XML Tags** for clear input organization
10. **Handle Errors Gracefully** with comprehensive try-except blocks

---

## Additional Resources

- [Official SDK Documentation](https://github.com/anthropics/anthropic-sdk-python)
- [Anthropic API Reference](https://docs.anthropic.com/en/api)
- [Prompt Engineering Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering)
- [Anthropic Cookbook](https://github.com/anthropics/anthropic-cookbook)
- [Structured Outputs Documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Message Batches API](https://docs.anthropic.com/en/docs/build-with-claude/message-batches)
- [Prompt Caching Guide](https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching)

---

**End of Research Document**
