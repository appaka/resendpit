export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export const GMAIL_SIZE_LIMIT = 102 * 1024; // 102 KB

export interface HtmlSizeInfo {
  bytes: number;
  formatted: string;
  exceedsGmail: boolean;
}

export function getHtmlSizeInfo(html: string): HtmlSizeInfo {
  const bytes = new Blob([html]).size;
  return {
    bytes,
    formatted: bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`,
    exceedsGmail: bytes > GMAIL_SIZE_LIMIT,
  };
}

export interface ExtractedLink {
  href: string;
  text: string;
  isExternal: boolean;
}

export function extractLinks(html: string): ExtractedLink[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const links = doc.querySelectorAll('a[href]');

  return Array.from(links).map((link) => ({
    href: link.getAttribute('href') || '',
    text: link.textContent?.trim() || link.getAttribute('href') || '',
    isExternal: (link.getAttribute('href') || '').startsWith('http'),
  }));
}
