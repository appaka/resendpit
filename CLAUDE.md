# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Resend-Pit** is a local development tool that intercepts emails sent via the Resend SDK. It acts as a proxy that captures outgoing API calls, stores them in memory, and displays them in a real-time web dashboard. This is an API-based alternative to SMTP tools like Mailpit.

## Tech Stack

- **Backend:** Go (net/http standard library)
- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **Storage:** In-memory with mutex
- **Real-time:** Server-Sent Events (SSE)
- **Deployment:** Docker (multi-stage build, ~15 MB image)

## Build & Development Commands

```bash
# Development (concurrent frontend + backend)
make dev

# Or separately:
cd frontend && pnpm dev      # Frontend on port 5173 with proxy
cd backend && go run .       # Backend on port 3000

# Build everything
make build

# Build frontend only (outputs to backend/static/)
cd frontend && pnpm build

# Build backend only
cd backend && go build -o ../dist/resendpit .

# Docker build
make docker

# Docker run
docker run -p 3000:3000 appaka/resendpit

# Run API tests (requires server running)
make test
```

## Testing

Run the API test suite with:

```bash
# Run tests against localhost:3000 (default)
./test_api.sh

# Run tests against a different URL
./test_api.sh http://localhost:3001
```

The test script (`test_api.sh`) covers:
- Health check endpoint
- POST /emails validation (required fields, invalid JSON)
- Email creation (simple, array to, cc/bcc, tags/headers)
- GET/DELETE /api/emails
- HTTP method restrictions (405 responses)

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
│   (Resend SDK)  │                        │   (Go backend)   │
└─────────────────┘                        └────────┬─────────┘
                                                    │
                                                    ▼
                                          ┌──────────────────┐
                                          │  In-Memory Store │
                                          │  (50 emails FIFO)│
                                          └────────┬─────────┘
                                                   │ Broadcast
                                                   ▼
┌─────────────────┐      SSE /api/events  ┌──────────────────┐
│   Dashboard UI  │ ◀──────────────────────│   SSE Stream     │
│   (React)       │                        │                  │
└─────────────────┘                        └──────────────────┘
```

### Key Components

**Backend (Go):**

| Component | Path | Purpose |
|-----------|------|---------|
| Types | `backend/types/types.go` | Email and request structs |
| Store | `backend/store/store.go` | Thread-safe singleton, FIFO, SSE broadcast |
| POST /emails | `backend/handlers/emails.go` | Mimics Resend API |
| GET/DELETE /api/emails | `backend/handlers/api_emails.go` | List/clear emails |
| GET /api/events | `backend/handlers/events.go` | SSE stream |
| GET /api/health | `backend/handlers/health.go` | Health check |
| Main | `backend/main.go` | HTTP server + static files |

**Frontend (React):**

| Component | Path | Purpose |
|-----------|------|---------|
| Types | `frontend/src/lib/types.ts` | TypeScript interfaces |
| Utils | `frontend/src/lib/utils.ts` | Validation and helpers |
| App | `frontend/src/App.tsx` | Dashboard with SSE |
| EmailList | `frontend/src/components/EmailList.tsx` | Left panel |
| EmailPreview | `frontend/src/components/EmailPreview.tsx` | Right panel |

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
├── backend/
│   ├── handlers/
│   │   ├── api_emails.go    # GET/DELETE /api/emails
│   │   ├── emails.go        # POST /emails (Resend API)
│   │   ├── events.go        # SSE stream
│   │   └── health.go        # Health check
│   ├── store/
│   │   └── store.go         # Global store + broadcast
│   ├── types/
│   │   └── types.go         # Go structs
│   ├── static/              # Built frontend (generated)
│   ├── main.go              # HTTP server
│   ├── go.mod
│   └── go.sum
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ConnectionBadge.tsx
│   │   │   ├── EmailItem.tsx
│   │   │   ├── EmailList.tsx
│   │   │   ├── EmailPreview.tsx
│   │   │   └── EmptyState.tsx
│   │   ├── lib/
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
├── Dockerfile               # Multi-stage build
├── docker-compose.yml
├── Makefile
└── README.md
```
