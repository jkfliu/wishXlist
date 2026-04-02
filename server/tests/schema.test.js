const mongoose = require('mongoose');
const wishListItemSchema = require('../schema/WishListItem_schema');
const userSchema         = require('../schema/User_schema');
const groupSchemaDefinition = require('../schema/Group_schema');

// Create isolated models for unit testing schemas
let schemaConn;
let WishListItem;
let User;
let Group;

beforeAll(async () => {
  schemaConn = await mongoose.createConnection(process.env.MONGO_URI);

  WishListItem = schemaConn.model('WishListItemTest', wishListItemSchema, 'WishListItemTest');

  User  = schemaConn.model('UserTest', userSchema, 'UserTest');
  Group = schemaConn.model('GroupTest', groupSchemaDefinition, 'GroupTest');
});

afterAll(async () => {
  await WishListItem.deleteMany({});
  await User.deleteMany({});
  await Group.deleteMany({});
  await schemaConn.close();
});

describe('WishListItem schema', () => {
  test('requires user_name', async () => {
    const item = new WishListItem({ item_name: 'Test Item' });
    const err = item.validateSync();
    expect(err).toBeDefined();
    expect(err.errors).toHaveProperty('user_name');
  });

  test('requires item_name', async () => {
    const item = new WishListItem({ user_name: 'testuser' });
    const err = item.validateSync();
    expect(err).toBeDefined();
    expect(err.errors).toHaveProperty('item_name');
  });

  test('optional fields (model, price, store) have no default values causing errors', async () => {
    const item = new WishListItem({ user_name: 'testuser', item_name: 'Test Item' });
    const err = item.validateSync();
    // No validation errors — optional fields don't cause issues
    expect(err).toBeUndefined();
    expect(item.model).toBeUndefined();
    expect(item.price).toBeUndefined();
    expect(item.store).toBeUndefined();
  });

  test('valid item can be saved', async () => {
    const item = new WishListItem({
      user_name: 'testuser',
      item_name: 'Valid Item',
      model: 'Model Z',
      price: '29.99',
      store: 'Some Store',
    });
    const saved = await item.save();
    expect(saved._id).toBeDefined();
    expect(saved.user_name).toBe('testuser');
    expect(saved.item_name).toBe('Valid Item');
  });
});

describe('Group schema', () => {
  test('requires name', () => {
    const g = new Group({ inviteCode: 'ABC123' });
    const err = g.validateSync();
    expect(err).toBeDefined();
    expect(err.errors).toHaveProperty('name');
  });

  test('requires inviteCode', () => {
    const g = new Group({ name: 'My Group' });
    const err = g.validateSync();
    expect(err).toBeDefined();
    expect(err.errors).toHaveProperty('inviteCode');
  });

  test('members defaults to empty array', () => {
    const g = new Group({ name: 'G', inviteCode: 'X' });
    expect(g.members).toEqual([]);
  });

  test('createdAt defaults to current date', () => {
    const before = new Date();
    const g = new Group({ name: 'G', inviteCode: 'Y' });
    const after = new Date();
    expect(g.createdAt).toBeDefined();
    expect(g.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(g.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
  });

  test('valid group can be saved', async () => {
    const g = new Group({ name: 'Valid Group', inviteCode: 'VALIDCODE' });
    const saved = await g.save();
    expect(saved._id).toBeDefined();
    expect(saved.members).toEqual([]);
  });
});

describe('User schema', () => {
  test('requires username', async () => {
    const user = new User({ first_name: 'Test' });
    const err = user.validateSync();
    expect(err).toBeDefined();
    expect(err.errors).toHaveProperty('username');
  });

  test('valid user can be created with just username', async () => {
    const user = new User({ username: 'validuser' });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });

  test('googleId is not required', () => {
    const user = new User({ username: 'fb@example.com', facebookId: 'fb-123' });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });

  test('facebookId-only user is valid', () => {
    const user = new User({ username: 'fb@example.com', facebookId: 'fb-456' });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });

  test('user with both googleId and facebookId is valid', () => {
    const user = new User({ username: 'both@example.com', googleId: 'g-123', facebookId: 'fb-789' });
    const err = user.validateSync();
    expect(err).toBeUndefined();
  });
});
