-- =====================================================
-- Script de migración: Tabla de Configuraciones
-- Sistema de Gestión de Citas Médicas
-- =====================================================

USE citas_medicas;

-- =====================================================
-- Tabla: configuraciones
-- Almacena todas las configuraciones del sistema
-- =====================================================
CREATE TABLE IF NOT EXISTS configuraciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE COMMENT 'Clave única de la configuración',
    valor TEXT COMMENT 'Valor de la configuración (puede ser JSON, texto, número, booleano)',
    tipo ENUM('boolean', 'string', 'number', 'json') DEFAULT 'string' COMMENT 'Tipo de dato del valor',
    descripcion TEXT COMMENT 'Descripción de la configuración',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clave (clave)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Valores por defecto
-- =====================================================

-- Recordatorios
INSERT INTO configuraciones (clave, valor, tipo, descripcion) VALUES
('reminder_48h_enabled', 'true', 'boolean', 'Habilitar recordatorio 48 horas antes de la cita'),
('reminder_24h_enabled', 'true', 'boolean', 'Habilitar recordatorio 24 horas antes de la cita'),
('canal_preferido', 'sms', 'string', 'Canal preferido para recordatorios: sms, app, ambos')
ON DUPLICATE KEY UPDATE valor = valor;

-- Lista de espera
INSERT INTO configuraciones (clave, valor, tipo, descripcion) VALUES
('auto_offer_enabled', 'true', 'boolean', 'Habilitar oferta automática de cupos liberados'),
('tiempo_max_oferta', '30', 'number', 'Tiempo máximo de oferta en minutos'),
('prioridad_adultos_mayores', 'true', 'boolean', 'Priorizar adultos mayores (65+)'),
('prioridad_urgentes', 'true', 'boolean', 'Priorizar casos urgentes'),
('prioridad_tiempo_espera', 'false', 'boolean', 'Priorizar por mayor tiempo de espera')
ON DUPLICATE KEY UPDATE valor = valor;

-- Mensajes personalizados
INSERT INTO configuraciones (clave, valor, tipo, descripcion) VALUES
('mensaje_confirmacion', 'Hola {nombre}, tienes cita el {fecha} a las {hora} en {especialidad}. Confirma respondiendo SÍ.', 'string', 'Plantilla de mensaje de confirmación'),
('mensaje_oferta_cupo', 'Hola {nombre}, hay un cupo disponible el {fecha} a las {hora}. ¿Lo aceptas? Responde en {tiempo} min.', 'string', 'Plantilla de mensaje de oferta de cupo')
ON DUPLICATE KEY UPDATE valor = valor;

-- Chatbot
INSERT INTO configuraciones (clave, valor, tipo, descripcion) VALUES
('chatbot_enabled', 'true', 'boolean', 'Habilitar chatbot'),
('chatbot_greeting', 'Hola! Soy tu asistente virtual de EsSalud. ¿En qué puedo ayudarte?', 'string', 'Mensaje de bienvenida del chatbot')
ON DUPLICATE KEY UPDATE valor = valor;

