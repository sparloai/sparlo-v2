'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';

import { ApiError, TimeoutError, sparloApi } from './api';
import {
  type SparloReport,
  archiveReport,
  createReport,
  deleteReport,
  renameReport,
  updateReport,
} from './server/sparlo-reports-server-actions';
import type {
  AppState,
  ChatResponse,
  Conversation,
  Message,
  ReportResponse,
  UIPhase,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const INITIAL_POLLING_INTERVAL = 3000;
const MAX_POLLING_INTERVAL = 30000;
const MAX_POLLING_ERRORS = 5;
const POLL_TOTAL_TIMEOUT = 600000; // 10 minutes total timeout for polling
const MAX_MESSAGE_LENGTH = 10000;
const SEND_MESSAGE_DEBOUNCE_MS = 500; // Debounce time for sendMessage to prevent rapid-fire
const TITLE_MAX_LENGTH = 50;
const MESSAGE_PREVIEW_LENGTH = 100;
const DEFAULT_STEP = 'AN0';
const PROCESSING_STEP = 'AN1';
const SKIP_CLARIFICATION_MESSAGE =
  'Please proceed with the analysis based on the information provided.';
const FORCE_SKIP_MESSAGE =
  'I want to proceed without answering. Please start the analysis now.';

// ============================================================================
// Types
// ============================================================================

interface SparloState {
  appState: AppState;
  currentPhase: UIPhase; // Explicit UI phase - no longer derived from multiple variables
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
}

type SparloAction =
  | { type: 'START_NEW_CONVERSATION' }
  | {
      type: 'SELECT_CONVERSATION';
      payload: {
        conversation: Conversation;
        reportId: string;
        messages: Message[];
      };
    }
  | { type: 'SET_CONVERSATIONS'; payload: Conversation[] }
  | { type: 'ADD_CONVERSATION'; payload: Conversation }
  | {
      type: 'UPDATE_CONVERSATION';
      payload: { id: string; updates: Partial<Conversation> };
    }
  | { type: 'REMOVE_CONVERSATION'; payload: string }
  | {
      type: 'SET_ACTIVE_REPORT';
      payload: { conversation: Conversation; reportId: string };
    }
  | { type: 'SET_REPORT_DATA'; payload: ReportResponse | null }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'ADD_MESSAGE_PAIR'; payload: { user: Message; assistant: Message } }
  | { type: 'UPDATE_STATUS'; payload: { step: string; completed: string[] } }
  | { type: 'SET_APP_STATE'; payload: AppState }
  | {
      type: 'SET_CLARIFICATION';
      payload: { question: string | null; hasAsked: boolean };
    }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PENDING_MESSAGE'; payload: string | null }
  | { type: 'SET_PHASE'; payload: UIPhase }
  | { type: 'START_ANALYZING'; payload: string } // pendingMessage
  | { type: 'START_CLARIFYING'; payload: string } // question
  | { type: 'COMPLETE_REPORT'; payload: ReportResponse }
  | {
      type: 'START_PROCESSING';
      payload: { step: string; clearClarification: boolean };
    };

interface UseSparloReturn {
  appState: AppState;
  currentPhase: UIPhase; // Explicit UI phase for rendering
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
  getActiveReportChatHistory: () => Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  updateReportCache: (
    reportId: string,
    chatHistory: Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>,
  ) => void;
  startNewConversation: () => void;
  selectConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  archiveConversation: (id: string) => void;
  sendMessage: (message: string) => Promise<void>;
  skipClarification: () => Promise<void>;
  cancelProcessing: () => void;
}

// ============================================================================
// Helpers
// ============================================================================

function reportToConversation(report: SparloReport): Conversation {
  return {
    id: report.id,
    title: report.title,
    status: report.status,
    created_at: new Date(report.created_at),
    updated_at: new Date(report.updated_at),
    lastMessage: report.last_message ?? undefined,
    archived: report.archived ?? false,
  };
}

function truncateMessage(msg: string, maxLength: number): string {
  return msg.length > maxLength ? msg.slice(0, maxLength) + '...' : msg;
}

function generateMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function getSafeErrorMessage(error: unknown): string {
  if (error instanceof TimeoutError) {
    return 'Request timed out. Please try again.';
  }
  if (error instanceof ApiError) {
    switch (error.status) {
      case 404:
        return 'Resource not found';
      case 403:
        return 'Access denied';
      case 429:
        return 'Too many requests. Please try again later.';
      case 500:
        return 'Server error. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
  return 'An error occurred. Please try again.';
}

function createInitialState(initialReports?: SparloReport[]): SparloState {
  return {
    appState: 'input',
    currentPhase: 'input',
    conversations: (initialReports ?? []).map(reportToConversation),
    activeConversation: null,
    activeReportId: null,
    messages: [],
    reportData: null,
    currentStep: DEFAULT_STEP,
    completedSteps: [],
    clarificationQuestion: null,
    hasAskedClarification: false,
    error: null,
    isLoading: false,
    pendingMessage: null,
  };
}

// ============================================================================
// Reducer
// ============================================================================

function sparloReducer(state: SparloState, action: SparloAction): SparloState {
  switch (action.type) {
    case 'START_NEW_CONVERSATION':
      return {
        ...state,
        activeConversation: null,
        activeReportId: null,
        messages: [],
        reportData: null,
        currentStep: DEFAULT_STEP,
        completedSteps: [],
        clarificationQuestion: null,
        hasAskedClarification: false,
        error: null,
        pendingMessage: null,
        appState: 'input',
        currentPhase: 'input',
      };

    case 'SELECT_CONVERSATION':
      return {
        ...state,
        activeConversation: action.payload.conversation,
        activeReportId: action.payload.reportId,
        messages: action.payload.messages,
        reportData: null,
        error: null,
        clarificationQuestion: null,
        hasAskedClarification: false,
        pendingMessage: null,
      };

    case 'SET_CONVERSATIONS':
      return { ...state, conversations: action.payload };

    case 'ADD_CONVERSATION':
      return {
        ...state,
        conversations: [action.payload, ...state.conversations],
      };

    case 'UPDATE_CONVERSATION': {
      const updated = state.conversations.map((c) =>
        c.id === action.payload.id ? { ...c, ...action.payload.updates } : c,
      );
      const activeUpdated =
        state.activeConversation?.id === action.payload.id
          ? { ...state.activeConversation, ...action.payload.updates }
          : state.activeConversation;
      return {
        ...state,
        conversations: updated,
        activeConversation: activeUpdated,
      };
    }

    case 'REMOVE_CONVERSATION':
      return {
        ...state,
        conversations: state.conversations.filter(
          (c) => c.id !== action.payload,
        ),
      };

    case 'SET_ACTIVE_REPORT':
      return {
        ...state,
        activeConversation: action.payload.conversation,
        activeReportId: action.payload.reportId,
      };

    case 'SET_REPORT_DATA':
      return { ...state, reportData: action.payload };

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };

    case 'ADD_MESSAGE_PAIR':
      return {
        ...state,
        messages: [
          ...state.messages,
          action.payload.user,
          action.payload.assistant,
        ],
      };

    case 'UPDATE_STATUS':
      return {
        ...state,
        currentStep: action.payload.step,
        completedSteps: action.payload.completed,
      };

    case 'SET_APP_STATE':
      return { ...state, appState: action.payload };

    case 'SET_CLARIFICATION':
      return {
        ...state,
        clarificationQuestion: action.payload.question,
        hasAskedClarification: action.payload.hasAsked,
      };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_PENDING_MESSAGE':
      return { ...state, pendingMessage: action.payload };

    case 'SET_PHASE':
      return { ...state, currentPhase: action.payload };

    case 'START_ANALYZING':
      return {
        ...state,
        currentPhase: 'analyzing',
        pendingMessage: action.payload,
        isLoading: true,
        error: null,
      };

    case 'START_CLARIFYING':
      return {
        ...state,
        currentPhase: 'clarifying',
        clarificationQuestion: action.payload,
        hasAskedClarification: true,
        appState: 'input',
        isLoading: false,
      };

    case 'COMPLETE_REPORT':
      return {
        ...state,
        reportData: action.payload,
        pendingMessage: null,
        appState: 'complete',
        currentPhase: 'complete',
      };

    case 'START_PROCESSING':
      return {
        ...state,
        currentStep: action.payload.step,
        appState: 'processing',
        currentPhase: 'processing',
        clarificationQuestion: action.payload.clearClarification
          ? null
          : state.clarificationQuestion,
      };

    default:
      return state;
  }
}

// ============================================================================
// Hook
// ============================================================================

export function useSparlo(initialReports?: SparloReport[]): UseSparloReturn {
  const [state, dispatch] = useReducer(
    sparloReducer,
    initialReports,
    createInitialState,
  );

  // Grouped refs for better organization and maintainability
  // Lifecycle ref - tracks component mount state
  const lifecycleRef = useRef({ mounted: true });

  // Data ref - stores reports data outside React state for synchronous access
  const dataRef = useRef({ reports: initialReports ?? ([] as SparloReport[]) });

  // Polling refs - all polling-related state
  const pollingRef = useRef({
    timer: null as NodeJS.Timeout | null,
    session: 0,
    interval: INITIAL_POLLING_INTERVAL,
    errorCount: 0,
    startTime: null as number | null,
  });

  // Message refs - message processing state for race condition prevention
  const messageRef = useRef({
    processing: false,
    subsequentSent: false,
    reportCreationInProgress: false,
    lastTime: 0,
  });

  // State ref - conversation state that needs synchronous access
  const stateRef = useRef({
    conversationId: null as string | null,
    // Chain state for stateless mode - stored when clarification is received
    chainState: null as Record<string, unknown> | null,
  });

  // Update dataRef.reports when initialReports changes
  useEffect(() => {
    if (initialReports) {
      dataRef.current.reports = initialReports;
    }
  }, [initialReports]);

  // Cleanup on unmount
  useEffect(() => {
    lifecycleRef.current.mounted = true;
    return () => {
      lifecycleRef.current.mounted = false;
      if (pollingRef.current.timer) {
        clearInterval(pollingRef.current.timer);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Helper: Stop polling
  // -------------------------------------------------------------------------
  const stopPolling = useCallback(() => {
    if (pollingRef.current.timer) {
      clearInterval(pollingRef.current.timer);
      pollingRef.current.timer = null;
    }
    pollingRef.current.session++;
  }, []);

  // -------------------------------------------------------------------------
  // Helper: Handle error with consistent pattern
  // -------------------------------------------------------------------------
  const handleError = useCallback(
    (
      err: unknown,
      options: { stopPoll?: boolean; logPrefix?: string } = {},
    ) => {
      if (!lifecycleRef.current.mounted) return;

      if (options.stopPoll) {
        stopPolling();
      }

      console.error(options.logPrefix || '[useSparlo]', err);
      dispatch({ type: 'SET_ERROR', payload: getSafeErrorMessage(err) });
    },
    [stopPolling],
  );

  // -------------------------------------------------------------------------
  // Helper: Update report and local state
  // -------------------------------------------------------------------------
  const updateReportAndState = useCallback(
    async (
      reportId: string,
      updateData: Omit<Parameters<typeof updateReport>[0], 'id'>,
    ) => {
      const result = await updateReport({ ...updateData, id: reportId });

      if (!lifecycleRef.current.mounted) return;

      if (result.success && result.report) {
        const updatedConv = reportToConversation(result.report);
        dispatch({
          type: 'UPDATE_CONVERSATION',
          payload: { id: reportId, updates: updatedConv },
        });
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Helper: Handle clarification response
  // -------------------------------------------------------------------------
  const handleClarificationResponse = useCallback(
    async (
      response: ChatResponse,
      reportId: string,
      startPollingFn: (convId: string, repId: string) => void,
    ) => {
      if (!lifecycleRef.current.mounted) return;

      if (state.hasAskedClarification) {
        dispatch({
          type: 'SET_CLARIFICATION',
          payload: { question: null, hasAsked: true },
        });

        try {
          // Use chain_state from response for stateless mode
          const chainState =
            response.chain_state || stateRef.current.chainState;

          const skipResponse = await sparloApi.chat(
            SKIP_CLARIFICATION_MESSAGE,
            response.conversation_id,
            undefined, // mode
            chainState,
          );

          // Clear chain state after processing
          stateRef.current.chainState = null;

          if (!lifecycleRef.current.mounted) return;

          dispatch({
            type: 'START_PROCESSING',
            payload: {
              step: skipResponse.current_step || PROCESSING_STEP,
              clearClarification: true,
            },
          });
          startPollingFn(skipResponse.conversation_id, reportId);
        } catch (err) {
          handleError(err, {
            stopPoll: true,
            logPrefix: 'Clarification skip error:',
          });
        }
      } else {
        // Show clarification question to user and store chain_state for stateless mode
        if (response.chain_state) {
          stateRef.current.chainState = response.chain_state;
        }
        dispatch({ type: 'START_CLARIFYING', payload: response.message });
      }
    },
    [state.hasAskedClarification, handleError],
  );

  // -------------------------------------------------------------------------
  // Start polling for status updates
  // -------------------------------------------------------------------------
  const startPolling = useCallback(
    (backendConversationId: string, reportId: string) => {
      stopPolling();

      const sessionId = ++pollingRef.current.session;
      stateRef.current.conversationId = backendConversationId;
      pollingRef.current.interval = INITIAL_POLLING_INTERVAL;
      pollingRef.current.errorCount = 0;
      pollingRef.current.startTime = Date.now(); // Record when polling started

      const poll = async () => {
        // Skip if session changed, unmounted, or tab hidden
        if (
          pollingRef.current.session !== sessionId ||
          !lifecycleRef.current.mounted
        ) {
          return;
        }
        if (typeof document !== 'undefined' && document.hidden) {
          return;
        }

        // Check total timeout
        if (
          pollingRef.current.startTime &&
          Date.now() - pollingRef.current.startTime > POLL_TOTAL_TIMEOUT
        ) {
          stopPolling();
          dispatch({
            type: 'SET_ERROR',
            payload: 'Processing timed out after 10 minutes. Please try again.',
          });
          await updateReportAndState(reportId, { status: 'error' });
          return;
        }

        try {
          const status = await sparloApi.getStatus(backendConversationId);

          // Check again after async
          if (
            pollingRef.current.session !== sessionId ||
            !lifecycleRef.current.mounted
          ) {
            return;
          }

          // Reset error count on success
          pollingRef.current.errorCount = 0;
          pollingRef.current.interval = INITIAL_POLLING_INTERVAL;

          dispatch({
            type: 'UPDATE_STATUS',
            payload: {
              step: status.current_step || DEFAULT_STEP,
              completed: status.completed_steps,
            },
          });

          if (status.status === 'complete' && status.report) {
            stopPolling();

            try {
              const report = await sparloApi.getReport(backendConversationId);
              if (!lifecycleRef.current.mounted) return;

              dispatch({ type: 'COMPLETE_REPORT', payload: report });
              await updateReportAndState(reportId, {
                status: 'complete',
                reportData: report as unknown as Record<string, unknown>,
              });
            } catch (err) {
              handleError(err, { logPrefix: 'Failed to fetch report:' });
            }
          } else if (status.status === 'error') {
            stopPolling();
            dispatch({
              type: 'SET_ERROR',
              payload: status.message || 'An error occurred during processing',
            });
            await updateReportAndState(reportId, { status: 'error' });
          } else if (status.status === 'clarifying') {
            // Stop polling - clarification is handled by sendMessage response handler
            // Polling should not manage clarification state (single source of truth)
            stopPolling();
          }
        } catch (err) {
          if (
            pollingRef.current.session !== sessionId ||
            !lifecycleRef.current.mounted
          ) {
            return;
          }

          console.error('Polling error:', err);
          pollingRef.current.errorCount++;

          // Exponential backoff
          pollingRef.current.interval = Math.min(
            INITIAL_POLLING_INTERVAL *
              Math.pow(2, pollingRef.current.errorCount - 1),
            MAX_POLLING_INTERVAL,
          );

          // Circuit breaker
          if (pollingRef.current.errorCount >= MAX_POLLING_ERRORS) {
            stopPolling();
            dispatch({
              type: 'SET_ERROR',
              payload: 'Connection lost. Please refresh the page.',
            });
            return;
          }

          // Restart with backoff interval
          if (pollingRef.current.timer) {
            clearInterval(pollingRef.current.timer);
            pollingRef.current.timer = setInterval(
              poll,
              pollingRef.current.interval,
            );
          }
        }
      };

      // Initial poll
      poll();
      pollingRef.current.timer = setInterval(poll, INITIAL_POLLING_INTERVAL);
    },
    [stopPolling, updateReportAndState, handleError],
  );

  // -------------------------------------------------------------------------
  // Helper: Reset all message processing refs
  // Used when switching conversations to prevent stale state
  // -------------------------------------------------------------------------
  const resetMessageRefs = useCallback(() => {
    messageRef.current.processing = false;
    messageRef.current.subsequentSent = false;
    messageRef.current.lastTime = 0;
    messageRef.current.reportCreationInProgress = false;
  }, []);

  // -------------------------------------------------------------------------
  // Start a new conversation
  // -------------------------------------------------------------------------
  const startNewConversation = useCallback(() => {
    stopPolling();
    stateRef.current.conversationId = null;
    stateRef.current.chainState = null; // Clear chain state for stateless mode
    pollingRef.current.startTime = null;
    resetMessageRefs(); // Reset all message-related refs
    dispatch({ type: 'START_NEW_CONVERSATION' });
  }, [stopPolling, resetMessageRefs]);

  // -------------------------------------------------------------------------
  // Select an existing conversation
  // -------------------------------------------------------------------------
  const selectConversation = useCallback(
    async (id: string) => {
      stopPolling();
      stateRef.current.conversationId = null;
      stateRef.current.chainState = null; // Clear chain state for stateless mode
      pollingRef.current.startTime = null;
      resetMessageRefs(); // Reset all message-related refs to prevent stale state

      const conv = state.conversations.find((c) => c.id === id);
      if (!conv) return;

      const reportRecord = dataRef.current.reports.find((r) => r.id === id);
      const storedMessages = (reportRecord?.messages ?? []) as Message[];

      dispatch({
        type: 'SELECT_CONVERSATION',
        payload: {
          conversation: conv,
          reportId: id,
          messages: storedMessages.map((m) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        },
      });

      const backendConversationId = reportRecord?.conversation_id;
      if (!backendConversationId) {
        dispatch({ type: 'SET_ERROR', payload: 'Report data not found' });
        dispatch({ type: 'SET_APP_STATE', payload: 'input' });
        return;
      }

      stateRef.current.conversationId = backendConversationId;

      try {
        const status = await sparloApi.getStatus(backendConversationId);
        if (!lifecycleRef.current.mounted) return;

        dispatch({
          type: 'UPDATE_STATUS',
          payload: {
            step: status.current_step || DEFAULT_STEP,
            completed: status.completed_steps,
          },
        });

        if (status.status === 'complete') {
          const report = await sparloApi.getReport(backendConversationId);
          if (!lifecycleRef.current.mounted) return;
          dispatch({ type: 'SET_REPORT_DATA', payload: report });
          dispatch({ type: 'SET_APP_STATE', payload: 'complete' });
        } else if (status.status === 'processing') {
          dispatch({ type: 'SET_APP_STATE', payload: 'processing' });
          startPolling(backendConversationId, id);
        } else if (status.status === 'clarifying') {
          dispatch({
            type: 'SET_CLARIFICATION',
            payload: { question: status.message || null, hasAsked: false },
          });
          dispatch({ type: 'SET_APP_STATE', payload: 'input' });
        } else if (status.status === 'error') {
          dispatch({
            type: 'SET_ERROR',
            payload: status.message || 'An error occurred',
          });
          dispatch({ type: 'SET_APP_STATE', payload: 'processing' });
        }
      } catch (err) {
        if (!lifecycleRef.current.mounted) return;

        if (err instanceof ApiError && err.status === 404) {
          dispatch({
            type: 'SET_ERROR',
            payload:
              'This conversation is no longer available. Start a new one.',
          });
          dispatch({ type: 'SET_APP_STATE', payload: 'input' });
        } else {
          handleError(err, { logPrefix: 'Failed to load conversation:' });
        }
      }
    },
    [
      state.conversations,
      startPolling,
      stopPolling,
      handleError,
      resetMessageRefs,
    ],
  );

  // -------------------------------------------------------------------------
  // Delete a conversation
  // -------------------------------------------------------------------------
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      const result = await deleteReport({ id });
      if (!lifecycleRef.current.mounted) return;

      if (result.success) {
        dispatch({ type: 'REMOVE_CONVERSATION', payload: id });
        if (state.activeConversation?.id === id) {
          startNewConversation();
        }
      }
    },
    [state.activeConversation, startNewConversation],
  );

  // -------------------------------------------------------------------------
  // Rename a conversation
  // -------------------------------------------------------------------------
  const handleRenameConversation = useCallback(
    async (id: string, newTitle: string) => {
      const result = await renameReport({ id, title: newTitle });
      if (!lifecycleRef.current.mounted) return;

      if (result.success && result.report) {
        const updatedConv = reportToConversation(result.report);
        dispatch({
          type: 'UPDATE_CONVERSATION',
          payload: { id, updates: updatedConv },
        });
      }
    },
    [],
  );

  // -------------------------------------------------------------------------
  // Archive/unarchive a conversation
  // -------------------------------------------------------------------------
  const handleArchiveConversation = useCallback(
    async (id: string) => {
      const conv = state.conversations.find((c) => c.id === id);
      if (!conv) return;

      const newArchivedStatus = !conv.archived;
      const result = await archiveReport({ id, archived: newArchivedStatus });
      if (!lifecycleRef.current.mounted) return;

      if (result.success && result.report) {
        const updatedConv = reportToConversation(result.report);
        dispatch({
          type: 'UPDATE_CONVERSATION',
          payload: { id, updates: updatedConv },
        });

        if (state.activeConversation?.id === id && newArchivedStatus) {
          startNewConversation();
        }
      }
    },
    [state.conversations, state.activeConversation, startNewConversation],
  );

  // -------------------------------------------------------------------------
  // Send message - New report creation handler
  // -------------------------------------------------------------------------
  const handleNewReportCreation = useCallback(
    async (message: string, response: ChatResponse) => {
      messageRef.current.reportCreationInProgress = true;
      messageRef.current.subsequentSent = false;

      const title = truncateMessage(message, TITLE_MAX_LENGTH);

      try {
        const result = await createReport({
          conversationId: response.conversation_id,
          title,
          status: response.status,
          lastMessage: message.slice(0, MESSAGE_PREVIEW_LENGTH),
          currentStep: response.current_step,
        });

        if (!lifecycleRef.current.mounted) return;

        if (result.success && result.report) {
          const newConv = reportToConversation(result.report);
          dataRef.current.reports = [result.report, ...dataRef.current.reports];

          dispatch({ type: 'ADD_CONVERSATION', payload: newConv });
          dispatch({
            type: 'SET_ACTIVE_REPORT',
            payload: { conversation: newConv, reportId: result.report.id },
          });

          if (messageRef.current.subsequentSent) {
            startPolling(response.conversation_id, result.report.id);
            messageRef.current.subsequentSent = false;
          } else if (response.status === 'clarifying') {
            await handleClarificationResponse(
              response,
              result.report.id,
              startPolling,
            );
          } else {
            dispatch({
              type: 'START_PROCESSING',
              payload: {
                step: response.current_step || PROCESSING_STEP,
                clearClarification: true,
              },
            });
            startPolling(response.conversation_id, result.report.id);
          }
        }
      } finally {
        messageRef.current.reportCreationInProgress = false;
      }
    },
    [startPolling, handleClarificationResponse],
  );

  // -------------------------------------------------------------------------
  // Send message - Race condition handler
  // -------------------------------------------------------------------------
  const handleRaceConditionMessage = useCallback(
    (response: ChatResponse) => {
      messageRef.current.subsequentSent = true;

      if (!lifecycleRef.current.mounted) return;

      if (response.status === 'error') {
        dispatch({
          type: 'SET_ERROR',
          payload: response.message || 'An error occurred',
        });
        dispatch({ type: 'SET_APP_STATE', payload: 'input' });
        messageRef.current.subsequentSent = false;
      } else if (response.status === 'clarifying') {
        if (state.hasAskedClarification) {
          // Already asked clarification, skip to processing
          dispatch({
            type: 'START_PROCESSING',
            payload: { step: PROCESSING_STEP, clearClarification: true },
          });
        } else {
          // Show clarification question to user
          dispatch({ type: 'START_CLARIFYING', payload: response.message });
        }
      } else if (response.status === 'processing') {
        dispatch({
          type: 'START_PROCESSING',
          payload: {
            step: response.current_step || PROCESSING_STEP,
            clearClarification: true,
          },
        });
      }
    },
    [state.hasAskedClarification],
  );

  // -------------------------------------------------------------------------
  // Send message - Existing report handler
  // -------------------------------------------------------------------------
  const handleExistingReportMessage = useCallback(
    async (message: string, response: ChatResponse, reportId: string) => {
      // Update report in background
      updateReportAndState(reportId, {
        status: response.status,
        lastMessage: message.slice(0, MESSAGE_PREVIEW_LENGTH),
        currentStep: response.current_step,
      });

      // Update local state
      dispatch({
        type: 'UPDATE_CONVERSATION',
        payload: {
          id: reportId,
          updates: {
            status: response.status as Conversation['status'],
            updated_at: new Date(),
            lastMessage: message.slice(0, MESSAGE_PREVIEW_LENGTH),
          },
        },
      });

      if (response.status === 'clarifying') {
        await handleClarificationResponse(response, reportId, startPolling);
      } else if (response.status === 'processing') {
        dispatch({
          type: 'START_PROCESSING',
          payload: {
            step: response.current_step || PROCESSING_STEP,
            clearClarification: true,
          },
        });
        startPolling(response.conversation_id, reportId);
      } else if (
        response.status === 'confirm_rerun' ||
        response.status === 'complete'
      ) {
        const userMsg: Message = {
          id: generateMessageId(),
          role: 'user',
          content: message,
          timestamp: new Date(),
        };
        const assistantMsg: Message = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
        };

        dispatch({
          type: 'ADD_MESSAGE_PAIR',
          payload: { user: userMsg, assistant: assistantMsg },
        });

        const newMessages = [...state.messages, userMsg, assistantMsg];
        updateReportAndState(reportId, {
          messages: newMessages as unknown as Record<string, unknown>[],
        });
      } else {
        dispatch({
          type: 'START_PROCESSING',
          payload: {
            step: response.current_step || DEFAULT_STEP,
            clearClarification: true,
          },
        });
        startPolling(response.conversation_id, reportId);
      }
    },
    [
      state.messages,
      startPolling,
      updateReportAndState,
      handleClarificationResponse,
    ],
  );

  // -------------------------------------------------------------------------
  // Send a message
  // -------------------------------------------------------------------------
  const sendMessage = useCallback(
    async (message: string) => {
      // Input validation
      const trimmed = message.trim();
      if (!trimmed) {
        dispatch({ type: 'SET_ERROR', payload: 'Message cannot be empty' });
        return;
      }
      if (trimmed.length > MAX_MESSAGE_LENGTH) {
        dispatch({
          type: 'SET_ERROR',
          payload: `Message is too long (max ${MAX_MESSAGE_LENGTH} characters)`,
        });
        return;
      }

      // Debounce: prevent rapid-fire messages
      const now = Date.now();
      if (now - messageRef.current.lastTime < SEND_MESSAGE_DEBOUNCE_MS) {
        console.warn('[useSparlo] Message debounced, ignoring rapid-fire');
        return;
      }
      messageRef.current.lastTime = now;

      // Prevent concurrent message processing (race condition fix)
      if (messageRef.current.processing) {
        console.warn('[useSparlo] Message already being processed, ignoring');
        return;
      }

      messageRef.current.processing = true;
      // Use START_ANALYZING to set phase, loading, and pending message atomically
      dispatch({ type: 'START_ANALYZING', payload: trimmed });

      try {
        const currentReport = state.activeReportId
          ? dataRef.current.reports.find((r) => r.id === state.activeReportId)
          : null;
        const backendConversationId =
          currentReport?.conversation_id ||
          stateRef.current.conversationId ||
          undefined;

        // Pass chain state for stateless mode (enables clarification flow to work
        // even if backend loses in-memory state)
        const response = await sparloApi.chat(
          trimmed,
          backendConversationId,
          undefined, // mode
          stateRef.current.chainState,
        );

        if (!lifecycleRef.current.mounted) return;

        if (response.conversation_id) {
          stateRef.current.conversationId = response.conversation_id;
        }

        // Store chain_state for stateless mode (returned when status is "clarifying")
        if (response.chain_state) {
          stateRef.current.chainState = response.chain_state;
        } else if (response.status !== 'clarifying') {
          // Clear chain state when not in clarification mode
          stateRef.current.chainState = null;
        }

        if (
          !state.activeReportId &&
          !messageRef.current.reportCreationInProgress
        ) {
          await handleNewReportCreation(trimmed, response);
        } else if (
          !state.activeReportId &&
          messageRef.current.reportCreationInProgress
        ) {
          handleRaceConditionMessage(response);
        } else if (state.activeReportId) {
          await handleExistingReportMessage(
            trimmed,
            response,
            state.activeReportId,
          );
        }
      } catch (err) {
        if (!lifecycleRef.current.mounted) return;
        handleError(err, { logPrefix: 'Send message error:' });
        messageRef.current.subsequentSent = false;
      } finally {
        messageRef.current.processing = false;
        if (lifecycleRef.current.mounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    },
    [
      state.activeReportId,
      handleNewReportCreation,
      handleRaceConditionMessage,
      handleExistingReportMessage,
      handleError,
    ],
  );

  // -------------------------------------------------------------------------
  // Cancel processing
  // -------------------------------------------------------------------------
  const cancelProcessing = useCallback(() => {
    stopPolling();
    startNewConversation();
  }, [stopPolling, startNewConversation]);

  // -------------------------------------------------------------------------
  // Skip clarification
  // -------------------------------------------------------------------------
  const skipClarification = useCallback(async () => {
    if (!state.clarificationQuestion) return;

    if (messageRef.current.reportCreationInProgress && !state.activeReportId) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'Please wait while report is being created...',
      });
      return;
    }

    if (!state.activeReportId) {
      dispatch({
        type: 'SET_ERROR',
        payload: 'No active conversation to skip',
      });
      return;
    }

    const reportId = state.activeReportId;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({
      type: 'SET_CLARIFICATION',
      payload: { question: null, hasAsked: true },
    });
    dispatch({
      type: 'SET_PENDING_MESSAGE',
      payload: 'Proceeding with analysis...',
    });

    try {
      const currentReport = dataRef.current.reports.find(
        (r) => r.id === reportId,
      );
      const backendConversationId =
        currentReport?.conversation_id ||
        stateRef.current.conversationId ||
        undefined;

      if (!backendConversationId) {
        dispatch({
          type: 'SET_ERROR',
          payload: 'No active conversation to skip',
        });
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Pass chain state for stateless mode
      const response = await sparloApi.chat(
        SKIP_CLARIFICATION_MESSAGE + ' No additional clarification needed.',
        backendConversationId,
        undefined, // mode
        stateRef.current.chainState,
      );

      // Clear chain state after sending clarification skip
      stateRef.current.chainState = null;

      if (!lifecycleRef.current.mounted) return;

      if (response.status === 'processing') {
        dispatch({
          type: 'START_PROCESSING',
          payload: {
            step: response.current_step || PROCESSING_STEP,
            clearClarification: true,
          },
        });
        startPolling(response.conversation_id, reportId);
      } else if (response.status === 'clarifying') {
        const skipAgain = await sparloApi.chat(
          FORCE_SKIP_MESSAGE,
          response.conversation_id,
        );

        if (!lifecycleRef.current.mounted) return;

        dispatch({
          type: 'START_PROCESSING',
          payload: {
            step: skipAgain.current_step || PROCESSING_STEP,
            clearClarification: true,
          },
        });
        startPolling(skipAgain.conversation_id, reportId);
      } else {
        dispatch({
          type: 'START_PROCESSING',
          payload: {
            step: response.current_step || DEFAULT_STEP,
            clearClarification: true,
          },
        });
        startPolling(response.conversation_id, reportId);
      }
    } catch (err) {
      if (!lifecycleRef.current.mounted) return;
      handleError(err, { logPrefix: 'Skip clarification error:' });
    } finally {
      if (lifecycleRef.current.mounted) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }, [
    state.clarificationQuestion,
    state.activeReportId,
    startPolling,
    handleError,
  ]);

  // Get chat history for the active report
  const getActiveReportChatHistory = useCallback(() => {
    if (!state.activeReportId) return [];
    const report = dataRef.current.reports.find(
      (r) => r.id === state.activeReportId,
    );
    return (report?.chat_history ?? []) as Array<{
      id: string;
      role: 'user' | 'assistant';
      content: string;
      timestamp: string;
    }>;
  }, [state.activeReportId]);

  // Update dataRef cache when chat history changes (P2 stale cache fix)
  const updateReportCache = useCallback(
    (
      reportId: string,
      chatHistory: Array<{
        id: string;
        role: 'user' | 'assistant';
        content: string;
        timestamp: string;
      }>,
    ) => {
      const idx = dataRef.current.reports.findIndex((r) => r.id === reportId);
      if (idx !== -1) {
        dataRef.current.reports[idx] = {
          ...dataRef.current.reports[idx]!,
          chat_history: chatHistory,
        };
      }
    },
    [],
  );

  return {
    appState: state.appState,
    currentPhase: state.currentPhase,
    conversations: state.conversations,
    activeConversation: state.activeConversation,
    activeReportId: state.activeReportId,
    messages: state.messages,
    reportData: state.reportData,
    currentStep: state.currentStep,
    completedSteps: state.completedSteps,
    clarificationQuestion: state.clarificationQuestion,
    hasAskedClarification: state.hasAskedClarification,
    error: state.error,
    isLoading: state.isLoading,
    pendingMessage: state.pendingMessage,
    getActiveReportChatHistory,
    updateReportCache,
    startNewConversation,
    selectConversation,
    deleteConversation: handleDeleteConversation,
    renameConversation: handleRenameConversation,
    archiveConversation: handleArchiveConversation,
    sendMessage,
    skipClarification,
    cancelProcessing,
  };
}
