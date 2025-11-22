import mysql from 'mysql2/promise';
import fs from 'fs/promises';

const config = {
  host: 'recetariowebqr.c38qyu046ryr.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'J0nxtxn13052003_',
  database: 'citas_medicas',
  charset: 'utf8mb4'
};

const profesionales = [
  { cmp: 'CMP-12345', nombre: 'Dr. Carlos Alberto Mendoza Ramírez' },
  { cmp: 'CMP-12346', nombre: 'Dra. María Elena Torres Vargas' },
  { cmp: 'CMP-12347', nombre: 'Dr. José Luis Fernández Soto' },
  { cmp: 'CMP-12348', nombre: 'Dra. Ana Patricia Gutiérrez Morales' },
  { cmp: 'CMP-12349', nombre: 'Dr. Roberto Carlos Silva Díaz' },
  { cmp: 'CMP-12350', nombre: 'Dra. Carmen Rosa Huamán Quispe' },
  { cmp: 'CMP-12351', nombre: 'Dr. Fernando Augusto Paredes Rojas' },
  { cmp: 'CMP-12352', nombre: 'Dra. Lucía Esperanza Cáceres López' },
  { cmp: 'CMP-12353', nombre: 'Dr. Miguel Ángel Chávez Herrera' },
  { cmp: 'CMP-12354', nombre: 'Dra. Rosa María Delgado Campos' },
  { cmp: 'CMP-12355', nombre: 'Dr. Luis Alberto Vega Martínez' },
  { cmp: 'CMP-12356', nombre: 'Dra. Patricia Isabel Ramos Salazar' },
  { cmp: 'CMP-12357', nombre: 'Dr. Jorge Eduardo Medina Castro' },
  { cmp: 'CMP-12358', nombre: 'Dra. Gladys Milagros Ortiz Peña' },
  { cmp: 'CMP-12359', nombre: 'Dr. Víctor Manuel Ríos Aguilar' },
  { cmp: 'CMP-12360', nombre: 'Dra. Elsa Beatriz Jiménez Ruiz' },
  { cmp: 'CMP-12361', nombre: 'Dr. Ricardo Antonio Navarro Flores' },
  { cmp: 'CMP-12362', nombre: 'Dra. Mónica Alejandra Valdez Sánchez' },
  { cmp: 'CMP-12363', nombre: 'Dr. Daniel Francisco Espinoza Torres' },
  { cmp: 'CMP-12364', nombre: 'Dra. Karina Elizabeth Mendoza Cáceres' },
  { cmp: 'CMP-12365', nombre: 'Dr. Oscar Raúl Palomino Gutiérrez' },
  { cmp: 'CMP-12366', nombre: 'Dra. Liliana Margarita Cruz Paredes' },
  { cmp: 'CMP-12367', nombre: 'Dr. Hernán Walter Quiroz Vásquez' },
  { cmp: 'CMP-12368', nombre: 'Dra. Sonia Patricia Alvarado Ríos' },
  { cmp: 'CMP-12369', nombre: 'Dr. Julio César Benavides Salas' }
];

