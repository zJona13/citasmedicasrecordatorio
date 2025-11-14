/**
 * Script de prueba para enviar SMS con Twilio
 * Ejecutar: node test-sms.js
 */
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const toNumber = '+51943958912'; // Tu número

if (!accountSid || !authToken || !fromNumber) {
  console.error('❌ Faltan variables de entorno de Twilio');
  console.log('Asegúrate de tener configurado:');
  console.log('- TWILIO_ACCOUNT_SID');
  console.log('- TWILIO_AUTH_TOKEN');
  console.log('- TWILIO_PHONE_NUMBER');
  process.exit(1);
}

const client = twilio(accountSid, authToken);

async function enviarSMS() {
  try {
    console.log('📤 Enviando SMS...');
    console.log(`De: ${fromNumber}`);
    console.log(`Para: ${toNumber}`);
    
    const message = await client.messages.create({
      body: 'Prueba de SMS desde el sistema de citas médicas',
      from: fromNumber,
      to: toNumber
    });

    console.log('✅ SMS enviado exitosamente!');
    console.log(`SID: ${message.sid}`);
    console.log(`Estado: ${message.status}`);
  } catch (error) {
    console.error('❌ Error enviando SMS:');
    console.error(`Código: ${error.code}`);
    console.error(`Mensaje: ${error.message}`);
    
    if (error.code === 21211) {
      console.error('\n💡 El número de destino no está verificado.');
      console.error('En modo Trial, solo puedes enviar a números verificados.');
      console.error('Ve a: https://console.twilio.com/us1/develop/phone-numbers/manage/verified');
    } else if (error.code === 21608) {
      console.error('\n💡 El número de origen no está verificado.');
      console.error('Verifica tu número en Twilio Console.');
    }
  }
}

enviarSMS();

