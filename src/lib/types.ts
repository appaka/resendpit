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

export interface ResendEmailRequest {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  reply_to?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  attachments?: Array<{ filename: string; content?: string }>;
}

export interface SSEMessage {
  type: 'init' | 'new-email' | 'clear';
  emails?: Email[];
  email?: Email;
}

export interface ValidationError {
  statusCode: number;
  message: string;
  name: string;
}
