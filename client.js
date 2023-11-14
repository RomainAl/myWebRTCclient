let socket;
try {
  //socket = io.connect("https://maman-jk7dceleka-od.a.run.app");
  //socket = io.connect("https://maman2-jk7dceleka-od.a.run.app");
  socket = io.connect("https://mywrtc-ro5o23vkzq-od.a.run.app");
  //socket = io.connect("https://192.168.10.2:1337");
  console.log("lulu ok");
} catch(err){
  alert(err);
}

let userCanvas = document.getElementById("canvas");
let adminVideo = document.getElementById("video");
let atablee = document.getElementById("atablee");

adminVideo.style.display = "none";
navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate; 
let roomName = "atablee";
let rtcPeerConnection;
let receiveChannel;
let sendChannel;
let userCanvasStream = userCanvas.captureStream(0); // BECAUSE ON SAFARI, NEED TO HAVE VIDEO STREAM TO RECEIVE A VIDEO STREAM !
let wakeLock = null;
let noSleep = new NoSleep();
let context;
let analyser;
let source;
let filter;
let device;
let myPeer;
const patchExportURL = "export/patch.export.json";

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

const constraints = {
  audio: {
    sampleRate: 44100,
    sampleSize: 16,
    noiseSuppression: false,
    echoCancellation: false,
    channelCount: 1
},
  video: false,
};

const startButton = document.getElementById( 'startButton' );
startButton.addEventListener( 'click', function () {
  /*if (startButton.innerText == "OK ?"){
    startButton.innerText = "PLAY"
  } else {
    init();
  }*/
  init();
  
} );

function init() {
  const overlay = document.getElementById( 'overlay' );
  overlay.remove();
  requestWakeLock();
  changeFullScreen();
  context = new AudioContext();
  console.log(context);
  myPeer = context.createMediaStreamDestination();
  analyser = context.createAnalyser();
  analyser.minDecibels = -140;
  analyser.maxDecibels = 0;
  /*filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1500, context.currentTime + 1);
  filter.connect(myPeer);*/
  RNBO_Setup().then(()=>{
    socket.emit("join", roomName, false);
  });
};

// Triggered when a room is succesfully created.
socket.on("create", function () {

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
    .getUserMedia(constraints)
    .then(function (stream) {
      /* use the stream */
      source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.connect(device.node);

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log(`Using Audio device: ${audioTracks[0].label}`);
      }
      const streamVisualizer4Clients = new StreamVisualizer4Clients(analyser, canvas, false);
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
      //userStream.getTracks().forEach((track) => rtcPeerConnection.addTrack(track, userStream));
      //rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
      rtcPeerConnection.addTrack(myPeer.stream.getTracks()[0], myPeer.stream);
      rtcPeerConnection.addTrack(userCanvasStream.getTracks()[0], userCanvasStream);
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
  console.log('answer received');
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
  if (!navigator.userAgent.includes('Chrome') && navigator.userAgent.includes('Safari')) {
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
      adminVideo.volume = 0;
      userCanvas.style.display = "initial";
      break;
    case 2:
      userCanvas.style.display = "none";
      adminVideo.style.display = "initial";
      adminVideo.volume = 1;
      adminVideo.play();
      userStream.getTracks().forEach((track) => {track.stop()});
      userCanvasStream.getTracks().forEach((track) => {track.stop()});
      userCanvas.remove();
      break;
    case 3:
      adminVideo.remove();
      break;
    case 4:
      atablee.style.background = "white";
      if (navigator.vibrate){ navigator.vibrate([400, 0, 300, 0, 200, 0, 100].map(function(x) { return (x+200) * Math.random(); })); }
      setTimeout(()=>{atablee.style.background = "black";}, 100);
      break;
    case 5:
      
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
        atablee.style.display = "none";
        ev.currentTarget.close();
        userStream.getTracks().forEach((track) => {track.stop()});
        userCanvasStream.getTracks().forEach((track) => {track.stop()});
        break;
      case "closed":
        console.log("Offline");
        atablee.style.display = "none";
        userStream.getTracks().forEach((track) => {track.stop()});
        userCanvasStream.getTracks().forEach((track) => {track.stop()});
        break;
      case "failed":
        console.log("Error");
        atablee.style.display = "none";
        ev.currentTarget.close();
        userStream.getTracks().forEach((track) => {track.stop()});
        userCanvasStream.getTracks().forEach((track) => {track.stop()});
        break;
      default:
        console.log("Unknown");
        break;
    }
};


const requestWakeLock = async () => {
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      console.log('Wake Lock was released');
    });
    console.log('Wake Lock is active');
  } catch (err) {
    console.log(`${err.name}, ${err.message}`);
    try {
      noSleep.enable();
    } catch (err) {
      alert('Impossible de couper la veille automatiquement !')
    }
  }
};

