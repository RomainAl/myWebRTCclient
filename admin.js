const socket = io.connect("https://192.168.1.42:1337");

const adminVideo = document.getElementById("adminVideo");
const adminCanvas = document.getElementById("adminCanvas");
const sendButton = document.getElementById('sendButton');

sendButton.onclick = sendData;
let sendChannelArray = [];
let sendChannel;
let receiveChannel;
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
  //console.log(navigator.mediaDevices.enumerateDevices())
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: { deviceId : 'ef5f9be1a1a18793ff79da05470b34940cedbda7bae081e6132994d1e851870a',
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
    })
    .catch((error) => {
        console.log(error);
    });
    sendChannel = rtcPeerConnection.createDataChannel('mySceneName');
    sendChannel.onopen = onSendChannelStateChange;
    sendChannel.onmessage = onSendChannelMessageCallback;
    sendChannel.onclose = onSendChannelStateChange;
    sendChannelArray.push(sendChannel);
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
    console.log(event.currentTarget);
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

  function sendData() {
    const data = "test";
    console.log(sendChannelArray);
    for (i = 0; i < sendChannelArray.length; i++){
      if (sendChannelArray[i].readyState === 'open') {
        sendChannelArray[i].send(data);
      }
    }
    console.log('Sent Data: ' + data);
  }
  

  function onSendChannelStateChange() {
    const readyState = sendChannel.readyState;
    console.log('Send channel state is: ' + readyState);
    // if (readyState === 'open') {
    //   dataChannelSend.disabled = false;
    //   dataChannelSend.focus();
    //   sendButton.disabled = false;
    //   closeButton.disabled = false;
    // } else {
    //   dataChannelSend.disabled = true;
    //   sendButton.disabled = true;
    //   closeButton.disabled = true;
    // }
  }
  
  function onSendChannelMessageCallback(event) {
    console.log('Received Message');
  }