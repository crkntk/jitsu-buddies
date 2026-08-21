import express from 'express'
import session from 'express-session'
import fs from 'fs'
import axios from 'axios'
import bodyParser from 'body-parser'
import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import convert from "xml-js";
import sunTzu from "sun-tzu-quotes";
import pg  from "pg";
import bcrypt from "bcrypt";
import multer from "multer";
import sharp from "sharp";
import path from "path"
import passport from "passport"
import { Strategy } from 'passport-local'
import { createServer } from "http"; //Http server for socket io usage so it wont create a new server and socket io is attached
import { Server } from "socket.io"; //Http seerver for socket io
import { createClient } from 'redis'; //Import Redis client object

const saltRounds = 15 //Salt rounds for hashing password
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); //Added object for storage to upload profile picture to database
// Load environment variables from.env file
dotenv.config(); //Load in environment variables
/*
This is to start the client for our database. Currently we use Aiven service to host postgress database
Database can be ran locally the schema is needed. If running locally ssl is not needed.
*/
const db = new pg.Client({
    user: process.env.AIVEN_USERNAME,
    password: process.env.AIVEN_PASSWORD,
    host: process.env.AIVEN_HOST,
    database: process.env.AIVEN_DATABASE,
    port: process.env.AIVEN_PORT,
    ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync("./certificates/db/ca.pem").toString(),
  }
});
const USERLIMIT = 20; //This is to limit the amount of users
await db.connect(); //connect to database
console.log("server connected to db.")
const key = process.env.PMAP_KEY ; //Key for leaflet map in order to use service maptiler API
const LokIQ =  process.env.LOCATIONIQ_TOKEN; ///Key for location service to get Ip addresses based and address given LOCATIONIQ API
const app = express(); //Start express app instance
const httpServer = createServer(app); // initialize http server

const io = new Server(httpServer, {
    connectionStateRecovery: {
        // the backup duration of the sessions and the packets
        maxDisconnectionDuration: 2 * 60 * 1000,
        // whether to skip middlewares upon successful recovery
        skipMiddlewares: true,
  }}); //
const port = 3000; //We run on port
//These are services to find lattitude and longitude based on ip address and normal addresses
const ipifyUrl = "https://api.ipify.org?format=json";
const ipapiUrl = "https://ipapi.co/";
const cookieMaxAge = 1000 * 60*60;

const MESSAGE_BATCH_SIZE = 100;
const MESSAGE_BATCH_TIMEOUT = 25;
//Our redis client object initialization
const RedisClient = createClient();
RedisClient.on('error', err => console.log('Redis Client Error', err)); //Check if theres an error on client creation
//Start redis connection
async function redis_start(){
    await RedisClient.connect(); //connect to redis client on port 6379 locally. Use docker on windows
};
redis_start();



//Our middle ware for cookies and encoding
app.use(bodyParser.urlencoded({ extended: true }));

//Start middle ware session for session persistence
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET || 'your_super_secret_key', // Use an environment variable in production
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: cookieMaxAge //Cookie saving time
  }
});
//Use session middleware
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());
const __dirname = dirname(fileURLToPath(import.meta.url)); //We find our absolute directory name
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static("views/images"));
const locIQAPI = "https://us1.locationiq.com/v1/search?key="; //Set location api url service

app.get('/searchPartners', async (req, res) =>{
    /*This route searches for the closest partners based on distance
        and training prefrences
    */
    //Create query to find partners based on given distance and attributes still needs to change
     const text = `SELECT first_name, last_name, user_name, academy_name, weight, bio,
       training_preferences, intensity_preferences, academy_belt, grappling_experience, striking_experience,
       ST_X(location::geometry) AS longitude,
       ST_Y(location::geometry) AS latitude
        FROM users
        WHERE ST_DWithin(
        location::geography,
        ST_SetSRID(ST_MakePoint($2::double precision, $1::double precision), 4326)::geography,
        $3::double precision
      )
        AND (
            (COALESCE(training_preferences, '{}'::text[]) && $4::text[])
         OR (intensity_preferences = $5)
         OR (COALESCE(grappling_experience, '{}'::text[]) && $6::text[])
          )
        AND academy_belt = ANY($7::text[]);;`
    const distMeters = req.query.data.distance * 1609.32; //Convert distance to meters
    let data = req.query.data;  //Get data to search for partners
    //Put data in array matching query paramters
    const values = [req.query.latitude, req.query.longitude, distMeters, data.trainingPref, data.intensityPref, data.grapplingExp, data.beltFilter]; //Get values from our request parameter
    const usersFoundResp = await db.query(text, values);    //Query our database
    let searchPartners = safe_Conversion(usersFoundResp.rows); //This calls our safe conversion to convert values to variables asked for in front end
    //respond with the partners that were found given certain params
    res.send(searchPartners);


    
});
app.get('/users/:username/home', async (req, res) => {
   /*
        This endpoint returns a hompage for the user that requested it. 
   */
    //We construct a query to get the current user information from our database and their location for the map
    let user = req.user;
    //console.log(user);
    if(await req.isAuthenticated()){
    //render webpage with the papimap key and the location data if the hash passwords match
    //Render our hompage with information retrieved from our database and a san tzue quote
    res.render('homepage.ejs',{
        papKey: key,
        lat: user.latitude,
        lon: user.longitude,
        userInfo: user,
        friends: user.friends,
        academyBelt: user.academy_belt,
        sunTzuQuote: get_sanTzuQuote(),
        loggedIn: true //need to delete this dont need it in the front end. ITS USLESS!!!!
        });
    }
    else{
        //If our password hashes dont match we redirect to the sign in page
        return res.redirect("/login");
    }
    });

