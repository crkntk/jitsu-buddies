import * as L from "https://cdn.jsdelivr.net/npm/leaflet@1.8.0/dist/leaflet-src.esm.js"
const key = $("#initmap-script").attr('papKey').toString();
let currUserLat;
let curUserLong;
import {map,youMarkerIcon} from '../maps/homepage_map.js';


$("#search-button").on("click", async function(){
    await $.ajax(
        {
            url: "/searchPartners",
            data: {
                
            },
            success: function(data) {
                console.log(data);
                for(let i=0; i<data.length; i++) {
                    putIconsMap(data[i]);
                }
            },
            error: function(error) {
                console.error("Error fetching USERS:", error)
        }
    }
    )
});
$("#my-location").on("click", function(){
    youMarkerIcon.openPopup();

});





function putIconsMap(user) {
    currUserLat = user.lat;
    curUserLong = user.lon;
    console.log(user);
    let sizeOfIcon = [20, 20];
    if(user.experience.belt === "black"){
        sizeOfIcon = [25,25]
    }
    var myIcon = L.icon({
        iconUrl: "/images/belts/" + user.experience.belt + ".png",
        iconSize: sizeOfIcon,
    });
    

    var markerIcon = L.marker([currUserLat, curUserLong], {icon: myIcon}).addTo(map);
    var popup = L.popup({
    maxWidth: 200,
    minWidth: 100,
    autoClose: false,
    closeButton: true,
    className: 'popup',
    closeOnClick: false,
    autoPan: true
    })
        .setLatLng([currUserLat, curUserLong])
        .setContent('<p>Hello world!<br />This is a nice popup.</p>')
        
        popup.on("click", function (){

            this.openOn(map);

        });
        markerIcon.bindPopup(popup);
}

