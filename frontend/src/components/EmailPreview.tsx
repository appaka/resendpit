import { useState, useMemo } from 'react';
import type { Email } from '../lib/types';
import { getHtmlSizeInfo, extractLinks } from '../lib/utils';
import { EmptyState } from './EmptyState';

interface EmailPreviewProps {
  email: Email | null;
}

type ViewMode = 'html' | 'text';
type ViewportSize = 'mobile' | 'tablet' | 'desktop' | 'full';

const VIEWPORT_SIZES: Record<ViewportSize, { width: string; label: string }> = {
  mobile: { width: '375px', label: 'Mobile' },
  tablet: { width: '768px', label: 'Tablet' },
  desktop: { width: '1024px', label: 'Desktop' },
  full: { width: '100%', label: 'Full' },
};

export function EmailPreview({ email }: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('html');
  const [viewportSize, setViewportSize] = useState<ViewportSize>('full');
  const [showLinks, setShowLinks] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const html = email?.html;
  const sizeInfo = useMemo(
    () => (html ? getHtmlSizeInfo(html) : null),
    [html]
  );

  const links = useMemo(
    () => (html ? extractLinks(html) : []),
    [html]
  );

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedLink(text);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  if (!email) {
    return <EmptyState type="no-selection" />;
  }

  const hasHtml = Boolean(email.html);
  const hasText = Boolean(email.text);
  const hasBothViews = hasHtml && hasText;

  return (
    <div className="flex h-full flex-col">
      {/* Email metadata header */}
      <div className="border-b border-zinc-800 p-4">
        <h1 className="mb-3 text-xl font-semibold text-zinc-100">{email.subject}</h1>
        <div className="space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="w-12 text-zinc-500">Via:</span>
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${
                email.provider === 'ses'
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-blue-500/20 text-blue-400'
              }`}
            >
              {email.provider === 'ses' ? 'Amazon SES' : 'Resend'}
            </span>
          </div>
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-800 px-4 py-2">
        {/* View mode toggle */}
        {hasBothViews && (
          <div className="flex">
            <button
              onClick={() => setViewMode('html')}
              className={`px-3 py-1 text-xs transition-colors ${
                viewMode === 'html'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              } rounded-l`}
            >
              HTML
            </button>
            <button
              onClick={() => setViewMode('text')}
              className={`px-3 py-1 text-xs transition-colors ${
                viewMode === 'text'
                  ? 'bg-zinc-700 text-zinc-100'
                  : 'text-zinc-500 hover:text-zinc-300'
              } rounded-r`}
            >
              Text
            </button>
          </div>
        )}

        {/* Viewport size buttons */}
        {hasHtml && viewMode === 'html' && (
          <>
            <div className="h-4 w-px bg-zinc-700" />
            <div className="flex gap-1">
              {(Object.keys(VIEWPORT_SIZES) as ViewportSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setViewportSize(size)}
                  className={`px-2 py-1 text-xs transition-colors rounded ${
                    viewportSize === size
                      ? 'bg-zinc-700 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title={`${VIEWPORT_SIZES[size].label} (${VIEWPORT_SIZES[size].width})`}
                >
                  {VIEWPORT_SIZES[size].label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Size badge */}
        {sizeInfo && hasHtml && (
          <>
            <div className="h-4 w-px bg-zinc-700" />
            <span
              className={`rounded px-2 py-1 text-xs ${
                sizeInfo.exceedsGmail
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
              title={sizeInfo.exceedsGmail ? 'Exceeds Gmail 102 KB limit' : 'HTML size'}
            >
              {sizeInfo.formatted}
              {sizeInfo.exceedsGmail && ' (!)'}
            </span>
          </>
        )}

        {/* Links button */}
        {links.length > 0 && (
          <>
            <div className="h-4 w-px bg-zinc-700" />
            <button
              onClick={() => setShowLinks(!showLinks)}
              className={`rounded px-2 py-1 text-xs transition-colors ${
                showLinks
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-300'
              }`}
            >
              Links ({links.length})
            </button>
          </>
        )}
      </div>

      {/* Gmail warning */}
      {sizeInfo?.exceedsGmail && (
        <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-400">
          This email exceeds Gmail's 102 KB limit and may be clipped for recipients.
        </div>
      )}

      {/* Content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Preview container */}
        <div className="flex-1 overflow-auto bg-zinc-900">
          <div
            className={`mx-auto h-full transition-all duration-200 ${
              viewportSize !== 'full' ? 'shadow-lg' : ''
            }`}
            style={{
              width: viewMode === 'html' ? VIEWPORT_SIZES[viewportSize].width : '100%',
              maxWidth: '100%',
            }}
          >
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

        {/* Links panel */}
        {showLinks && links.length > 0 && (
          <div className="w-72 shrink-0 overflow-y-auto border-l border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-3 py-2">
              <h3 className="text-sm font-medium text-zinc-300">
                Links ({links.length})
              </h3>
            </div>
            <div className="divide-y divide-zinc-800">
              {links.map((link, i) => (
                <div key={i} className="p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] ${
                        link.isExternal
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-zinc-700 text-zinc-400'
                      }`}
                    >
                      {link.isExternal ? 'EXT' : 'INT'}
                    </span>
                    <span className="truncate text-sm text-zinc-300" title={link.text}>
                      {link.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 truncate text-xs text-zinc-500 hover:text-zinc-300"
                      title={link.href}
                    >
                      {link.href}
                    </a>
                    <button
                      onClick={() => copyToClipboard(link.href)}
                      className="shrink-0 rounded px-1.5 py-0.5 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                      title="Copy URL"
                    >
                      {copiedLink === link.href ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
