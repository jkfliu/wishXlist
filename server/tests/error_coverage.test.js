const request  = require('supertest');
const mongoose = require('mongoose');
const passport = require('passport');
const { closeAllConnections } = require('./helpers');

let app;
let wishListModel;
let userModel;
let groupModel;
let authAgent;

beforeAll(async () => {
  app = require('../index');

  // Must reference the same model instances index.js registered internally
  // so that jest.spyOn intercepts the calls the routes actually make.
  const conn = mongoose.connections.find(c => c.models && c.models.WishList);
  wishListModel = conn.models.WishList;
  userModel     = conn.models.UserList;
  groupModel    = conn.models.Groups;

  // Create a test user and pre-authenticate an agent for the Groups route tests
  await userModel.create({ googleId: 'err-cov-google', username: 'errcov@example.com', displayName: 'Err Cov' });
  authAgent = request.agent(app);
  await authAgent.post('/Auth/Test/FakeLogin').send({ username: 'errcov@example.com' });
});

afterAll(async () => {
  await userModel.deleteMany({});
  await closeAllConnections();
});

afterEach(() => {
  jest.restoreAllMocks();
});


describe('WishList routes - DB error', () => {
  test.each([
    ['GET',  '/WishList',               'find',             null],
    ['GET',  '/WishList/anyuser',        'find',             null],
    ['POST', '/WishList/Create',         'create',           { user_name: 'test', item_name: 'item' }],
    ['POST', '/WishList/Update',         'findByIdAndUpdate', { _id: 'abc123', item_name: 'x' }],
    ['POST', '/WishList/Delete/abc123',  'findByIdAndDelete', null],
  ])('%s %s returns 500 on DB failure', async (method, url, modelMethod, body) => {
    jest.spyOn(wishListModel, modelMethod).mockRejectedValueOnce(new Error('DB down'));
    const req = request(app)[method.toLowerCase()](url);
    if (body) req.send(body);
    const res = await req;
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'DB down');
  });
});


describe('Groups routes - DB error', () => {
  test.each([
    ['GET',  '/Groups',                         'find',              null],
    ['POST', '/Groups/Create',                  'create',            { name: 'Fail Group' }],
    ['POST', '/Groups/Join',                    'findOneAndUpdate',  { inviteCode: 'X' }],
    ['POST', '/Groups/Leave',                   'findByIdAndUpdate', { groupId: 'abc' }],
    ['GET',  '/Groups/Members?groupId=abc123',  'findById',          null],
  ])('%s %s returns 500 on DB failure', async (method, url, modelMethod, body) => {
    jest.spyOn(groupModel, modelMethod).mockRejectedValueOnce(new Error('DB down'));
    const req = authAgent[method.toLowerCase()](url);
    if (body) req.send(body);
    const res = await req;
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'DB down');
  });
});


describe('Google OAuth strategy - verify callback', () => {
  let googleStrategy;

  beforeAll(() => {
    googleStrategy = passport._strategies.google;
  });

  function callVerify(profile) {
    return new Promise((resolve, reject) => {
      googleStrategy._verify(null, null, profile, (err, user) => {
        err ? reject(err) : resolve(user);
      });
    });
  }

  function mockProfile(id) {
    return { id, emails: [{ value: `${id}@test.com` }], displayName: `User ${id}` };
  }

  test('returns existing user when found in DB', async () => {
    const existing = { _id: 'abc', googleId: 'g1', username: 'g1@test.com' };
    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(existing);
    const user = await callVerify(mockProfile('g1'));
    expect(user).toEqual(existing);
  });

  test('creates and returns new user when not found', async () => {
    const created = { _id: 'xyz', googleId: 'g2', username: 'g2@test.com', displayName: 'User g2' };
    jest.spyOn(userModel, 'findOne').mockResolvedValueOnce(null);
    jest.spyOn(userModel, 'create').mockResolvedValueOnce(created);
    const user = await callVerify(mockProfile('g2'));
    expect(user).toEqual(created);
  });

  test('calls done(err) on DB error', async () => {
    jest.spyOn(userModel, 'findOne').mockRejectedValueOnce(new Error('DB error'));
    await expect(callVerify(mockProfile('g3'))).rejects.toThrow('DB error');
  });
});


describe('deserializeUser - error path', () => {
  test('propagates findById error during session deserialization', async () => {
    await userModel.create({
      googleId:    'g-deser',
      username:    'deser@test.com',
      displayName: 'Deser User',
    });

    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'deser@test.com' });

    jest.spyOn(userModel, 'findById').mockRejectedValueOnce(new Error('deser error'));

    const res = await agent.get('/Auth/Me');
    expect(res.status).toBe(500);
  });
});
