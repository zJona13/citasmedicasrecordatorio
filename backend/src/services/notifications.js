/**
 * Servicio de notificaciones automáticas
 * Jobs programados para recordatorios y confirmaciones
 */
import cron from 'node-cron';
import { pool } from '../db.js';
import { enviarRecordatorio24h, enviarConfirmacion3h } from './messaging.js';
import { notificarListaEspera, limpiarOfertasExpiradas } from './waitingList.js';

/**
 * Job para enviar recordatorios 24h antes de las citas
 * Se ejecuta cada hora
 */
export function iniciarJobRecordatorios24h() {
  cron.schedule('0 * * * *', async () => {
    console.log('Ejecutando job de recordatorios 24h...');
    
    try {
      // Buscar citas que están en las próximas 24 horas
      const [citas] = await pool.execute(
        `SELECT 
          c.id,
          c.fecha,
          c.hora,
          c.estado,
          pa.nombre_completo as patient,
          pa.telefono,
          pr.nombre_completo as doctor,
          e.nombre as specialty
         FROM citas c
         INNER JOIN pacientes pa ON c.paciente_id = pa.id
         INNER JOIN profesionales pr ON c.profesional_id = pr.id
         INNER JOIN especialidades e ON pr.especialidad_id = e.id
         WHERE c.estado IN ('pendiente', 'confirmada')
         AND c.fecha = DATE_ADD(CURDATE(), INTERVAL 1 DAY)
         AND pa.telefono IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM confirmaciones conf
           WHERE conf.cita_id = c.id
           AND conf.canal IN ('SMS', 'WhatsApp')
           AND DATE(conf.fecha_envio) = CURDATE()
           AND conf.estado_envio = 'entregado'
         )`
      );

      console.log(`Encontradas ${citas.length} citas para recordatorio 24h`);

      for (const cita of citas) {
        try {
          // Determinar canal (por defecto SMS)
          const canal = 'SMS'; // Podría venir de preferencias del paciente
          
          await enviarRecordatorio24h({
            id: cita.id,
            fecha: cita.fecha.toISOString().split('T')[0],
            hora: cita.hora.substring(0, 5),
            patient: cita.patient,
            telefono: cita.telefono,
            doctor: cita.doctor,
            specialty: cita.specialty
          }, canal);

          console.log(`Recordatorio 24h enviado para cita ${cita.id}`);
        } catch (error) {
          console.error(`Error enviando recordatorio 24h para cita ${cita.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error en job de recordatorios 24h:', error);
    }
  });

  console.log('Job de recordatorios 24h iniciado (cada hora)');
}

/**
 * Job para enviar confirmaciones 3h antes de las citas
 * Se ejecuta cada 15 minutos
 */
export function iniciarJobConfirmaciones3h() {
  cron.schedule('*/15 * * * *', async () => {
    console.log('Ejecutando job de confirmaciones 3h...');
    
    try {
      // Buscar citas pendientes que están en las próximas 3 horas
      const [citas] = await pool.execute(
        `SELECT 
          c.id,
          c.fecha,
          c.hora,
          c.estado,
          pa.nombre_completo as patient,
          pa.telefono,
          pr.nombre_completo as doctor,
          e.nombre as specialty
         FROM citas c
         INNER JOIN pacientes pa ON c.paciente_id = pa.id
         INNER JOIN profesionales pr ON c.profesional_id = pr.id
         INNER JOIN especialidades e ON pr.especialidad_id = e.id
         WHERE c.estado = 'pendiente'
         AND c.fecha = CURDATE()
         AND TIME(c.hora) BETWEEN ADDTIME(TIME(NOW()), '03:00:00')
                              AND ADDTIME(TIME(NOW()), '03:15:00')
         AND pa.telefono IS NOT NULL
         AND NOT EXISTS (
           SELECT 1 FROM confirmaciones conf
           WHERE conf.cita_id = c.id
           AND conf.canal IN ('SMS', 'WhatsApp')
           AND DATE(conf.fecha_envio) = CURDATE()
           AND HOUR(conf.fecha_envio) = HOUR(NOW())
           AND conf.estado_envio = 'entregado'
         )`
      );

      console.log(`Encontradas ${citas.length} citas para confirmación 3h`);

      for (const cita of citas) {
        try {
          const canal = 'SMS'; // Podría venir de preferencias del paciente
          
          await enviarConfirmacion3h({
            id: cita.id,
            fecha: cita.fecha.toISOString().split('T')[0],
            hora: cita.hora.substring(0, 5),
            patient: cita.patient,
            telefono: cita.telefono,
            doctor: cita.doctor,
            specialty: cita.specialty
          }, canal);

          console.log(`Confirmación 3h enviada para cita ${cita.id}`);
        } catch (error) {
          console.error(`Error enviando confirmación 3h para cita ${cita.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Error en job de confirmaciones 3h:', error);
    }
  });

  console.log('Job de confirmaciones 3h iniciado (cada 15 minutos)');
}

/**
 * Job para limpiar ofertas expiradas de lista de espera
 * Se ejecuta cada 5 minutos
 */
export function iniciarJobLimpiarOfertas() {
  cron.schedule('*/5 * * * *', async () => {
    try {
      await limpiarOfertasExpiradas();
    } catch (error) {
      console.error('Error en job de limpiar ofertas:', error);
    }
  });

  console.log('Job de limpiar ofertas expiradas iniciado (cada 5 minutos)');
}

/**
 * Función para notificar lista de espera cuando se cancela/libera una cita
 * Esta función debe ser llamada cuando se cancela una cita
 * @param {number} profesionalId - ID del profesional
 * @param {string} fecha - Fecha de la cita (YYYY-MM-DD)
 * @param {string} hora - Hora de la cita (HH:MM)
 */
export async function notificarListaEsperaPorCitaCancelada(profesionalId, fecha, hora) {
  try {
    console.log(`Notificando lista de espera por cita cancelada: profesional ${profesionalId}, ${fecha} ${hora}`);
    await notificarListaEspera(profesionalId, fecha, hora);
  } catch (error) {
    console.error('Error notificando lista de espera por cita cancelada:', error);
  }
}

/**
 * Inicia todos los jobs de notificaciones
 */
export function iniciarJobsNotificaciones() {
  iniciarJobRecordatorios24h();
  iniciarJobConfirmaciones3h();
  iniciarJobLimpiarOfertas();
  console.log('Todos los jobs de notificaciones han sido iniciados');
}

