'use strict';
// Coordinador del primer corte. Requiere respaldos y revisión operativa previos.
const fs=require('node:fs');
const path=require('node:path');
const pg=require('pg');
const dotenv=require('dotenv');
const {guardedCut}=require('./guardia-corte.cjs');
const {validarCorte}=require('./validar-corte.cjs');
const APP='/home/ubuntu/ipecd-infra/apps/front/imi-activos';
function protectedFile(p){
 if(typeof p!=='string'||!p.startsWith('/home/ubuntu/'))throw Error('Ruta protegida inválida');
 const s=fs.statSync(p);if(!s.isFile()||(s.mode&0o077)!==0||s.uid!==process.getuid())throw Error('Archivo de corte sin permisos restringidos');
 return fs.readFileSync(p);
}
(async()=>{
 const revision=process.argv[2];
 if(process.argv.length!==3||!/^[a-f0-9]{40}$/.test(revision||''))throw Error('Indicar el commit completo');
 const runner='/usr/local/sbin/imi-activos-deploy-runner';
 if(!fs.readFileSync(runner).equals(fs.readFileSync(path.join(__dirname,'../cd/imi-activos-deploy-runner'))))throw Error('El runner instalado no coincide con la versión revisada');
 const config=JSON.parse(protectedFile(process.env.IMI_CORTE_CONFIG));
 const {source,target,caFile,keyFile}=config;
 if(!source||!target||source.host!==target.host||source.database!=='imi_activos_digitales'||target.database!=='imi_identidad'||
   !/^[a-zA-Z0-9.-]+$/.test(source.host||'')||!Number.isInteger(source.port)||source.port!==target.port||
   !source.user||!target.user||!source.password||!target.password)throw Error('Configuración de bases inesperada');
 const appConfig=dotenv.parse(protectedFile(APP+'/.env.integrado.local'));
 if(appConfig.IMI_INTEGRACION!=='si'||appConfig.IMI_SOLO_LECTURA!=='no'||appConfig.IMI_CONGELAR_IDENTIDAD!=='si'||
    appConfig.DATOS_DATABASE!==source.database||appConfig.IDENTIDAD_DATABASE!==target.database||
    appConfig.DATOS_HOST!==source.host||appConfig.IDENTIDAD_HOST!==target.host)throw Error('Configuración del tablero no lista para el corte');
 const key=protectedFile(keyFile),ca=fs.readFileSync(caFile,'utf8');
 if(key.length<32||!ca.includes('BEGIN CERTIFICATE'))throw Error('Clave o certificado inválido');
 const options=x=>({...x,ssl:{ca,rejectUnauthorized:true},connectionTimeoutMillis:5000,statement_timeout:10000});
 const old=new pg.Client(options(source)),identity=new pg.Client(options(target));
 // Escuchar errores también durante el inicio de ambas conexiones.
 const initialError=()=>{};old.on('error',initialError);identity.on('error',initialError);
 try{
  await old.connect();await identity.connect();
  await identity.query('BEGIN');await identity.query("SET LOCAL lock_timeout='5s'");
  await identity.query('LOCK TABLE identidad.usuarios, identidad.accesos, identidad.tableros, identidad.rangos, identidad.identidades_origen, identidad.migracion_activos, identidad.equivalencias_activos IN SHARE MODE');
  await guardedCut({lockClient:old,watchClients:[identity],verify:()=>validarCorte(old,identity,key,8),command:runner,args:[revision],cwd:APP});
  console.log('Corte confirmado; mantener la congelación de identidad durante la observación.');
 }finally{
  await identity.query('ROLLBACK').catch(()=>{});
  await old.end().catch(()=>{});await identity.end().catch(()=>{});
 }
})().catch(e=>{console.error('Corte no confirmado:',e.code||e.message);process.exitCode=1});
