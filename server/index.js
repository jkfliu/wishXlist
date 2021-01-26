// Import dependencies
const express    = require('express');
const cors       = require('cors'); 
const mongoose   = require('mongoose');
const bodyParser = require('body-parser');

// Initialise express server on port 3000
const appWishXList = express();
appWishXList.use(express.static(__dirname));

// To start the server, run `node index` on the command line
const port = process.env.PORT || 3000;  // Heroku may set the port, if not use 3000
appWishXList.listen(port, () => {
  console.log("WishXList webserver started on port 3000")
})

// Set up BodyParser
appWishXList.use(bodyParser.json());                           // Parse content-type - application/json`
appWishXList.use(bodyParser.urlencoded({ extended: false }));

// Disable CORS policy and allow Vue app hosted on localhost:8080 to submit requests
appWishXList.use(cors({ origin: 'http://localhost:8080' }));

// Routes
// GET  /WishList/                - Select all
// GET  /WishList/:user           - Select wishlist for specific user
// POST /WishList/Create          - Create new wishlist item
// POST /WishList/Update          - Update wishlist item
// POST /WishList/Delete/:_id     - Delete wishlist item
// POST /Auth/Login               - Login
// POST /Auth/Change_Password     - Change password
appWishXList.options('/WishList/:user',       cors());
appWishXList.options('/WishList/Delete/:_id', cors());


// Set up Express-session, to help save session cookies (for authentication)
const express_session = require('express-session')({
  secret: 'secret',
  resave:  false,
  saveUnintialized: false
});
appWishXList.use(express_session);

// Set up PassportJS
const passport = require('passport');
appWishXList.use(passport.initialize());
appWishXList.use(passport.session());


/************************/
/* DATABASE CONNECTIONS */
/************************/

// Connect to the MongoDB database wishXlist
// Use mongoose.createConnection rather than mongoose.connect
// (mongoose.connect opens the default connection, bad practice if you're using multiple DB connections)
mongoose.set('debug', true);
var db_connection = mongoose.createConnection("mongodb://localhost:27017/wishXlist", {
  useNewUrlParser:    true,
  useUnifiedTopology: true
});

const wishListItemSchema = require('./schema/wishListItem_schema');
// Specifying 3rd argument (mongoDB collection) avoids mongoose default pluralizing behaviour
const wishListModel      = db_connection.model('WishList', wishListItemSchema, 'WishList');

db_connection.on('open',  ()      => { console.log('Connected to mongoDB:27017/wishXlist successfully!'); });
db_connection.on('error', (error) => { console.log( error) });


// Separate MongoDB connection for authentication (DB wishXlist_security)
const mongoose_secure   = require('mongoose');
const passport_mongoose = require('passport-local-mongoose');

mongoose_secure.set('debug', true);
var db_secure_conn = mongoose_secure.createConnection("mongodb://localhost:27017/wishXlist_security", { 
  useNewUrlParser:    true,
  useUnifiedTopology: true
});

const userSchema = require('./schema/User_schema');
userSchema.plugin(passport_mongoose);
const securityUserListModel = db_secure_conn.model('UserList', userSchema, 'UserList');

db_secure_conn.on('open',  ()      => { console.log('Connected to mongoDB:27017/wishXlist_security successfully!'); });
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
appWishXList.get('/WishList', (req, res) => {
  console.log('index.js - Retrieving Wish List items (all)')
  wishListModel.find( {}, (err, data) => {
    if (err) { console.error(err) }
    return res.json(data)
  })
});

// Route for retrieving Wish List items (single user)
appWishXList.get('/WishList/:user', (req, res) => {
  console.log('index.js - Retrieving Wish List items (single user)' + req.params.user)
  wishListModel.find( { user_name: req.params.user }, (err, data) => {
    if (err) { console.error(err) }
	  return res.json(data)
  })
});

// Route for creating a new Wish List item
appWishXList.post('/WishList/Create', (req, res) => {
  console.log('index.js - Creating new Wish List item: ' + req.body)
  wishListModel.create( req.body, (err, data) => {
    if (err) { console.error(err) }
    return res.json(data)
  })
});

