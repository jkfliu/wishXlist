const request  = require('supertest');
const mongoose = require('mongoose');
const { closeAllConnections } = require('./helpers');

let app;
let UserModel;

beforeAll(async () => {
  const userSchema = require('../schema/User_schema');
  const conn = mongoose.createConnection(process.env.MONGO_URI);
  UserModel = conn.model('UserList', userSchema, 'UserList');

  // Seed a test user
  await UserModel.create({
    googleId:    'test-google-id-123',
    username:    'test@example.com',
    displayName: 'Test User',
  });

  app = require('../index');
});

afterAll(async () => {
  await UserModel.deleteMany({});
  await closeAllConnections();
});

describe('GET /Auth/Me', () => {
  test('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/Auth/Me');
    expect(res.status).toBe(401);
  });

  test('returns user info when authenticated', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'test@example.com' });

    const res = await agent.get('/Auth/Me');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', 'test@example.com');
    expect(res.body).toHaveProperty('displayName', 'Test User');
  });
});

describe('POST /Auth/Logout', () => {
  test('destroys session and subsequent /Auth/Me returns 401', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'test@example.com' });

    const logoutRes = await agent.post('/Auth/Logout');
    expect(logoutRes.status).toBe(200);

    const meRes = await agent.get('/Auth/Me');
    expect(meRes.status).toBe(401);
  });
});

describe('GET /Auth/OAuth/google', () => {
  test('redirects to Google accounts (302)', async () => {
    const res = await request(app).get('/Auth/OAuth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/accounts\.google\.com/);
  });
});
