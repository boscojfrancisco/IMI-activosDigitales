import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    // 1. Crear tabla de usuarios_imi si no existe
    console.log('Creating table usuarios_imi if not exists...');
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS usuarios_imi (
        id_usuario SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        tablero_acceso VARCHAR(100) DEFAULT 'reader' NOT NULL,
        activo BOOLEAN DEFAULT true NOT NULL,
        fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table usuarios_imi checked/created');

    // 2. Columnas adicionales para organismos
    const columns = [
      'q_tramites_online INTEGER DEFAULT 0',
      'iniciar_tram_online TEXT DEFAULT "No"',
      'enlace_iniciar_tram_online TEXT',
      'q_iniciar_tram_online INTEGER DEFAULT 0',
      'capacitacion TEXT DEFAULT "No"',
      'capacitacion_digital TEXT DEFAULT "No"',
      'fuente TEXT',
      'nivel_confianza TEXT DEFAULT "Bajo"',
      'completitud TEXT DEFAULT "Baja"',
      'enlace_turnos_online TEXT'
    ];

    for (const col of columns) {
      try {
        await db.execute(sql`ALTER TABLE organismos ADD COLUMN ${sql.raw(col)}`);
        console.log(`Added column ${col}`);
      } catch (e) {
        console.log(`Column might already exist: ${e}`);
      }
    }
    console.log('Migration completed');
  } catch (err) {
    console.error('Migration error:', err);
  }
}
migrate();
