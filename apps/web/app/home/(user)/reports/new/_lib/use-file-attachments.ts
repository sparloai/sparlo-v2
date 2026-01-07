'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Shared file attachment handling for analysis forms.
 * Handles file selection, validation, base64 conversion, and cleanup.
 */

export interface Attachment {
  id: string;
  file: File;
  preview: string;
  base64?: string;
}

interface UseFileAttachmentsConfig {
  maxAttachments?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
}

interface UseFileAttachmentsResult {
  attachments: Attachment[];
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
  error: string | null;
  clearError: () => void;
}

const DEFAULT_MAX_ATTACHMENTS = 5;
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

export function useFileAttachments(
  config: UseFileAttachmentsConfig = {},
): UseFileAttachmentsResult {
  const {
    maxAttachments = DEFAULT_MAX_ATTACHMENTS,
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES,
  } = config;

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on unmount or when attachments change
  useEffect(() => {
    return () => {
      attachments.forEach((a) => URL.revokeObjectURL(a.preview));
    };
  }, [attachments]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files) return;

      const newAttachments: Attachment[] = [];

      for (const file of Array.from(files)) {
        if (attachments.length + newAttachments.length >= maxAttachments) {
          setError(`Maximum ${maxAttachments} attachments allowed`);
          break;
        }

        if (!allowedTypes.includes(file.type)) {
          setError(`File type ${file.type} not supported.`);
          continue;
        }

        if (file.size > maxFileSize) {
          setError(
            `File ${file.name} exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`,
          );
          continue;
        }

        // Convert to base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1] || '');
          };
          reader.readAsDataURL(file);
        });

        newAttachments.push({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          base64,
        });
      }

      setAttachments((prev) => [...prev, ...newAttachments]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [attachments.length, maxAttachments, maxFileSize, allowedTypes],
  );

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment) URL.revokeObjectURL(attachment.preview);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      prev.forEach((a) => URL.revokeObjectURL(a.preview));
      return [];
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    attachments,
    fileInputRef,
    handleFileSelect,
    removeAttachment,
    clearAttachments,
    error,
    clearError,
  };
}
