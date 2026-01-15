.PHONY: dev dev-frontend dev-backend build build-frontend build-backend docker docker-push clean test

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
	docker build -t appaka/resendpit .

docker-push:
	docker buildx build --platform linux/amd64,linux/arm64 -t appaka/resendpit --push .

docker-run:
	docker run -p 3000:3000 appaka/resendpit

# Test
test:
	./test_api.sh

# Clean
clean:
	rm -rf backend/static dist
	rm -f backend/static/.gitkeep
