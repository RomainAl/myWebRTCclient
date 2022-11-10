const socket = io.connect("https://192.168.1.41:1337");

const roomName = "test";
let rtcPeerConnection;
let currentClientId;

let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

socket.emit("join", roomName, true);

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
    // Attention need a video to have a sound
    if (event.track.kind === 'video'){
      let videos = document.getElementById('videos');
      let video = document.getElementsByName('video'+currentClientId);
      if (video.length == 0){
        video = document.createElement("video");
        video.setAttribute("name", 'video'+currentClientId);
        videos.appendChild(video);
      }
      video.volume = 0;
      video.srcObject = event.streams[0];
      video.onloadedmetadata = function (e) {
          video.play();
      };
      video.style.display = "none";
    };

    if (event.track.kind === 'audio'){
      let canvass = document.getElementById('canvass');
      let canvas = document.getElementsByName(currentClientId);
      if (canvas.length == 0){
        canvas = document.createElement("canvas");
        canvas.setAttribute("name", 'canvas'+currentClientId)
        canvass.appendChild(canvas);
      }
      const streamVisualizer = new StreamVisualizer(event.streams[0], canvas);
      streamVisualizer.start();
    };

  }