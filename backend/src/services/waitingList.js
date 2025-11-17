/**
 * Servicio para gestionar lista de espera y notificaciones
 */
import { pool } from '../db.js';
import { enviarOfertaListaEspera } from './messaging.js';
import { obtenerConfiguracion } from './configuraciones.js';

/**
 * Notifica al siguiente paciente en la lista de espera cuando se libera un espacio
 * @param {number} profesionalId - ID del profesional
 * @param {string} fecha - Fecha de la cita liberada (YYYY-MM-DD)
 * @param {string} hora - Hora de la cita liberada (HH:MM)
 */
export async function notificarListaEspera(profesionalId, fecha, hora) {
  try {
    // Verificar si la oferta automática está habilitada
    const autoOfferEnabled = await obtenerConfiguracion('auto_offer_enabled');
    if (!autoOfferEnabled) {
      console.log('Oferta automática está deshabilitada en configuraciones');
      return null;
    }

    // Primero obtener la especialidad del profesional
    const [profesionalInfo] = await pool.execute(
      `SELECT especialidad_id FROM profesionales WHERE id = ?`,
      [profesionalId]
    );

    if (profesionalInfo.length === 0) {
      console.log('Profesional no encontrado');
      return null;
    }

    const especialidadId = profesionalInfo[0].especialidad_id;

    console.log(`Buscando lista de espera: profesionalId=${profesionalId}, especialidadId=${especialidadId}`);

    // Primero verificar que hay pacientes en la lista de espera (excluyendo los que ya tienen cita asignada)
    const [verificacion] = await pool.execute(
      `SELECT COUNT(*) as total 
       FROM lista_espera le
       WHERE le.especialidad_id = ?
       AND le.oferta_activa = FALSE
       AND le.fecha_asignacion IS NULL`,
      [especialidadId]
    );
    console.log(`Total pacientes en lista espera (especialidad ${especialidadId}, sin oferta activa, sin cita asignada): ${verificacion[0].total}`);

    // Obtener configuraciones de prioridad
    const prioridadAdultosMayores = await obtenerConfiguracion('prioridad_adultos_mayores');
    const prioridadUrgentes = await obtenerConfiguracion('prioridad_urgentes');
    const prioridadTiempoEspera = await obtenerConfiguracion('prioridad_tiempo_espera');

    // Construir query de priorización dinámica
    let orderByClause = `
      CASE 
        WHEN le.profesional_id = ? THEN 1
        WHEN le.profesional_id IS NULL THEN 2
        ELSE 3
      END`;
    
    // Agregar prioridades según configuración
    if (prioridadAdultosMayores) {
      orderByClause += `, CASE WHEN TIMESTAMPDIFF(YEAR, pa.fecha_nacimiento, CURDATE()) >= 65 THEN 1 ELSE 2 END`;
    }
    if (prioridadUrgentes) {
      // Asumimos que los casos urgentes tienen prioridad = 1
      orderByClause += `, le.prioridad ASC`;
    }
    if (prioridadTiempoEspera) {
      orderByClause += `, le.fecha_registro ASC`;
    } else {
      // Si no se prioriza por tiempo, usar prioridad numérica
      orderByClause += `, le.prioridad ASC, le.fecha_registro ASC`;
    }

    // Buscar pacientes en lista de espera para este profesional o especialidad
    // Prioridad: 1) Pacientes que esperan específicamente a este profesional
    //            2) Pacientes que esperan cualquier profesional de esta especialidad (profesional_id IS NULL)
    //            3) Pacientes que esperan otro profesional de la misma especialidad (como fallback)
    // Excluir pacientes que ya tienen fecha_asignacion (ya tienen cita asignada)
    const [listaEspera] = await pool.execute(
      `SELECT le.id, le.paciente_id, le.especialidad_id, le.profesional_id, le.canal_preferido,
              pa.nombre_completo, pa.telefono, pa.dni, pa.fecha_nacimiento,
              pr.nombre_completo as profesional_nombre,
              e.nombre as especialidad_nombre
       FROM lista_espera le
       INNER JOIN pacientes pa ON le.paciente_id = pa.id
       INNER JOIN especialidades e ON le.especialidad_id = e.id
       LEFT JOIN profesionales pr ON le.profesional_id = pr.id
       WHERE le.oferta_activa = FALSE
       AND le.especialidad_id = ?
       AND le.fecha_asignacion IS NULL
       AND pa.telefono IS NOT NULL
       AND TRIM(pa.telefono) != ''
       ORDER BY ${orderByClause}
       LIMIT 1`,
      [especialidadId, profesionalId]
    );

    console.log(`Encontrados ${listaEspera.length} pacientes en lista de espera`);

    if (listaEspera.length === 0) {
      // Debug: verificar por qué no se encuentran pacientes
      const [debugEspecialidad] = await pool.execute(
        `SELECT COUNT(*) as total FROM lista_espera WHERE especialidad_id = ? AND oferta_activa = FALSE AND fecha_asignacion IS NULL`,
        [especialidadId]
      );
      const [debugProfesional] = await pool.execute(
        `SELECT COUNT(*) as total FROM lista_espera WHERE profesional_id = ? AND oferta_activa = FALSE AND fecha_asignacion IS NULL`,
        [profesionalId]
      );
      
      // Verificar pacientes sin teléfono
      const [debugSinTelefono] = await pool.execute(
        `SELECT COUNT(*) as total 
         FROM lista_espera le
         INNER JOIN pacientes pa ON le.paciente_id = pa.id
         WHERE le.especialidad_id = ? 
         AND le.oferta_activa = FALSE
         AND le.fecha_asignacion IS NULL
         AND (le.profesional_id IS NULL OR le.profesional_id = ?)
         AND (pa.telefono IS NULL OR TRIM(pa.telefono) = '')`,
        [especialidadId, profesionalId]
      );
      
      // Verificar pacientes CON teléfono pero que no se están encontrando
      const [debugConTelefono] = await pool.execute(
        `SELECT le.id, le.paciente_id, le.profesional_id, pa.telefono, pa.nombre_completo
         FROM lista_espera le
         INNER JOIN pacientes pa ON le.paciente_id = pa.id
         WHERE le.especialidad_id = ? 
         AND le.oferta_activa = FALSE
         AND le.fecha_asignacion IS NULL
         AND pa.telefono IS NOT NULL
         AND TRIM(pa.telefono) != ''`,
        [especialidadId]
      );
      
      // Verificar pacientes con oferta activa
      const [debugOfertaActiva] = await pool.execute(
        `SELECT COUNT(*) as total FROM lista_espera WHERE especialidad_id = ? AND oferta_activa = TRUE`,
        [especialidadId]
      );
      
      // Obtener detalles del primer paciente en lista de espera para debug
      const [debugDetalles] = await pool.execute(
        `SELECT le.id, le.profesional_id, le.oferta_activa, pa.telefono, pa.nombre_completo
         FROM lista_espera le
         INNER JOIN pacientes pa ON le.paciente_id = pa.id
         WHERE le.especialidad_id = ?
         ORDER BY le.fecha_registro ASC
         LIMIT 1`,
        [especialidadId]
      );
      
      console.log(`Debug - Lista espera especialidad ${especialidadId}: ${debugEspecialidad[0].total}`);
      console.log(`Debug - Lista espera profesional ${profesionalId}: ${debugProfesional[0].total}`);
      console.log(`Debug - Sin teléfono: ${debugSinTelefono[0].total}`);
      console.log(`Debug - Con teléfono (pero no encontrados): ${debugConTelefono.length}`);
      if (debugConTelefono.length > 0) {
        console.log(`Debug - Pacientes con teléfono:`, debugConTelefono);
      }
      console.log(`Debug - Con oferta activa: ${debugOfertaActiva[0].total}`);
      if (debugDetalles.length > 0) {
        console.log(`Debug - Primer paciente: ${JSON.stringify(debugDetalles[0])}`);
      }
      
      return null;
    }

    const paciente = listaEspera[0];
    
    // Obtener información del profesional
    const [profesionalRows] = await pool.execute(
      `SELECT p.id, p.nombre_completo, e.nombre as especialidad
       FROM profesionales p
       INNER JOIN especialidades e ON p.especialidad_id = e.id
       WHERE p.id = ?`,
      [profesionalId]
    );

    if (profesionalRows.length === 0) {
      console.log('Profesional no encontrado');
      return null;
    }

    const profesional = profesionalRows[0];

    // Crear objeto de cita para el template
    const cita = {
      fecha,
      hora,
      doctor: profesional.nombre_completo,
      specialty: profesional.especialidad
    };

    // Obtener tiempo máximo de oferta desde configuraciones
    const tiempoMaxOferta = await obtenerConfiguracion('tiempo_max_oferta');
    
    // Marcar oferta como activa y establecer expiración
    // Guardar información de la cita ofrecida para poder crearla después
    const fechaExpiracion = new Date();
    fechaExpiracion.setMinutes(fechaExpiracion.getMinutes() + tiempoMaxOferta);

    await pool.execute(
      `UPDATE lista_espera 
       SET oferta_activa = TRUE, 
           fecha_expiracion_oferta = ?,
           fecha_oferta = ?,
           hora_oferta = ?,
           profesional_oferta_id = ?
       WHERE id = ?`,
      [fechaExpiracion, fecha, hora + ':00', profesionalId, paciente.id]
    );

    // Enviar notificación
    const canal = paciente.canal_preferido || 'SMS';
    await enviarOfertaListaEspera(cita, paciente, canal, tiempoMaxOferta);

    console.log(`Notificación enviada a paciente ${paciente.nombre_completo} (${paciente.telefono})`);

    return {
      listaEsperaId: paciente.id,
      pacienteId: paciente.paciente_id,
      telefono: paciente.telefono,
      fechaExpiracion
    };
  } catch (error) {
    console.error('Error notificando lista de espera:', error);
    throw error;
  }
}

