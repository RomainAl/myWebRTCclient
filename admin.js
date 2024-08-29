//const socket = io.connect("https://maman-jk7dceleka-od.a.run.app");
//const socket = io.connect("https://maman2-jk7dceleka-od.a.run.app");
//const socket = io.connect("https://mywrtc-ro5o23vkzq-od.a.run.app");
const   socket = io.connect("https://mywebrtcserver-thrumming-resonance-5604.fly.dev/");
// const socket = io.connect("https://192.168.10.2:1337");
console.log("Flyio ok");
//const socket = io.connect("https://192.168.10.2:1337");

const adminVideos = document.getElementById("adminVideos");
for (let i = 0; i < 20; i++){
  let videoelement = document.createElement("video");
  videoelement.src = './videos/video1.webm';
  videoelement.type="video/webm";
  videoelement.width = 250;
  videoelement.playsinline = true;
  videoelement.loop = true;
  videoelement.controls = true;
  videoelement.volume = 1;
  adminVideos.appendChild(videoelement);
}
document.getElementById('btn_start').onclick = startContext;
document.getElementById('btn_reload').onclick = sendData;
document.getElementById('btn_stopAll').onclick = removeAllStoped;
document.getElementById('btn_reco').onclick = sendData;
// const btn_midi = document.getElementById('btn_midi');
// const slider_midi = document.getElementById('slider_midi');
document.getElementById('btn_scene1').onclick = sendData;
document.getElementById('btn_scene20').onclick = sendData;
document.getElementById('btn_scene21').onclick = sendData;
document.getElementById('btn_scene21_random').onclick = sendData;
document.getElementById('btn_scene3').onclick = sendData;

// btn_midi.onclick = ()=>{
//   if(navigator.requestMIDIAccess){
//     navigator.requestMIDIAccess({sysex: false}).then(onMIDISuccess, onMIDIFailure);
//   }
//   else {
//     alert("No MIDI support in your browser.");
//   }
// };
// slider_midi.onchange = ()=>{
//   let outputs = midi.outputs
//   outputs.forEach((output)=>{
//     const noteOnMessage = [0x90, 90, 0x7f];
//     output.send(noteOnMessage);
//   })
// }

const divGStats = document.getElementById('stats');

let clientS = [];
let sendChannel;
let receiveChannel;

let iterKey = 0;
document.addEventListener('keydown', changeBackgroundColor);

const NVideo = 21;
const roomName = "atablee";
let currentClientId;

let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

//{ sinkId: "124e612f375942fd133185c04186d1a26bc79eda5e4fc75317b508430d00e4ea" }
//dd857c29f4637fcbf86c57824bb2a1a64bf64a1df8e63d004230d6cb31ccc748
let ctx;
let merger;
let bitcrusher;
let ch = 0;
let source;
let gainNode;
let analyser;
/*const compressor = new DynamicsCompressorNode(ctx, {
  threshold: -50,
  knee: 40,
  ratio: 12,
  attack: 0,
  release: 0.25,
});*/
let cutFreq;

function startContext(event) {
  //console.log(navigator.mediaDevices.enumerateDevices());
  ctx = new AudioContext();
  ctx.destination.channelInterpretation = 'discrete';
  ctx.destination.channelCount = ctx.destination.maxChannelCount;
  /*ctx.audioWorklet.addModule('bypass-processor.js')
    .then(() => {
      console.log(bitcrusher);
      bitcrusher = new AudioWorkletNode(ctx, 'bypass-processor');
      console.log(bitcrusher);
    })
    .catch((err)=>{console.log("tamere "+err)});*/
    
  merger = ctx.createChannelMerger(ctx.destination.maxChannelCount);
  merger.channelInterpretation = 'discrete';
  merger.connect(ctx.destination);
  console.log("Channel number: " + ctx.destination.maxChannelCount);
  //merger.channelInterpretation = 'discrete';
  console.log(ctx);
}

