-- =====================================================
-- Script SQL para Poblar Base de Datos con Datos de Prueba
-- Sistema de Gestión de Citas Médicas
-- Base de datos: MySQL/MariaDB
-- =====================================================

USE citas_medicas;

-- =====================================================
-- PROFESIONALES
-- Crear máximo de profesionales por especialidad
-- =====================================================

-- Cardiología (5 profesionales)
INSERT INTO profesionales (nombre_completo, cmp, especialidad_id, consultorio, horario, estado) VALUES
('Dr. Carlos Alberto Mendoza Ramírez', 'CMP-12345', 1, 'Consultorio 101', '{"lunes": {"inicio": "08:00", "fin": "13:00"}, "miercoles": {"inicio": "08:00", "fin": "13:00"}, "viernes": {"inicio": "08:00", "fin": "13:00"}}', 'disponible'),
('Dra. María Elena Torres Vargas', 'CMP-12346', 1, 'Consultorio 102', '{"martes": {"inicio": "08:00", "fin": "13:00"}, "jueves": {"inicio": "08:00", "fin": "13:00"}, "viernes": {"inicio": "14:00", "fin": "18:00"}}', 'disponible'),
('Dr. José Luis Fernández Soto', 'CMP-12347', 1, 'Consultorio 103', '{"lunes": {"inicio": "14:00", "fin": "18:00"}, "martes": {"inicio": "14:00", "fin": "18:00"}, "miercoles": {"inicio": "14:00", "fin": "18:00"}}', 'disponible'),
('Dra. Ana Patricia Gutiérrez Morales', 'CMP-12348', 1, 'Consultorio 104', '{"jueves": {"inicio": "14:00", "fin": "18:00"}, "viernes": {"inicio": "08:00", "fin": "13:00"}}', 'disponible'),
('Dr. Roberto Carlos Silva Díaz', 'CMP-12349', 1, 'Consultorio 105', '{"lunes": {"inicio": "08:00", "fin": "13:00"}, "martes": {"inicio": "08:00", "fin": "13:00"}, "miercoles": {"inicio": "08:00", "fin": "13:00"}, "jueves": {"inicio": "08:00", "fin": "13:00"}}', 'disponible');

-- Pediatría (5 profesionales)
INSERT INTO profesionales (nombre_completo, cmp, especialidad_id, consultorio, horario, estado) VALUES
('Dra. Carmen Rosa Huamán Quispe', 'CMP-12350', 2, 'Consultorio 201', '{"lunes": {"inicio": "08:00", "fin": "13:00"}, "martes": {"inicio": "08:00", "fin": "13:00"}, "miercoles": {"inicio": "08:00", "fin": "13:00"}}', 'disponible'),
('Dr. Fernando Augusto Paredes Rojas', 'CMP-12351', 2, 'Consultorio 202', '{"martes": {"inicio": "14:00", "fin": "18:00"}, "jueves": {"inicio": "14:00", "fin": "18:00"}, "viernes": {"inicio": "14:00", "fin": "18:00"}}', 'disponible'),
('Dra. Lucía Esperanza Cáceres López', 'CMP-12352', 2, 'Consultorio 203', '{"lunes": {"inicio": "14:00", "fin": "18:00"}, "miercoles": {"inicio": "14:00", "fin": "18:00"}, "viernes": {"inicio": "08:00", "fin": "13:00"}}', 'disponible'),
('Dr. Miguel Ángel Chávez Herrera', 'CMP-12353', 2, 'Consultorio 204', '{"martes": {"inicio": "08:00", "fin": "13:00"}, "jueves": {"inicio": "08:00", "fin": "13:00"}}', 'disponible'),
('Dra. Rosa María Delgado Campos', 'CMP-12354', 2, 'Consultorio 205', '{"lunes": {"inicio": "08:00", "fin": "13:00"}, "martes": {"inicio": "08:00", "fin": "13:00"}, "miercoles": {"inicio": "14:00", "fin": "18:00"}, "jueves": {"inicio": "14:00", "fin": "18:00"}, "viernes": {"inicio": "08:00", "fin": "13:00"}}', 'disponible');

