import { addEmail } from '@/lib/store';
import type { Email } from '@/lib/types';
import { normalizeToArray, validateResendRequest } from '@/lib/utils';

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      {
        statusCode: 422,
        message: 'Invalid JSON in request body.',
        name: 'validation_error',
      },
      { status: 422 }
    );
  }

  const validation = validateResendRequest(body);

  if (!validation.valid) {
    return Response.json(validation.error, { status: validation.error.statusCode });
  }

  const { data } = validation;
  const id = crypto.randomUUID();

  const email: Email = {
    id,
    from: data.from,
    to: normalizeToArray(data.to),
    cc: normalizeToArray(data.cc),
    bcc: normalizeToArray(data.bcc),
    subject: data.subject,
    html: data.html,
    text: data.text,
    replyTo: data.reply_to,
    headers: data.headers,
    tags: data.tags,
    attachments: data.attachments?.map((a) => ({
      filename: a.filename,
      size: a.content ? Math.round((a.content.length * 3) / 4) : undefined,
    })),
    createdAt: new Date().toISOString(),
  };

  addEmail(email);

  return Response.json({ id });
}
