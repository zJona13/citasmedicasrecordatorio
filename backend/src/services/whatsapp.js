/**
 * Servicio de WhatsApp usando whatsapp-web.js
 * Gestiona la inicialización y conexión del cliente de WhatsApp
 */
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import { procesarRespuestaConfirmacion } from './messaging.js';
import { procesarRespuestaListaEspera } from './waitingList.js';

dotenv.config();

let whatsappClient = null;
let isReady = false;
let isInitializing = false;

/**
 * Inicializa el cliente de WhatsApp
 * @returns {Promise<Client>}
 */
export async function inicializarWhatsApp() {
  if (whatsappClient && isReady) {
    return whatsappClient;
  }

  if (isInitializing) {
    // Esperar a que termine la inicialización
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (isReady && whatsappClient) {
          clearInterval(checkInterval);
          resolve(whatsappClient);
        }
      }, 500);
      
      // Timeout después de 2 minutos
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Timeout esperando inicialización de WhatsApp'));
      }, 120000);
    });
  }

  isInitializing = true;

  try {
    // Configurar ruta de sesión si está definida
    const sessionPath = process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth';
    
    // Limpiar cliente anterior si existe pero no está listo
    if (whatsappClient) {
      try {
        await whatsappClient.destroy();
      } catch (e) {
        // Ignorar errores al destruir
      }
      whatsappClient = null;
    }
    
    whatsappClient = new Client({
      authStrategy: new LocalAuth({
        dataPath: sessionPath
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
          '--disable-extensions',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-breakpad',
          '--disable-client-side-phishing-detection',
          '--disable-default-apps',
          '--disable-features=TranslateUI',
          '--disable-hang-monitor',
          '--disable-ipc-flooding-protection',
          '--disable-popup-blocking',
          '--disable-prompt-on-repost',
          '--disable-renderer-backgrounding',
          '--disable-sync',
          '--metrics-recording-only',
          '--no-default-browser-check',
          '--no-first-run',
          '--safebrowsing-disable-auto-update',
          '--enable-automation',
          '--password-store=basic',
          '--use-mock-keychain'
        ],
        timeout: 60000 // 60 segundos de timeout para la inicialización
      }
    });

    // Evento cuando se genera el QR
    whatsappClient.on('qr', (qr) => {
      console.log('📱 Escanea este código QR con WhatsApp:');
      qrcode.generate(qr, { small: true });
    });

    // Evento cuando está listo
    whatsappClient.on('ready', () => {
      console.log('✅ Cliente de WhatsApp está listo!');
      isReady = true;
      isInitializing = false;
    });

    // Evento para recibir mensajes
    whatsappClient.on('message', async (message) => {
      try {
        // Solo procesar mensajes que no son del estado (status messages)
        if (message.from === 'status@broadcast') {
          return;
        }

        // Obtener información del mensaje directamente desde message.from
        // message.from viene en formato "51943958912@c.us" o "51943958912@g.us"
        let numero = message.from.replace('@c.us', '').replace('@g.us', '');
        // Asegurar que solo tenga dígitos
        numero = numero.replace(/\D/g, '');
        const cuerpo = message.body;

        console.log(`📨 Mensaje recibido de ${numero}: ${cuerpo.substring(0, 50)}...`);

        // Procesar mensaje
        const mensajeNormalizado = cuerpo.trim().toUpperCase();
        
        // Primero intentar procesar como respuesta de lista de espera (ACEPTAR/IGNORAR)
        if (mensajeNormalizado.includes('ACEPTAR') || mensajeNormalizado.includes('IGNORAR')) {
          console.log('🔄 Procesando como respuesta de lista de espera...');
          // La función procesarRespuestaListaEspera busca la oferta activa basándose en el teléfono
          // Los parámetros fecha, hora, profesionalId son opcionales y se buscan en la BD
          const resultado = await procesarRespuestaListaEspera(numero, cuerpo, null, null, null);
          console.log('✅ Resultado:', resultado);
          
          if (resultado.success) {
            await message.reply(resultado.mensaje || 'Su respuesta ha sido procesada.');
          } else {
            await message.reply(resultado.error || 'No se pudo procesar su respuesta.');
          }
          return;
        }

        // Intentar procesar como confirmación de cita (CONFIRMAR/CANCELAR)
        const resultadoConfirmacion = await procesarRespuestaConfirmacion(numero, cuerpo);
        if (resultadoConfirmacion.success) {
          const mensajeRespuesta = resultadoConfirmacion.cita.respuesta === 'confirmada' 
            ? 'Su cita ha sido confirmada. ¡Nos vemos pronto!' 
            : 'Su cita ha sido cancelada.';
          await message.reply(mensajeRespuesta);
          return;
        }

        // Si no es confirmación de cita ni lista de espera, no procesar
        // WhatsApp solo se usa para recordatorios y confirmaciones, no para el chatbot
        // El chatbot funciona solo en la página web (localhost:8080/chatbot)
        console.log('ℹ️ Mensaje no reconocido como confirmación o lista de espera. WhatsApp solo se usa para recordatorios.');
      } catch (error) {
        console.error('❌ Error procesando mensaje entrante de WhatsApp:', error);
        try {
          await message.reply('Error al procesar su respuesta. Por favor, intente nuevamente.');
        } catch (replyError) {
          console.error('❌ Error enviando respuesta de error:', replyError);
        }
      }
    });

    // Evento de autenticación
    whatsappClient.on('authenticated', () => {
      console.log('✅ WhatsApp autenticado');
    });

    // Evento de autenticación fallida
    whatsappClient.on('auth_failure', (msg) => {
      console.error('❌ Error de autenticación de WhatsApp:', msg);
      isInitializing = false;
      isReady = false;
      whatsappClient = null;
    });

    // Evento de desconexión
    whatsappClient.on('disconnected', (reason) => {
      console.log('⚠️ WhatsApp desconectado:', reason);
      isReady = false;
      const oldClient = whatsappClient;
      whatsappClient = null;
      
      // Intentar reconectar después de 5 segundos
      setTimeout(() => {
        if (!isInitializing && !whatsappClient) {
          console.log('🔄 Intentando reconectar WhatsApp...');
          inicializarWhatsApp().catch(err => {
            console.error('❌ Error al intentar reconectar:', err);
          });
        }
      }, 5000);
    });

    // Evento de loading screen
    whatsappClient.on('loading_screen', (percent, message) => {
      console.log(`⏳ Cargando WhatsApp: ${percent}% - ${message}`);
    });

    // Inicializar el cliente con timeout
    console.log('🔄 Iniciando cliente de WhatsApp...');
    const initPromise = whatsappClient.initialize();
    
    // Agregar timeout de 60 segundos
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Timeout: La inicialización de WhatsApp tomó más de 60 segundos'));
      }, 60000);
    });

    await Promise.race([initPromise, timeoutPromise]);
    
    console.log('✅ Cliente de WhatsApp inicializado exitosamente');

    return whatsappClient;
  } catch (error) {
    console.error('❌ Error inicializando WhatsApp:', error);
    isInitializing = false;
    isReady = false;
    
    // Limpiar el cliente si existe
    if (whatsappClient) {
      try {
        await whatsappClient.destroy();
      } catch (e) {
        // Ignorar errores al destruir
      }
      whatsappClient = null;
    }
    
    // No lanzar el error, solo loguearlo para que el servidor continúe
    // El servidor puede funcionar sin WhatsApp
    return null;
  }
}

