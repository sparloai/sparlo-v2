---
status: pending
priority: p3
issue_id: "017"
tags: [react, refactoring, hooks, frontend]
dependencies: ["012"]
---

# Extract Chat Logic to Custom Hook

Chat functionality in page.tsx should be extracted to dedicated custom hook for better reusability.

## Problem Statement

The main page component contains ~150 lines of chat-related logic:
- State management (messages, input, loading)
- Streaming response handling
- Message submission
- Keyboard handlers

This makes the component harder to maintain and prevents chat reuse elsewhere.

**Severity:** P3 - Code organization improvement

## Findings

- **File:** `apps/web/app/home/(user)/page.tsx`

**Chat-related code (lines ~48-368):**
```typescript
// State declarations (~10 lines)
const [isChatOpen, setIsChatOpen] = useState(false);
const [chatInput, setChatInput] = useState('');
const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
const [isChatLoading, setIsChatLoading] = useState(false);
const chatEndRef = useRef<HTMLDivElement>(null);

// Chat submit handler (~120 lines)
const handleChatSubmit = useCallback(async (e: React.FormEvent) => {
  // ... streaming logic
}, [chatInput, isChatLoading, chatMessages, reportData, activeConversation]);

// Keyboard handler (~8 lines)
const handleChatKeyDown = (e: React.KeyboardEvent) => {
  // ...
};
```

**What should be extracted:**
- All chat state
- Chat submit with streaming
- Message formatting
- Error handling

## Proposed Solutions

### Option 1: Simple useChat Hook

**Approach:** Extract chat logic to `useChat.ts` hook

**Pros:**
- Simple extraction
- No new abstractions
- Clear responsibilities

**Cons:**
- Still coupled to report context
- May need to pass reportData

**Effort:** 2-3 hours

**Risk:** Low

**Implementation:**
```typescript
// _lib/use-chat.ts
interface UseChatOptions {
  reportData: ReportData | null;
  conversationTitle: string;
}

export function useChat({ reportData, conversationTitle }: UseChatOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    // ... streaming logic
  }, [input, isLoading, messages, reportData, conversationTitle]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  return {
    isOpen,
    setIsOpen,
    input,
    setInput,
    messages,
    isLoading,
    endRef,
    handleSubmit,
    handleKeyDown,
  };
}

// page.tsx usage
const chat = useChat({ reportData, conversationTitle: activeConversation?.title ?? '' });
```

---

### Option 2: Chat Context Provider

**Approach:** Create ChatProvider component with context

**Pros:**
- No prop drilling
- Chat state accessible anywhere
- Better for complex UIs

**Cons:**
- More boilerplate
- Context overhead
- May be overkill

**Effort:** 3-4 hours

**Risk:** Low

---

### Option 3: Use TanStack Query for Chat

**Approach:** Model chat as mutations with optimistic updates

**Pros:**
- Consistent with data fetching patterns
- Built-in loading/error states
- Cache integration

**Cons:**
- Learning curve
- May not fit chat UX well
- Streaming needs custom handling

**Effort:** 4-5 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/page.tsx` - Extract from here
- New: `apps/web/app/home/(user)/_lib/use-chat.ts`
- `apps/web/app/home/(user)/_components/complete-phase.tsx` - Will consume hook

**Dependencies:**
- Should be done after Issue 012 (CompletePhase prop cleanup)
- This extraction enables that cleanup

## Resources

- **React Custom Hooks:** https://react.dev/learn/reusing-logic-with-custom-hooks
- **Streaming in React:** https://react.dev/reference/react/use

## Acceptance Criteria

- [ ] Chat logic extracted to `use-chat.ts`
- [ ] page.tsx reduced by ~150 lines
- [ ] Chat functionality unchanged
- [ ] Hook is reusable (could be used elsewhere)
- [ ] TypeScript types properly defined
- [ ] All tests pass

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (Simplicity Review Agent)

**Actions:**
- Measured chat-related code in page.tsx
- Identified extraction boundaries
- Assessed hook vs context approach
- Outlined simple extraction plan

**Learnings:**
- Chat logic is well-contained
- Streaming handling is most complex part
- Simple hook is sufficient for current needs
- Context would add unnecessary complexity

## Notes

- Lower priority since chat works correctly
- Enables Issue 012 (CompletePhase cleanup)
- Could be quick win if bundled with other refactoring
- Consider if chat will be used elsewhere before investing
