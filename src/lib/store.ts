import { EventEmitter } from 'events';
import type { Email } from './types';

export const MAX_EMAILS = parseInt(process.env.RESENDPIT_MAX_EMAILS || '50', 10);

const globalForStore = globalThis as unknown as {
  __resendpit_store?: Email[];
  __resendpit_emitter?: EventEmitter;
};

globalForStore.__resendpit_store ??= [];
globalForStore.__resendpit_emitter ??= new EventEmitter();
globalForStore.__resendpit_emitter.setMaxListeners(100);

export const emailStore = globalForStore.__resendpit_store;
export const emailEmitter = globalForStore.__resendpit_emitter;

export function addEmail(email: Email): void {
  emailStore.unshift(email);
  if (emailStore.length > MAX_EMAILS) {
    emailStore.pop();
  }
  emailEmitter.emit('new-email', email);
}

export function getEmails(): Email[] {
  return [...emailStore];
}

export function clearEmails(): void {
  emailStore.length = 0;
  emailEmitter.emit('emails-cleared');
}

export function getEmailCount(): number {
  return emailStore.length;
}
