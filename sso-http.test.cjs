const { Pool } = require('pg');
const http = require('node:http');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const delay = ms => new Promise(r => setTimeout(r, ms));
const cookieAdmin = 'a'.repeat(43), cookieEditor = 'b'.repeat(43), cookieOther = 'c'.repeat(43);
(async () => {
  const pool = new Pool({ connectionString: 'postgresql://postgres:pass-prueba-local@127.0.0.1:55437/activos_test' });
  let identity, app;
  try {
    for (let i = 0; ; i++) { try { await pool.query('SELECT 1'); break; } catch (e) { if (i === 30) throw e; await delay(500); } }
    await pool.query(`CREATE TABLE organismos (id SERIAL PRIMARY KEY); CREATE TABLE usuarios_imi (id_usuario SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL, tablero_acceso VARCHAR(100) NOT NULL, activo BOOLEAN NOT NULL, fecha_creacion TIMESTAMPTZ DEFAULT now())`);
    const salt = 'salt-ficticia'; const hash = crypto.pbkdf2Sync('password-ficticia', salt, 1000, 64, 'sha512').toString('hex');
    await pool.query('INSERT INTO usuarios_imi (username,password_hash,tablero_acceso,activo) VALUES ($1,$2,$3,true)', ['usuario_local', `${salt}:${hash}`, 'editor']);
    identity = http.createServer((req,res) => {
      const value = req.headers.cookie?.split('=')[1];
      const board = value === cookieAdmin ? 'admin' : value === cookieEditor ? 'editor' : null;
      if (value === cookieOther) { res.setHeader('content-type','application/json'); return res.end(JSON.stringify({ usuario:'sin_acceso',tableros:[{codigo:'copa',rango:'admin'}] })); }
      if (!board) { res.statusCode=401; return res.end(); }
      res.setHeader('content-type','application/json'); res.end(JSON.stringify({ usuario:`central_${board}`,tableros:[{codigo:'activos',rango:board}] }));
    });
    await new Promise(r => identity.listen(39001,'127.0.0.1',r));
    app = spawn(process.execPath,['dist/server.cjs'], { cwd: process.cwd(), env: {...process.env, NODE_ENV:'production',PORT:'55438',DATABASE_URL:'postgresql://postgres:pass-prueba-local@127.0.0.1:55437/activos_test',JWT_SECRET:'clave-ficticia-para-pruebas-locales-de-integracion'}, stdio:'ignore' });
    for (let i=0; ;i++) { try { await fetch('http://127.0.0.1:55438/'); break; } catch(e) { if(i===50) throw e; await delay(200); } }
    const base='http://127.0.0.1:55438';
    const me = c => fetch(base+'/api/auth/me',{headers:{cookie:`imi_sso=${c}`}});
    let res=await me(cookieAdmin); assert.equal(res.status,200); assert.equal((await res.json()).username,'central_admin');
    res=await me(cookieOther); assert.equal(res.status,401);
    res=await fetch(base+'/api/admin/users',{headers:{cookie:`imi_sso=${cookieEditor}`}}); assert.equal(res.status,403);
    res=await fetch(base+'/api/admin/users',{method:'POST',headers:{cookie:`imi_sso=${cookieAdmin}`,origin:'https://ajeno.example','content-type':'application/json'},body:'{}'}); assert.equal(res.status,403);
    res=await fetch(base+'/api/auth/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({username:'usuario_local',password:'password-ficticia'})}); assert.equal(res.status,200);
    const login=await res.json(); assert.equal(login.user.username,'usuario_local');
    await new Promise(r => identity.close(r)); identity=null;
    res=await fetch(base+'/api/auth/me',{headers:{cookie:`imi_sso=${cookieAdmin}`,authorization:`Bearer ${login.token}`}}); assert.equal(res.status,200); assert.equal((await res.json()).username,'usuario_local');
    console.log('HTTP real: SSO admin, usuario sin acceso, restricciones de editor, protección de origen y login anterior durante caída: OK');
  } finally { if (app) app.kill(); if (identity) await new Promise(r => identity.close(r)); await pool.end(); }
})().catch(e => { console.error(e); process.exitCode=1; });
