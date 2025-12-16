'use client';

import { useMemo, useState } from 'react';

import {
  Archive,
  ArchiveRestore,
  Check,
  FileText,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import { Button } from '@kit/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Input } from '@kit/ui/input';
import { cn } from '@kit/ui/utils';

import type { Conversation } from '../_lib/types';

interface ConversationHistoryProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onArchiveConversation?: (id: string) => void;
  onNewConversation: () => void;
}

export function ConversationHistory({
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  onArchiveConversation,
  onNewConversation,
}: ConversationHistoryProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = (id: string) => {
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  // Filter and group conversations
  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Filter by archive status
    filtered = filtered.filter((conv) =>
      showArchived ? conv.archived : !conv.archived,
    );

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (conv) =>
          conv.title.toLowerCase().includes(query) ||
          conv.lastMessage?.toLowerCase().includes(query),
      );
    }

    return filtered;
  }, [conversations, searchQuery, showArchived]);

  // Group conversations by date
  const grouped = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
      today: [] as Conversation[],
      yesterday: [] as Conversation[],
      lastWeek: [] as Conversation[],
      older: [] as Conversation[],
    };

    filteredConversations.forEach((conv) => {
      const date = new Date(conv.updated_at);
      if (date.toDateString() === today.toDateString()) {
        groups.today.push(conv);
      } else if (date.toDateString() === yesterday.toDateString()) {
        groups.yesterday.push(conv);
      } else if (date > lastWeek) {
        groups.lastWeek.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    return groups;
  }, [filteredConversations]);

  const archivedCount = conversations.filter((c) => c.archived).length;

  const renderConversation = (conv: Conversation) => {
    const isActive = conv.id === activeConversationId;
    const isEditing = editingId === conv.id;

    return (
      <div
        key={conv.id}
        className={cn(
          'group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          isActive
            ? 'bg-primary/10 text-primary'
            : 'hover:bg-muted text-muted-foreground hover:text-foreground',
        )}
      >
        {isEditing ? (
          <div className="flex flex-1 items-center gap-1">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="h-7 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveEdit(conv.id);
                if (e.key === 'Escape') handleCancelEdit();
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => handleSaveEdit(conv.id)}
            >
              <Check className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCancelEdit}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <button
              onClick={() => onSelectConversation(conv.id)}
              className="flex min-w-0 flex-1 items-center gap-2 text-left"
            >
              {conv.status === 'processing' ? (
                <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="truncate">{conv.title}</span>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStartEdit(conv)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                {onArchiveConversation && (
                  <DropdownMenuItem
                    onClick={() => onArchiveConversation(conv.id)}
                  >
                    {conv.archived ? (
                      <>
                        <ArchiveRestore className="mr-2 h-4 w-4" />
                        Unarchive
                      </>
                    ) : (
                      <>
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDeleteConversation(conv.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    );
  };

  const renderGroup = (title: string, convs: Conversation[]) => {
    if (convs.length === 0) return null;
    return (
      <div className="space-y-1">
        <div className="text-muted-foreground px-3 py-2 text-xs font-medium">
          {title}
        </div>
        {convs.map(renderConversation)}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col">
      {/* New Report Button */}
      <div className="p-3">
        <Button
          onClick={onNewConversation}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Plus className="h-4 w-4" />
          New Report
        </Button>
      </div>

      {/* Search Input */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="Search reports..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Archive Toggle */}
      {archivedCount > 0 && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              'text-muted-foreground hover:text-foreground flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
              showArchived && 'bg-muted text-foreground',
            )}
          >
            <Archive className="h-3.5 w-3.5" />
            {showArchived ? 'Show active' : `Archived (${archivedCount})`}
          </button>
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {filteredConversations.length === 0 ? (
          <div className="text-muted-foreground px-3 py-8 text-center text-sm">
            {searchQuery ? (
              <>
                No results for &quot;{searchQuery}&quot;
                <br />
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-primary mt-2 underline"
                >
                  Clear search
                </button>
              </>
            ) : showArchived ? (
              <>No archived reports.</>
            ) : (
              <>
                No previous reports.
                <br />
                Create a new one above.
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {renderGroup('Today', grouped.today)}
            {renderGroup('Yesterday', grouped.yesterday)}
            {renderGroup('Previous 7 Days', grouped.lastWeek)}
            {renderGroup('Older', grouped.older)}
          </div>
        )}
      </div>
    </div>
  );
}
