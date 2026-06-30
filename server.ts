import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { db } from './src/db/index.ts';
import { organismos, indicadoresHistory } from './src/db/schema.ts';
import { eq } from 'drizzle-orm';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

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

// Update Organismo (sin autenticación para uso local)
app.put('/api/organismos/:id', async (req, res) => {
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
      'firmaDigital', 'analisisProcesos', 'tieneDoco', 'usaSiif'
    ];

    const updateFields: any = {};
    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        updateFields[key] = data[key];
      }
    }

    // Convert qTramitesGuia to number to prevent SQLite/Drizzle schema errors
    if (updateFields.qTramitesGuia !== undefined) {
      updateFields.qTramitesGuia = Number(updateFields.qTramitesGuia) || 0;
    }

    console.log("Updating organism ID:", id, "Fields:", updateFields);

    // Always update updatedAt timestamp
    updateFields.updatedAt = new Date();

    const updatedResult = await db.update(organismos)
      .set(updateFields)
      .where(eq(organismos.id, Number(id)))
      .returning();

    console.log("Updated result:", JSON.stringify(updatedResult[0]));

    if (updatedResult.length === 0) {
      return res.status(404).json({ error: "Organismo not found" });
    }

    // Registrar en el historial de cambios de forma local
    try {
      await db.insert(indicadoresHistory).values({
        organismoId: Number(id),
        userId: 'Usuario Local',
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
app.get('/api/organismos/:id/history', async (req, res) => {
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
app.get('/api/history', async (req, res) => {
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
