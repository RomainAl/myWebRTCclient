const socket = io.connect("https://192.168.1.42:1337");

let adminVideo = document.getElementById("adminVideo");
let adminCanvas = document.getElementById("adminCanvas");
let adminStream;

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

socket.on("create", function () {
  console.log(navigator.mediaDevices.enumerateDevices())
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { deviceId : 'c9fb7a7a57de6db00dca4dfd77278ccecdaacca1458d31e7ee058e46cd986c61',
               width: 1280/2, 
               height: 720/2 },
    })
    .then(function (stream) {
      /* use the stream */
      adminStream = stream;
      adminVideo.volume = 0;
      adminVideo.srcObject = adminStream;
      adminVideo.onloadedmetadata = function (e) {
        adminVideo.play();
      };
      //adminStream.style.display = 'none';
      const streamVisualizer = new StreamVisualizer(stream, adminCanvas, false);
      streamVisualizer.start();

    })
    .catch(function (err) {
      /* handle the error */
      alert("Couldn't Access User Media");
      console.log(err);
    })
});

socket.on("offer", function (offer, clientId) {
    currentClientId = clientId;
    rtcPeerConnection = new RTCPeerConnection(iceServers);
    rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection.setRemoteDescription(offer);
    rtcPeerConnection.addTrack(adminStream.getTracks()[0], adminStream);
    rtcPeerConnection.addTrack(adminStream.getTracks()[1], adminStream);
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
    if (event.track.kind === 'audio'){
      let medias = document.getElementById('medias');
      let video = document.getElementsByName('video'+currentClientId);
      if (video.length == 0){
        video = document.createElement("video");
        video.setAttribute("name", 'video'+currentClientId);
        medias.appendChild(video);
      }
      video.volume = 0;
      video.srcObject = event.streams[0];
      video.onloadedmetadata = function (e) {
          video.play();
      };
      //video.style.display = "none";
    };

    if (event.track.kind === 'audio'){
      let medias = document.getElementById('medias');
      let audio = document.getElementsByName('audio'+currentClientId);
      if (audio.length == 0){
        audio = document.createElement("audio");
        audio.setAttribute("name", 'audio'+currentClientId);
        audio.controls = true;
        audio.autoplay = true;
        medias.appendChild(audio);
      }
      //video.volume = 0;
      if (audio.srcObject !== event.streams[0]) {
        audio.srcObject = event.streams[0];
        console.log('Received remote stream');
      }
      // video.onloadedmetadata = function (e) {
      //     video.play();
      // };
    };

    if (event.track.kind === 'audio'){
      let canvass = document.getElementById('canvass');
      let canvas = document.getElementsByName(currentClientId);
      if (canvas.length == 0){
        canvas = document.createElement("canvas");
        canvas.setAttribute("name", 'canvas'+currentClientId)
        canvass.appendChild(canvas);
      }
      const streamVisualizer = new StreamVisualizer(event.streams[0], canvas, false);
      streamVisualizer.start();
    };

  }