-- Traumatología (5 profesionales)
INSERT INTO profesionales (nombre_completo, cmp, especialidad_id, consultorio, horario, estado) VALUES
('Dr. Luis Alberto Vega Martínez', 'CMP-12355', 3, 'Consultorio 301', '{"lunes": {"inicio": "08:00", "fin": "13:00"}, "martes": {"inicio": "08:00", "fin": "13:00"}, "jueves": {"inicio": "08:00", "fin": "13:00"}}', 'disponible'),
('Dra. Patricia Isabel Ramos Salazar', 'CMP-12356', 3, 'Consultorio 302', '{"martes": {"inicio": "14:00", "fin": "18:00"}, "miercoles": {"inicio": "14:00", "fin": "18:00"}, "viernes": {"inicio": "14:00", "fin": "18:00"}}', 'disponible'),
('Dr. Jorge Eduardo Medina Castro', 'CMP-12357', 3, 'Consultorio 303', '{"lunes": {"inicio": "14:00", "fin": "18:00"}, "miercoles": {"inicio": "08:00", "fin": "13:00"}, "viernes": {"inicio": "08:00", "fin": "13:00"}}', 'disponible'),
('Dra. Gladys Milagros Ortiz Peña', 'CMP-12358', 3, 'Consultorio 304', '{"martes": {"inicio": "08:00", "fin": "13:00"}, "jueves": {"inicio": "14:00", "fin": "18:00"}}', 'disponible'),
('Dr. Víctor Manuel Ríos Aguilar', 'CMP-12359', 3, 'Consultorio 305', '{"lunes": {"inicio": "08:00", "fin": "13:00"}, "martes": {"inicio": "08:00", "fin": "13:00"}, "miercoles": {"inicio": "08:00", "fin": "13:00"}, "jueves": {"inicio": "08:00", "fin": "13:00"}, "viernes": {"inicio": "14:00", "fin": "18:00"}}', 'disponible');

-- Neurología (5 profesionales)
INSERT INTO profesionales (nombre_completo, cmp, especialidad_id, consultorio, horario, estado) VALUES
('Dra. Elsa Beatriz Jiménez Ruiz', 'CMP-12360', 4, 'Consultorio 401', '{"lunes": {"inicio": "08:00", "fin": "13:00"}, "miercoles": {"inicio": "08:00", "fin": "13:00"}, "viernes": {"inicio": "08:00", "fin": "13:00"}}', 'disponible'),
('Dr. Ricardo Antonio Navarro Flores', 'CMP-12361', 4, 'Consultorio 402', '{"martes": {"inicio": "14:00", "fin": "18:00"}, "jueves": {"inicio": "14:00", "fin": "18:00"}}', 'disponible'),
('Dra. Mónica Alejandra Valdez Sánchez', 'CMP-12362', 4, 'Consultorio 403', '{"lunes": {"inicio": "14:00", "fin": "18:00"}, "martes": {"inicio": "08:00", "fin": "13:00"}, "miercoles": {"inicio": "14:00", "fin": "18:00"}}', 'disponible'),
('Dr. Daniel Francisco Espinoza Torres', 'CMP-12363', 4, 'Consultorio 404', '{"jueves": {"inicio": "08:00", "fin": "13:00"}, "viernes": {"inicio": "14:00", "fin": "18:00"}}', 'disponible'),
('Dra. Karina Elizabeth Mendoza Cáceres', 'CMP-12364', 4, 'Consultorio 405', '{"lunes": {"inicio": "08:00", "fin": "13:00"}, "martes": {"inicio": "08:00", "fin": "13:00"}, "miercoles": {"inicio": "08:00", "fin": "13:00"}, "jueves": {"inicio": "08:00", "fin": "13:00"}, "viernes": {"inicio": "08:00", "fin": "13:00"}}', 'disponible');

