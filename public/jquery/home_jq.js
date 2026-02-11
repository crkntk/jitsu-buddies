import * as L from "https://cdn.jsdelivr.net/npm/leaflet@1.8.0/dist/leaflet-src.esm.js"
const key = $("#initmap-script").attr('papKey').toString();

import {map,youMarkerIcon} from '../maps/homepage_map.js';
const currUserLat = Number($("#latitude")[0].innerHTML);
const currUserLong = Number($("#longitude")[0].innerHTML);

$(".nav-bar-opt").toggle(0);


$("#search-button").on("click", async function(){
    let tailwindClasses = 'z-20'
    let transformPopup = 'scale-100 transform skew-0'
    let mainContent = 'z-0 pointer-events-none blur-sm'
    $('#search-popup').removeClass('hidden').addClass(tailwindClasses);
     $('#search-popup').addClass(transformPopup);
    $('#main-content').addClass(mainContent);
});

$("#close-search").on("click", async function(){
    let tailwindClasses = 'z-0 hidden'
    let transformPopup = 'scale-100 transform skew-0'
    let mainContent = 'z-10 pointer-events-auto blur-none'
    $('#search-popup').removeClass('hidden').addClass(tailwindClasses);
     $('#search-popup').addClass(transformPopup);
    $('#main-content').removeClass("blur-sm pointer-events-none").addClass(mainContent);
});

const value = document.querySelector("#dist-value");
const input = document.querySelector("#dist_input");
value.textContent = input.value;

input.addEventListener("input", (event) => {
  value.textContent = event.target.value;
});

//Set default values for search forms
$(document).ready(function (){
const el = document.querySelector('#home-jq');
const grappling_experience =$('#home-jq').attr('grappling_experience');


$('input[name="grapplingExp[]"]').each(function() {
        this.checked = grappling_experience.includes(this.value);
        
    });
const striking_experience =$('#home-jq').attr('striking_experience');
$('input[name="strikingExp[]"]').each(function() {
        this.checked = striking_experience.includes(this.value);
        
    });
const training_preferences =$('#home-jq').attr('training_preferences');
$('input[name="trainingPref[]"]').each(function() {
        this.checked = training_preferences.includes(this.value);
        
    });
const intensity_preferences =$('#home-jq').attr('intensity_preferences');

$('input[name="Intensity"]').each(function() {
        this.checked = intensity_preferences.includes(this.value);
        
    });

});
$("#search-form").on("submit", async function(e){
    e.preventDefault();
    let distance = document.querySelector("#dist_input").value;
    let beltFilter =[];
    $('input[name="beltFilter[]"]:checked').each(function() {
        beltFilter.push($(this).val());
    });
    let grapplingExp = [];
    $('input[name="grapplingExp[]"]:checked').each(function() {
        grapplingExp.push($(this).val());
    });
    let strikingExp =[];
    $('input[name="strikingExp[]"]:checked').each(function() {
        strikingExp.push($(this).val());
    });
    let trainingPref =[];
    $('input[name="trainingPref[]"]:checked').each(function() {
        trainingPref.push($(this).val());
    });
    let intensity = $('input[name="Intensity"]:checked').val();
    let data = {
        latitude:currUserLat,
        longitude:currUserLong,
        distance: distance,
        beltFilter: beltFilter,
        grapplingExp: grapplingExp,
        strikingExp: strikingExp,
        trainingPref: trainingPref
    }
    //console.log(data);
    await $.ajax(
        {
            url: "/searchPartners",
            data: {
                latitude:currUserLat,
                longitude:currUserLong,
                data: data
            },
            success: function(data) {
                console.log(data);
                clearIconsMap();
                for(let i=0; i<data.length; i++) {
                    putIconsMap(data[i]);
                }
                zoomToUsers();
                $('#search-form').reset();
            },
            error: function(error) {
                console.error("Error fetching USERS:", error)
        }
    }
    )
    let tailwindClasses = 'z-0 hidden'
    let transformPopup = 'scale-100 transform skew-0'
    let mainContent = 'z-10 pointer-events-auto blur-none'
    $('#search-popup').removeClass('hidden').addClass(tailwindClasses);
     $('#search-popup').addClass(transformPopup);
    $('#main-content').removeClass("blur-sm pointer-events-none").addClass(mainContent);
});

$("#my-location").on("click", function(){
    youMarkerIcon.openPopup();

});
$(".class-arrow").on("click", function(){
    $(".nav-bar-opt").animate({
        width:'toggle'
    });
});
var markerGroup = L.layerGroup();
markerGroup.addTo(map);

function clearIconsMap(){
    markerGroup.clearLayers();
};

function zoomToUsers(){
   const allLayers = L.featureGroup([markerGroup, youMarkerIcon]);

  const bounds = allLayers.getBounds();
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
  } else {
    // fallback if nothing is there
    map.setView([currUserLat, currUserLong], 13);
  
}}

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
    

    var markerIcon = L.marker([currUserLat, curUserLong], {icon: myIcon}).addTo(markerGroup);
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
