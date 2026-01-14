.PHONY: dev dev-frontend dev-backend build build-frontend build-backend docker clean test

# Development
dev:
	@make -j2 dev-frontend dev-backend

dev-frontend:
	cd frontend && pnpm dev

dev-backend:
	cd backend && go run .

# Build
build: build-frontend build-backend

build-frontend:
	cd frontend && pnpm build

build-backend:
	cd backend && CGO_ENABLED=0 go build -ldflags="-s -w" -o ../dist/resendpit .

# Docker
docker:
	docker build -f Dockerfile.new -t appaka/resendpit .

docker-run:
	docker run -p 3000:3000 appaka/resendpit

# Test
test:
	@echo "Testing health endpoint..."
	curl -s http://localhost:3000/api/health | head
	@echo "\n\nSending test email..."
	curl -s -X POST http://localhost:3000/emails \
		-H "Content-Type: application/json" \
		-d '{"from":"test@example.com","to":"user@example.com","subject":"Test Email","html":"<h1>Hello World</h1>"}'
	@echo "\n\nListing emails..."
	curl -s http://localhost:3000/api/emails | head

# Clean
clean:
	rm -rf backend/static dist
	rm -f backend/static/.gitkeep
