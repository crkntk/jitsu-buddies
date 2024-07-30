import express from 'express'
import axios from 'axios'
import bodyParser from 'body-parser'
import { dirname } from "path";
import { fileURLToPath } from "url";
const app = express();

const port = 3000;
const ipifyUrl = "https://api.ipify.org?format=json";
const ipapiUrl = "https://ipapi.co/"


app.use(bodyParser.urlencoded({ extended: true }));
const __dirname = dirname(fileURLToPath(import.meta.url));
app.use(express.static("public"));



app.get('/', async (req, res) => {
    const ippAdd=  await axios.get(ipifyUrl);
    let location;
    try {
        //console.log(ippAdd);
     location = await axios.get(ipapiUrl + ippAdd.data.ip + "/json/");
    }
    catch (err) {
        console.error("Error fetching location data:", err.message);
        return res.status(500).send("Error fetching location data.");
    }
    res.render('homepage.ejs',{
        locationObj: location.data
    });
});

app.listen(port, function() {
    console.log(`Server is running on port ${port}`);
});