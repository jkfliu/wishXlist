const request  = require('supertest');
const mongoose = require('mongoose');
const { closeAllConnections } = require('./helpers');

let app;
let wishConn;
let WishListModel;
let UserModel;
let GroupModel;
let createdItemId;

beforeAll(async () => {
  const wishListItemSchema = require('../schema/wishListItem_schema');
  const userSchema         = require('../schema/User_schema');
  const groupSchema        = require('../schema/Group_schema');

  wishConn  = await mongoose.createConnection(process.env.MONGO_URI);
  WishListModel = wishConn.model('WishList',  wishListItemSchema, 'WishList');
  UserModel     = wishConn.model('UserList',  userSchema,         'UserList');
  GroupModel    = wishConn.model('Groups',    groupSchema,        'Groups');

  await UserModel.create({ googleId: 'wl-google-1', username: 'testuser@example.com',  displayName: 'Test User' });
  await UserModel.create({ googleId: 'wl-google-2', username: 'otheruser@example.com', displayName: 'Other User' });

  // Load app after env vars are set
  app = require('../index');
});

afterAll(async () => {
  await WishListModel.deleteMany({});
  await UserModel.deleteMany({ username: { $in: ['testuser@example.com', 'otheruser@example.com'] } });
  await GroupModel.deleteMany({ inviteCode: { $in: ['WLGRP1', 'WLGRP2'] } });
  await closeAllConnections();
});

/*****************************/
/* AUTH GUARD TESTS          */
/*****************************/

describe('WishList endpoints — unauthenticated requests return 401', () => {
  test('GET /WishList returns 401 when not logged in', async () => {
    const res = await request(app).get('/WishList');
    expect(res.status).toBe(401);
  });

  test('GET /WishList/:user returns 401 when not logged in', async () => {
    const res = await request(app).get('/WishList/testuser');
    expect(res.status).toBe(401);
  });

  test('POST /WishList/Create returns 401 when not logged in', async () => {
    const res = await request(app).post('/WishList/Create').send({ user_name: 'testuser', item_name: 'Item' });
    expect(res.status).toBe(401);
  });

  test('POST /WishList/Update returns 401 when not logged in', async () => {
    const res = await request(app).post('/WishList/Update').send({ _id: 'someid', item_name: 'Item' });
    expect(res.status).toBe(401);
  });

  test('POST /WishList/Delete/:id returns 401 when not logged in', async () => {
    const res = await request(app).post('/WishList/Delete/someid');
    expect(res.status).toBe(401);
  });
});


describe('GET /WishList', () => {
  test('returns 200 and an array when authenticated', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.get('/WishList');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /WishList?groupId= — server-side group filtering', () => {
  let group;

  beforeAll(async () => {
    // testuser is the viewer; otheruser is the wish list owner
    group = await GroupModel.create({
      name: 'WL Test Group', inviteCode: 'WLGRP1',
      members: ['testuser@example.com', 'otheruser@example.com'],
    });
    // Item visible to all groups (visibleToGroups: [])
    await WishListModel.create({ user_name: 'otheruser@example.com', item_name: 'All-groups item',    visibleToGroups: [] });
    // Item visible only to this group
    await WishListModel.create({ user_name: 'otheruser@example.com', item_name: 'This-group item',   visibleToGroups: [group._id.toString()] });
    // Item visible only to a different group (should be hidden)
    await WishListModel.create({ user_name: 'otheruser@example.com', item_name: 'Other-group item',  visibleToGroups: ['000000000000000000000001'] });
    // Requester's own item (should be excluded)
    await WishListModel.create({ user_name: 'testuser@example.com',  item_name: 'Own item',          visibleToGroups: [] });
  });

  afterAll(async () => {
    await WishListModel.deleteMany({ item_name: { $in: ['All-groups item', 'This-group item', 'Other-group item', 'Own item'] } });
  });

  test('returns 400 when groupId is missing', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.get('/WishList?groupId=');
    expect(res.status).toBe(400);
  });

  test('returns 403 when requester is not a member of the group', async () => {
    const outsiderGroup = await GroupModel.create({
      name: 'Private Group', inviteCode: 'WLGRP2', members: ['otheruser@example.com'],
    });
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.get(`/WishList?groupId=${outsiderGroup._id}`);
    expect(res.status).toBe(403);
  });

  test('excludes the requester\'s own items', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.get(`/WishList?groupId=${group._id}`);
    expect(res.status).toBe(200);
    expect(res.body.every(item => item.user_name !== 'testuser@example.com')).toBe(true);
  });

  test('includes items with visibleToGroups [] (visible to all)', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.get(`/WishList?groupId=${group._id}`);
    expect(res.status).toBe(200);
    expect(res.body.some(item => item.item_name === 'All-groups item')).toBe(true);
  });

  test('includes items explicitly visible to this group', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.get(`/WishList?groupId=${group._id}`);
    expect(res.status).toBe(200);
    expect(res.body.some(item => item.item_name === 'This-group item')).toBe(true);
  });

  test('excludes items restricted to a different group', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.get(`/WishList?groupId=${group._id}`);
    expect(res.status).toBe(200);
    expect(res.body.some(item => item.item_name === 'Other-group item')).toBe(false);
  });
});