-- Oftalmología (5 profesionales)
INSERT INTO profesionales (nombre_completo, cmp, especialidad_id, consultorio, horario, estado) VALUES
('Dr. Oscar Raúl Palomino Gutiérrez', 'CMP-12365', 5, 'Consultorio 501', '{"lunes": {"inicio": "08:00", "fin": "13:00"}, "martes": {"inicio": "08:00", "fin": "13:00"}, "viernes": {"inicio": "08:00", "fin": "13:00"}}', 'disponible'),
('Dra. Liliana Margarita Cruz Paredes', 'CMP-12366', 5, 'Consultorio 502', '{"martes": {"inicio": "14:00", "fin": "18:00"}, "miercoles": {"inicio": "14:00", "fin": "18:00"}, "jueves": {"inicio": "14:00", "fin": "18:00"}}', 'disponible'),
('Dr. Hernán Walter Quiroz Vásquez', 'CMP-12367', 5, 'Consultorio 503', '{"lunes": {"inicio": "14:00", "fin": "18:00"}, "jueves": {"inicio": "08:00", "fin": "13:00"}, "viernes": {"inicio": "14:00", "fin": "18:00"}}', 'disponible'),
('Dra. Sonia Patricia Alvarado Ríos', 'CMP-12368', 5, 'Consultorio 504', '{"martes": {"inicio": "08:00", "fin": "13:00"}, "miercoles": {"inicio": "08:00", "fin": "13:00"}}', 'disponible'),
('Dr. Julio César Benavides Salas', 'CMP-12369', 5, 'Consultorio 505', '{"lunes": {"inicio": "08:00", "fin": "13:00"}, "martes": {"inicio": "08:00", "fin": "13:00"}, "miercoles": {"inicio": "08:00", "fin": "13:00"}, "jueves": {"inicio": "08:00", "fin": "13:00"}, "viernes": {"inicio": "08:00", "fin": "13:00"}}', 'disponible');

-- =====================================================
-- PACIENTES
-- Crear 100 pacientes con datos completos
-- =====================================================

