import { getEmailCount, MAX_EMAILS } from '@/lib/store';

export async function GET() {
  return Response.json({
    status: 'ok',
    emails: getEmailCount(),
    maxEmails: MAX_EMAILS,
    timestamp: new Date().toISOString(),
  });
}
