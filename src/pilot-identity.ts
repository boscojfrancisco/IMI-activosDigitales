import fs from 'node:fs';
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { client as business, identityClient as client, startPilotDatabases } from './db/index.ts';
let offline=false;
const pbkdf2Async=promisify(crypto.pbkdf2);
const NEW_ALGORITHM='scrypt-n131072-r8-p1';
let scryptInFlight=0;
async function digest(pw:string,salt:string,legacy=false):Promise<Buffer>{
 if(scryptInFlight>=2) throw new Error('Capacidad de autenticación ocupada');
 scryptInFlight++;
 try{return await new Promise<Buffer>((resolve,reject)=>crypto.scrypt(pw,salt,32,legacy?{N:16384,r:8,p:1,maxmem:32*1024*1024}:{N:131072,r:8,p:1,maxmem:192*1024*1024},(err,value)=>err?reject(err):resolve(value as Buffer)));}finally{scryptInFlight--;}
}
async function verifyCredential(password:string,stored:string,algorithm:string){
 const parts=stored.split(':');if(parts.length!==2||!/^[0-9a-f]{32}$/i.test(parts[0])||!/^[0-9a-f]+$/i.test(parts[1]))return false;
 const [salt,value]=parts,expected=Buffer.from(value,'hex');let actual:Buffer;
 if(algorithm===NEW_ALGORITHM)actual=await digest(password,salt);
 else if(algorithm==='scrypt-piloto')actual=await digest(password,salt,true);
 else if(algorithm==='pbkdf2-sha512-1000-legado')actual=await pbkdf2Async(password,salt,1000,64,'sha512');
 else return false;
 return actual.length===expected.length&&crypto.timingSafeEqual(actual,expected);
}
async function upgradeCredential(tx:any,id:number,password:string){
 const salt=crypto.randomBytes(16).toString('hex'),hash=salt+':'+(await digest(password,salt)).toString('hex');
 await tx.query('UPDATE identidad.credenciales SET password_hash=$1,algoritmo=$2,actualizado_en=now() WHERE usuario_id=$3',[hash,NEW_ALGORITHM,id]);
 await tx.query("INSERT INTO identidad.auditoria(actor_usuario_id,accion,objeto_tipo,objeto_id,resultado) VALUES($1,'actualizacion_hash_legado','usuario',$2,'exito')",[id,String(id)]);
}
export async function initializePilot() {
 await startPilotDatabases();
 const {rows:[r]}=await client.query("SELECT to_regclass('identidad.usuarios') IS NOT NULL AS ready");
 if(!r.ready) throw new Error('El esquema debe instalarse mediante una migración administrada');
}
export async function pilotFindAccess(id:number) {
 if(offline) throw new Error('simulated outage');
 const {rows}=await client.query(`SELECT u.id::int AS "idUsuario",u.usuario AS username,r.codigo AS "tableroAcceso",u.version_sesion AS "versionSesion",u.es_admin_global AS "esAdminGlobal" FROM identidad.usuarios u JOIN identidad.accesos a ON a.usuario_id=u.id JOIN identidad.tableros t ON t.id=a.tablero_id JOIN identidad.rangos r ON r.id=a.rango_id AND r.tablero_id=t.id WHERE u.id=$1 AND u.activo AND a.activo AND t.activo AND t.codigo='activos'`,[id]);
 return rows[0] || null;
}
export async function pilotLogin(username:string,password:string) {
 if(offline) throw new Error('identity offline');
 return client.transaction(async(tx:any)=>{
  const {rows:[u]}=await tx.query(`SELECT u.id::int AS "idUsuario",u.usuario AS username,u.version_sesion AS "versionSesion",u.es_admin_global AS "esAdminGlobal",r.codigo AS "tableroAcceso",c.password_hash,c.algoritmo FROM identidad.usuarios u JOIN identidad.credenciales c ON c.usuario_id=u.id JOIN identidad.accesos a ON a.usuario_id=u.id JOIN identidad.tableros t ON t.id=a.tablero_id JOIN identidad.rangos r ON r.id=a.rango_id AND r.tablero_id=t.id WHERE lower(btrim(u.usuario))=lower(btrim($1)) AND u.activo AND a.activo AND t.activo AND t.codigo='activos' FOR UPDATE OF c`,[username]);
  if(!u) return null;
  if(!(await verifyCredential(password,u.password_hash,u.algoritmo)))return null;
  if(u.algoritmo!==NEW_ALGORITHM)await upgradeCredential(tx,u.idUsuario,password);
  return {idUsuario:u.idUsuario,username:u.username,versionSesion:u.versionSesion,esAdminGlobal:u.esAdminGlobal,tableroAcceso:u.tableroAcceso};
 });
}
// Gestión experimental; la delegación al administrador del tablero es una hipótesis,
// pendiente de aprobación antes de cualquier uso real.
export async function pilotCreateUser(data:any, actor:number) {
 if(offline) throw new Error('identity offline');
 const fields=['username','password'];
 const optional=['nombres','apellidos','correo','organizacion','puesto'];
 if(fields.some(k=>typeof data[k]!=='string'||!data[k].trim()) || optional.some(k=>data[k]!=null&&typeof data[k]!=='string') || data.password.length<12 || data.password.length>256 || (data.role!=null&&data.role!==''&&!['admin','editor','reader'].includes(data.role))) return {status:400};
 const salt=crypto.randomBytes(16).toString('hex'); const hashed=salt+':'+(await digest(data.password,salt)).toString('hex');
 try {
  return await client.transaction(async (tx:any)=>{
   const {rows:[user]}=await tx.query('INSERT INTO identidad.usuarios(usuario,nombres,apellidos,correo,organizacion,puesto,activo) VALUES($1,$2,$3,$4,$5,$6,true) RETURNING id',[data.username.trim(),...['nombres','apellidos','correo','organizacion','puesto'].map(k=>data[k]?.trim()||null)]);
   await tx.query("INSERT INTO identidad.credenciales(usuario_id,password_hash,algoritmo) VALUES($1,$2,'scrypt-n131072-r8-p1')",[user.id,hashed]);
   if(data.role) await tx.query("INSERT INTO identidad.accesos(usuario_id,tablero_id,rango_id,activo) SELECT $1,t.id,r.id,true FROM identidad.tableros t JOIN identidad.rangos r ON r.tablero_id=t.id WHERE t.codigo='activos' AND r.codigo=$2",[user.id,data.role]);
   await tx.query("INSERT INTO identidad.auditoria(actor_usuario_id,accion,objeto_tipo,objeto_id,resultado) VALUES ($1,'alta','usuario',$2,'exito')",[actor,String(user.id)]);
   return {status:201,id:Number(user.id)};
  });
 } catch(e:any) {if(e.code==='23505') return {status:409}; throw e;}
}
export async function pilotUpdateProfile(id:number,actor:number,changes:any){
 if(offline) throw new Error('identity offline');
 if(!Number.isSafeInteger(id)||id<=0||!changes||typeof changes!=='object'||Array.isArray(changes)) return {status:400};
 const allowed=['nombres','apellidos','correo','organizacion','puesto'];const keys=Object.keys(changes);
 if(!keys.length||keys.some(k=>!allowed.includes(k)||(changes[k]!==null&&typeof changes[k]!=='string')||(typeof changes[k]==='string'&&changes[k].length>255)))return {status:400};
 const values=keys.map(k=>changes[k]?.trim()||null);
 return client.transaction(async(tx:any)=>{
  const assigns=keys.map((k,i)=>'"'+k+'"=$'+(i+1)).join(',');
  const result=await tx.query('UPDATE identidad.usuarios SET '+assigns+',actualizado_en=now() WHERE id=$'+(keys.length+1)+' RETURNING id',[...values,id]);
  if(!result.rows.length)return {status:404};
  await tx.query("INSERT INTO identidad.auditoria(actor_usuario_id,accion,objeto_tipo,objeto_id,resultado) VALUES ($1,'edicion_perfil','usuario',$2,'exito')",[actor,String(id)]);
  return {status:200};
 });
}
export async function pilotSetAccess(id:number,actor:number,change:any) {
 if(offline) throw new Error('identity offline');
 if(!Number.isSafeInteger(id) || id<=0 || id===actor) return {status:400};
 const isRole=Object.hasOwn(change,'role'), isActive=Object.hasOwn(change,'activo');
 if(isRole===isActive || (isRole&&!['admin','editor','reader'].includes(change.role)) || (isActive&&typeof change.activo!=='boolean')) return {status:400};
 return client.transaction(async(tx:any)=>{
  const result=isRole
   ? await tx.query("INSERT INTO identidad.accesos(usuario_id,tablero_id,rango_id,activo) SELECT u.id,t.id,r.id,false FROM identidad.usuarios u JOIN identidad.tableros t ON t.codigo='activos' JOIN identidad.rangos r ON r.tablero_id=t.id AND r.codigo=$2 WHERE u.id=$1 ON CONFLICT(usuario_id,tablero_id) DO UPDATE SET rango_id=excluded.rango_id,actualizado_en=now() RETURNING id",[id,change.role])
   : await tx.query("UPDATE identidad.accesos a SET activo=$2,actualizado_en=now() FROM identidad.tableros t WHERE a.usuario_id=$1 AND a.tablero_id=t.id AND t.codigo='activos' RETURNING a.id",[id,change.activo]);
  if(!result.rows.length) return {status:404};
  await tx.query("INSERT INTO identidad.auditoria(actor_usuario_id,accion,objeto_tipo,objeto_id,resultado) VALUES ($1,$2,'acceso',$3,'exito')",[actor,isRole?'cambio_rango':'cambio_acceso',String(result.rows[0].id)]);
  return {status:200};
 });
}
export async function pilotListUsers(includeUnassigned=false) {
 if(offline) throw new Error('identity offline');
 return (await client.query(`SELECT u.id::int AS id,u.usuario,u.nombres,u.apellidos,u.correo,u.organizacion,u.puesto,u.activo AS cuenta_activa,COALESCE(a.activo,false) AS acceso_activo,r.codigo AS rango FROM identidad.usuarios u LEFT JOIN identidad.accesos a ON a.usuario_id=u.id AND a.tablero_id=(SELECT id FROM identidad.tableros WHERE codigo='activos') LEFT JOIN identidad.rangos r ON r.id=a.rango_id AND r.tablero_id=a.tablero_id WHERE ($1::boolean OR a.id IS NOT NULL) ORDER BY u.id`,[includeUnassigned])).rows;
}

