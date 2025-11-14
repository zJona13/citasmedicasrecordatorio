# Problema: No hay mensajes entrantes en Twilio

## Diagnóstico

**Problema identificado**: En los logs de Twilio solo aparecen mensajes **salientes** (Outgoing API), pero NO hay mensajes **entrantes** (Incoming).

Esto significa que cuando respondes "ACEPTAR" desde tu teléfono, Twilio **NO está recibiendo** ese mensaje como mensaje entrante.

## Posibles causas

### 1. Estás respondiendo al número incorrecto

**Verificación**:
- El número de Twilio es: `+18573823141`
- ¿Estás respondiendo a este número exacto?
- O estás respondiendo a un número corto como "2056"?

**Solución**: Asegúrate de responder al número completo de Twilio: `+18573823141`

### 2. El número de Twilio no está configurado para recibir mensajes entrantes

**Verificación**:
1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Haz clic en tu número (+18573823141)
3. Verifica la sección **"Messaging"** → **"A message comes in"**
4. Debe estar configurado con:
   - Tipo: `Webhook`
   - URL: `https://idealistic-carmela-preneolithic.ngrok-free.dev/api/webhooks/twilio/sms`
   - Método: `HTTP POST`

**Solución**: Si no está configurado, configúralo y guarda.

### 3. El número está en modo Trial y tiene restricciones

**Verificación**:
- En modo Trial, Twilio solo puede recibir mensajes de números **verificados**
- Tu número de teléfono (+51943958912) debe estar verificado en Twilio

**Solución**:
1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Verifica que tu número (+51943958912) esté en la lista de números verificados
3. Si no está, agrégalo y verifícalo

### 4. El número corto "2056" no está configurado

**Problema**: Si ves "2056" en tu teléfono, puede que ese número corto no esté configurado para recibir mensajes entrantes.

**Solución**: Usa el número completo de Twilio (+18573823141) para recibir mensajes.

## Pasos para solucionar

### Paso 1: Verificar número en Twilio Console

1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/incoming
2. Verifica que tu número (+18573823141) tenga configurado:
   - **"A message comes in"**: Webhook → `https://idealistic-carmela-preneolithic.ngrok-free.dev/api/webhooks/twilio/sms` → HTTP POST
3. Guarda los cambios

### Paso 2: Verificar tu número de teléfono

1. Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Verifica que tu número (+51943958912) esté verificado
3. Si no está, agrégalo y verifícalo

### Paso 3: Probar enviando mensaje al número completo

1. Desde tu teléfono, envía un mensaje al número completo: `+18573823141`
2. NO respondas a un mensaje, envía un mensaje nuevo
3. Revisa los logs de Twilio para ver si aparece como "Incoming"

### Paso 4: Verificar logs de Twilio

1. Ve a: https://console.twilio.com/us1/monitor/logs/messaging
2. Filtra por **"Incoming"** (mensajes entrantes)
3. Si aparece tu mensaje, haz clic en el SID
4. Verifica en "Delivery Steps" si intentó llamar al webhook

## Solución alternativa: Probar con número de prueba de Twilio

Si nada funciona, puedes probar con el número de prueba de Twilio:

1. **Número de prueba**: `+15005550006`
2. Este número siempre responde con el mensaje que configuraste
3. Puedes enviar un mensaje a este número para probar

## Verificación final

Después de configurar todo:

1. ✅ Verifica que el webhook esté configurado en Twilio Console
2. ✅ Verifica que tu número esté verificado en Twilio
3. ✅ Envía un mensaje "ACEPTAR" al número completo (+18573823141)
4. ✅ Revisa los logs de Twilio para ver si aparece como "Incoming"
5. ✅ Revisa ngrok Inspector para ver si llegó la petición
6. ✅ Revisa los logs del servidor para ver si procesó el webhook

## Si aún no funciona

Puede ser que el número esté en modo Trial y tenga restricciones. En ese caso:

1. Considera actualizar tu cuenta de Twilio a una cuenta de pago
2. O usa el número de prueba de Twilio para desarrollo
3. O verifica que todos los números estén correctamente configurados

