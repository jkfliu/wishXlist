require('dotenv').config();

// Import dependencies
const express    = require('express');
const cors       = require('cors');
const mongoose   = require('mongoose');
const bodyParser = require('body-parser');

// Initialise express server
const app = express();
app.use(express.static(__dirname));

// Set up BodyParser
app.use(bodyParser.json());                           // Parse content-type - application/json
app.use(bodyParser.urlencoded({ extended: false }));

// Disable CORS policy and allow Vue app hosted on configured origin(s) to submit requests
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:8080'];
app.use(cors({ origin: corsOrigins, credentials: true }));

// Routes
// GET  /WishList/                - Select all
// GET  /WishList/:user           - Select wishlist for specific user
// POST /WishList/Create          - Create new wishlist item
// POST /WishList/Update          - Update wishlist item
// POST /WishList/Delete/:_id     - Delete wishlist item
// POST /Auth/Login               - Login
// POST /Auth/Change_Password     - Change password
app.options('/WishList/:user',       cors());
app.options('/WishList/Delete/:_id', cors());


// Set up Express-session, to help save session cookies (for authentication)
const express_session = require('express-session')({
  secret: process.env.SESSION_SECRET || 'changeme-replace-in-production',
  resave:  false,
  saveUninitialized: false
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
// Use mongoose.createConnection rather than mongoose.connect
// (mongoose.connect opens the default connection, bad practice if you're using multiple DB connections)
mongoose.set('debug', true);
var db_connection = mongoose.createConnection(process.env.MONGO_URI || 'mongodb://localhost:27017/wishXlist');

const wishListItemSchema = require('./schema/wishListItem_schema');
// Specifying 3rd argument (mongoDB collection) avoids mongoose default pluralizing behaviour
const wishListModel      = db_connection.model('WishList', wishListItemSchema, 'WishList');

db_connection.on('open',  ()      => { console.log('Connected to mongoDB wishXlist successfully!'); });
db_connection.on('error', (error) => { console.log( error) });


// Separate MongoDB connection for authentication (DB wishXlist_security)
const mongoose_secure   = require('mongoose');
const passport_mongoose = require('passport-local-mongoose');

mongoose_secure.set('debug', true);
var db_secure_conn = mongoose_secure.createConnection(process.env.MONGO_SECURITY_URI || 'mongodb://localhost:27017/wishXlist_security');

const userSchema = require('./schema/User_schema');
userSchema.plugin(passport_mongoose);
const securityUserListModel = db_secure_conn.model('UserList', userSchema, 'UserList');

db_secure_conn.on('open',  ()      => { console.log('Connected to mongoDB wishXlist_security successfully!'); });
db_secure_conn.on('error', (error) => { console.log( error) });

// Use static authenticate method of securityUserListModel in LocalStrategy
passport.use(securityUserListModel.createStrategy());
// Use static serialize and deserialize of securityUserListModel for passport session support
passport.serializeUser(securityUserListModel.serializeUser());
passport.deserializeUser(securityUserListModel.deserializeUser());


/*********************/
/* ROUTES - DATABASE */
/*********************/

// Route for retrieving Wish List items (all)
app.get('/WishList', async (req, res) => {
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


/*********************/
/* ROUTES - SECURITY */
/*********************/

// Authenticate using local strategy
app.post( '/Auth/Login', (req, res) => {
  console.log('index.js - Authenticating for: ' + JSON.stringify(req.body))

  passport.authenticate( 'local', (err, user, info) => {
    if (err) {
      console.error(err);
      return res.status(500).json(err);
    }

    // 'user' is set if authentication is successful
    if (user) {
      return res.status(200).json(user);
    } else {
      // Unauthorised access, 'info' contains the error message
      return res.status(401).json(info)
    }
  })(req, res) // End of passport.authenticate
});

app.post( '/Auth/Change_Password', async (req, res) => {

  console.log('index.js - Changing password for: ' + JSON.stringify(req.body))

  try {
    const user = await securityUserListModel.findOne({ username: req.body.username });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    try {
      await user.changePassword(req.body.old_password, req.body.new_password);
      res.json({ success: true, message: 'Your password has been changed successfully' });
    } catch (err) {
      if (err.name === 'IncorrectPasswordError') {
        res.json({ success: false, message: 'Incorrect password specified, password not changed. Please try again...' });
      } else {
        res.json({ success: false, message: err.name });
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }

});

/***************************/
/* Register users - sample */
/***************************/

// Passport.js requires 'username' field to be present (and not anything else like 'user_name')
/*
securityUserListModel.register({username:'Lock_Ying_Lai', active: false}, 'Lock_Ying_Lai');
securityUserListModel.register({username:'Ben_Teh',       active: false}, 'Ben_Teh');
securityUserListModel.register({username:'Jean_Tan',      active: false}, 'Jean_Tan');
securityUserListModel.register({username:'Lenny_Teh',     active: false}, 'Lenny_Teh');
securityUserListModel.register({username:'Caitlin_Teh',   active: false}, 'Caitlin_Teh');
securityUserListModel.register({username:'Keat_Tan',      active: false}, 'Keat_Tan');
securityUserListModel.register({username:'Low_Tzu_Wei',   active: false}, 'Low_Tzu_Wei');
securityUserListModel.register({username:'Cara_Tan',      active: false}, 'Cara_Tan');
securityUserListModel.register({username:'Sara_Tan',      active: false}, 'Sara_Tan');
securityUserListModel.register({username:'Ira_Tan',       active: false}, 'Ira_Tan');
securityUserListModel.register({username:'Jason_Liu',     active: false}, 'Jason_Liu');
securityUserListModel.register({username:'Tan_Wei_Pei',   active: false}, 'Tan_Wei_Pei');
securityUserListModel.register({username:'Keagan_Liu',    active: false}, 'Keagan_Liu');
securityUserListModel.register({username:'Edwin_Ho',      active: false}, 'Edwin_Ho');
securityUserListModel.register({username:'Tan_Wei_Nie',   active: false}, 'Tan_Wei_Nie');
securityUserListModel.register({username:'Natalie_Ho',    active: false}, 'Natalie_Ho');
securityUserListModel.register({username:'Odelya_Ho',     active: false}, 'Odelya_Ho');
*/

// Export app for testing; only start listening when run directly
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`WishXList webserver started on port ${port}`);
  });
}

module.exports = app;
