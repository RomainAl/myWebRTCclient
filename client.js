const socket = io.connect("https://192.168.10.2:1337");

let userCanvas = document.getElementById("canvas");
let adminVideo = document.getElementById("video");
let atablee = document.getElementById("atablee");
let fullscreen = document.getElementById("fullscreen");
fullscreen.onclick = toggleFullScreen;

adminVideo.style.display = "none";

let roomName = "atablee";
let rtcPeerConnection;
let receiveChannel;
let sendChannel;
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
  //console.log(navigator.mediaDevices.enumerateDevices());
  if (navigator.wakeLock != undefined){
    navigator.wakeLock.request("screen")
    .then(lock => {
      setTimeout(()=>Lock.release(), 60*60*1000);
    })
    .catch(err => {alert(`WakeLock impossible: ${err.name}`)})
  } else {
    //alert("No WakeLock in this browser !");
    console.log("No WakeLock in this browser !");
  };

  if (navigator.mediaDevices.getUserMedia === undefined) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
  
      // First get ahold of the legacy getUserMedia, if present
      var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
  
      // Some browsers just don't implement it - return a rejected promise with an error
      // to keep a consistent interface
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }
  
      // Otherwise, wrap the call to the old navigator.getUserMedia with a Promise
      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    }
  }

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
      const streamVisualizer4Clients = new StreamVisualizer4Clients(stream, canvas, false);
      streamVisualizer4Clients.start();

    })
    .catch(function (err) {
      /* handle the error */
      alert(`Impossible de prendre le micro: ${err.name}`);
      console.log(err);
    })
    .then(function(){
      rtcPeerConnection = new RTCPeerConnection(iceServers);
      rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
      rtcPeerConnection.ontrack = OnTrackFunction;
      console.log('Adding Local Stream to peer connection');
      rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
      sendChannel = rtcPeerConnection.createDataChannel('mySceneName');
      sendChannel.onopen = onSendChannelStateChange;
      sendChannel.onmessage = onSendChannelMessageCallback;
      sendChannel.onclose = onSendChannelStateChange;
      rtcPeerConnection.ondatachannel = receiveChannelCallback;
      rtcPeerConnection.onconnectionstatechange = webrtcStateChange;
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

// Triggered on receiving an answer from the person who joined the room.
socket.on("answer", function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
});

// Triggered on receiving an ice candidate from the peer.
socket.on("candidate", function (candidate) {
  let icecandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(icecandidate);
});

// Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.
function OnIceCandidateFunction(event) {
  console.log("Candidate");
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}

// Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.
function OnTrackFunction(event) { // TODO : FOR SAFARI ONLY AUDIO !? (BUT IF NO VIDEO FILTER DESYNCH VIDEO/AUDIO ? TO CHECK !)
  console.log(event);
  if (! navigator.userAgent.includes('Chrome') && navigator.userAgent.includes('Safari')) {
    adminVideo.volume = 0;
    adminVideo.srcObject = event.streams[0];
  } else {
    if (event.track.kind === 'video'){
      adminVideo.volume = 0;
      adminVideo.srcObject = event.streams[0];
    };
  }
}

function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveChannelMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveChannelMessageCallback(event) {
  console.log('Received Message : ' + event.data);
  switch (JSON.parse(event.data).scene){
    case 0:
      location.reload();
      break;
    case 1:
      adminVideo.style.display = "none";
      userCanvas.style.display = "initial";
      break;
    case 2:
      userCanvas.style.display = "none";
      userCanvas.remove();
      adminVideo.style.display = "initial";
      adminVideo.volume = 1;
      adminVideo.play();
      //userStream.getTracks().forEach((track) => {track.stop});
      userStream.getAudioTracks()[0].stop();
      break;
    case 3:
      adminVideo.remove();
      break;
    case 4:
      atablee.style.background = "white";
      break;
    case 5:
      atablee.style.background = "black";
      break;
    default :
      console.log("Pas de scene...")
  }
}

function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  console.log(`Receive channel state is: ${readyState}`);
}

function onSendChannelStateChange() {
  const readyState = sendChannel.readyState;
  console.log('Send channel state is: ' + readyState);
}

function onSendChannelMessageCallback(event) {
  console.log('Received Message');
}

function webrtcStateChange(ev){
    switch(ev.currentTarget.connectionState) {
      case "new":
        console.log("New...");
        break;
      case "checking":
        console.log("Connecting…");
        break;
      case "connected":
        console.log("Online");
        break;
      case "disconnected":
        console.log("Disconnecting…");
        ev.currentTarget.close();
        break;
      case "closed":
        console.log("Offline");
        break;
      case "failed":
        console.log("Error");
        ev.currentTarget.close();
        break;
      default:
        console.log("Unknown");
        break;
    }
};

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    toggleFullScreen();
  }
}, false);

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.webkitRequestFullscreen();
    //let myScreenOrientation = window.screen.orientation;
    //myScreenOrientation.lock("portrait-primary");
  } else {
    document.exitFullscreen();
  }
}