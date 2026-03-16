const request  = require('supertest');
const mongoose = require('mongoose');
const { closeAllConnections } = require('./helpers');

// Each test file gets its own mongoose connection to the in-memory DB
let app;
let securityConn;
let UserModel;

beforeAll(async () => {
  // Connect to the security DB (already set up by globalSetup)
  const passport_mongoose = require('passport-local-mongoose');
  const userSchema = require('../schema/User_schema');

  // Clone the schema so we can add the plugin without polluting the shared module
  const mongoose_secure = require('mongoose');
  securityConn = await mongoose_secure.createConnection(process.env.MONGO_SECURITY_URI);

  const testUserSchema = new mongoose_secure.Schema({
    username:   { type: String, required: true },
    first_name: { type: String },
    last_name:  { type: String },
    email:      { type: String },
  });
  testUserSchema.plugin(passport_mongoose);
  UserModel = securityConn.model('UserList', testUserSchema, 'UserList');

  // Register a test user
  await UserModel.register({ username: 'testuser' }, 'testpassword');

  // Load the app after env vars are set
  app = require('../index');
});

afterAll(async () => {
  await UserModel.deleteMany({});
  await closeAllConnections();
});

describe('POST /Auth/Login', () => {
  test('valid credentials returns 200 with user object', async () => {
    const res = await request(app)
      .post('/Auth/Login')
      .send({ username: 'testuser', password: 'testpassword' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', 'testuser');
  });

  test('wrong password returns 401', async () => {
    const res = await request(app)
      .post('/Auth/Login')
      .send({ username: 'testuser', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  test('missing username returns 401 or 400', async () => {
    const res = await request(app)
      .post('/Auth/Login')
      .send({ password: 'testpassword' });
    expect([400, 401]).toContain(res.status);
  });
});

describe('POST /Auth/Change_Password - edge cases', () => {
  test('returns 404 when user does not exist', async () => {
    const res = await request(app)
      .post('/Auth/Change_Password')
      .send({ username: 'nonexistent_user', old_password: 'pass', new_password: 'newpass' });
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
  });
});

describe('POST /Auth/Change_Password', () => {
  test('valid old + new password returns success', async () => {
    const res = await request(app)
      .post('/Auth/Change_Password')
      .send({ username: 'testuser', old_password: 'testpassword', new_password: 'newpassword123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });

  test('wrong old password returns failure response', async () => {
    const res = await request(app)
      .post('/Auth/Change_Password')
      .send({ username: 'testuser', old_password: 'wrongoldpassword', new_password: 'anotherpassword' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', false);
  });
});
