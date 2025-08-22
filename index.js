import express from 'express'
import axios from 'axios'
import bodyParser from 'body-parser'
import { dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import convert from "xml-js";
import sunTzu from "sun-tzu-quotes";
import pg  from "pg";
// Load environment variables from.env file
dotenv.config();
const db = new pg.Client({
    username: process.env.DATABASE_PASSWORD ,
    host: 'localhost',
    database: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
});

const key = process.env.PMAP_KEY ;
const LokIQ =  process.env.LOCATIONIQ_TOKEN ;
const app = express();
const port = 3000;
const ipifyUrl = "https://api.ipify.org?format=json";
const ipapiUrl = "https://ipapi.co/"
app.use(bodyParser.urlencoded({ extended: true }));
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static("public"));
const locIQAPI = "https://us1.locationiq.com/v1/search?key=";

app.get('/searchPartners', (req, res) =>{
    //this route searches for the top 10 partners based on algorithm
    // TODO: Implement this endpoint to fetch the top 10 partners based on algorithm
    // and return them in the response


    let searchPartners = safe_Conversion(TempUsers.slice(1)); // TODO: This will be a call to database based on preferences and location remember to implement
    //other prefrences filtering will happen before response

    // TODO: Implement sorting based on algorithm
    res.send(searchPartners);


    
});
app.get('/home', async (req, res) => {
    const currUserTest = TempUsers[0]; //  only for testing
    // Fetch the user's IP address using the IPify API
    const ippAdd=  await axios.get(ipifyUrl);
    let location;
    
    let LocIq_Loc;
    // construct the LokIQ API query URL with the user's address, city, state, and zip code
    const Addquery = locIQAPI+LokIQ+ "&q=" +currUserTest.address + "%2C%20" + currUserTest.city + "%2C%20" + currUserTest.state + "%2C%20" + currUserTest.zip + "%20&format=json";
    // Calling api to fetch location of latitude and longitude based on address we query locatoniq
    try{
    LocIq_Loc = await axios.get(Addquery);
    }
    catch(err){
        console.error("Error fetching location data from LokIQ:", err.message);
        return res.status(500).send("Error fetching location data from LokIQ.");
    }
    var resultLocIQ = LocIq_Loc.data[0];
    //render webpage with the papimap key and the location data 
    res.render('homepage.ejs',{
        papKey: key,
        lat: resultLocIQ.lat,
        lon: resultLocIQ.lon,
        sunTzuQuote: get_sanTzuQuote()
        });
    });
app.get('/sign', async (req, res) => {
    console.log("Route was ran");
    res.sendFile(__dirname + '/public/sign_up.html');
 });
app.get('/', async (req, res) => {
   res.sendFile(__dirname + '/public/sign_in.html');
});
app.post('/createUser', async (req, res) => {
   console.log(req.body);
    let user = req.body;
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
    //var resultLocIQ = LocIq_Loc.data[0];
    //const text = 'INSERT INTO users VALUES'
    var resultLocIQ = LocIq_Loc.data[0];
    console.log(resultLocIQ)
    return LocIq_Loc;

});

app.get('/', async (req, res) => {
    
});

app.listen(port, function() {
    console.log(`Server is running on port ${port}`);
});

function safe_Conversion(usersArray){
    // TODO: implement safe conversion function for latitude and longitude
    // takes in an array of users and converts to objects with safe data 
    // returns an array of safe user objects
    return usersArray.map(user => ({
        lat: user.lat,
        lon: user.lon,
        experience: user.experience,
        preferences: user.preferences,
        name: user.name,
        weight: user.weight,
        username: user.username,
        belt: user.belt
    }));
}
function get_sanTzuQuote(){
    let quote = sunTzu();
    while(quote.length > 108){
        quote = sunTzu();
    }
    return quote;
}

let User1 = {
    address: '23 E. Correll Rd',
    city: 'Heber',
    state: 'CA',
    zip: '92249',
    country: 'USA',
    name: 'John Doe 1',
    username: 'CoolBelt'
}
let User2 = {
    address: '672 Las Villas Street',
    city: 'Imperial',
    state: 'CA',
    zip: '92251',
    country: 'USA',
    name: 'John Doe 2',
    lat: 32.836110,
    lon: -115.586950,
    username: 'CoolBelt2',
    experience:
    {
        belt: "blue",
        academy: "morales jujitsu",
        years: 15,
        certification: "World Jujitsu Champion",
        otherGrappling:["wrestling", "judo"]
    }
    ,
    preferences:
    {
        weightRange: [120,180],
        grapplingStyles: ["judo", "wrestling",'jujitsu'],
        ageRange: [25,35],
        meetPrefrences: ['drill new moves', 'sparr'],
        beltPrefrence:
        {
            white: true,
            blue: true,
            purple: true,
            brown: true,
            black: true
        }
        
    }
    ,
    weight: 150
    ,
    availability: 
    {
        daysOfWeek:
         {
             Monday: true,
             Tuesday: true,
             Wednesday: true,
             Thursday: true,
             Friday: true,
             Saturday: false,
             Sunday: false
         },
        timesOfDay: 
         {
             morning: true,
             afternoon: true,
             evening: true
         },
        maxDistance: 10
    }
}
let User3 = {
    address: '2806 Parkway Street',
    city: 'El Centro',
    state: 'CA',
    zip: '92243',
    country: 'USA',
    name: 'John Doe 2',
    lat: 32.682480,
    lon: -115.634949,
    username: 'CoolBelt3',
    experience:
    {
        belt: "purple",
        academy: "morales jujitsu",
        years: 15,
        certification: "World Jujitsu Champion",
        otherGrappling:["wrestling", "judo"]
    }
    ,
    preferences:
    {
        weightRange: [120,180],
        grapplingStyles: ["judo", "wrestling",'jujitsu'],
        ageRange: [25,35],
        meetPrefrences: ['drill new moves', 'sparr'],
        beltPrefrence:
        {
            white: true,
            blue: true,
            purple: true,
            brown: true,
            black: true
        }
        
    },
    weight: 150,
    availability: 
    {
        daysOfWeek:
         {
             Monday: true,
             Tuesday: true,
             Wednesday: true,
             Thursday: true,
             Friday: true,
             Saturday: false,
             Sunday: false
         },
        timesOfDay: 
         {
             morning: true,
             afternoon: true,
             evening: true
         },
        maxDistance: 10
    }
}
let User4 = {
    address: '853 Parkway Street',
    city: 'El Centro',
    state: 'CA',
    zip: '92243',
    country: 'USA',
    name: 'John Doe 2',
    lat: 32.868767,
    lon: -115.575333,
    username: 'CoolBelt4',
    experience:
    {
        belt: "black",
        academy: "morales jujitsu",
        years: 15,
        certification: "World Jujitsu Champion",
        otherGrappling:["wrestling", "judo"]
    },
    preferences:
    {
        weightRange: [120,180],
        grapplingStyles: ["judo", "wrestling",'jujitsu'],
        ageRange: [25,35],
        meetPrefrences: ['drill new moves', 'sparr'],
        beltPrefrence:
        {
            white: true,
            blue: true,
            purple: true,
            brown: true,
            black: true
        }
        
    },
    weight: 150,
    availability: 
    {
        daysOfWeek:
         {
             Monday: true,
             Tuesday: true,
             Wednesday: true,
             Thursday: true,
             Friday: true,
             Saturday: false,
             Sunday: false
         },
        timesOfDay: 
         {
             morning: true,
             afternoon: true,
             evening: true
         },
        maxDistance: 10
    }
}
const TempUsers = [User1, User2,User3, User4]

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
