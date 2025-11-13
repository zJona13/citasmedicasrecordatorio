/**
 * Utilidades para manejo de horarios de profesionales
 */

const DIAS_SEMANA = {
  0: 'domingo',
  1: 'lunes',
  2: 'martes',
  3: 'miercoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sabado'
};

const DIAS_SEMANA_INVERSO = {
  'domingo': 0,
  'lunes': 1,
  'martes': 2,
  'miercoles': 3,
  'jueves': 4,
  'viernes': 5,
  'sabado': 6
};

/**
 * Obtiene el día de la semana en español a partir de una fecha
 * @param {Date|string} fecha - Fecha (Date object o string YYYY-MM-DD)
 * @returns {string} Día de la semana en español (lunes, martes, etc.)
 */
export function obtenerDiaSemana(fecha) {
  let dateObj;
  
  if (typeof fecha === 'string') {
    dateObj = new Date(fecha + 'T00:00:00');
  } else {
    dateObj = new Date(fecha);
  }
  
  const diaNumero = dateObj.getDay();
  return DIAS_SEMANA[diaNumero];
}

/**
 * Valida si una hora está dentro de un rango
 * @param {string} hora - Hora en formato HH:MM (ej: "14:30")
 * @param {string} horaInicio - Hora de inicio en formato HH:MM
 * @param {string} horaFin - Hora de fin en formato HH:MM
 * @returns {boolean} true si la hora está dentro del rango
 */
export function estaDentroDelHorario(hora, horaInicio, horaFin) {
  const [h, m] = hora.split(':').map(Number);
  const [hInicio, mInicio] = horaInicio.split(':').map(Number);
  const [hFin, mFin] = horaFin.split(':').map(Number);
  
  const minutosHora = h * 60 + m;
  const minutosInicio = hInicio * 60 + mInicio;
  const minutosFin = hFin * 60 + mFin;
  
  return minutosHora >= minutosInicio && minutosHora <= minutosFin;
}

/**
 * Valida la estructura de un horario
 * @param {object} horario - Objeto con horarios por día
 * @returns {object} { valido: boolean, error: string }
 */
export function validarEstructuraHorario(horario) {
  if (!horario || typeof horario !== 'object') {
    return { valido: false, error: 'El horario debe ser un objeto' };
  }
  
  const diasValidos = Object.keys(DIAS_SEMANA_INVERSO);
  
  for (const [dia, horarioDia] of Object.entries(horario)) {
    // Validar que el día sea válido
    if (!diasValidos.includes(dia)) {
      return { valido: false, error: `Día inválido: ${dia}. Días válidos: ${diasValidos.join(', ')}` };
    }
    
    // Validar estructura del horario del día
    if (!horarioDia || typeof horarioDia !== 'object') {
      return { valido: false, error: `El horario de ${dia} debe ser un objeto con inicio y fin` };
    }
    
    if (!horarioDia.inicio || !horarioDia.fin) {
      return { valido: false, error: `El horario de ${dia} debe tener inicio y fin` };
    }
    
    // Validar formato de horas (HH:MM)
    const formatoHora = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!formatoHora.test(horarioDia.inicio)) {
      return { valido: false, error: `Formato de hora de inicio inválido para ${dia}. Use HH:MM` };
    }
    
    if (!formatoHora.test(horarioDia.fin)) {
      return { valido: false, error: `Formato de hora de fin inválido para ${dia}. Use HH:MM` };
    }
    
    // Validar que hora inicio < hora fin
    if (!estaDentroDelHorario(horarioDia.fin, horarioDia.inicio, '23:59')) {
      return { valido: false, error: `La hora de fin debe ser mayor que la hora de inicio para ${dia}` };
    }
  }
  
  return { valido: true, error: null };
}

/**
 * Verifica si una cita está dentro del horario del profesional
 * @param {string} fecha - Fecha de la cita en formato YYYY-MM-DD
 * @param {string} hora - Hora de la cita en formato HH:MM
 * @param {object|string} horarioProfesional - Horario del profesional (JSON string o objeto)
 * @returns {object} { dentroHorario: boolean, dia: string, horarioDia: object|null }
 */
export function verificarHorarioCita(fecha, hora, horarioProfesional) {
  // Si no hay horario configurado, considerar que está dentro del horario
  if (!horarioProfesional) {
    return { dentroHorario: true, dia: null, horarioDia: null };
  }
  
  // Parsear horario si es string
  let horario;
  if (typeof horarioProfesional === 'string') {
    try {
      horario = JSON.parse(horarioProfesional);
    } catch (e) {
      // Si no se puede parsear, considerar que está dentro del horario
      return { dentroHorario: true, dia: null, horarioDia: null };
    }
  } else {
    horario = horarioProfesional;
  }
  
  // Obtener día de la semana
  const dia = obtenerDiaSemana(fecha);
  
  // Verificar si el día tiene horario configurado
  if (!horario[dia]) {
    return { dentroHorario: false, dia, horarioDia: null };
  }
  
  const horarioDia = horario[dia];
  const dentroHorario = estaDentroDelHorario(hora, horarioDia.inicio, horarioDia.fin);
  
  return { dentroHorario, dia, horarioDia };
}

/**
 * Formatea el horario para mostrar en texto
 * @param {object|string} horario - Horario del profesional
 * @returns {string} Texto formateado del horario
 */
export function formatearHorario(horario) {
  if (!horario) {
    return 'Sin horario configurado';
  }
  
  let horarioObj;
  if (typeof horario === 'string') {
    try {
      horarioObj = JSON.parse(horario);
    } catch (e) {
      return horario; // Retornar el texto original si no es JSON válido
    }
  } else {
    horarioObj = horario;
  }
  
  const dias = Object.keys(horarioObj);
  if (dias.length === 0) {
    return 'Sin horario configurado';
  }
  
  const partes = dias.map(dia => {
    const h = horarioObj[dia];
    const diaCapitalizado = dia.charAt(0).toUpperCase() + dia.slice(1);
    return `${diaCapitalizado}: ${h.inicio}-${h.fin}`;
  });
  
  return partes.join(', ');
}

