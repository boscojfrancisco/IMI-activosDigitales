import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';
import dotenv from 'dotenv';

dotenv.config();

// Obtener la URL de conexión desde el entorno
const connectionString = process.env.DATABASE_URL || 'postgresql://IPECD_Matias:IPECDatos.2026@149.50.145.182:5432/imi_activos_digitales';

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('127.0.0.1') || connectionString.includes('localhost') 
    ? false 
    : { rejectUnauthorized: false }
});

// Inicializar Drizzle para Postgres
export const db = drizzle(pool, { schema });