// Display statistics
setInterval(() => {

  try{
    if (clientS.length > 0) {
      let rbitrate = 0;
      let sbitrate = 0;
      for (let i = 0; i < clientS.length; i++){
        let clientId = clientS[i].clientId;
        let divStats = document.getElementsByName('divStats' + clientId)[0];
        let statsPrev = {
          t: divStats.getAttribute('data-t'),
          raB: divStats.getAttribute('data-raB'),
          rvB: divStats.getAttribute('data-rvB'),
          saB: divStats.getAttribute('data-saB'),
          svB: divStats.getAttribute('data-svB')
        }
        clientS[i].rtcPeerConnection
            .getStats(null)
            .then((results)=>{
              let stats = dumpStats(results, statsPrev);
              rbitrate += stats.rabitrate + stats.rvbitrate;
              sbitrate += stats.sabitrate + stats.svbitrate;
              divStats.innerHTML = 'RA = ' + stats.rabitrate + ' kbits/sec  //  ';
              divStats.innerHTML += 'RV = ' + stats.rvbitrate + ' kbits/sec<br>';
              divStats.innerHTML += 'SA = ' + stats.sabitrate + ' kbits/sec  //  ';
              divStats.innerHTML += 'SV = ' + stats.svbitrate + ' kbits/sec<br>';
              //divStats.innerHTML += stats.all;
              divStats.setAttribute('data-t', stats.t);
              divStats.setAttribute('data-raB', stats.raB);
              divStats.setAttribute('data-rvB', stats.rvB);
              divStats.setAttribute('data-saB', stats.saB);
              divStats.setAttribute('data-svB', stats.svB);
              divGStats.innerHTML = 'R = ' + rbitrate + ' kbits/sec  //  ';
              divGStats.innerHTML += 'S = ' + sbitrate + ' kbits/sec';
            });
      }
    }
  } catch(err){
    console.log(err);
  }
}, 5000);

function dumpStats(results, statsPrev) {
  let bytes = 0;
  let stats = {
    t: Date.now(),
    rabitrate: 0,
    rvbitrate: 0,
    sabitrate: 0,
    svbitrate: 0,
    raB: 0,
    rvB: 0,
    saB: 0,
    svB: 0,
    all: ''
  }
  results.forEach(res => {
    if (res.type === 'inbound-rtp' && res.mediaType === 'audio') {
      stats.raB = res.bytesReceived;
      stats.rabitrate = Math.floor(8 * (stats.raB - statsPrev.raB) / (stats.t - statsPrev.t));
    } else if (res.type === 'inbound-rtp' && res.mediaType === 'video') {
      stats.rvB = res.bytesReceived;
      stats.rvbitrate = Math.floor(8 * (stats.rvB - statsPrev.rvB) / (stats.t - statsPrev.t));
    } else if (res.type === 'outbound-rtp' && res.mediaType === 'audio') {
      stats.saB = res.bytesSent;
      stats.sabitrate = Math.floor(8 * (stats.saB - statsPrev.saB) / (stats.t - statsPrev.t));
    } else if (res.type === 'outbound-rtp' && res.mediaType === 'video') {
      stats.svB = res.bytesSent;
      stats.svbitrate = Math.floor(8 * (stats.svB - statsPrev.svB) / (stats.t - statsPrev.t));
    }
    
    stats.all += '<h3>Report type=';
    stats.all += res.type;
    stats.all += '</h3>\n';
    stats.all += `id ${res.id}<br>`;
    stats.all += `time ${res.timestamp}<br>`;
    Object.keys(res).forEach(k => {
      if (k !== 'timestamp' && k !== 'type' && k !== 'id') {
        if (typeof res[k] === 'object') {
          stats.all += `${k}: ${JSON.stringify(res[k])}<br>`;
        } else {
          stats.all += `${k}: ${res[k]}<br>`;
        }
      }
    });
  });

  return stats;
}

socket.emit("join", roomName, true);

/*socket.on("create", function (id) {
  currentAdminId = id;
});*/