/**
 * Procesa respuesta de un paciente a una oferta de lista de espera
 * @param {string} telefono - Número de teléfono del paciente
 * @param {string} mensaje - Mensaje recibido
 * @param {string} fecha - Fecha de la cita ofrecida (YYYY-MM-DD)
 * @param {string} hora - Hora de la cita ofrecida (HH:MM)
 * @param {number} profesionalId - ID del profesional
 * @returns {Promise<Object>}
 */
export async function procesarRespuestaListaEspera(telefono, mensaje, fecha, hora, profesionalId) {
  const mensajeNormalizado = mensaje.trim().toUpperCase();
  
  console.log(`🔍 Procesando respuesta lista de espera: telefono=${telefono}, mensaje="${mensaje}"`);
  console.log(`📞 Formato original del teléfono: "${telefono}"`);

  // Limpiar número de teléfono - Twilio puede enviar en formato +51943958912 o solo 943958912
  // También puede venir con prefijos como "whatsapp:" o espacios
  let telefonoLimpio = telefono.replace(/whatsapp:/gi, '').replace(/\D/g, '');
  
  // Si tiene código de país (+51 para Perú), extraer solo los últimos 9 dígitos
  // Si es un número peruano (empieza con 9), tomar los últimos 9 dígitos
  let telefonoBusqueda;
  if (telefonoLimpio.length >= 9) {
    // Tomar los últimos 9 dígitos (formato peruano)
    telefonoBusqueda = telefonoLimpio.slice(-9);
  } else {
    // Si es muy corto, usar todo
    telefonoBusqueda = telefonoLimpio;
  }
  
  console.log(`📞 Teléfono limpio: ${telefonoLimpio}, búsqueda: ${telefonoBusqueda}`);
  
  // También buscar con diferentes formatos para debugging
  console.log(`🔍 Buscando ofertas con teléfono: ${telefonoBusqueda}`);

  // Buscar oferta activa para este teléfono con información de la cita ofrecida
  // Buscar con diferentes formatos del teléfono
  const [ofertas] = await pool.execute(
    `SELECT le.id, le.paciente_id, le.profesional_id, le.especialidad_id, le.fecha_expiracion_oferta,
            le.fecha_oferta, le.hora_oferta, le.profesional_oferta_id,
            pa.nombre_completo, pa.telefono, pa.dni
     FROM lista_espera le
     INNER JOIN pacientes pa ON le.paciente_id = pa.id
     WHERE le.oferta_activa = TRUE
     AND (
       REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') LIKE ?
       OR REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') LIKE ?
       OR REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') = ?
     )
     AND le.fecha_expiracion_oferta > NOW()
     ORDER BY le.fecha_expiracion_oferta ASC
     LIMIT 1`,
    [`%${telefonoBusqueda}%`, `%${telefonoLimpio}%`, telefonoBusqueda]
  );
  
  console.log(`🔎 Ofertas encontradas: ${ofertas.length}`);
  if (ofertas.length > 0) {
    console.log(`📋 Oferta encontrada:`, {
      id: ofertas[0].id,
      paciente: ofertas[0].nombre_completo,
      telefono_bd: ofertas[0].telefono,
      fecha_oferta: ofertas[0].fecha_oferta,
      hora_oferta: ofertas[0].hora_oferta
    });
  } else {
    // Debug: buscar todas las ofertas activas para ver qué hay
    const [debugOfertas] = await pool.execute(
      `SELECT le.id, le.paciente_id, pa.telefono, pa.nombre_completo, 
              le.fecha_expiracion_oferta, le.oferta_activa,
              REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') as telefono_limpio
       FROM lista_espera le
       INNER JOIN pacientes pa ON le.paciente_id = pa.id
       WHERE le.oferta_activa = TRUE`
    );
    console.log(`🔍 Debug - Total ofertas activas (sin filtro de fecha): ${debugOfertas.length}`);
    debugOfertas.forEach((o, i) => {
      const telLimpio = o.telefono.replace(/\D/g, '').slice(-9);
      const telLimpio2 = o.telefono_limpio.replace(/\D/g, '').slice(-9);
      console.log(`  Oferta ${i + 1}:`);
      console.log(`    - paciente: ${o.nombre_completo}`);
      console.log(`    - tel BD: ${o.telefono}`);
      console.log(`    - tel limpio BD: ${telLimpio2}`);
      console.log(`    - tel búsqueda: ${telefonoBusqueda}`);
      console.log(`    - coincide: ${telLimpio2.includes(telefonoBusqueda) || telefonoBusqueda.includes(telLimpio2)}`);
      console.log(`    - fecha_expiracion: ${o.fecha_expiracion_oferta}`);
      console.log(`    - fecha_expiracion > NOW(): ${o.fecha_expiracion_oferta ? new Date(o.fecha_expiracion_oferta) > new Date() : 'NULL'}`);
    });
    
    // Buscar también sin filtro de fecha para ver si el problema es la expiración
    const [ofertasSinFecha] = await pool.execute(
      `SELECT le.id, le.paciente_id, le.profesional_id, le.especialidad_id, le.fecha_expiracion_oferta,
              le.fecha_oferta, le.hora_oferta, le.profesional_oferta_id,
              pa.nombre_completo, pa.telefono, pa.dni
       FROM lista_espera le
       INNER JOIN pacientes pa ON le.paciente_id = pa.id
       WHERE le.oferta_activa = TRUE
       AND (
         REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') LIKE ?
         OR REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') LIKE ?
         OR REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') = ?
       )
       ORDER BY le.fecha_expiracion_oferta DESC
       LIMIT 1`,
      [`%${telefonoBusqueda}%`, `%${telefonoLimpio}%`, telefonoBusqueda]
    );
    
    if (ofertasSinFecha.length > 0) {
      console.log(`⚠️ Oferta encontrada SIN filtro de fecha:`, ofertasSinFecha[0]);
      const oferta = ofertasSinFecha[0];
      const fechaExp = oferta.fecha_expiracion_oferta;
      const ahora = new Date();
      const expiracion = fechaExp ? new Date(fechaExp) : null;
      
      if (expiracion && expiracion <= ahora) {
        console.log(`❌ Oferta EXPIRADA. Fecha expiración: ${fechaExp}, Ahora: ${ahora}`);
        // La oferta expiró, pero podemos procesarla si el usuario respondió rápido
        // Considerar una ventana de gracia de 5 minutos adicionales
        const ventanaGracia = new Date(ahora.getTime() + 5 * 60 * 1000);
        if (expiracion > ventanaGracia) {
          return { success: false, error: 'La oferta ha expirado. Por favor, espere una nueva notificación.' };
        }
        console.log(`⚠️ Oferta expirada pero dentro de ventana de gracia, procesando...`);
      }
      
      // Usar esta oferta aunque haya expirado (dentro de ventana de gracia)
      ofertas.push(oferta);
    }
  }

  // Si no se encontró oferta con filtro de fecha, buscar sin filtro (puede haber expirado recientemente)
  if (ofertas.length === 0) {
    console.log(`⚠️ No se encontró oferta con fecha válida, buscando sin filtro de fecha...`);
    
    // Buscar sin filtro de fecha para ver si expiró recientemente
    const [ofertasExpiradas] = await pool.execute(
      `SELECT le.id, le.paciente_id, le.profesional_id, le.especialidad_id, le.fecha_expiracion_oferta,
              le.fecha_oferta, le.hora_oferta, le.profesional_oferta_id,
              pa.nombre_completo, pa.telefono, pa.dni
       FROM lista_espera le
       INNER JOIN pacientes pa ON le.paciente_id = pa.id
       WHERE le.oferta_activa = TRUE
       AND (
         REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') LIKE ?
         OR REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') LIKE ?
         OR REPLACE(REPLACE(pa.telefono, ' ', ''), '-', '') = ?
       )
       ORDER BY le.fecha_expiracion_oferta DESC
       LIMIT 1`,
      [`%${telefonoBusqueda}%`, `%${telefonoLimpio}%`, telefonoBusqueda]
    );
    
    if (ofertasExpiradas.length > 0) {
      const ofertaExp = ofertasExpiradas[0];
      const fechaExp = ofertaExp.fecha_expiracion_oferta;
      const ahora = new Date();
      const expiracion = fechaExp ? new Date(fechaExp) : null;
      
      console.log(`📅 Oferta encontrada (puede estar expirada):`);
      console.log(`   - Fecha expiración: ${fechaExp}`);
      console.log(`   - Ahora: ${ahora}`);
      console.log(`   - Diferencia: ${expiracion ? Math.round((ahora - expiracion) / 1000 / 60) : 'N/A'} minutos`);
      
      // Ventana de gracia: 30 minutos después de expirar
      if (expiracion) {
        const minutosExpirados = (ahora - expiracion) / 1000 / 60;
        if (minutosExpirados > 30) {
          console.log(`❌ Oferta expirada hace más de 30 minutos (${Math.round(minutosExpirados)} min), rechazando...`);
          // Desactivar oferta expirada
          await pool.execute(
            `UPDATE lista_espera SET oferta_activa = FALSE WHERE id = ?`,
            [ofertaExp.id]
          );
          return { success: false, error: 'La oferta ha expirado. Por favor, espere una nueva notificación.' };
        } else if (minutosExpirados > 0) {
          console.log(`⚠️ Oferta expirada hace ${Math.round(minutosExpirados)} minutos, pero dentro de ventana de gracia, procesando...`);
        }
      }
      
      // Usar esta oferta (dentro de ventana de gracia)
      ofertas.push(ofertaExp);
    }
  }

  if (ofertas.length === 0) {
    console.error(`❌ No se encontró ninguna oferta activa para el teléfono ${telefonoBusqueda}`);
    return { success: false, error: 'No se encontró oferta activa. Por favor, espere una nueva notificación o contacte con el centro médico.' };
  }

  const oferta = ofertas[0];
  console.log(`✅ Oferta encontrada: ID=${oferta.id}, paciente=${oferta.nombre_completo}`);
  
  // Obtener fecha, hora y profesional de la oferta
  let fechaOferta = null;
  let horaOferta = null;
  
  if (oferta.fecha_oferta) {
    if (oferta.fecha_oferta instanceof Date) {
      fechaOferta = oferta.fecha_oferta.toISOString().split('T')[0];
    } else {
      fechaOferta = oferta.fecha_oferta.toString().split('T')[0];
    }
  }
  
  if (oferta.hora_oferta) {
    if (oferta.hora_oferta instanceof Date) {
      const timeStr = oferta.hora_oferta.toTimeString();
      horaOferta = timeStr.substring(0, 5);
    } else if (typeof oferta.hora_oferta === 'string') {
      horaOferta = oferta.hora_oferta.substring(0, 5);
    } else {
      horaOferta = oferta.hora_oferta.toString().substring(0, 5);
    }
  }
  
  const profesionalOfertaId = oferta.profesional_oferta_id || profesionalId;
  
  console.log(`📋 Datos de oferta desde BD: fecha_oferta=${oferta.fecha_oferta}, hora_oferta=${oferta.hora_oferta}`);
  console.log(`📋 Datos procesados: fechaOferta=${fechaOferta}, horaOferta=${horaOferta}, profesionalOfertaId=${profesionalOfertaId}`);
  
  // Si no se pasaron parámetros, usar los de la oferta
  const fechaFinal = fecha || fechaOferta;
  const horaFinal = hora || horaOferta;
  const profesionalFinal = profesionalId || profesionalOfertaId;
  
  if (!fechaFinal || !horaFinal || !profesionalFinal) {
    console.error(`❌ Faltan datos para crear la cita: fecha=${fechaFinal}, hora=${horaFinal}, profesional=${profesionalFinal}`);
    return { 
      success: false, 
      error: 'Error: faltan datos de la oferta. Por favor, contacte con el centro médico.' 
    };
  }

  if (mensajeNormalizado.includes('ACEPTAR') || mensajeNormalizado.includes('SI') || mensajeNormalizado === 'S') {
    console.log('✅ Respuesta ACEPTAR detectada');
    console.log(`📅 Datos de la oferta: fecha=${fechaFinal}, hora=${horaFinal}, profesional=${profesionalFinal}`);
    
    try {
      // Validar que el profesional existe y está disponible
      const [profesionalRows] = await pool.execute(
        `SELECT id, estado FROM profesionales WHERE id = ?`,
        [profesionalFinal]
      );
      
      if (profesionalRows.length === 0) {
        console.error(`❌ Profesional ${profesionalFinal} no encontrado`);
        throw new Error('Profesional no encontrado');
      }
      
      if (profesionalRows[0].estado !== 'disponible') {
        console.error(`❌ Profesional ${profesionalFinal} no está disponible`);
        throw new Error('El profesional no está disponible');
      }
      
      // Validar que no haya conflicto de horarios
      const [conflictos] = await pool.execute(
        `SELECT id FROM citas 
         WHERE profesional_id = ? 
         AND fecha = ? 
         AND hora = ? 
         AND estado IN ('pendiente', 'confirmada')`,
        [profesionalFinal, fechaFinal, horaFinal + ':00']
      );
      
      if (conflictos.length > 0) {
        console.warn(`⚠️ Conflicto de horario detectado para profesional ${profesionalFinal}, fecha ${fechaFinal}, hora ${horaFinal}`);
        // Desactivar oferta ya que el espacio ya fue tomado
        await pool.execute(
          `UPDATE lista_espera 
           SET oferta_activa = FALSE
           WHERE id = ?`,
          [oferta.id]
        );
        return { 
          success: false, 
          error: 'Lo sentimos, ese horario ya no está disponible. Continuará en la lista de espera.' 
        };
      }
      
      console.log(`📝 Creando cita: paciente_id=${oferta.paciente_id}, profesional_id=${profesionalFinal}, fecha=${fechaFinal}, hora=${horaFinal + ':00'}`);
      
      // Crear la cita
      const [result] = await pool.execute(
        `INSERT INTO citas (paciente_id, profesional_id, fecha, hora, estado) 
         VALUES (?, ?, ?, ?, 'pendiente')`,
        [oferta.paciente_id, profesionalFinal, fechaFinal, horaFinal + ':00']
      );
      
      console.log(`✅ Cita creada con ID: ${result.insertId}`);
      
      // Desactivar oferta y marcar como asignada
      await pool.execute(
        `UPDATE lista_espera 
         SET oferta_activa = FALSE, fecha_asignacion = NOW()
         WHERE id = ?`,
        [oferta.id]
      );

      console.log(`✅ Oferta desactivada. Lista espera ID: ${oferta.id}`);

      return {
        success: true,
        listaEsperaId: oferta.id,
        citaId: result.insertId,
        pacienteId: oferta.paciente_id,
        mensaje: `¡Excelente! Su cita ha sido reservada para el ${new Date(fechaFinal).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })} a las ${horaFinal}. Recibirá un recordatorio 24 horas antes.`
      };
    } catch (error) {
      console.error('❌ Error creando cita desde lista de espera:', error);
      console.error('Stack:', error.stack);
      return { 
        success: false, 
        error: 'Hubo un error al crear su cita. Por favor, contacte con el centro médico.' 
      };
    }
  } else if (mensajeNormalizado.includes('IGNORAR') || mensajeNormalizado.includes('NO') || mensajeNormalizado === 'N') {
    // Desactivar oferta y mantener en lista de espera
    await pool.execute(
      `UPDATE lista_espera 
       SET oferta_activa = FALSE
       WHERE id = ?`,
      [oferta.id]
    );

    return {
      success: true,
      listaEsperaId: oferta.id,
      mensaje: 'Entendido. Continuará en la lista de espera y será notificado cuando haya otro espacio disponible.'
    };
  } else {
    return { success: false, error: 'Respuesta no reconocida. Responda ACEPTAR para reservar o IGNORAR para continuar en lista de espera.' };
  }
}

/**
 * Limpia ofertas expiradas de la lista de espera
 */
export async function limpiarOfertasExpiradas() {
  try {
    // Solo limpiar ofertas que expiraron hace más de 30 minutos
    // Esto da tiempo para que los usuarios respondan incluso si la oferta expiró recientemente
    const [result] = await pool.execute(
      `UPDATE lista_espera 
       SET oferta_activa = FALSE
       WHERE oferta_activa = TRUE
       AND fecha_expiracion_oferta < DATE_SUB(NOW(), INTERVAL 30 MINUTE)`
    );

    if (result.affectedRows > 0) {
      console.log(`Se limpiaron ${result.affectedRows} ofertas expiradas (más de 30 min después de expirar)`);
    }

    return result.affectedRows;
  } catch (error) {
    console.error('Error limpiando ofertas expiradas:', error);
    throw error;
  }
}

