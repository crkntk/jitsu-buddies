import * as L from "https://cdn.jsdelivr.net/npm/leaflet@1.8.0/dist/leaflet-src.esm.js"
const key = $("#initmap-script").attr('papKey').toString();

import {map,youMarkerIcon} from '../maps/homepage_map.js';
const currUserLat = Number($("#latitude")[0].innerHTML);
const currUserLong = Number($("#longitude")[0].innerHTML);

$(".nav-bar-opt").toggle(0);


$("#search-button").on("click", async function(){
    let tailwindClasses = 'z-20'
    let mainContent = 'z-0 pointer-events-none blur-sm'
    $('#search-popup').removeClass('hidden').addClass(tailwindClasses);
    $('#main-content').addClass(mainContent);
});
const value = document.querySelector("#dist-value");
const input = document.querySelector("#dist_input");
value.textContent = input.value;
input.addEventListener("input", (event) => {
  value.textContent = event.target.value;
});

$("#search-submit").on("click", async function(){
    
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
    console.log(user);
    let currUserLat = user.lat;
    let curUserLong = user.lon;
    const popContent = createPopupHTML(user);
    console.log(popContent);
    let sizeOfIcon = [20, 20];
    if(user.academy_belt === "black"){
        sizeOfIcon = [25,25]
    }
    var myIcon = L.icon({
        iconUrl: "../../images/belts/" + user.belt + ".png",
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
    let strikingStyles = ""
    console.log(user);
    for (var i = 0; i <user.striking_experience.length; i++){
        strikingStyles = strikingStyles + " " + user.striking_experience[i];
    }
    for (var i = 0; i <user.grappling_experience.length; i++){
        grapplingStyles = grapplingStyles + " " + user.grappling_experience[i];
    }
    let meetPrefrences = "";
    //for (var i = 0; i <user.preferences.meetPrefrences.length; i++){
        //meetPrefrences = meetPrefrences + ", " + user.preferences.meetPrefrences[i];
    //}
    return `<h2> Username: ${user.username} </h2><p> Academy: ${user.academy}</p> <p> Belt: ${user.academy_belt}</p> <p>Weight: ${user.weight}</p> <p>Grappling Styles: ${grapplingStyles}</p> <p>Striking Styles: ${strikingStyles}</p> <p>Meeting Prefrences: ${meetPrefrences}</p> <button class='popUp-meet'>Set Meet</button> `;

}