socket.on("create", function () {
});

socket.on("offer", function (offer, clientId) {
  console.log(clientS);
  currentClientId = clientId;
  if (clientS && (clientS.find(t=>t.clientId==clientId))) removeClient(clientId);
  console.log('Offer receive from = '+clientId);
  let videoelement = document.getElementById("adminVideos");
  videoelement = videoelement.getElementsByTagName("video")[0];
  let adminStream = videoelement.captureStream();
  const audioTracks = adminStream.getAudioTracks();
  const videoTracks = adminStream.getVideoTracks();
  if (videoTracks.length > 0) {
    console.log(`Using video device: ${videoTracks[0].label}`);
  }
  if (audioTracks.length > 0) {
    console.log(`Using audio device: ${audioTracks[0].label}`);
  }
  videoTracks.forEach(track => {
    if ('contentHint' in track) {
      track.contentHint = 'detail';
      if (track.contentHint !== 'detail') {
        console.log('Invalid video track contentHint: \'' + 'detail' + '\'');
      }
    } else {
      console.log('MediaStreamTrack contentHint attribute not supported');
    }
  });

  let rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
  rtcPeerConnection.setRemoteDescription(offer);
  adminStream.getTracks().forEach((track) => rtcPeerConnection.addTrack(track, adminStream));
  rtcPeerConnection.ondatachannel = receiveChannelCallback;
  if (ctx){
    rtcPeerConnection.ontrack = OnTrackFunction;
    rtcPeerConnection
    .createAnswer()
    .then((answer) => {
        rtcPeerConnection.setLocalDescription(answer);
        socket.emit("answer", answer, clientId);
        console.log('answer sent to : ' + clientId);
        sendChannel = rtcPeerConnection.createDataChannel('mySceneName');
        sendChannel.onopen = onSendChannelStateChange;
        sendChannel.onmessage = onSendChannelMessageCallback;
        sendChannel.onclose = onSendChannelStateChange;
        rtcPeerConnection.onconnectionstatechange = (ev) => {
          let client;
          switch(ev.currentTarget.connectionState) {
            case "new":
              console.log("New...");
              break;
            case "checking":
              console.log("Connecting…");
              break;
            case "connected":
              console.log("Online");
              client = clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29)));
              client.div.style.borderColor = "green";
              break;
            case "disconnected":
              console.log("Disconnecting…");
              client = clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29)));
              ev.currentTarget.close();
              client.div.style.borderColor = "red";
              //removeClient(clientId);
              break;
            case "closed":
              console.log("Offline");
              ev.currentTarget.close();
              client.div.style.borderColor = "red";
              break;
            case "failed":
              console.log("Error");
              client = clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29)));
              ev.currentTarget.close();
              client.div.style.borderColor = "red";
              break;
            default:
              console.log("Unknown");
              break;
          }
        };
        myPeer = ctx.createMediaStreamDestination();
        let client = {
          rtcDataSendChannel: sendChannel,
          rtcPeerConnection: rtcPeerConnection,
          clientId : clientId,
          rtcPeerCoID: rtcPeerConnection.remoteDescription.sdp.slice(9, 29),
          div: document.getElementsByName('div'+clientId)[0],
          source: source,
          gainNode: gainNode,
          cutFreq: cutFreq,
          analyser: analyser,
          audioCrac_myPeer: myPeer
        };
        clientS.push(client);
    })
    .catch((error) => {
        console.log(error);
    });
  } else {
    rtcPeerConnection.close();
    socket.emit("answer", null, clientId);
    console.log('No answer sent to : ' + clientId);
  }
});

socket.on("disconnect", (reason) => {
  console.log(reason);
  if (reason === "io server disconnect") {
    // the disconnection was initiated by the server, you need to reconnect manually
    socket.connect();
  }
  socket.emit("join", roomName, true);
  // else the socket will automatically try to reconnect
});

// Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.
function OnIceCandidateFunction(event) {
    console.log("Candidate");
    if (event.candidate) {
      socket.emit("candidate", event.candidate, roomName, currentClientId);
    }
  }
  
// Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.
function OnTrackFunction(event) {
  console.log("OnTrack");
  if (event.track.kind === 'audio'){
    let medias = document.getElementById('medias');
    let clientdiv = document.createElement("div");
    medias.appendChild(clientdiv);
    clientdiv.style.border = "double";
    clientdiv.style.borderRadius = "20px";
    clientdiv.style.display = "flex";
    clientdiv.style.flexDirection = "column";
    clientdiv.style.alignItems = "center";
    clientdiv.style.alignContent = "space-around";
    //clientdiv.style.justifyContent = "space-around";
    clientdiv.style.justifySelf = "stretch";
    clientdiv.style.padding = "10px";
    clientdiv.setAttribute("name", 'div' + currentClientId);
    let audio = document.createElement("audio");
    audio.setAttribute("name", 'audio' + currentClientId); // TODO ? Why audio needed ??
    audio.controls = false;
    audio.autoplay = true;
    audio.muted = true;
    clientdiv.appendChild(audio);
    
    if (audio.srcObject !== event.streams[0]) {
      audio.srcObject = event.streams[0];
      console.log('Received audio remote stream');
    }
    canvas = document.createElement("canvas");
    canvas.setAttribute("name", 'canvas' + currentClientId);
    canvas.width = 250;
    clientdiv.appendChild(canvas);
    let gain = document.createElement('input');
    gain.setAttribute("name", 'input'+currentClientId);
    gain.type = 'range';
    gain.min = 0;
    gain.max = 1;
    gain.value = 1.0;
    gain.step = 0.1;
    gain.onchange = changeGain;
    clientdiv.appendChild(gain);
    if (ctx){
      source = ctx.createMediaStreamSource(event.streams[0]);
      gainNode = ctx.createGain();
      gainNode.gain.value = gain.value;
      analyser = ctx.createAnalyser();
      analyser.minDecibels = -140;
      analyser.maxDecibels = 0;

      let cutFreq_f = document.createElement('input');
      cutFreq_f.setAttribute("name", 'input'+currentClientId);
      cutFreq_f.type = 'range';
      cutFreq_f.min = 0;
      cutFreq_f.max = 22050;
      cutFreq_f.value = 0;
      cutFreq_f.step = 100;
      
      cutFreq_f.onchange = changeCutFreq;
      clientdiv.appendChild(cutFreq_f);

      cutFreq = ctx.createBiquadFilter();
      cutFreq.frequency.value = cutFreq_f.value;
      cutFreq.type = "peaking";
      cutFreq.gain.value = -40;

      const splitter = ctx.createChannelSplitter(1);
      source.connect(splitter).connect(cutFreq).connect(gainNode).connect(analyser).connect(merger, 0, ch);
      let btn_chan = document.createElement("div");
      clientdiv.appendChild(btn_chan);
      for (let i=0; i<ctx.destination.maxChannelCount; i++){
        let button = document.createElement("button");
        button.setAttribute("name", 'btn'+ currentClientId);
        if (ch % ctx.destination.maxChannelCount==i){
          button.style.background='green';
        } else {
          button.style.background='white';
        }
        button.innerText = i+1;
        button.onclick = changeChan;
        btn_chan.appendChild(button);
      }
      ch++;
      ch = ch % ctx.destination.maxChannelCount;
      const streamVisualizer = new MyWebAudio(source, analyser, canvas);
      streamVisualizer.start();
    };
    
    let videoMaster = document.getElementById("adminVideos");
    videoMaster = videoMaster.getElementsByTagName("video")[0];
    if (videoMaster != undefined){
      videoMaster.setAttribute("name", 'video' + currentClientId);
      videoMaster.style.display = "inline";
      clientdiv.appendChild(videoMaster);
      let btn_videos = document.createElement("div");
      clientdiv.appendChild(btn_videos);
      for (let i=0;i<NVideo;i++){
        let button = document.createElement("button");
        button.setAttribute("name", 'btn'+ currentClientId);
        button.innerText = i+1;
        button.onclick = changeVid;
        btn_videos.appendChild(button);
      }
    }
    let audioCrac= document.createElement("audio");
    audioCrac.setAttribute("name", 'audioCrac' + currentClientId);
    audioCrac.controls = true;
    audioCrac.loop = true;
    audioCrac.autoplay = false;
    audioCrac.muted = false;
    audioCrac.src = './audios/audio1.wav';
    audioCrac.style.width = '250px';
    clientdiv.appendChild(audioCrac);

    let audioCrac2= document.createElement("audio");
    audioCrac2.setAttribute("name", 'audioCrac2' + currentClientId);
    audioCrac2.controls = true;
    audioCrac2.loop = true;
    audioCrac2.autoplay = false;
    audioCrac2.muted = false;
    audioCrac2.src = './audios/audio2.wav';
    audioCrac2.style.width = '250px';
    clientdiv.appendChild(audioCrac2);

    let divStats = document.createElement("div");
    divStats.setAttribute("name", 'divStats'+ currentClientId);
    clientdiv.appendChild(divStats);

    let button = document.createElement("button");
    button.setAttribute("name", 'btn'+ currentClientId);
    button.innerText = "STOP";
    button.onclick = stop;
    button.style.background = "red";
    clientdiv.appendChild(button);
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
    case "btn_reload":
      data = {"scene": 0};
      break;
    case "btn_reco":
      socket.connect();
      socket.emit("join", roomName, true);
      break;
    case "btn_scene1":
      data = {"scene": 1};
      break;
    case "btn_scene20":
      data = {"scene": 20};
      break;
    case "btn_scene21":
      data = {"scene": 21};
      // change2Vid();
      break;
    case "btn_scene21_random":
      data = {"scene": 5};
      // change2Vid();
      break;
    case "btn_scene3":
      data = {"scene": 3};
      change2Crac();
      break;
    default:
      console.log("Error : no scene found !")
  }
  
  for (let i = 0; i < clientS.length; i++){
    if (clientS[i].rtcDataSendChannel.readyState === 'open') {
      clientS[i].rtcDataSendChannel.send(JSON.stringify(data));
    }
  }
  console.log('Sent Data: ' + data.scene);
}

