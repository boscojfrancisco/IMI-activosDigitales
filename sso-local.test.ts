import assert from 'node:assert/strict';
import { requireAuth, checkRole } from './src/middleware/auth.ts';
import { db } from './src/db/index.ts';
import jwt from 'jsonwebtoken';

const cookie = 'a'.repeat(43);
let forwarded = '';
let data: any = { usuario: 'prueba', tableros: [{ codigo: 'activos', rango: 'admin' }] };
let unavailable = false;
globalThis.fetch = (async (_url: any, init: any) => {
  forwarded = init.headers.cookie;
  if (unavailable) throw new Error('offline');
  return { ok: true, json: async () => data } as Response;
}) as typeof fetch;
async function run(method = 'GET', origin?: string, cookieHeader = `extra=secret; imi_sso=${cookie}`) {
  const req: any = { method, headers: { cookie: cookieHeader, ...(origin ? { origin } : {}) } };
  let status = 200, next = false;
  const res: any = { status(n: number) { status = n; return this; }, json() { return this; } };
  await requireAuth(req, res, () => { next = true; });
  return { req, status, next, res };
}
let result = await run();
assert.equal(result.next, true); assert.equal(result.req.user.username, 'prueba');
assert.equal(result.req.user.idUsuario, null); assert.equal(forwarded, `imi_sso=${cookie}`);
result = await run('POST', 'https://sitio-ajeno.example'); assert.equal(result.status, 403);
result = await run('POST', 'https://appimi.corrientes.gob.ar'); assert.equal(result.next, true);
data = { usuario: 'prueba', tableros: [{ codigo: 'activos', rango: 'editor' }] };
result = await run(); let roleStatus = 200;
checkRole(['admin'])(result.req, { status(n: number) { roleStatus=n; return this; }, json() {} } as any, () => {});
assert.equal(roleStatus, 403);
data = { usuario: 'prueba', tableros: [{ codigo: 'copa', rango: 'admin' }] };
result = await run(); assert.equal(result.status, 401);
unavailable = true; result = await run(); assert.equal(result.status, 401);
result = await run('GET', undefined, 'imi_sso=invalida'); assert.equal(result.status, 401);
// Con identidad caída, una cuenta histórica válida sigue funcionando.
(db as any).select = () => ({ from: () => ({ where: () => ({ limit: async () => [{ idUsuario: 23, username: 'cuenta_anterior', tableroAcceso: 'editor', activo: true }] }) }) });
const oldToken = jwt.sign({ idUsuario: 23 }, process.env.JWT_SECRET!);
const legacyReq: any = { method: 'GET', headers: { cookie: `imi_sso=${cookie}`, authorization: `Bearer ${oldToken}` } };
let legacyNext = false;
await requireAuth(legacyReq, { status() { return this; }, json() { return this; } } as any, () => { legacyNext = true; });
assert.equal(legacyNext, true); assert.equal(legacyReq.user.username, 'cuenta_anterior'); assert.equal(legacyReq.user.origen, 'local');
console.log('Validación central, roles, origen, aislamiento de cookie y continuidad de acceso anterior: OK');
