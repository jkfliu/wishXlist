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
app.set('case sensitive routing', true);
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
// GET  /WishList/                        - Select all (or filtered by ?groupId=)
// GET  /WishList/:user                   - Select wishlist for specific user
// POST   /WishList                        - Create new wishlist item
// PUT    /WishList/:_id                   - Update wishlist item
// DELETE /WishList/:_id                   - Delete wishlist item
// GET  /Auth/OAuth/google                - Initiate Google OAuth
// GET  /Auth/OAuth/google/callback       - OAuth callback (server-side redirect)
// GET  /Auth/OAuth/facebook              - Initiate Facebook OAuth
// GET  /Auth/OAuth/facebook/callback     - OAuth callback (server-side redirect)
// GET  /Auth/Me                          - Return session user or 401
// POST /Auth/Logout                      - Destroy session
// GET  /Groups                           - Return all groups the authenticated user belongs to
// POST /Groups/Create                    - Create a new group
// POST /Groups/Join                      - Join a group by invite code
// POST /Groups/Leave                     - Leave a group
// POST /Groups/Delete                    - Delete a group (Group Admin only); cascades visibleToGroups cleanup
// GET  /Groups/Members                   - Return members of a group (requester must be a member)
app.options('/WishList',      cors());
app.options('/WishList/:_id', cors());
app.options('/WishList/:user', cors());
app.options('/Groups/Create',        cors());
app.options('/Groups/Join',          cors());
app.options('/Groups/Leave',         cors());


if (!process.env.SESSION_SECRET && process.env.NODE_ENV !== 'test') {
  throw new Error('SESSION_SECRET environment variable is required');
}