describe('POST /WishList/Create', () => {
  test('creates an item and returns it when authenticated', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const newItem = {
      user_name: 'testuser@example.com',
      item_name: 'Test Item',
      model: 'Model X',
      price: '99.99',
      store: 'Test Store',
    };
    const res = await agent.post('/WishList/Create').send(newItem);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('item_name', 'Test Item');
    createdItemId = res.body._id;
  });

  test('persists visibleToGroups when provided', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.post('/WishList/Create')
      .send({ user_name: 'testuser@example.com', item_name: 'Group Item', visibleToGroups: ['g1', 'g2'] });
    expect(res.status).toBe(200);
    expect(res.body.visibleToGroups).toEqual(['g1', 'g2']);
  });

  test('visibleToGroups defaults to empty array when not provided', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.post('/WishList/Create')
      .send({ user_name: 'testuser@example.com', item_name: 'No Groups Item' });
    expect(res.status).toBe(200);
    expect(res.body.visibleToGroups).toEqual([]);
  });
});

describe('GET /WishList/:user', () => {
  test('returns 200 and filtered array for specified user when authenticated', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.get('/WishList/testuser@example.com');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    res.body.forEach(item => {
      expect(item.user_name).toBe('testuser@example.com');
    });
  });
});

describe('POST /WishList/Update', () => {
  test('updates an existing item when owner is authenticated', async () => {
    expect(createdItemId).toBeDefined();
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.post('/WishList/Update').send({
      _id: createdItemId,
      item_name: 'Updated Item',
      model: 'Model Y',
      price: '149.99',
      store: 'Updated Store',
      item_modified_date: new Date().toISOString(),
      gifter_user_name: '',
      gifted_date: null,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('item_name', 'Updated Item');
  });

  test('returns 403 when a different user tries to update the item', async () => {
    expect(createdItemId).toBeDefined();
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'otheruser@example.com' });
    const res = await agent.post('/WishList/Update').send({
      _id: createdItemId,
      item_name: 'Hacked Item',
      model: '',
      price: '',
      store: '',
      item_modified_date: new Date().toISOString(),
      gifter_user_name: '',
      gifted_date: null,
    });
    expect(res.status).toBe(403);
  });

  test('updates visibleToGroups when owner is authenticated', async () => {
    expect(createdItemId).toBeDefined();
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.post('/WishList/Update').send({
      _id: createdItemId,
      item_name: 'Updated Item',
      model: '', price: '', store: '',
      item_modified_date: new Date().toISOString(),
      gifter_user_name: '', gifted_date: null,
      visibleToGroups: ['g3'],
    });
    expect(res.status).toBe(200);
    expect(res.body.visibleToGroups).toEqual(['g3']);
  });
});

describe('POST /WishList/Delete/:id', () => {
  test('returns 403 when a different user tries to delete the item', async () => {
    expect(createdItemId).toBeDefined();
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'otheruser@example.com' });
    const res = await agent.post(`/WishList/Delete/${createdItemId}`);
    expect(res.status).toBe(403);
  });

  test('deletes an item when owner is authenticated', async () => {
    expect(createdItemId).toBeDefined();
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.post(`/WishList/Delete/${createdItemId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', createdItemId);
  });

  test('returns 500 for invalid _id format', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.post('/WishList/Delete/not-a-valid-id');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /WishList/Update - error handling', () => {
  test('returns 500 for invalid _id format', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'testuser@example.com' });
    const res = await agent.post('/WishList/Update').send({
      _id: 'not-a-valid-id',
      item_name: 'Test',
      model: '', price: '', store: '',
      item_modified_date: new Date().toISOString(),
      gifter_user_name: '', gifted_date: null,
    });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
