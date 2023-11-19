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
let effectsPan = document.getElementById("effects-params");
effectsPan.style.visibility = "hidden";
let GUI = document.getElementById("GUI");
GUI.style.visibility = "hidden";
let atablee = document.getElementById("atablee");
let btn_fullscreen = document.getElementById("btn_fullscreen");
let btn_rec = document.getElementById("btn_rec");
let btn_effects = document.getElementById("btn_effects");
btn_fullscreen.onclick = changeFullScreen;
btn_effects.onclick = (ev)=>{
  if (effectsPan.style.visibility == "visible"){
    effectsPan.style.visibility = "hidden";
    //ev.target.style.background = "transparent";
  } else {
    effectsPan.style.visibility = "visible";
    //ev.target.style.background = "red";
  }
}
// let btn_test = document.getElementById("btn_test");
// let testBool = true;
// btn_test.onclick = testBtn;

adminVideo.style.display = "none";
//effectsPan.style.visibility = "collapse";

navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate; 
let roomName = "atablee";
let rtcPeerConnection;
let receiveChannel;
let sendChannel;
let userCanvasStream = userCanvas.captureStream(0); // BECAUSE ON SAFARI, NEED TO HAVE VIDEO STREAM TO RECEIVE A VIDEO STREAM !
let wakeLock = null;
let noSleep = new NoSleep();
window.AudioContext = window.AudioContext || window.webkitAudioContext;
let context;
let analyser;
let source;
let filter;
let myPeer;
const displayAllEffectsParams = false;
let effects = [
  {
    name: "delay",
    title: "DELAY",
    device: {},
    div: {},
    activ: false,
    visible: true,
    userParams: [
    {
      name: "input",
      title: "IN",
      defaultValue: 1.0,
      param: {},
      visible: false
    },
    {
      name: "time",
      title: "TIME",
      defaultValue: null,
      param: {},
      visible: true
    }
    ],
  },
  {
    name: "downsample",
    title: "DOWNSAMPLE",
    device: {},
    div: {},
    activ: false,
    visible: true,
    userParams: [
    {
      name: "down-sample",
      title: "DOWN-SAMPLE",
      defaultValue: null,
      param: {},
      visible: true
    }],
  },
  {
    name: "filter",
    title: "FILTER",
    device: {},
    div: {},
    activ: true,
    visible: false,
    userParams: []
  }
];

const delayExportURL = "effects/delay.export.json";
const samplerExportURL = "effects/sampler.export.json";


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
  //changeFullScreen();
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
  socket.emit("join", roomName, false);
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
    
      effects_Setup(effects)
      .then(()=>{
        nodeConnection();
        //effectsPan.style.visibility = "visible";
      })
      .catch(function (err) {
        console.log(`${err.name}, ${err.message}`);
        analyser.connect(myPeer);
        //effectsPan.style.visibility = "collapse";
      })

      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log(`Using Audio device: ${audioTracks[0].label}`);
      }
      const streamVisualizer4Clients = new StreamVisualizer4Clients(analyser, canvas, false);
      streamVisualizer4Clients.start();
      GUI.style.visibility = "visible";

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
      effectsPan.style.visibility = "visible";
      break;
    case 2:
      userCanvas.style.display = "none";
      effectsPan.style.visibility = "collapse";
      adminVideo.style.display = "initial";
      adminVideo.volume = 1;
      adminVideo.play();
      myPeer.stream.getTracks().forEach((track) => {track.stop()});
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
        myPeer.stream.getTracks().forEach((track) => {track.stop()});
        userCanvasStream.getTracks().forEach((track) => {track.stop()});
        break;
      case "closed":
        console.log("Offline");
        atablee.style.display = "none";
        myPeer.stream.getTracks().forEach((track) => {track.stop()});
        userCanvasStream.getTracks().forEach((track) => {track.stop()});
        break;
      case "failed":
        console.log("Error");
        atablee.style.display = "none";
        ev.currentTarget.close();
        myPeer.stream.getTracks().forEach((track) => {track.stop()});
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

