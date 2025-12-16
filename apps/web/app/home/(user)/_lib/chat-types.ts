'use client';

/**
 * Chat message types and converters for the report chat feature.
 * Provides type-safe conversion between client-side Date objects and
 * ISO string timestamps for database storage.
 */

// ============================================================================
// Types
// ============================================================================

export type ChatRole = 'user' | 'assistant';

/**
 * Client-side chat message with Date objects for timestamps.
 * Used in React components for display and manipulation.
 */
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

/**
 * Data Transfer Object for chat messages.
 * Used for database storage and API communication.
 * Timestamps are ISO 8601 strings.
 */
export interface ChatMessageDTO {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

// ============================================================================
// Converters
// ============================================================================

/**
 * Converts a client-side ChatMessage to a DTO for storage/transmission.
 */
export function toChatMessageDTO(message: ChatMessage): ChatMessageDTO {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    timestamp: message.timestamp.toISOString(),
  };
}

/**
 * Converts a DTO from storage/API to a client-side ChatMessage.
 */
export function fromChatMessageDTO(dto: ChatMessageDTO): ChatMessage {
  return {
    id: dto.id,
    role: dto.role,
    content: dto.content,
    timestamp: new Date(dto.timestamp),
  };
}

/**
 * Converts an array of ChatMessages to DTOs.
 */
export function toChatMessageDTOArray(
  messages: ChatMessage[],
): ChatMessageDTO[] {
  return messages.map(toChatMessageDTO);
}

/**
 * Converts an array of DTOs to ChatMessages.
 */
export function fromChatMessageDTOArray(dtos: ChatMessageDTO[]): ChatMessage[] {
  return dtos.map(fromChatMessageDTO);
}

/**
 * Type guard to validate if a value is a valid ChatMessageDTO.
 */
export function isChatMessageDTO(value: unknown): value is ChatMessageDTO {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;
  return (
    typeof obj.id === 'string' &&
    (obj.role === 'user' || obj.role === 'assistant') &&
    typeof obj.content === 'string' &&
    typeof obj.timestamp === 'string'
  );
}

/**
 * Validates and converts an array of unknown values to ChatMessageDTOs.
 * Filters out invalid entries.
 */
export function validateChatHistory(data: unknown[]): ChatMessageDTO[] {
  return data.filter(isChatMessageDTO);
}
