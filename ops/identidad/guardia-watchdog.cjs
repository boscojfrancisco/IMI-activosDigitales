'use strict';
// Supervisa el proceso de despliegue incluso si su coordinador desaparece.
const {spawn}=require('node:child_process');
if(!process.send||process.platform!=='linux')throw Error('Se requiere coordinador Linux');
let child,ready=false,stopping=false,timer;
function stop(){
 if(stopping)return;stopping=true;
 if(child&&child.exitCode===null&&child.signalCode===null){
  try{process.kill(-child.pid,'SIGTERM')}catch(e){if(e.code!=='ESRCH')console.error('No se pudo detener el despliegue')}
  timer=setTimeout(()=>{try{process.kill(-child.pid,'SIGKILL')}catch{}},120000);timer.unref();
 }
}
process.on('disconnect',stop);
process.on('message',msg=>{
 if(msg.type==='start'&&!child){
  if(stopping||!process.connected)return;
  child=spawn(msg.command,msg.args,{cwd:msg.cwd,env:{...process.env,IMI_GUARDED_CUT:'si'},detached:true,stdio:['ignore','inherit','inherit','pipe','pipe']});
  child.on('error',()=>{if(process.connected)process.send({type:'error'})});
  child.stdout?.resume();
  child.stdio[3].setEncoding('utf8');let input='';
  child.stdio[3].on('data',data=>{input+=data;if(input.length>64){stop();return}if(input.includes('\n')){if(input!=='READY\n'||ready){stop();return}ready=true;if(process.connected)process.send({type:'ready'})}});
  child.on('spawn',()=>{if(process.connected)process.send({type:'started',pid:child.pid});else stop()});
  child.on('exit',(code,signal)=>{if(timer)clearTimeout(timer);if(process.connected)process.send({type:'exit',code,signal},()=>process.exit(0));else process.exit(0)});
 }else if(msg.type==='commit'&&child&&ready&&!stopping){child.stdio[4].end('COMMIT\n')}
 else if(msg.type==='abort')stop();
});
