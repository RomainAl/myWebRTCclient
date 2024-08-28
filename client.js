if (location.protocol !== 'https:') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
  alert("Go HTTPS !");
}
const socket = io.connect("https://mywebrtcserver-thrumming-resonance-5604.fly.dev/");

let streamVisualizer4Clients;

let userCanvas = document.getElementById("canvas");
userCanvas.width = Math.max(window.innerWidth,window.innerHeight)*2;
userCanvas.height = Math.min(window.innerWidth,window.innerHeight)*2;
let adminVideo = document.getElementById("video");
// let adminVimeo = document.getElementById("vimeo");
adminVideo.style.display = "none";
adminVideo.type="video/webm";
adminVideo.src = `./videos4Client/video${Math.round(Math.random()*20)+1}.webm`;
adminVideo.volume = 0;
let adminVideo_webrtc = document.getElementById("video_webrtc");
adminVideo_webrtc.style.display = "none";
adminVideo_webrtc.volume = 0;
// let vimeo = new Vimeo.Player('vimeo');
let effectsPan = document.getElementById("effects-params");
effectsPan.style.visibility = "hidden";
let myGUI = document.getElementById("GUI");
let atablee = document.getElementById("atablee");
let btn_fullscreen = document.getElementById("btn_fullscreen");
let btn_rec = document.getElementById("btn_rec");
btn_rec.style.background = "transparent";
btn_rec.onclick = recfunction;
let rec = document.getElementById("rec");
let mystop = document.getElementById("stop");
let trash = document.getElementById("trash");
let btn_effects = document.getElementById("btn_effects");
btn_fullscreen.onclick = changeFullScreen;
btn_effects.style.borderColor = "#5c5c5c";
btn_rec.style.borderColor = "#5c5c5c";
btn_effects.onclick = (ev)=>{
  if (effectsPan.style.visibility == "visible"){
    effectsPan.style.visibility = "hidden";
    btn_effects.style.background = "transparent";
  } else {
    effectsPan.style.visibility = "visible";
    btn_effects.style.backgroundColor = "#5c5c5c";
  }
  //context.resume(); // TODO
}
btn_effects.ondblclick = ()=>{
  console.log(rtcPeerConnection.signalingState);
}

// let btn_test = document.getElementById("btn_test");
// let testBool = true;
// btn_test.onclick = testBtn;

//effectsPan.style.visibility = "collapse";

navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate; 
let roomName = "atablee";
let rtcPeerConnection;
let receiveChannel;
let sendChannel;
let userCanvasStream = userCanvas.captureStream(0); // BECAUSE ON SAFARI, NEED TO HAVE VIDEO STREAM TO RECEIVE A VIDEO STREAM !
let wakeLock = null;
let noSleep = new NoSleep();
let AudioContext = window.AudioContext || window.webkitAudioContext;
let context;
let analyser;
let source;
let source_mic;
let gain;
let myPeer;
let timer_rec;
const displayAllEffectsParams = false;
let effects = [
  {
    name: "delay",
    title: "ECHOS",
    device: {},
    div: {},
    activ: false,
    visible: true,
    gain: null,
    userParams: [
    {
      name: "input",
      title: "IN",
      defaultValue: 1.0,
      param: {},
      visible: false,
      type: "bool"
    },
    {
      name: "time",
      title: "TIME",
      defaultValue: 30.0,
      param: {},
      visible: true,
      type: "real"
    }
    ],
  },
  {
    name: "disto",
    title: "DISTORSION",
    device: {},
    div: {},
    activ: false,
    visible: true,
    gain: null,
    userParams: [
      {
        name: "drive",
        title: "DISTO",
        defaultValue: 50.0,
        param: {},
        visible: true,
        type: "real"
      },{
        name: "mix",
        title: "MIX",
        defaultValue: 100.0,
        param: {},
        visible: false,
        type: "real"
      },{
        name: "midfreq",
        title: "MIDFREQ",
        defaultValue: 0.0,
        param: {},
        visible: false,
        type: "real"
      },{
        name: "treble",
        title: "TREBLE",
        defaultValue: 50.0,
        param: {},
        visible: false,
        type: "real"
      },{
        name: "mid",
        title: "MID",
        defaultValue: 100.0,
        param: {},
        visible: false,
        type: "real"
      },{
        name: "bass",
        title: "BASS",
        defaultValue: 50.0,
        param: {},
        visible: false,
        type: "real"
      },
  ],
  },
  {
    name: "downsample",
    title: "DEGRADATION",
    device: {},
    div: {},
    activ: false,
    visible: true,
    gain: null,
    userParams: [
    {
      name: "down-sample",
      title: "DOWN-SAMPLE",
      defaultValue: 10,
      param: {},
      visible: true,
      type: "real"
    }],
  },
  {
    name: "reverb",
    title: "REVERBERATION",
    device: {},
    div: {},
    activ: false,
    visible: true,
    gain: null,
    userParams: [
      {
        name: "decay",
        title: "DECAY",
        defaultValue: null,
        param: {},
        visible: true,
        type: "real"
      },{
        name: "mix",
        title: "MIX",
        defaultValue: 100.0,
        param: {},
        visible: false,
        type: "real"
      },
    ],
  },
  {
     name: "pitchshift",
     title: "HAUTEUR",
     device: {},
     div: {},
     activ: false,
     visible: true,
     gain: null,
     userParams: [
       {
         name: "transp",
         title: "TRANSPOSITION",
         defaultValue: null,
         param: {},
         visible: true,
         type: "real"
       },
       {
         name: "mix",
         title: "MIX",
         defaultValue: 100.0,
         param: {},
         visible: false,
         type: "real"
       },
     ],
   },
  {
    name: "freeze",
    title: "FREEZE (AUTO)",
    device: {},
    div: {},
    activ: false,
    visible: true,
    gain: null,
    userParams: [
      {
        name: "auto",
        title: "AUTO",
        defaultValue: 100.0,
        param: {},
        visible: false,
        type: "bool"
      },
    ],
  },
  // {
  //   name: "filter",
  //   title: "FILTER (HIGH-CUT)",
  //   device: {},
  //   div: {},
  //   activ: false,
  //   visible: true,
  //   gain: null,
  //   userParams: [
  //     {
  //       name: "hi-cut",
  //       title: "hi-cut",
  //       defaultValue: 1200.0,
  //       param: {},
  //       visible: true,
  //       type: "real"
  //     },
  //     {
  //       name: "lo-cut",
  //       title: "lo-cut",
  //       defaultValue: null,
  //       param: {},
  //       visible: true,
  //       type: "real"
  //     }
  //   ]
  // },
  {
    name: "sampler",
    title: "SAMPLER",
    device: {},
    div: {},
    activ: false,
    visible: false,
    gain: null,
    userParams: [
      {
        name: "pitch",
        title: "VITESSE",
        defaultValue: 1.0,
        param: {},
        visible: true,
        type: "real"
      },
      {
        name: "metro_speed",
        title: "LECTURE ALEATOIRE",
        defaultValue: null,
        param: {},
        visible: true,
        type: "real"
      },
      {
        name: "size",
        title: "SIZE",
        defaultValue: 10.0,
        param: {},
        visible: false,
        type: "real"
      }],
  }
];

// Contains the stun server URL we will be using.
let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};
// let iceServers;
// async function create_iceServers() {
//   const response = 
//     await window.fetch("https://ludicke.metered.live/api/v1/turn/credentials?apiKey=5384caa827c45b8e5c34576216e80a7430ce");

//   // Saving the response in the iceServers array
//   iceServers = await response.json();
// }
// create_iceServers();

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
    channelCount: 1,
    autoGainControl: true,
    volume: 1
},
  video: false,
};

const startButton = document.getElementById( 'startButton' );
startButton.addEventListener( 'click', function () {
  init();
} );

function init() {
  requestWakeLock();
  document.getElementById("startButton").classList.add("spinner");
  document.getElementById("startButton").disabled = true;
  //changeFullScreen(); TODO if not leave the button
  context = new AudioContext();
  myPeer = context.createMediaStreamDestination();
  // myPeer = context.destination;
  gain = context.createGain();
  gain.gain.value = 0.1;
  analyser = context.createAnalyser();
  analyser.minDecibels = -50;
  analyser.maxDecibels = 0;
  adminVideo.volume = 0;
  adminVideo.play().then(()=>adminVideo.pause());
  // vimeo.setVolume(1.0);
  console.log("tamre");
  socket.emit("join", roomName, false);
};

