const request  = require('supertest');
const mongoose = require('mongoose');
const { closeAllConnections } = require('./helpers');

let app;
let userModel;
let wishListModel;
let groupModel;
let eventLogModel;
let adminAgent;
let normalAgent;

const ADMIN_USER = 'admin@example.com';
const NORMAL_USER = 'user@example.com';

beforeAll(async () => {
  process.env.ADMIN_USERNAME = ADMIN_USER;

  app = require('../index');
  await new Promise(r => setTimeout(r, 200));

  const conn = mongoose.connections.find(c => c.models && c.models.WishList);
  userModel     = conn.models.UserList;
  wishListModel = conn.models.WishList;
  groupModel    = conn.models.Groups;
  eventLogModel = conn.models.EventLog;

  await userModel.create({ googleId: 'admin-g', username: ADMIN_USER, displayName: 'Admin' });
  await userModel.create({ googleId: 'user-g',  username: NORMAL_USER, displayName: 'Normal' });

  adminAgent  = request.agent(app);
  normalAgent = request.agent(app);
  await adminAgent.post('/Auth/Test/FakeLogin').send({ username: ADMIN_USER });
  await normalAgent.post('/Auth/Test/FakeLogin').send({ username: NORMAL_USER });
});

afterAll(async () => {
  await userModel.deleteMany({});
  await wishListModel.deleteMany({});
  await groupModel.deleteMany({ inviteCode: { $ne: 'PUBLIC' } });
  await eventLogModel.deleteMany({});
  delete process.env.ADMIN_USERNAME;
  await closeAllConnections();
});

afterEach(() => {
  jest.restoreAllMocks();
});


describe('GET /Admin/Report — auth', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/Admin/Report');
    expect(res.status).toBe(401);
  });

  test('returns 403 for non-admin user', async () => {
    const res = await normalAgent.get('/Admin/Report');
    expect(res.status).toBe(403);
  });

  test('returns 200 for admin user', async () => {
    const res = await adminAgent.get('/Admin/Report');
    expect(res.status).toBe(200);
  });
});


describe('GET /Admin/Report — response shape', () => {
  let data;

  beforeAll(async () => {
    const res = await adminAgent.get('/Admin/Report');
    data = res.body;
  });

  test('has generatedAt and period', () => {
    expect(data).toHaveProperty('generatedAt');
    expect(data.period).toHaveProperty('from');
    expect(data.period).toHaveProperty('to');
  });

  test('stats has users, groups, wishes, gifted with total/thisWeek/lastWeek', () => {
    for (const key of ['users', 'groups', 'wishes', 'gifted']) {
      expect(data.stats[key]).toHaveProperty('total');
      expect(data.stats[key]).toHaveProperty('thisWeek');
      expect(data.stats[key]).toHaveProperty('lastWeek');
    }
  });

  test('logins has total, uniqueUsers, pageviews, top5Pages', () => {
    expect(data.logins).toHaveProperty('total');
    expect(data.logins).toHaveProperty('uniqueUsers');
    expect(data.logins).toHaveProperty('pageviews');
    expect(Array.isArray(data.logins.top5Pages)).toBe(true);
  });

  test('metrics has httpErrors and avgResponseTime', () => {
    expect(data.metrics).toHaveProperty('httpErrors');
    expect(data.metrics).toHaveProperty('avgResponseTime');
  });

  test('history has 8 weeks and all required arrays', () => {
    expect(data.history.weeks).toHaveLength(8);
    for (const key of ['newUsers', 'newGroups', 'newWishes', 'gifted', 'logins', 'uniqueLogins', 'pageviews', 'httpErrors', 'avgResponseMs']) {
      expect(data.history[key]).toHaveLength(8);
    }
    expect(typeof data.history.pageBreakdown).toBe('object');
  });
});


describe('GET /Admin/Report — stats counts', () => {
  test('total users reflects seeded count', async () => {
    const count = await userModel.countDocuments();
    const res = await adminAgent.get('/Admin/Report');
    expect(res.body.stats.users.total).toBe(count);
  });

  test('new wishes this week counts items created in last 7 days', async () => {
    const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    await wishListModel.create({ user_name: ADMIN_USER, item_name: 'Recent Item', item_create_date: recentDate });
    const res = await adminAgent.get('/Admin/Report');
    expect(res.body.stats.wishes.thisWeek).toBeGreaterThanOrEqual(1);
    await wishListModel.deleteMany({ user_name: ADMIN_USER });
  });

  test('gifted count reflects items with gifter_user_name set', async () => {
    await wishListModel.create({ user_name: ADMIN_USER, item_name: 'Gifted Item', gifter_user_name: NORMAL_USER, gifted_date: new Date() });
    const res = await adminAgent.get('/Admin/Report');
    expect(res.body.stats.gifted.total).toBeGreaterThanOrEqual(1);
    expect(res.body.stats.gifted.thisWeek).toBeGreaterThanOrEqual(1);
    await wishListModel.deleteMany({ user_name: ADMIN_USER });
  });
});


describe('GET /Admin/Report — logins section', () => {
  test('login count reflects EventLog login entries this week', async () => {
    await eventLogModel.create({ type: 'login', username: ADMIN_USER, timestamp: new Date() });
    await eventLogModel.create({ type: 'login', username: NORMAL_USER, timestamp: new Date() });
    const res = await adminAgent.get('/Admin/Report');
    expect(res.body.logins.total).toBeGreaterThanOrEqual(2);
    expect(res.body.logins.uniqueUsers).toBeGreaterThanOrEqual(2);
    await eventLogModel.deleteMany({ type: 'login' });
  });

  test('top5Pages sorted by count descending', async () => {
    await eventLogModel.insertMany([
      { type: 'pageview', path: '/wish-list', timestamp: new Date() },
      { type: 'pageview', path: '/wish-list', timestamp: new Date() },
      { type: 'pageview', path: '/wish-list', timestamp: new Date() },
      { type: 'pageview', path: '/groups',    timestamp: new Date() },
      { type: 'pageview', path: '/groups',    timestamp: new Date() },
      { type: 'pageview', path: '/about',     timestamp: new Date() },
    ]);
    const res = await adminAgent.get('/Admin/Report');
    const pages = res.body.logins.top5Pages;
    expect(pages[0].path).toBe('/wish-list');
    expect(pages[0].count).toBe(3);
    expect(pages[1].path).toBe('/groups');
    await eventLogModel.deleteMany({ type: 'pageview' });
  });
});


describe('GET /Admin/Report — metrics section', () => {
  test('httpErrors counts only API events with status >= 400', async () => {
    await eventLogModel.create({ type: 'api', status: 200, duration: 10, timestamp: new Date() });
    await eventLogModel.create({ type: 'api', status: 404, duration: 5,  timestamp: new Date() });
    await eventLogModel.create({ type: 'api', status: 500, duration: 8,  timestamp: new Date() });
    const res = await adminAgent.get('/Admin/Report');
    expect(res.body.metrics.httpErrors).toBeGreaterThanOrEqual(2);
    await eventLogModel.deleteMany({ type: 'api' });
  });

  test('avgResponseTime is null when no API events exist', async () => {
    await eventLogModel.deleteMany({ type: 'api' });
    const res = await adminAgent.get('/Admin/Report');
    expect(res.body.metrics.avgResponseTime).toBeNull();
  });
});
