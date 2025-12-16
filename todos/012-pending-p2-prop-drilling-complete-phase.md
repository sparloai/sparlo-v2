---
status: pending
priority: p2
issue_id: "012"
tags: [react, architecture, components, refactoring]
dependencies: []
---

# Excessive Prop Drilling in CompletePhase Component

CompletePhase component receives 19+ props, indicating need for better state organization.

## Problem Statement

The `CompletePhase` component has grown to accept 19+ props, making it:
- Hard to maintain and reason about
- Difficult to test in isolation
- Prone to prop drilling issues
- Complex to extend with new features

While the component serves as a composition root (which justifies some prop count), the current level is excessive.

**Severity:** P2 - Maintainability concern, not blocking

## Findings

- **File:** `apps/web/app/home/(user)/_components/complete-phase.tsx`

**Current props (19+):**
```typescript
interface CompletePhaseProps {
  reportData: ReportData;
  activeConversation: Conversation | null;
  tocItems: TocItem[];
  activeSection: string;
  showToc: boolean;
  setShowToc: (show: boolean) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  chatMessages: ChatMessage[];
  chatInput: string;
  setChatInput: (input: string) => void;
  isChatLoading: boolean;
  reportRef: RefObject<HTMLDivElement>;
  chatEndRef: RefObject<HTMLDivElement>;
  scrollToSection: (sectionId: string) => void;
  markdownComponents: Components;
  onStartNew: () => void;
  onChatSubmit: (e: FormEvent) => Promise<void>;
  onChatKeyDown: (e: KeyboardEvent) => void;
}
```

**Analysis:**
- Props can be grouped by feature: Report (5), TOC (4), Chat (8), Actions (2)
- Chat props especially are tightly coupled - should be extracted
- Some props are just passed through to child components

## Proposed Solutions

### Option 1: Extract Chat to Custom Hook + Context

**Approach:** Move chat state and handlers to dedicated hook, expose via context

**Pros:**
- Reduces CompletePhase to ~12 props
- Chat logic reusable elsewhere
- Clean separation of concerns

**Cons:**
- New context = complexity
- Must ensure proper memoization

**Effort:** 3-4 hours

**Risk:** Low

**Implementation:**
```typescript
// useChatContext.ts
const ChatContext = createContext<ChatContextType | null>(null);

export function ChatProvider({ children, reportData }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = useCallback(async (e) => {
    // ... chat logic
  }, [reportData]);

  return (
    <ChatContext.Provider value={{ messages, input, setInput, isLoading, handleSubmit }}>
      {children}
    </ChatContext.Provider>
  );
}

// CompletePhase.tsx - now just 11 props
interface CompletePhaseProps {
  reportData: ReportData;
  activeConversation: Conversation | null;
  tocItems: TocItem[];
  activeSection: string;
  showToc: boolean;
  setShowToc: (show: boolean) => void;
  reportRef: RefObject<HTMLDivElement>;
  scrollToSection: (sectionId: string) => void;
  markdownComponents: Components;
  onStartNew: () => void;
}
```

---

### Option 2: Split into Smaller Subcomponents

**Approach:** Break CompletePhase into ReportView, ChatDrawer, TocSidebar

**Pros:**
- Each component has focused props
- Better testability
- Natural component boundaries

**Cons:**
- More files to manage
- State coordination between components
- May still need prop drilling

**Effort:** 4-5 hours

**Risk:** Medium

---

### Option 3: Use Compound Component Pattern

**Approach:** CompletePhase as container with slot-based children

**Pros:**
- Flexible composition
- Explicit component relationships
- Good for extensibility

**Cons:**
- More complex API
- Learning curve for team
- May be overkill for this case

**Effort:** 5-6 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_components/complete-phase.tsx` - Main component
- `apps/web/app/home/(user)/page.tsx` - Props passed from here
- New file: `_lib/use-chat.ts` or `_components/chat-provider.tsx`

**Prop groupings:**
1. **Report Core:** reportData, activeConversation, markdownComponents, reportRef
2. **TOC:** tocItems, activeSection, showToc, setShowToc, scrollToSection
3. **Chat:** isChatOpen, setIsChatOpen, chatMessages, chatInput, setChatInput, isChatLoading, chatEndRef, onChatSubmit, onChatKeyDown
4. **Actions:** onStartNew

## Resources

- **React Context Best Practices:** https://react.dev/learn/passing-data-deeply-with-context
- **Compound Components:** https://www.patterns.dev/react/compound-pattern

## Acceptance Criteria

- [ ] CompletePhase has ≤12 props
- [ ] Chat functionality extracted to separate hook/context
- [ ] No functionality regression
- [ ] Components remain testable
- [ ] TypeScript types remain strict
- [ ] All tests pass

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (Architecture Review Agent)

**Actions:**
- Counted props in CompletePhase interface
- Analyzed prop usage patterns
- Grouped props by feature area
- Identified chat as best extraction candidate

**Learnings:**
- CompletePhase is intentionally a composition root
- Some prop count is acceptable for this pattern
- Chat logic is most isolated and extractable
- TOC could also be extracted but less benefit

## Notes

- The 19 props aren't inherently wrong - composition roots often have many
- Focus on extracting chat first as it's most self-contained
- Consider if this is worth doing vs other P2 items
- Related: Simplicity agent noted same issue
