# Stage 1: Build Frontend
FROM node:20-alpine AS frontend
WORKDIR /app/frontend
RUN corepack enable pnpm
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm build

# Stage 2: Build Backend
FROM golang:1.24-alpine AS backend
WORKDIR /app
COPY backend/go.mod backend/go.sum ./
RUN go mod download
COPY backend/ ./
COPY --from=frontend /app/backend/static ./static
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o resendpit .

# Stage 3: Final (scratch - zero OS vulnerabilities)
FROM scratch
COPY --from=backend /app/resendpit /resendpit
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD ["/resendpit", "--healthcheck"]
ENTRYPOINT ["/resendpit"]
