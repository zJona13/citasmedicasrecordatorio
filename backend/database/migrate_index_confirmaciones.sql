-- =====================================================
-- Migración: Índice compuesto para optimizar consultas de confirmaciones
-- =====================================================
-- Este índice optimiza las consultas que buscan la última confirmación
-- por cita_id ordenada por fecha_envio DESC
-- =====================================================

USE citas_medicas;

-- Crear índice compuesto para optimizar la búsqueda de la última confirmación por cita
-- El índice incluye cita_id y fecha_envio para acelerar las consultas con ORDER BY fecha_envio DESC
CREATE INDEX IF NOT EXISTS idx_confirmaciones_cita_fecha 
ON confirmaciones (cita_id, fecha_envio DESC);

-- Nota: Si la base de datos no soporta IF NOT EXISTS, usar:
-- CREATE INDEX idx_confirmaciones_cita_fecha 
-- ON confirmaciones (cita_id, fecha_envio DESC);

