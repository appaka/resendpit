# Resend-Pit

A local email interceptor for the [Resend](https://resend.com) and [Amazon SES](https://aws.amazon.com/ses/) SDKs. Capture and preview emails during development without sending them to real recipients.

## Features

- **Multi-provider** - Intercepts both Resend and Amazon SES emails
- **Drop-in replacement** - Just set one environment variable
- **Real-time dashboard** - See emails instantly via Server-Sent Events
- **Full API compatibility** - Works with any Resend SDK or AWS SES SDK
- **React Email support** - Renders HTML emails beautifully
- **Zero configuration** - Works out of the box
- **Docker ready** - Single container deployment (~7 MB image)
- **Minimal footprint** - ~5-10 MB RAM usage

## Screenshots

See [UI.md](UI.md) for screenshots of the dashboard.

## Quick Start

### Docker (Recommended)

```bash
docker run -p 3000:3000 appaka/resendpit
```

### From Source

```bash
git clone https://github.com/appaka/resendpit.git
cd resendpit

# Build frontend
cd frontend && pnpm install && pnpm build && cd ..

# Run backend
cd backend && go run .
```

Or use the Makefile:

```bash
make build
make dev
```

Then open http://localhost:3000 to view the dashboard.

## Integration

### Resend SDK

Point your Resend SDK to Resend-Pit by setting the `RESEND_BASE_URL` environment variable:

```bash
RESEND_BASE_URL=http://localhost:3000
RESEND_API_KEY=re_anything  # Any value works, it's ignored
```

```javascript
import { Resend } from 'resend';

const resend = new Resend('re_123456789');

await resend.emails.send({
  from: 'you@example.com',
  to: 'user@example.com',
  subject: 'Hello World',
  html: '<h1>Welcome!</h1>',
});
// Email captured by Resend-Pit instead of being sent
```

### Amazon SES SDK

Point your AWS SES SDK to Resend-Pit using the endpoint override:

```bash
AWS_ENDPOINT_URL_SES=http://localhost:3000
```

Works with any AWS SDK — Node.js, Python (boto3), Go, etc:

```javascript
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

const client = new SESv2Client({
  endpoint: 'http://localhost:3000',
  region: 'us-east-1',
  credentials: { accessKeyId: 'test', secretAccessKey: 'test' },
});

await client.send(new SendEmailCommand({
  FromEmailAddress: 'you@example.com',
  Destination: { ToAddresses: ['user@example.com'] },
  Content: { Simple: {
    Subject: { Data: 'Hello World' },
    Body: { Html: { Data: '<h1>Welcome!</h1>' } },
  }},
}));
// Email captured by Resend-Pit instead of being sent
```

```python
import boto3

client = boto3.client('ses',
    endpoint_url='http://localhost:3000',
    region_name='us-east-1',
    aws_access_key_id='test',
    aws_secret_access_key='test',
)

client.send_email(
    Source='you@example.com',
    Destination={'ToAddresses': ['user@example.com']},
    Message={
        'Subject': {'Data': 'Hello World'},
        'Body': {'Html': {'Data': '<h1>Welcome!</h1>'}},
    },
)
```

### Docker Compose

```yaml
services:
  app:
    build: .
    environment:
      - RESEND_BASE_URL=http://resendpit:3000     # For Resend SDK
      - AWS_ENDPOINT_URL_SES=http://resendpit:3000 # For AWS SES SDK
    depends_on:
      - resendpit

  resendpit:
    image: appaka/resendpit
    ports:
      - "3000:3000"
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `RESENDPIT_MAX_EMAILS` | `50` | Maximum emails to store (FIFO) |

### Examples

```bash
# Custom port
docker run -p 8080:8080 -e PORT=8080 appaka/resendpit

# Store more emails
docker run -p 3000:3000 -e RESENDPIT_MAX_EMAILS=200 appaka/resendpit
```

## API Reference

### POST /emails

Create an email (Resend SDK endpoint).

```bash
curl -X POST http://localhost:3000/emails \
  -H "Content-Type: application/json" \
  -d '{
    "from": "sender@example.com",
    "to": ["recipient@example.com"],
    "subject": "Test Email",
    "html": "<h1>Hello</h1>"
  }'
