// import { io } from "socket.io-client";
const socket = io.connect("https://192.168.1.42:1337");

let userVideo = document.getElementById("video");
let userCanvas = document.getElementById("canvas");
let adminVideo = document.getElementById("adminVideo");
let adminCanvas = document.getElementById("adminCanvas");

let roomName = "test";
let rtcPeerConnection;
let userStream;
let adminStream;

// Contains the stun server URL we will be using.
let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

const offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1,
  voiceActivityDetection: false
};

socket.emit("join", roomName, false);

// Triggered when a room is succesfully created.
socket.on("create", function () {
  console.log(navigator.mediaDevices.enumerateDevices())
  //navigator.wakeLock.request("screen").then(lock => {setTimeout(()=>Lock.release(), 10*60*1000)});
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: false,
    })
    .then(function (stream) {
      /* use the stream */
      userStream = stream;
      const audioTracks = userStream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log(`Using Audio device: ${audioTracks[0].label}`);
      }
      userVideo.style.display = 'none';
      const streamVisualizer = new StreamVisualizer(stream, canvas, false);
      streamVisualizer.start();

    })
    .catch(function (err) {
      /* handle the error */
      alert(`getUserMedia() error: ${err.name}`);
      console.log(err);
    })
    .then(function(){
      rtcPeerConnection = new RTCPeerConnection(iceServers);
      rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
      rtcPeerConnection.ontrack = OnTrackFunction;
      //userStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, userStream));
      console.log('Adding Local Stream to peer connection');
      // rtcPeerConnection = new RTCPeerConnection(iceServers);
      // rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
      // rtcPeerConnection.ontrack = OnTrackFunction;
      rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
      //rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
      rtcPeerConnection
        .createOffer(offerOptions)
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
    // Attention need a video to have a sound
    if (event.track.kind === 'video'){
      adminVideo.volume = 0;
      adminVideo.srcObject = event.streams[0];
      adminVideo.onloadedmetadata = function (e) {
        adminVideo.play();
      };
      //adminVideo.style.display = "none";
    };

    if (event.track.kind === 'audio'){
      const streamVisualizer = new StreamVisualizer(event.streams[0], adminCanvas, false);
      streamVisualizer.start();
    };

  }
