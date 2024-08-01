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
    iconUrl: '/images/ninja-svgrepo-com.svg',
    iconSize: [20, 20],
});


L.marker([currUserLat, curUserLong], {icon: myIcon}).addTo(map);


