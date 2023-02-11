const socket = io.connect("https://192.168.1.42:1337");

const adminVideo = document.getElementById("adminVideo");
const adminCanvas = document.getElementById("adminCanvas");
const btn_scene1 = document.getElementById('btn_scene1');
const btn_scene2 = document.getElementById('btn_scene2');

btn_scene1.onclick = sendData;
btn_scene2.onclick = sendData;

let sendChannelArray = [];
let sendChannel;
let receiveChannel;
let adminStream;
let userVideo;

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
});

socket.on("offer", function (offer, clientId) {

  console.log(navigator.mediaDevices.enumerateDevices());
  currentClientId = clientId;
  userVideo = document.createElement("video");
  userVideo.setAttribute("name", 'video'+currentClientId);
  userVideo.src = "video1.mp4";
  userVideo.type = "video/mp4";
  userVideo.playsInline = true;
  userVideo.autoplay = true;
  userVideo.loop = true;
  userVideo.controls = true;
  userVideo.muted = true;

  let medias = document.getElementById('medias');
  medias.appendChild(userVideo);

  //userVideo.play();

  adminStream = adminVideo.captureStream();
  const videoTracks = adminStream.getVideoTracks();
  const audioTracks = adminStream.getAudioTracks();
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }

  rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
  rtcPeerConnection.ontrack = OnTrackFunction;
  rtcPeerConnection.setRemoteDescription(offer);
  adminStream.getTracks().forEach((track) => rtcPeerConnection.addTrack(track, adminStream));
  rtcPeerConnection.ondatachannel = receiveChannelCallback;
  rtcPeerConnection.onconnectionstatechange = (ev) => {
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
  rtcPeerConnection
  .createAnswer()
  .then((answer) => {
      rtcPeerConnection.setLocalDescription(answer);
      socket.emit("answer", answer, clientId);
      console.log('answer sent');
      sendChannel = rtcPeerConnection.createDataChannel('mySceneName');
      sendChannel.onopen = onSendChannelStateChange;
      sendChannel.onmessage = onSendChannelMessageCallback;
      sendChannel.onclose = onSendChannelStateChange;
      sendChannelArray.push(sendChannel);
  })
  .catch((error) => {
      console.log(error);
  });

});


// Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.
function OnIceCandidateFunction(event) {
    console.log("Candidate");
    //console.log(event.candidate);
    if (event.candidate) {
      socket.emit("candidate", event.candidate, roomName);
    }
  }
  
// Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.
function OnTrackFunction(event) {

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
function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveChannelMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveChannelMessageCallback(event) {
  console.log('Received Message');
}

function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  console.log(`Receive channel state is: ${readyState}`);
}

function sendData(event) {
  let data = {};
  switch (event.srcElement.id){
    case "btn_scene1":
      data = {"scene": 1};
      adminVideo.volume = 0;
      adminVideo.pause();
      break;
    case "btn_scene2":
      data = {"scene": 2};
      adminVideo.play();
      adminVideo.volume = 1;
      console.log("tamere")
      break;
    default:
      console.log("Error : no scene found !")
  }
  
  for (i = 0; i < sendChannelArray.length; i++){
    if (sendChannelArray[i].readyState === 'open') {
      sendChannelArray[i].send(JSON.stringify(data));
    }
  }
  console.log('Sent Data: ' + data);
}

function onSendChannelStateChange() {
  const readyState = sendChannel.readyState;
  console.log('Send channel state is: ' + readyState);
}

function onSendChannelMessageCallback(event) {
  console.log('Received Message');
}