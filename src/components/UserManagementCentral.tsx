import React, { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';

type Access = { id:number; usuario:string; nombres:string|null; apellidos:string|null; rango:string|null; acceso_activo:boolean; cuenta_activa:boolean };
interface Props { token:string; currentUserId?:number }

// Esta pantalla administra únicamente accesos del tablero; las cuentas son centrales.
export default function UserManagementCentral({token,currentUserId}:Props) {
 const [users,setUsers]=useState<Access[]>([]),[message,setMessage]=useState(''),[busy,setBusy]=useState<number|null>(null);
 const call=useCallback(async (url:string,options:RequestInit={})=>{
  const response=await fetch(apiUrl(url),{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`}});
  if(!response.ok)throw Error('No se pudo completar la operación.');return response.json();
 },[token]);
 const refresh=useCallback(async()=>{try{setUsers(await call('/api/pilot/users'));setMessage('')}catch{setMessage('No se pudo cargar la lista de accesos.')}},[call]);
 useEffect(()=>{if(token)void refresh()},[token,refresh]);
 async function update(id:number,change:{role:string}|{activo:boolean}){setBusy(id);try{await call(`/api/pilot/users/${id}/access`,{method:'PATCH',body:JSON.stringify(change)});await refresh();setMessage('Acceso actualizado.')}catch{setMessage('No se pudo actualizar el acceso.')}finally{setBusy(null)}}
 return <section className="space-y-4"><div><h2 className="text-xl font-semibold">Accesos a Activos Digitales</h2><p>Las cuentas y contraseñas se administran de forma central. Acá podés revisar los accesos existentes a este tablero.</p><a href={apiUrl('/pilot-central')} className="underline">Abrir administración central</a></div>
  <p role="status">{message}</p><div className="overflow-x-auto"><table className="w-full text-left"><thead><tr><th>Usuario</th><th>Nombre</th><th>Rango</th><th>Acceso</th><th>Acción</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.usuario}</td><td>{[u.nombres,u.apellidos].filter(Boolean).join(' ')||'—'}</td><td><select aria-label={`Rango de ${u.usuario}`} value={u.rango||''} disabled={busy!==null||u.id===currentUserId} onChange={e=>void update(u.id,{role:e.target.value})}>{!u.rango&&<option value="">Sin rango</option>}<option value="reader">Lector</option><option value="editor">Editor</option><option value="admin">Administrador</option></select></td><td>{!u.cuenta_activa?'Cuenta inactiva':u.acceso_activo?'Habilitado':'Deshabilitado'}</td><td><button disabled={busy!==null||u.id===currentUserId||!u.rango||!u.cuenta_activa} onClick={()=>void update(u.id,{activo:!u.acceso_activo})}>{u.acceso_activo?'Quitar acceso':'Dar acceso'}</button></td></tr>)}</tbody></table></div>
 </section>;
}