function onSendChannelStateChange() {
  const readyState = sendChannel.readyState;
  console.log('Send channel state is: ' + readyState);
}

function onSendChannelMessageCallback(event) {
  console.log('Received Message');
}

function change2Crac(){
  clientS.forEach((client)=>{
    let audioCrac = document.getElementsByName('audioCrac' + client.clientId)[0];
    let audioSource = ctx.createMediaElementSource(audioCrac);
    audioSource.connect(client.audioCrac_myPeer);
    audioCrac = document.getElementsByName('audioCrac2' + client.clientId)[0];
    audioSource = ctx.createMediaElementSource(audioCrac);
    audioSource.connect(client.audioCrac_myPeer);
    audioCrac.playbackRate = Math.random()+0.1;
    audioCrac.play();
    let audioSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === "audio");
    audioSender.replaceTrack(client.audioCrac_myPeer.stream.getTracks()[0]);
    let videoSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === "video");
    client.rtcPeerConnection.removeTrack(videoSender);
  });
}

function changeVid(event){
  const clientId = event.target.name.substring(3);
  let videoelement = document.getElementsByName('video' + clientId)[0];
  videoelement.src = './videos/video'+event.target.innerText+'.mp4';
  videoelement.type="video/mp4";
  videoelement.play()
  .then(() => {
    let adminStream = videoelement.captureStream();
    let client = clientS.find(t=>t.clientId==clientId);
    const [videoTrack] = adminStream.getVideoTracks();
    let videoSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === videoTrack.kind);
    videoSender.replaceTrack(videoTrack);
    const [audioTrack] = adminStream.getAudioTracks();
    let audioSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === audioTrack.kind);
    audioSender.replaceTrack(audioTrack);
    });
}

