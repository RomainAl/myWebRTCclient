const socket = io.connect("https://192.168.10.2:1337");

const adminVideos = document.getElementById("adminVideos");
for (i = 0; i < 15; i++){
  videoelement = document.createElement("video");
  videoelement.src = './videos/video03.mp4';
  videoelement.type="video/mp4";
  videoelement.width = 250;
  videoelement.playsinline = true;
  videoelement.loop = true;
  videoelement.controls = true;
  videoelement.volume = 1;
  adminVideos.appendChild(videoelement);
}
const btn_reload = document.getElementById('btn_reload');
const btn_scene1 = document.getElementById('btn_scene1');
const btn_scene2 = document.getElementById('btn_scene2');
const btn_scene3 = document.getElementById('btn_scene3');

btn_reload.onclick = sendData;
btn_scene1.onclick = sendData;
btn_scene2.onclick = sendData;
btn_scene3.onclick = sendData;

const divGStats = document.getElementById('stats');

let clientS = [];
let sendChannel;
let receiveChannel;

let iterKey = 0;
document.addEventListener('keydown', changeBackgroundColor);

const NVideo = 9;
const roomName = "atablee";
let currentClientId;

let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

//{ sinkId: "bf0b1c065616b8f37f0736b78109cbe7501b4be048e518c02ff7a7c3e09000a9" }
const ctx = new AudioContext();
console.log(ctx);
let source;
let gainNode;
let analyser;
const compressor = new DynamicsCompressorNode(ctx, {
  threshold: -50,
  knee: 40,
  ratio: 12,
  attack: 0,
  release: 0.25,
});
let panNode;
let filters = [];
const filtersFreq = [200, 1500, 3500, 10000, 12000, 15000, 18000, 22050];
filtersFreq.forEach(function(freq, i) {
  let eqin = document.createElement('input');
  eqin.setAttribute("name", i);
  eqin.type = 'range';
  eqin.min = -30;
  eqin.max = 30;
  eqin.value = 0.0;
  eqin.step = 0.1;
  eqin.onchange = changeEQ;
  document.getElementById("EQ").appendChild(eqin);
});

