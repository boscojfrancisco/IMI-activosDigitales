import { relations, sql } from 'drizzle-orm';
import { pgTable, serial, text, boolean, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

// Representa un organismo/institución en PostgreSQL
export const organismos = pgTable('organismos', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  tipo: text('tipo').notNull().default('Desconocido'),
  
  // Website
  tieneWeb: boolean('tiene_web').default(false),
  enlaceWeb: text('enlace_web'),
  enlaceWebGov: text('enlace_web_gov'),
  tieneWebPropia: boolean('tiene_web_propia').default(false),
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
  enlaceTurnosOnline: text('enlace_turnos_online'),
  atencionDigital: text('atencion_digital').default('No'),
  seguimientoTramites: text('seguimiento_tramites').default('No'),

  // Extra
  capacitacion: text('capacitacion').default('No'),
  capacitacionDigital: text('capacitacion_digital').default('No'),
  usaIA: boolean('usa_ia').default(false),
  chatbot: boolean('chatbot').default(false),
  
  // Nuevas Variables
  firmaDigital: text('firma_digital').default('No'),
  analisisProcesos: text('analisis_procesos').default('No'),
  tieneDoco: text('tiene_doco').default('No'),
  usaSiif: text('usa_siif').default('No'),

  // Reseñas y Metadatos agregados
  resenaSiif: text('resena_siif'),
  resenaFirma: text('resena_firma'),
  resenaIa: text('resena_ia'),
  chatbotNombre: text('chatbot_nombre'),
  chatbotResena: text('chatbot_resena'),

  
  fuente: text('fuente'),
  nivelConfianza: text('nivel_confianza').default('Bajo'),
  completitud: text('completitud').default('Baja'),


  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Representa un registro histórico de cambios de un organismo (cada vez que se actualiza)
export const indicadoresHistory = pgTable('indicadores_history', {
  id: serial('id').primaryKey(),
  organismoId: integer('organismo_id')
    .references(() => organismos.id, { onDelete: 'cascade' })
    .notNull(),
  userId: text('user_uid').notNull(),
  snapshot: text('snapshot').notNull(), // JSON string
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
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

export const usuarios = pgTable('usuarios_imi', {
  idUsuario: serial('id_usuario').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  tableroAcceso: varchar('tablero_acceso', { length: 100 }).default('reader').notNull(), // 'admin' | 'editor' | 'reader'
  activo: boolean('activo').default(true).notNull(),
  fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).defaultNow(),
});

