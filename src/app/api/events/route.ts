import { emailEmitter, getEmails } from '@/lib/store';
import type { Email, SSEMessage } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let isClosed = false;
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (message: SSEMessage) => {
        if (isClosed) return;
        try {
          const data = `data: ${JSON.stringify(message)}\n\n`;
          controller.enqueue(encoder.encode(data));
        } catch {
          isClosed = true;
          cleanup?.();
        }
      };

      const initialMessage: SSEMessage = { type: 'init', emails: getEmails() };
      sendEvent(initialMessage);

      const onNewEmail = (email: Email) => {
        sendEvent({ type: 'new-email', email });
      };

      const onClear = () => {
        sendEvent({ type: 'clear' });
      };

      emailEmitter.on('new-email', onNewEmail);
      emailEmitter.on('emails-cleared', onClear);

      const keepalive = setInterval(() => {
        if (isClosed) {
          clearInterval(keepalive);
          return;
        }
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          isClosed = true;
          cleanup?.();
        }
      }, 30000);

      cleanup = () => {
        if (isClosed) return;
        isClosed = true;
        emailEmitter.off('new-email', onNewEmail);
        emailEmitter.off('emails-cleared', onClear);
        clearInterval(keepalive);
      };
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
