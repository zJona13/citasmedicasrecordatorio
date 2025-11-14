# Configurar Webhook en Twilio para SMS

## Pasos para configurar el webhook

### 1. Ir a la configuración del número de teléfono

1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Haz clic en tu número de teléfono activo (el que estás usando para enviar SMS)

### 2. Configurar el webhook para mensajes entrantes

1. En la sección **"Messaging"**, busca **"A message comes in"**
2. Deberías ver:
   - Un dropdown que dice **"Webhook"** (asegúrate de que esté seleccionado)
   - Un campo **"URL"** con la URL de tu webhook
   - Un dropdown **"HTTP"** que debe estar en **"HTTP POST"**

### 3. Configurar la URL del webhook

La URL debe ser:
```
https://idealistic-carmela-preneolithic.ngrok-free.dev/api/webhooks/twilio/sms
```

**Importante:**
- Debe ser la URL completa con `https://`
- Debe incluir `/api/webhooks/twilio/sms` al final
- No debe tener espacios ni caracteres extra

### 4. Verificar el método HTTP

1. En el dropdown **"HTTP"**, asegúrate de que esté seleccionado **"HTTP POST"**
2. NO uses "HTTP GET"

### 5. Guardar la configuración

1. Haz clic en el botón **"Save configuration"** (azul, abajo)
2. Espera a que aparezca un mensaje de confirmación

### 6. Verificar que está configurado correctamente

Después de guardar, deberías ver:
- **A message comes in**: `Webhook` → `https://idealistic-carmela-preneolithic.ngrok-free.dev/api/webhooks/twilio/sms` → `HTTP POST`

## Verificar que funciona

### Opción 1: Usar ngrok Inspector

1. Abre: http://localhost:4040/inspect/http
2. Envía un SMS de prueba respondiendo "ACEPTAR" a tu número de Twilio
3. Deberías ver una petición POST aparecer en ngrok Inspector

### Opción 2: Ver logs en Twilio

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Filtra por "Incoming" (mensajes entrantes)
3. Busca tu mensaje de respuesta
4. Haz clic en el SID del mensaje
5. En "Delivery Steps", deberías ver el webhook que Twilio llamó

### Opción 3: Ver logs del servidor

En los logs de tu servidor backend, deberías ver:
```
📨 Webhook SMS recibido: { From: '+51943958912', Body: 'ACEPTAR', ... }
```

## Solución de problemas

### Si no ves la petición en ngrok:
- Verifica que ngrok esté corriendo
- Verifica que la URL en Twilio sea correcta
- Verifica que el método sea HTTP POST

### Si ves error 404 en ngrok:
- Verifica que la ruta sea `/api/webhooks/twilio/sms`
- Verifica que el servidor backend esté corriendo en el puerto 3000

### Si ves error 500 en ngrok:
- Revisa los logs del servidor para ver el error específico
- Verifica que la base de datos esté conectada

