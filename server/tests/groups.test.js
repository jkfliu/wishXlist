const request  = require('supertest');
const mongoose = require('mongoose');
const { closeAllConnections } = require('./helpers');

let app;
let UserModel;
let GroupModel;

beforeAll(async () => {
  const userSchema  = require('../schema/User_schema');
  const groupSchema = require('../schema/Group_schema');
  const conn = mongoose.createConnection(process.env.MONGO_URI);
  UserModel  = conn.model('UserList',  userSchema,  'UserList');
  GroupModel = conn.model('Groups',    groupSchema, 'Groups');

  await UserModel.create({ googleId: 'grp-google-1', username: 'grouptest@example.com', displayName: 'Group Tester' });
  await UserModel.create({ googleId: 'grp-google-2', username: 'other@example.com',     displayName: 'Other User' });

  app = require('../index');
  // Allow the db_connection.on('open') seed to run
  await new Promise(r => setTimeout(r, 200));
});

afterAll(async () => {
  await UserModel.deleteMany({});
  await GroupModel.deleteMany({});
  await closeAllConnections();
});


/**********************/
/* Public group seed  */
/**********************/

describe('Public group seeding', () => {
  test('a group with inviteCode PUBLIC and name Public exists after app loads', async () => {
    const pub = await GroupModel.findOne({ inviteCode: 'PUBLIC' });
    expect(pub).not.toBeNull();
    expect(pub.name).toBe('Public');
  });
});


/****************/
/* GET /Groups  */
/****************/

describe('GET /Groups', () => {
  test('returns 401 when unauthenticated', async () => {
    const res = await request(app).get('/Groups');
    expect(res.status).toBe(401);
  });

  test('returns empty array when user belongs to no groups', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    // Ensure user is not in any group
    await GroupModel.updateMany({}, { $pull: { members: 'grouptest@example.com' } });
    const res = await agent.get('/Groups');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('returns only groups the user belongs to', async () => {
    await GroupModel.create({ name: 'My Group',    inviteCode: 'MYGRP',    members: ['grouptest@example.com'] });
    await GroupModel.create({ name: 'Other Group', inviteCode: 'OTHERGRP', members: ['other@example.com'] });

    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    const res = await agent.get('/Groups');
    expect(res.status).toBe(200);
    expect(res.body.some(g => g.name === 'My Group')).toBe(true);
    expect(res.body.some(g => g.name === 'Other Group')).toBe(false);
  });
});


/*********************/
/* POST /Groups/Create */
/*********************/

describe('POST /Groups/Create', () => {
  test('returns 401 when unauthenticated', async () => {
    const res = await request(app).post('/Groups/Create').send({ name: 'Fail' });
    expect(res.status).toBe(401);
  });

  test('creates group with name, auto-generated inviteCode, and creator as member', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    const res = await agent.post('/Groups/Create').send({ name: 'New Group' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'New Group');
    expect(res.body.inviteCode).toBeTruthy();
    expect(res.body.members).toContain('grouptest@example.com');
  });

  test('invite code is 8 uppercase hex chars', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    const res = await agent.post('/Groups/Create').send({ name: 'Hex Group' });
    expect(res.body.inviteCode).toMatch(/^[0-9A-F]{8}$/);
  });
});


/********************/
/* POST /Groups/Join */
/********************/

describe('POST /Groups/Join', () => {
  let joinableGroupCode;

  beforeAll(async () => {
    const g = await GroupModel.create({ name: 'Joinable', inviteCode: 'JOINTHIS', members: ['other@example.com'] });
    joinableGroupCode = g.inviteCode;
  });

  test('returns 401 when unauthenticated', async () => {
    const res = await request(app).post('/Groups/Join').send({ inviteCode: joinableGroupCode });
    expect(res.status).toBe(401);
  });

  test('joins group on valid invite code', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    const res = await agent.post('/Groups/Join').send({ inviteCode: joinableGroupCode });
    expect(res.status).toBe(200);
    expect(res.body.members).toContain('grouptest@example.com');
  });

  test('joining same group twice does not duplicate member', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    await agent.post('/Groups/Join').send({ inviteCode: joinableGroupCode });
    const res = await agent.post('/Groups/Join').send({ inviteCode: joinableGroupCode });
    expect(res.status).toBe(200);
    const count = res.body.members.filter(m => m === 'grouptest@example.com').length;
    expect(count).toBe(1);
  });

  test('returns 404 on invalid invite code', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    const res = await agent.post('/Groups/Join').send({ inviteCode: 'BADCODE99' });
    expect(res.status).toBe(404);
  });
});


/*********************/
/* POST /Groups/Leave */
/*********************/

describe('POST /Groups/Leave', () => {
  let leavableGroupId;

  beforeAll(async () => {
    const g = await GroupModel.create({
      name: 'Leavable', inviteCode: 'LEAVETHIS',
      members: ['grouptest@example.com', 'other@example.com'],
    });
    leavableGroupId = g._id.toString();
  });

  test('returns 401 when unauthenticated', async () => {
    const res = await request(app).post('/Groups/Leave').send({ groupId: leavableGroupId });
    expect(res.status).toBe(401);
  });

  test('removes user from group', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    const res = await agent.post('/Groups/Leave').send({ groupId: leavableGroupId });
    expect(res.status).toBe(200);
    expect(res.body.members).not.toContain('grouptest@example.com');
  });

  test('other members are unaffected', async () => {
    const group = await GroupModel.findById(leavableGroupId);
    expect(group.members).toContain('other@example.com');
  });

  test('returns 404 for non-existent groupId', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    const res = await agent.post('/Groups/Leave').send({ groupId: '000000000000000000000000' });
    expect(res.status).toBe(404);
  });
});


/***********************/
/* GET /Groups/Members */
/***********************/

describe('GET /Groups/Members', () => {
  let membersGroupId;

  beforeAll(async () => {
    const g = await GroupModel.create({
      name: 'Members Group', inviteCode: 'MEMGRP',
      members: ['grouptest@example.com', 'other@example.com'],
    });
    membersGroupId = g._id.toString();
  });

  test('returns 401 when unauthenticated', async () => {
    const res = await request(app).get(`/Groups/Members?groupId=${membersGroupId}`);
    expect(res.status).toBe(401);
  });

  test('returns { members } array for valid groupId', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    const res = await agent.get(`/Groups/Members?groupId=${membersGroupId}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('members');
    expect(res.body.members).toContain('grouptest@example.com');
    expect(res.body.members).toContain('other@example.com');
  });

  test('returns 404 for non-existent groupId', async () => {
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    const res = await agent.get('/Groups/Members?groupId=000000000000000000000000');
    expect(res.status).toBe(404);
  });

  test('returns 403 when requester is not a member of the group', async () => {
    const privateGroup = await GroupModel.create({
      name: 'Private', inviteCode: 'PRIVGRP', members: ['other@example.com'],
    });
    const agent = request.agent(app);
    await agent.post('/Auth/Test/FakeLogin').send({ username: 'grouptest@example.com' });
    const res = await agent.get(`/Groups/Members?groupId=${privateGroup._id}`);
    expect(res.status).toBe(403);
  });
});
