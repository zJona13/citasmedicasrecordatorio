/**
 * Servicio de sedes
 * Maneja la lógica de negocio para las sedes
 */
import { pool } from '../db.js';

/**
 * Obtiene todas las sedes activas
 */
export async function obtenerSedes() {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        id,
        nombre,
        codigo,
        direccion,
        telefono,
        email,
        ciudad,
        departamento,
        pais,
        activa,
        fecha_creacion,
        fecha_actualizacion
      FROM sedes
      WHERE activa = TRUE
      ORDER BY nombre ASC`
    );
    
    return rows;
  } catch (error) {
    console.error('Error obteniendo sedes:', error);
    throw error;
  }
}

/**
 * Obtiene todas las sedes (incluyendo inactivas)
 */
export async function obtenerTodasLasSedes() {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        id,
        nombre,
        codigo,
        direccion,
        telefono,
        email,
        ciudad,
        departamento,
        pais,
        activa,
        fecha_creacion,
        fecha_actualizacion
      FROM sedes
      ORDER BY nombre ASC`
    );
    
    return rows;
  } catch (error) {
    console.error('Error obteniendo todas las sedes:', error);
    throw error;
  }
}

/**
 * Obtiene una sede por ID
 */
export async function obtenerSedePorId(id) {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        id,
        nombre,
        codigo,
        direccion,
        telefono,
        email,
        ciudad,
        departamento,
        pais,
        activa,
        fecha_creacion,
        fecha_actualizacion
      FROM sedes
      WHERE id = ?`,
      [id]
    );
    
    if (rows.length === 0) {
      return null;
    }
    
    return rows[0];
  } catch (error) {
    console.error('Error obteniendo sede por ID:', error);
    throw error;
  }
}

/**
 * Obtiene la sede por defecto o la primera activa
 */
export async function obtenerSedePorDefecto() {
  try {
    // Intentar obtener la sede con código HLH-001 (Hospital Luis Heysen II)
    const [rows] = await pool.execute(
      `SELECT 
        id,
        nombre,
        codigo,
        direccion,
        telefono,
        email,
        ciudad,
        departamento,
        pais,
        activa,
        fecha_creacion,
        fecha_actualizacion
      FROM sedes
      WHERE codigo = 'HLH-001' AND activa = TRUE
      LIMIT 1`
    );
    
    if (rows.length > 0) {
      return rows[0];
    }
    
    // Si no existe, obtener la primera sede activa
    const [fallbackRows] = await pool.execute(
      `SELECT 
        id,
        nombre,
        codigo,
        direccion,
        telefono,
        email,
        ciudad,
        departamento,
        pais,
        activa,
        fecha_creacion,
        fecha_actualizacion
      FROM sedes
      WHERE activa = TRUE
      ORDER BY id ASC
      LIMIT 1`
    );
    
    return fallbackRows.length > 0 ? fallbackRows[0] : null;
  } catch (error) {
    console.error('Error obteniendo sede por defecto:', error);
    throw error;
  }
}

/**
 * Crea una nueva sede
 */
export async function crearSede(datosSede) {
  try {
    const {
      nombre,
      codigo,
      direccion,
      telefono,
      email,
      ciudad,
      departamento,
      pais = 'Perú',
      activa = true
    } = datosSede;
    
    // Validar campos requeridos
    if (!nombre || !codigo || !direccion) {
      throw new Error('Nombre, código y dirección son requeridos');
    }
    
    const [result] = await pool.execute(
      `INSERT INTO sedes 
        (nombre, codigo, direccion, telefono, email, ciudad, departamento, pais, activa)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nombre, codigo, direccion, telefono || null, email || null, ciudad || null, departamento || null, pais, activa]
    );
    
    return await obtenerSedePorId(result.insertId);
  } catch (error) {
    console.error('Error creando sede:', error);
    
    // Manejar error de duplicado de código
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('codigo')) {
      throw new Error('Ya existe una sede con ese código');
    }
    
    throw error;
  }
}

/**
 * Actualiza una sede
 */
export async function actualizarSede(id, datosSede) {
  try {
    const {
      nombre,
      codigo,
      direccion,
      telefono,
      email,
      ciudad,
      departamento,
      pais,
      activa
    } = datosSede;
    
    // Verificar que la sede existe
    const sedeExistente = await obtenerSedePorId(id);
    if (!sedeExistente) {
      throw new Error('Sede no encontrada');
    }
    
    // Construir query dinámicamente
    const updateFields = [];
    const updateParams = [];
    
    if (nombre !== undefined) {
      updateFields.push('nombre = ?');
      updateParams.push(nombre);
    }
    if (codigo !== undefined) {
      updateFields.push('codigo = ?');
      updateParams.push(codigo);
    }
    if (direccion !== undefined) {
      updateFields.push('direccion = ?');
      updateParams.push(direccion);
    }
    if (telefono !== undefined) {
      updateFields.push('telefono = ?');
      updateParams.push(telefono);
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateParams.push(email);
    }
    if (ciudad !== undefined) {
      updateFields.push('ciudad = ?');
      updateParams.push(ciudad);
    }
    if (departamento !== undefined) {
      updateFields.push('departamento = ?');
      updateParams.push(departamento);
    }
    if (pais !== undefined) {
      updateFields.push('pais = ?');
      updateParams.push(pais);
    }
    if (activa !== undefined) {
      updateFields.push('activa = ?');
      updateParams.push(activa);
    }
    
    if (updateFields.length === 0) {
      return sedeExistente;
    }
    
    updateParams.push(id);
    
    await pool.execute(
      `UPDATE sedes SET ${updateFields.join(', ')} WHERE id = ?`,
      updateParams
    );
    
    return await obtenerSedePorId(id);
  } catch (error) {
    console.error('Error actualizando sede:', error);
    
    // Manejar error de duplicado de código
    if (error.code === 'ER_DUP_ENTRY' && error.sqlMessage.includes('codigo')) {
      throw new Error('Ya existe una sede con ese código');
    }
    
    throw error;
  }
}

/**
 * Elimina una sede (soft delete marcándola como inactiva)
 */
export async function eliminarSede(id) {
  try {
    const sede = await obtenerSedePorId(id);
    if (!sede) {
      throw new Error('Sede no encontrada');
    }
    
    await pool.execute(
      `UPDATE sedes SET activa = FALSE WHERE id = ?`,
      [id]
    );
    
    return true;
  } catch (error) {
    console.error('Error eliminando sede:', error);
    throw error;
  }
}

