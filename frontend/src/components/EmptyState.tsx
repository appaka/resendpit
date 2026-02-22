export function EmptyState({ type }: { type: 'no-emails' | 'no-selection' }) {
  if (type === 'no-emails') {
    return (
      <div className="flex h-full flex-col items-center justify-center text-zinc-500">
        <svg
          className="mb-4 h-16 w-16 text-zinc-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
        <h3 className="mb-2 text-lg font-medium text-zinc-400">No emails yet</h3>
        <p className="max-w-xs text-center text-sm text-zinc-500">
          Send an email using the Resend SDK or AWS SES SDK with the endpoint pointing here
        </p>
        <div className="mt-4 space-y-2 text-center">
          <code className="block rounded bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-400">
            RESEND_BASE_URL=http://localhost:3000
          </code>
          <code className="block rounded bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-400">
            AWS_ENDPOINT_URL_SES=http://localhost:3000
          </code>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center text-zinc-500">
      <svg
        className="mb-4 h-16 w-16 text-zinc-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
      <h3 className="text-lg font-medium text-zinc-400">Select an email</h3>
      <p className="text-sm text-zinc-500">Choose an email from the list to preview</p>
    </div>
  );
}