export async function pilotChangePassword(id:number, current:string, next:string) {
 if(offline) throw new Error('identity offline');
 if(typeof current!=='string'||typeof next!=='string'||next.length<12||next.length>256||current===next) return {status:400};
 return client.transaction(async(tx:any)=>{
  const {rows:[credential]}=await tx.query('SELECT password_hash,algoritmo FROM identidad.credenciales WHERE usuario_id=$1 FOR UPDATE',[id]);
  if(!credential) return {status:401};
  if(!(await verifyCredential(current,credential.password_hash,credential.algoritmo)))return {status:401};
  const newSalt=crypto.randomBytes(16).toString('hex');const newHash=newSalt+':'+(await digest(next,newSalt)).toString('hex');
  await tx.query("UPDATE identidad.credenciales SET password_hash=$1,algoritmo='scrypt-n131072-r8-p1',actualizado_en=now() WHERE usuario_id=$2",[newHash,id]);
  await tx.query('UPDATE identidad.usuarios SET version_sesion=version_sesion+1,actualizado_en=now() WHERE id=$1',[id]);
  await tx.query('DELETE FROM identidad.recuperaciones WHERE usuario_id=$1',[id]);
  await tx.query("INSERT INTO identidad.auditoria(actor_usuario_id,accion,objeto_tipo,objeto_id,resultado) VALUES ($1,'cambio_contrasena','usuario',$2,'exito')",[id,String(id)]);
  return {status:200};
 });
}

