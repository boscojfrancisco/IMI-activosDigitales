import { db } from './src/db/index.ts';
import { sql } from 'drizzle-orm';

async function migrate() {
  try {
    const columns = [
      'q_tramites_online INTEGER DEFAULT 0',
      'iniciar_tram_online TEXT DEFAULT "No"',
      'enlace_iniciar_tram_online TEXT',
      'q_iniciar_tram_online INTEGER DEFAULT 0',
      'capacitacion TEXT DEFAULT "No"',
      'capacitacion_digital TEXT DEFAULT "No"',
      'fuente TEXT',
      'nivel_confianza TEXT DEFAULT "Bajo"',
      'completitud TEXT DEFAULT "Baja"'
    ];

    for (const col of columns) {
      try {
        await db.run(sql`ALTER TABLE organismos ADD COLUMN ${sql.raw(col)}`);
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