// Display statistics
setInterval(() => {
  try{
    if (clientS.length > 0) {
      let rbitrate = 0;
      let sbitrate = 0;
      for (i = 0; i < clientS.length; i++){
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
              divStats.innerHTML = 'RA = ' + stats.rabitrate + ' kbits/sec<br>';
              divStats.innerHTML += 'RV = ' + stats.rvbitrate + ' kbits/sec<br>';
              divStats.innerHTML += 'SA = ' + stats.sabitrate + ' kbits/sec<br>';
              divStats.innerHTML += 'SV = ' + stats.svbitrate + ' kbits/sec<br>';
              //divStats.innerHTML += stats.all;
              divStats.setAttribute('data-t', stats.t);
              divStats.setAttribute('data-raB', stats.raB);
              divStats.setAttribute('data-rvB', stats.rvB);
              divStats.setAttribute('data-saB', stats.saB);
              divStats.setAttribute('data-svB', stats.svB);
              divGStats.innerHTML = 'R = ' + rbitrate + ' kbits/sec<br>';
              divGStats.innerHTML += 'S = ' + sbitrate + ' kbits/sec<br>';
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

socket.on("create", function () {
});

socket.on("offer", function (offer, clientId) {

  console.log(navigator.mediaDevices.enumerateDevices());
  currentClientId = clientId;
  let videoelement = document.getElementById("adminVideos");
  videoelement = videoelement.getElementsByTagName("video")[0];
  let adminStream = videoelement.captureStream();
  let rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
  rtcPeerConnection.ontrack = OnTrackFunction;
  rtcPeerConnection.setRemoteDescription(offer);
  adminStream.getTracks().forEach((track) => rtcPeerConnection.addTrack(track, adminStream));
  rtcPeerConnection.ondatachannel = receiveChannelCallback;
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
        client.div.style.borderColor = "red";
        //removeClient(clientId);
        ev.currentTarget.close();
        break;
      case "closed":
        console.log("Offline");
        break;
      case "failed":
        console.log("Error");
        client = clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29)));
        client.div.style.borderColor = "red";
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
      let client = {
        rtcDataSendChannel: sendChannel,
        rtcPeerConnection: rtcPeerConnection,
        clientId : clientId,
        rtcPeerCoID: rtcPeerConnection.remoteDescription.sdp.slice(9, 29),
        div: document.getElementsByName('div'+clientId)[0],
        source: source,
        gainNode: gainNode,
        panNode: panNode,
        filters: filters
      };
      clientS.push(client);
  })
  .catch((error) => {
      console.log(error);
  });

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
  if (event.track.kind === 'audio'){
    let medias = document.getElementById('medias');
    let clientdiv = document.createElement("div");
    medias.appendChild(clientdiv);
    clientdiv.style.border = "double";
    clientdiv.setAttribute("name", 'div' + currentClientId);
    let audio = document.createElement("audio");
    audio.setAttribute("name", 'audio' + currentClientId);
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
    source = ctx.createMediaStreamSource(event.streams[0]);
    const splitter = ctx.createChannelSplitter(1);
    source.connect(splitter);
    gainNode = ctx.createGain();
    gainNode.gain.value = gain.value;
    analyser = ctx.createAnalyser();
    analyser.minDecibels = -140;
    analyser.maxDecibels = 0;
    let pan = document.createElement('input');
    pan.setAttribute("name", 'input'+currentClientId);
    pan.style.background = "red";
    pan.type = 'range';
    pan.min = -1;
    pan.max = 1;
    pan.value = 0.0;
    pan.step = 0.1;
    pan.onchange = changePan;
    clientdiv.appendChild(pan);
    panNode = ctx.createStereoPanner();
    panNode.pan.setValueAtTime(pan.value, ctx.currentTime);
    filters = [];
    filtersFreq.forEach(function(freq, i) {
      var eq = ctx.createBiquadFilter();
      eq.frequency.value = freq;
      eq.type = "peaking";
      eq.gain.value = 0;
      filters.push(eq);
    });
    splitter.connect(filters[0]);
    for(var i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i+1]);
      }
    filters[filters.length - 1].connect(gainNode).connect(panNode).connect(analyser).connect(ctx.destination);
    const streamVisualizer = new MyWebAudio(source, analyser, canvas, false);
    streamVisualizer.start();

    let videoMaster = document.getElementById("adminVideos");
    videoMaster = videoMaster.getElementsByTagName("video")[0];
    if (videoMaster != undefined){
      videoMaster.setAttribute("name", 'video' + currentClientId);
      videoMaster.display = "inline";
      clientdiv.appendChild(videoMaster);
      for (i=0;i<NVideo;i++){
        let button = document.createElement("button");
        button.setAttribute("name", 'btn'+ currentClientId);
        button.innerText = i+1;
        button.onclick = changeVid;
        clientdiv.appendChild(button);
      }
      let button = document.createElement("button");
      button.setAttribute("name", 'btn'+ currentClientId);
      button.innerText = "STOP";
      button.onclick = stop;
      clientdiv.appendChild(button);

      let divStats = document.createElement("div");
      divStats.setAttribute("name", 'divStats'+ currentClientId);
      clientdiv.appendChild(divStats);
    }
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
    case "btn_scene1":
      data = {"scene": 1};
      break;
    case "btn_scene2":
      data = {"scene": 2};
      break;
    case "btn_scene3":
      data = {"scene": 3};
      break;
    default:
      console.log("Error : no scene found !")
  }
  
  for (i = 0; i < clientS.length; i++){
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

function changeVid(event){
  const clientId = event.target.name.substring(3);
  let videoelement = document.getElementsByName('video' + clientId)[0];
  videoelement.src = './videos/video0'+event.target.innerText+'.mp4';
  videoelement.type="video/mp4";
  videoelement.play()
  .then(() => {
    let adminStream = videoelement.captureStream()
    let client = clientS.find(t=>t.clientId==clientId);
    const [videoTrack] = adminStream.getVideoTracks();
    let videoSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === videoTrack.kind);
    videoSender.replaceTrack(videoTrack);
    const [audioTrack] = adminStream.getAudioTracks();
    let audioSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === audioTrack.kind);
    audioSender.replaceTrack(audioTrack);
    });
}