app.get('/', async (req,res)=>{
    res.render("main_page.ejs",{
        sunTzuQuote: get_sanTzuQuote(),
        loggedIn: req.user ? true : false,
        userInfo: req.user
    });
})


app.get('/sign', async (req, res) => {
    /*
        This endpoint is for users to sign up for an account
        responding with signup html content
    */
    res.sendFile(__dirname + '/public/sign_up.html');
 });

 
app.get('/login', async (req, res) => {
    /*
        This endpiont is for users to sign in  to their account
    */
   res.sendFile(__dirname + '/public/sign_in.html');
});
app.get('/logout', function(req, res, next){
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

app.post('/login', (req, res, next) => {
    next();
  }, passport.authenticate("local", {
    /*
        This endpiont is for users to sign in  to their account
    */

   failureRedirect: '/login',
   failureMessage: true
}), 
function(req, res) {
    res.redirect('/users/' + req.body.username + "/home");
  }
    );

app.post('/createUser',upload.single('photo'), async (req, res) => {
    /*
        This enpiont is to create a new user with user information like address, triaining prefrences and other expereince
        provided my the front end. A photo from the user is also provided.
    */
    
    const limitQuery = await pool.query('SELECT COUNT(*) FROM users');
    const count = parseInt(limitQuery.rows[0].count);
    if(count > USERLIMIT){
        res.redirect('/');
    }

    let photoBuf = null, photoMime = null; //Buffor for out photo data information transfered
    if (req.file) {
      // validate and optimize We get the file and check what type of image it is
      const allowed = new Set(['image/jpeg','image/png','image/webp']);
      if (!allowed.has(req.file.mimetype)) throw new Error('Unsupported image type');
        //This is to resized our photo and change quality in order to show in the front end
      photoBuf = await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 1024, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      photoMime = 'image/webp';
    }
    let user = req.body; //Get user information from the body to create user in database
    user["photo"] = photoBuf; //Add the photo buffer that is in our proccessed variable 
    let LocIq_Loc; //variable for our location 
    // construct the LokIQ API query URL with the user's address, city, state, and zip code
    
    const Addquery = locIQAPI+LokIQ+ "&q=" +user.address + "%2C%20" + user.city + "%2C%20" + user.state + "%2C%20" + user.zip + "%20&format=json";
    // Calling api to fetch location of latitude and longitude based on address we query locatoniq
    try{
        //Try and query service to get the longitude and latitude using user information address address city and state
    LocIq_Loc = await axios.get(Addquery);
    }
    catch(err){
        //Catch error if we could not get a location from lokIQ SERVICE
        console.error("Error fetching location data from LokIQ:", err.message);
        return res.status(500).send("Error fetching location data from LokIQ.");
    }
    //Get data longitude and latitude from our respond from lokIQ service
    var resultLocIQ = LocIq_Loc.data[0];
    let latitude = (resultLocIQ.lat).toString();
    let longitude = (resultLocIQ.lon).toString();
    //Hash our password provided using bycypt libraray with saltRounds for extra safety
    let pswdHash = await bcrypt.hash(user.password, saltRounds);
    //Create query with the provided infor we have constructed to insert the new user into the database
    const text = `INSERT INTO users(
                first_name, last_name, user_name, academy_name,
                address, city, us_state, zipcode, email, academy_belt, phone, weight, bio, grappling_experience,
                striking_experience,training_preferences, intensity_preferences, pswd_hash,profile_picture, location) 
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING *`
    user["password"] = pswdHash; //Set the created password hash in the array of values to insert to database

    if (user["weight"] == ''){
        //Set weight paramater as default to 0 if it was nto provided
        user["weight"] = 0.0
    }
    let values = Object.values(user); //set object of values constructed and given
    var pointLoc = `POINT(${longitude} ${latitude})`;; // construct point for our Database query since we sue postgis
    values.push(pointLoc); //Push point type for our query
    try{
        //We try to query our database and redirect to sigin page accordingly
        const user = await db.query(text, values); //Query our database with constructed query and balues
        req.login(user, (err) => {
        console.log(err);
        res.status(200).redirect("/"); //Redirect to sign in page
        });
    }catch(err){
        //If there is an error when we query the database we catch it and respond accordingly
        console.log(err);
        return res.status(500).send("Error creating user.");
    }

});
app.post('/user/update',upload.single('photo'), async (req, res) => {

})

passport.use(new Strategy( async function verify(username, password, cb){
  //Middleware for passport strategy needs to query database for user verification. Should be changed to first time only. Check redis if user has logged in in the past hour or so
  console.log("Ran user db verfication")
      const text = `SELECT first_name, last_name, user_name, academy_name, weight, bio, pswd_hash,
                    training_preferences, intensity_preferences, academy_belt, grappling_experience, striking_experience, profile_picture,
                    friends, ST_X(location::geometry) AS Longitude, ST_Y(location::geometry) AS latitude
                    FROM users WHERE user_name = $1`
    const values = [username] //Add the username param to our query for safe quering
    const selectedUser = await db.query(text, values); //query database safely with values and query text
    if(selectedUser.rows.length <= 0){
        //This branch is for is a user was not found or malformed input
        return cb("This user doesn't exist please sign up");
    }
    let providedInfo; //This is for the information provided from our body
    //We need to compare the user password hash from the request to the one in our database for verification
    const providedPswd = password; //Get body password
    const dbHash = selectedUser.rows[0].pswd_hash; //Get the hash that was queried from our database
    const match = await bcrypt.compare(providedPswd, dbHash); //We compare the hashes using bycrypt funciton. Given our salt parameters set correctly
    if(match){
        //render webpage with the papimap key and the location data if the hash passwords match
        delete selectedUser.rows[0].pswd_hash;
        const user = selectedUser.rows[0]; //Get the information from our database query
        //Render our hompage with information retrieved from our database and a san tzue quote
        user["chat"] = [];
        return cb(null, user);
    }
    else{
        //If our password hashes dont match we redirect to the sign in page
        return cb(null,false);
    }

}));

//Serialize user for session using passport and deserialization functions
passport.serializeUser( (user,cb)=>{
    cb(null, user);
});

passport.deserializeUser( (user,cb)=>{
    cb(null, user);
});
//Middle ware for socket io and setting the user data on redis database
io.use(async (socket, next) => {
  //Error if username was not provided
  const username = socket.handshake.auth.username; //get connection username
  if (!username) {
    return next(new Error("invalid username"));
  }
  const friends = socket.handshake.query.friends.split(','); //friends of connection
  const redUserKey = 'users:' + username; //Create user redis query
  //Hashset the user witht the query key and the users data needed to find friends and data
  await RedisClient.hSet(redUserKey,{
    socketId: socket.id,
    username: username,
    friends: JSON.stringify(friends)
});

  socket.username = username; //Attach username to current socket
  socket.friends = friends;   //Attach friends to socket for fast retrieval
  next();
});
//Check that middleware is only used for hanshake
function onlyForHandshake(middleware) {
  return (req, res, next) => {
    const isHandshake = req._query.sid === undefined;
    if (isHandshake) {
      middleware(req, res, next);
    } else {
      next();
    }
  };
}

io.engine.use(onlyForHandshake(sessionMiddleware)); //Override engine behavior on initial hanshake with function
io.engine.use(onlyForHandshake(passport.session())); //Use passport session to use and attach the session to the socket
//Call back for only for hanshake call
io.engine.use(
  onlyForHandshake((req, res, next) => {
    if (req.user) {
      next();
    } else {
      res.writeHead(401);
      res.end();
    }
  }),
);

io.on("connection", async (socket) => {
  //On connection event for socket
  if(socket.recovered){
    //Check if we are in recovery mode for the session
    console.log("state recovered: ");
    console.log(socket.id);
  }
  //Create room attached with user and username data to identify socket to username relationship
  //If this is a new session this will create a new room if a session already is duplicate then the session will join the room
  socket.join(`user:${socket.request.user.user_name}`);
  let connFriends = await getConnFriends(socket);   //Get currently connected friends using the current socket attached with user information
  //We only need the connected friend's username
 connFriends = connFriends.map((socketFriend)=>{
    return socketFriend.username;
 });
 //For each of our connnected friends we emmit that we are connected
 connFriends.forEach((friend) => {
    io.in(`user:${friend}`).emit("user:friend-connected",socket.username);
 })
//If this is not a recovery for the socket
 if(socket.recovered === false){
 socket.emit("user:connected-friends",connFriends);
 }
//Message event
 socket.on("chat message", async (data) => {
  //Get connected friends to check if reciever is online
    console.log("Ran chat message");
    console.log(data);
    let connFriends = await getConnFriends(socket);
    connFriends = connFriends.map((socketFriend)=>{
        return socketFriend.username;
    });
    if(data.recipient in connFriends){ //Check if friend is connected to send the message directly using sockets
        const data = {
            recipientid: data.recipient,
            sender: socket.username,
            message: data.message,
            timestamp: data.timestamp
        }
        socket.to(`user:${data.recipient}`).emit("chat message",socket.username);
        if(conversationID){
            const redisQuery = 'conversation' + conversationID;
            let redisResult = await  RedisClient.hGetAll(usersQuery);
            if(Object.keys(redisResult).length == 0){
                dbQuery = `INSERT INTO conversation() VALUES($1,$2,$3,$4)`;
            }
        }
       const messageQuery = `SELECT 1 FROM messages WHERE (senderid = ($1) AND recipientid = ($2) OR (senderid =  $2 AND recipientid = $1) VALUES ($1,$2) LIMIT 1 RETURNING conversationid`;
        const values = [socket.username, data.recipient]
        try{
          const messageResult = await db.query(messageQuery, values);
        }
        catch(error){
          console.log(error)
        }
        if(messageResult.rows.length == 0){
          dbQuery = `INSERT INTO conversation() VALUES($1,$2,$3,$4)`;
        }
        query = `INSERT INTO messages(recipientid, senderid, content, timestamp) VALUES($1,$2,$3,$4)`;
        values = Object.values(data);
        try{
            const user = await db.query(query, values);
        }
        catch(err){
             //If there is an error when we query the database we catch it and respond accordingly
             //need to emit failed to send message
            console.log(err);
        }
    }
    else{
    //If friend is not connected send message to inbox or cache it to send later
      query = `INSERT INTO messages(recipientid, senderid, content, timestamp) VALUES($1,$2,$3,$4)`;
      values = Object.values(data);
      try{
            const user = await db.query(query, values);
        }
        catch(err){
             //If there is an error when we query the database we catch it and respond accordingly
             //need to emit failed to send message
            console.log(err);
        }
    }

 });
 //When a socket wants to disconnect event
    socket.on("disconnect", async (reason) => {
    // ...
    //Make current user leave the username room. If there are no other sessions in the room then the room will automatically close
    await io.in(`user:${socket.request.user.user_name}`).socketsLeave(`user:${socket.request.user.user_name}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));  //Timeout for socker to session recovery
    const foundSocket = await io.in(`user:${socket.request.user.user_name}`).fetchSockets();  //Check if the session recovered or other session are still online for the current user
    if(foundSocket.length == 0){
      //If now socket to usurname connection was found
        let friendsSockObj = await getConnFriends(socket); //Get connected friends
        //For each connected friend emmit that the current user is disconnecting
        friendsSockObj.forEach(friendObj => {
        socket.to(`user:${friendObj.username}`).emit("user:friend-disconnect",socket.username);
            });
        
        const username = socket.handshake.auth.username;//get connection username
        const redUserKey = 'users:' + username; //Creat username query to query redis hash to delete the disconnected user
        await RedisClient.del([redUserKey]); //Delete the user from redis hash user to user data object
}
    
  });

  
});

async function getConnFriends(socket){
  /*
  This function gets connected friends by querying redis to check friends are online
  socket has a friends attribute array which holds the users friends
  If friends not found in redis used as a cache that means that the friend is not connected
  */
    let connFriends = socket.friends; //Get connected friends
    //Query redis friends by using map 
    connFriends = await Promise.all(connFriends.map(async (friend) =>{
        const usersQuery = 'users:' + friend;
        let friendQuery = await  RedisClient.hGetAll(usersQuery);
        return friendQuery;
        }));
    connFriends = connFriends.filter((friend) => {
        return Object.keys(friend).length !== 0;
        });
    return connFriends;
}

httpServer.listen(3000);

function safe_Conversion(usersArray){
    // TODO: implement safe conversion function for latitude and longitude
    // takes in an array of users and converts to objects with safe data 
    // returns an array of safe user objects
    //We return all the user information that is safe to get back
    return usersArray.map(user => ({
        lat: user.latitude,
        lon: user.longitude,
        grappling_experience: user.grappling_experience,
        striking_experience: user.striking_experience,
        intensity_preferences: user.intensity_preferences,
        training_preferences: user.training_preferences,
        first_name: user.first_name,
        last_name: user.last_name,
        weight: user.weight,
        username: user.user_name,
        belt: user.academy_belt,
        academy: user.academy_name
    }));
}
function get_sanTzuQuote(){
    //This funciton returns a random santzu quote from the library. Needs to be short enough to dispplay
    let quote = sunTzu();
    while(quote.length > 108){
        quote = sunTzu();
    }
    return quote;
}

function validateEmail(email){
    /*
    This functijon validates email for correct strucuture
    */
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  };