async function effects_Setup(effects) {
  let response, patcher;
  for (i=0; i<effects.length;i++){
    try {
        response = await fetch("effects/" + effects[i].name + ".export.json");
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
        const dependenciesResponse = await fetch("effects/dependencies.json");
        dependencies = await dependenciesResponse.json();

        // Prepend "export" to any file dependenciies
        dependencies = dependencies.map(d => d.file ? Object.assign({}, d, { file: "export/" + d.file }) : d);
    } catch (e) {}

    // Create the device
    try {
        effects[i].device = await RNBO.createDevice({ context, patcher });
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
        await effects[i].device.loadDataBufferDependencies(dependencies);

    // Connect the device to the web audio graph
    if (i > 0){
      effects[i].device.node.connect(effects[i-1].device.node);
    } else {
      effects[i].device.node.connect(myPeer);
    }
    
    console.log(effects[i].device);
    console.log(effects[i].device.node);
    console.log("petitfrere");
    if (effects[i].visible){
      makeGUI(effects[i].device, effects[i].userParams, effects[i].title, effects[i].activ);
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
  input.checked - effect_activ;
  input.onchange = onoffEffect;
  sliderContainer.appendChild(label);

  effect_div.appendChild(sliderContainer);

  if (!displayAllEffectsParams){

    userParams.forEach((userParam)=>{
      let param = device.parameters.find(t=>t.name==userParam.name);
      if (userParam.defaultValue!==null){
        param.value = userParam.defaultValue;
      };
      
      if (userParam.visible){
        // PARAMS :
        let label = document.createElement("label");
        let slider = document.createElement("input");
        let sliderContainer = document.createElement("div");
        sliderContainer.appendChild(slider);
        //sliderContainer.appendChild(label);
        sliderContainer.setAttribute("name", effect_title + "div");
        sliderContainer.setAttribute("class", "div_slider");
        sliderContainer.style.display = "none";
        // Add a name for the label
        label.setAttribute("name", param.name);
        label.setAttribute("for", param.name);
        label.setAttribute("class", "param-label");
        label.textContent = `${param.name}`;

        if (param.steps == 2){
          
          slider.setAttribute("type", "checkbox");
          slider.setAttribute("class", "param-checkbox");
          slider.setAttribute("id", param.id);
          slider.setAttribute("name", param.name);
          slider.checked = param.value;
          slider.addEventListener("change", () => {
            param.value = (slider.checked) ? 1.0 : 0.0;
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
        // Store the slider and text by name so we can access them later
        uiElements[param.id] = { slider };

        // Add the slider element
        effect_div.appendChild(sliderContainer);
      };
    });

  } else {
    device.parameters.forEach(param => {
      // Subpatchers also have params. If we want to expose top-level
      // params only, the best way to determine if a parameter is top level
      // or not is to exclude parameters with a '/' in them.
      // You can uncomment the following line if you don't want to include subpatcher params
      
      //if (param.id.includes("/")) return;

      // Create a label, an input slider and a value display
      let label = document.createElement("label");
      let slider = document.createElement("input");
      let text = document.createElement("input");
      let sliderContainer = document.createElement("div");
      sliderContainer.appendChild(label);
      sliderContainer.appendChild(slider);
      sliderContainer.appendChild(text);

      // Add a name for the label
      label.setAttribute("name", param.name);
      label.setAttribute("for", param.name);
      label.setAttribute("class", "param-label");
      label.textContent = `${param.name}: `;

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

      // Make a settable text input display for the value
      text.setAttribute("value", param.value.toFixed(1));
      text.setAttribute("type", "text");

      // Make each slider control its parameter
      slider.addEventListener("pointerdown", () => {
          isDraggingSlider = true;
      });
      slider.addEventListener("pointerup", () => {
          isDraggingSlider = false;
          slider.value = param.value;
          text.value = param.value.toFixed(1);
      });
      slider.addEventListener("input", () => {
          let value = Number.parseFloat(slider.value);
          param.value = value;
      });

      // Make the text box input control the parameter value as well
      text.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
              let newValue = Number.parseFloat(text.value);
              if (isNaN(newValue)) {
                  text.value = param.value;
              } else {
                  newValue = Math.min(newValue, param.max);
                  newValue = Math.max(newValue, param.min);
                  text.value = newValue;
                  param.value = newValue;
              }
          }
      });

      // Store the slider and text by name so we can access them later
      uiElements[param.id] = { slider };

      // Add the slider element
      effect_div.appendChild(sliderContainer);
    });
  };
  // Listen to parameter changes from the device
  device.parameterChangeEvent.subscribe(param => {
    if (!isDraggingSlider)
        uiElements[param.id].slider.value = param.value;
  });
}

function testBtn(ev){
    console.log("tamere");
}

function onoffEffect(ev){
   console.log("onoffeffect");
   effects.find(t=>t.title===ev.target.id).activ = ev.target.checked;
   nodeConnection();
   const divs = document.getElementsByName(ev.target.id+"div");
   console.log(divs);
   divs.forEach((div) => {
    div.style.display = (ev.target.checked) ? "block" : "none";
   })
}

function nodeConnection(){
  analyser.disconnect(0);
  effects.forEach((effect)=>{effect.device.node.disconnect(0)});
  let f_effects = effects.filter(t=>t.activ==true);
  console.log(f_effects);
  if (f_effects.length == 0){
    console.log("only1");
    analyser.connect(myPeer);
  } else if (f_effects.length == 1){
    console.log("only2");
    f_effects[0].device.node.connect(myPeer);
    analyser.connect(f_effects[0].device.node);
  } else {
    console.log("only3");
    f_effects[0].device.node.connect(myPeer);
    for (i = 1; i < f_effects.length; i++){
      f_effects[i].device.node.connect(f_effects[i-1].device.node);
    }
    analyser.connect(f_effects[f_effects.length-1].device.node);
  };
}