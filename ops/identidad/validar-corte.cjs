'use strict';
// Validación en las transacciones bloqueadas; no escribe ni muestra usuarios.
const crypto=require('node:crypto');
function fingerprint(r,key){return crypto.createHmac('sha256',key).update(JSON.stringify([String(r.id_usuario),r.username,r.tablero_acceso,r.activo,r.password_hash])).digest('hex')}
async function validarCorte(source,target,key,expectedCount){
 const {rows:old}=await source.query('SELECT id_usuario,username,lower(btrim(username)) normalizado,password_hash,tablero_acceso,activo FROM public.usuarios_imi ORDER BY id_usuario');
 const {rows}=await target.query(`SELECT m.id_origen,m.usuario_id,m.huella,m.activo_origen,m.rango_origen,
 lower(btrim(u.usuario)) usuario_normalizado,u.activo cuenta_activa,a.activo acceso_activo,r.codigo rango,
 eq.usuario_id alias_usuario_id,eq.usuario_origen_normalizado
 FROM identidad.migracion_activos m JOIN identidad.usuarios u ON u.id=m.usuario_id
 JOIN identidad.identidades_origen i ON i.usuario_id=u.id AND i.id_origen=m.id_origen AND i.sistema='activos' AND i.entidad='usuarios_imi'
 JOIN identidad.accesos a ON a.usuario_id=u.id JOIN identidad.tableros t ON t.id=a.tablero_id AND t.codigo='activos' AND t.activo
 JOIN identidad.rangos r ON r.id=a.rango_id AND r.tablero_id=t.id
 LEFT JOIN identidad.equivalencias_activos eq ON eq.id_origen=m.id_origen`);
 const {rows:[extra]}=await target.query("SELECT count(*)::int n FROM identidad.identidades_origen WHERE sistema='activos' AND entidad='usuarios_imi'");
 if(!Buffer.isBuffer(key)||key.length<32||old.length!==expectedCount||rows.length!==expectedCount||extra.n!==expectedCount)throw Error('Cantidad o configuración inesperada');
 const links=new Map(rows.map(r=>[String(r.id_origen),r])),seen=new Set();
 if(links.size!==rows.length)throw Error('Identificadores duplicados');
 for(const r of old){
  const m=links.get(String(r.id_usuario)),same=m?.usuario_normalizado===r.normalizado;
  const alias=m?.alias_usuario_id!=null&&String(m.alias_usuario_id)===String(m.usuario_id)&&m.usuario_origen_normalizado===r.normalizado;
  if(!m||!r.normalizado||seen.has(r.normalizado)||!r.activo||!m.cuenta_activa||!m.acceso_activo||!['admin','editor','reader'].includes(r.tablero_acceso)||
     (m.alias_usuario_id!=null&&!alias)||(!same&&!alias)||m.huella!==fingerprint(r,key)||!m.activo_origen||m.rango_origen!==r.tablero_acceso||m.rango!==r.tablero_acceso)
   throw Error('Origen, equivalencia o permisos no coinciden');
  seen.add(r.normalizado);
 }
 return {cuentas:old.length};
}
module.exports={validarCorte};
