---
description: "Create a new release: update changelog, tag, GitHub release, Docker push"
argument-hint: "[version]"
allowed-tools: Bash(git:*), Bash(gh:*), Bash(docker:*), Bash(make:*), Read, Edit, Grep
---

Create a release for version $ARGUMENTS (or infer next version from CHANGELOG.md if not provided).

## Steps to Follow

### 1. Determine Version
- If `$ARGUMENTS` is provided, use it as the version (e.g., "0.3.0")
- If not provided, read `CHANGELOG.md`, find the latest `[X.Y.Z]` version, and increment the patch number

### 2. Run Tests (GATE)
```bash
docker rm -f release-test 2>/dev/null
docker run -d --name release-test -p 3001:3000 appaka/resendpit
sleep 2
./test_api.sh http://localhost:3001
docker rm -f release-test
```
**ABORT the release if any test fails.**

### 3. Build Docker Image Locally
```bash
docker build -t appaka/resendpit:test .
```

### 4. Check Vulnerabilities (GATE)
```bash
docker scout cves appaka/resendpit:test --only-severity critical,high
```
**ABORT the release if any Critical or High vulnerabilities are found.**

### 5. Update CHANGELOG.md
- If the version section doesn't exist, add a new section at the top (after the header)
- Format: `## [X.Y.Z] - YYYY-MM-DD`
- Include changes from git commits since the last tag

### 6. Commit Changes
- Stage all modified files
- Create commit with descriptive message:
  ```
  chore: release vX.Y.Z

  Changes in this release:
  - [bullet points summarizing key changes from CHANGELOG]
  ```
- **Do NOT include Co-Authored-By**

### 7. Create and Push Tag
```bash
git tag vX.Y.Z
git push origin main
git push origin vX.Y.Z
```

### 8. Create GitHub Release
```bash
gh release create vX.Y.Z --title "vX.Y.Z" --notes "[release notes from CHANGELOG section]"
```

### 9. Build and Push Multi-Arch Docker Image
```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t appaka/resendpit:X.Y.Z \
  -t appaka/resendpit:latest \
  --push .
```

### 10. Verify
- Confirm GitHub release: `gh release view vX.Y.Z`
- Confirm Docker Hub tags are published
