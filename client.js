// import { io } from "socket.io-client";

console.log('Hi !');
const socket = io.connect("https://192.168.1.41:1337");
console.log(socket);