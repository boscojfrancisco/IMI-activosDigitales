import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.ts';
import { usuarios } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

const JWT_SECRET = process.env.JWT_SECRET || 'imi-activos-digitales-secret-key-2026';

export interface AuthRequest extends Request {
  user?: {
    idUsuario: number;
    username: string;
    tableroAcceso: string;
  };
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
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
