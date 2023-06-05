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

const remoteStats = document.getElementById('remoteStats');

let clientS = [];
let adminStream;
let sendChannel;
let receiveChannel;
const SMOOTHING = 0.8;
const FFT_SIZE = 256;


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

// Display statistics
setInterval(() => {
  try{
    if (clientS.length > 0) {
      for (i = 0; i < clientS.length; i++){
        let clientId = clientS[i].clientId;
        let divStats = document.getElementsByName('divStats' + clientId)[0];
        let timestampPrev = divStats.getAttribute('data-timestampPrev');
        let bytesPrev = divStats.getAttribute('data-bytesPrev');
        clientS[i].rtcPeerConnection
            .getStats(null)
            .then((results)=>{
              let stats = dumpStats(results, bytesPrev, timestampPrev);
              divStats.innerHTML = stats.statsString;
              divStats.setAttribute('data-timestampPrev', stats.timestampPrev);
              divStats.setAttribute('data-bytesPrev', stats.bytesPrev);
            })
            .catch((err) => console.log(err))
      }
    }
  } catch(err){
    console.log(err);
  }
}, 5000);

// Dumping a stats variable as a string.
// might be named toString?
function dumpStats(results, bytesPrev,timestampPrev) {
  let statsString = '';
  let bytes = 0;
  results.forEach(res => {
    /*statsString += '<h3>Report type=';
    statsString += res.type;
    statsString += '</h3>\n';
    statsString += `id ${res.id}<br>`;
    statsString += `time ${res.timestamp}<br>`;
    Object.keys(res).forEach(k => {
      if (k !== 'timestamp' && k !== 'type' && k !== 'id') {
        if (typeof res[k] === 'object') {
          statsString += `${k}: ${JSON.stringify(res[k])}<br>`;
        } else {
          statsString += `${k}: ${res[k]}<br>`;
        }
      }
    });*/
    let bitrate;
    if (res.type === 'inbound-rtp' && res.mediaType === 'audio') {
      bytes = res.bytesReceived;
      if (timestampPrev) {
        bitrate = 8 * (bytes - bytesPrev) / (Date.now() - timestampPrev);
        bitrate = Math.floor(bitrate);
      }
    }
    if (bitrate) {
      statsString = 'Received Bitrate =' + bitrate + ' kbits/sec';
    }
  });

  return {statsString:statsString,
          bytesPrev:bytes,
          timestampPrev:Date.now()};
}

socket.emit("join", roomName, true);

socket.on("create", function () {
});

socket.on("offer", function (offer, clientId) {

  //console.log(navigator.mediaDevices.enumerateDevices());
  currentClientId = clientId;
  let videoelement = document.getElementById("adminVideos");
  videoelement = videoelement.getElementsByTagName("video")[0];
  adminStream = videoelement.captureStream();
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
        div: document.getElementsByName('div'+clientId)[0]
      };
      clientS.push(client);
      console.log(clientS);
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
  console.log(event);
  if (event.track.kind === 'audio'){
    console.log(event.streams[0].getAudioTracks()[0].getSettings());

    let medias = document.getElementById('medias');
    let clientdiv = document.createElement("div");
    medias.appendChild(clientdiv);
    clientdiv.style.border = "double";
    clientdiv.setAttribute("name", 'div' + currentClientId);
    audio = document.createElement("audio");
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
    canvas.setAttribute("name", 'canvas' + currentClientId)
    clientdiv.appendChild(canvas);
    const streamVisualizer = new StreamVisualizer(event.streams[0], canvas, true);
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
    adminStream = videoelement.captureStream()
    let client = clientS.find(t=>t.clientId==clientId);
    const [videoTrack] = adminStream.getVideoTracks();
    let videoSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === videoTrack.kind);
    videoSender.replaceTrack(videoTrack);
    const [audioTrack] = adminStream.getAudioTracks();
    let audioSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === audioTrack.kind);
    audioSender.replaceTrack(audioTrack);
    });
}

function stop(event){
  const clientId = event.target.name.substring(3);
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
function StreamVisualizer(remoteStream, canvas, doSound) {
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
  const gainNode = this.context.createGain();
  gainNode.gain.value = 1.0;

  this.analyser = this.context.createAnalyser();
//  this.analyser.connect(this.context.destination);
  this.analyser.minDecibels = -140;
  this.analyser.maxDecibels = 0;
  this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
  this.times = new Uint8Array(this.analyser.frequencyBinCount);

  this.source.connect(gainNode).connect(this.analyser);
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
    this.drawContext.fillRect(i * barWidth, offset, 1, 2);
  }

  requestAnimationFrame(this.draw.bind(this));
};

StreamVisualizer.prototype.getFrequencyValue = function(freq) {
  let nyquist = this.context.sampleRate/2;
  let index = Math.round(freq/nyquist * this.freqs.length);
  return this.freqs[index];
};