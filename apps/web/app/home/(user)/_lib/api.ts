import {
  type ChatResponse,
  ChatResponseSchema,
  type Conversation,
  type Message,
  type ReportResponse,
  ReportResponseSchema,
  type StatusResponse,
  StatusResponseSchema,
} from './types';

// LocalStorage keys for client-side persistence
const STORAGE_KEYS = {
  CONVERSATIONS: 'sparlo_conversations',
  MESSAGES: 'sparlo_messages',
} as const;

// Request timeout configuration
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

// Internal API key for backend communication (set in environment)
const INTERNAL_API_KEY = process.env.NEXT_PUBLIC_SPARLO_INTERNAL_API_KEY;

/**
 * Get common headers for API requests including authentication.
 */
function getApiHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (INTERNAL_API_KEY) {
    headers['X-API-Key'] = INTERNAL_API_KEY;
  }

  return headers;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class TimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Fetch with timeout support using AbortController.
 * Automatically aborts requests that exceed the timeout.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError('Request timed out. Please try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Request failed' }));
    throw new ApiError(
      response.status,
      error.error || error.detail || 'Request failed',
    );
  }
  return response.json();
}

/**
 * Validates API response using Zod schema.
 * Provides runtime type safety and clear error messages.
 * Uses safeParse for better error handling and debugging.
 */
function validateResponse<T>(
  data: unknown,
  schema: {
    safeParse: (data: unknown) =>
      | { success: true; data: T }
      | {
          success: false;
          error: {
            issues: Array<{ path: (string | number)[]; message: string }>;
          };
        };
  },
  context: string,
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    // Log detailed error for debugging
    console.error(`[API] Validation failed for ${context}:`, {
      errors: result.error.issues,
      receivedData: data,
    });

    // Provide actionable error message with field details
    const fieldErrors = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join(', ');

    throw new ApiError(
      500,
      `Invalid response format for ${context}. Fields: ${fieldErrors}`,
    );
  }

  return result.data;
}

export const sparloApi = {
  /**
   * Send a chat message (start new conversation or continue)
   * Response is validated at runtime using Zod schema.
   *
   * @param message - The user's message
   * @param conversationId - Optional conversation ID for continuing a conversation
   * @param mode - Optional mode ('corpus' for legacy mode)
   * @param chainState - Optional chain state for stateless mode (sent back from clarification)
   */
  async chat(
    message: string,
    conversationId?: string,
    mode?: string | null,
    chainState?: Record<string, unknown> | null,
  ): Promise<ChatResponse> {
    let url = '/api/sparlo/chat';
    if (mode === 'corpus') {
      url += '?mode=corpus';
    }

    const response = await fetchWithTimeout(url, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        chain_state: chainState,
      }),
    });

    const data = await handleResponse<unknown>(response);
    return validateResponse(data, ChatResponseSchema, 'chat');
  },

  /**
   * Get the status of a conversation (for polling during processing)
   * Response is validated at runtime using Zod schema.
   */
  async getStatus(conversationId: string): Promise<StatusResponse> {
    const response = await fetchWithTimeout(
      `/api/sparlo/status/${conversationId}`,
      { headers: getApiHeaders() },
      10000, // 10 second timeout for status checks
    );
    const data = await handleResponse<unknown>(response);
    return validateResponse(data, StatusResponseSchema, 'status');
  },

  /**
   * Get the full report for a completed conversation
   * Response is validated at runtime using Zod schema.
   */
  async getReport(conversationId: string): Promise<ReportResponse> {
    const response = await fetchWithTimeout(
      `/api/sparlo/report/${conversationId}`,
      { headers: getApiHeaders() },
      60000, // 60 second timeout for report fetch (can be large)
    );
    const data = await handleResponse<unknown>(response);
    return validateResponse(data, ReportResponseSchema, 'report');
  },

  // LocalStorage helpers for client-side conversation persistence

  /**
   * Get all conversations from localStorage
   */
  getConversations(): Conversation[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!stored) return [];

    try {
      const convs = JSON.parse(stored) as Conversation[];
      return convs.map((c) => ({
        ...c,
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Save conversation to local storage
   */
  saveConversation(conversation: Conversation): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    const convs: Conversation[] = stored ? JSON.parse(stored) : [];

    const existingIndex = convs.findIndex((c) => c.id === conversation.id);
    if (existingIndex >= 0) {
      convs[existingIndex] = conversation;
    } else {
      convs.unshift(conversation);
    }

    // Keep only last 100 conversations
    const trimmed = convs.slice(0, 100);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(trimmed));
  },

  /**
   * Delete conversation from local storage
   */
  deleteConversation(conversationId: string): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!stored) return;

    const convs: Conversation[] = JSON.parse(stored);
    const filtered = convs.filter((c) => c.id !== conversationId);
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(filtered));

    // Also delete messages for this conversation
    this.deleteMessages(conversationId);
  },

  /**
   * Update a conversation
   */
  updateConversation(
    conversationId: string,
    updates: Partial<Conversation>,
  ): Conversation | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem(STORAGE_KEYS.CONVERSATIONS);
    if (!stored) return null;

    const convs: Conversation[] = JSON.parse(stored);
    const index = convs.findIndex((c) => c.id === conversationId);
    if (index === -1) return null;

    const existing = convs[index];
    if (!existing) return null;

    const updated: Conversation = {
      id: updates.id ?? existing.id,
      title: updates.title ?? existing.title,
      status: updates.status ?? existing.status,
      created_at: existing.created_at,
      updated_at: new Date(),
      archived: updates.archived ?? existing.archived,
      pinned: updates.pinned ?? existing.pinned,
      lastMessage: updates.lastMessage ?? existing.lastMessage,
      messageCount: updates.messageCount ?? existing.messageCount,
    };

    convs[index] = updated;
    localStorage.setItem(STORAGE_KEYS.CONVERSATIONS, JSON.stringify(convs));

    return {
      ...updated,
      created_at: new Date(updated.created_at),
      updated_at: new Date(updated.updated_at),
    };
  },

  /**
   * Get messages for a conversation
   */
  getMessages(conversationId: string): Message[] {
    if (typeof window === 'undefined') return [];

    const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!stored) return [];

    try {
      const allMessages: Record<string, Message[]> = JSON.parse(stored);
      const messages = allMessages[conversationId] || [];
      return messages.map((m) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Save messages for a conversation
   */
  saveMessages(conversationId: string, messages: Message[]): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    const allMessages: Record<string, Message[]> = stored
      ? JSON.parse(stored)
      : {};

    allMessages[conversationId] = messages;

    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
  },

  /**
   * Delete messages for a conversation
   */
  deleteMessages(conversationId: string): void {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    if (!stored) return;

    const allMessages: Record<string, Message[]> = JSON.parse(stored);
    delete allMessages[conversationId];
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(allMessages));
  },
};

export { ApiError, TimeoutError };
