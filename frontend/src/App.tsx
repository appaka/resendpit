import { useEffect, useState, useCallback } from 'react';
import type { Email, SSEMessage } from './lib/types';
import { ConnectionBadge } from './components/ConnectionBadge';
import { EmailList } from './components/EmailList';
import { EmailPreview } from './components/EmailPreview';

export default function App() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      setConnected(true);
    };

    eventSource.onerror = () => {
      setConnected(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data: SSEMessage = JSON.parse(event.data);

        switch (data.type) {
          case 'init':
            setEmails(data.emails ?? []);
            break;
          case 'new-email':
            if (data.email) {
              setEmails((prev) => [data.email!, ...prev].slice(0, 50));
            }
            break;
          case 'clear':
            setEmails([]);
            setSelectedId(null);
            break;
        }
      } catch (e) {
        console.error('Failed to parse SSE message:', e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleClear = useCallback(async () => {
    try {
      await fetch('/api/emails', { method: 'DELETE' });
    } catch (e) {
      console.error('Failed to clear emails:', e);
    }
  }, []);

  const selectedEmail = emails.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col bg-zinc-950">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-zinc-100">Resend-Pit</h1>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            dev
          </span>
        </div>
        <ConnectionBadge connected={connected} />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-80 shrink-0 border-r border-zinc-800 bg-zinc-900">
          <EmailList
            emails={emails}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onClear={handleClear}
          />
        </aside>
        <main className="flex-1 bg-zinc-950">
          <EmailPreview email={selectedEmail} />
        </main>
      </div>
      <footer className="border-t border-zinc-800 px-4 py-2 text-center text-xs text-zinc-500">
        <span>© 2026 </span>
        <a
          href="https://javierperez.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          Javier Pérez
        </a>
        <span className="mx-2">·</span>
        <a
          href="https://github.com/appaka/resendpit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          GitHub
        </a>
        <span className="mx-2">·</span>
        <a
          href="https://paypal.me/javierperezcom"
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-400 hover:text-zinc-300 transition-colors"
        >
          Donate
        </a>
        <span className="mx-2">·</span>
        <span>made in 🇨🇭 with ❤️</span>
      </footer>
    </div>
  );
}