/**
 * Obtiene el cliente de WhatsApp (inicializa si es necesario)
 * @returns {Promise<Client>}
 */
export async function obtenerClienteWhatsApp() {
  if (whatsappClient && isReady) {
    return whatsappClient;
  }
  
  return await inicializarWhatsApp();
}

/**
 * Verifica si el cliente está listo
 * @returns {boolean}
 */
export function estaListo() {
  return isReady && whatsappClient !== null;
}

/**
 * Envía un mensaje de WhatsApp
 * @param {string} numero - Número de teléfono destino (formato: 51943958912 o +51943958912)
 * @param {string} mensaje - Mensaje a enviar
 * @returns {Promise<Object>}
 */
export async function enviarMensajeWhatsApp(numero, mensaje) {
  try {
    const client = await obtenerClienteWhatsApp();
    
    if (!isReady) {
      throw new Error('Cliente de WhatsApp no está listo. Por favor, espere a que se complete la autenticación.');
    }

    // Formatear número para WhatsApp (debe ser formato internacional sin +)
    let numeroFormateado = numero.replace(/\D/g, ''); // Remover todo excepto dígitos
    
    // Si no empieza con código de país, agregar código de Perú (51)
    if (!numeroFormateado.startsWith('51')) {
      // Si empieza con 0, removerlo
      if (numeroFormateado.startsWith('0')) {
        numeroFormateado = numeroFormateado.substring(1);
      }
      numeroFormateado = '51' + numeroFormateado;
    }
    
    // Agregar @c.us al final para WhatsApp
    const numeroWhatsApp = `${numeroFormateado}@c.us`;

    console.log(`📤 Enviando mensaje WhatsApp a ${numeroWhatsApp}: ${mensaje.substring(0, 50)}...`);
    
    const result = await client.sendMessage(numeroWhatsApp, mensaje);
    
    console.log(`✅ Mensaje WhatsApp enviado: ${result.id._serialized}`);
    
    return {
      success: true,
      id: result.id._serialized,
      mode: 'production'
    };
  } catch (error) {
    console.error('❌ Error enviando mensaje WhatsApp:', error);
    throw error;
  }
}

/**
 * Cierra el cliente de WhatsApp
 */
export async function cerrarWhatsApp() {
  if (whatsappClient) {
    try {
      await whatsappClient.destroy();
      whatsappClient = null;
      isReady = false;
      console.log('✅ Cliente de WhatsApp cerrado');
    } catch (error) {
      console.error('❌ Error cerrando cliente de WhatsApp:', error);
    }
  }
}

