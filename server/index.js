require('dotenv').config();

// Import dependencies
const path       = require('path');
const crypto     = require('crypto');
const express    = require('express');
const MongoStore = require('connect-mongo');
const cors       = require('cors');
const mongoose   = require('mongoose');
const bodyParser = require('body-parser');

// Initialise express server
const app = express();
app.use(express.static(path.join(__dirname, '../client/dist')));

// Set up BodyParser
app.use(bodyParser.json());                           // Parse content-type - application/json
app.use(bodyParser.urlencoded({ extended: false }));

// Disable CORS policy and allow Vue app hosted on configured origin(s) to submit requests
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:8080'];
app.use(cors({ origin: corsOrigins, credentials: true }));

// Routes
// GET  /WishList/                        - Select all
// GET  /WishList/:user                   - Select wishlist for specific user
// POST /WishList/Create                  - Create new wishlist item
// POST /WishList/Update                  - Update wishlist item
// POST /WishList/Delete/:_id             - Delete wishlist item
// GET  /Auth/OAuth/google                - Initiate Google OAuth
// GET  /Auth/OAuth/google/callback       - OAuth callback (server-side redirect)
// GET  /Auth/Me                          - Return session user or 401
// POST /Auth/Logout                      - Destroy session
// GET  /Groups                           - Return all groups the authenticated user belongs to
// POST /Groups/Create                    - Create a new group
// POST /Groups/Join                      - Join a group by invite code
// POST /Groups/Leave                     - Leave a group
// GET  /Groups/Members                   - Return members of a group
app.options('/WishList/:user',       cors());
app.options('/WishList/Delete/:_id', cors());
app.options('/Groups/Create',        cors());
app.options('/Groups/Join',          cors());
app.options('/Groups/Leave',         cors());


// Set up Express-session, to help save session cookies (for authentication)
const express_session = require('express-session')({
  secret: process.env.SESSION_SECRET || 'changeme-replace-in-production',
  resave:  false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI || 'mongodb://localhost:27017/wishXlist' }),
});
app.use(express_session);

// Set up PassportJS
const passport = require('passport');
app.use(passport.initialize());
app.use(passport.session());


/************************/
/* DATABASE CONNECTIONS */
/************************/

// Connect to the MongoDB database wishXlist
mongoose.set('debug', true);
var db_connection = mongoose.createConnection(process.env.MONGO_URI || 'mongodb://localhost:27017/wishXlist');

const wishListItemSchema = require('./schema/wishListItem_schema');
// Specifying 3rd argument (mongoDB collection) avoids mongoose default pluralizing behaviour
const wishListModel      = db_connection.model('WishList', wishListItemSchema, 'WishList');

const userSchema        = require('./schema/User_schema');
const securityUserModel = db_connection.model('UserList', userSchema, 'UserList');

const groupSchema = require('./schema/Group_schema');
const groupModel  = db_connection.model('Groups', groupSchema, 'Groups');

db_connection.on('open',  async () => {
  console.log('Connected to mongoDB wishXlist successfully!');
  // Ensure the public group exists
  await groupModel.findOneAndUpdate(
    { inviteCode: 'PUBLIC' },
    { $setOnInsert: { name: 'Public', inviteCode: 'PUBLIC', members: [], createdAt: new Date() } },
    { upsert: true, new: true }
  );
});
db_connection.on('error', (error) => { console.log(error) });


/*************************/
/* PASSPORT - GOOGLE     */
/*************************/

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
  clientID:     process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL:  (process.env.SERVER_URL || 'http://localhost:3000') + '/Auth/OAuth/google/callback',
}, async (_accessToken, _refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    let user = await securityUserModel.findOne({ googleId: profile.id });
    if (!user) {
      user = await securityUserModel.create({
        googleId:    profile.id,
        username:    email,
        displayName: profile.displayName,
      });
      // Auto-enrol new user into the public group
      await groupModel.findOneAndUpdate(
        { inviteCode: 'PUBLIC' },
        { $addToSet: { members: email } }
      );
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await securityUserModel.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});