INSERT INTO pacientes (dni, nombre_completo, telefono, email, fecha_nacimiento, direccion, estado) VALUES
('71234567', 'Juan Carlos Pérez García', '987654321', 'juan.perez@email.com', '1985-03-15', 'Av. Balta 123, Chiclayo', 'activo'),
('72345678', 'María Elena Rodríguez López', '987654322', 'maria.rodriguez@email.com', '1990-07-22', 'Jr. Elías Aguirre 456, Chiclayo', 'activo'),
('73456789', 'Carlos Alberto Martínez Sánchez', '987654323', 'carlos.martinez@email.com', '1988-11-30', 'Av. Bolognesi 789, Chiclayo', 'activo'),
('74567890', 'Ana Patricia González Torres', '987654324', 'ana.gonzalez@email.com', '1992-05-18', 'Jr. Unión 321, Chiclayo', 'activo'),
('75678901', 'Luis Fernando Herrera Díaz', '987654325', 'luis.herrera@email.com', '1987-09-25', 'Av. Sáenz Peña 654, Chiclayo', 'activo'),
('76789012', 'Carmen Rosa Vargas Morales', '987654326', 'carmen.vargas@email.com', '1995-01-12', 'Jr. San José 987, Chiclayo', 'activo'),
('77890123', 'Roberto Carlos Silva Ramírez', '987654327', 'roberto.silva@email.com', '1983-04-08', 'Av. Luis González 147, Chiclayo', 'activo'),
('78901234', 'Lucía Esperanza Cáceres Flores', '987654328', 'lucia.caceres@email.com', '1991-08-20', 'Jr. Pedro Ruiz 258, Chiclayo', 'activo'),
('79012345', 'Miguel Ángel Chávez Gutiérrez', '987654329', 'miguel.chavez@email.com', '1989-12-03', 'Av. José Leonardo Ortiz 369, Chiclayo', 'activo'),
('70123456', 'Rosa María Delgado Campos', '987654330', 'rosa.delgado@email.com', '1993-06-14', 'Jr. Grau 741, Chiclayo', 'activo'),
('71234568', 'Fernando Augusto Paredes Rojas', '987654331', 'fernando.paredes@email.com', '1986-02-28', 'Av. Miguel Grau 852, Chiclayo', 'activo'),
('72345679', 'Patricia Isabel Ramos Salazar', '987654332', 'patricia.ramos@email.com', '1994-10-07', 'Jr. La Victoria 963, Chiclayo', 'activo'),
('73456790', 'Jorge Eduardo Medina Castro', '987654333', 'jorge.medina@email.com', '1984-03-19', 'Av. Víctor Raúl Haya de la Torre 159, Chiclayo', 'activo'),
('74567891', 'Gladys Milagros Ortiz Peña', '987654334', 'gladys.ortiz@email.com', '1990-07-05', 'Jr. Pomalca 357, Chiclayo', 'activo'),
('75678902', 'Víctor Manuel Ríos Aguilar', '987654335', 'victor.rios@email.com', '1988-11-16', 'Av. Balta 468, La Victoria, Chiclayo', 'activo'),
('76789013', 'Elsa Beatriz Jiménez Ruiz', '987654336', 'elsa.jimenez@email.com', '1992-05-27', 'Jr. Elías Aguirre 579, Chiclayo', 'activo'),
('77890124', 'Ricardo Antonio Navarro Flores', '987654337', 'ricardo.navarro@email.com', '1987-09-08', 'Av. Bolognesi 680, Chiclayo', 'activo'),
('78901235', 'Mónica Alejandra Valdez Sánchez', '987654338', 'monica.valdez@email.com', '1995-01-29', 'Jr. Unión 791, Chiclayo', 'activo'),
('79012346', 'Daniel Francisco Espinoza Torres', '987654339', 'daniel.espinoza@email.com', '1983-04-10', 'Av. Sáenz Peña 802, Chiclayo', 'activo'),
('70123457', 'Karina Elizabeth Mendoza Cáceres', '987654340', 'karina.mendoza@email.com', '1991-08-21', 'Jr. San José 913, Chiclayo', 'activo'),
('71234569', 'Oscar Raúl Palomino Gutiérrez', '987654341', 'oscar.palomino@email.com', '1989-12-02', 'Av. Luis González 024, Chiclayo', 'activo'),
('72345680', 'Liliana Margarita Cruz Paredes', '987654342', 'liliana.cruz@email.com', '1993-06-13', 'Jr. Pedro Ruiz 135, Chiclayo', 'activo'),
('73456791', 'Hernán Walter Quiroz Vásquez', '987654343', 'hernan.quiroz@email.com', '1986-02-24', 'Av. José Leonardo Ortiz 246, Chiclayo', 'activo'),
('74567892', 'Sonia Patricia Alvarado Ríos', '987654344', 'sonia.alvarado@email.com', '1994-10-05', 'Jr. Grau 357, Chiclayo', 'activo'),
('75678903', 'Julio César Benavides Salas', '987654345', 'julio.benavides@email.com', '1984-03-16', 'Av. Miguel Grau 468, Chiclayo', 'activo'),
('76789014', 'Pedro Antonio Huamán Quispe', '987654346', 'pedro.huaman@email.com', '1990-07-27', 'Jr. La Victoria 579, Chiclayo', 'activo'),
('77890125', 'Elena Beatriz Torres Vargas', '987654347', 'elena.torres@email.com', '1988-11-08', 'Av. Víctor Raúl Haya de la Torre 680, Chiclayo', 'activo'),
('78901236', 'José Luis Fernández Soto', '987654348', 'jose.fernandez@email.com', '1992-05-19', 'Jr. Pomalca 791, Chiclayo', 'activo'),
('79012347', 'Ana María Gutiérrez Morales', '987654349', 'ana.gutierrez@email.com', '1987-09-30', 'Av. Balta 802, La Victoria, Chiclayo', 'activo'),
('70123458', 'Roberto Carlos Silva Díaz', '987654350', 'roberto.silva2@email.com', '1995-01-11', 'Jr. Elías Aguirre 913, Chiclayo', 'activo'),
('71234570', 'Carmen Rosa Huamán Quispe', '987654351', 'carmen.huaman@email.com', '1983-04-22', 'Av. Bolognesi 024, Chiclayo', 'activo'),
('72345681', 'Fernando Augusto Paredes Rojas', '987654352', 'fernando.paredes2@email.com', '1991-08-03', 'Jr. Unión 135, Chiclayo', 'activo'),
('73456792', 'Lucía Esperanza Cáceres López', '987654353', 'lucia.caceres2@email.com', '1989-12-14', 'Av. Sáenz Peña 246, Chiclayo', 'activo'),
('74567893', 'Miguel Ángel Chávez Herrera', '987654354', 'miguel.chavez2@email.com', '1993-06-25', 'Jr. San José 357, Chiclayo', 'activo'),
('75678904', 'Rosa María Delgado Campos', '987654355', 'rosa.delgado2@email.com', '1986-02-06', 'Av. Luis González 468, Chiclayo', 'activo'),
('76789015', 'Luis Alberto Vega Martínez', '987654356', 'luis.vega@email.com', '1994-10-17', 'Jr. Pedro Ruiz 579, Chiclayo', 'activo'),
('77890126', 'Patricia Isabel Ramos Salazar', '987654357', 'patricia.ramos2@email.com', '1984-03-28', 'Av. José Leonardo Ortiz 680, Chiclayo', 'activo'),
('78901237', 'Jorge Eduardo Medina Castro', '987654358', 'jorge.medina2@email.com', '1990-07-09', 'Jr. Grau 791, Chiclayo', 'activo'),
('79012348', 'Gladys Milagros Ortiz Peña', '987654359', 'gladys.ortiz2@email.com', '1988-11-20', 'Av. Miguel Grau 802, Chiclayo', 'activo'),
('70123459', 'Víctor Manuel Ríos Aguilar', '987654360', 'victor.rios2@email.com', '1992-05-01', 'Jr. La Victoria 913, Chiclayo', 'activo'),
('71234571', 'Elsa Beatriz Jiménez Ruiz', '987654361', 'elsa.jimenez2@email.com', '1987-09-12', 'Av. Víctor Raúl Haya de la Torre 024, Chiclayo', 'activo'),
('72345682', 'Ricardo Antonio Navarro Flores', '987654362', 'ricardo.navarro2@email.com', '1995-01-23', 'Jr. Pomalca 135, Chiclayo', 'activo'),
('73456793', 'Mónica Alejandra Valdez Sánchez', '987654363', 'monica.valdez2@email.com', '1983-04-04', 'Av. Balta 246, La Victoria, Chiclayo', 'activo'),
('74567894', 'Daniel Francisco Espinoza Torres', '987654364', 'daniel.espinoza2@email.com', '1991-08-15', 'Jr. Elías Aguirre 357, Chiclayo', 'activo'),
('75678905', 'Karina Elizabeth Mendoza Cáceres', '987654365', 'karina.mendoza2@email.com', '1989-12-26', 'Av. Bolognesi 468, Chiclayo', 'activo'),
('76789016', 'Oscar Raúl Palomino Gutiérrez', '987654366', 'oscar.palomino2@email.com', '1993-06-07', 'Jr. Unión 579, Chiclayo', 'activo'),
('77890127', 'Liliana Margarita Cruz Paredes', '987654367', 'liliana.cruz2@email.com', '1986-02-18', 'Av. Sáenz Peña 680, Chiclayo', 'activo'),
('78901238', 'Hernán Walter Quiroz Vásquez', '987654368', 'hernan.quiroz2@email.com', '1994-10-29', 'Jr. San José 791, Chiclayo', 'activo'),
('79012349', 'Sonia Patricia Alvarado Ríos', '987654369', 'sonia.alvarado2@email.com', '1984-03-10', 'Av. Luis González 802, Chiclayo', 'activo'),
('70123460', 'Julio César Benavides Salas', '987654370', 'julio.benavides2@email.com', '1990-07-21', 'Jr. Pedro Ruiz 913, Chiclayo', 'activo'),
('71234572', 'María del Carmen Huamán Quispe', '987654371', 'maria.huaman@email.com', '1988-11-02', 'Av. José Leonardo Ortiz 024, Chiclayo', 'activo'),
('72345683', 'Carlos Enrique Torres Vargas', '987654372', 'carlos.torres@email.com', '1992-05-13', 'Jr. Grau 135, Chiclayo', 'activo'),
('73456794', 'Patricia Elena Fernández Soto', '987654373', 'patricia.fernandez@email.com', '1987-09-24', 'Av. Miguel Grau 246, Chiclayo', 'activo'),
('74567895', 'Luis Miguel Gutiérrez Morales', '987654374', 'luis.gutierrez@email.com', '1995-01-05', 'Jr. La Victoria 357, Chiclayo', 'activo'),
('75678906', 'Ana Sofía Silva Díaz', '987654375', 'ana.silva@email.com', '1983-04-16', 'Av. Víctor Raúl Haya de la Torre 468, Chiclayo', 'activo'),
('76789017', 'Roberto Andrés Huamán Quispe', '987654376', 'roberto.huaman@email.com', '1991-08-27', 'Jr. Pomalca 579, Chiclayo', 'activo'),
('77890128', 'Carmen Lucía Paredes Rojas', '987654377', 'carmen.paredes@email.com', '1989-12-08', 'Av. Balta 680, La Victoria, Chiclayo', 'activo'),
('78901239', 'Fernando José Cáceres López', '987654378', 'fernando.caceres@email.com', '1993-06-19', 'Jr. Elías Aguirre 791, Chiclayo', 'activo'),
('79012350', 'Lucía María Chávez Herrera', '987654379', 'lucia.chavez@email.com', '1986-02-01', 'Av. Bolognesi 802, Chiclayo', 'activo'),
('70123461', 'Miguel Roberto Delgado Campos', '987654380', 'miguel.delgado@email.com', '1994-10-12', 'Jr. Unión 913, Chiclayo', 'activo'),
('71234573', 'Rosa Elena Vega Martínez', '987654381', 'rosa.vega@email.com', '1984-03-23', 'Av. Sáenz Peña 024, Chiclayo', 'activo'),
('72345684', 'Luis Fernando Ramos Salazar', '987654382', 'luis.ramos@email.com', '1990-07-04', 'Jr. San José 135, Chiclayo', 'activo'),
('73456795', 'Patricia Carmen Medina Castro', '987654383', 'patricia.medina@email.com', '1988-11-15', 'Av. Luis González 246, Chiclayo', 'activo'),
('74567896', 'Jorge Luis Ortiz Peña', '987654384', 'jorge.ortiz@email.com', '1992-05-26', 'Jr. Pedro Ruiz 357, Chiclayo', 'activo'),
('75678907', 'Gladys Elena Ríos Aguilar', '987654385', 'gladys.rios@email.com', '1987-09-07', 'Av. José Leonardo Ortiz 468, Chiclayo', 'activo'),
('76789018', 'Víctor Carlos Jiménez Ruiz', '987654386', 'victor.jimenez@email.com', '1995-01-18', 'Jr. Grau 579, Chiclayo', 'activo'),
('77890129', 'Elsa María Navarro Flores', '987654387', 'elsa.navarro@email.com', '1983-04-29', 'Av. Miguel Grau 680, Chiclayo', 'activo'),
('78901240', 'Ricardo Luis Valdez Sánchez', '987654388', 'ricardo.valdez@email.com', '1991-08-10', 'Jr. La Victoria 791, Chiclayo', 'activo'),
('79012351', 'Mónica Patricia Espinoza Torres', '987654389', 'monica.espinoza@email.com', '1989-12-21', 'Av. Víctor Raúl Haya de la Torre 802, Chiclayo', 'activo'),
('70123462', 'Daniel Alberto Mendoza Cáceres', '987654390', 'daniel.mendoza@email.com', '1993-06-02', 'Jr. Pomalca 913, Chiclayo', 'activo'),
('71234574', 'Karina Lucía Palomino Gutiérrez', '987654391', 'karina.palomino@email.com', '1986-02-13', 'Av. Balta 024, La Victoria, Chiclayo', 'activo'),
('72345685', 'Oscar Fernando Cruz Paredes', '987654392', 'oscar.cruz@email.com', '1994-10-24', 'Jr. Elías Aguirre 135, Chiclayo', 'activo'),
('73456796', 'Liliana Carmen Quiroz Vásquez', '987654393', 'liliana.quiroz@email.com', '1984-03-05', 'Av. Bolognesi 246, Chiclayo', 'activo'),
('74567897', 'Hernán Luis Alvarado Ríos', '987654394', 'hernan.alvarado@email.com', '1990-07-16', 'Jr. Unión 357, Chiclayo', 'activo'),
('75678908', 'Sonia Elena Benavides Salas', '987654395', 'sonia.benavides@email.com', '1988-11-27', 'Av. Sáenz Peña 468, Chiclayo', 'activo'),
('76789019', 'Julio Roberto Huamán Quispe', '987654396', 'julio.huaman@email.com', '1992-05-08', 'Jr. San José 579, Chiclayo', 'activo'),
('77890130', 'María del Pilar Torres Vargas', '987654397', 'maria.torres@email.com', '1987-09-19', 'Av. Luis González 680, Chiclayo', 'activo'),
('78901241', 'Carlos Miguel Fernández Soto', '987654398', 'carlos.fernandez@email.com', '1995-01-30', 'Jr. Pedro Ruiz 791, Chiclayo', 'activo'),
('79012352', 'Patricia Rosa Gutiérrez Morales', '987654399', 'patricia.gutierrez@email.com', '1983-04-11', 'Av. José Leonardo Ortiz 802, Chiclayo', 'activo'),
('70123463', 'Luis Carlos Silva Díaz', '987654400', 'luis.silva@email.com', '1991-08-22', 'Jr. Grau 913, Chiclayo', 'activo'),
('71234575', 'Ana Lucía Huamán Quispe', '987654401', 'ana.huaman@email.com', '1989-12-03', 'Av. Miguel Grau 024, Chiclayo', 'activo'),
('72345686', 'Roberto Fernando Paredes Rojas', '987654402', 'roberto.paredes@email.com', '1993-06-14', 'Jr. La Victoria 135, Chiclayo', 'activo'),
('73456797', 'Carmen Elena Cáceres López', '987654403', 'carmen.caceres@email.com', '1986-02-25', 'Av. Víctor Raúl Haya de la Torre 246, Chiclayo', 'activo'),
('74567898', 'Fernando Carlos Chávez Herrera', '987654404', 'fernando.chavez@email.com', '1994-10-06', 'Jr. Pomalca 357, Chiclayo', 'activo'),
('75678909', 'Lucía Patricia Delgado Campos', '987654405', 'lucia.delgado@email.com', '1984-03-17', 'Av. Balta 468, La Victoria, Chiclayo', 'activo'),
('76789020', 'Miguel Luis Vega Martínez', '987654406', 'miguel.vega@email.com', '1990-07-28', 'Jr. Elías Aguirre 579, Chiclayo', 'activo'),
('77890131', 'Rosa Carmen Ramos Salazar', '987654407', 'rosa.ramos@email.com', '1988-11-09', 'Av. Bolognesi 680, Chiclayo', 'activo'),
('78901242', 'Luis Alberto Medina Castro', '987654408', 'luis.medina@email.com', '1992-05-20', 'Jr. Unión 791, Chiclayo', 'activo'),
('79012353', 'Patricia Lucía Ortiz Peña', '987654409', 'patricia.ortiz@email.com', '1987-09-01', 'Av. Sáenz Peña 802, Chiclayo', 'activo'),
('70123464', 'Jorge Fernando Ríos Aguilar', '987654410', 'jorge.rios@email.com', '1995-01-12', 'Jr. San José 913, Chiclayo', 'activo'),
('71234576', 'Gladys María Jiménez Ruiz', '987654411', 'gladys.jimenez@email.com', '1983-04-23', 'Av. Luis González 024, Chiclayo', 'activo'),
('72345687', 'Víctor Luis Navarro Flores', '987654412', 'victor.navarro@email.com', '1991-08-04', 'Jr. Pedro Ruiz 135, Chiclayo', 'activo'),
('73456798', 'Elsa Carmen Valdez Sánchez', '987654413', 'elsa.valdez@email.com', '1989-12-15', 'Av. José Leonardo Ortiz 246, Chiclayo', 'activo'),
('74567899', 'Ricardo Fernando Espinoza Torres', '987654414', 'ricardo.espinoza@email.com', '1993-06-26', 'Jr. Grau 357, Chiclayo', 'activo'),
('75678910', 'Mónica Lucía Mendoza Cáceres', '987654415', 'monica.mendoza@email.com', '1986-02-07', 'Av. Miguel Grau 468, Chiclayo', 'activo'),
('76789021', 'Daniel Carlos Palomino Gutiérrez', '987654416', 'daniel.palomino@email.com', '1994-10-18', 'Jr. La Victoria 579, Chiclayo', 'activo'),
('77890132', 'Karina Elena Cruz Paredes', '987654417', 'karina.cruz@email.com', '1984-03-29', 'Av. Víctor Raúl Haya de la Torre 680, Chiclayo', 'activo'),
('78901243', 'Oscar Luis Quiroz Vásquez', '987654418', 'oscar.quiroz@email.com', '1990-07-10', 'Jr. Pomalca 791, Chiclayo', 'activo'),
('79012354', 'Liliana Carmen Alvarado Ríos', '987654419', 'liliana.alvarado@email.com', '1988-11-21', 'Av. Balta 802, La Victoria, Chiclayo', 'activo'),
('70123465', 'Hernán Fernando Benavides Salas', '987654420', 'hernan.benavides@email.com', '1992-05-02', 'Jr. Elías Aguirre 913, Chiclayo', 'activo');

