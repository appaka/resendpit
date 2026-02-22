import type { Email } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';

interface EmailItemProps {
  email: Email;
  selected: boolean;
  onClick: () => void;
}

export function EmailItem({ email, selected, onClick }: EmailItemProps) {
  const fromName = email.from.includes('<')
    ? email.from.split('<')[0].trim()
    : email.from;

  return (
    <button
      onClick={onClick}
      className={`w-full border-b border-zinc-800 p-3 text-left transition-colors hover:bg-zinc-800/50 ${
        selected ? 'bg-zinc-800' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-sm font-medium text-zinc-200">{fromName}</span>
          <span
            className={`shrink-0 rounded px-1 py-0.5 text-[10px] font-medium leading-none ${
              email.provider === 'ses'
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}
          >
            {email.provider === 'ses' ? 'SES' : 'Resend'}
          </span>
        </div>
        <span className="shrink-0 text-xs text-zinc-500">
          {formatRelativeTime(email.createdAt)}
        </span>
      </div>
      <div className="mt-1 truncate text-sm text-zinc-400">{email.subject}</div>
      <div className="mt-1 truncate text-xs text-zinc-500">
        To: {email.to.join(', ')}
      </div>
    </button>
  );
}