function changeGain(event){
  const clientId = event.target.name.substring(5);
  let client = clientS.find(t=>t.clientId==clientId);
  client.gainNode.gain.value = event.target.value;
}

function changePan(event){
  const clientId = event.target.name.substring(5);
  let client = clientS.find(t=>t.clientId==clientId);
  client.panNode.pan.value = event.target.value;
}

function changeEQ(event){
  console.log(event.target.name);
  for (i = 0; i < clientS.length; i++){
    if (clientS[i].rtcDataSendChannel.readyState === 'open') {
      clientS[i].filters[event.target.name].gain.value = event.target.value;
    }
  }
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

function changeBackgroundColor(event){
  try {
    data = {"scene": 4};
    clientS[iterKey % clientS.length].rtcDataSendChannel.send(JSON.stringify(data));
  } catch (error) {
    console.error(error);
  }
  iterKey++;
}
/*function StreamVisualizer(remoteStream, canvas, doSound) {
  //console.log('Creating StreamVisualizer with remoteStream and canvas: ', remoteStream, canvas);
  this.canvas = canvas;
  this.drawContext = this.canvas.getContext('2d');

  // cope with browser differences
  if (typeof AudioContext === 'function') {
    this.context = new AudioContext();
  } else if (typeof webkitAudioContext === 'function') {
    this.context = new webkitAudioContext(); // eslint-disable-line new-cap
  } else {
    alert('Sorry! Web Audio is not supported by this browser');
  }

  // Create a MediaStreamAudioSourceNode from the remoteStream
  this.source = this.context.createMediaStreamSource(remoteStream);

  this.analyser = this.context.createAnalyser();
  this.analyser.minDecibels = -140;
  this.analyser.maxDecibels = 0;
  this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
  this.times = new Uint8Array(this.analyser.frequencyBinCount);

  this.source.connect(this.analyser);
  if (doSound){
    this.source.connect(this.context.destination);
  }
  this.startTime = 0;
  this.startOffset = 0;
}

StreamVisualizer.prototype.start = function() {
  requestAnimationFrame(this.draw.bind(this));
};

StreamVisualizer.prototype.draw = function() {
  let barWidth;
  let offset;
  let height;
  let percent;
  let value;
  this.analyser.smoothingTimeConstant = SMOOTHING;
  this.analyser.fftSize = FFT_SIZE;

  // Get the frequency data from the currently playing music
  this.analyser.getByteFrequencyData(this.freqs);
  this.analyser.getByteTimeDomainData(this.times);


  //this.canvas.width = WIDTH;
  //this.canvas.height = HEIGHT;
  this.drawContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
  // Draw the frequency domain chart.
  for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
    value = this.freqs[i];
    percent = value / 256;
    height = this.canvas.height * percent;
    offset = this.canvas.height - height - 1;
    barWidth = this.canvas.width / this.analyser.frequencyBinCount;
    let hue = i/this.analyser.frequencyBinCount * 360;
    this.drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
    this.drawContext.fillRect(i * barWidth, offset, barWidth, height);
  }

  // Draw the time domain chart.
  for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
    value = this.times[i];
    percent = value / 256;
    height = this.canvas.height * percent;
    offset = this.canvas.height - height - 1;
    barWidth = this.canvas.width/this.analyser.frequencyBinCount;
    this.drawContext.fillStyle = 'black';
    this.drawContext.fillRect(i * barWidth, offset, 3, 5);
  }

  requestAnimationFrame(this.draw.bind(this));
};

StreamVisualizer.prototype.getFrequencyValue = function(freq) {
  let nyquist = this.context.sampleRate/2;
  let index = Math.round(freq/nyquist * this.freqs.length);
  return this.freqs[index];
};*/
