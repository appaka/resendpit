#!/bin/bash
set -e
BASE_URL="${1:-http://localhost:3000}"
PASSED=0
FAILED=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ $1${NC}"; PASSED=$((PASSED+1)); }
fail() { echo -e "${RED}✗ $1${NC}"; FAILED=$((FAILED+1)); }

echo "=== Resend-Pit API Tests ==="
echo "URL: $BASE_URL"
echo ""

# 1. Health Check
echo "--- Health Check ---"
HEALTH=$(curl -s "$BASE_URL/api/health")
echo "$HEALTH" | grep -q '"status":"ok"' && pass "GET /api/health returns status ok" || fail "Health check failed"
echo "$HEALTH" | grep -q 'maxEmails":50' && pass "maxEmails is 50 by default" || fail "maxEmails incorrect"

# 2. POST /emails - Validations
echo ""
echo "--- POST /emails Validations ---"

# Missing from
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/emails" -H "Content-Type: application/json" -d '{"to":"a@b.com","subject":"Test"}')
[[ "$RESP" == *"422" ]] && pass "POST without 'from' returns 422" || fail "POST without 'from' should return 422"

# Missing to
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/emails" -H "Content-Type: application/json" -d '{"from":"a@b.com","subject":"Test"}')
[[ "$RESP" == *"422" ]] && pass "POST without 'to' returns 422" || fail "POST without 'to' should return 422"

# Missing subject
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/emails" -H "Content-Type: application/json" -d '{"from":"a@b.com","to":"b@c.com"}')
[[ "$RESP" == *"422" ]] && pass "POST without 'subject' returns 422" || fail "POST without 'subject' should return 422"

# Invalid JSON
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/emails" -H "Content-Type: application/json" -d 'not json')
[[ "$RESP" == *"422" ]] && pass "POST with invalid JSON returns 422" || fail "Invalid JSON should return 422"

# 3. POST /emails - Success cases
echo ""
echo "--- Email Creation ---"

# Clear first
curl -s -X DELETE "$BASE_URL/api/emails" > /dev/null

# Simple email
RESP=$(curl -s -X POST "$BASE_URL/emails" -H "Content-Type: application/json" \
  -d '{"from":"sender@test.com","to":"recipient@test.com","subject":"Test 1","html":"<h1>Hello</h1>"}')
echo "$RESP" | grep -q '"id"' && pass "POST simple email returns ID" || fail "POST simple email failed"

# Email with array to
RESP=$(curl -s -X POST "$BASE_URL/emails" -H "Content-Type: application/json" \
  -d '{"from":"sender@test.com","to":["a@test.com","b@test.com"],"subject":"Test 2"}')
echo "$RESP" | grep -q '"id"' && pass "POST with array 'to' works" || fail "POST with array 'to' failed"

# Email with cc, bcc, reply_to
RESP=$(curl -s -X POST "$BASE_URL/emails" -H "Content-Type: application/json" \
  -d '{"from":"sender@test.com","to":"a@test.com","subject":"Test 3","cc":"cc@test.com","bcc":"bcc@test.com","reply_to":"reply@test.com"}')
echo "$RESP" | grep -q '"id"' && pass "POST with cc/bcc/reply_to works" || fail "POST with cc/bcc/reply_to failed"

# Email with tags and headers
RESP=$(curl -s -X POST "$BASE_URL/emails" -H "Content-Type: application/json" \
  -d '{"from":"sender@test.com","to":"a@test.com","subject":"Test 4","tags":[{"name":"campaign","value":"test"}],"headers":{"X-Custom":"value"}}')
echo "$RESP" | grep -q '"id"' && pass "POST with tags/headers works" || fail "POST with tags/headers failed"

# 4. GET /api/emails
echo ""
echo "--- Email Listing ---"
EMAILS=$(curl -s "$BASE_URL/api/emails")
echo "$EMAILS" | grep -q '"emails"' && pass "GET /api/emails returns list" || fail "GET /api/emails failed"
COUNT=$(echo "$EMAILS" | grep -o '"id"' | wc -l | tr -d ' ')
[[ $COUNT -eq 4 ]] && pass "4 emails stored correctly" || fail "Expected 4 emails, found $COUNT"

# 5. DELETE /api/emails
echo ""
echo "--- Email Cleanup ---"
RESP=$(curl -s -X DELETE "$BASE_URL/api/emails")
echo "$RESP" | grep -q '"success":true' && pass "DELETE returns success:true" || fail "DELETE failed"

EMAILS=$(curl -s "$BASE_URL/api/emails")
COUNT=$(echo "$EMAILS" | grep -o '"id"' | wc -l | tr -d ' ')
[[ $COUNT -eq 0 ]] && pass "List empty after DELETE" || fail "List not empty after DELETE"

# 6. HTTP Methods
echo ""
echo "--- HTTP Methods ---"
RESP=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/emails" -o /dev/null)
[[ "$RESP" == "405" ]] && pass "GET /emails returns 405" || fail "GET /emails should return 405"

RESP=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/health" -o /dev/null)
[[ "$RESP" == "405" ]] && pass "POST /api/health returns 405" || fail "POST /api/health should return 405"

# Summary
echo ""
echo "=== Summary ==="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
[[ $FAILED -eq 0 ]] && exit 0 || exit 1
