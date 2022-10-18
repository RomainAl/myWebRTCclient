// import { io } from "socket.io-client";
const socket = io.connect("https://192.168.1.41:1337");

const roomName = "test";
let rtcPeerConnection;
let currentClientId;

// Contains the stun server URL we will be using.
let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

socket.emit("join", roomName, true);

// Triggered when a room is succesfully created.

socket.on("offer", function (offer, clientId) {
    currentClientId = clientId;
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection
    .createAnswer()
    .then((answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, clientId);
        console.log('answer sent');
    })
    .catch((error) => {
        console.log(error);
    });
  });


// Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.

function OnIceCandidateFunction(event) {
    console.log("Candidate");
    if (event.candidate) {
      socket.emit("candidate", event.candidate, roomName);
    }
  }
  
  // Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.
  
  function OnTrackFunction(event) {
    console.log(event);
    let videos = document.getElementById('videos');
    let video = document.getElementsByName(currentClientId);
    if (video.length == 0){
      video = document.createElement("video");
      video.setAttribute("name", currentClientId)
      videos.appendChild(video);
    }
    video.srcObject = event.streams[0];
    video.onloadedmetadata = function (e) {
        video.play();
    };
  }