# Verificar que el Webhook de Twilio Funciona

## Problema
No aparecen peticiones en ngrok Inspector cuando respondes "ACEPTAR", lo que significa que Twilio NO está enviando las respuestas al webhook.

## Pasos para verificar y solucionar

### 1. Verificar que ngrok esté corriendo
```bash
# Verificar que ngrok esté corriendo
curl http://127.0.0.1:4040/api/tunnels
```

Si no está corriendo:
```bash
ngrok http 3000
```

### 2. Obtener la URL de ngrok
```bash
curl -s http://127.0.0.1:4040/api/tunnels | grep -o 'https://[^"]*\.ngrok[^"]*' | head -1
```

O abre: http://localhost:4040

### 3. Verificar configuración en Twilio

1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Haz clic en tu número de teléfono
3. En la sección **"Messaging"** → **"A message comes in"**, verifica:
   - **Tipo**: `Webhook` (no TwiML Bin, Function, etc.)
   - **URL**: `https://TU-URL-NGROK/api/webhooks/twilio/sms`
   - **Método**: `HTTP POST` (NO GET)

### 4. Probar el webhook manualmente

Con el servidor corriendo, prueba:
```bash
curl -X POST http://localhost:3000/api/webhooks/twilio/sms \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B51943958912&Body=ACEPTAR&To=%2B18573823141"
```

Deberías ver en los logs:
```
📨 Webhook SMS recibido - Datos completos:
  From: +51943958912
  Body: ACEPTAR
```

### 5. Verificar en Twilio Logs

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Filtra por **"Incoming"** (mensajes entrantes)
3. Busca tu mensaje "ACEPTAR"
4. Haz clic en el SID del mensaje
5. En **"Delivery Steps"**, deberías ver el webhook que Twilio intentó llamar

### 6. Verificar que el servidor esté corriendo

```bash
cd backend
npm run server
```

El servidor debe estar corriendo en el puerto 3000.

## Solución de problemas comunes

### Si ngrok muestra "No requests to display yet":
- El webhook NO está configurado correctamente en Twilio
- La URL en Twilio es incorrecta
- El método no es HTTP POST

### Si ves error 404 en ngrok:
- La ruta del webhook es incorrecta
- Debe ser: `/api/webhooks/twilio/sms`

### Si ves error 500 en ngrok:
- Revisa los logs del servidor
- Puede ser un error en el código

### Si no ves nada en ngrok:
- Twilio no está enviando el webhook
- Verifica la configuración en Twilio Console
- Asegúrate de que el método sea HTTP POST

