const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.NODE_ENV               = 'test';
  process.env.MONGO_URI              = mongod.getUri() + 'wishXlist';
  process.env.SESSION_SECRET         = 'test-secret';
  process.env.CORS_ORIGINS           = 'http://localhost:8080';
  process.env.GOOGLE_CLIENT_ID       = 'test-google-client-id';
  process.env.GOOGLE_CLIENT_SECRET   = 'test-google-client-secret';
  process.env.SERVER_URL             = 'http://localhost:3000';
  process.env.FRONTEND_URL           = 'http://localhost:8080';
  global.__MONGOD__ = mongod;
};
