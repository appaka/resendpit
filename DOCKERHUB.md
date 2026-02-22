# Resend-Pit

Local email interceptor for [Resend](https://resend.com) and [Amazon SES](https://aws.amazon.com/ses/) SDKs. Capture and preview emails during development without sending them to real recipients.

https://github.com/appaka/resendpit

## Quick Start

```bash
docker run -p 3000:3000 appaka/resendpit
```

Then open http://localhost:3000 to view the dashboard.

## Integration

Point your SDK to Resend-Pit:

```bash
# Resend SDK
RESEND_BASE_URL=http://localhost:3000

# AWS SES SDK
AWS_ENDPOINT_URL_SES=http://localhost:3000
```

### Docker Compose

```yaml
services:
  app:
    build: .
    environment:
      - RESEND_BASE_URL=http://resendpit:3000
      - AWS_ENDPOINT_URL_SES=http://resendpit:3000
    depends_on:
      - resendpit

  resendpit:
    image: appaka/resendpit
    ports:
      - "3000:3000"
```

## Features

- **Multi-provider** — Intercepts both Resend and Amazon SES emails
- **Real-time dashboard** — See emails instantly via SSE
- **Full API compatibility** — Works with any Resend SDK or AWS SES SDK (v1 + v2)
- **Zero configuration** — Works out of the box
- **Tiny image** — ~7 MB, scratch-based, zero CVEs
- **Multi-arch** — linux/amd64 and linux/arm64

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `RESENDPIT_MAX_EMAILS` | `50` | Max emails stored (FIFO) |
