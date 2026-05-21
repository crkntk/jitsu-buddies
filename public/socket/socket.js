import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

const URL = "http://localhost:3000";
const scriptTag = document.getElementById("socket-script");
//console.log(scriptTag);
const username = scriptTag.getAttribute("username");
const friends = scriptTag.getAttribute("friends");
console.log(friends);
const socket = io(URL, { autoConnect: false, query: {friends:friends} }
);
socket.auth = { username };
socket.connect();
socket.onAny((event, ...args) => {
  console.log(event, args);
});

export default socket;