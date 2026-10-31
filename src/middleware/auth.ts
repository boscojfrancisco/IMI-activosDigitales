import { Response, NextFunction, Request } from 'express';
import jwt from 'jsonwebtoken';
import { pilotFindAccess } from '../pilot-identity.ts';
export interface AuthRequest extends Request { user?: { idUsuario:number; username:string; tableroAcceso:string; esAdminGlobal:boolean } }
export const requireAuth = async (req:AuthRequest,res:Response,next:NextFunction) => {
 const token=req.headers.authorization?.match(/^Bearer (.+)$/)?.[1];
 if(!token) return res.status(401).json({error:'Falta sesión'});
 let id:number; let version:number;
 try { const payload=jwt.verify(token,process.env.PILOTO_JWT_SECRET!,{algorithms:['HS256'],audience:'activos-piloto'}) as any; id=payload.idUsuario; version=payload.versionSesion; if(!Number.isSafeInteger(id)||!Number.isSafeInteger(version)) throw new Error(); }
 catch { return res.status(401).json({error:'Sesión inválida'}); }
 try { const user=await pilotFindAccess(id); if(!user) return res.status(403).json({error:'Acceso inactivo'}); if(user.versionSesion!==version) return res.status(401).json({error:'Sesión vencida'}); req.user=user; next(); }
 catch { return res.status(503).json({error:'Identidad no disponible'}); }
};
export const checkRole = (roles:string[]) => (req:AuthRequest,res:Response,next:NextFunction) => {
 if(!req.user || !roles.includes(req.user.tableroAcceso)) return res.status(403).json({error:'Permisos insuficientes'}); next();
};

export const requireGlobalAdmin = (req:AuthRequest,res:Response,next:NextFunction) => {
 if(!req.user?.esAdminGlobal) return res.status(403).json({error:'Requiere administración global'});
 next();
};