/*********************/
/* ROUTES - DATABASE */
/*********************/

// Route for retrieving Wish List items (all)
app.get('/WishList', async (_req, res) => {
  console.log('index.js - Retrieving Wish List items (all)')
  try {
    const data = await wishListModel.find({});
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Route for retrieving Wish List items (single user)
app.get('/WishList/:user', async (req, res) => {
  console.log('index.js - Retrieving Wish List items (single user)' + req.params.user)
  try {
    const data = await wishListModel.find({ user_name: req.params.user });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Route for creating a new Wish List item
app.post('/WishList/Create', async (req, res) => {
  console.log('index.js - Creating new Wish List item: ' + req.body)
  try {
    const data = await wishListModel.create(req.body);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Route for updating a Wish List item
app.post('/WishList/Update', async (req, res) => {
  console.log('index.js - Updating Wish List item: ' + req.body)
  try {
    const data = await wishListModel.findByIdAndUpdate(req.body._id, {
      item_name:          req.body.item_name,
      model:              req.body.model,
      price:              req.body.price,
      store:              req.body.store,
      item_modified_date: req.body.item_modified_date,
      gifter_user_name:   req.body.gifter_user_name,
      gifted_date:        req.body.gifted_date
    }, { new: true });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Route for deleting an existing Wish List item
app.post('/WishList/Delete/:_id', async (req, res) => {
  console.log('index.js - Deleting Wish List item: ' + req.params._id)
  try {
    const data = await wishListModel.findByIdAndDelete(req.params._id);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});


/********************/
/* ROUTES - GROUPS  */
/********************/

// Return all groups the authenticated user belongs to
app.get('/Groups', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const data = await groupModel.find({ members: req.user.username });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Create a new group
app.post('/Groups/Create', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const data = await groupModel.create({
      name:       req.body.name,
      inviteCode: inviteCode,
      members:    [req.user.username],
    });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Join a group by invite code
app.post('/Groups/Join', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const data = await groupModel.findOneAndUpdate(
      { inviteCode: req.body.inviteCode },
      { $addToSet: { members: req.user.username } },
      { new: true }
    );
    if (!data) return res.status(404).json({ error: 'Invalid invite code' });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Leave a group
app.post('/Groups/Leave', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const data = await groupModel.findByIdAndUpdate(
      req.body.groupId,
      { $pull: { members: req.user.username } },
      { new: true }
    );
    if (!data) return res.status(404).json({ error: 'Group not found' });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Return members of a group
app.get('/Groups/Members', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const data = await groupModel.findById(req.query.groupId);
    if (!data) return res.status(404).json({ error: 'Group not found' });
    return res.json({ members: data.members });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});


/*********************/
/* ROUTES - SECURITY */
/*********************/

// Initiate Google OAuth flow
app.get('/Auth/OAuth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth callback — redirects client to /login?oauth_username=<email>
app.get('/Auth/OAuth/google/callback',
  passport.authenticate('google', { session: true, failureRedirect: '/' }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    res.redirect(`${frontendUrl}/login?oauth_username=${encodeURIComponent(req.user.username)}`);
  }
);

// Return current session user (called by client on app load to verify session)
app.get('/Auth/Me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ username: req.user.username, displayName: req.user.displayName });
});

// Logout — destroys server session
app.post('/Auth/Logout', (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: err.message });
    req.session.destroy(() => res.status(200).json({ success: true }));
  });
});

// Test-only route: log in as any existing user without OAuth (used in automated tests)
if (process.env.NODE_ENV === 'test') {
  app.post('/Auth/Test/FakeLogin', async (req, res, next) => {
    const user = await securityUserModel.findOne({ username: req.body.username });
    if (!user) return res.status(404).end();
    req.logIn(user, (err) => {
      if (err) return next(err);
      res.status(200).json({ username: user.username });
    });
  });
}


// Serve Vue SPA for all non-API routes (must be after all API routes)
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});


// Export app for testing; only start listening when run directly
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`WishXList webserver started on port ${port}`);
  });
}

module.exports = app;