document.addEventListener("visibilitychange", (event) => {
  if (document.visibilityState === "visible") {
    requestWakeLock();
  }
});

window.addEventListener('dblclick', () =>
{
    changeFullScreen();
})

function changeFullScreen(){
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement
  if(!fullscreenElement)
  {
      if(document.documentElement.requestFullscreen)
      {
        document.documentElement.requestFullscreen()
      }
      else if(document.documentElement.webkitRequestFullscreen)
      {
        document.documentElement.webkitRequestFullscreen()
      }
  }
  else
  {
      if(document.exitFullscreen)
      {
          document.exitFullscreen()
      }
      else if(document.webkitExitFullscreen)
      {
          document.webkitExitFullscreen()
      }
  }
}

async function RNBO_Setup() {
  let response, patcher;
  try {
      response = await fetch(patchExportURL);
      patcher = await response.json();
      console.log(encodeURIComponent(patcher.desc.meta.rnboversion));
      console.log("taaaamere");
      if (!window.RNBO) {
          // Load RNBO script dynamically
          // Note that you can skip this by knowing the RNBO version of your patch
          // beforehand and just include it using a <script> tag
          await loadRNBOScript(patcher.desc.meta.rnboversion);
          console.log("papa");
      }

  } catch (err) {
      const errorContext = {
          error: err
      };
      if (response && (response.status >= 300 || response.status < 200)) {
          errorContext.header = `Couldn't load patcher export bundle`,
          errorContext.description = `Check app.js to see what file it's trying to load. Currently it's` +
          ` trying to load "${patchExportURL}". If that doesn't` + 
          ` match the name of the file you exported from RNBO, modify` + 
          ` patchExportURL in app.js.`;
      }
      if (typeof guardrails === "function") {
          guardrails(errorContext);
      } else {
          throw err;
      }
      return;
  }

  // (Optional) Fetch the dependencies
  let dependencies = [];
  try {
      const dependenciesResponse = await fetch("export/dependencies.json");
      dependencies = await dependenciesResponse.json();

      // Prepend "export" to any file dependenciies
      dependencies = dependencies.map(d => d.file ? Object.assign({}, d, { file: "export/" + d.file }) : d);
  } catch (e) {}

  // Create the device
  try {
      device = await RNBO.createDevice({ context, patcher });
      console.log(RNBO);
      console.log("maman");
  } catch (err) {
      if (typeof guardrails === "function") {
          guardrails({ error: err });
      } else {
          throw err;
      }
      return;
  }

  // (Optional) Load the samples
  if (dependencies.length)
      await device.loadDataBufferDependencies(dependencies);

  // Connect the device to the web audio graph
  device.node.connect(myPeer);
  console.log(device);
  console.log(device.node);
  console.log("petitfrere");

  /*// (Optional) Extract the name and rnbo version of the patcher from the description
  document.getElementById("patcher-title").innerText = (patcher.desc.meta.filename || "Unnamed Patcher") + " (v" + patcher.desc.meta.rnboversion + ")";

  // (Optional) Automatically create sliders for the device parameters
  makeSliders(device);

  // (Optional) Create a form to send messages to RNBO inputs
  makeInportForm(device);

  // (Optional) Attach listeners to outports so you can log messages from the RNBO patcher
  attachOutports(device);

  // (Optional) Load presets, if any
  loadPresets(device, patcher);

  // (Optional) Connect MIDI inputs
  makeMIDIKeyboard(device);

  document.body.onclick = () => {
      context.resume();
  }*/

  // Skip if you're not using guardrails.js
  /*if (typeof guardrails === "function")
      guardrails();*/
}

function loadRNBOScript(version) {
  return new Promise((resolve, reject) => {
      if (/^\d+\.\d+\.\d+-dev$/.test(version)) {
          throw new Error("Patcher exported with a Debug Version!\nPlease specify the correct RNBO version to use in the code.");
      }
      const el = document.createElement("script");
      
      el.src = "https://c74-public.nyc3.digitaloceanspaces.com/rnbo/" + encodeURIComponent(version) + "/rnbo.min.js";
      
      el.onload = resolve;
      el.onerror = function(err) {
          console.log(err);
          reject(new Error("Failed to load rnbo.js v" + version));
      };
      document.body.append(el);
  });
}