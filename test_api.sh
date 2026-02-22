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

# 7. SES v2 API
echo ""
echo "--- SES v2 API ---"

# Clear first
curl -s -X DELETE "$BASE_URL/api/emails" > /dev/null

# Simple SES v2 email
RESP=$(curl -s -X POST "$BASE_URL/v2/email/outbound-emails" -H "Content-Type: application/json" \
  -d '{"FromEmailAddress":"ses@test.com","Destination":{"ToAddresses":["user@test.com"]},"Content":{"Simple":{"Subject":{"Data":"SES Test"},"Body":{"Html":{"Data":"<h1>Hello from SES</h1>"}}}}}')
echo "$RESP" | grep -q '"MessageId"' && pass "SES v2 simple email returns MessageId" || fail "SES v2 simple email failed"

# SES v2 with all fields
RESP=$(curl -s -X POST "$BASE_URL/v2/email/outbound-emails" -H "Content-Type: application/json" \
  -d '{"FromEmailAddress":"ses@test.com","Destination":{"ToAddresses":["a@test.com","b@test.com"],"CcAddresses":["cc@test.com"],"BccAddresses":["bcc@test.com"]},"ReplyToAddresses":["reply@test.com"],"Content":{"Simple":{"Subject":{"Data":"Full SES"},"Body":{"Html":{"Data":"<h1>HTML</h1>"},"Text":{"Data":"plain text"}}}},"EmailTags":[{"Name":"env","Value":"dev"}]}')
echo "$RESP" | grep -q '"MessageId"' && pass "SES v2 full email returns MessageId" || fail "SES v2 full email failed"

# SES v2 validation - missing FromEmailAddress
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/v2/email/outbound-emails" -H "Content-Type: application/json" \
  -d '{"Destination":{"ToAddresses":["user@test.com"]},"Content":{"Simple":{"Subject":{"Data":"Test"},"Body":{"Html":{"Data":"<h1>Hi</h1>"}}}}}')
echo "$RESP" | grep -q "400" && pass "SES v2 missing FromEmailAddress returns 400" || fail "SES v2 validation failed"

# SES v2 validation - missing Destination
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/v2/email/outbound-emails" -H "Content-Type: application/json" \
  -d '{"FromEmailAddress":"ses@test.com","Destination":{"ToAddresses":[]},"Content":{"Simple":{"Subject":{"Data":"Test"},"Body":{"Html":{"Data":"<h1>Hi</h1>"}}}}}')
echo "$RESP" | grep -q "400" && pass "SES v2 empty ToAddresses returns 400" || fail "SES v2 destination validation failed"

# Verify provider field
EMAILS=$(curl -s "$BASE_URL/api/emails")
echo "$EMAILS" | grep -q '"provider":"ses"' && pass "SES emails have provider:ses" || fail "SES emails missing provider field"

# 8. SES v1 API
echo ""
echo "--- SES v1 API ---"

# Clear first
curl -s -X DELETE "$BASE_URL/api/emails" > /dev/null

# SES v1 SendEmail
RESP=$(curl -s -X POST "$BASE_URL/" -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'Action=SendEmail&Source=v1@test.com&Destination.ToAddresses.member.1=user@test.com&Message.Subject.Data=V1+Test&Message.Body.Html.Data=%3Ch1%3EV1%3C%2Fh1%3E')
echo "$RESP" | grep -q "MessageId" && pass "SES v1 SendEmail returns MessageId" || fail "SES v1 SendEmail failed"

# SES v1 SendEmail with CC/BCC
RESP=$(curl -s -X POST "$BASE_URL/" -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'Action=SendEmail&Source=v1@test.com&Destination.ToAddresses.member.1=a@test.com&Destination.ToAddresses.member.2=b@test.com&Destination.CcAddresses.member.1=cc@test.com&Destination.BccAddresses.member.1=bcc@test.com&Message.Subject.Data=V1+Full&Message.Body.Html.Data=%3Ch1%3EFull%3C%2Fh1%3E&Message.Body.Text.Data=plain')
echo "$RESP" | grep -q "MessageId" && pass "SES v1 SendEmail with CC/BCC works" || fail "SES v1 full email failed"

# SES v1 validation - missing Source
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/" -H "Content-Type: application/x-www-form-urlencoded" \
  -d 'Action=SendEmail&Destination.ToAddresses.member.1=user@test.com&Message.Subject.Data=Test')
echo "$RESP" | grep -q "400" && pass "SES v1 missing Source returns 400" || fail "SES v1 validation failed"

# Verify SES v1 emails have correct provider
EMAILS=$(curl -s "$BASE_URL/api/emails")
echo "$EMAILS" | grep -q '"provider":"ses"' && pass "SES v1 emails have provider:ses" || fail "SES v1 emails missing provider field"

# Summary
echo ""
echo "=== Summary ==="
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
[[ $FAILED -eq 0 ]] && exit 0 || exit 1
