---
status: pending
priority: p2
issue_id: "016"
tags: [security, backend, caching, api-keys]
dependencies: []
---

# API Key Included in Cache Function Signature

Patent search cache function includes API key in signature, creating potential security issues.

## Problem Statement

The `_cached_patent_search` function in `patent_grounding.py` includes the API key as a parameter, which means:
1. API key is part of cache key (unnecessary)
2. If cache is serialized/logged, key could be exposed
3. Different API keys would not share cache (inefficient)

**Severity:** P2 - Security smell, not immediately exploitable

## Findings

- **File:** `sparlo-backend/patent_grounding.py`

**Current implementation (line ~42):**
```python
@lru_cache(maxsize=PATENT_CACHE_MAX_SIZE)
def _cached_patent_search(cache_key: str, query: str, num_results: int, api_key: str) -> tuple:
    """Internal cached patent search. Returns tuple for hashability."""
    # ... uses api_key for request
```

**Issues:**
1. `api_key` is part of lru_cache key - unnecessary since key doesn't affect results
2. If function signature is logged/traced, key appears in logs
3. Two deployments with different keys won't share cache
4. Violates principle of least exposure

**What it should be:**
- API key retrieved inside function, not passed as parameter
- Cache key based only on query and num_results

## Proposed Solutions

### Option 1: Remove API Key from Function Signature

**Approach:** Get API key inside the cached function

**Pros:**
- API key not in cache key
- Cleaner function signature
- Cache shared regardless of key

**Cons:**
- Function has external dependency
- Slightly less pure function

**Effort:** 30 minutes

**Risk:** Low

**Implementation:**
```python
@lru_cache(maxsize=PATENT_CACHE_MAX_SIZE)
def _cached_patent_search(query: str, num_results: int) -> tuple:
    """Internal cached patent search. Returns tuple for hashability."""
    api_key = get_serp_api_key()
    if not api_key:
        return ()

    # ... rest of implementation
```

---

### Option 2: Use Separate Cache Key Function

**Approach:** Explicit cache key generation without sensitive data

**Pros:**
- Clear what's in cache key
- Can add more complex caching logic
- API key completely isolated

**Cons:**
- More code
- Manual cache management

**Effort:** 1 hour

**Risk:** Low

---

### Option 3: Use External Cache (Redis)

**Approach:** Move to Redis with explicit key construction

**Pros:**
- Persistent cache across restarts
- Shared across instances
- More control over key format

**Cons:**
- Infrastructure dependency
- More complexity
- Overkill for this case

**Effort:** 3-4 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `sparlo-backend/patent_grounding.py` - Lines 41-86

**Current cache behavior:**
- LRU cache with 500 max entries
- Cache key includes: cache_key, query, num_results, api_key
- Cache persists for process lifetime

**Desired behavior:**
- Cache key includes only: query, num_results
- API key retrieved inside function
- Same query returns cached result regardless of API key rotation

## Resources

- **Python lru_cache:** https://docs.python.org/3/library/functools.html#functools.lru_cache
- **Secure coding - sensitive data:** https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/

## Acceptance Criteria

- [ ] API key removed from `_cached_patent_search` signature
- [ ] Cache key based only on query parameters
- [ ] API key not logged or traceable
- [ ] Cache behavior unchanged (same results cached)
- [ ] All patent search tests pass

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (Security Review Agent)

**Actions:**
- Reviewed patent_grounding.py caching implementation
- Identified API key in function signature
- Assessed exposure risk
- Proposed simple fix

**Learnings:**
- lru_cache uses all parameters for cache key
- Common mistake when caching API calls
- Fix is simple - just move API key retrieval inside function
- No actual exposure currently, just code smell

## Notes

- Quick win - 30 minute fix
- Low risk change
- Could be bundled with other patent_grounding.py changes
- The `cache_key` parameter is also redundant - query+num_results is unique
