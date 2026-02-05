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
await db.connect(); //connect to database
const key = process.env.PMAP_KEY ; //Key for leaflet map in order to use service maptiler API
const LokIQ =  process.env.LOCATIONIQ_TOKEN; ///Key for location service to get Ip addresses based and address given LOCATIONIQ API
const app = express(); //Start express app instance
const port = 3000; //We run on port
//These are services to find lattitude and longitude based on ip address and normal addresses
const ipifyUrl = "https://api.ipify.org?format=json";
const ipapiUrl = "https://ipapi.co/";
const cookieMaxAge = 1000 * 60*60;
//Our middle ware for cookies and encoding
app.use(bodyParser.urlencoded({ extended: true }));


app.use(session({
  secret: process.env.SESSION_SECRET || 'your_super_secret_key', // Use an environment variable in production
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge:cookieMaxAge
  }
}));

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
                    training_preferences, intensity_preferences, academy_belt,grappling_experience,striking_experience,
                    ST_X(location::geometry) AS Longitude, ST_Y(location::geometry) AS latitude FROM users
                    WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, 10000);`

    const values = [req.query.latitude,req.query.longitude]; //Get values from our request parameter
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
    if(await req.isAuthenticated()){
    //render webpage with the papimap key and the location data if the hash passwords match
    //Render our hompage with information retrieved from our database and a san tzue quote
    res.render('homepage.ejs',{
        papKey: key,
        lat: user.latitude,
        lon: user.longitude,
        academyBelt: user.academy_belt,
        sunTzuQuote: get_sanTzuQuote(),
        loggedIn: true
        });
    }
    else{
        //If our password hashes dont match we redirect to the sign in page
        return res.redirect("/login");
    }
    });


app.get('/', async (req,res)=>{
    res.render("main_page.ejs",{
        sunTzuQuote: get_sanTzuQuote()
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

passport.use(new Strategy( async function verify(username, password, cb){

     const text = `SELECT first_name, last_name, user_name, academy_name, weight, bio, pswd_hash,
                    training_preferences, intensity_preferences, academy_belt,
                    ST_X(location::geometry) AS Longitude, ST_Y(location::geometry) AS latitude
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
    const user = selectedUser.rows[0]; //Get the information from our database query
    //Render our hompage with information retrieved from our database and a san tzue quote
    return cb(null, user);
    }
    else{
        //If our password hashes dont match we redirect to the sign in page
        return cb(null,false);
    }

}));

passport.serializeUser( (user,cb)=>{
    cb(null, user);
});

passport.deserializeUser( (user,cb)=>{
    cb(null, user);
});



app.listen(port,'0.0.0.0', function() {
    console.log(`Server is running on port ${port}`);
});

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