function change2Vid(){
  let videoelements = document.getElementById("adminVideosTest").getElementsByTagName("video");
  let adminStream2 = videoelements[2].captureStream();
  clientS.forEach((client)=>{
    const [videoTrack] = adminStream.getVideoTracks();
    let videoSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === 'video');
    videoSender.replaceTrack(videoTrack);
    const [audioTrack] = adminStream.getAudioTracks();
    let audioSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === 'audio');
    audioSender.replaceTrack(audioTrack);
  });
}


function changeChan(event){
  const clientId = event.target.name.substring(3);
  let client = clientS.find(t=>t.clientId==clientId);
  client.analyser.disconnect(0);
  client.analyser.connect(merger, 0, parseInt(event.target.innerText)-1);
  for (const child of event.target.parentElement.children) {
    child.style.background = "white";
  }
  event.target.style.background = "green";
}

function changeGain(event){
  const clientId = event.target.name.substring(5);
  let client = clientS.find(t=>t.clientId==clientId);
  client.gainNode.gain.value = event.target.value;
}

function changeCutFreq(event){
  const clientId = event.target.name.substring(5);
  let client = clientS.find(t=>t.clientId==clientId);
  client.cutFreq.frequency.value = event.target.value;
  console.log(event.target.value);
  console.log(client);
}

function stop(event){
  const clientId = event.target.name.substring(3);
  removeClient(clientId);
}

function removeClient(clientId){
  let client = clientS.find(t=>t.clientId==clientId);
  let ind = clientS.findIndex(t=>t.clientId==clientId);
  try{
    client.rtcPeerConnection.close();
    client.rtcDataSendChannel.close();
  } catch (error) {
    console.error(error);
  }
  let videoelement = document.getElementsByName('video' + clientId)[0];
  videoelement.pause();
  adminVideos.appendChild(videoelement);
  removeAllChildNodes(client.div);
  client.div.remove();
  clientS.splice(ind, 1);
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
  }
}
function removeAllStoped() {
  clientS.filter(c=>c.rtcPeerConnection.signalingState!=='stable').forEach(c=>removeClient(c.clientId));
  console.log(clientS);
}

function changeBackgroundColor(event){
  if  (event.code == "Space"){
    let randNumber = Math.max(Math.round(Math.random()*clientS.length), 1);
    try {
      data = {"scene": 4};
      for (let i = 0; i < randNumber; i++){
        clientS[(iterKey+i) % clientS.length].rtcDataSendChannel.send(JSON.stringify(data));
        let audioCrac = document.getElementsByName('audioCrac'+clientS[(iterKey+i) % clientS.length].clientId)[0];
        audioCrac.playbackRate = Math.random()+0.1;
        audioCrac.play();
        setTimeout(()=>{audioCrac.pause()}, 1500);
      }
    } catch (error) {
      console.error(error);
    }
    iterKey+=randNumber;
  }
}


/// MIDI SETTINGS :
var log = console.log.bind(console), keyData = document.getElementById('key_data'), 
				deviceInfoInputs = document.getElementById('inputs'), deviceInfoOutputs = document.getElementById('outputs'), midi;

if(navigator.requestMIDIAccess){
  navigator.requestMIDIAccess({sysex: false}).then(onMIDISuccess, onMIDIFailure);
}
else {
  alert("No MIDI support in your browser.");
}

// midi functions
function onMIDISuccess(midiAccess){
	midi = midiAccess;
	var inputs = midi.inputs.values();
	// loop through all inputs
	for(var input = inputs.next(); input && !input.done; input = inputs.next()){
		// listen for midi messages
		input.value.onmidimessage = onMIDIMessage;

		listInputs(input);
	}
	// listen for connect/disconnect message
	midi.onstatechange = onStateChange;

	showMIDIPorts(midi);
}

