// Integración preparada para ensayo: identidad y datos usan conexiones independientes.
import pg from 'pg';
import fs from 'node:fs';
import dotenv from 'dotenv';
import {drizzle} from 'drizzle-orm/node-postgres';
import * as schema from './schema.ts';

dotenv.config({path:'.env.integrado.local',quiet:true});
if(process.env.IMI_INTEGRACION!=='si')throw new Error('La integración no está habilitada');
function required(name:string):string {const value=process.env[name];if(!value)throw new Error('Falta configuración: '+name);return value}
function pool(prefix:'IDENTIDAD'|'DATOS') {
 const host=required(prefix+'_HOST'),database=required(prefix+'_DATABASE'),user=required(prefix+'_USER'),password=required(prefix+'_PASSWORD');
 const port=Number(required(prefix+'_PORT'));if(!Number.isInteger(port)||port<1||port>65535)throw new Error('Puerto inválido: '+prefix);
 const localTest=process.env.IMI_PRUEBA_LOCAL==='si';
 if(localTest&&(host!=='127.0.0.1'||database!==(prefix==='IDENTIDAD'?'imi_identidad_prueba':'imi_datos_prueba')))throw new Error('La prueba solo admite bases locales descartables');
 if(!localTest&&database!==(prefix==='IDENTIDAD'?'imi_identidad':'imi_activos_digitales'))throw new Error('Base inesperada: '+prefix);
 const ssl=localTest?false:{ca:fs.readFileSync(required(prefix+'_CA'),'utf8'),rejectUnauthorized:true};
 const options=prefix==='DATOS'&&process.env.IMI_SOLO_LECTURA!=='no'?'-c default_transaction_read_only=on':undefined;
 return new pg.Pool({host,port,database,user,password,ssl,options,max:4,connectionTimeoutMillis:5000});
}
const identityPool=pool('IDENTIDAD'),businessPool=pool('DATOS');
export async function startPilotDatabases(){await identityPool.query('SELECT 1');const {rows}=await businessPool.query("SELECT current_setting('default_transaction_read_only') AS solo_lectura");if(process.env.IMI_SOLO_LECTURA!=='no'&&rows[0].solo_lectura!=='on')throw new Error('No se pudo iniciar la conexión de datos en modo de lectura')}
export const client={exec:(s:string)=>businessPool.query(s),query:(s:string,p?:any[])=>businessPool.query(s,p)};
export const identityClient={exec:(s:string)=>identityPool.query(s),query:(s:string,p?:any[])=>identityPool.query(s,p),transaction:async(fn:(tx:any)=>Promise<any>)=>{const tx=await identityPool.connect();try{await tx.query('BEGIN');const result=await fn(tx);await tx.query('COMMIT');return result}catch(e){await tx.query('ROLLBACK');throw e}finally{tx.release()}}};
export const db=drizzle(businessPool,{schema});
