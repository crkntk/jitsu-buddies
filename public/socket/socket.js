import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

const URL = "http://localhost:3000";
const scriptTag = document.getElementById("socket-script");
//console.log(scriptTag);
const username = scriptTag.getAttribute("username");
console.log(username);
const socket = io(URL, { autoConnect: false });
socket.auth = { username };
socket.connect();
socket.onAny((event, ...args) => {
  console.log(event, args);
});

export default socket;