// Piloto: el administrador debe verificar la identidad fuera del sistema.
export async function pilotIssueRecovery(id:number,actor:number) {
 if(offline) throw new Error('identity offline');
 if(!Number.isSafeInteger(id)||id<=0||id===actor) return {status:400};
 const token=crypto.randomBytes(32).toString('base64url');
 const tokenHash=crypto.createHash('sha256').update(token).digest('hex');
 return client.transaction(async(tx:any)=>{
  const user=await tx.query('SELECT id FROM identidad.usuarios WHERE id=$1 AND activo AND NOT es_admin_global FOR UPDATE',[id]);
  if(!user.rows.length) return {status:404};
  await tx.query("INSERT INTO identidad.recuperaciones(usuario_id,token_hash,vence_en) VALUES ($1,$2,now()+interval '15 minutes') ON CONFLICT (usuario_id) DO UPDATE SET token_hash=excluded.token_hash,vence_en=excluded.vence_en,creado_en=now()",[id,tokenHash]);
  await tx.query("INSERT INTO identidad.auditoria(actor_usuario_id,accion,objeto_tipo,objeto_id,resultado) VALUES ($1,'emision_recuperacion','usuario',$2,'exito')",[actor,String(id)]);
  return {status:200,token};
 });
}
export async function pilotConsumeRecovery(token:string,password:string) {
 if(offline) throw new Error('identity offline');
 if(typeof token!=='string'|| !/^[A-Za-z0-9_-]{43}$/.test(token) || typeof password!=='string'||password.length<12||password.length>256) return {status:400};
 const tokenHash=crypto.createHash('sha256').update(token).digest('hex');
 return client.transaction(async(tx:any)=>{
  const result=await tx.query('SELECT rec.usuario_id FROM identidad.recuperaciones rec JOIN identidad.usuarios u ON u.id=rec.usuario_id WHERE rec.token_hash=$1 AND rec.vence_en>now() AND u.activo AND NOT u.es_admin_global FOR UPDATE OF rec,u',[tokenHash]);
  if(!result.rows.length) return {status:400};
  const id=result.rows[0].usuario_id;const salt=crypto.randomBytes(16).toString('hex');const hash=salt+':'+(await digest(password,salt)).toString('hex');
  const updated=await tx.query("UPDATE identidad.credenciales SET password_hash=$1,algoritmo='scrypt-n131072-r8-p1',actualizado_en=now() WHERE usuario_id=$2 RETURNING usuario_id",[hash,id]);
  if(!updated.rows.length) return {status:400};
  await tx.query('UPDATE identidad.usuarios SET version_sesion=version_sesion+1,actualizado_en=now() WHERE id=$1',[id]);
  await tx.query('DELETE FROM identidad.recuperaciones WHERE usuario_id=$1',[id]);
  await tx.query("INSERT INTO identidad.auditoria(actor_usuario_id,accion,objeto_tipo,objeto_id,resultado) VALUES ($1,'recuperacion_contrasena','usuario',$2,'exito')",[id,String(id)]);
  return {status:200};
 });
}

