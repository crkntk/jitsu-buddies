import { io } from "https://cdn.socket.io/4.8.3/socket.io.esm.min.js";

const URL = "http://localhost:3000";
const socket = io(URL, { autoConnect: true });

socket.onAny((event, ...args) => {
  console.log(event, args);
});

export default socket;