const socket = io.connect("https://maman-jk7dceleka-od.a.run.app");

const adminVideos = document.getElementById("adminVideos");
for (let i = 0; i < 15; i++){
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
//dd857c29f4637fcbf86c57824bb2a1a64bf64a1df8e63d004230d6cb31ccc748
const ctx = new AudioContext();
ctx.destination.channelInterpretation = 'discrete';
ctx.destination.channelCount = ctx.destination.maxChannelCount;
let merger = ctx.createChannelMerger(ctx.destination.maxChannelCount);
merger.channelInterpretation = 'discrete';
merger.connect(ctx.destination);
console.log("Channel number: " + ctx.destination.maxChannelCount);
let ch = 0;
//merger.channelInterpretation = 'discrete';
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

let cutFreq;

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
        cutFreq: cutFreq,
        analyser: analyser
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
    const streamVisualizer = new MyWebAudio(source, analyser, canvas, false);
    streamVisualizer.start();

    let videoMaster = document.getElementById("adminVideos");
    videoMaster = videoMaster.getElementsByTagName("video")[0];
    if (videoMaster != undefined){
      videoMaster.setAttribute("name", 'video' + currentClientId);
      videoMaster.display = "inline";
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
function changeChan(event){
  const clientId = event.target.name.substring(3);
  let client = clientS.find(t=>t.clientId==clientId);
  client.analyser.disconnect(0);
  client.gainNode.connect(client.analyser).connect(merger, 0, parseInt(event.target.innerText)-1);
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

function changeBackgroundColor(event){
  if  (event.code == "Space"){
    let randNumber = Math.max(Math.round(Math.random()*clientS.length), 1);
    try {
      data = {"scene": 4};
      for (let i = 0; i < randNumber; i++){
        clientS[(iterKey+i) % clientS.length].rtcDataSendChannel.send(JSON.stringify(data));
      }
    } catch (error) {
      console.error(error);
    }
    iterKey+=randNumber;
  }
}