// Identidad de administración independiente de accesos al tablero.
export async function pilotFindGlobal(id:number) {
 if(offline) throw new Error('identity offline');
 const {rows}=await client.query('SELECT id::int AS "idUsuario",usuario AS username,version_sesion AS "versionSesion",es_admin_global AS "esAdminGlobal" FROM identidad.usuarios WHERE id=$1 AND activo AND es_admin_global',[id]);return rows[0] || null;
}
export async function pilotGlobalLogin(username:string,password:string) {
 if(offline) throw new Error('identity offline');
 return client.transaction(async(tx:any)=>{
  const {rows:[u]}=await tx.query('SELECT u.id::int AS id,c.password_hash,c.algoritmo FROM identidad.usuarios u JOIN identidad.credenciales c ON c.usuario_id=u.id WHERE lower(btrim(u.usuario))=lower(btrim($1)) AND u.activo AND u.es_admin_global FOR UPDATE OF c',[username]);
  if(!u||!(await verifyCredential(password,u.password_hash,u.algoritmo)))return null;
  if(u.algoritmo!==NEW_ALGORITHM)await upgradeCredential(tx,u.id,password);
  const {rows:[admin]}=await tx.query('SELECT id::int AS "idUsuario",usuario AS username,version_sesion AS "versionSesion",es_admin_global AS "esAdminGlobal" FROM identidad.usuarios WHERE id=$1 AND activo AND es_admin_global',[u.id]);
  return admin || null;
 });
}

