//import L from "leaflet";
//import 'leaflet/dist/leaflet.css';
import * as L from "https://cdn.jsdelivr.net/npm/leaflet@1.8.0/dist/leaflet-src.esm.js"
const key = $("#initmap-script").attr('papKey').toString();
//const key = '5bhyUK4PAmD0Awuvuu5Q';
console.log(key);
console.log("LOADED MAP SCRIPT");
console.log(Number($("#longitude")[0].innerHTML));
const currUserLat = Number($("#latitude")[0].innerHTML);
const curUserLong = Number($("#longitude")[0].innerHTML);
const map = L.map('map', {
    center: L.latLng(currUserLat, curUserLong),
    zoom: 20
});
L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${key}`, {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    crossOrigin: true
}).addTo(map);


var myIcon = L.icon({
    iconUrl: 'my-icon.png',
    iconSize: [38, 95],
    iconAnchor: [22, 94],
    popupAnchor: [-3, -76],
    shadowUrl: 'my-icon-shadow.png',
    shadowSize: [68, 95],
    shadowAnchor: [22, 94]
});


L.marker([currUserLat, curUserLong], {icon: myIcon}).addTo(map);


