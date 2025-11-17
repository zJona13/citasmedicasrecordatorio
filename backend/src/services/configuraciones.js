/**
 * Servicio de configuraciones del sistema
 * Maneja el cache y valores por defecto
 */
import { pool } from '../db.js';

// Cache en memoria
let configCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Valores por defecto de las configuraciones
 */
const DEFAULT_CONFIG = {
  // Recordatorios
  reminder_48h_enabled: true,
  reminder_24h_enabled: true,
  canal_preferido: 'sms',
  
  // Lista de espera
  auto_offer_enabled: true,
  tiempo_max_oferta: 30,
  prioridad_adultos_mayores: true,
  prioridad_urgentes: true,
  prioridad_tiempo_espera: false,
  
  // Mensajes personalizados
  mensaje_confirmacion: 'Hola {nombre}, tienes cita el {fecha} a las {hora} en {especialidad}. Confirma respondiendo SÍ.',
  mensaje_oferta_cupo: 'Hola {nombre}, hay un cupo disponible el {fecha} a las {hora}. ¿Lo aceptas? Responde en {tiempo} min.',
  
  // Chatbot
  chatbot_enabled: true,
  chatbot_greeting: 'Hola! Soy tu asistente virtual de EsSalud. ¿En qué puedo ayudarte?',
  
  // Tema
  dark_mode_enabled: false
};

/**
 * Convierte un valor según su tipo
 */
function convertirValor(valor, tipo) {
  if (valor === null || valor === undefined) {
    return null;
  }
  
  switch (tipo) {
    case 'boolean':
      return valor === 'true' || valor === true || valor === 1 || valor === '1';
    case 'number':
      return Number(valor);
    case 'json':
      try {
        return JSON.parse(valor);
      } catch (e) {
        return valor;
      }
    case 'string':
    default:
      return String(valor);
  }
}

/**
 * Obtiene todas las configuraciones desde la base de datos
 */
async function obtenerConfiguracionesDesdeBD() {
  try {
    const [rows] = await pool.execute(
      `SELECT clave, valor, tipo FROM configuraciones`
    );
    
    const config = { ...DEFAULT_CONFIG };
    
    for (const row of rows) {
      config[row.clave] = convertirValor(row.valor, row.tipo);
    }
    
    return config;
  } catch (error) {
    console.error('Error obteniendo configuraciones desde BD:', error);
    // Retornar valores por defecto si hay error
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Obtiene todas las configuraciones (con cache)
 */
export async function obtenerConfiguraciones() {
  const ahora = Date.now();
  
  // Verificar si el cache es válido
  if (configCache && cacheTimestamp && (ahora - cacheTimestamp) < CACHE_TTL) {
    return configCache;
  }
  
  // Obtener desde BD y actualizar cache
  configCache = await obtenerConfiguracionesDesdeBD();
  cacheTimestamp = ahora;
  
  return configCache;
}

/**
 * Obtiene una configuración específica
 */
export async function obtenerConfiguracion(clave) {
  const config = await obtenerConfiguraciones();
  return config[clave] !== undefined ? config[clave] : DEFAULT_CONFIG[clave];
}

/**
 * Actualiza una configuración
 */
async function actualizarConfiguracionBD(clave, valor, tipo = 'string') {
  const valorString = tipo === 'json' ? JSON.stringify(valor) : String(valor);
  
  await pool.execute(
    `INSERT INTO configuraciones (clave, valor, tipo) 
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE valor = ?, tipo = ?`,
    [clave, valorString, tipo, valorString, tipo]
  );
}

/**
 * Actualiza múltiples configuraciones
 */
export async function actualizarConfiguraciones(configuraciones) {
  try {
    // Validar que todas las claves existen en DEFAULT_CONFIG
    const clavesValidas = Object.keys(DEFAULT_CONFIG);
    const clavesInvalidas = Object.keys(configuraciones).filter(
      clave => !clavesValidas.includes(clave)
    );
    
    if (clavesInvalidas.length > 0) {
      throw new Error(`Claves inválidas: ${clavesInvalidas.join(', ')}`);
    }
    
    // Actualizar cada configuración
    for (const [clave, valor] of Object.entries(configuraciones)) {
      // Determinar el tipo
      let tipo = 'string';
      if (typeof valor === 'boolean') {
        tipo = 'boolean';
      } else if (typeof valor === 'number') {
        tipo = 'number';
      } else if (typeof valor === 'object') {
        tipo = 'json';
      }
      
      await actualizarConfiguracionBD(clave, valor, tipo);
    }
    
    // Invalidar cache
    configCache = null;
    cacheTimestamp = null;
    
    return true;
  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    throw error;
  }
}

/**
 * Restaura todas las configuraciones a sus valores por defecto
 */
export async function restaurarValoresPorDefecto() {
  try {
    await actualizarConfiguraciones(DEFAULT_CONFIG);
    return true;
  } catch (error) {
    console.error('Error restaurando valores por defecto:', error);
    throw error;
  }
}

/**
 * Invalida el cache (útil después de actualizaciones)
 */
export function invalidarCache() {
  configCache = null;
  cacheTimestamp = null;
}

