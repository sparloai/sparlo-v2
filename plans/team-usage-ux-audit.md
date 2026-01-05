# Team Usage Feature - UX/UI Audit Plan

## Objective
Comprehensive audit of the team accounts feature with focus on the newly built team usage display. Ensure 10/10 user experience across all team account pages.

## Test Credentials
- Email: swimakaswim@gmail.com
- Password: Linguine2025

## Pre-Audit Setup
1. [ ] Log in with test credentials
2. [ ] Create a team account via UI (account selector → Create Team)
3. [ ] Note the team slug for navigation

---

## Audit Checklist

### 1. Team Account Creation Flow
**Page**: Account selector popover

| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Create Team button visible | Shows in account selector popover | |
| Dialog opens | Clean modal with form | |
| Validation works | 2-50 chars, no special chars | |
| Error messages | Clear, actionable errors | |
| Success redirect | Redirects to `/home/{slug}` | |
| New team in selector | Appears in account list | |

### 2. Team Dashboard Page
**Page**: `/home/[account]`

| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Left border accent | `border-l-2 border-zinc-900 pl-10` present | |
| Page loads without error | No console errors | |
| Layout consistency | Matches Sparlo design system | |
| Navigation works | All sidebar links functional | |

### 3. Team Billing Page (PRIMARY FOCUS)
**Page**: `/home/[account]/billing`

#### Usage Card
| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Usage percentage displays | Shows "X% of your monthly limit used" | |
| Progress bar accurate | Visual matches percentage | |
| Tokens used/limit | Shows "X,XXX / X,XXX tokens" | |
| Period dates | Shows billing period range | |
| Low usage state | Green indicator when < 70% | |
| Medium usage state | Yellow indicator when 70-90% | |
| High usage state | Red indicator when > 90% | |

#### Member Usage Breakdown
| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Section header | "Usage by Team Member" visible | |
| Member list displays | All team members shown | |
| Zero-report members | Members with 0 reports included | |
| Report counts | Correct counts per member | |
| Former members | Shown with "(Former)" label | |
| Sort order | Descending by report count | |
| Empty state | Graceful message if no members | |

#### Layout & Design
| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Left border accent | Consistent with other team pages | |
| Card styling | `rounded-xl border-zinc-200 shadow-sm` | |
| Responsive design | Works on mobile/tablet | |
| Loading state | Shows while data fetches | |
| Error state | Clear error message if fails | |

### 4. Team Members Page
**Page**: `/home/[account]/members`

| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Left border accent | Design system consistent | |
| Members table loads | Shows all team members | |
| Invite button | Functional if user has permission | |
| Role badges | Correct roles displayed | |
| Actions menu | Edit/remove options work | |
| Pending invitations | Separate section visible | |

### 5. Team Settings Page
**Page**: `/home/[account]/settings`

| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Left border accent | Design system consistent | |
| Account name editable | Form validates & saves | |
| Account slug visible | Shows current slug | |
| Danger zone | Delete account option | |
| Permissions check | Only owners see delete | |

### 6. Cross-Page Navigation

| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Sidebar links | All navigate correctly | |
| Breadcrumbs | Accurate path shown | |
| Account switcher | Can switch between personal/team | |
| Back navigation | Browser back works | |

### 7. Authorization & Security

| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Non-member access | Returns error/redirect | |
| Role-based buttons | Hidden if no permission | |
| Data isolation | Only see own team's data | |

---

## Edge Cases to Test

### Usage Display
1. [ ] Team with 0 total usage
2. [ ] Team at exactly 100% usage
3. [ ] Team over 100% usage (if possible)
4. [ ] Single member team
5. [ ] Team with 10+ members
6. [ ] Member who left but had reports

### Error Handling
1. [ ] Network timeout during load
2. [ ] Invalid team slug in URL
3. [ ] Expired session

---

## Performance Checks

| Metric | Target | Status |
|--------|--------|--------|
| Page load time | < 2 seconds | |
| No layout shift | CLS < 0.1 | |
| Interactive time | < 3 seconds | |

---

## Accessibility Checks

| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Keyboard navigation | All elements focusable | |
| Screen reader | Labels & ARIA present | |
| Color contrast | Meets WCAG AA | |
| Focus indicators | Visible focus rings | |

---

## Visual Consistency

| Item | Expected Behavior | Status |
|------|-------------------|--------|
| Typography | Consistent with design system | |
| Spacing | Consistent margins/padding | |
| Colors | Zinc palette only | |
| Icons | Lucide icons, consistent sizing | |

---

## Issues Found

### Critical (P1)
_Issues that break functionality_

| # | Description | Page | Steps to Reproduce |
|---|-------------|------|-------------------|
| | | | |

### Important (P2)
_Issues that degrade experience_

| # | Description | Page | Steps to Reproduce |
|---|-------------|------|-------------------|
| | | | |

### Nice-to-Have (P3)
_Polish and improvements_

| # | Description | Page | Suggestion |
|---|-------------|------|-----------|
| | | | |

---

## Recommendations

_To be filled after audit completion_

---

## Sign-off

- [ ] All P1 issues resolved
- [ ] P2 issues documented for follow-up
- [ ] Feature ready for production
