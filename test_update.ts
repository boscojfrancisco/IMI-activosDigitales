import { db } from './src/db/index.ts';
import { organismos } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';

async function test() {
  try {
    const orgs = await db.select().from(organismos).limit(1);
    const org = orgs[0];
    const id = org.id;

    console.log('Original turnos field:', org.turnosOnline);
    
    // New value
    const newTurnos = org.turnosOnline === 'Tiene' ? 'No' : 'Tiene';
    
    // Perform update via direct DB call first to test drizzle/schema
    await db.update(organismos)
        .set({ turnosOnline: newTurnos, updatedAt: new Date() })
        .where(eq(organismos.id, Number(id)));

    // Verify
    const updated = await db.select().from(organismos).where(eq(organismos.id, Number(id)));
    console.log('Updated turnos field:', updated[0].turnosOnline);
    
    if (updated[0].turnosOnline !== newTurnos) {
        throw new Error('Update failed in DB!');
    } else {
        console.log('UPDATE SUCCESSFUL in DB');
    }

  } catch (err: any) {
    console.error('Test error:', err);
  }
}
test();