```

**Response:**
```json
{ "id": "550e8400-e29b-41d4-a716-446655440000" }
```

### POST /v2/email/outbound-emails

Create an email (SES v2 endpoint).

```bash
curl -X POST http://localhost:3000/v2/email/outbound-emails \
  -H "Content-Type: application/json" \
  -d '{
    "FromEmailAddress": "sender@example.com",
    "Destination": { "ToAddresses": ["recipient@example.com"] },
    "Content": { "Simple": {
      "Subject": { "Data": "Test Email" },
      "Body": { "Html": { "Data": "<h1>Hello</h1>" } }
    }}
  }'
```

**Response:**
```json
{ "MessageId": "550e8400-e29b-41d4-a716-446655440000" }
```

### POST / (SES v1)

Create an email (SES v1 form-encoded endpoint).

```bash
curl -X POST http://localhost:3000/ \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'Action=SendEmail&Source=sender@example.com&Destination.ToAddresses.member.1=recipient@example.com&Message.Subject.Data=Test&Message.Body.Html.Data=%3Ch1%3EHello%3C%2Fh1%3E'
```

**Response:** XML with `<SendEmailResponse>` containing `<MessageId>`.

### GET /api/emails

List all stored emails.

```bash
curl http://localhost:3000/api/emails
```

### DELETE /api/emails

Clear all stored emails.

```bash
curl -X DELETE http://localhost:3000/api/emails
```

### GET /api/health

Health check endpoint.

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "emails": 5,
  "maxEmails": 50,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GET /api/events

Server-Sent Events stream for real-time updates.

**Events:**
- `init` - Initial state with all current emails
- `new-email` - New email received
- `clear` - All emails cleared

## Supported Email Fields

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Sender email (required) |
| `to` | string \| string[] | Recipient(s) (required) |
| `subject` | string | Email subject (required) |
| `html` | string | HTML content |
| `text` | string | Plain text content |
| `cc` | string \| string[] | CC recipients |
| `bcc` | string \| string[] | BCC recipients |
| `reply_to` | string | Reply-to address |
| `tags` | array | Email tags `[{name, value}]` |
| `attachments` | array | Attachment metadata |

## Architecture

```
resendpit/
├── backend/              # Go backend (net/http)
│   ├── main.go           # HTTP server + static files
│   ├── handlers/         # API handlers
│   ├── store/            # In-memory store
│   └── types/            # Go structs
├── frontend/             # React frontend (Vite)
│   ├── src/
│   │   ├── App.tsx       # Dashboard
│   │   └── components/   # UI components
│   └── package.json
├── Dockerfile            # Multi-stage build
└── Makefile              # Build commands
```

## How It Works

```
┌─────────────────┐     POST /emails      ┌──────────────────┐
│   Your App      │ ────────────────────► │   Resend-Pit     │
│ (Resend or SES) │                       │   (Go backend)   │
└─────────────────┘                       └────────┬─────────┘
                                                   │
                                                   ▼
                                         ┌──────────────────┐
                                         │  In-Memory Store │
                                         │   (FIFO Queue)   │
                                         └────────┬─────────┘
                                                  │ SSE
                                                  ▼
┌─────────────────┐     Real-time         ┌──────────────────┐
│    Dashboard    │ ◄──────────────────── │   SSE Stream     │
│    (React)      │                       │                  │
└─────────────────┘                       └──────────────────┘
```

1. Your app sends emails via Resend SDK or AWS SES SDK
2. SDK calls Resend-Pit instead of the real API
3. Resend-Pit stores the email and returns a fake ID
4. Dashboard receives real-time updates via SSE

## Limitations

- **No persistence** - Emails are stored in memory and lost on restart
- **No actual sending** - Emails are captured, not forwarded
- **Development only** - Not intended for production use

## Alternatives

- [Mailpit](https://github.com/axllent/mailpit) - SMTP-based email testing
- [Mailtrap](https://mailtrap.io) - Cloud-based email testing

Resend-Pit intercepts API calls from Resend and SES SDKs directly — no SMTP configuration needed.

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

```bash
# Development (concurrent frontend + backend)
make dev

# Build frontend and backend
make build

# Docker build
make docker

# Test endpoints
make test
```