function onMIDIMessage(event){
	data = event.data,
	cmd = data[0] >> 4,
	channel = data[0] & 0xf,
	type = data[0] & 0xf0, // channel agnostic message type. Thanks, Phil Burk.
	note = data[1],
	velocity = data[2];
	// with pressure and tilt off
	// note off: 128, cmd: 8 
	// note on: 144, cmd: 9
	// pressure / tilt on
	// pressure: 176, cmd 11: 
	// bend: 224, cmd: 14
	// log('MIDI data', data);
	/*switch(type){
		case 144: // noteOn message 
			noteOn(note, velocity);
			break;
		case 128: // noteOff message 
			noteOff(note, velocity);
			break;
	}*/
	
	//log('data', data, 'cmd', cmd, 'channel', channel);
	logger(keyData, 'key data', data);

  if ((note == 46)&&(velocity==127)) {
    let randNumber = Math.max(Math.round(Math.random()*clientS.length), 1);
    try {
      data = {"scene": 4};
      for (let i = 0; i < randNumber; i++){
        clientS[(iterKey+i) % clientS.length].rtcDataSendChannel.send(JSON.stringify(data));
        let audioCrac = document.getElementsByName('audioCrac'+clientS[(iterKey+i) % clientS.length].clientId)[0];
        audioCrac.playbackRate = Math.random()+0.1;
        audioCrac.play();
        setTimeout(()=>{audioCrac.pause()}, 1500);
      }
    } catch (error) {
      console.error(error);
    }
    iterKey+=randNumber;
  }
  /*try {
    data = {"scene": 4};
    switch (note){
      case 60 :
        clientS[0].rtcDataSendChannel.send(JSON.stringify(data));
        break;
      case 61 :
        clientS[1].rtcDataSendChannel.send(JSON.stringify(data));
        break;
      case 30 :
        clientS[0].gainNode.gain.value = velocity;
        break
    }
  } catch (error) {
    console.error(error);
  }*/
}

function logger(container, label, data){
	messages = label + " [channel: " + (data[0] & 0xf) + ", cmd: " + (data[0] >> 4) + ", type: " + (data[0] & 0xf0) + " , note: " + data[1] + " , velocity: " + data[2] + "]";
	container.textContent = messages;
}

function onMIDIFailure(e){
	log("No access to MIDI devices or your browser doesn't support WebMIDI API. Please use WebMIDIAPIShim " + e);
}

// MIDI utility functions
function showMIDIPorts(midiAccess){
	var inputs = midiAccess.inputs,
			outputs = midiAccess.outputs, 
			html;
	html = '<h4>MIDI Inputs:</h4><div class="info">';
	inputs.forEach(function(port){
		html += '<p>' + port.name + '<p>';
		html += '<p class="small">connection: ' + port.connection + '</p>';
		html += '<p class="small">state: ' + port.state + '</p>';
		html += '<p class="small">manufacturer: ' + port.manufacturer + '</p>';
		if(port.version){
			html += '<p class="small">version: ' + port.version + '</p>';
		}
	});
	deviceInfoInputs.innerHTML = html + '</div>';

	html = '<h4>MIDI Outputs:</h4><div class="info">';
	outputs.forEach(function(port){
		html += '<p>' + port.name + '<br>';
		html += '<p class="small">manufacturer: ' + port.manufacturer + '</p>';
		if(port.version){
			html += '<p class="small">version: ' + port.version + '</p>';
		}
	});
	deviceInfoOutputs.innerHTML = html + '</div>';
}

function onStateChange(event){
	showMIDIPorts(midi);
	var port = event.port, state = port.state, name = port.name, type = port.type;
	if(type == "input")
		log("name", name, "port", port, "state", state);

}

function listInputs(inputs){
	var input = inputs.value;
		log("Input port : [ type:'" + input.type + "' id: '" + input.id + 
				"' manufacturer: '" + input.manufacturer + "' name: '" + input.name + 
				"' version: '" + input.version + "']");
}