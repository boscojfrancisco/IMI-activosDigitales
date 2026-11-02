import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.ts';
import { usuarios } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'imi-activos-digitales-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    idUsuario: number | null;
    origen?: 'central' | 'local';
    username: string;
    tableroAcceso: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // La cookie solo se valida contra el servicio local de identidad; nunca se acepta
  // un usuario o rango enviado directamente por el navegador.
  const pair = (req.headers.cookie || '').split(';').map(x => x.trim())
    .find(x => /^imi_sso=[A-Za-z0-9_-]{43}$/.test(x));
  if (pair) {
    try {
      const response = await fetch('http://127.0.0.1:39001/sso/me', {
        headers: { cookie: pair }, signal: AbortSignal.timeout(1500), redirect: 'error'
      });
      if (response.ok) {
        const session = await response.json() as { usuario?: unknown; tableros?: Array<{codigo: string; rango: string}> };
        const board = Array.isArray(session.tableros) && session.tableros.find(t => t.codigo === 'activos');
        if (typeof session.usuario === 'string' && board && ['admin', 'editor', 'reader'].includes(board.rango)) {
          if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
            const origin = req.headers.origin;
            // El origen público es fijo; no se confía en encabezados enviados por el cliente.
            const localOrigin = process.env.IMI_SSO_LOCAL_ORIGIN;
            if (origin !== 'https://appimi.corrientes.gob.ar' && (!localOrigin || origin !== localOrigin))
              return res.status(403).json({ error: 'Origen no permitido' });
          }
          req.user = { idUsuario: null, username: session.usuario, tableroAcceso: board.rango, origen: 'central' };
          return next();
        }
      }
    } catch { /* La autenticación anterior continúa disponible si identidad no responde. */ }
  }
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verificar en la base de datos que el usuario exista y esté activo
    const userRecords = await db.select()
      .from(usuarios)
      .where(eq(usuarios.idUsuario, decoded.idUsuario))
      .limit(1);

    if (userRecords.length === 0) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    const dbUser = userRecords[0];
    if (!dbUser.activo) {
      return res.status(403).json({ error: 'Forbidden: User account is disabled' });
    }

    // Guardar los datos actuales (por si el administrador le cambió el rol entre inicios de sesión)
    req.user = {
      idUsuario: dbUser.idUsuario,
      username: dbUser.username,
      tableroAcceso: dbUser.tableroAcceso,
      origen: 'local',
    };
    
    next();
  } catch (error) {
    console.error('Error verifying JWT token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const checkRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Missing session' });
    }
    if (!allowedRoles.includes(req.user.tableroAcceso)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    next();
  };
};
