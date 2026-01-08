# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Resend-Pit** is a local development tool that intercepts emails sent via the Resend SDK. It acts as a proxy that captures outgoing API calls, stores them in memory, and displays them in a real-time web dashboard. This is an API-based alternative to SMTP tools like Mailpit.

## Tech Stack

- **Framework:** Next.js 16+ with App Router
- **Language:** TypeScript (strict mode)
- **Storage:** In-memory global singleton
- **Real-time:** Server-Sent Events (SSE)
- **Styling:** Tailwind CSS v4
- **Deployment:** Docker (standalone output)

## Build & Development Commands

```bash
# Install dependencies
pnpm install

# Development server (default http://localhost:3000)
pnpm dev

# Use custom port if 3000 is occupied
PORT=3001 pnpm dev

# Custom email limit (default: 50)
RESENDPIT_MAX_EMAILS=100 pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Linting
pnpm lint

# Docker build
docker build -t appaka/resendpit .

# Docker run
docker run -p 3000:3000 appaka/resendpit
```

## Testing the Interceptor

```bash
# Send a test email
curl -X POST http://localhost:3000/emails \
  -H "Content-Type: application/json" \
  -d '{"from":"test@example.com","to":["user@example.com"],"subject":"Test","html":"<h1>Hello</h1>"}'

# Check health and email count
curl http://localhost:3000/api/health

# Get all emails
curl http://localhost:3000/api/emails

# Clear all emails
curl -X DELETE http://localhost:3000/api/emails
```

## Architecture

```
┌─────────────────┐      POST /emails     ┌──────────────────┐
│   Consumer App  │ ──────────────────────▶│   Resend-Pit     │
│   (Resend SDK)  │                        │   (Interceptor)   │
└─────────────────┘                        └────────┬─────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  In-Memory Store │
                                          │  (50 emails FIFO)│
                                          └────────┬─────────┘
                                                   │ EventEmitter
                                                   ▼
┌─────────────────┐      SSE /api/events  ┌──────────────────┐
│   Dashboard UI  │ ◀──────────────────────│   SSE Stream     │
│   (Browser)     │                        │                  │
└─────────────────┘                        └──────────────────┘
```

### Key Components

| Component | Path | Purpose |
|-----------|------|---------|
| Types | `src/lib/types.ts` | Email and request interfaces |
| Utils | `src/lib/utils.ts` | Validation and helper functions |
| Store | `src/lib/store.ts` | HMR-safe singleton, 50-email FIFO |
| POST /emails | `src/app/emails/route.ts` | Mimics Resend API |
| GET /api/emails | `src/app/api/emails/route.ts` | List/clear emails |
| GET /api/events | `src/app/api/events/route.ts` | SSE stream |
| GET /api/health | `src/app/api/health/route.ts` | Health check |
| Dashboard | `src/app/page.tsx` | Two-pane UI |

### SSE Message Types

The SSE stream sends typed messages:
- `init`: Sent on connect with all current emails
- `new-email`: Sent when a new email arrives
- `clear`: Sent when emails are cleared

## Consumer App Integration

Apps using the Resend SDK redirect to Resend-Pit via environment variable:

```bash
# In consumer app's .env
RESEND_BASE_URL=http://localhost:3000
```

Or in docker-compose:
```yaml
services:
  app:
    environment:
      - RESEND_BASE_URL=http://resendpit:3000
  resendpit:
    image: appaka/resendpit
    ports:
      - "3000:3000"
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `RESENDPIT_MAX_EMAILS` | 50 | Maximum emails to store (FIFO) |

## Constraints

- **Memory limit:** Configurable via `RESENDPIT_MAX_EMAILS` (default 50, FIFO eviction)
- **No persistence:** Data is lost on restart (by design)
- **Single provider:** Only intercepts Resend SDK calls
- **No authentication:** Local development tool

## File Structure

```
resendpit/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── emails/route.ts     # GET/DELETE emails
│   │   │   ├── events/route.ts     # SSE stream
│   │   │   └── health/route.ts     # Health check
│   │   ├── emails/route.ts         # POST /emails (Resend API)
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx                # Dashboard
│   ├── components/
│   │   ├── connection-badge.tsx
│   │   ├── email-item.tsx
│   │   ├── email-list.tsx
│   │   ├── email-preview.tsx
│   │   └── empty-state.tsx
│   └── lib/
│       ├── store.ts                # Global store + EventEmitter
│       ├── types.ts                # TypeScript interfaces
│       └── utils.ts                # Validation helpers
├── Dockerfile
├── docker-compose.yml
├── docker-compose.example.yml
├── next.config.ts                  # standalone output
└── package.json
```
