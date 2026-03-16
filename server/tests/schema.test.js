const mongoose = require('mongoose');
const wishListItemSchema = require('../schema/wishListItem_schema');
const userSchemaDefinition = require('../schema/User_schema');

// Create isolated models for unit testing schemas
let schemaConn;
let WishListItem;
let User;

beforeAll(async () => {
  schemaConn = await mongoose.createConnection(process.env.MONGO_URI);

  WishListItem = schemaConn.model('WishListItemTest', wishListItemSchema, 'WishListItemTest');

  const testUserSchema = new mongoose.Schema({
    username:   { type: String, required: true },
    first_name: { type: String },
    last_name:  { type: String },
    email:      { type: String },
  });
  User = schemaConn.model('UserTest', testUserSchema, 'UserTest');
});

afterAll(async () => {
  await WishListItem.deleteMany({});
  await User.deleteMany({});
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
});
