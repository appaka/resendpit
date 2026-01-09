import type { ResendEmailRequest, ValidationError } from './types';

export function normalizeToArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function validateResendRequest(
  body: unknown
): { valid: true; data: ResendEmailRequest } | { valid: false; error: ValidationError } {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: {
        statusCode: 422,
        message: 'Request body must be a valid JSON object.',
        name: 'validation_error',
      },
    };
  }

  const data = body as Record<string, unknown>;

  if (!data.from || typeof data.from !== 'string') {
    return {
      valid: false,
      error: {
        statusCode: 422,
        message: 'The `from` field is required.',
        name: 'validation_error',
      },
    };
  }

  if (!data.to) {
    return {
      valid: false,
      error: {
        statusCode: 422,
        message: 'The `to` field is required.',
        name: 'validation_error',
      },
    };
  }

  if (!data.subject || typeof data.subject !== 'string') {
    return {
      valid: false,
      error: {
        statusCode: 422,
        message: 'The `subject` field is required.',
        name: 'validation_error',
      },
    };
  }

  return { valid: true, data: data as unknown as ResendEmailRequest };
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

// Gmail size limit (102 KB)
export const GMAIL_SIZE_LIMIT = 102 * 1024;

export interface HtmlSizeInfo {
  bytes: number;
  formatted: string;
  exceedsGmail: boolean;
}

export function getHtmlSizeInfo(html: string): HtmlSizeInfo {
  const bytes = new Blob([html]).size;
  const formatted = bytes < 1024
    ? `${bytes} B`
    : `${(bytes / 1024).toFixed(1)} KB`;

  return {
    bytes,
    formatted,
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
  const anchors = doc.querySelectorAll('a[href]');

  return Array.from(anchors).map((a) => ({
    href: a.getAttribute('href') || '',
    text: a.textContent?.trim() || a.getAttribute('href') || '',
    isExternal: a.getAttribute('href')?.startsWith('http') || false,
  }));
}
