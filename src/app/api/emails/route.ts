import { clearEmails, getEmails } from '@/lib/store';

export async function GET() {
  return Response.json({ emails: getEmails() });
}

export async function DELETE() {
  clearEmails();
  return Response.json({ success: true });
}
