#!/bin/bash
# Script para verificar la configuración del webhook de Twilio

echo "🔍 Verificando configuración del webhook de Twilio..."
echo ""

# 1. Verificar que ngrok esté corriendo
echo "1. Verificando ngrok..."
NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ ngrok NO está corriendo"
    echo "   Ejecuta: ngrok http 3000"
    exit 1
else
    echo "✅ ngrok está corriendo"
    echo "   URL: $NGROK_URL"
fi

echo ""

# 2. Verificar que el servidor esté corriendo
echo "2. Verificando servidor backend..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Servidor backend está corriendo"
else
    echo "❌ Servidor backend NO está corriendo"
    echo "   Ejecuta: cd backend && npm run server"
    exit 1
fi

echo ""

# 3. Verificar que el webhook sea accesible públicamente
echo "3. Verificando que el webhook sea accesible públicamente..."
WEBHOOK_URL="${NGROK_URL}/api/webhooks/twilio/sms"
RESPONSE=$(curl -s -X POST "$WEBHOOK_URL" \
    -H "Content-Type: application/x-www-form-urlencoded" \
    -d "From=%2B51943958912&Body=TEST" \
    -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "400" ]; then
    echo "✅ Webhook es accesible públicamente"
    echo "   URL: $WEBHOOK_URL"
    echo "   HTTP Code: $HTTP_CODE"
else
    echo "❌ Webhook NO es accesible públicamente"
    echo "   HTTP Code: $HTTP_CODE"
    echo "   Response: $BODY"
    exit 1
fi

echo ""
echo "✅ Configuración del webhook verificada correctamente"
echo ""
echo "📋 URL del webhook para Twilio Console:"
echo "   $WEBHOOK_URL"
echo ""
echo "📋 Método HTTP:"
echo "   POST"
echo ""
echo "🔗 Ve a Twilio Console y configura:"
echo "   1. https://console.twilio.com/us1/develop/phone-numbers/manage/incoming"
echo "   2. Selecciona tu número de teléfono"
echo "   3. En 'Messaging' → 'A message comes in':"
echo "      - Tipo: Webhook"
echo "      - URL: $WEBHOOK_URL"
echo "      - Método: HTTP POST"
echo "   4. Guarda la configuración"
echo ""
echo "📱 Para probar:"
echo "   1. Envía un SMS 'ACEPTAR' a tu número de Twilio"
echo "   2. Revisa los logs del servidor"
echo "   3. Revisa ngrok Inspector: http://localhost:4040/inspect/http"

