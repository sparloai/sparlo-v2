---
status: pending
priority: p1
issue_id: "009"
tags: [security, backend, authentication, authorization]
dependencies: []
---

# Backend Endpoints Missing Authentication/Authorization

All backend API endpoints lack authentication and authorization checks.

## Problem Statement

The sparlo-backend FastAPI endpoints have no authentication or authorization middleware. While requests are proxied through the frontend (which has auth), this creates security risks:

1. Direct API access bypasses frontend auth completely
2. No user context available for audit logging
3. Violates defense-in-depth security principle
4. If backend URL is discovered, anyone can access it

**Severity:** CRITICAL - Production security vulnerability

## Findings

- **File:** `sparlo-backend/main.py`
- All endpoints (`/api/chat/stream`, `/api/analyze`, `/api/status/*`) accept any request
- No Bearer token validation or API key verification
- No rate limiting per user/IP
- Reliance on frontend proxy for auth is insufficient

**Current flow:**
```
User → Frontend (has auth) → Backend (NO auth) → AI Services
```

**Risk scenario:**
```
Attacker → Backend directly (NO auth) → AI Services (cost attack)
```

## Proposed Solutions

### Option 1: JWT Token Forwarding

**Approach:** Forward Supabase JWT from frontend, validate in backend middleware

**Pros:**
- Leverages existing Supabase auth
- User context available for logging
- Standard JWT validation

**Cons:**
- Requires shared JWT secret or JWKS endpoint
- Additional latency for token validation

**Effort:** 4-6 hours

**Risk:** Low

---

### Option 2: Internal API Key

**Approach:** Generate secure API key shared between frontend and backend

**Pros:**
- Simple to implement
- No external dependencies
- Fast validation

**Cons:**
- No user context
- Key rotation requires coordination
- Less granular than JWT

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 3: Network-Level Isolation

**Approach:** Deploy backend in private network, only accessible from frontend

**Pros:**
- Zero code changes
- Complete isolation
- Infrastructure-level security

**Cons:**
- Deployment complexity
- Harder local development
- Still missing user context

**Effort:** Variable (depends on infrastructure)

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `sparlo-backend/main.py` - Add auth middleware
- `apps/web/app/home/(user)/_lib/api.ts` - Forward auth token

**Implementation notes:**
- FastAPI has excellent middleware support
- Consider using `fastapi-jwt-auth` or manual validation
- Add request logging with user context

## Resources

- **FastAPI Security Docs:** https://fastapi.tiangolo.com/tutorial/security/
- **Supabase JWT:** https://supabase.com/docs/guides/auth/jwts

## Acceptance Criteria

- [ ] All backend endpoints require valid authentication
- [ ] Invalid/missing tokens return 401 Unauthorized
- [ ] User context logged for audit trail
- [ ] Rate limiting applied per user
- [ ] Frontend correctly forwards auth token
- [ ] Tests verify auth enforcement

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (Security Review Agent)

**Actions:**
- Reviewed `sparlo-backend/main.py` for auth patterns
- Identified all unprotected endpoints
- Assessed risk of direct backend access
- Documented three solution approaches

**Learnings:**
- Backend relies entirely on frontend proxy for auth
- No user context available for cost tracking
- Common pattern but significant security gap

## Notes

- This is a P1 because direct API access could lead to:
  - AI cost attacks (unbounded API usage)
  - Data exfiltration (if backend stores data)
  - Denial of service
- Coordinate with deployment team on Option 3 feasibility
