# Verificar Número en Twilio - Checklist

## ✅ Checklist de Verificación

### 1. Verificar que tu número esté verificado en Twilio

**URL**: https://console.twilio.com/us1/develop/phone-numbers/manage/verified

**Verificar**:
- [ ] Tu número (+51943958912) está en la lista
- [ ] Si no está, agrégualo y verifícalo

**Importante**: En modo Trial, Twilio solo puede recibir mensajes de números verificados.

### 2. Verificar configuración del número en Twilio Console

**URL**: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming

**Pasos**:
1. Haz clic en tu número (+18573823141)
2. En la sección **"Messaging"**, busca **"A message comes in"**
3. Verifica:
   - [ ] Tipo: `Webhook` (no TwiML Bin, Function, etc.)
   - [ ] URL: `https://idealistic-carmela-preneolithic.ngrok-free.dev/api/webhooks/twilio/sms`
   - [ ] Método: `HTTP POST` (no GET)
4. Si algo está mal, corrígelo
5. [ ] Haz clic en "Save configuration"
6. [ ] Espera 10-15 segundos

### 3. Probar enviando mensaje nuevo (NO respuesta)

**Importante**: NO respondas a un mensaje existente. Envía un mensaje **nuevo**.

**Pasos**:
1. Abre tu aplicación de mensajería
2. Crea un mensaje **nuevo** (no respuesta)
3. Envía a: `+18573823141` (número completo)
4. Escribe: `ACEPTAR`
5. Envía el mensaje

### 4. Verificar logs de Twilio

**URL**: https://console.twilio.com/us1/monitor/logs/messaging

**Pasos**:
1. Filtra por **"Incoming"** (mensajes entrantes)
2. Busca tu mensaje "ACEPTAR"
3. Si aparece:
   - Haz clic en el SID del mensaje
   - En "Delivery Steps", verifica si intentó llamar al webhook
4. Si NO aparece:
   - Tu número no está verificado, O
   - Estás respondiendo al número incorrecto, O
   - El número no está configurado para recibir mensajes entrantes

### 5. Verificar ngrok Inspector

**URL**: http://localhost:4040/inspect/http

**Pasos**:
1. Abre ngrok Inspector
2. Envía el mensaje "ACEPTAR" desde tu teléfono
3. Deberías ver una petición POST aparecer
4. Si NO aparece:
   - Twilio no está enviando el webhook
   - Revisa la configuración en Twilio Console

### 6. Verificar logs del servidor

**Pasos**:
1. Abre la terminal donde corre el servidor
2. Envía el mensaje "ACEPTAR" desde tu teléfono
3. Deberías ver:
   ```
   📨 Webhook SMS recibido - Datos completos:
     From: +51943958912
     Body: ACEPTAR
   ```
4. Si NO aparece:
   - El webhook no está llegando al servidor
   - Revisa ngrok Inspector

## 🔍 Diagnóstico

### Si no aparecen mensajes "Incoming" en Twilio:

**Problema**: Twilio NO está recibiendo el mensaje.

**Soluciones**:
1. Verifica que tu número esté verificado en Twilio
2. Verifica que estés enviando al número correcto (+18573823141)
3. Envía un mensaje nuevo (no respuesta)
4. Verifica que el número esté configurado para recibir mensajes entrantes

### Si aparecen mensajes "Incoming" pero no llega al webhook:

**Problema**: Twilio está recibiendo el mensaje pero no está enviando el webhook.

**Soluciones**:
1. Verifica que el webhook esté configurado correctamente en Twilio Console
2. Verifica que la URL sea correcta
3. Verifica que el método sea HTTP POST
4. Revisa los logs de Twilio para ver si hay errores

### Si el webhook llega pero no procesa correctamente:

**Problema**: El webhook está llegando pero hay un error en el código.

**Soluciones**:
1. Revisa los logs del servidor para ver el error
2. Verifica que el formato del mensaje sea correcto
3. Verifica que la base de datos esté conectada

## 📱 Nota sobre el número corto "2056"

Si ves "2056" en tu teléfono, puede que ese número corto no esté configurado para recibir mensajes entrantes.

**Solución**: Usa el número completo de Twilio (+18573823141) para enviar mensajes.

## ✅ Resultado Esperado

Después de seguir estos pasos, deberías ver:

1. ✅ Tu mensaje aparece en los logs de Twilio como "Incoming"
2. ✅ Aparece una petición POST en ngrok Inspector
3. ✅ Aparece el log `📨 Webhook SMS recibido` en el servidor
4. ✅ La cita se crea automáticamente

