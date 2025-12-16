---
status: completed
priority: p2
issue_id: "006"
tags: [code-review, performance, architecture, pr-22]
dependencies: ["002", "003"]
---

# Excessive useState Hooks (18 State Variables)

## Problem Statement

The `useSparlo` hook uses 18 separate `useState` calls, causing multiple consecutive re-renders when related state changes. Switching conversations triggers 8-10 state updates sequentially.

**Why it matters:** Performance degradation, complex dependency management, difficult to reason about state transitions.

## Findings

### Evidence from Review

**File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`
**Lines:** 62-79

**Current State Variables (18):**
```typescript
const [appState, setAppState] = useState<AppState>('input');
const [conversations, setConversations] = useState<Conversation[]>(...);
const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
const [activeReportId, setActiveReportId] = useState<string | null>(null);
const [messages, setMessages] = useState<Message[]>([]);
const [reportData, setReportData] = useState<ReportResponse | null>(null);
const [currentStep, setCurrentStep] = useState('AN0');
const [completedSteps, setCompletedSteps] = useState<string[]>([]);
const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
const [hasAskedClarification, setHasAskedClarification] = useState(false);
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);
const [pendingMessage, setPendingMessage] = useState<string | null>(null);
// Plus refs and useTransition
```

**startNewConversation Updates 8+ States:**
```typescript
setActiveConversation(null);
setActiveReportId(null);
setMessages([]);
setReportData(null);
setCurrentStep('AN0');
setCompletedSteps([]);
setClarificationQuestion(null);
setHasAskedClarification(false);
setError(null);
setPendingMessage(null);
setAppState('input');
```

## Proposed Solutions

### Option A: useReducer for Related State (Recommended)

```typescript
type State = {
  appState: AppState;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  activeReportId: string | null;
  messages: Message[];
  reportData: ReportResponse | null;
  currentStep: string;
  completedSteps: string[];
  clarificationQuestion: string | null;
  hasAskedClarification: boolean;
  error: string | null;
  isLoading: boolean;
  pendingMessage: string | null;
};

type Action =
  | { type: 'START_NEW_CONVERSATION' }
  | { type: 'SELECT_CONVERSATION'; payload: { conversation: Conversation; messages: Message[] } }
  | { type: 'UPDATE_STATUS'; payload: { step: string; completed: string[] } }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

function sparloReducer(state: State, action: Action): State {
  switch (action.type) {
    case 'START_NEW_CONVERSATION':
      return {
        ...state,
        activeConversation: null,
        activeReportId: null,
        messages: [],
        reportData: null,
        currentStep: 'AN0',
        completedSteps: [],
        clarificationQuestion: null,
        hasAskedClarification: false,
        error: null,
        pendingMessage: null,
        appState: 'input',
      }; // Single state update = single render
    // ... more cases
  }
}

const [state, dispatch] = useReducer(sparloReducer, initialState);
```

| Aspect | Assessment |
|--------|------------|
| Pros | Single render per action, explicit state transitions, easier testing |
| Cons | More boilerplate, migration effort |
| Effort | Large |
| Risk | Medium |

### Option B: Group Related State Objects

```typescript
const [conversationState, setConversationState] = useState({
  active: null as Conversation | null,
  activeReportId: null as string | null,
  list: initialReports?.map(reportToConversation) ?? [],
});

const [processingState, setProcessingState] = useState({
  appState: 'input' as AppState,
  currentStep: 'AN0',
  completedSteps: [] as string[],
  isLoading: false,
  pendingMessage: null as string | null,
});
```

| Aspect | Assessment |
|--------|------------|
| Pros | Fewer state updates, simpler than full reducer |
| Cons | Still multiple setState calls needed |
| Effort | Medium |
| Risk | Low |

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**State Groupings:**
1. **Conversation State:** active, activeReportId, list, messages
2. **Processing State:** appState, currentStep, completedSteps, isLoading, pendingMessage
3. **Clarification State:** question, hasAsked
4. **UI State:** error, reportData

## Acceptance Criteria

- [ ] Conversation switch causes ≤3 renders (down from 8-10)
- [ ] State transitions are explicit and documented
- [ ] All existing functionality preserved
- [ ] Performance improvement measurable with React DevTools

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-15 | Created from PR #22 code review | Performance and architecture reviewers flagged |

## Resources

- **PR:** #22
- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts:62-79`