// Route for updating a Wish List item
appWishXList.post('/WishList/Update', (req, res) => {
  console.log('index.js - Updating Wish List item: ' + req.body)
  wishListModel.updateOne( { _id: req.body._id }, { 
    item_name:          req.body.item_name, 
    model:              req.body.model,
    price:              req.body.price,
    store:              req.body.store,
    item_modified_date: req.body.item_modified_date,
    gifter_user_name:   req.body.gifter_user_name,
    gifted_date:        req.body.gifted_date}, function(err, data) {
    if (err) { console.error(err) }
    return res.json(data)
  })
});

// Route for deleting an existing Wish List item
appWishXList.post('/WishList/Delete/:_id', (req, res) => {
  console.log('index.js - Deleting Wish List item: ' + req.params._id)
  wishListModel.findByIdAndRemove( req.params._id, (err, data) => {
    if (err) { console.error(err) }
	  return res.json(data)
  })
});


/*********************/
/* ROUTES - SECURITY */
/*********************/

const connectEnsureLogin = require('connect-ensure-login');

// Authenticate using local strategy
appWishXList.post( '/Auth/Login', (req, res) => {
  console.log('index.js - Authenticating for: ' + JSON.stringify(req.body))

  passport.authenticate( 'local', (err, user, info) => {
    /*
    console.log('passport.authenticate::err:  ' + err)
    console.log('passport.authenticate::user: ' + user)
    console.log('passport.authenticate::info: ' + info)
    */
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

appWishXList.post( '/Auth/Change_Password', (req, res) => {

  console.log('index.js - Changing password for: ' + JSON.stringify(req.body))
  
  // changePassword(oldPassword, newPassword, [cb])
  // Changes a user's password hash and salt, resets the user's number of failed password attempts 
  // and saves the user object (everything only if oldPassword is correct). 
  //If no callback cb is provided a Promise is returned. 
  //If oldPassword does not match the user's old password, an IncorrectPasswordError is passed to cb or the Promise is rejected.

  securityUserListModel.findOne({ username: req.body.username }, (err, user) => {
    if (err) {
      console.error(err)
    } else {
      user.changePassword(req.body.old_password, req.body.new_password, function(err) {
        if (err) {
          if(err.name === 'IncorrectPasswordError'){
            res.json({ success: false, message: 'Incorrect password specified, password not changed. Please try again...' });
          } else {
            res.json({ success: false, message: err.name });
          }
        } else {
            // Password successfull changed!
            //return res.status(200).json({message: 'Password reset successful'});
            res.json({ success: true, message: 'Your password has been changed successfully' });
        }
      })
    }
  });   

});

/***************************/
/* Register users - sample */
/***************************/

// Passport.js requires 'username' field to be present (and not anything else like 'user_name')
// Perhaps 'active: false' doesn't work as it is not defined in the user schema?
/*
securityUserListModel.register({username:'Lock_Ying_Lai', active: false}, 'Lock_Ying_Lai');
securityUserListModel.register({username:'Ben_Teh',       active: false}, 'Ben_Teh');
securityUserListModel.register({username:'Jean_Tan',      active: false}, 'Jean_Tan');
securityUserListModel.register({username:'Lenny_Teh',     active: false}, 'Lenny_Teh');
securityUserListModel.register({username:'Caitlin_Teh',   active: false}, 'Caitlin_Teh');
securityUserListModel.register({username:'Keat_Tan',      active: false}, 'Keat_Tan');
securityUserListModel.register({username:'Low_Tzu_Wei',   active: false}, 'Low_Tzu_Wei');
securityUserListModel.register({username:'Cara_Tan',      active: false}, 'Cara_Tan');
securityUserListModel.register({username:'Sara_Tan',      active: false}, 'Sara_Tan');
securityUserListModel.register({username:'Ira_Tan',       active: false}, 'Ira_Tan');
securityUserListModel.register({username:'Jason_Liu',     active: false}, 'Jason_Liu');
securityUserListModel.register({username:'Tan_Wei_Pei',   active: false}, 'Tan_Wei_Pei');
securityUserListModel.register({username:'Keagan_Liu',    active: false}, 'Keagan_Liu');
securityUserListModel.register({username:'Edwin_Ho',      active: false}, 'Edwin_Ho');
securityUserListModel.register({username:'Tan_Wei_Nie',   active: false}, 'Tan_Wei_Nie');
securityUserListModel.register({username:'Natalie_Ho',    active: false}, 'Natalie_Ho');
securityUserListModel.register({username:'Odelya_Ho',     active: false}, 'Odelya_Ho');
*/