-- =====================================================
-- CITAS
-- Generar citas desde hoy hasta el próximo mes
-- Llenar completamente los horarios de cada profesional
-- Citas cada 30 minutos durante todo el horario laboral
-- Todas las citas con estado 'pendiente'
-- =====================================================

-- Procedimiento almacenado temporal para generar citas
DELIMITER $$

DROP PROCEDURE IF EXISTS generar_citas_profesional$$

CREATE PROCEDURE generar_citas_profesional(
    IN p_profesional_id INT,
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE
)
BEGIN
    DECLARE v_fecha DATE;
    DECLARE v_dia_semana VARCHAR(20);
    DECLARE v_horario JSON;
    DECLARE v_inicio TIME;
    DECLARE v_fin TIME;
    DECLARE v_hora TIME;
    DECLARE v_paciente_id INT;
    DECLARE v_paciente_count INT;
    DECLARE v_done INT DEFAULT 0;
    
    -- Obtener horario del profesional
    SELECT horario INTO v_horario FROM profesionales WHERE id = p_profesional_id;
    
    -- Obtener cantidad de pacientes
    SELECT COUNT(*) INTO v_paciente_count FROM pacientes;
    
    -- Iterar por cada fecha desde inicio hasta fin
    SET v_fecha = p_fecha_inicio;
    
    WHILE v_fecha <= p_fecha_fin DO
        -- Obtener día de la semana (0=domingo, 1=lunes, ..., 6=sábado)
        SET v_dia_semana = CASE DAYOFWEEK(v_fecha)
            WHEN 1 THEN 'domingo'
            WHEN 2 THEN 'lunes'
            WHEN 3 THEN 'martes'
            WHEN 4 THEN 'miercoles'
            WHEN 5 THEN 'jueves'
            WHEN 6 THEN 'viernes'
            WHEN 7 THEN 'sabado'
        END;
        
        -- Verificar si el profesional trabaja ese día
        IF JSON_EXTRACT(v_horario, CONCAT('$.', v_dia_semana, '.inicio')) IS NOT NULL THEN
            -- Obtener horario del día
            SET v_inicio = TIME(JSON_UNQUOTE(JSON_EXTRACT(v_horario, CONCAT('$.', v_dia_semana, '.inicio'))));
            SET v_fin = TIME(JSON_UNQUOTE(JSON_EXTRACT(v_horario, CONCAT('$.', v_dia_semana, '.fin'))));
            
            -- Generar citas cada 30 minutos
            SET v_hora = v_inicio;
            
            WHILE v_hora < v_fin DO
                -- Seleccionar paciente aleatorio (asegurar que esté en rango válido)
                SET v_paciente_id = 1 + FLOOR(RAND() * v_paciente_count);
                
                -- Verificar que no haya conflicto de horario (mismo profesional, misma fecha y hora)
                IF NOT EXISTS (
                    SELECT 1 FROM citas 
                    WHERE profesional_id = p_profesional_id 
                    AND fecha = v_fecha 
                    AND hora = v_hora
                ) THEN
                    -- Insertar cita
                    INSERT INTO citas (paciente_id, profesional_id, fecha, hora, estado, es_excepcional)
                    VALUES (v_paciente_id, p_profesional_id, v_fecha, v_hora, 'pendiente', FALSE);
                END IF;
                
                -- Avanzar 30 minutos
                SET v_hora = ADDTIME(v_hora, '00:30:00');
            END WHILE;
        END IF;
        
        -- Avanzar al siguiente día
        SET v_fecha = DATE_ADD(v_fecha, INTERVAL 1 DAY);
    END WHILE;
END$$

DELIMITER ;

-- Generar citas para todos los profesionales desde hoy hasta el próximo mes
SET @fecha_inicio = CURDATE();
SET @fecha_fin = DATE_ADD(CURDATE(), INTERVAL 1 MONTH);

-- Generar citas para cada profesional
CALL generar_citas_profesional(1, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(2, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(3, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(4, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(5, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(6, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(7, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(8, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(9, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(10, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(11, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(12, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(13, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(14, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(15, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(16, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(17, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(18, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(19, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(20, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(21, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(22, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(23, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(24, @fecha_inicio, @fecha_fin);
CALL generar_citas_profesional(25, @fecha_inicio, @fecha_fin);

-- Eliminar procedimiento almacenado temporal
DROP PROCEDURE IF EXISTS generar_citas_profesional;

-- =====================================================
-- Fin del script
-- =====================================================