// Triggered when a room is succesfully created.
socket.on("create", function () {
  console.log("Socket receive create");
  rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
  rtcPeerConnection.ontrack = OnTrackFunction;
  rtcPeerConnection.addTrack(myPeer.stream.getTracks()[0], myPeer.stream);
  rtcPeerConnection.addTrack(userCanvasStream.getTracks()[0], userCanvasStream);
  console.log('Adding Local Stream to peer connection');
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

socket.on("disconnect", (reason) => {
  console.log('Socket disconnected at ')
  console.log(Date.now());
  console.log(reason);
  document.getElementById("startButton").disabled = true;
});

socket.on("connect", () => {
  document.getElementById("startButton").disabled = false;
  document.getElementById("startButton").classList.remove("spinner");
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
  // if (!navigator.userAgent.includes('Chrome') && navigator.userAgent.includes('Safari')) {
  //   adminVideo.volume = 0;
  //   adminVideo.srcObject = event.streams[0];
  // } else {
  //   if (event.track.kind === 'video'){
  //     adminVideo.volume = 0;
  //     adminVideo.srcObject = event.streams[0];
  //   };
  // }
  if (adminVideo_webrtc.srcObject !== event.streams[0]) {
    adminVideo_webrtc.srcObject = event.streams[0];
  }
  
  // adminVideo.volume = 0;
  // adminVideo.controls = true;
  // adminVideo.loop = true;
  
  // adminVideo.src = `https://192.168.10.2:5502/videos/video${Math.round(Math.random()*20)+1}.webm`;
  // adminVideo.src = `./videos4Client/video${Math.round(Math.random()*20)+1}.webm`;
  // adminVideo.type="video/webm";
  console.log("on TRAAAACKKK");
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
      adminVideo.pause();
      adminVideo_webrtc.style.display = "none";
      adminVideo_webrtc.volume = 0;
      adminVideo_webrtc.pause();
      userCanvas.style.display = "initial";
      myGUI.style.display = "flex";
      break;
    case 20:
      userCanvas.style.display = "none";
      myGUI.style.display = "none";
      adminVideo.style.display = "none";
      //document.getElementById("overlay").remove(); // TODO
      adminVideo_webrtc.style.display = "initial";
      adminVideo_webrtc.volume = 1;
      adminVideo_webrtc.play();
      adminVideo.volume = 0;
      adminVideo.pause();
      myPeer.stream.getTracks().forEach((track) => {track.stop();});
      rtcPeerConnection.getSenders().forEach(t => rtcPeerConnection.removeTrack(t));
      source_mic.getTracks().forEach(function(track) {track.stop();});
      context.close();
      streamVisualizer4Clients.stop();
      break;
    case 21:
      userCanvas.style.display = "none";
      myGUI.style.display = "none";
      adminVideo_webrtc.style.display = "none";
      //document.getElementById("overlay").remove(); // TODO
      adminVideo_webrtc.volume = 0;
      adminVideo_webrtc.pause();
      adminVideo.style.display = "initial";
      adminVideo.volume = 1;
      adminVideo.play();
      myPeer.stream.getTracks().forEach((track) => {track.stop();});
      rtcPeerConnection.getSenders().forEach(t => rtcPeerConnection.removeTrack(t));
      source_mic.getTracks().forEach(function(track) {track.stop();});
      context.close();
      streamVisualizer4Clients.stop();
      break;
    case 3:
      //adminVideo.remove();
      userCanvas.style.display = "none";
      myGUI.style.display = "none";
      adminVideo.style.display = "none";
      adminVideo.pause();
      adminVideo.volume = 0;
      adminVideo_webrtc.style.display = "none";
      adminVideo_webrtc.volume = 1;
      adminVideo_webrtc.play();
      myPeer.stream.getTracks().forEach((track) => {track.stop();});
      rtcPeerConnection.getSenders().forEach(t => rtcPeerConnection.removeTrack(t));
      source_mic.getTracks().forEach(function(track) {track.stop();});
      context.close();
      streamVisualizer4Clients.stop();
      //document.getElementById("overlay").remove(); // TODO
      break;
    case 4:
      setTimeout(()=>{
        atablee.style.background = "white";
      }, 100);
      if (navigator.vibrate){ navigator.vibrate([400, 0, 300, 0, 200, 0, 100].map(function(x) { return (x+200) * Math.random(); })); }
      setTimeout(()=>{atablee.style.background = "black";}, 1000);
      break;
    case 5:
      adminVideo.src = `./videos4Client/video${Math.round(Math.random()*20)+1}.webm`;
      adminVideo.play();
      // vimeo.loadVideo("978281628").then(()=>vimeo.play());
      // vimeo.setCurrentTime(Math.random()*100);
      // vimeo.on('progress', (e)=>console.log(e.percent));
      // vimeo.play();
      break;
    default :
      console.log("No scene...")
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
  console.log('Message sent');
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
        document.getElementById("startButton").classList.remove("spinner");
        document.getElementById("startButton").disabled = false;
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
            source_mic = stream;
            source = context.createMediaStreamSource(source_mic);
            context.suspend();
            document.getElementById("loading-bar").style.display = "initial";
            effects_Setup(effects)
            .then(()=>{
              context.resume();
              nodeConnection("auto");
              btn_effects.disabled = false;
              btn_effects.style.borderColor = "white";
              btn_rec.disabled = false;
              btn_rec.style.borderColor = "white";
              atablee.style.display = "initial";
              userCanvas.style.display = "initial";
              adminVideo.style.display = "none";
              adminVideo.volume = 0;
              adminVideo.pause();
              adminVideo_webrtc.style.display = "none";
              adminVideo_webrtc.volume = 0;
              adminVideo_webrtc.pause();
              myGUI.style.display = "flex";
              document.getElementById("loading-bar").style.display = "none";
            })
            .catch(function (err) {
              context.resume();
              console.log(`${err.name}, ${err.message}`);
              alert('Sorry, impossible for this smartphone to access sound effects !');
              source.connect(analyser);
              atablee.style.display = "initial";
              userCanvas.style.display = "initial";
              adminVideo.style.display = "none";
              adminVideo.volume = 0;
              adminVideo.pause();
              adminVideo_webrtc.style.display = "none";
              adminVideo_webrtc.volume = 0;
              adminVideo_webrtc.pause();
              myGUI.style.display = "flex";
              document.getElementById("loading-bar").style.display = "none";
            })
      
            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length > 0) {
              console.log(`Using Audio device: ${audioTracks[0].label}`);
            }
            streamVisualizer4Clients = new StreamVisualizer4Clients(analyser, canvas);
            streamVisualizer4Clients.start();
            document.getElementById( 'overlay' ).style.visibility = "hidden";
          })
          .catch(function (err) {
            document.getElementById( 'titles' ).display = "none";
            document.getElementById( 'err' ).style.display = "inline-block";
            document.getElementById( 'microon' ).style.display = "none";
            document.getElementById( 'microoff' ).style.display = "inline-block";
            console.log(err);
          })
        break;
      case "disconnected":
        console.log("Disconnecting…");
        document.getElementById( 'overlay' ).style.visibility = "visible";
        atablee.style.display = "none";
        myGUI.style.display = "none";
        adminVideo.pause();
        adminVideo.volume = 0;
        try{myPeer.stream.getTracks().forEach((track) => {track.stop()});}catch(e){console.log(e)};
        try{userCanvasStream.getTracks().forEach((track) => {track.stop()});}catch(e){console.log(e)};
        try{ev.currentTarget.close();}catch(e){console.log(e)};
        try{source_mic.getTracks().forEach(function(track) {track.stop();});}catch(e){console.log(e)};
        try{context.close();}catch(e){console.log(e)};
        try{streamVisualizer4Clients.stop();}catch(e){console.log(e)};
        break;
      case "closed":
        console.log("Offline");
        document.getElementById( 'overlay' ).style.visibility = "visible";
        atablee.style.display = "none";
        myGUI.style.display = "none";
        adminVideo.pause();
        adminVideo.volume = 0;
        try{myPeer.stream.getTracks().forEach((track) => {track.stop()});}catch(e){console.log(e)};
        try{userCanvasStream.getTracks().forEach((track) => {track.stop()});}catch(e){console.log(e)};
        try{ev.currentTarget.close();}catch(e){console.log(e)};
        try{source_mic.getTracks().forEach(function(track) {track.stop();});}catch(e){console.log(e)};
        try{context.close();}catch(e){console.log(e)};
        try{streamVisualizer4Clients.stop();}catch(e){console.log(e)};
        break;
      case "failed":
        console.log("Error");
        document.getElementById( 'overlay' ).style.visibility = "visible";
        atablee.style.display = "none";
        myGUI.style.display = "none";
        adminVideo.pause();
        adminVideo.volume = 0;
        try{myPeer.stream.getTracks().forEach((track) => {track.stop()});}catch(e){console.log(e)};
        try{userCanvasStream.getTracks().forEach((track) => {track.stop()});}catch(e){console.log(e)};
        try{ev.currentTarget.close();}catch(e){console.log(e)};
        try{source_mic.getTracks().forEach(function(track) {track.stop();});}catch(e){console.log(e)};
        try{context.close();}catch(e){console.log(e)};
        document.getElementById("startButton").classList.remove("spinner");
        document.getElementById("wifi").classList.add("alert");
        try{streamVisualizer4Clients.stop();}catch(e){console.log(e)};
        break;
      default:
        document.getElementById( 'overlay' ).style.visibility = "visible";
        atablee.style.display = "none";
        myGUI.style.display = "none";
        adminVideo.pause();
        adminVideo.volume = 0;
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

  try{
    if (document.visibilityState === "visible") {
      context.resume();
    } else {
      context.suspend();
    }
  } catch (err){
    console.log(err);
  }
  if (document.visibilityState === "visible") {
    requestWakeLock();
  } else {
    btn_fullscreen.style.backgroundColor = "transparent";
    document.getElementById("fs1").style.display = 'inline-block';
    document.getElementById("fs2").style.display = 'none';
  }
});

