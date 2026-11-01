'use strict';
// Primitiva de coordinación; el llamador debe autenticar, validar y respaldar.
const {fork}=require('node:child_process');
const path=require('node:path');
async function guardedCut({lockClient,watchClients=[],verify,command,args,cwd}){
 if(process.platform!=='linux')throw Error('El corte supervisado requiere Linux');
 let watcher,pid,closed=false,ready=false,settled=false,timer;
 let rejectFailure;
 const failure=new Promise((_,reject)=>{rejectFailure=reject});
 const fail=message=>{if(!settled)rejectFailure(Error(message))};
 const onError=()=>fail('Se perdió la conexión que mantiene el bloqueo');
 const clients=[lockClient,...watchClients];
 for(const client of clients){client.on('error',onError);client.on('end',onError)}
 try{
  await lockClient.query('BEGIN');
  await lockClient.query("SET LOCAL lock_timeout='5s'");
  await lockClient.query('LOCK TABLE public.usuarios_imi IN SHARE MODE');
  await Promise.race([verify(),failure]);
  watcher=fork(path.join(__dirname,'guardia-watchdog.cjs'),[],{stdio:['ignore','inherit','inherit','ipc']});
  const finished=new Promise((resolve,reject)=>{
   watcher.on('message',m=>{
    if(m.type==='started')pid=m.pid;
    else if(m.type==='ready')ready=true;
    else if(m.type==='error')reject(Error('No se pudo iniciar el despliegue'));
    else if(m.type==='exit'){closed=true;resolve(m)}
   });
   watcher.once('error',()=>reject(Error('Falló el supervisor')));
   watcher.once('exit',()=>{if(!closed)reject(Error('El supervisor terminó inesperadamente'))});
  });
  const unexpectedExit=finished.then(()=>{throw Error('Despliegue terminó antes de confirmar')});
  watcher.send({type:'start',command,args,cwd});
  timer=setInterval(()=>{for(const client of clients)client.query('SELECT 1').catch(onError)},1000);timer.unref();
  const untilReady=(async()=>{while(!ready&&!settled){await new Promise(r=>setTimeout(r,50));if(closed)throw Error('Despliegue terminó antes de confirmar')} })();
  await Promise.race([untilReady,unexpectedExit,failure]);
  await Promise.race([lockClient.query('SELECT 1'),unexpectedExit,failure]);
  await Promise.race([verify(),unexpectedExit,failure]);
  watcher.send({type:'commit'});
  const result=await Promise.race([finished,failure]);
  if(result.code!==0)throw Error('El despliegue o su reversión falló');
  await lockClient.query('COMMIT');settled=true;
 }catch(error){
  if(watcher&&!closed){
   // El watchdog detiene el grupo y espera a que el runner ejecute rollback.
   if(watcher.connected)watcher.send({type:'abort'});
   await new Promise(resolve=>{if(watcher.exitCode!==null||watcher.signalCode!==null)return resolve();watcher.once('exit',resolve);setTimeout(resolve,125000).unref()});
   if(!closed&&pid){
    try{process.kill(-pid,'SIGTERM')}catch{}
    // Si cayó el watchdog, conservar los bloqueos mientras el runner revierte.
    for(let i=0;i<1200;i++){try{process.kill(-pid,0)}catch{break}await new Promise(r=>setTimeout(r,100))}
    try{process.kill(-pid,'SIGKILL')}catch{}
   }
  }
  await lockClient.query('ROLLBACK').catch(()=>{});settled=true;throw error;
 }finally{
  if(timer)clearInterval(timer);
  for(const client of clients){client.removeListener('error',onError);client.removeListener('end',onError)}
 }
}
module.exports={guardedCut};
