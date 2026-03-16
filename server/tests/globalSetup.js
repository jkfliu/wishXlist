const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri() + 'wishXlist';
  process.env.MONGO_SECURITY_URI = mongod.getUri() + 'wishXlist_security';
  process.env.SESSION_SECRET = 'test-secret';
  process.env.CORS_ORIGINS = 'http://localhost:8080';
  global.__MONGOD__ = mongod;
};