export async function pilotPersistentLimit(keys:string[]) {
 if(offline) throw new Error('identity offline');
 return client.transaction(async(tx:any)=>{
  let allowed=true;
  for(const key of keys){
   const {rows:[result]}=await tx.query(`INSERT INTO identidad.limites_acceso(clave,cantidad,vence_en) VALUES($1,1,now()+interval '1 minute') ON CONFLICT(clave) DO UPDATE SET cantidad=CASE WHEN identidad.limites_acceso.vence_en<=now() THEN 1 ELSE identidad.limites_acceso.cantidad+1 END, vence_en=CASE WHEN identidad.limites_acceso.vence_en<=now() THEN now()+interval '1 minute' ELSE identidad.limites_acceso.vence_en END RETURNING cantidad`,[key]);
   if(result.cantidad>20)allowed=false;
  }
  return allowed;
 });
}



// Flujo de alta ensayado en una base efímera. La emisión sin autenticación se limita a __pilot.
function tokenDigest(value:string){return crypto.createHash('sha256').update(value).digest('hex')}
export async function pilotBootstrapStart(data:any) {
 const fields=['token','username','password'];
 if(fields.some(k=>typeof data[k]!=='string'||!data[k].trim()) || ['nombres','apellidos','correo','organizacion','puesto'].some(k=>data[k]!=null&&typeof data[k]!=='string') || !/^[A-Za-z0-9_-]{43}$/.test(data.token) || data.password.length<12 || data.password.length>256) return null;
 const salt=crypto.randomBytes(16).toString('hex'),hash=salt+':'+(await digest(data.password,salt)).toString('hex');
 try{return await client.transaction(async(tx:any)=>{
  await tx.query('SELECT pg_advisory_xact_lock(637257184)');
  const existing=await tx.query('SELECT 1 FROM identidad.usuarios WHERE activo AND es_admin_global LIMIT 1');if(existing.rows.length)return null;
  const invite=await tx.query('DELETE FROM identidad.invitaciones_admin WHERE token_hash=$1 AND usuario_normalizado=lower(btrim($2)) AND vence_en>now() RETURNING token_hash',[tokenDigest(data.token),data.username]);if(!invite.rows.length)return null;
  const {rows:[u]}=await tx.query('INSERT INTO identidad.usuarios(usuario,nombres,apellidos,correo,organizacion,puesto,activo,es_admin_global) VALUES($1,$2,$3,$4,$5,$6,true,true) RETURNING id',[data.username.trim(),...['nombres','apellidos','correo','organizacion','puesto'].map(k=>data[k]?.trim()||null)]);
  await tx.query("INSERT INTO identidad.credenciales(usuario_id,password_hash,algoritmo) VALUES($1,$2,'scrypt-n131072-r8-p1')",[u.id,hash]);
  await tx.query("INSERT INTO identidad.auditoria(actor_usuario_id,accion,objeto_tipo,objeto_id,resultado) VALUES($1,'alta_admin_con_contrasena','usuario',$2,'exito')",[u.id,String(u.id)]);
  return {activated:true};
 });}catch(e:any){if(e.code==='23505')return null;throw e;}
}
