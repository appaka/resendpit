export interface Email {
  id: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  attachments?: Array<{ filename: string; size?: number }>;
  createdAt: string;
}

export interface SSEMessage {
  type: 'init' | 'new-email' | 'clear';
  emails?: Email[];
  email?: Email;
}
