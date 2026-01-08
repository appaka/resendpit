export function ConnectionBadge({ connected }: { connected: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full ${
          connected ? 'bg-green-500' : 'bg-red-500 animate-pulse'
        }`}
      />
      <span className="text-xs text-zinc-500">
        {connected ? 'Connected' : 'Reconnecting...'}
      </span>
    </div>
  );
}
