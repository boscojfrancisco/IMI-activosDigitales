import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { db } from './src/db/index.ts';
import { organismos, indicadoresHistory, usuarios, digitalObservaciones, digitalCortes, digitalTramites, digitalVisitas, digitalMigrations, digitalVerificaciones } from './src/db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { requireAuth, checkRole, AuthRequest } from './src/middleware/auth.ts';
import catalog from './src/data/digital-index-catalog.json' assert { type: 'json' };

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'imi-activos-digitales-secret-key-2026';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

async function seedDatabaseIfEmpty() {
  try {
    await db.execute(sql`CREATE TABLE IF NOT EXISTS digital_observaciones (
      id SERIAL PRIMARY KEY,
      organismo_id INTEGER NOT NULL REFERENCES organismos(id) ON DELETE CASCADE,
      variable_id VARCHAR(2) NOT NULL,
      nivel INTEGER NOT NULL CHECK (nivel BETWEEN 0 AND 3),
      fuente VARCHAR(1) NOT NULL CHECK (fuente IN ('W','S','V')),
      fecha_observacion VARCHAR(10) NOT NULL,
      evidencia TEXT,
      notas TEXT,
      usuario TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS digital_cortes (
      id SERIAL PRIMARY KEY,
      fecha VARCHAR(10) NOT NULL,
      nombre VARCHAR(40) NOT NULL UNIQUE,
      snapshot JSONB NOT NULL,
      cerrado_por TEXT NOT NULL,
      cerrado_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS digital_detalle_tramites (
      id SERIAL PRIMARY KEY, organismo_id INTEGER NOT NULL REFERENCES organismos(id) ON DELETE CASCADE,
      fecha VARCHAR(10) NOT NULL, nativos INTEGER NOT NULL DEFAULT 0, integrados INTEGER NOT NULL DEFAULT 0,
      fuera_mi_corrientes INTEGER NOT NULL DEFAULT 0, usuario TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await db.execute(sql`ALTER TABLE digital_detalle_tramites ADD COLUMN IF NOT EXISTS integrados_links JSONB NOT NULL DEFAULT '[]'::jsonb`);
    await db.execute(sql`ALTER TABLE digital_detalle_tramites ADD COLUMN IF NOT EXISTS fuera_mi_corrientes_links JSONB NOT NULL DEFAULT '[]'::jsonb`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS digital_visitas (
      id SERIAL PRIMARY KEY, organismo_id INTEGER NOT NULL REFERENCES organismos(id) ON DELETE CASCADE,
      fecha VARCHAR(10) NOT NULL, observaciones TEXT, usuario TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS digital_migrations (
      code VARCHAR(80) PRIMARY KEY, usuario TEXT NOT NULL, resumen JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    await db.execute(sql`CREATE TABLE IF NOT EXISTS digital_verificaciones (
      organismo_id INTEGER PRIMARY KEY REFERENCES organismos(id) ON DELETE CASCADE,
      variables JSONB NOT NULL DEFAULT '{}'::jsonb, cerrado_por TEXT, cerrado_at TIMESTAMPTZ
    )`);
    const existing = await db.select().from(organismos);
    
    // Si ya hay organismos, verificar si el historial está vacío para sembrar la línea base
    if (existing.length > 0) {
      console.log(`Database already has ${existing.length} organismos. Checking history baseline...`);
      const existingHistory = await db.select().from(indicadoresHistory);
      if (existingHistory.length === 0) {
        console.log("No history found. Creating initial baseline history for existing records...");
        for (const org of existing) {
          await db.insert(indicadoresHistory).values({
            organismoId: org.id,
            userId: 'Línea Base Inicial',
            snapshot: JSON.stringify(org)
          });
        }
        console.log("Initial baseline history generated successfully.");
      }
      return;
    }

    console.log("Database is empty. Seeding from Google Sheets...");
    const DATA_URL = "https://docs.google.com/spreadsheets/d/1nbgHe7U_A6l25EJTgJz6ERtnE8XmyVV3/gviz/tq?tqx=out:json&gid=67432853";
    const response = await fetch(DATA_URL);
    if (!response.ok) {
      throw new Error(`HTTP error fetching spreadsheet: ${response.status}`);
    }
    const text = await response.text();
    
    // Extract the JSON payload within google.visualization.Query.setResponse()
    const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);/);
    if (!match) {
      throw new Error("Invalid response format from Google Sheets");
    }
    
    const parsed = JSON.parse(match[1]);
    const table = parsed.table;
    
    const validRows = table.rows.filter((r: any) => {
      if (!r || !Array.isArray(r.c)) return false;
      const orgCell = r.c[0];
      return orgCell && orgCell.v && orgCell.v.toString().trim() !== '';
    });

    const parsedData = validRows.map((r: any) => {
      const c = r.c || [];
      const getVal = (idx: number, preferFormatted = false) => {
        const cell = c[idx];
        if (!cell) return '';
        if (preferFormatted && cell.f) return cell.f.toString();
        return (cell.v !== null && cell.v !== undefined) ? cell.v.toString() : '';
      };

      const nombre = getVal(0).trim();
      const tipo = getVal(1).trim() || 'Desconocido';
      const tieneWebStr = getVal(2).trim().toLowerCase();
      
      const websitePropia = getVal(4).trim();
      const websiteGov = getVal(3).trim();
      let enlaceWeb = '';
      if (websitePropia && websitePropia !== 'null' && websitePropia !== '') {
        enlaceWeb = websitePropia;
      } else if (websiteGov && websiteGov !== 'null' && websiteGov !== '') {
        enlaceWeb = websiteGov;
      }

      const tieneWebPropia = websitePropia && websitePropia !== 'null' && websitePropia.trim() !== '';
      const enlaceWebPropia = tieneWebPropia ? websitePropia : '';
      const enlaceWebGov = websiteGov && websiteGov !== 'null' ? websiteGov : '';

      const guiaTramites = getVal(7).trim();
      const enlaceGuia = getVal(8).trim();

      const qTramitesRaw = getVal(9).trim();
      const qTramitesVal = parseInt(qTramitesRaw.replace(/\D/g, ''), 10);

      const tramitesOnline = getVal(10).trim();
      let enlaceTramitesOnline = getVal(11).trim();
      if (!enlaceTramitesOnline || enlaceTramitesOnline === 'null') {
        enlaceTramitesOnline = getVal(14).trim();
      }

      const expedienteDigital = getVal(16).trim();
      const turnosOnline = getVal(17).trim();
      const atencionDigital = getVal(18).trim();
      const seguimientoTramites = getVal(19).trim();

      const usaIAStr = getVal(22).trim().toLowerCase();
      const chatbotStr = getVal(23).trim().toLowerCase();

      return {
        nombre,
        tipo,
        tieneWeb: tieneWebStr === 'si' || tieneWebStr === 'sí',
        enlaceWeb,
        enlaceWebGov,
        tieneWebPropia,
        enlaceWebPropia,
        guiaTramites: guiaTramites || 'No',
        enlaceGuia: enlaceGuia && enlaceGuia !== 'null' ? enlaceGuia : '',
        qTramitesGuia: isNaN(qTramitesVal) ? 0 : qTramitesVal,
        tramitesOnline: tramitesOnline || 'No',
        enlaceTramitesOnline: enlaceTramitesOnline && enlaceTramitesOnline !== 'null' ? enlaceTramitesOnline : '',
        expedienteDigital: expedienteDigital || 'No',
        firmaDigital: 'No',
        analisisProcesos: 'No',
        tieneDoco: 'No',
        usaSiif: 'No',
        usaIA: usaIAStr === 'si' || usaIAStr === 'sí',
        chatbot: chatbotStr === 'si' || chatbotStr === 'sí',
        turnosOnline: turnosOnline || 'No',
        seguimientoTramites: seguimientoTramites || 'No',
        atencionDigital: atencionDigital || 'No',
      };
    });

    await db.insert(organismos).values(parsedData);
    
    // Sembrar también el historial inicial
    const inserted = await db.select().from(organismos);
    for (const org of inserted) {
      await db.insert(indicadoresHistory).values({
        organismoId: org.id,
        userId: 'Línea Base Inicial',
        snapshot: JSON.stringify(org)
      });
    }
    console.log("Database and baseline history seeded successfully!");
  } catch (err: any) {
    console.error("Failed to seed database on startup:", err);
  }
}

// --- RUTAS DE AUTENTICACIÓN Y ROLES DE USUARIO ---

// El alta de cuentas se gestiona exclusivamente desde el panel de administración.
app.post('/api/auth/register', (_req, res) => {
  return res.status(410).json({ error: 'El registro público está deshabilitado. Solicita una cuenta a un administrador.' });
});

// Login de usuarios
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    const userRecords = await db.select()
      .from(usuarios)
      .where(eq(usuarios.username, username))
      .limit(1);

    if (userRecords.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const user = userRecords[0];

    if (!user.activo) {
      return res.status(403).json({ error: 'La cuenta del usuario está desactivada' });
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Generar Token JWT
    const token = jwt.sign(
      { idUsuario: user.idUsuario, username: user.username, tableroAcceso: user.tableroAcceso },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      token,
      user: {
        idUsuario: user.idUsuario,
        username: user.username,
        tableroAcceso: user.tableroAcceso
      }
    });
  } catch (err: any) {
    console.error('Error al iniciar sesión:', err);
    return res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
});

// Obtener datos del usuario actual autenticado
app.get('/api/auth/me', requireAuth, (req: AuthRequest, res) => {
  return res.json(req.user);
});

// Listar todos los usuarios (solo Admin)
app.get('/api/admin/users', requireAuth, checkRole(['admin']), async (req, res) => {
  try {
    const list = await db.select({
      idUsuario: usuarios.idUsuario,
      username: usuarios.username,
      tableroAcceso: usuarios.tableroAcceso,
      activo: usuarios.activo,
      fechaCreacion: usuarios.fechaCreacion
    }).from(usuarios);
    
    return res.json(list);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Modificar rol de un usuario (solo Admin)
app.put('/api/admin/users/:id/role', requireAuth, checkRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { tableroAcceso } = req.body;

  if (!['admin', 'editor', 'reader'].includes(tableroAcceso)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  try {
    await db.update(usuarios)
      .set({ tableroAcceso })
      .where(eq(usuarios.idUsuario, Number(id)));

    return res.json({ success: true, message: 'Rol de usuario actualizado' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Alternar estado de un usuario (solo Admin)
app.put('/api/admin/users/:id/status', requireAuth, checkRole(['admin']), async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;

  if (typeof activo !== 'boolean') {
    return res.status(400).json({ error: 'El estado activo debe ser booleano' });
  }

  try {
    await db.update(usuarios)
      .set({ activo })
      .where(eq(usuarios.idUsuario, Number(id)));

    return res.json({ success: true, message: 'Estado del usuario actualizado' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Crear usuario desde panel de administración (solo Admin)
app.post('/api/admin/users', requireAuth, checkRole(['admin']), async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  if (!['admin', 'editor', 'reader'].includes(role)) {
    return res.status(400).json({ error: 'Rol inválido' });
  }

  try {
    const existing = await db.select()
      .from(usuarios)
      .where(eq(usuarios.username, username))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya existe' });
    }

    const passwordHash = hashPassword(password);

    await db.insert(usuarios).values({
      username,
      passwordHash,
      tableroAcceso: role,
      activo: true
    });

    return res.json({ success: true, message: 'Usuario creado exitosamente' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Eliminar usuario (solo Admin)
app.delete('/api/admin/users/:id', requireAuth, checkRole(['admin']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const targetId = Number(id);

  // Impedir auto-eliminación
  if (req.user && req.user.idUsuario === targetId) {
    return res.status(400).json({ error: 'No podés eliminar tu propia cuenta' });
  }

  try {
    await db.delete(usuarios)
      .where(eq(usuarios.idUsuario, targetId));

    return res.json({ success: true, message: 'Usuario eliminado exitosamente' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// API route to get data from Database.
app.get('/api/organismos', async (req, res) => {
  try {
    const existing = await db.select().from(organismos);
    // Cast numeric to number since PG might return some int as strings
    const formatted = existing.map(org => ({
      ...org,
      qTramitesGuia: Number(org.qTramitesGuia)
    }));
    return res.json(formatted);
  } catch (err: any) {
    console.error("Backend failed:", err);
    res.status(500).json({ error: err.message || "Failed to load database" });
  }
});

// Índice de madurez digital provincial (observaciones append-only y cortes inmutables).
app.get('/api/digital-index/catalog', (_req, res) => res.json(catalog));

const LEGACY_BASELINE_CODE = 'monitor-anterior-2026-01';
const LEGACY_COMPLETE_CODE = 'monitor-anterior-completo-2026-02';
function legacyBaselineCandidates(orgs: any[]) {
  const rows: Array<{ organismoId:number; variableId:string; nivel:number; fuente:'W'|'S'|'V'; fechaObservacion:string; evidencia:string|null; notas:string; usuario:string }> = [];
  const yes = (value: unknown) => ['si','sí','tiene'].includes(String(value || '').trim().toLowerCase());
  const no = (value: unknown) => ['no','no tiene','no disponible / no aplica'].includes(String(value || '').trim().toLowerCase());
  for (const org of orgs) {
    const date = org.updatedAt ? new Date(org.updatedAt).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
    const add = (variableId:string,nivel:number,fuente:'W'|'S'|'V',evidencia:string|null,field:string) => rows.push({
      organismoId: org.id, variableId, nivel, fuente, fechaObservacion: date, evidencia,
      notas: `[base monitor anterior] Migrado desde ${field}; fecha tomada de la última actualización del registro anterior. Se infiere solo este nivel.`,
      usuario: 'Migración del monitor anterior'
    });
    if (org.tramitesMiCorrientes === 'Plataforma/sitio autónomo') add('A1',1,'W',org.enlaceTramitesOnline || null,'tramitesMiCorrientes');
    if (yes(org.atencionDigital)) add('A2',1,'W',null,'atencionDigital');
    else if (no(org.atencionDigital)) add('A2',0,'W',null,'atencionDigital');
    // La marca binaria antigua solo respalda nivel 1 cuando se conserva el enlace del sitio oficial.
    if (org.tieneWeb && org.enlaceWebGov) add('A4',1,'W',org.enlaceWebGov,'tieneWeb + enlaceWebGov');
    if (yes(org.guiaTramites)) add('A5',3,'W',org.enlaceGuia || null,'guiaTramites');
    else if (no(org.guiaTramites)) add('A5',0,'W',org.enlaceGuia || null,'guiaTramites');
    if (yes(org.firmaDigital)) add('B3',1,'S',org.resenaFirma || null,'firmaDigital');
    else if (no(org.firmaDigital)) add('B3',0,'S',org.resenaFirma || null,'firmaDigital');
  }
  return rows;
}

// Segunda pasada solicitada: usar todas las señales legadas que se puedan
// aproximar al índice, con notas explícitas para que los organismos las validen.
function legacyCompleteCandidates(orgs: any[]) {
  const rows: Array<{ organismoId:number; variableId:string; nivel:number; fuente:'W'|'S'|'V'; fechaObservacion:string; evidencia:string|null; notas:string; usuario:string }> = [];
  const normalized = (value: unknown) => String(value ?? '').trim().toLowerCase();
  const yes = (value: unknown) => ['si','sí','tiene','hizo'].includes(normalized(value));
  const no = (value: unknown) => ['no','no tiene','no disponible / no aplica'].includes(normalized(value));
  for (const org of orgs) {
    const date = org.updatedAt ? new Date(org.updatedAt).toISOString().slice(0,10) : new Date().toISOString().slice(0,10);
    const add = (variableId:string,nivel:number,fuente:'W'|'S'|'V',evidencia:string|null,fields:string[]) => rows.push({
      organismoId:org.id, variableId, nivel, fuente, fechaObservacion:date, evidencia,
      notas:`[base monitor anterior] [carga integral] Conversión orientativa desde ${fields.join(', ')}. Revisar y corregir con el organismo; la fecha es la última actualización del registro anterior.`,
      usuario:'Migración integral del monitor anterior'
    });

    // A1: status de Mi Corrientes y/o cantidad de trámites online legados.
    const miCorrientes = normalized(org.tramitesMiCorrientes);
    const onlineCount = Number(org.qTramitesOnline || 0);
    let a1: number | null = null;
    let a1Fields = ['tramitesMiCorrientes'];
    if (miCorrientes.includes('digitalizado imi')) a1 = 2;
    else if (miCorrientes.includes('autónomo') || miCorrientes.includes('autonomo')) a1 = 1;
    else if (no(org.tramitesMiCorrientes)) a1 = 0;
    if (onlineCount > 0) {
      a1 = Math.max(a1 ?? 0, onlineCount >= 3 ? 2 : 1);
      a1Fields = ['qTramitesOnline', 'tramitesMiCorrientes'];
    } else if (yes(org.tramitesOnline)) {
      a1 = Math.max(a1 ?? 0, 1);
      a1Fields = ['tramitesOnline', 'tramitesMiCorrientes'];
    }
    if (a1 !== null) add('A1',a1,'W',org.enlaceTramitesOnline || null,a1Fields);

    // A2: canal de atención; el chatbot es evidencia de atención automatizada.
    if (yes(org.atencionDigital) || no(org.atencionDigital) || org.chatbot === true) {
      const level = org.chatbot === true ? 3 : yes(org.atencionDigital) ? 1 : 0;
      add('A2',level,'W',org.chatbotResena || null,org.chatbot === true ? ['atencionDigital','chatbot'] : ['atencionDigital']);
    }

    // A3: la marca antigua no distingue el tipo de turnero; se importa como nivel inicial.
    if (yes(org.turnosOnline) || no(org.turnosOnline)) add('A3',yes(org.turnosOnline)?1:0,'W',org.enlaceTurnosOnline || null,['turnosOnline']);

    // A4: presencia web legada, sin inferir actualización ni autoridades.
    if (org.tieneWeb === true || org.tieneWeb === false || org.tieneWebPropia === true || org.tieneWebPropia === false) {
      const hasSite = org.tieneWeb === true || org.tieneWebPropia === true;
      add('A4',hasSite?1:0,'W',org.enlaceWebGov || org.enlaceWebPropia || org.enlaceWeb || null,['tieneWeb','tieneWebPropia']);
    }

    if (yes(org.guiaTramites) || no(org.guiaTramites) || Number(org.qTramitesGuia || 0)>0) {
      const hasGuide = yes(org.guiaTramites) || Number(org.qTramitesGuia || 0)>0;
      add('A5',hasGuide?3:0,'W',org.enlaceGuia || null,Number(org.qTramitesGuia || 0)>0?['guiaTramites','qTramitesGuia']:['guiaTramites']);
    }

    if (yes(org.expedienteDigital) || no(org.expedienteDigital) || yes(org.tieneDoco) || no(org.tieneDoco)) {
      const hasExpediente = yes(org.expedienteDigital) || yes(org.tieneDoco);
      add('B1',hasExpediente?3:0,'S',yes(org.tieneDoco)?'DOCO registrado':null,yes(org.tieneDoco)?['expedienteDigital','tieneDoco']:['expedienteDigital']);
    }
    if (yes(org.usaSiif) || no(org.usaSiif)) add('B2',yes(org.usaSiif)?1:0,'S',org.resenaSiif || null,['usaSiif']);
    if (yes(org.firmaDigital) || no(org.firmaDigital)) add('B3',yes(org.firmaDigital)?1:0,'S',org.resenaFirma || null,['firmaDigital']);
  }
  return rows;
}

async function legacyCompletePlan(orgs:any[], observations:any[]) {
  const candidates = legacyCompleteCandidates(orgs);
  const insert: typeof candidates = [];
  const update: Array<{ id:number; value:typeof candidates[number] }> = [];
  for (const candidate of candidates) {
    const matching = observations.filter(row => row.organismoId === candidate.organismoId && row.variableId === candidate.variableId);
    const legacy = matching.find(row => String(row.notas || '').includes('[base monitor anterior]') && row.usuario === 'Migración del monitor anterior');
    if (legacy) {
      if (legacy.nivel !== candidate.nivel || legacy.evidencia !== candidate.evidencia || !String(legacy.notas || '').includes('[carga integral]')) update.push({id:legacy.id,value:candidate});
    } else if (matching.length === 0) insert.push(candidate);
  }
  return { candidates, insert, update };
}

app.get('/api/digital-index/legacy-baseline', requireAuth, checkRole(['admin', 'editor']), async (_req, res) => {
  try {
    const [allOrgs, priorMigrations, allObservations] = await Promise.all([
      db.select().from(organismos), db.select().from(digitalMigrations), db.select().from(digitalObservaciones)
    ]);
    const eligible = legacyBaselineCandidates(allOrgs).filter(candidate => !allObservations.some(row => row.organismoId === candidate.organismoId && row.variableId === candidate.variableId));
    const byVariable = Object.fromEntries(catalog.map((variable:any) => [variable.id, eligible.filter(row => row.variableId === variable.id).length]));
    res.json({ applied: priorMigrations.some(item => item.code === LEGACY_BASELINE_CODE), candidates: eligible.length, byVariable });
  } catch (error: any) { res.status(500).json({ error: error.message || 'No se pudo revisar la línea de base.' }); }
});

app.post('/api/digital-index/legacy-baseline', requireAuth, checkRole(['admin', 'editor']), async (req: AuthRequest, res) => {
  try {
    const result = await db.transaction(async tx => {
      const [prior] = await tx.select().from(digitalMigrations).where(eq(digitalMigrations.code, LEGACY_BASELINE_CODE)).limit(1);
      if (prior) throw new Error('La línea de base del monitor anterior ya fue migrada.');
      const [allOrgs, allObservations] = await Promise.all([tx.select().from(organismos), tx.select().from(digitalObservaciones)]);
      const eligible = legacyBaselineCandidates(allOrgs).filter(candidate => !allObservations.some(row => row.organismoId === candidate.organismoId && row.variableId === candidate.variableId));
      const byVariable = Object.fromEntries(catalog.map((variable:any) => [variable.id, eligible.filter(row => row.variableId === variable.id).length]));
      if (eligible.length) await tx.insert(digitalObservaciones).values(eligible);
      await tx.insert(digitalMigrations).values({ code: LEGACY_BASELINE_CODE, usuario: req.user?.username || 'Usuario', resumen: byVariable });
      return { inserted: eligible.length, byVariable };
    });
    res.status(201).json(result);
  } catch (error: any) {
    res.status(error.message?.includes('ya fue migrada') ? 409 : 500).json({ error: error.message || 'No se pudo migrar la línea de base.' });
  }
});

app.get('/api/digital-index/legacy-complete', requireAuth, checkRole(['admin', 'editor']), async (_req, res) => {
  try {
    const [allOrgs, allObservations, prior] = await Promise.all([
      db.select().from(organismos), db.select().from(digitalObservaciones), db.select().from(digitalMigrations).where(eq(digitalMigrations.code, LEGACY_COMPLETE_CODE)).limit(1)
    ]);
    const plan = await legacyCompletePlan(allOrgs, allObservations);
    const summary = Object.fromEntries(catalog.map((variable:any) => [variable.id, plan.insert.filter(row=>row.variableId===variable.id).length + plan.update.filter(item=>item.value.variableId===variable.id).length]));
    res.json({ applied:prior.length>0, candidates:plan.insert.length+plan.update.length, byVariable:summary });
  } catch (error:any) { res.status(500).json({error:error.message || 'No se pudo revisar la migración integral.'}); }
});

app.post('/api/digital-index/legacy-complete', requireAuth, checkRole(['admin', 'editor']), async (req:AuthRequest, res) => {
  try {
    const result = await db.transaction(async tx => {
      const [prior] = await tx.select().from(digitalMigrations).where(eq(digitalMigrations.code, LEGACY_COMPLETE_CODE)).limit(1);
      if (prior) throw new Error('La migración integral ya fue aplicada.');
      const [allOrgs, allObservations] = await Promise.all([tx.select().from(organismos),tx.select().from(digitalObservaciones)]);
      const plan = await legacyCompletePlan(allOrgs,allObservations);
      if (plan.insert.length) await tx.insert(digitalObservaciones).values(plan.insert);
      for (const item of plan.update) await tx.update(digitalObservaciones).set(item.value).where(eq(digitalObservaciones.id,item.id));
      const byVariable = Object.fromEntries(catalog.map((variable:any) => [variable.id, plan.insert.filter(row=>row.variableId===variable.id).length + plan.update.filter(item=>item.value.variableId===variable.id).length]));
      await tx.insert(digitalMigrations).values({code:LEGACY_COMPLETE_CODE,usuario:req.user?.username || 'Usuario',resumen:byVariable});
      return {inserted:plan.insert.length,updated:plan.update.length,byVariable};
    });
    res.status(201).json(result);
  } catch (error:any) { res.status(error.message?.includes('ya fue aplicada')?409:500).json({error:error.message || 'No se pudo completar la migración.'}); }
});

app.get('/api/digital-index/observations', async (_req, res) => {
  try {
    const rows = await db.select().from(digitalObservaciones).orderBy(desc(digitalObservaciones.fechaObservacion), desc(digitalObservaciones.id));
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'No se pudieron cargar las observaciones.' });
  }
});

app.get('/api/digital-index/verifications', requireAuth, checkRole(['admin', 'editor']), async (_req, res) => {
  try {
    const rows = await db.select().from(digitalVerificaciones);
    const organizations = await db.select({ id: organismos.id }).from(organismos);
    const complete = organizations.length > 0 && rows.filter(row => row.cerradoAt).length === organizations.length;
    res.json({ rows, total: organizations.length, closed: rows.filter(row => row.cerradoAt).length, cleanupReady: complete });
  } catch (error:any) { res.status(500).json({error:error.message || 'No se pudieron cargar las verificaciones.'}); }
});

app.post('/api/digital-index/organismos/:id/verification', requireAuth, checkRole(['admin', 'editor']), async (req: AuthRequest, res) => {
  const organismoId = Number(req.params.id);
  const { variableId, estado } = req.body || {};
  if (!catalog.some((item:any) => item.id === variableId) || !['confirmado', 'sin_evidencia'].includes(estado)) return res.status(400).json({error:'Verificación inválida.'});
  try {
    const [org] = await db.select().from(organismos).where(eq(organismos.id, organismoId)).limit(1);
    if (!org) return res.status(404).json({error:'Organismo no encontrado.'});
    const observations = await db.select().from(digitalObservaciones).where(eq(digitalObservaciones.organismoId, organismoId));
    const latest = observations.filter(row => row.variableId === variableId).sort((a,b)=>b.fechaObservacion.localeCompare(a.fechaObservacion)||b.id-a.id)[0];
    const username = req.user?.username || 'Usuario';
    const txResult = await db.transaction(async tx => {
      let level = latest?.nivel ?? 0;
      if (estado === 'sin_evidencia') level = 0;
      if (estado === 'confirmado' && !latest) return {error:'No hay un nivel observado para confirmar.'};
      if (latest && (estado === 'sin_evidencia' || latest.notas?.includes('[base monitor anterior]'))) {
        await tx.insert(digitalObservaciones).values({ organismoId, variableId, nivel:level, fuente:latest.fuente, fechaObservacion:new Date().toISOString().slice(0,10), evidencia:estado === 'confirmado' ? latest.evidencia : null, notas:`Verificación ${estado === 'confirmado' ? 'confirmada' : 'sin evidencia'} por ${username}.${latest.notas ? ` Dato de origen: ${latest.notas.replaceAll('[base monitor anterior]','').replaceAll('[carga integral]','').trim()}` : ''}`, usuario:username });
      }
      const [prior] = await tx.select().from(digitalVerificaciones).where(eq(digitalVerificaciones.organismoId, organismoId)).limit(1);
      const variables = {...(prior?.variables || {}), [variableId]:{estado,nivel:level,usuario:username,fecha:new Date().toISOString()}};
      await tx.insert(digitalVerificaciones).values({organismoId,variables,cerradoPor:null,cerradoAt:null}).onConflictDoUpdate({target:digitalVerificaciones.organismoId,set:{variables,cerradoPor:null,cerradoAt:null}});
      return {variables};
    });
    if ('error' in txResult) return res.status(400).json({error:txResult.error});
    res.json(txResult);
  } catch (error:any) { res.status(500).json({error:error.message || 'No se pudo guardar la verificación.'}); }
});

app.post('/api/digital-index/organismos/:id/verification/close', requireAuth, checkRole(['admin', 'editor']), async (req: AuthRequest, res) => {
  const organismoId = Number(req.params.id);
  try {
    const [record] = await db.select().from(digitalVerificaciones).where(eq(digitalVerificaciones.organismoId, organismoId)).limit(1);
    const allReviewed = catalog.every((item:any) => ['confirmado','sin_evidencia'].includes(record?.variables?.[item.id]?.estado));
    if (!allReviewed) return res.status(409).json({error:'Completá la verificación de las 11 variables antes de cerrar.'});
    const [closed] = await db.insert(digitalVerificaciones).values({organismoId,variables:record!.variables,cerradoPor:req.user?.username || 'Usuario',cerradoAt:new Date()}).onConflictDoUpdate({target:digitalVerificaciones.organismoId,set:{cerradoPor:req.user?.username || 'Usuario',cerradoAt:new Date()}}).returning();
    res.json(closed);
  } catch (error:any) { res.status(500).json({error:error.message || 'No se pudo cerrar la verificación.'}); }
});

app.delete('/api/digital-index/provisional-observations', requireAuth, checkRole(['admin']), async (_req, res) => {
  try {
    const [orgs, records] = await Promise.all([db.select({id:organismos.id}).from(organismos),db.select().from(digitalVerificaciones)]);
    const ready = orgs.length > 0 && records.length === orgs.length && records.every(record => Boolean(record.cerradoAt) && catalog.every((item:any)=>['confirmado','sin_evidencia'].includes(record.variables?.[item.id]?.estado)));
    if (!ready) return res.status(409).json({error:'La limpieza requiere cerrar la verificación de todos los organismos y sus 11 variables.'});
    const deleted = await db.delete(digitalObservaciones).where(sql`${digitalObservaciones.notas} LIKE '%[base monitor anterior]%'`).returning({id:digitalObservaciones.id});
    res.json({deleted:deleted.length});
  } catch (error:any) { res.status(500).json({error:error.message || 'No se pudieron retirar los registros provisorios.'}); }
});

app.post('/api/digital-index/observations', requireAuth, checkRole(['admin', 'editor']), async (req: AuthRequest, res) => {
  const { organismoId, variableId, nivel, fuente, fechaObservacion, evidencia, notas } = req.body || {};
  const variable = catalog.find((item: any) => item.id === variableId);
  if (!variable || !Number.isInteger(Number(organismoId)) || !Number.isInteger(nivel) || nivel < 0 || nivel > 3 || !['W', 'S', 'V'].includes(fuente) || !/^\d{4}-\d{2}-\d{2}$/.test(fechaObservacion || '')) {
    return res.status(400).json({ error: 'Datos inválidos. Revisá organismo, variable, nivel, fuente y fecha.' });
  }
  if (variableId === 'B1' && nivel !== 0 && nivel !== 3) {
    return res.status(400).json({ error: 'Expediente digital solo admite nivel 0 (sin sistema) o nivel 3 (en uso en todo el organismo).' });
  }
  if (variable.scale === 'binary' && nivel !== 0 && nivel !== 3) {
    return res.status(400).json({ error: 'La variable A5 solo admite los niveles 0 y 3.' });
  }
  if (variableId === 'A3' && nivel === 3) {
    return res.status(400).json({ error: 'El criterio del nivel 3 de A3 está pendiente de definición.' });
  }
  try {
    const [row] = await db.insert(digitalObservaciones).values({
      organismoId: Number(organismoId), variableId, nivel, fuente, fechaObservacion,
      evidencia: evidencia || null, notas: notas || null, usuario: req.user?.username || 'Usuario'
    }).returning();
    const [review] = await db.select().from(digitalVerificaciones).where(eq(digitalVerificaciones.organismoId, Number(organismoId))).limit(1);
    if (review) {
      const variables = {...review.variables};
      delete variables[variableId];
      await db.update(digitalVerificaciones).set({variables,cerradoPor:null,cerradoAt:null}).where(eq(digitalVerificaciones.organismoId, Number(organismoId)));
    }
    res.status(201).json(row);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'No se pudo guardar la observación.' });
  }
});

app.post('/api/digital-index/observations/import', requireAuth, checkRole(['admin', 'editor']), async (req: AuthRequest, res) => {
  const rows = req.body?.rows;
  if (!Array.isArray(rows) || rows.length === 0 || rows.length > 1000) {
    return res.status(400).json({ error: 'El archivo debe incluir entre 1 y 1000 observaciones.' });
  }
  const allOrgs = await db.select({ id: organismos.id }).from(organismos);
  const orgIds = new Set(allOrgs.map(org => org.id));
  const invalid: string[] = [];
  const values = rows.map((row: any, index: number) => {
    const variable = catalog.find((item: any) => item.id === row.variableId);
    const date = row.fechaObservacion;
    const valid = variable && orgIds.has(Number(row.organismoId)) && Number.isInteger(Number(row.nivel)) && Number(row.nivel) >= 0 && Number(row.nivel) <= 3 &&
      ['W', 'S', 'V'].includes(row.fuente) && /^\d{4}-\d{2}-\d{2}$/.test(date || '') &&
      !(variable.scale === 'binary' && Number(row.nivel) !== 0 && Number(row.nivel) !== 3) &&
      !(row.variableId === 'B1' && Number(row.nivel) !== 0 && Number(row.nivel) !== 3) &&
      !(row.variableId === 'A3' && Number(row.nivel) === 3);
    if (!valid) { invalid.push(`Fila ${index + 2}: datos inválidos o nivel no admitido.`); return null; }
    return { organismoId: Number(row.organismoId), variableId: row.variableId, nivel: Number(row.nivel), fuente: row.fuente, fechaObservacion: date, evidencia: row.evidencia || null, notas: row.notas || null, usuario: req.user?.username || 'Usuario' };
  });
  if (invalid.length) return res.status(400).json({ error: invalid.slice(0, 20).join(' '), invalidCount: invalid.length });
  try {
    await db.insert(digitalObservaciones).values(values as Array<NonNullable<typeof values[number]>>);
    for (const key of new Set(values.map((row:any)=>`${row.organismoId}:${row.variableId}`))) {
      const [organismoId, variableId] = key.split(':');
      const [review] = await db.select().from(digitalVerificaciones).where(eq(digitalVerificaciones.organismoId, Number(organismoId))).limit(1);
      if (review) { const variables = {...review.variables}; delete variables[variableId]; await db.update(digitalVerificaciones).set({variables,cerradoPor:null,cerradoAt:null}).where(eq(digitalVerificaciones.organismoId, Number(organismoId))); }
    }
    res.status(201).json({ inserted: values.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'No se pudo importar el archivo.' });
  }
});

app.get('/api/digital-index/cuts', async (_req, res) => {
  try {
    const rows = await db.select().from(digitalCortes).orderBy(desc(digitalCortes.fecha), desc(digitalCortes.id));
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'No se pudieron cargar los cortes.' });
  }
});

app.get('/api/digital-index/organismos/:id/extra', async (req, res) => {
  const organismoId = Number(req.params.id);
  try {
    const [tramites, visitas] = await Promise.all([
      db.select().from(digitalTramites).where(eq(digitalTramites.organismoId, organismoId)).orderBy(desc(digitalTramites.fecha), desc(digitalTramites.id)),
      db.select().from(digitalVisitas).where(eq(digitalVisitas.organismoId, organismoId)).orderBy(desc(digitalVisitas.fecha), desc(digitalVisitas.id))
    ]);
    res.json({ tramites, visitas });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'No se pudieron cargar los datos complementarios.' });
  }
});

app.post('/api/digital-index/organismos/:id/tramites', requireAuth, checkRole(['admin', 'editor']), async (req: AuthRequest, res) => {
  const organismoId = Number(req.params.id), { fecha, nativos, integrados, fueraMiCorrientes } = req.body || {};
  const { integradosLinks = [], fueraMiCorrientesLinks = [] } = req.body || {};
  const counts = [nativos, integrados, fueraMiCorrientes].map(Number);
  if (!Number.isInteger(organismoId) || !/^\d{4}-\d{2}-\d{2}$/.test(fecha || '') || counts.some(n => !Number.isInteger(n) || n < 0)) return res.status(400).json({ error: 'Fecha y cantidades inválidas.' });
  const validLinks = (links:unknown) => Array.isArray(links) && links.length <= 20 && links.every((value:unknown) => {
    if (typeof value !== 'string' || value.length > 2000) return false;
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol); } catch { return false; }
  });
  if (!validLinks(integradosLinks) || !validLinks(fueraMiCorrientesLinks)) return res.status(400).json({ error: 'Los enlaces deben ser URLs completas http o https (máximo 20 por categoría).' });
  try {
    const [row] = await db.insert(digitalTramites).values({ organismoId, fecha, nativos: counts[0], integrados: counts[1], fueraMiCorrientes: counts[2], integradosLinks, fueraMiCorrientesLinks, usuario: req.user?.username || 'Usuario' }).returning();
    res.status(201).json(row);
  } catch (error: any) { res.status(500).json({ error: error.message || 'No se pudo guardar el detalle de trámites.' }); }
});

app.post('/api/digital-index/organismos/:id/visitas', requireAuth, checkRole(['admin', 'editor']), async (req: AuthRequest, res) => {
  const organismoId = Number(req.params.id), { fecha, observaciones } = req.body || {};
  if (!Number.isInteger(organismoId) || !/^\d{4}-\d{2}-\d{2}$/.test(fecha || '')) return res.status(400).json({ error: 'Fecha inválida.' });
  try {
    const [row] = await db.insert(digitalVisitas).values({ organismoId, fecha, observaciones: observaciones || null, usuario: req.user?.username || 'Usuario' }).returning();
    res.status(201).json(row);
  } catch (error: any) { res.status(500).json({ error: error.message || 'No se pudo guardar la visita.' }); }
});

app.post('/api/digital-index/cuts', requireAuth, checkRole(['admin', 'editor']), async (req: AuthRequest, res) => {
  const { fecha, nombre } = req.body || {};
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha || '') || !nombre?.trim()) {
    return res.status(400).json({ error: 'Indicá el nombre y la fecha del corte.' });
  }
  try {
    const existingCuts = await db.select().from(digitalCortes);
    if (existingCuts.some(cut => cut.nombre.toLowerCase() === nombre.trim().toLowerCase())) {
      return res.status(409).json({ error: 'Ya existe un corte con ese nombre.' });
    }
    const [allOrgs, allObservations] = await Promise.all([
      db.select().from(organismos),
      db.select().from(digitalObservaciones)
    ]);
    const variables = catalog as Array<{id:string;points:number;dimension:string;scale:string}>;
    const snapshot = allOrgs.map(org => {
      const latest: Record<string, typeof allObservations[number]> = {};
      for (const observation of allObservations.filter(item => item.organismoId === org.id && item.fechaObservacion <= fecha)) {
        const previous = latest[observation.variableId];
        if (!previous || observation.fechaObservacion > previous.fechaObservacion ||
          (observation.fechaObservacion === previous.fechaObservacion && observation.fuente === 'V' && previous.fuente !== 'V') ||
          (observation.fechaObservacion === previous.fechaObservacion && observation.fuente === previous.fuente && observation.id > previous.id)) {
          latest[observation.variableId] = observation;
        }
      }
      const levels = Object.fromEntries(variables.map(variable => [variable.id, latest[variable.id]?.nivel ?? 0]));
      const dimensionA = variables.filter(v => v.dimension === 'A').reduce((sum, v) => sum + v.points * Number(levels[v.id]) / 3, 0);
      const dimensionB = variables.filter(v => v.dimension === 'B').reduce((sum, v) => sum + v.points * Number(levels[v.id]) / 3, 0);
      return { organismoId: org.id, nombre: org.nombre, niveles: levels, dimensionA, dimensionB, total: dimensionA + dimensionB };
    });
    const [cut] = await db.insert(digitalCortes).values({ fecha, nombre: nombre.trim(), snapshot, cerradoPor: req.user?.username || 'Usuario' }).returning();
    res.status(201).json(cut);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'No se pudo cerrar el corte.' });
  }
});

// Update Organismo (requiere autenticación con rol admin o editor)
app.put('/api/organismos/:id', requireAuth, checkRole(['admin', 'editor']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    // Sanitize data - extract only valid, updatable columns
    const allowedKeys = [
      'nombre', 'tipo', 'tieneWeb', 'enlaceWeb', 'enlaceWebGov',
      'tieneWebPropia', 'enlaceWebPropia', 'guiaTramites', 'enlaceGuia',
      'qTramitesGuia', 'tramitesOnline', 'enlaceTramitesOnline', 'qTramitesOnline',
      'iniciarTramOnline', 'enlaceIniciarTramOnline', 'qIniciarTramOnline',
      'expedienteDigital', 'usaIA', 'chatbot', 'turnosOnline', 'enlaceTurnosOnline',
      'seguimientoTramites', 'atencionDigital', 'capacitacion', 'capacitacionDigital',
      'fuente', 'nivelConfianza', 'completitud',
      'firmaDigital', 'analisisProcesos', 'tieneDoco', 'usaSiif',
      'tramitesMiCorrientes',
      'updatedAt'
    ];

    const updateFields: any = {};
    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        // Handle conversion of empty strings to null for text fields
        if (typeof data[key] === 'string' && data[key].trim() === '') {
          updateFields[key] = null;
        } else {
          updateFields[key] = data[key];
        }
      }
    }

    updateFields.updatedAt = new Date();

    const updatedResult = await db.update(organismos)
      .set(updateFields)
      .where(eq(organismos.id, Number(id)))
      .returning();

    if (updatedResult.length === 0) {
      return res.status(404).json({ error: "Organismo not found" });
    }

    // Registrar en el historial de cambios de forma local
    try {
      await db.insert(indicadoresHistory).values({
        organismoId: Number(id),
        userId: req.user?.username || 'Usuario Desconocido',
        snapshot: JSON.stringify(updatedResult[0])
      });
      console.log("History log saved for organism:", id);
    } catch (e) {
      console.error("Failed to write to history log:", e);
    }

    const formatted = {
      ...updatedResult[0],
      qTramitesGuia: Number(updatedResult[0].qTramitesGuia)
    };
    res.json(formatted);
  } catch (error: any) {
    console.error("Update failed:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET History of a single organism
app.get('/api/organismos/:id/history', requireAuth, checkRole(['admin', 'editor']), async (req, res) => {
  const { id } = req.params;
  try {
    const history = await db.select()
      .from(indicadoresHistory)
      .where(eq(indicadoresHistory.organismoId, Number(id)));
    
    // Sort in memory to avoid needing desc import if preferred, but we will sort it desc by date
    history.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET general history across all organisms
app.get('/api/history', requireAuth, checkRole(['admin', 'editor']), async (req, res) => {
  try {
    const history = await db.select().from(indicadoresHistory);
    const allOrgs = await db.select().from(organismos);

    // Map organism names for fast lookup
    const orgsMap = allOrgs.reduce((acc: any, o) => {
      acc[o.id] = o.nombre;
      return acc;
    }, {});

    const enriched = history.map(item => ({
      ...item,
      organismoNombre: orgsMap[item.organismoId] || 'Desconocido'
    }));

    // Sort descending by date
    enriched.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });

    res.json(enriched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// Configure Vite middleware in development or serve static build files in production
async function startServer() {
  // Ensure database is seeded on start
  await seedDatabaseIfEmpty();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
