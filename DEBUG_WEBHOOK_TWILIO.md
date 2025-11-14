# Debug: Webhook de Twilio no recibe mensajes desde el teléfono

## Problema
El webhook funciona cuando se prueba con `curl`, pero NO funciona cuando se envía un mensaje desde el teléfono.

## Diagnóstico

### 1. Verificar que ngrok esté corriendo y accesible

```bash
# Verificar que ngrok esté corriendo
curl http://127.0.0.1:4040/api/tunnels

# O abrir en el navegador:
# http://localhost:4040
```

### 2. Verificar la URL del webhook en Twilio

1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Haz clic en tu número de teléfono
3. En "Messaging" → "A message comes in", verifica:
   - **Tipo**: `Webhook` (no TwiML Bin, Function, etc.)
   - **URL**: Debe ser EXACTAMENTE: `https://TU-URL-NGROK/api/webhooks/twilio/sms`
   - **Método**: `HTTP POST` (NO GET)

### 3. Verificar logs de Twilio

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Filtra por "Incoming" (mensajes entrantes)
3. Busca tu mensaje "ACEPTAR"
4. Haz clic en el SID del mensaje
5. En "Delivery Steps", deberías ver:
   - Si Twilio intentó llamar al webhook
   - Qué respuesta recibió
   - Si hubo algún error

### 4. Verificar que el número esté configurado correctamente

El problema puede ser que el número corto "2056" no esté configurado para recibir mensajes entrantes.

1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Verifica que tu número tenga configurado:
   - **"A message comes in"**: Webhook con tu URL de ngrok
   - **"Primary handler fails"**: Opcional, pero puede ayudar

### 5. Probar con un número de prueba de Twilio

Twilio tiene un número de prueba que puedes usar:
- **Number**: `+15005550006`
- Este número siempre responde con el mensaje que configuraste

### 6. Verificar que ngrok sea accesible públicamente

```bash
# Probar que ngrok responde desde fuera
curl https://TU-URL-NGROK/api/webhooks/twilio/sms -X POST \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "From=%2B51943958912&Body=TEST"
```

Si esto funciona, ngrok está bien configurado.

## Soluciones comunes

### Problema 1: La URL en Twilio es incorrecta

**Solución**: Asegúrate de que la URL sea exactamente:
```
https://idealistic-carmela-preneolithic.ngrok-free.dev/api/webhooks/twilio/sms
```

**Importante**: 
- Debe tener `https://`
- Debe incluir `/api/webhooks/twilio/sms` al final
- NO debe tener espacios ni caracteres extra

### Problema 2: El método no es HTTP POST

**Solución**: En Twilio Console, asegúrate de que el método sea `HTTP POST`, no `HTTP GET`.

### Problema 3: ngrok cambió de URL

**Solución**: Si reiniciaste ngrok, la URL cambió. Actualiza la URL en Twilio Console.

### Problema 4: Twilio está bloqueando la petición

**Solución**: Verifica los logs de Twilio para ver si hay errores de autenticación o validación.

### Problema 5: El número corto no está configurado

**Solución**: Si estás usando un número corto (como "2056"), puede que necesites configurarlo diferente. Verifica en Twilio Console.

## Pasos para verificar

1. ✅ Verifica que ngrok esté corriendo
2. ✅ Verifica que la URL en Twilio sea correcta
3. ✅ Verifica que el método sea HTTP POST
4. ✅ Envía un mensaje desde tu teléfono
5. ✅ Revisa los logs de Twilio para ver si intentó llamar al webhook
6. ✅ Revisa ngrok Inspector para ver si llegó la petición
7. ✅ Revisa los logs del servidor para ver si llegó el webhook

## Si nada funciona

Puede ser que el número corto "2056" no esté configurado para recibir mensajes entrantes. En ese caso:

1. Usa el número completo de Twilio (+18573823141) para recibir mensajes
2. O configura el número corto en Twilio Console para que redirija mensajes entrantes a tu webhook

