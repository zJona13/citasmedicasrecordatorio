-- Migración: Agregar campos para guardar información de ofertas en lista_espera
-- Ejecutar este script si ya tienes la base de datos creada

USE citas_medicas;

-- Agregar columnas para guardar información de la oferta
ALTER TABLE lista_espera 
ADD COLUMN IF NOT EXISTS fecha_oferta DATE NULL COMMENT 'Fecha de la cita ofrecida',
ADD COLUMN IF NOT EXISTS hora_oferta TIME NULL COMMENT 'Hora de la cita ofrecida',
ADD COLUMN IF NOT EXISTS profesional_oferta_id INT NULL COMMENT 'ID del profesional de la cita ofrecida';

-- Agregar índice para búsquedas más rápidas
ALTER TABLE lista_espera 
ADD INDEX IF NOT EXISTS idx_profesional_oferta (profesional_oferta_id);

