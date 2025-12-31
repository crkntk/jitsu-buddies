import * as L from "https://cdn.jsdelivr.net/npm/leaflet@1.8.0/dist/leaflet-src.esm.js"
const key = $("#initmap-script").attr('papKey').toString();

import {map,youMarkerIcon} from '../maps/homepage_map.js';
const currUserLat = Number($("#latitude")[0].innerHTML);
const currUserLong = Number($("#longitude")[0].innerHTML);

$(".nav-bar-opt").toggle(0);
$("#search-button").on("click", async function(){
    await $.ajax(
        {
            url: "/searchPartners",
            data: {
                latitude:currUserLat,
                longitude:currUserLong
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
$(".class-arrow").on("click", function(){
    $(".nav-bar-opt").animate({
        width:'toggle'
    });
});





function putIconsMap(user) {
    currUserLat = user.lat;
    curUserLong = user.lon;
    console.log(user);
    const popContent = createPopupHTML(user);
    console.log(popContent);
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
        .setContent(popContent)
        popup.on("click", function (){

            this.openOn(map);

        });
        markerIcon.bindPopup(popup);
}

function createPopupHTML(user) {
    let grapplingStyles = "";
    for (var i = 0; i <user.experience.otherGrappling.length; i++){
        grapplingStyles = grapplingStyles + " " + user.experience.otherGrappling[i];
    }
    let meetPrefrences = "";
    for (var i = 0; i <user.preferences.meetPrefrences.length; i++){
        meetPrefrences = meetPrefrences + ", " + user.preferences.meetPrefrences[i];
    }
    return `<h2> Username: ${user.username} </h2><p> Academy: ${user.experience.academy}</p> <p> Belt: ${user.experience.belt}</p> <p>Weight: ${user.weight}</p> <p>Grappling Styles: ${grapplingStyles}</p> <p>Meeting Prefrences: ${meetPrefrences}</p> <button class='popUp-meet'>Set Meet</button> `;

}
