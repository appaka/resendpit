'use client';

import type { Email } from '@/lib/types';
import { EmailItem } from './email-item';
import { EmptyState } from './empty-state';

interface EmailListProps {
  emails: Email[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onClear: () => void;
}

export function EmailList({ emails, selectedId, onSelect, onClear }: EmailListProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <h2 className="font-semibold text-zinc-200">
          Emails <span className="text-zinc-500">({emails.length})</span>
        </h2>
        {emails.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {emails.length === 0 ? (
          <div className="p-4">
            <EmptyState type="no-emails" />
          </div>
        ) : (
          emails.map((email) => (
            <EmailItem
              key={email.id}
              email={email}
              selected={email.id === selectedId}
              onClick={() => onSelect(email.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
