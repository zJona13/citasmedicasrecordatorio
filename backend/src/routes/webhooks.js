/**
 * Rutas de webhooks (públicas, sin autenticación)
 */
import express from 'express';
import { procesarRespuestaConfirmacion } from '../services/messaging.js';
import { procesarRespuestaListaEspera } from '../services/waitingList.js';

const router = express.Router();

/**
 * POST /api/webhooks/twilio/sms
 * Webhook para recibir respuestas SMS de Twilio
 * 
 * IMPORTANTE: Twilio envía los datos como application/x-www-form-urlencoded
 * El middleware express.urlencoded ya está configurado en app.js
 */

// Ruta de prueba para verificar que el webhook funciona
router.get('/twilio/sms/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook endpoint está funcionando',
    timestamp: new Date().toISOString()
  });
});

router.post('/twilio/sms', async (req, res) => {
  try {
    // Twilio envía los datos como application/x-www-form-urlencoded
    const From = req.body.From || req.body.from;
    const Body = req.body.Body || req.body.body;
    const To = req.body.To || req.body.to;
    const MessageSid = req.body.MessageSid || req.body.MessageSid;
    
    console.log('📨 Webhook SMS recibido - Datos completos:');
    console.log('  From:', From);
    console.log('  To:', To);
    console.log('  Body:', Body);
    console.log('  MessageSid:', MessageSid);
    console.log('  Headers:', req.headers);
    console.log('  Content-Type:', req.headers['content-type']);
    console.log('  Body completo:', JSON.stringify(req.body, null, 2));
    console.log('  Raw body:', req.body);
    
    if (!From || !Body) {
      console.error('❌ Faltan campos From o Body');
      return res.status(400).json({ error: 'From y Body son requeridos' });
    }

    const mensajeNormalizado = Body.trim().toUpperCase();
    console.log(`📝 Mensaje normalizado: "${mensajeNormalizado}"`);
    
    // Primero intentar procesar como respuesta de lista de espera (ACEPTAR/IGNORAR)
    if (mensajeNormalizado.includes('ACEPTAR') || mensajeNormalizado.includes('IGNORAR')) {
      console.log('🔄 Procesando como respuesta de lista de espera...');
      const resultado = await procesarRespuestaListaEspera(From, Body);
      console.log('✅ Resultado:', resultado);
      
      res.type('text/xml');
      if (resultado.success) {
        res.send(`
          <Response>
            <Message>${resultado.mensaje || 'Su respuesta ha sido procesada.'}</Message>
          </Response>
        `);
      } else {
        res.send(`
          <Response>
            <Message>${resultado.error || 'No se pudo procesar su respuesta.'}</Message>
          </Response>
        `);
      }
      return;
    }

    // Si no es respuesta de lista de espera, procesar como confirmación de cita
    const resultado = await procesarRespuestaConfirmacion(From, Body);
    
    // Responder a Twilio (formato TwiML)
    if (resultado.success) {
      res.type('text/xml');
      res.send(`
        <Response>
          <Message>${resultado.cita.respuesta === 'confirmada' ? 'Su cita ha sido confirmada. ¡Nos vemos pronto!' : 'Su cita ha sido cancelada.'}</Message>
        </Response>
      `);
    } else {
      res.type('text/xml');
      res.send(`
        <Response>
          <Message>${resultado.error || 'No se pudo procesar su respuesta.'}</Message>
        </Response>
      `);
    }
  } catch (error) {
    console.error('Error procesando webhook SMS:', error);
    res.type('text/xml');
    res.send(`
      <Response>
        <Message>Error al procesar su respuesta. Por favor, intente nuevamente.</Message>
      </Response>
    `);
  }
});

/**
 * POST /api/webhooks/twilio/whatsapp
 * Webhook para recibir respuestas WhatsApp de Twilio
 */
router.post('/twilio/whatsapp', async (req, res) => {
  try {
    const { From, Body } = req.body;
    
    // Twilio envía números de WhatsApp con formato "whatsapp:+1234567890"
    const telefono = From.replace('whatsapp:', '');
    
    if (!telefono || !Body) {
      return res.status(400).json({ error: 'From y Body son requeridos' });
    }

    const mensajeNormalizado = Body.trim().toUpperCase();
    
    // Primero intentar procesar como respuesta de lista de espera (ACEPTAR/IGNORAR)
    if (mensajeNormalizado.includes('ACEPTAR') || mensajeNormalizado.includes('IGNORAR')) {
      const resultado = await procesarRespuestaListaEspera(telefono, Body);
      
      res.type('text/xml');
      if (resultado.success) {
        res.send(`
          <Response>
            <Message>${resultado.mensaje || 'Su respuesta ha sido procesada.'}</Message>
          </Response>
        `);
      } else {
        res.send(`
          <Response>
            <Message>${resultado.error || 'No se pudo procesar su respuesta.'}</Message>
          </Response>
        `);
      }
      return;
    }

    // Si no es respuesta de lista de espera, procesar como confirmación de cita
    const resultado = await procesarRespuestaConfirmacion(telefono, Body);
    
    // Responder a Twilio (formato TwiML)
    if (resultado.success) {
      res.type('text/xml');
      res.send(`
        <Response>
          <Message>${resultado.cita.respuesta === 'confirmada' ? 'Su cita ha sido confirmada. ¡Nos vemos pronto!' : 'Su cita ha sido cancelada.'}</Message>
        </Response>
      `);
    } else {
      res.type('text/xml');
      res.send(`
        <Response>
          <Message>${resultado.error || 'No se pudo procesar su respuesta.'}</Message>
        </Response>
      `);
    }
  } catch (error) {
    console.error('Error procesando webhook WhatsApp:', error);
    res.type('text/xml');
    res.send(`
      <Response>
        <Message>Error al procesar su respuesta. Por favor, intente nuevamente.</Message>
      </Response>
    `);
  }
});

export default router;

