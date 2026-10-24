// Keeps vercel.json in step with the Express app, so no API route becomes unreachable on Vercel
const fs   = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { closeAllConnections } = require('./helpers');

const ROOT          = path.join(__dirname, '../..');
const VERCEL_JSON   = path.join(ROOT, 'vercel.json');
const API_ENTRY     = path.join(ROOT, 'api/index.js');
const FUNCTION_DEST = '/api/index';

const config = fs.existsSync(VERCEL_JSON)
  ? JSON.parse(fs.readFileSync(VERCEL_JSON, 'utf8'))
  : { rewrites: [], crons: [] };
const rewrites = config.rewrites || [];

// '/Auth/:path*' → '/Auth'; '/WishList' → '/WishList'
const apiPrefixes = rewrites
  .filter(r => r.destination === FUNCTION_DEST)
  .map(r => r.source.replace(/\/:path\*$/, ''));

const isRewrittenToFunction = (p) =>
  apiPrefixes.some(prefix => p === prefix || p.startsWith(prefix + '/'));

let app;
let expressRoutes;

beforeAll(async () => {
  app = require('../index');
  // This suite does no DB work of its own, so wait for the app's startup DB activity
  // (on-connect Public group upsert, index builds) before teardown closes the connection
  await new Promise(r => setTimeout(r, 200));
  const conn = mongoose.connections.find(c => c.models && c.models.WishList);
  await Promise.all(Object.values(conn.models).map(m => m.init()));
  await conn.models.Groups.findOne({ inviteCode: 'PUBLIC' });
  // Express 4 internals: each routed layer carries route.path
  expressRoutes = app._router.stack
    .filter(layer => layer.route)
    .map(layer => ({ path: layer.route.path, methods: Object.keys(layer.route.methods) }))
    .filter(r => r.path !== '*');
});

afterAll(async () => {
  await closeAllConnections();
});


describe('vercel.json', () => {
  test('exists at the repo root', () => {
    expect(fs.existsSync(VERCEL_JSON)).toBe(true);
  });

  test('rewrites every Express API route to the function', () => {
    expect(expressRoutes.length).toBeGreaterThan(0);
    const unreachable = expressRoutes.map(r => r.path).filter(p => !isRewrittenToFunction(p));
    expect(unreachable).toEqual([]);
  });

  test('has no function rewrite without a matching Express route', () => {
    expect(apiPrefixes.length).toBeGreaterThan(0);
    const dead = apiPrefixes.filter(prefix =>
      !expressRoutes.some(r => r.path === prefix || r.path.startsWith(prefix + '/')));
    expect(dead).toEqual([]);
  });

  test('ends with the SPA fallback, so it cannot shadow API rewrites', () => {
    expect(rewrites.length).toBeGreaterThan(0);
    expect(rewrites[rewrites.length - 1]).toEqual({ source: '/(.*)', destination: '/index.html' });
    expect(rewrites.slice(0, -1).some(r => r.destination === '/index.html')).toBe(false);
  });

  test('schedules the weekly report cron on a rewritten Express GET route', () => {
    const cron = (config.crons || []).find(c => c.path === '/Cron/WeeklyReport');
    expect(cron).toEqual({ path: '/Cron/WeeklyReport', schedule: '0 8 * * 1' });
    expect(isRewrittenToFunction(cron.path)).toBe(true);
    expect(expressRoutes).toContainEqual({ path: '/Cron/WeeklyReport', methods: ['get'] });
  });

  test('does not rewrite any client page path to the function (exact case)', () => {
    const routerSrc   = fs.readFileSync(path.join(ROOT, 'client/src/router.js'), 'utf8');
    const clientPaths = [...routerSrc.matchAll(/path:\s*'([^']+)'/g)].map(m => m[1]);
    expect(clientPaths).toEqual(expect.arrayContaining(['/groups', '/admin/report']));
    expect(clientPaths.filter(isRewrittenToFunction)).toEqual([]);
  });

  test('bundles index.html into the function as a fallback for the Express catch-all', () => {
    expect(config.functions?.['api/index.js']?.includeFiles).toBe('client/dist/index.html');
  });

  test('installs client devDependencies even when NODE_ENV=production (the build tool is a devDependency)', () => {
    const clientInstall = (config.installCommand || '').split('&&').find(step => /npm ci/.test(step) && /--legacy-peer-deps/.test(step));
    expect(clientInstall).toContain('--include=dev');
  });

  test('runs functions in Singapore, next to the Atlas cluster', () => {
    expect(config.regions).toEqual(['sin1']);
  });
});


describe('function entrypoint and Node version', () => {
  test('api/index.js exports the Express app', () => {
    expect(fs.existsSync(API_ENTRY)).toBe(true);
    expect(require(API_ENTRY)).toBe(app);
  });

  test('pins Node 22.x in the root and server package.json', () => {
    const rootPkgPath = path.join(ROOT, 'package.json');
    const rootPkg   = fs.existsSync(rootPkgPath) ? JSON.parse(fs.readFileSync(rootPkgPath, 'utf8')) : {};
    const serverPkg = require('../package.json');
    expect(rootPkg.engines?.node).toBe('22.x');
    expect(serverPkg.engines.node).toBe('22.x');
  });
});