function changeFullScreen(){
  const fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
  if(!fullscreenElement)
  {
      if(document.documentElement.requestFullscreen)
      {
        document.documentElement.requestFullscreen();
        btn_fullscreen.style.backgroundColor = "#5c5c5c";
        document.getElementById("fs2").style.display = 'inline-block';
        document.getElementById("fs1").style.display = 'none';
      }
      else if(document.documentElement.webkitRequestFullscreen)
      {
        document.documentElement.webkitRequestFullscreen();
        btn_fullscreen.style.backgroundColor = "#5c5c5c";
        document.getElementById("fs2").style.display = 'inline-block';
        document.getElementById("fs1").style.display = 'none';
      }
  }
  else
  {
      if(document.exitFullscreen)
      {
          document.exitFullscreen();
          btn_fullscreen.style.backgroundColor = "transparent";
          document.getElementById("fs1").style.display = 'inline-block';
          document.getElementById("fs2").style.display = 'none';
      }
      else if(document.webkitExitFullscreen)
      {
          document.webkitExitFullscreen();
          btn_fullscreen.style.backgroundColor = "transparent";
          document.getElementById("fs1").style.display = 'inline-block';
          document.getElementById("fs2").style.display = 'none';
      }
  }
}

async function effects_Setup(effects) {
  let response, patcher;
  for (i=0; i<effects.length;i++){
    if (window.matchMedia("(orientation: portrait)").matches){
      document.getElementById("loading-bar").style.transform = `scaleY(${(i+1)/effects.length})`;
    }  else {
      document.getElementById("loading-bar").style.transform = `scaleX(${(i+1)/effects.length})`;
    }
    try {
        response = await fetch("./effects/" + effects[i].name + ".export.json");
        patcher = await response.json();
        //if (!window.RNBO) {
            // Load RNBO script dynamically
            // Note that you can skip this by knowing the RNBO version of your patch
            // beforehand and just include it using a <script> tag
            await loadRNBOScript(patcher.desc.meta.rnboversion);
        //}

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
  
    // Create the device
    try {
        effects[i].device = await RNBO.createDevice({ context, patcher });
    } catch (err) {
        alert(err);
    }

    effects[i].gain = context.createGain();
    // Connect the device to the web audio graph
    effects[i].device.node.connect(effects[i].gain);

    if (effects[i].visible){
      makeGUI(effects[i].device, effects[i].userParams, effects[i].title, effects[i].activ);
    } else if (effects[i].name == "sampler"){
      makeSamplerGUI(effects[i].device, effects[i].userParams, effects[i].title, effects[i].activ);
    }

  };
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

function makeGUI(device, userParams, effect_title, effect_activ) {
  let effect_div = document.createElement("div");
  effect_div.setAttribute("class", "effect_div")
  let pdiv = document.getElementById("effects-params");
  pdiv.appendChild(effect_div);
  // This will allow us to ignore parameter update events while dragging the slider.
  let isDraggingSlider = false;
  let uiElements = {};
  
  // ON/OFF BOUTON :
  //param_input.value = 1.0;
  let sliderContainer = document.createElement("div");

  let label = document.createElement("label");
  let input = document.createElement("input");
  let div = document.createElement("div");
  let span = document.createElement("span");
  label.setAttribute("class", "toggle");
  input.setAttribute("class", "toggle-checkbox");
  input.setAttribute("type", "checkbox");
  div.setAttribute("class", "toggle-switch");
  span.setAttribute("class", "toggle-label");
  span.textContent = effect_title;
  label.appendChild(input);
  label.appendChild(div);
  label.appendChild(span);
  input.setAttribute("id", effect_title);
  input.checked = effect_activ;
  input.onchange = onoffEffect;
  sliderContainer.appendChild(label);

  effect_div.appendChild(sliderContainer);

  userParams.forEach((userParam)=>{
    let param = device.parameters.find(t=>t.name==userParam.name);
    if (userParam.defaultValue!==null){
      param.value = userParam.defaultValue;
    } else {
      userParam.defaultValue = param.value;
    };
    if (userParam.visible){
      // PARAMS :
      let paramGUI = createParamGUI(param, effect_title, userParam.type, effect_activ);
      
      // Store the slider and text by name so we can access them later
      let slider = paramGUI.slider;
      uiElements[param.id] = { slider };
      
      // Add the slider element
      effect_div.appendChild(paramGUI.sliderContainer);
    };
  });

  // Listen to parameter changes from the device
  autoChangeGUI(device, isDraggingSlider, uiElements);
}

function makeSamplerGUI(device, userParams, effect_title, effect_activ) {
  let effect_div = document.createElement("div");
  effect_div.setAttribute("class", "effect_div");
  effect_div.setAttribute("id", "sampler_div");
  effect_div.style.display = "none";
  let pdiv = document.getElementById("effects-params");
  pdiv.appendChild(effect_div);
  // This will allow us to ignore parameter update events while dragging the slider.
  let isDraggingSlider = false;
  let uiElements = {};

  userParams.forEach((userParam)=>{
    let param = device.parameters.find(t=>t.name==userParam.name);
    if (userParam.defaultValue!==null){
      param.value = userParam.defaultValue;
    } else {
      userParam.defaultValue = param.value;
    };

    if (userParam.visible){
      let sliderContainer = document.createElement("div");

      let label = document.createElement("label");
      let input = document.createElement("input");
      let div = document.createElement("div");
      let span = document.createElement("span");
      label.setAttribute("class", "toggle");
      input.setAttribute("class", "toggle-checkbox");
      input.setAttribute("type", "checkbox");
      div.setAttribute("class", "toggle-switch");
      span.setAttribute("class", "toggle-label");
      span.textContent = userParam.title;
      label.appendChild(input);
      label.appendChild(div);
      label.appendChild(span);
      input.setAttribute("id", userParam.name);
      input.checked = effect_activ;
      input.onchange = onoffSampler;
      sliderContainer.appendChild(label);
    
      effect_div.appendChild(sliderContainer);

      if (userParam.type !== "bool"){
        // PARAMS :
        let paramGUI = createParamGUI(param, param.name, userParam.type, effect_activ);
        // Store the slider and text by name so we can access them later
        let slider = paramGUI.slider;
        uiElements[param.id] = { slider };
        // Add the slider element
        effect_div.appendChild(paramGUI.sliderContainer);
      }
    };
  });
  // Listen to parameter changes from the device
  autoChangeGUI(device, isDraggingSlider, uiElements);

}


function createParamGUI(param, effect_title, type, activ){
  let sliderContainer = document.createElement("div");
  sliderContainer.setAttribute("name", effect_title + "div");
  sliderContainer.setAttribute("class", "div_slider");
  if (activ){
    sliderContainer.style.display = "flex";
  } else {
    sliderContainer.style.display = "none";
  };
  let label = document.createElement("label");
  let slider = document.createElement("input");
  sliderContainer.appendChild(slider);
  // Add a name for the label
  label.setAttribute("name", param.name);
  label.setAttribute("for", param.name);
  label.setAttribute("class", "param-label");
  label.textContent = `${param.name}`;

  if (type == "bool"){

    slider.setAttribute("type", "checkbox");
    slider.setAttribute("class", "param-checkbox");
    slider.setAttribute("id", param.id);
    slider.setAttribute("name", param.name);
    slider.checked = (param.value = param.max) ? true : false;
    slider.addEventListener("change", () => {
      param.value = (slider.checked) ? param.max : param.min;
    });

  } else {

    // Make each slider reflect its parameter
    slider.setAttribute("type", "range");
    slider.setAttribute("class", "param-slider");
    slider.setAttribute("id", param.id);
    slider.setAttribute("name", param.name);
    slider.setAttribute("min", param.min);
    slider.setAttribute("max", param.max);
    if (param.steps > 1) {
        slider.setAttribute("step", (param.max - param.min) / (param.steps - 1));
    } else {
        slider.setAttribute("step", (param.max - param.min) / 1000.0);
    }
    slider.setAttribute("value", param.value);

    // Make each slider control its parameter
    slider.addEventListener("pointerdown", () => {
        isDraggingSlider = true;
    });
    slider.addEventListener("pointerup", () => {
        isDraggingSlider = false;
        slider.value = param.value;
    });
    slider.addEventListener("input", () => {
        let value = Number.parseFloat(slider.value);
        param.value = value;
      });

  }
  return {sliderContainer, slider};
}

function testBtn(ev){
}

function onoffEffect(ev){
   effects.find(t=>t.title===ev.target.id).activ = ev.target.checked;
   if (!ev.target.checked){
    // TODO INITIALISATION
   }
   nodeConnection("auto");
   const divs = document.getElementsByName(ev.target.id+"div");
   divs.forEach((div) => {
    div.style.display = (ev.target.checked) ? "flex" : "none";
   })
}

function onoffSampler(ev){
  switch (ev.target.id){
    case "metro_speed":
      let sampler = effects.find(t=>t.name == "sampler");
      if (!ev.target.checked){
        sampler.device.parameters.find(param=>param.name=="rand_play").value = 1.0;
        sampler.device.parameters.find(param=>param.name=="loop_start_point").value = 1.0;
        setTimeout(()=>{
          sampler.device.parameters.find(param=>param.name=="loop_start_point").value = 0.0;
        }, 100.0);
      } else {
        sampler.device.parameters.find(param=>param.name=="rand_play").value = 0.0;
      }
      break;
    default:
      if (!ev.target.checked){
        let sampler = effects.find(t=>t.name == "sampler")
        sampler.device.parameters.find(t=>t.name == ev.target.id).value = sampler.userParams.find(t=>t.name == ev.target.id).defaultValue;
      }
      break;
  }
  const divs = document.getElementsByName(ev.target.id+"div");
  divs.forEach((div) => {
   div.style.display = (ev.target.checked) ? "flex" : "none";
  })
}

function autoChangeGUI(device, isDraggingSlider, uiElements){
  device.parameterChangeEvent.subscribe(param => {
    if (!isDraggingSlider){
      try{
          uiElements[param.id].slider.value = param.value;
      } catch (err){
        // TODO
      }
    }
  });
}

function nodeConnection(mode){ // TODO
  source.disconnect(0);
  analyser.disconnect(0);
  effects.filter(t=>t.activ==false).forEach((effect)=>{effect.gain.disconnect()});
  let f_effects = effects.filter(t=>t.activ==true);
  if (f_effects.length == 0){
    source.connect(analyser);
  } else if (f_effects.length == 1){
    f_effects[0].gain.connect(analyser);
    source.connect(f_effects[0].device.node);
  } else {
    f_effects[0].gain.connect(analyser);
    for (i = 1; i < f_effects.length; i++){
      f_effects[i].gain.connect(f_effects[i-1].device.node);
    }
    source.connect(f_effects[f_effects.length-1].device.node);
  };
  analyser.connect(myPeer);
}

let recTimeCount = 0;
function recfunction(ev){
  let sampler = effects.find(t=>t.name == "sampler");
  if ((btn_rec.style.backgroundColor == "transparent") && (recTimeCount==0)){
    streamVisualizer4Clients.setColor("red");
    recTimeCount = Date.now();
    btn_rec.style.backgroundColor = "#FF0000";
    effectsPan.style.visibility = "hidden";
    btn_effects.style.background = "transparent";
    sampler.activ = true;
    sampler.device.parameters.find(param=>param.name=="size").value = sampler.userParams.find(t=>t.name == "size").defaultValue;
    sampler.device.parameters.find(param=>param.name=="clear_buf").value = 1.0;
    sampler.device.parameters.find(param=>param.name=="rec").value = 1.0;
    document.getElementById("sampler_div").style.display = "flex";
    rec.style.display = "none";
    trash.style.display = "none";
    mystop.style.display = "inline";
    source.disconnect(0);
    analyser.disconnect(0);
    effects.forEach((effect)=>{effect.gain.disconnect()});
    source.connect(analyser);
    analyser.connect(sampler.device.node);
    sampler.gain.connect(myPeer);


    timer_rec = setTimeout(()=>{
      streamVisualizer4Clients.setColor("white");
      sampler.device.parameters.find(param=>param.name=="rand_play").value = 1.0;
      sampler.device.parameters.find(param=>param.name=="out_gain").value = 1.0;
      sampler.device.parameters.find(param=>param.name=="loop_start_point").value = 0.0;
      sampler.device.parameters.find(param=>param.name=="rec").value = 0.0;
      btn_rec.style.backgroundColor = "#5c5c5c";
      rec.style.display = "none";
      trash.style.display = "inline";
      mystop.style.display = "none";
      recTimeCount = 0;
      document.getElementById("metro_speed").checked = false;
      const divs = document.getElementsByName("metro_speeddiv");
      divs.forEach((div) => {
       div.style.display = "none";
      });
      nodeConnection("auto");
    }, sampler.device.parameters.find(param=>param.name=="size").value * 1000.0);
  } else if (recTimeCount != 0){
    streamVisualizer4Clients.setColor("white");
    rec.style.display = "none";
    trash.style.display = "inline";
    mystop.style.display = "none";
    clearTimeout(timer_rec);
    sampler.device.parameters.find(param=>param.name=="size").value = Math.floor((Date.now()-recTimeCount)/1000);
    setTimeout(()=>{
      sampler.device.parameters.find(param=>param.name=="rand_play").value = 1.0;
      sampler.device.parameters.find(param=>param.name=="out_gain").value = 1.0;
      sampler.device.parameters.find(param=>param.name=="loop_start_point").value = 0.0;
      sampler.device.parameters.find(param=>param.name=="rec").value = 0.0;
      btn_rec.style.backgroundColor = "#5c5c5c";
      rec.style.display = "none";
      trash.style.display = "inline";
      mystop.style.display = "none";
      recTimeCount = 0;
      document.getElementById("metro_speed").checked = false;
      const divs = document.getElementsByName("metro_speeddiv");
      divs.forEach((div) => {
       div.style.display = "none";
      });
      nodeConnection("auto");
    }, 100.0);
  } else {
    streamVisualizer4Clients.setColor("white");
    recTimeCount = 0;
    clearTimeout(timer_rec);
    rec.style.display = "inline";
    trash.style.display = "none";
    mystop.style.display = "none";
    document.getElementById("sampler_div").style.display = "none";
    sampler.activ = false;
    sampler.device.parameters.find(param=>param.name=="rec").value = 0.0;
    sampler.device.parameters.find(param=>param.name=="clear_buf").value = 1.0;
    sampler.device.parameters.find(param=>param.name=="out_gain").value = 0.0;
    //sampler.device.parameters.find(param=>param.name=="rand_play").value = 0.0;
    sampler.device.parameters.find(param=>param.name=="loop_start_point").value = 0.0;
    sampler.device.parameters.find(param=>param.name=="clear_buf").value = 1.0;
    btn_rec.style.background = "transparent";

    document.getElementById("metro_speed").checked = false;
    const divs = document.getElementsByName("metro_speeddiv");
    divs.forEach((div) => {
     div.style.display = "none";
    });
    nodeConnection("auto");
  }
  sampler.device.parameters.find(param=>param.name=="loop_start_point").value = 1.0;
  //nodeConnection("auto");
}
