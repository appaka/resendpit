# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-02-22

### Added

- Amazon SES v2 email interception (`POST /v2/email/outbound-emails` with JSON body)
- Amazon SES v1 email interception (`POST /` with `Action=SendEmail` and `Action=SendRawEmail`)
- Provider badges in dashboard (Resend in blue, SES in amber)
- "Via" metadata row in email preview showing provider
- MIME parsing for SES `Content.Raw` and `SendRawEmail` support
- Multi-provider help text in empty state

### Changed

- Email type now includes `provider` field ("resend" or "ses")
- Root route handler detects SES v1 form-encoded requests

## [0.3.0] - 2026-01-15

### Changed

- Switched from Alpine to scratch base image (zero OS vulnerabilities)
- Updated Go from 1.23 to 1.24 (fixes 5 HIGH CVEs in stdlib)
- Integrated healthcheck into binary (`--healthcheck` flag)
- Added multi-architecture support (linux/amd64, linux/arm64)

### Fixed

- Resolved CVE-2026-22184 (Critical) in zlib by removing Alpine
- Resolved 5 HIGH CVEs in Go stdlib by updating to 1.24

### Improved

- Reduced image size from 14MB to 6.66MB (52% smaller)

## [0.2.1] - 2025-01-14

### Added

- Footer with author, GitHub, and donate links

## [0.2.0] - 2025-01-14

### Changed

- Migrated from Next.js to Go + React for minimal footprint
- Backend now uses Go standard library (net/http)
- Frontend uses React 19 + Vite + Tailwind CSS v4

## [0.1.0] - 2025-01-13

### Added

- Initial release
- Email interception via POST /emails (Resend API compatible)
- Real-time dashboard with SSE
- Device preview (desktop/mobile)
- Gmail size warning
- Link analysis
- In-memory storage with configurable limit (FIFO)
- Docker support with multi-stage build
