//import L from "leaflet";
//import 'leaflet/dist/leaflet.css';
import * as L from "https://cdn.jsdelivr.net/npm/leaflet@1.8.0/dist/leaflet-src.esm.js"
const key = $("#initmap-script").attr('papKey').toString();
//const key = '5bhyUK4PAmD0Awuvuu5Q';
//aquire longitude and latitude data
const currUserLat = Number($("#latitude")[0].innerHTML);
const curUserLong = Number($("#longitude")[0].innerHTML);
// create map object in order display map
const map = L.map('map', {
    center: L.latLng(currUserLat, curUserLong),
    zoom: 14
});
L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`, {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    crossOrigin: true
}).addTo(map);


var myIcon = L.icon({
    iconUrl: '/images/belts/blue.png',
    iconSize: [25, 25],
});


var youMarkerIcon = L.marker([currUserLat, curUserLong], {icon: myIcon,title:'YOU',alt:'YOUT'}).addTo(map);
var popup = L.popup({
  maxWidth: 50,
  minWidth: 25,
  autoClose: false,
  closeButton: true,
  className: 'popup',
  closeOnClick: false,
  autoPan: true
})
    .setLatLng([currUserLat, curUserLong])
    .setContent('<p style="{text-align:center}">You<br /></p>')
    popup.on("click", function (){

        this.openOn(map);

    });
    youMarkerIcon.bindPopup(popup).openPopup();

export {map, youMarkerIcon};
