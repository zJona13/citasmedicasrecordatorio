-- =====================================================
-- Script de migración: Tabla de Sedes
-- Sistema de Gestión de Citas Médicas
-- =====================================================

USE citas_medicas;

-- =====================================================
-- Tabla: sedes
-- Almacena información de las sedes/hospitales
-- =====================================================
CREATE TABLE IF NOT EXISTS sedes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL COMMENT 'Nombre de la sede/hospital',
    codigo VARCHAR(50) NOT NULL UNIQUE COMMENT 'Código único de la sede',
    direccion TEXT NOT NULL COMMENT 'Dirección completa de la sede',
    telefono VARCHAR(20) COMMENT 'Teléfono de contacto',
    email VARCHAR(255) COMMENT 'Correo electrónico de contacto',
    ciudad VARCHAR(100) COMMENT 'Ciudad donde se encuentra la sede',
    departamento VARCHAR(100) COMMENT 'Departamento donde se encuentra la sede',
    pais VARCHAR(100) DEFAULT 'Perú' COMMENT 'País donde se encuentra la sede',
    activa BOOLEAN DEFAULT TRUE COMMENT 'Indica si la sede está activa',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_codigo (codigo),
    INDEX idx_activa (activa),
    INDEX idx_ciudad (ciudad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Inserción de sede por defecto: Hospital Luis Heysen II
-- =====================================================
INSERT INTO sedes (nombre, codigo, direccion, telefono, email, ciudad, departamento, pais, activa) VALUES
('Hospital Luis Heysen II', 'HLH-001', 'Chiclayo, Lambayeque, Perú', NULL, NULL, 'Chiclayo', 'Lambayeque', 'Perú', TRUE)
ON DUPLICATE KEY UPDATE nombre = nombre;

-- =====================================================
-- Actualizar tabla de configuraciones para incluir modo oscuro
-- =====================================================
INSERT INTO configuraciones (clave, valor, tipo, descripcion) VALUES
('dark_mode_enabled', 'false', 'boolean', 'Habilitar modo oscuro')
ON DUPLICATE KEY UPDATE valor = valor;