// Set up Express-session, to help save session cookies (for authentication)
const express_session = require('express-session')({
  secret: process.env.SESSION_SECRET || 'test-secret',
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
mongoose.set('debug', process.env.NODE_ENV !== 'production');
var db_connection = mongoose.createConnection(process.env.MONGO_URI || 'mongodb://localhost:27017/wishXlist');

const wishListItemSchema = require('./schema/WishListItem_schema');
// Specifying 3rd argument (mongoDB collection) avoids mongoose default pluralizing behaviour
const wishListModel      = db_connection.model('WishList', wishListItemSchema, 'WishList');

const userSchema        = require('./schema/User_schema');
const securityUserModel = db_connection.model('UserList', userSchema, 'UserList');

const groupSchema = require('./schema/Group_schema');
const groupModel  = db_connection.model('Groups', groupSchema, 'Groups');

const eventLogSchema = require('./schema/EventLog_schema');
const eventLogModel  = db_connection.model('EventLog', eventLogSchema, 'EventLog');

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

const GoogleStrategy   = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';

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
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

passport.use(new FacebookStrategy(
  {
    clientID:      process.env.FACEBOOK_APP_ID,
    clientSecret:  process.env.FACEBOOK_APP_SECRET,
    callbackURL:   (process.env.SERVER_URL || 'http://localhost:3000') + '/Auth/OAuth/facebook/callback',
    profileFields: ['id', 'emails', 'displayName'],
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(null, false);

      let user = await securityUserModel.findOne({ facebookId: profile.id });
      if (!user) {
        // Link to existing account if same email (e.g. user already signed in via Google)
        user = await securityUserModel.findOneAndUpdate(
          { username: email },
          { $set: { facebookId: profile.id } },
          { new: true }
        );
        if (!user) {
          user = await securityUserModel.create({
            facebookId:  profile.id,
            username:    email,
            displayName: profile.displayName,
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

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
/* REQUEST LOGGING   */
/*********************/

// Log page views, API calls, and HTTP errors to EventLog collection
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (/\.(js|css|png|ico|map|woff|woff2|ttf|svg)$/.test(req.path)) return;
    if (req.path === '/Events/Pageview') return;
    const isApi = /^\/(Auth|WishList|Groups|Admin|Events)/.test(req.path);
    eventLogModel.create({
      type:      isApi ? 'api' : 'pageview',
      username:  req.user?.username || null,
      path:      req.path,
      status:    res.statusCode,
      duration:  Date.now() - start,
    }).catch(() => {});
  });
  next();
});


/*********************/
/* ROUTES - DATABASE */
/*********************/

// Route for retrieving Wish List items (all, or filtered by group)
// ?groupId=<id> — returns items visible to that group, excluding the requester's own items
// (no groupId)  — returns all items (used by MyWishList for the current user's own list)
app.get('/WishList', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const { groupId } = req.query;
    if (groupId !== undefined) {
      if (!groupId) return res.status(400).json({ error: 'groupId is required' });
      const group = await groupModel.findById(groupId);
      if (!group) return res.status(404).json({ error: 'Group not found' });
      if (!group.members.includes(req.user.username)) return res.status(403).json({ error: 'Forbidden' });
      const items = await wishListModel.find({
        user_name: { $in: group.members, $ne: req.user.username },
        // Items with no field or empty array are visible to all groups (legacy + default)
        $or: [{ visibleToGroups: { $exists: false } }, { visibleToGroups: { $size: 0 } }, { visibleToGroups: groupId }],
      });
      // Attach displayName to each item for the client to display
      const usernames = [...new Set(items.map(i => i.user_name))];
      const users = await securityUserModel.find({ username: { $in: usernames } }, 'username displayName');
      const nameMap = Object.fromEntries(users.map(u => [u.username, u.displayName]));
      const data = items.map(i => ({ ...i.toObject(), displayName: nameMap[i.user_name] || i.user_name }));
      return res.json(data);
    }
    const data = await wishListModel.find({});
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Route for retrieving Wish List items (single user)
app.get('/WishList/:user', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const data = await wishListModel.find({ user_name: req.params.user });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Route for creating a new Wish List item
app.post('/WishList', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const data = await wishListModel.create(req.body);
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Route for updating a Wish List item
// Owner may edit all fields; non-owner may only claim gifter_user_name on an ungifted item
app.put('/WishList/:_id', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const item = await wishListModel.findById(req.params._id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    const isOwner  = item.user_name === req.user.username;
    const isGifter = !item.gifter_user_name && req.body.gifter_user_name === req.user.username;
    if (!isOwner && !isGifter) return res.status(403).json({ error: 'Forbidden' });
    const data = await wishListModel.findByIdAndUpdate(req.params._id, {
      item_name:          req.body.item_name,
      model:              req.body.model,
      price:              req.body.price,
      store:              req.body.store,
      item_modified_date: req.body.item_modified_date,
      gifter_user_name:   req.body.gifter_user_name,
      gifted_date:        req.body.gifted_date,
      visibleToGroups:    req.body.visibleToGroups,
    }, { new: true });
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Route for deleting an existing Wish List item
app.delete('/WishList/:_id', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const item = await wishListModel.findById(req.params._id);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    if (item.user_name !== req.user.username) return res.status(403).json({ error: 'Forbidden' });
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
      admins:     [req.user.username],
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

// Leave a group; auto-deletes the group (with visibleToGroups cascade) if the last member leaves
app.post('/Groups/Leave', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const data = await groupModel.findByIdAndUpdate(
      req.body.groupId,
      { $pull: { members: req.user.username } },
      { new: true }
    );
    if (!data) return res.status(404).json({ error: 'Group not found' });
    if (data.members.length === 0) {
      await Promise.all([
        groupModel.findByIdAndDelete(req.body.groupId),
        wishListModel.updateMany(
          { visibleToGroups: req.body.groupId },
          { $pull: { visibleToGroups: req.body.groupId } }
        ),
      ]);
      return res.json({ deleted: true });
    }
    return res.json(data);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Delete a group (Group Admin only); cascades visibleToGroups cleanup on WishList items
app.post('/Groups/Delete', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const group = await groupModel.findById(req.body.groupId);
    if (!group) return res.status(404).json({ error: 'Group not found' });
    if (!group.admins.includes(req.user.username)) return res.status(403).json({ error: 'Not group admin' });
    await Promise.all([
      groupModel.findByIdAndDelete(req.body.groupId),
      wishListModel.updateMany(
        { visibleToGroups: req.body.groupId },
        { $pull: { visibleToGroups: req.body.groupId } }
      ),
    ]);
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

// Return members of a group (requester must be a member)
app.get('/Groups/Members', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const data = await groupModel.findById(req.query.groupId);
    if (!data) return res.status(404).json({ error: 'Group not found' });
    if (!data.members.includes(req.user.username)) return res.status(403).json({ error: 'Forbidden' });
    return res.json({ members: data.members });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});


/********************/
/* ROUTES - ADMIN   */
/********************/

// Build ISO week label e.g. "2026-W15"
function isoWeekLabel(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// Build array of last N week-start Date objects (Monday 00:00 UTC)
function lastNWeekStarts(n) {
  const weeks = [];
  const now = new Date();
  // Start of current ISO week (Monday)
  const day = now.getUTCDay() || 7;
  const thisMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (day - 1)));
  for (let i = n - 1; i >= 0; i--) {
    weeks.push(new Date(thisMonday.getTime() - i * 7 * 86400000));
  }
  return weeks;
}

async function buildReport() {
    const now       = new Date();
    const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const prevStart = new Date(now - 14 * 24 * 60 * 60 * 1000);
    const eightWeeksAgo = new Date(now - 8 * 7 * 24 * 60 * 60 * 1000);

    // --- Current-week summary counts ---
    const [
      totalUsers, newUsersThisWeek, newUsersLastWeek,
      totalGroups, newGroupsThisWeek, newGroupsLastWeek,
      totalWishes, newWishesThisWeek, newWishesLastWeek,
      totalGifted, giftedThisWeek, giftedLastWeek,
      loginDocs, pageviewDocs, apiErrorDocs, apiDocs,
    ] = await Promise.all([
      securityUserModel.countDocuments(),
      securityUserModel.countDocuments({ createdAt: { $gte: weekStart } }),
      securityUserModel.countDocuments({ createdAt: { $gte: prevStart, $lt: weekStart } }),
      groupModel.countDocuments({ inviteCode: { $ne: 'PUBLIC' } }),
      groupModel.countDocuments({ inviteCode: { $ne: 'PUBLIC' }, createdAt: { $gte: weekStart } }),
      groupModel.countDocuments({ inviteCode: { $ne: 'PUBLIC' }, createdAt: { $gte: prevStart, $lt: weekStart } }),
      wishListModel.countDocuments(),
      wishListModel.countDocuments({ item_create_date: { $gte: weekStart } }),
      wishListModel.countDocuments({ item_create_date: { $gte: prevStart, $lt: weekStart } }),
      wishListModel.countDocuments({ gifter_user_name: { $exists: true, $ne: '' } }),
      wishListModel.countDocuments({ gifted_date: { $gte: weekStart } }),
      wishListModel.countDocuments({ gifted_date: { $gte: prevStart, $lt: weekStart } }),
      eventLogModel.find({ type: 'login',   timestamp: { $gte: weekStart } }, 'username').lean(),
      eventLogModel.find({ type: 'pageview', timestamp: { $gte: weekStart } }, 'path').lean(),
      eventLogModel.find({ type: 'api', status: { $gte: 400 }, timestamp: { $gte: weekStart } }, 'status path username timestamp').lean(),
      eventLogModel.find({ type: 'api', timestamp: { $gte: weekStart } }, 'duration').lean(),
    ]);

    const top5Pages = Object.entries(
      pageviewDocs.reduce((acc, e) => { acc[e.path] = (acc[e.path] || 0) + 1; return acc; }, {})
    ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([path, count]) => ({ path, count }));

    const avgResponseTime = apiDocs.length
      ? Math.round(apiDocs.reduce((s, e) => s + (e.duration || 0), 0) / apiDocs.length)
      : null;

    // --- Historical weekly data (last 8 weeks) ---
    const weekStarts = lastNWeekStarts(8);
    const weekLabels = weekStarts.map(isoWeekLabel);

    // Fetch all relevant documents in the 8-week window once, then bucket client-side
    const [histUsers, histGroups, histWishes, histGifted, histEvents] = await Promise.all([
      securityUserModel.find({ createdAt: { $gte: eightWeeksAgo } }, 'createdAt').lean(),
      groupModel.find({ inviteCode: { $ne: 'PUBLIC' }, createdAt: { $gte: eightWeeksAgo } }, 'createdAt').lean(),
      wishListModel.find({ item_create_date: { $gte: eightWeeksAgo } }, 'item_create_date').lean(),
      wishListModel.find({ gifted_date: { $gte: eightWeeksAgo } }, 'gifted_date').lean(),
      eventLogModel.find({ timestamp: { $gte: eightWeeksAgo } }, 'type username path status duration timestamp').lean(),
    ]);

    function weekIndex(date) {
      if (!date) return -1;
      for (let i = weekStarts.length - 1; i >= 0; i--) {
        if (date >= weekStarts[i]) return i;
      }
      return -1;
    }

    const newUsers    = Array(8).fill(0);
    const newGroups   = Array(8).fill(0);
    const newWishes   = Array(8).fill(0);
    const gifted      = Array(8).fill(0);
    const logins      = Array(8).fill(0);
    const loginUsers  = Array.from({ length: 8 }, () => new Set());
    const pageviews   = Array(8).fill(0);
    const pageBreakdownSets = {};
    const httpErrors  = Array(8).fill(0);
    const responseSums  = Array(8).fill(0);
    const responseCounts = Array(8).fill(0);

    histUsers.forEach(u  => { const i = weekIndex(u.createdAt);    if (i >= 0) newUsers[i]++; });
    histGroups.forEach(g => { const i = weekIndex(g.createdAt);    if (i >= 0) newGroups[i]++; });
    histWishes.forEach(w => { const i = weekIndex(w.item_create_date); if (i >= 0) newWishes[i]++; });
    histGifted.forEach(w => { const i = weekIndex(w.gifted_date);  if (i >= 0) gifted[i]++; });

    histEvents.forEach(e => {
      const i = weekIndex(e.timestamp);
      if (i < 0) return;
      if (e.type === 'login') {
        logins[i]++;
        if (e.username) loginUsers[i].add(e.username);
      } else if (e.type === 'pageview') {
        pageviews[i]++;
        if (e.path) {
          if (!pageBreakdownSets[e.path]) pageBreakdownSets[e.path] = Array(8).fill(0);
          pageBreakdownSets[e.path][i]++;
        }
      } else if (e.type === 'api') {
        if (e.status >= 400) httpErrors[i]++;
        if (e.duration != null) { responseSums[i] += e.duration; responseCounts[i]++; }
      }
    });

    // Top 5 pages by total views across 8 weeks
    const top5HistPages = Object.entries(pageBreakdownSets)
      .map(([path, counts]) => ({ path, total: counts.reduce((s, n) => s + n, 0), counts }))
      .sort((a, b) => b.total - a.total).slice(0, 5);

    const pageBreakdown = {};
    top5HistPages.forEach(({ path, counts }) => { pageBreakdown[path] = counts; });

    const avgResponseMs = responseCounts.map((c, i) => c ? Math.round(responseSums[i] / c) : null);

    return {
      generatedAt: now,
      period: { from: weekStart, to: now },
      stats: {
        users:  { total: totalUsers,  thisWeek: newUsersThisWeek,  lastWeek: newUsersLastWeek },
        groups: { total: totalGroups, thisWeek: newGroupsThisWeek, lastWeek: newGroupsLastWeek },
        wishes: { total: totalWishes, thisWeek: newWishesThisWeek, lastWeek: newWishesLastWeek },
        gifted: { total: totalGifted, thisWeek: giftedThisWeek,    lastWeek: giftedLastWeek },
      },
      logins: {
        total:       loginDocs.length,
        uniqueUsers: new Set(loginDocs.map(e => e.username)).size,
        pageviews:   pageviewDocs.length,
        top5Pages,
      },
      metrics: {
        httpErrors:      apiErrorDocs.length,
        avgResponseTime,
        httpErrorList:   apiErrorDocs.map(e => ({ status: e.status, path: e.path, username: e.username || null, timestamp: e.timestamp })),
      },
      history: {
        weeks:         weekLabels,
        newUsers,
        newGroups,
        newWishes,
        gifted,
        logins,
        uniqueLogins:  loginUsers.map(s => s.size),
        pageviews,
        pageBreakdown,
        httpErrors,
        avgResponseMs,
      },
    };
}

app.post('/Events/Pageview', (req, res) => {
  const { path } = req.body;
  if (!path || typeof path !== 'string') return res.status(400).json({ error: 'Invalid path' });
  eventLogModel.create({
    type:      'pageview',
    username:  req.user?.username || null,
    path:      path.slice(0, 200),
    timestamp: new Date(),
  }).catch(() => {});
  res.sendStatus(204);
});

app.get('/Admin/Report', async (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  if (req.user.username !== process.env.ADMIN_USERNAME) return res.status(403).json({ error: 'Forbidden' });
  try {
    return res.json(await buildReport());
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

// Google OAuth callback — redirects client to /login?oauth_success=1
app.get('/Auth/OAuth/google/callback',
  passport.authenticate('google', { failureRedirect: `${frontendUrl}/login?error=oauth_failed` }),
  (req, res) => {
    eventLogModel.create({ type: 'login', username: req.user?.username }).catch(() => {});
    res.redirect(`${frontendUrl}/login?oauth_success=1`);
  }
);

// Initiate Facebook OAuth flow
app.get('/Auth/OAuth/facebook',
  passport.authenticate('facebook', { scope: ['email'] })
);

// Facebook OAuth callback — redirects client to /login?oauth_success=1
app.get('/Auth/OAuth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: `${frontendUrl}/login?error=oauth_failed` }),
  (req, res) => {
    eventLogModel.create({ type: 'login', username: req.user?.username }).catch(() => {});
    res.redirect(`${frontendUrl}/login?oauth_success=1`);
  }
);

// Return current session user (called by client on app load to verify session)
app.get('/Auth/Me', (req, res) => {
  if (!req.isAuthenticated()) return res.status(401).json({ error: 'Not authenticated' });
  res.json({
    username:    req.user.username,
    displayName: req.user.displayName,
    isAdmin:     req.user.username === process.env.ADMIN_USERNAME,
  });
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

  // Weekly report cron — 8am Monday (server local time)
  if (process.env.ADMIN_USERNAME && process.env.RESEND_API_KEY && process.env.ADMIN_EMAIL) {
    const cron = require('node-cron');
    const sendWeeklyReport = require('./report/sendWeeklyReport');
    cron.schedule('0 8 * * 1', async () => {
      try {
        console.log('[cron] Generating weekly report...');
        const data = await buildReport();
        await sendWeeklyReport(data);
        console.log('[cron] Weekly report sent.');
      } catch (err) {
        console.error('[cron] Weekly report failed:', err.message);
      }
    });
  }
}

module.exports = app;
