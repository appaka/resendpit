'use client';

import { useState } from 'react';
import type { Email } from '@/lib/types';
import { EmptyState } from './empty-state';

interface EmailPreviewProps {
  email: Email | null;
}

type ViewMode = 'html' | 'text';

export function EmailPreview({ email }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('html');

  if (!email) {
    return <EmptyState type="no-selection" />;
  }

  const hasHtml = Boolean(email.html);
  const hasText = Boolean(email.text);
  const hasBothViews = hasHtml && hasText;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-zinc-800 p-4">
        <h1 className="mb-3 text-xl font-semibold text-zinc-100">{email.subject}</h1>
        <div className="space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="w-12 text-zinc-500">From:</span>
            <span className="text-zinc-300">{email.from}</span>
          </div>
          <div className="flex gap-2">
            <span className="w-12 text-zinc-500">To:</span>
            <span className="text-zinc-300">{email.to.join(', ')}</span>
          </div>
          {email.cc && email.cc.length > 0 && (
            <div className="flex gap-2">
              <span className="w-12 text-zinc-500">CC:</span>
              <span className="text-zinc-300">{email.cc.join(', ')}</span>
            </div>
          )}
          {email.bcc && email.bcc.length > 0 && (
            <div className="flex gap-2">
              <span className="w-12 text-zinc-500">BCC:</span>
              <span className="text-zinc-300">{email.bcc.join(', ')}</span>
            </div>
          )}
          {email.replyTo && (
            <div className="flex gap-2">
              <span className="w-12 text-zinc-500">Reply:</span>
              <span className="text-zinc-300">{email.replyTo}</span>
            </div>
          )}
          <div className="flex gap-2">
            <span className="w-12 text-zinc-500">Date:</span>
            <span className="text-zinc-300">
              {new Date(email.createdAt).toLocaleString()}
            </span>
          </div>
        </div>
        {email.tags && email.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {email.tags.map((tag, i) => (
              <span
                key={i}
                className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400"
              >
                {tag.name}: {tag.value}
              </span>
            ))}
          </div>
        )}
        {email.attachments && email.attachments.length > 0 && (
          <div className="mt-3">
            <span className="text-xs text-zinc-500">
              {email.attachments.length} attachment(s):{' '}
              {email.attachments.map((a) => a.filename).join(', ')}
            </span>
          </div>
        )}
      </div>

      {hasBothViews && (
        <div className="flex border-b border-zinc-800">
          <button
            onClick={() => setViewMode('html')}
            className={`px-4 py-2 text-sm transition-colors ${
              viewMode === 'html'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            HTML
          </button>
          <button
            onClick={() => setViewMode('text')}
            className={`px-4 py-2 text-sm transition-colors ${
              viewMode === 'text'
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Text
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {viewMode === 'html' && hasHtml ? (
          <iframe
            srcDoc={email.html}
            sandbox="allow-same-origin"
            className="h-full w-full border-0 bg-white"
            title="Email preview"
          />
        ) : hasText ? (
          <pre className="h-full overflow-auto whitespace-pre-wrap p-4 font-mono text-sm text-zinc-300">
            {email.text}
          </pre>
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-500">
            No content available
          </div>
        )}
      </div>
    </div>
  );
}
