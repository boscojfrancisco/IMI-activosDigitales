import { relations, sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Representa un organismo/institución
export const organismos = sqliteTable('organismos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nombre: text('nombre').notNull(),
  tipo: text('tipo').notNull().default('Desconocido'),
  
  // Website
  tieneWeb: integer('tiene_web', { mode: 'boolean' }).default(false),
  enlaceWeb: text('enlace_web'),
  enlaceWebGov: text('enlace_web_gov'),
  tieneWebPropia: integer('tiene_web_propia', { mode: 'boolean' }).default(false),
  enlaceWebPropia: text('enlace_web_propia'),

  // Tramites
  guiaTramites: text('guia_tramites').default('No'),
  enlaceGuia: text('enlace_guia'),
  qTramitesGuia: integer('q_tramites_guia').default(0),
  
  tramitesOnline: text('tramites_online').default('No'),
  enlaceTramitesOnline: text('enlace_tramites_online'),
  qTramitesOnline: integer('q_tramites_online').default(0),

  iniciarTramOnline: text('iniciar_tram_online').default('No'),
  enlaceIniciarTramOnline: text('enlace_iniciar_tram_online'),
  qIniciarTramOnline: integer('q_iniciar_tram_online').default(0),

  // Digital
  expedienteDigital: text('expediente_digital').default('No'),
  turnosOnline: text('turnos_online').default('No'),
  atencionDigital: text('atencion_digital').default('No'),
  seguimientoTramites: text('seguimiento_tramites').default('No'),

  // Extra
  capacitacion: text('capacitacion').default('No'),
  capacitacionDigital: text('capacitacion_digital').default('No'),
  usaIA: integer('usa_ia', { mode: 'boolean' }).default(false),
  chatbot: integer('chatbot', { mode: 'boolean' }).default(false),
  
  fuente: text('fuente'),
  nivelConfianza: text('nivel_confianza').default('Bajo'),
  completitud: text('completitud').default('Baja'),

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
