#!/bin/bash
set -e
BASE_URL="${1:-http://localhost:3000}"
PASSED=0
FAILED=0

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass() { echo -e "${GREEN}✓ $1${NC}"; PASSED=$((PASSED+1)); }
fail() { echo -e "${RED}✗ $1${NC}"; FAILED=$((FAILED+1)); }

echo "=== Pruebas API Resend-Pit ==="
echo "URL: $BASE_URL"
echo ""

# 1. Health Check
echo "--- Health Check ---"
HEALTH=$(curl -s "$BASE_URL/api/health")
echo "$HEALTH" | grep -q '"status":"ok"' && pass "GET /api/health retorna status ok" || fail "Health check falló"
echo "$HEALTH" | grep -q 'maxEmails":50' && pass "maxEmails es 50 por defecto" || fail "maxEmails incorrecto"

# 2. POST /emails - Validaciones
echo ""
echo "--- Validaciones POST /emails ---"

# Sin from
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/emails" -H "Content-Type: application/json" -d '{"to":"a@b.com","subject":"Test"}')
[[ "$RESP" == *"422" ]] && pass "POST sin 'from' retorna 422" || fail "POST sin 'from' debería ser 422"

# Sin to
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/emails" -H "Content-Type: application/json" -d '{"from":"a@b.com","subject":"Test"}')
[[ "$RESP" == *"422" ]] && pass "POST sin 'to' retorna 422" || fail "POST sin 'to' debería ser 422"

# Sin subject
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/emails" -H "Content-Type: application/json" -d '{"from":"a@b.com","to":"b@c.com"}')
[[ "$RESP" == *"422" ]] && pass "POST sin 'subject' retorna 422" || fail "POST sin 'subject' debería ser 422"

# JSON inválido
RESP=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/emails" -H "Content-Type: application/json" -d 'not json')
[[ "$RESP" == *"422" ]] && pass "POST con JSON inválido retorna 422" || fail "JSON inválido debería ser 422"

# 3. POST /emails - Casos exitosos
echo ""
echo "--- Creación de Emails ---"

# Limpiar primero
curl -s -X DELETE "$BASE_URL/api/emails" > /dev/null

# Email simple
RESP=$(curl -s -X POST "$BASE_URL/emails" -H "Content-Type: application/json" \
  -d '{"from":"sender@test.com","to":"recipient@test.com","subject":"Test 1","html":"<h1>Hello</h1>"}')
echo "$RESP" | grep -q '"id"' && pass "POST email simple retorna ID" || fail "POST email simple falló"

# Email con array to
RESP=$(curl -s -X POST "$BASE_URL/emails" -H "Content-Type: application/json" \
  -d '{"from":"sender@test.com","to":["a@test.com","b@test.com"],"subject":"Test 2"}')
echo "$RESP" | grep -q '"id"' && pass "POST con array 'to' funciona" || fail "POST con array 'to' falló"

# Email con cc, bcc, reply_to
RESP=$(curl -s -X POST "$BASE_URL/emails" -H "Content-Type: application/json" \
  -d '{"from":"sender@test.com","to":"a@test.com","subject":"Test 3","cc":"cc@test.com","bcc":"bcc@test.com","reply_to":"reply@test.com"}')
echo "$RESP" | grep -q '"id"' && pass "POST con cc/bcc/reply_to funciona" || fail "POST con cc/bcc/reply_to falló"

# Email con tags y headers
RESP=$(curl -s -X POST "$BASE_URL/emails" -H "Content-Type: application/json" \
  -d '{"from":"sender@test.com","to":"a@test.com","subject":"Test 4","tags":[{"name":"campaign","value":"test"}],"headers":{"X-Custom":"value"}}')
echo "$RESP" | grep -q '"id"' && pass "POST con tags/headers funciona" || fail "POST con tags/headers falló"

# 4. GET /api/emails
echo ""
echo "--- Listado de Emails ---"
EMAILS=$(curl -s "$BASE_URL/api/emails")
echo "$EMAILS" | grep -q '"emails"' && pass "GET /api/emails retorna lista" || fail "GET /api/emails falló"
COUNT=$(echo "$EMAILS" | grep -o '"id"' | wc -l | tr -d ' ')
[[ $COUNT -eq 4 ]] && pass "4 emails almacenados correctamente" || fail "Esperados 4 emails, encontrados $COUNT"

# 5. DELETE /api/emails
echo ""
echo "--- Limpieza de Emails ---"
RESP=$(curl -s -X DELETE "$BASE_URL/api/emails")
echo "$RESP" | grep -q '"success":true' && pass "DELETE retorna success:true" || fail "DELETE falló"

EMAILS=$(curl -s "$BASE_URL/api/emails")
COUNT=$(echo "$EMAILS" | grep -o '"id"' | wc -l | tr -d ' ')
[[ $COUNT -eq 0 ]] && pass "Lista vacía después de DELETE" || fail "Lista no vacía después de DELETE"

# 6. Métodos no permitidos
echo ""
echo "--- Métodos HTTP ---"
RESP=$(curl -s -w "%{http_code}" -X GET "$BASE_URL/emails" -o /dev/null)
[[ "$RESP" == "405" ]] && pass "GET /emails retorna 405" || fail "GET /emails debería ser 405"

RESP=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/api/health" -o /dev/null)
[[ "$RESP" == "405" ]] && pass "POST /api/health retorna 405" || fail "POST /api/health debería ser 405"

# Resumen
echo ""
echo "=== Resumen ==="
echo -e "Pasadas: ${GREEN}$PASSED${NC}"
echo -e "Fallidas: ${RED}$FAILED${NC}"
[[ $FAILED -eq 0 ]] && exit 0 || exit 1
