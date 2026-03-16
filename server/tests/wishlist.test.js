const request  = require('supertest');
const mongoose = require('mongoose');
const { closeAllConnections } = require('./helpers');

let app;
let wishConn;
let WishListModel;
let createdItemId;

beforeAll(async () => {
  const wishListItemSchema = require('../schema/wishListItem_schema');

  wishConn = await mongoose.createConnection(process.env.MONGO_URI);
  WishListModel = wishConn.model('WishList', wishListItemSchema, 'WishList');

  // Load app after env vars are set
  app = require('../index');
});

afterAll(async () => {
  await WishListModel.deleteMany({});
  await closeAllConnections();
});

describe('GET /WishList', () => {
  test('returns 200 and an array', async () => {
    const res = await request(app).get('/WishList');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /WishList/Create', () => {
  test('creates an item and returns it', async () => {
    const newItem = {
      user_name: 'testuser',
      item_name: 'Test Item',
      model: 'Model X',
      price: '99.99',
      store: 'Test Store',
    };
    const res = await request(app)
      .post('/WishList/Create')
      .send(newItem);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('item_name', 'Test Item');
    createdItemId = res.body._id;
  });
});

describe('GET /WishList/:user', () => {
  test('returns 200 and filtered array for specified user', async () => {
    const res = await request(app).get('/WishList/testuser');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    res.body.forEach(item => {
      expect(item.user_name).toBe('testuser');
    });
  });
});

describe('POST /WishList/Update', () => {
  test('updates an existing item', async () => {
    expect(createdItemId).toBeDefined();
    const res = await request(app)
      .post('/WishList/Update')
      .send({
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
});

describe('POST /WishList/Delete/:id', () => {
  test('deletes an item from the DB', async () => {
    expect(createdItemId).toBeDefined();
    const res = await request(app)
      .post(`/WishList/Delete/${createdItemId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', createdItemId);
  });

  test('returns 500 for invalid _id format', async () => {
    const res = await request(app).post('/WishList/Delete/not-a-valid-id');
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /WishList/Update - error handling', () => {
  test('returns 500 for invalid _id format', async () => {
    const res = await request(app)
      .post('/WishList/Update')
      .send({
        _id: 'not-a-valid-id',
        item_name: 'Test',
        model: '',
        price: '',
        store: '',
        item_modified_date: new Date().toISOString(),
        gifter_user_name: '',
        gifted_date: null,
      });
    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error');
  });
});
