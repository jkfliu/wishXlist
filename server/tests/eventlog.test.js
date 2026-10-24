const request  = require('supertest');
const mongoose = require('mongoose');
const passport = require('passport');
const { closeAllConnections } = require('./helpers');

// Vercel runtime boundary — capture the promises the app hands to waitUntil
jest.mock('@vercel/functions', () => ({ waitUntil: jest.fn() }));
const { waitUntil } = require('@vercel/functions');

let app;
let userModel;
let eventLogModel;

const USER = 'eventlog@example.com';

// Let any res.on('finish') handlers run, then wait for everything handed to waitUntil
async function settleBackgroundWork() {
  await new Promise(r => setImmediate(r));
  return Promise.all(waitUntil.mock.calls.map(([p]) => p));
}

beforeAll(async () => {
  app = require('../index');
  await new Promise(r => setTimeout(r, 200));

  const conn = mongoose.connections.find(c => c.models && c.models.WishList);
  userModel     = conn.models.UserList;
  eventLogModel = conn.models.EventLog;

  await userModel.create({ googleId: 'evt-g', username: USER, displayName: 'Event User' });
});

beforeEach(async () => {
  process.env.VERCEL = '1';
  waitUntil.mockClear();
  await eventLogModel.deleteMany({});
});

afterEach(() => {
  delete process.env.VERCEL;
  jest.restoreAllMocks();
});

afterAll(async () => {
  await userModel.deleteMany({});
  await eventLogModel.deleteMany({});
  await closeAllConnections();
});


describe('request logger (res.on finish)', () => {
  test('registers the api event write with waitUntil and records path, status, user and duration', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: USER });
    await settleBackgroundWork();
    waitUntil.mockClear();
    await eventLogModel.deleteMany({});

    const res = await agent.get('/WishList');
    expect(res.status).toBe(200);
    await settleBackgroundWork();

    expect(waitUntil).toHaveBeenCalledTimes(1);
    const events = await eventLogModel.find({ path: '/WishList' }).lean();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'api', status: 200, username: USER });
    expect(typeof events[0].duration).toBe('number');
  });

  test('records the error message as responseBody for a 4xx response', async () => {
    const res = await request(app).get('/WishList');
    expect(res.status).toBe(401);
    await settleBackgroundWork();

    expect(waitUntil).toHaveBeenCalledTimes(1);
    const events = await eventLogModel.find({ path: '/WishList' }).lean();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'api', status: 401, username: null, responseBody: 'Not authenticated' });
  });

  test('skips static assets entirely', async () => {
    await request(app).get('/app.js');
    await settleBackgroundWork();

    expect(waitUntil).not.toHaveBeenCalled();
    expect(await eventLogModel.countDocuments({})).toBe(0);
  });
});


describe('POST /Events/Pageview', () => {
  test('returns 204 and registers exactly one pageview write with waitUntil', async () => {
    const res = await request(app).post('/Events/Pageview').send({ path: '/groups' });
    expect(res.status).toBe(204);
    await settleBackgroundWork();

    // One write only: the request logger must not log the beacon itself
    expect(waitUntil).toHaveBeenCalledTimes(1);
    const events = await eventLogModel.find({}).lean();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ type: 'pageview', path: '/groups' });
  });

  test.each([
    ['missing path', {}],
    ['non-string path', { path: 42 }],
  ])('returns 400 and records no pageview for %s', async (_label, body) => {
    const res = await request(app).post('/Events/Pageview').send(body);
    expect(res.status).toBe(400);
    await settleBackgroundWork();

    expect(await eventLogModel.countDocuments({ type: 'pageview' })).toBe(0);
  });
});


describe('OAuth callbacks record a login event', () => {
  // Stub only the two calls that leave the server: token exchange and profile fetch
  function stubProvider(name, profile) {
    const strategy = passport._strategies[name];
    jest.spyOn(strategy._oauth2, 'getOAuthAccessToken')
      .mockImplementation((_code, _params, cb) => cb(null, 'access-token', 'refresh-token', {}));
    jest.spyOn(strategy, 'userProfile')
      .mockImplementation((_token, done) => done(null, profile));
  }

  test.each([
    ['google',   { id: 'g-login-1',  emails: [{ value: 'glogin@example.com' }],  displayName: 'G Login' },  'glogin@example.com'],
    ['facebook', { id: 'fb-login-1', emails: [{ value: 'fblogin@example.com' }], displayName: 'FB Login' }, 'fblogin@example.com'],
  ])('%s callback redirects to the client and registers the login write with waitUntil', async (provider, profile, email) => {
    stubProvider(provider, profile);

    const res = await request(app).get(`/Auth/OAuth/${provider}/callback?code=test-code`);
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/\/login\?oauth_success=1$/);
    await settleBackgroundWork();

    expect(waitUntil).toHaveBeenCalled();
    const logins = await eventLogModel.find({ type: 'login' }).lean();
    expect(logins).toHaveLength(1);
    expect(logins[0].username).toBe(email);
  });
});


describe('logging never breaks a request', () => {
  test('a failing EventLog write still returns the normal response and the waitUntil promise resolves', async () => {
    jest.spyOn(eventLogModel, 'create').mockRejectedValue(new Error('DB down'));

    const res = await request(app).post('/Events/Pageview').send({ path: '/groups' });
    expect(res.status).toBe(204);

    expect(waitUntil).toHaveBeenCalledTimes(1);
    await expect(waitUntil.mock.calls[0][0]).resolves.toBeUndefined();
  });
});