const pacientes = [
  { dni: '71234567', nombre: 'Juan Carlos Pérez García' },
  { dni: '72345678', nombre: 'María Elena Rodríguez López' },
  { dni: '73456789', nombre: 'Carlos Alberto Martínez Sánchez' },
  { dni: '74567890', nombre: 'Ana Patricia González Torres' },
  { dni: '75678901', nombre: 'Luis Fernando Herrera Díaz' },
  { dni: '76789012', nombre: 'Carmen Rosa Vargas Morales' },
  { dni: '77890123', nombre: 'Roberto Carlos Silva Ramírez' },
  { dni: '78901234', nombre: 'Lucía Esperanza Cáceres Flores' },
  { dni: '79012345', nombre: 'Miguel Ángel Chávez Gutiérrez' },
  { dni: '70123456', nombre: 'Rosa María Delgado Campos' },
  { dni: '71234568', nombre: 'Fernando Augusto Paredes Rojas' },
  { dni: '72345679', nombre: 'Patricia Isabel Ramos Salazar' },
  { dni: '73456790', nombre: 'Jorge Eduardo Medina Castro' },
  { dni: '74567891', nombre: 'Gladys Milagros Ortiz Peña' },
  { dni: '75678902', nombre: 'Víctor Manuel Ríos Aguilar' },
  { dni: '76789013', nombre: 'Elsa Beatriz Jiménez Ruiz' },
  { dni: '77890124', nombre: 'Ricardo Antonio Navarro Flores' },
  { dni: '78901235', nombre: 'Mónica Alejandra Valdez Sánchez' },
  { dni: '79012346', nombre: 'Daniel Francisco Espinoza Torres' },
  { dni: '70123457', nombre: 'Karina Elizabeth Mendoza Cáceres' },
  { dni: '71234569', nombre: 'Oscar Raúl Palomino Gutiérrez' },
  { dni: '72345680', nombre: 'Liliana Margarita Cruz Paredes' },
  { dni: '73456791', nombre: 'Hernán Walter Quiroz Vásquez' },
  { dni: '74567892', nombre: 'Sonia Patricia Alvarado Ríos' },
  { dni: '75678903', nombre: 'Julio César Benavides Salas' },
  { dni: '76789014', nombre: 'Pedro Antonio Huamán Quispe' },
  { dni: '77890125', nombre: 'Elena Beatriz Torres Vargas' },
  { dni: '78901236', nombre: 'José Luis Fernández Soto' },
  { dni: '79012347', nombre: 'Ana María Gutiérrez Morales' },
  { dni: '70123458', nombre: 'Roberto Carlos Silva Díaz' },
  { dni: '71234570', nombre: 'Carmen Rosa Huamán Quispe' },
  { dni: '72345681', nombre: 'Fernando Augusto Paredes Rojas' },
  { dni: '73456792', nombre: 'Lucía Esperanza Cáceres López' },
  { dni: '74567893', nombre: 'Miguel Ángel Chávez Herrera' },
  { dni: '75678904', nombre: 'Rosa María Delgado Campos' },
  { dni: '76789015', nombre: 'Luis Alberto Vega Martínez' },
  { dni: '77890126', nombre: 'Patricia Isabel Ramos Salazar' },
  { dni: '78901237', nombre: 'Jorge Eduardo Medina Castro' },
  { dni: '79012348', nombre: 'Gladys Milagros Ortiz Peña' },
  { dni: '70123459', nombre: 'Víctor Manuel Ríos Aguilar' },
  { dni: '71234571', nombre: 'Elsa Beatriz Jiménez Ruiz' },
  { dni: '72345682', nombre: 'Ricardo Antonio Navarro Flores' },
  { dni: '73456793', nombre: 'Mónica Alejandra Valdez Sánchez' },
  { dni: '74567894', nombre: 'Daniel Francisco Espinoza Torres' },
  { dni: '75678905', nombre: 'Karina Elizabeth Mendoza Cáceres' },
  { dni: '76789016', nombre: 'Oscar Raúl Palomino Gutiérrez' },
  { dni: '77890127', nombre: 'Liliana Margarita Cruz Paredes' },
  { dni: '78901238', nombre: 'Hernán Walter Quiroz Vásquez' },
  { dni: '79012349', nombre: 'Sonia Patricia Alvarado Ríos' },
  { dni: '70123460', nombre: 'Julio César Benavides Salas' },
  { dni: '71234572', nombre: 'María del Carmen Huamán Quispe' },
  { dni: '72345683', nombre: 'Carlos Enrique Torres Vargas' },
  { dni: '73456794', nombre: 'Patricia Elena Fernández Soto' },
  { dni: '74567895', nombre: 'Luis Miguel Gutiérrez Morales' },
  { dni: '75678906', nombre: 'Ana Sofía Silva Díaz' },
  { dni: '76789017', nombre: 'Roberto Andrés Huamán Quispe' },
  { dni: '77890128', nombre: 'Carmen Lucía Paredes Rojas' },
  { dni: '78901239', nombre: 'Fernando José Cáceres López' },
  { dni: '79012350', nombre: 'Lucía María Chávez Herrera' },
  { dni: '70123461', nombre: 'Miguel Roberto Delgado Campos' },
  { dni: '71234573', nombre: 'Rosa Elena Vega Martínez' },
  { dni: '72345684', nombre: 'Luis Fernando Ramos Salazar' },
  { dni: '73456795', nombre: 'Patricia Carmen Medina Castro' },
  { dni: '74567896', nombre: 'Jorge Luis Ortiz Peña' },
  { dni: '75678907', nombre: 'Gladys Elena Ríos Aguilar' },
  { dni: '76789018', nombre: 'Víctor Carlos Jiménez Ruiz' },
  { dni: '77890129', nombre: 'Elsa María Navarro Flores' },
  { dni: '78901240', nombre: 'Ricardo Luis Valdez Sánchez' },
  { dni: '79012351', nombre: 'Mónica Patricia Espinoza Torres' },
  { dni: '70123462', nombre: 'Daniel Alberto Mendoza Cáceres' },
  { dni: '71234574', nombre: 'Karina Lucía Palomino Gutiérrez' },
  { dni: '72345685', nombre: 'Oscar Fernando Cruz Paredes' },
  { dni: '73456796', nombre: 'Liliana Carmen Quiroz Vásquez' },
  { dni: '74567897', nombre: 'Hernán Luis Alvarado Ríos' },
  { dni: '75678908', nombre: 'Sonia Elena Benavides Salas' },
  { dni: '76789019', nombre: 'Julio Roberto Huamán Quispe' },
  { dni: '77890130', nombre: 'María del Pilar Torres Vargas' },
  { dni: '78901241', nombre: 'Carlos Miguel Fernández Soto' },
  { dni: '79012352', nombre: 'Patricia Rosa Gutiérrez Morales' },
  { dni: '70123463', nombre: 'Luis Carlos Silva Díaz' },
  { dni: '71234575', nombre: 'Ana Lucía Huamán Quispe' },
  { dni: '72345686', nombre: 'Roberto Fernando Paredes Rojas' },
  { dni: '73456797', nombre: 'Carmen Elena Cáceres López' },
  { dni: '74567898', nombre: 'Fernando Carlos Chávez Herrera' },
  { dni: '75678909', nombre: 'Lucía Patricia Delgado Campos' },
  { dni: '76789020', nombre: 'Miguel Luis Vega Martínez' },
  { dni: '77890131', nombre: 'Rosa Carmen Ramos Salazar' },
  { dni: '78901242', nombre: 'Luis Alberto Medina Castro' },
  { dni: '79012353', nombre: 'Patricia Lucía Ortiz Peña' },
  { dni: '70123464', nombre: 'Jorge Fernando Ríos Aguilar' },
  { dni: '71234576', nombre: 'Gladys María Jiménez Ruiz' },
  { dni: '72345687', nombre: 'Víctor Luis Navarro Flores' },
  { dni: '73456798', nombre: 'Elsa Carmen Valdez Sánchez' },
  { dni: '74567899', nombre: 'Ricardo Fernando Espinoza Torres' },
  { dni: '75678910', nombre: 'Mónica Lucía Mendoza Cáceres' },
  { dni: '76789021', nombre: 'Daniel Carlos Palomino Gutiérrez' },
  { dni: '77890132', nombre: 'Karina Elena Cruz Paredes' },
  { dni: '78901243', nombre: 'Oscar Luis Quiroz Vásquez' },
  { dni: '79012354', nombre: 'Liliana Carmen Alvarado Ríos' },
  { dni: '70123465', nombre: 'Hernán Fernando Benavides Salas' }
];

async function fixTildes() {
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('Corrigiendo profesionales...');
    for (const prof of profesionales) {
      await connection.execute(
        'UPDATE profesionales SET nombre_completo = ? WHERE cmp = ?',
        [prof.nombre, prof.cmp]
      );
      console.log(`✓ ${prof.cmp}: ${prof.nombre}`);
    }
    
    console.log('\nCorrigiendo pacientes...');
    for (const pac of pacientes) {
      await connection.execute(
        'UPDATE pacientes SET nombre_completo = ? WHERE dni = ?',
        [pac.nombre, pac.dni]
      );
      console.log(`✓ ${pac.dni}: ${pac.nombre}`);
    }
    
    console.log('\n¡Tildes corregidas exitosamente!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await connection.end();
  }
}

fixTildes();

