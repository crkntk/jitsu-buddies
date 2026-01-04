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
const saltRounds = 15
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
// Load environment variables from.env file
dotenv.config();
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
await db.connect();
const key = process.env.PMAP_KEY ;
const LokIQ =  process.env.LOCATIONIQ_TOKEN;
const app = express();
const port = 3000;
const ipifyUrl = "https://api.ipify.org?format=json";
const ipapiUrl = "https://ipapi.co/"
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'your_super_secret_key', // Use an environment variable in production
  resave: false,
  saveUninitialized: true,
  cookie: { secure: 'auto' } // Use secure cookies in production (requires HTTPS)
}));
const __dirname = dirname(fileURLToPath(import.meta.url));
//app.use(express.static("public"));
app.use(express.static(path.join(__dirname, 'public')));
const locIQAPI = "https://us1.locationiq.com/v1/search?key=";

app.get('/searchPartners', async (req, res) =>{
    //this route searches for the top 10 partners based on algorithm
    // TODO: Implement this endpoint to fetch the top 10 partners based on algorithm
    // and return them in the response
    console.log(req);
     const text = `SELECT first_name, last_name, user_name, academy_name, weight, bio, pswd_hash,
                    training_preferences, intensity_preferences, academy_belt,grappling_experience,striking_experience,
                    ST_X(location::geometry) AS Longitude, ST_Y(location::geometry) AS latitude FROM users
                    WHERE ST_DWithin(location::geography, ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography, 10000);`

    //let searchPartners = safe_Conversion(TempUsers.slice(1));
    const values = [req.query.latitude,req.query.longitude];
    const usersFoundResp = await db.query(text, values);
    //console.log(usersFoundResp.rows);
    let searchPartners = safe_Conversion(usersFoundResp.rows);
    // TODO: This will be a call to database based on preferences and location remember to implement
    //other prefrences filtering will happen before response

    // TODO: Implement sorting based on algorithm
    res.send(searchPartners);


    
});
app.post('/users/:username/home', async (req, res) => {
   
    const text = `SELECT first_name, last_name, user_name, academy_name, weight, bio, pswd_hash,
                    training_preferences, intensity_preferences, academy_belt,
                    ST_X(location::geometry) AS Longitude, ST_Y(location::geometry) AS latitude
                    FROM users WHERE user_name = $1`
    const values = [req.params.username]
    const selectedUser = await db.query(text, values);
    //console.log(selectedUser);
    if(selectedUser.rows.length <= 0){
        return res.status(400).message("This user doesnt exist pleas sign up");
    }
    let providedInfo;
    if(req.body){
       providedInfo = req.body;
    }
    else if (req.session.userData){
        providedInfo = req.session.userData;
    }
    //console.log(req.session);
    const providedPswd = providedInfo.password
    const dbHash = selectedUser.rows[0].pswd_hash
    const match = await bcrypt.compare(providedPswd, dbHash);
    if(match){
    //render webpage with the papimap key and the location data 
    const userInfo = selectedUser.rows[0]
    res.render('homepage.ejs',{
        papKey: key,
        lat: userInfo.latitude,
        lon: userInfo.longitude,
        academyBelt: userInfo.academy_belt,
        sunTzuQuote: get_sanTzuQuote()
        });
    }
    else{
        return res.redirect("/");
    }
    });



app.get('/sign', async (req, res) => {
    console.log("Route was ran");
    res.sendFile(__dirname + '/public/sign_up.html');
 });
app.get('/', async (req, res) => {
   res.sendFile(__dirname + '/public/sign_in.html');
});

app.post('/createUser',upload.single('photo'), async (req, res) => {
    //(Object.keys(req.body));
    let photoBuf = null, photoMime = null;
    if (req.file) {
      // validate and optimize
      const allowed = new Set(['image/jpeg','image/png','image/webp']);
      if (!allowed.has(req.file.mimetype)) throw new Error('Unsupported image type');

      photoBuf = await sharp(req.file.buffer)
        .rotate()
        .resize({ width: 1024, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
      photoMime = 'image/webp';
    }


    let user = req.body;
    user["photo"] = photoBuf;
    let LocIq_Loc;
    // construct the LokIQ API query URL with the user's address, city, state, and zip code
    
    const Addquery = locIQAPI+LokIQ+ "&q=" +user.address + "%2C%20" + user.city + "%2C%20" + user.state + "%2C%20" + user.zip + "%20&format=json";
    // Calling api to fetch location of latitude and longitude based on address we query locatoniq
    try{
    LocIq_Loc = await axios.get(Addquery);
    }
    catch(err){
        console.error("Error fetching location data from LokIQ:", err.message);
        return res.status(500).send("Error fetching location data from LokIQ.");
    }
    var resultLocIQ = LocIq_Loc.data[0];
    let latitude = (resultLocIQ.lat).toString();
    let longitude = (resultLocIQ.lon).toString();
    
    
    let pswdHash = await bcrypt.hash(user.password, saltRounds);
    //var resultLocIQ = LocIq_Loc.data[0];
    const text = `INSERT INTO users(
                first_name, last_name, user_name, academy_name,
                address, city, us_state, zipcode, email, academy_belt, phone, weight, bio, grappling_experience,
                striking_experience,training_preferences, intensity_preferences, pswd_hash,profile_picture, location) 
                VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20) RETURNING id`
    user["password"] = pswdHash
    if (user["weight"] == ''){
        user["weight"] = 0.0
    }
    
    let values = Object.values(user);
    var pointLoc = `POINT(${longitude} ${latitude})`;;
    values.push(pointLoc);
    console.log("RIGHT BEFORE DATABASE")
    try{
        //console.log(user);
        const resDB = await db.query(text, values);
        //console.log(resDB.rows[0])
        res.status(200).redirect("/");
    }catch(err){
        console.log(err);
        return res.status(500).send("Error creating user.");
    }

});



app.listen(port,'0.0.0.0', function() {
    console.log(`Server is running on port ${port}`);
});

function safe_Conversion(usersArray){
    // TODO: implement safe conversion function for latitude and longitude
    // takes in an array of users and converts to objects with safe data 
    // returns an array of safe user objects
    console.log(usersArray);
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
    let quote = sunTzu();
    while(quote.length > 108){
        quote = sunTzu();
    }
    return quote;
}

function validateEmail(email){
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  };
function parseNewUser(request){
//parses request for database

 return {
     username: request.body.username,
     password: request.body.password,
     email: request.body.email,
     //add other fields as needed
 };
};
