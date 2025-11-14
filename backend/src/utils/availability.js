/**
 * Utilidades para calcular disponibilidad de horarios de profesionales
 */
import { pool } from '../db.js';
import { obtenerDiaSemana, estaDentroDelHorario } from './horarios.js';

/**
 * Genera slots de tiempo entre dos horas
 * @param {string} horaInicio - Hora de inicio (HH:MM)
 * @param {string} horaFin - Hora de fin (HH:MM)
 * @param {number} intervaloMinutos - Intervalo en minutos (default: 30)
 * @returns {string[]} Array de horas en formato HH:MM
 */
function generarSlots(horaInicio, horaFin, intervaloMinutos = 30) {
  const slots = [];
  const [hInicio, mInicio] = horaInicio.split(':').map(Number);
  const [hFin, mFin] = horaFin.split(':').map(Number);
  
  const inicioMinutos = hInicio * 60 + mInicio;
  const finMinutos = hFin * 60 + mFin;
  
  for (let minutos = inicioMinutos; minutos < finMinutos; minutos += intervaloMinutos) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    slots.push(`${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
  }
  
  return slots;
}

/**
 * Obtiene las citas ocupadas de un profesional en un rango de fechas
 * @param {number} profesionalId - ID del profesional
 * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns {Promise<Array<{fecha: string, hora: string}>>}
 */
async function obtenerCitasOcupadas(profesionalId, fechaInicio, fechaFin) {
  const [rows] = await pool.execute(
    `SELECT DATE(fecha) as fecha, TIME(hora) as hora 
     FROM citas 
     WHERE profesional_id = ? 
     AND fecha >= ? 
     AND fecha <= ? 
     AND estado IN ('pendiente', 'confirmada')
     ORDER BY fecha, hora`,
    [profesionalId, fechaInicio, fechaFin]
  );
  
  return rows.map(row => ({
    fecha: row.fecha.toISOString().split('T')[0],
    hora: row.hora.substring(0, 5) // Formato HH:MM
  }));
}

/**
 * Calcula los horarios disponibles de un profesional para una semana
 * @param {number} profesionalId - ID del profesional
 * @param {string} fechaInicio - Fecha de inicio de la semana (YYYY-MM-DD)
 * @param {number} intervaloMinutos - Intervalo entre citas en minutos (default: 30)
 * @returns {Promise<Object>} Objeto con disponibilidad por día
 */
export async function calcularDisponibilidadSemanal(profesionalId, fechaInicio, intervaloMinutos = 30) {
  // Obtener información del profesional
  const [profesionalRows] = await pool.execute(
    `SELECT id, horario FROM profesionales WHERE id = ?`,
    [profesionalId]
  );
  
  if (profesionalRows.length === 0) {
    throw new Error('Profesional no encontrado');
  }
  
  const horarioProfesional = profesionalRows[0].horario;
  let horarioObj = null;
  
  if (horarioProfesional) {
    try {
      horarioObj = typeof horarioProfesional === 'string' 
        ? JSON.parse(horarioProfesional) 
        : horarioProfesional;
    } catch (e) {
      console.error('Error parsing horario:', e);
    }
  }
  
  // Calcular fecha de fin (7 días después)
  const fechaInicioObj = new Date(fechaInicio + 'T00:00:00');
  const fechaFinObj = new Date(fechaInicioObj);
  fechaFinObj.setDate(fechaFinObj.getDate() + 6);
  const fechaFin = fechaFinObj.toISOString().split('T')[0];
  
  // Obtener citas ocupadas
  const citasOcupadas = await obtenerCitasOcupadas(profesionalId, fechaInicio, fechaFin);
  
  // Crear mapa de citas ocupadas para búsqueda rápida
  const citasMap = new Map();
  citasOcupadas.forEach(cita => {
    const key = `${cita.fecha}_${cita.hora}`;
    citasMap.set(key, true);
  });
  
  // Calcular disponibilidad día por día
  const disponibilidad = {};
  let totalDisponibles = 0;
  let diasConDisponibilidad = 0;
  
  for (let i = 0; i < 7; i++) {
    const fechaActual = new Date(fechaInicioObj);
    fechaActual.setDate(fechaActual.getDate() + i);
    const fechaStr = fechaActual.toISOString().split('T')[0];
    const diaSemana = obtenerDiaSemana(fechaStr);
    
    // Si no hay horario configurado para este día, no hay disponibilidad
    if (!horarioObj || !horarioObj[diaSemana]) {
      disponibilidad[fechaStr] = {
        dia: diaSemana,
        disponible: false,
        slots: [],
        razon: 'Sin horario configurado'
      };
      continue;
    }
    
    const horarioDia = horarioObj[diaSemana];
    const slots = generarSlots(horarioDia.inicio, horarioDia.fin, intervaloMinutos);
    
    // Filtrar slots ocupados
    const slotsDisponibles = slots.filter(slot => {
      const key = `${fechaStr}_${slot}`;
      return !citasMap.has(key);
    });
    
    disponibilidad[fechaStr] = {
      dia: diaSemana,
      disponible: slotsDisponibles.length > 0,
      slots: slotsDisponibles,
      horario: {
        inicio: horarioDia.inicio,
        fin: horarioDia.fin
      }
    };
    
    if (slotsDisponibles.length > 0) {
      totalDisponibles += slotsDisponibles.length;
      diasConDisponibilidad++;
    }
  }
  
  return {
    fechaInicio,
    fechaFin,
    disponibilidad,
    resumen: {
      totalSlotsDisponibles: totalDisponibles,
      diasConDisponibilidad,
      semanaCompleta: totalDisponibles === 0
    }
  };
}

/**
 * Verifica si una semana está completamente ocupada
 * @param {number} profesionalId - ID del profesional
 * @param {string} fechaInicio - Fecha de inicio de la semana (YYYY-MM-DD)
 * @returns {Promise<boolean>}
 */
export async function estaSemanaCompleta(profesionalId, fechaInicio) {
  const disponibilidad = await calcularDisponibilidadSemanal(profesionalId, fechaInicio);
  return disponibilidad.resumen.semanaCompleta;
}

/**
 * Obtiene la siguiente semana con disponibilidad
 * @param {number} profesionalId - ID del profesional
 * @param {string} fechaInicio - Fecha de inicio de la semana actual (YYYY-MM-DD)
 * @param {number} maxSemanas - Número máximo de semanas a verificar (default: 4)
 * @returns {Promise<Object|null>} Disponibilidad de la siguiente semana o null si no hay
 */
export async function obtenerSiguienteSemanaDisponible(profesionalId, fechaInicio, maxSemanas = 4) {
  const fechaInicioObj = new Date(fechaInicio + 'T00:00:00');
  
  for (let i = 1; i <= maxSemanas; i++) {
    const fechaSiguiente = new Date(fechaInicioObj);
    fechaSiguiente.setDate(fechaSiguiente.getDate() + (i * 7));
    const fechaSiguienteStr = fechaSiguiente.toISOString().split('T')[0];
    
    const disponibilidad = await calcularDisponibilidadSemanal(profesionalId, fechaSiguienteStr);
    
    if (!disponibilidad.resumen.semanaCompleta) {
      return disponibilidad;
    }
  }
  
  return null;
}

