import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();


export const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 30,
    queueLimit: 0,
});

/**
 * Obtiene una conexión del pool y configura el timezone a Peru (UTC-5)
 * Usar esta función en lugar de pool.getConnection() cuando necesites timezone Peru
 */
export async function getConnectionPeru() {
    const conn = await pool.getConnection();
    await conn.query("SET time_zone = '-05:00'");
    return conn;
}

/**
 * Ejecuta una query con timezone Peru
 * Usar esta función en lugar de pool.execute() cuando necesites timezone Peru
 */
export async function executeWithPeru(query, params) {
    const conn = await getConnectionPeru();
    try {
        const result = await conn.query(query, params);
        return result;
    } finally {
        conn.release();
    }
}