import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { db } from './src/db/index.ts';
import { organismos, indicadoresHistory, usuarios } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { requireAuth, checkRole, AuthRequest } from './src/middleware/auth.ts';

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

// Registro de usuarios
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    // Comprobar si el usuario ya existe
    const existing = await db.select()
      .from(usuarios)
      .where(eq(usuarios.username, username))
      .limit(1);

    if (existing.length > 0) {
      return res.status(400).json({ error: 'El nombre de usuario ya está registrado' });
    }

    // Contar cantidad de usuarios actuales para ver si es el primero
    const allUsers = await db.select().from(usuarios);
    const isFirstUser = allUsers.length === 0;
    const role = isFirstUser ? 'admin' : 'reader';

    const passwordHash = hashPassword(password);

    await db.insert(usuarios).values({
      username,
      passwordHash,
      tableroAcceso: role,
      activo: true
    });

    return res.json({ success: true, message: `Usuario registrado exitosamente con rol ${role}` });
  } catch (err: any) {
    console.error('Error al registrar usuario:', err);
    return res.status(500).json({ error: err.message || 'Error interno del servidor' });
  }
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
