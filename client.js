// import { io } from "socket.io-client";
const socket = io.connect("https://192.168.1.41:1337");

let userVideo = document.getElementById("user-video");
let roomName = "test";
let rtcPeerConnection;
let userStream;

// Contains the stun server URL we will be using.
let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

socket.emit("join", roomName, false);

// Triggered when a room is succesfully created.
socket.on("create", function () {
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 },
    })
    .then(function (stream) {
      /* use the stream */
      userStream = stream;
      userVideo.volume = 0
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
    })
    .catch(function (err) {
      /* handle the error */
      alert("Couldn't Access User Media");
      console.log(err);
    })
    .then(function(){
      rtcPeerConnection = new RTCPeerConnection(iceServers);
      rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
      rtcPeerConnection.ontrack = OnTrackFunction;
      rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
      rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
      rtcPeerConnection
        .createOffer()
        .then((offer) => {
          rtcPeerConnection.setLocalDescription(offer);
          socket.emit("offer", offer);
          console.log('offer sent');
        })

        .catch((error) => {
          console.log(error);
        });
    }

    );
});

// Triggered when a room is succesfully joined.

socket.on("joined", function () {
  creator = false;

  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { width: 1280, height: 720 },
    })
    .then(function (stream) {
      /* use the stream */
      userStream = stream;
      divVideoChatLobby.style = "display:none";
      userVideo.volume = 0;
      userVideo.srcObject = stream;
      userVideo.onloadedmetadata = function (e) {
        userVideo.play();
      };
      socket.emit("ready", roomName);
    })
    .catch(function (err) {
      /* handle the error */
      alert("Couldn't Access User Media");
    });
});

// Triggered when a room is full (meaning has 2 people).

socket.on("full", function () {
  alert("Room is Full, Can't Join");
});

// Triggered when a peer has joined the room and ready to communicate.

socket.on("ready", function () {
  if (creator) {
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
    rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
    rtcPeerConnection
      .createOffer()
      .then((offer) => {
        rtcPeerConnection.setLocalDescription(offer);
        socket.emit("offer", offer, roomName);
      })

      .catch((error) => {
        console.log(error);
      });
  }
});

// Triggered on receiving an ice candidate from the peer.

socket.on("candidate", function (candidate) {
  let icecandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(icecandidate);
});


// Triggered on receiving an answer from the person who joined the room.

socket.on("answer", function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
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
  // peerVideo.srcObject = event.streams[0];
  // peerVideo.onloadedmetadata = function (e) {
  //   peerVideo.play();
  // };
}
