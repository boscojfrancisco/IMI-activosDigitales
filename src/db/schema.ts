import { relations, sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Representa un organismo/institución
export const organismos = sqliteTable('organismos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  tipo: text('tipo').notNull().default('Desconocido'),
  tieneWeb: integer('tiene_web', { mode: 'boolean' }).default(false),
  enlaceWeb: text('enlace_web'),
  enlaceWebGov: text('enlace_web_gov'),
  tieneWebPropia: integer('tiene_web_propia', { mode: 'boolean' }).default(false),
  enlaceWebPropia: text('enlace_web_propia'),
  guiaTramites: text('guia_tramites').default('No'),
  enlaceGuia: text('enlace_guia'),
  qTramitesGuia: integer('q_tramites_guia').default(0),
  tramitesOnline: text('tramites_online').default('No'),
  enlaceTramitesOnline: text('enlace_tramites_online'),
  expedienteDigital: text('expediente_digital').default('No'),
  usaIA: integer('usa_ia', { mode: 'boolean' }).default(false),
  chatbot: integer('chatbot', { mode: 'boolean' }).default(false),
  turnosOnline: text('turnos_online').default('No'),
  seguimientoTramites: text('seguimiento_tramites').default('No'),
  atencionDigital: text('atencion_digital').default('No'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

// Representa un registro histórico de cambios de un organismo (cada vez que se actualiza)
export const indicadoresHistory = sqliteTable('indicadores_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  organismoId: integer('organismo_id')
    .references(() => organismos.id)
    .notNull(),
  // Firebase UID of the user who made the change
  userId: text('user_uid').notNull(),
  snapshot: text('snapshot').notNull(), // JSON string representing the exact state
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`),
});

export const organismosRelations = relations(organismos, ({ many }) => ({
  history: many(indicadoresHistory),
}));

export const historyRelations = relations(indicadoresHistory, ({ one }) => ({
  organismo: one(organismos, {
    fields: [indicadoresHistory.organismoId],
    references: [organismos.id],
  }),
}));
