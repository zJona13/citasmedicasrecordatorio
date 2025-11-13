-- =====================================================
-- Script SQL para Sistema de Gestión de Citas Médicas
-- Base de datos: MySQL/MariaDB
-- =====================================================

-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS citas_medicas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE citas_medicas;

-- =====================================================
-- Eliminar tablas existentes (en orden inverso de dependencias)
-- =====================================================
DROP TABLE IF EXISTS lista_espera;
DROP TABLE IF EXISTS confirmaciones;
DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS pacientes;
DROP TABLE IF EXISTS profesionales;
DROP TABLE IF EXISTS especialidades;
DROP TABLE IF EXISTS usuarios;

-- =====================================================
-- Tabla: usuarios
-- Autenticación del sistema (login/registro)
-- =====================================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt de la contraseña',
    nombre_completo VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'recepcionista') NOT NULL DEFAULT 'recepcionista',
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_rol (rol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: especialidades
-- Catálogo de especialidades médicas
-- =====================================================
CREATE TABLE especialidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: profesionales
-- Información de médicos/profesionales
-- =====================================================
CREATE TABLE profesionales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL COMMENT 'Relación opcional con usuario del sistema',
    nombre_completo VARCHAR(255) NOT NULL,
    cmp VARCHAR(20) NOT NULL UNIQUE COMMENT 'Colegio Médico del Perú',
    especialidad_id INT NOT NULL,
    consultorio VARCHAR(50),
    horario JSON COMMENT 'Estructura: {"lunes": {"inicio": "08:00", "fin": "13:00"}, "martes": {"inicio": "13:00", "fin": "17:00"}, ...}',
    estado ENUM('disponible', 'ocupado', 'inactivo') DEFAULT 'disponible',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (especialidad_id) REFERENCES especialidades(id) ON DELETE RESTRICT,
    INDEX idx_especialidad (especialidad_id),
    INDEX idx_estado (estado),
    INDEX idx_cmp (cmp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: pacientes
-- Registro de pacientes
-- =====================================================
CREATE TABLE pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(20) NOT NULL UNIQUE COMMENT 'Documento Nacional de Identidad',
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    fecha_nacimiento DATE,
    direccion TEXT,
    estado ENUM('activo', 'inactivo') DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_dni (dni),
    INDEX idx_nombre (nombre_completo),
    INDEX idx_estado (estado),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: citas
-- Gestión de citas médicas
-- =====================================================
CREATE TABLE citas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    profesional_id INT NOT NULL,
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'cancelada', 'completada', 'no_show') DEFAULT 'pendiente',
    notas TEXT,
    es_excepcional BOOLEAN DEFAULT FALSE COMMENT 'Indica si la cita está fuera del horario del profesional',
    razon_excepcional ENUM('emergencia', 'caso_especial', 'extension_horario', 'otro') NULL COMMENT 'Razón por la cual la cita está fuera del horario',
    razon_adicional TEXT NULL COMMENT 'Razón adicional o detalle de la excepción',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE RESTRICT,
    INDEX idx_paciente (paciente_id),
    INDEX idx_profesional (profesional_id),
    INDEX idx_fecha (fecha),
    INDEX idx_estado (estado),
    INDEX idx_fecha_hora (fecha, hora)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: confirmaciones
-- Seguimiento de recordatorios enviados
-- =====================================================
CREATE TABLE confirmaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cita_id INT NOT NULL,
    canal ENUM('SMS', 'App', 'Email') NOT NULL,
    fecha_envio TIMESTAMP NOT NULL,
    estado_envio ENUM('entregado', 'pendiente', 'fallido') DEFAULT 'pendiente',
    respuesta ENUM('confirmada', 'rechazada', 'pendiente') DEFAULT 'pendiente',
    fecha_respuesta TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cita_id) REFERENCES citas(id) ON DELETE CASCADE,
    INDEX idx_cita (cita_id),
    INDEX idx_fecha_envio (fecha_envio),
    INDEX idx_estado_envio (estado_envio),
    INDEX idx_respuesta (respuesta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Tabla: lista_espera
-- Pacientes en espera de cupos
-- =====================================================
CREATE TABLE lista_espera (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    especialidad_id INT NOT NULL,
    prioridad INT DEFAULT 1 COMMENT '1 = Alta prioridad, mayor número = menor prioridad',
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    oferta_activa BOOLEAN DEFAULT FALSE,
    fecha_expiracion_oferta TIMESTAMP NULL,
    fecha_asignacion TIMESTAMP NULL COMMENT 'Fecha en que se asignó la cita',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id) ON DELETE CASCADE,
    FOREIGN KEY (especialidad_id) REFERENCES especialidades(id) ON DELETE RESTRICT,
    INDEX idx_paciente (paciente_id),
    INDEX idx_especialidad (especialidad_id),
    INDEX idx_prioridad (prioridad),
    INDEX idx_oferta_activa (oferta_activa),
    INDEX idx_fecha_registro (fecha_registro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Datos de ejemplo
-- =====================================================

-- Usuario administrador de ejemplo
-- Email: admin@essalud.gob.pe
-- Contraseña: admin123
-- Hash bcrypt generado para 'admin123' (10 rounds)
INSERT INTO usuarios (email, password, nombre_completo, rol, activo) VALUES
('admin@essalud.gob.pe', '$2b$10$LcbjtmExk2N7kb1ZkPtUHOBHRVZQSVF9KrPrOwB6nw4sXRzI9rAcm', 'Administrador del Sistema', 'admin', TRUE);

-- Especialidades médicas de ejemplo
INSERT INTO especialidades (nombre, descripcion, activo) VALUES
('Cardiología', 'Especialidad médica que se encarga del corazón y el sistema circulatorio', TRUE),
('Pediatría', 'Especialidad médica que se encarga de la salud de los niños', TRUE),
('Traumatología', 'Especialidad médica que se encarga del sistema musculoesquelético', TRUE),
('Neurología', 'Especialidad médica que se encarga del sistema nervioso', TRUE),
('Oftalmología', 'Especialidad médica que se encarga de los ojos y la visión', TRUE);

-- =====================================================
-- Fin del script
-- =====================================================