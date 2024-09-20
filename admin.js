//const socket = io.connect("https://maman-jk7dceleka-od.a.run.app");
//const socket = io.connect("https://maman2-jk7dceleka-od.a.run.app");
//const socket = io.connect("https://mywrtc-ro5o23vkzq-od.a.run.app");
const   socket = io.connect("https://mywebrtcserver-thrumming-resonance-5604.fly.dev/");
// const socket = io.connect("https://192.168.10.2:1337");
console.log("Flyio ok");
//const socket = io.connect("https://192.168.10.2:1337");
const adminVideos = document.getElementById("adminVideos");

for (let i = 0; i < 50; i++){
  let videoelement = document.createElement("video");
  videoelement.src = './videosNEW/video21.mp4';
  videoelement.type="video/mp4";
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
// const btn_midi = document.getElementById('btn_midi');
// const slider_midi = document.getElementById('slider_midi');
document.getElementById('btn_scene1').onclick = changeScene;
document.getElementById('btn_scene20').onclick = changeScene;
document.getElementById('btn_scene21').onclick = changeScene;
// document.getElementById('btn_scene21_random').onclick = sendData;
document.getElementById('btn_scene3').onclick = changeScene;
document.getElementById('btn_scene6').onclick = changeScene;
document.getElementById('btn_sceneTHEEND').onclick = changeScene;
document.getElementById('btn_sceneWAIT').onclick = changeScene;
document.getElementById('btn_tech').onclick = changeScene;
document.getElementById('btn_lauch').onclick = sendData;
document.getElementById("btn_showG").onclick = (e) => {
  if (e.target.style.background == 'white'){
    e.target.style.background = 'orange';
    Array.from(document.getElementsByClassName('global')).forEach(g=>g.style.display = 'flex');
  } else {
    e.target.style.background = 'white';
    Array.from(document.getElementsByClassName('global')).forEach(g=>g.style.display = 'none');
  }
}
const scenes = document.getElementById('scenes');
// const spatDiv = document.getElementById('spatDiv');
const scenes_array = Array.from(scenes.children);
const resizeTel = document.getElementById('resizeTel');
resizeTel.addEventListener("input", () => {
  Array.from(document.getElementsByClassName('tel')).forEach(t=>t.style.width = `${resizeTel.value}%`);
});

const divGStats = document.getElementById('stats');

let clientS = [];
let sendChannel;
let receiveChannel;
let currentSceneNb = 1;
let currentSel = 0;
let iterKey = 0;
document.addEventListener('keydown', changeBackgroundColor);
const NVideo = 21;
const roomName = "!?ATtablee007!?";
let currentClientId;
let stopco = false;
document.getElementById("btn_stopco").onclick = ()=>{
  if (stopco){
    document.getElementById("btn_stopco").style.background = 'white';
    stopco = false;
  } else {
    document.getElementById("btn_stopco").style.background = 'red';
    stopco = true;
  }
}
let stopco2 = false;
document.getElementById("btn_stopco2").onclick = ()=>{
  if (stopco2){
    document.getElementById("btn_stopco2").style.background = 'white';
    document.getElementById("btn_stopco2").innerText = 'Disco';
    stopco2 = false;
    socket.connect();
  } else {
    document.getElementById("btn_stopco2").style.background = 'green';
    document.getElementById("btn_stopco2").innerText = 'Reco';
    stopco2 = true;
    socket.disconnect();
  }
}

let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

document.getElementById("S1_param1").addEventListener("input", (event) => {
  const data = {"scene": 1, "freq": event.target.value};
  for (let i = 0; i < clientS.length; i++){
    if (clientS[i].rtcDataSendChannel.readyState === 'open') {
      clientS[i].rtcDataSendChannel.send(JSON.stringify(data));
    }
  }
});

document.getElementById("SN_param1").addEventListener("input", (event) => {
  const data = {"scene": 6, "vol": event.target.value};
  for (let i = 0; i < clientS.length; i++){
    if (clientS[i].rtcDataSendChannel.readyState === 'open') {
      clientS[i].rtcDataSendChannel.send(JSON.stringify(data));
    }
  }
});

document.getElementById("SN_param2").addEventListener("input", (event) => {
  const data = {"scene": 6, "freeze": event.target.value};
  for (let i = 0; i < clientS.length; i++){
    if (clientS[i].rtcDataSendChannel.readyState === 'open') {
      clientS[i].rtcDataSendChannel.send(JSON.stringify(data));
    }
  }
});

document.getElementById("SN_param3").addEventListener("input", (event) => {
  const data = {"scene": 6, "gain": event.target.value};
  for (let i = 0; i < clientS.length; i++){
    if (clientS[i].rtcDataSendChannel.readyState === 'open') {
      clientS[i].rtcDataSendChannel.send(JSON.stringify(data));
    }
  }
});

document.getElementById("SN_param4").addEventListener("input", (event) => {
  const data = {"scene": 6, "fft": event.target.value};
  for (let i = 0; i < clientS.length; i++){
    if (clientS[i].rtcDataSendChannel.readyState === 'open') {
      clientS[i].rtcDataSendChannel.send(JSON.stringify(data));
    }
  }
});
//{ sinkId: "124e612f375942fd133185c04186d1a26bc79eda5e4fc75317b508430d00e4ea" }
//dd857c29f4637fcbf86c57824bb2a1a64bf64a1df8e63d004230d6cb31ccc748
let ctx;
let merger;
let bitcrusher;
let ch = 0;
let source;
let gainNode;
let analyser;
// let spatGains= [];
let cutFreq;
// let spatDiv_client;
// const NN = 300;

// 4SPAT :
// function mousemove(e) {
//   gsap.to('.spatDiv_client_selected',
//     { x: e.clientX-spatDiv.getBoundingClientRect().left-10,
//       y: e.clientY-spatDiv.getBoundingClientRect().top-10, //"+=250" -> NOTE for relative
//       duration: 2,
//       ease: "power3.inout",
//       onStart: function () {
//         gsap.ticker.fps(60);
//       },
//       onUpdate: function(){
//         const clientId = this.targets()[0].getAttribute("id").substring(7);
//         for (let i=0; i<ctx.destination.maxChannelCount; i++){
//           let value = 1/(1+Math.sqrt(Math.pow((gsap.getProperty(this.targets()[0], "x")-NN*i)*0.1,2)));
//           clientS.find(c=>c.clientId==clientId).spatGains[i].gain.value = value;
//         }
//       },
//       // repeat: -1,
//     });
// }
// function mouseup(e) {
//   document.getElementsByClassName('spatDiv_client_selected')[0].classList.remove('spatDiv_client_selected');
//   spatDiv.removeEventListener("mousemove", mousemove);
//   spatDiv.removeEventListener("mouseup", mouseup);
// }

function startContext(event) {
  //console.log(navigator.mediaDevices.enumerateDevices());
  ctx = new AudioContext();
  ctx.destination.channelInterpretation = 'discrete';
  ctx.destination.channelCount = ctx.destination.maxChannelCount;
  merger = ctx.createChannelMerger(ctx.destination.maxChannelCount);
  merger.channelInterpretation = 'discrete';
  merger.connect(ctx.destination);
  console.log("Channel number: " + ctx.destination.maxChannelCount);
  console.log(ctx);
  document.body.style.background = 'white';
  document.getElementById('btn_scene1').click();
  // 4SPAT :
  // for (let i=0; i<ctx.destination.maxChannelCount; i++){
  //   let speaker = document.createElement('div');
  //   speaker.style.left = (i*NN)+'px';
  //   // spatDiv_client.setAttribute("id", 'spatDiv'+ currentClientId);
  //   speaker.classList.add('spatDiv_speakers');
  //   spatDiv.appendChild(speaker);
  // }
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

socket.on("create", function () {
});

socket.on("offer", function (offer, clientId) {
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

  if (stopco){
    rtcPeerConnection.close();
    rtcPeerConnection = null;
    socket.emit("answer", "stopco", clientId);
    console.log('No answer sent to : ' + clientId);
  } else if (ctx) {
    currentClientId = clientId;
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
          switch(ev.currentTarget.connectionState) {
            case "new":
              console.log("New...");
              break;
            case "checking":
              console.log("Connecting…");
              break;
            case "connected":
              console.log("Online");
              clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29))).div.style.borderColor = "green";
              break;
            case "disconnected":
              console.log("Disconnecting…");
              ev.currentTarget.close();
              clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29))).div.style.borderColor = "red";
              setTimeout(()=>{removeClient(clientId);}, 30000);
              break;
            case "closed":
              console.log("Offline");
              ev.currentTarget.close();
              clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29))).div.style.borderColor = "red";
              setTimeout(()=>{removeClient(clientId);}, 30000);
              break;
            case "failed":
              console.log("Error");
              ev.currentTarget.close();
              clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29))).div.style.borderColor = "red";
              setTimeout(()=>{removeClient(clientId);}, 30000);
              break;
            default:
              console.log("Unknown");
              break;
          }
        };
        let myPeer = ctx.createMediaStreamDestination();
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
          audioCrac_myPeer: myPeer,
          // spatGains: spatGains, // 4SPAT :
        };
        clientS.push(client);
    })
    .catch((error) => {
        console.log(error);
    });
  } else {
    rtcPeerConnection.close();
    rtcPeerConnection = null;
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
  // else the socket will automatically try to reconnect
});

socket.on("connect", () => {
  socket.emit("join", roomName, 'ClintIsDead007!?');
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
    const medias = document.getElementById('medias');
    const clientdiv = document.createElement("div");
    medias.appendChild(clientdiv);
    clientdiv.setAttribute("name", 'div' + currentClientId);
    clientdiv.classList.add("tel");
    clientdiv.style.width = `${document.getElementById('resizeTel').value}%`;
    let divS = document.createElement("div");
    divS.setAttribute("name", 'divS1');
    divS.classList.add("divS");
    clientdiv.appendChild(divS);
    const audio = document.createElement("audio");
    audio.setAttribute("name", 'audio' + currentClientId); // TODO ? Why audio needed ??
    audio.controls = false;
    audio.autoplay = true;
    audio.muted = true;
    divS.appendChild(audio);
    
    if (audio.srcObject !== event.streams[0]) {
      audio.srcObject = event.streams[0];
      console.log('Received audio remote stream');
    }
    const gain = document.createElement('input');
    gain.setAttribute("name", 'input'+currentClientId);
    gain.type = 'range';
    gain.min = 0;
    gain.max = 1;
    gain.value = 1.0;
    gain.step = 0.1;
    gain.addEventListener("input", changeGain);
    divS.appendChild(gain);
    let canvas = document.createElement("canvas");
    canvas.setAttribute("name", 'canvas' + currentClientId);
    canvas.width = 250;
    divS.appendChild(canvas);
    if (ctx){
      // spatGains = [];// 4SPAT :
      source = ctx.createMediaStreamSource(event.streams[0]);
      gainNode = ctx.createGain();
      gainNode.gain.value = gain.value;
      analyser = ctx.createAnalyser();
      analyser.minDecibels = -140;
      analyser.maxDecibels = 0;

      const cutFreq_f = document.createElement('input');
      cutFreq_f.setAttribute("name", 'input'+currentClientId);
      cutFreq_f.type = 'range';
      cutFreq_f.min = 0;
      cutFreq_f.max = 22050;
      cutFreq_f.value = 0;
      cutFreq_f.step = 100;
      
      cutFreq_f.addEventListener("input", changeCutFreq)
      divS.appendChild(cutFreq_f);

      cutFreq = ctx.createBiquadFilter();
      cutFreq.frequency.value = cutFreq_f.value;
      cutFreq.type = "peaking";
      cutFreq.gain.value = -40;
      const splitter = ctx.createChannelSplitter(1);
      source.connect(splitter).connect(cutFreq).connect(gainNode).connect(analyser).connect(merger, 0, ch);

      // 4SPAT :
      // source.connect(splitter).connect(cutFreq).connect(gainNode).connect(analyser);
      // for (let i = 0; i < ctx.destination.maxChannelCount;i++){
      //   const gain = ctx.createGain();
      //   if (i == ch){
      //     gain.gain.value = 1;
      //   } else {
      //     gain.gain.value = 0;
      //   }
      //   spatGains.push(gain);
      //   analyser.connect(gain).connect(merger, 0, i);
      // }

      const btn_chan = document.createElement("div");
      divS.appendChild(btn_chan);
      for (let i=0; i<ctx.destination.maxChannelCount; i++){
        const button = document.createElement("button");
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

      // 4SPAT :
      // spatDiv_client = document.createElement('div');
      // spatDiv_client.setAttribute("id", 'spatDiv'+ currentClientId);
      // spatDiv_client.classList.add('spatDiv_client');
      // spatDiv_client.addEventListener("mousedown", mousedown);
      // spatDiv.appendChild(spatDiv_client);
    };
    let button = document.createElement("button");
    button.setAttribute("name", 'btn_id'+ currentClientId);
    button.innerText = "ID";
    button.onclick = clientResearch;
    divS.appendChild(button);
    if ((currentSel!=0)&&(currentSel!=1)) divS.style.display = 'none';

    divS = document.createElement("div");
    divS.setAttribute("name", 'divS2');
    divS.classList.add("divS");
    clientdiv.appendChild(divS);
    let videoMaster = document.getElementById("adminVideos");
    videoMaster = videoMaster.getElementsByTagName("video")[0];
    if (videoMaster != undefined){
      videoMaster.setAttribute("name", 'video' + currentClientId);
      videoMaster.classList.add('videoRTC');
      videoMaster.style.display = "inline";
      divS.appendChild(videoMaster);
      const btn_videos = document.createElement("div");
      divS.appendChild(btn_videos);
      for (let i=0;i<NVideo;i++){
        const button = document.createElement("button");
        button.setAttribute("name", 'btn'+ currentClientId);
        button.innerText = i+1;
        button.onclick = changeVid;
        btn_videos.appendChild(button);
      }
      const button = document.createElement("button");
      button.setAttribute("name", 'btn'+ currentClientId);
      button.innerText = "R";
      button.onclick = randVid;
      btn_videos.appendChild(button);
    }
    button = document.createElement("button");
    button.setAttribute("name", 'btn_id'+ currentClientId);
    button.innerText = "ID";
    button.onclick = clientResearch;
    divS.appendChild(button);
    if ((currentSel!=0)&&(currentSel!=20)&&(currentSel!=21)) divS.style.display = 'none';

    divS = document.createElement("div");
    divS.setAttribute("name", 'divS3');
    divS.classList.add("divS");
    clientdiv.appendChild(divS);
    let audioCrac= document.createElement("audio");
    audioCrac.setAttribute("name", 'audioCrac' + currentClientId);
    audioCrac.controls = true;
    audioCrac.loop = true;
    audioCrac.autoplay = false;
    audioCrac.muted = false;
    audioCrac.src = './audios/audio1.wav';
    audioCrac.controlsList="nodownload noplaybackrate";
    divS.appendChild(audioCrac);

    let audioCrac2= document.createElement("audio");
    audioCrac2.setAttribute("name", 'audioCrac2' + currentClientId);
    audioCrac2.classList.add('audioCrac2');
    audioCrac2.controls = true;
    audioCrac2.loop = true;
    audioCrac2.autoplay = false;
    audioCrac2.muted = false;
    audioCrac2.src = './audios/audio2.wav';
    audioCrac2.controlsList="nodownload noplaybackrate";
    divS.appendChild(audioCrac2);

    button = document.createElement("button");
    button.setAttribute("name", 'btn_id'+ currentClientId);
    button.innerText = "ID";
    button.onclick = clientResearch;
    divS.appendChild(button);
    if ((currentSel!=0)&&(currentSel!=3)) divS.style.display = 'none';
    
    divS = document.createElement("div");
    divS.setAttribute("name", 'divTech');
    divS.classList.add("divS");
    clientdiv.appendChild(divS);
    
    button = document.createElement("button");
    button.setAttribute("name", 'btn_id'+ currentClientId);
    button.innerText = "ID";
    button.onclick = clientResearch;
    divS.appendChild(button);
    
    const divStats = document.createElement("div");
    divStats.setAttribute("name", 'divStats'+ currentClientId);
    divS.appendChild(divStats);

    button = document.createElement("button");
    button.setAttribute("name", 'btn'+ currentClientId);
    button.innerText = "STOP";
    button.onclick = stop;
    button.style.background = "red";
    divS.appendChild(button);

    if ((currentSel!=0)&&(currentSel!=4)) divS.style.display = 'none';
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
  console.log('Received Message : ' + event.data);
  data = JSON.parse(event.data)
  let client = clientS.find(c=>c.clientId == data.clientId);
  client.div.style.background = "red";
  setTimeout(()=>{client.div.style.background = "white";}, 1000);
  if (data.mess){
    switch (data.mess){
      case 'NoMic':
        let div = Array.from(client.div.children).find(c=>c.getAttribute('name')=='divS1');
        removeAllChildNodes(div);
        const nomic = document.createTextNode("No MIC");
        div.appendChild(nomic);
      break;
      default:
        console.log('No mess');
    }
  }
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
      currentSceneNb = 1;
      for (const child of scenes.children) {
        child.style.border = 'none';
      }
      Array.from(document.getElementsByClassName('audioCrac2')).forEach(a=>a.pause());
      Array.from(document.getElementsByClassName('videoRTC')).forEach(a=>a.pause());
      break;
    case "btn_lauch":

      const scene = scenes_array.find(c=>c.style.background == 'orange');
      if (scene){
        for (const child of scenes.children) {
          child.style.border = 'none';
        }
        switch (scene.getAttribute('id')){
          case "btn_scene1":
            currentSceneNb = 1;
            data = {"scene": currentSceneNb};
            scene.style.border = 'solid';
            scene.style.borderColor = 'red';
            Array.from(document.getElementsByClassName('audioCrac2')).forEach(a=>a.pause());
            Array.from(document.getElementsByClassName('videoRTC')).forEach(a=>a.pause());
            break;
          case "btn_scene20":
            currentSceneNb = 20;
            data = {"scene": currentSceneNb};
            scene.style.border = 'solid';
            scene.style.borderColor = 'red';
            Array.from(document.getElementsByClassName('audioCrac2')).forEach(a=>a.pause());
            Array.from(document.getElementsByClassName('videoRTC')).forEach(a=>a.play());
            break;
          case "btn_scene21":
            currentSceneNb = 21;
            data = {"scene": currentSceneNb};
            scene.style.border = 'solid';
            scene.style.borderColor = 'red';
            Array.from(document.getElementsByClassName('audioCrac2')).forEach(a=>a.pause());
            Array.from(document.getElementsByClassName('videoRTC')).forEach(a=>a.pause());
            break;
          case "btn_scene21_random":
            currentSceneNb = 5;
            data = {"scene": currentSceneNb};
            scene.style.border = 'solid';
            scene.style.borderColor = 'red';
            Array.from(document.getElementsByClassName('audioCrac2')).forEach(a=>a.pause());
            Array.from(document.getElementsByClassName('videoRTC')).forEach(a=>a.pause());
            break;
          case "btn_scene3":
            // data = {"scene": 6};
            currentSceneNb = 3;
            data = {"scene": currentSceneNb};
            scene.style.border = 'solid';
            scene.style.borderColor = 'red';
            Array.from(document.getElementsByClassName('videoRTC')).forEach(a=>a.pause());
            change2Crac();
            break;
          case "btn_scene6":
            data = {"scene": 6};
            currentSceneNb = 6;
            data = {"scene": currentSceneNb};
            scene.style.border = 'solid';
            scene.style.borderColor = 'red';
            Array.from(document.getElementsByClassName('audioCrac2')).forEach(a=>a.pause());
            Array.from(document.getElementsByClassName('videoRTC')).forEach(a=>a.pause());
            break;
          case "btn_sceneTHEEND":
            data = {"scene": 7};
            currentSceneNb = 7;
            data = {"scene": currentSceneNb};
            scene.style.border = 'solid';
            scene.style.borderColor = 'red';
            Array.from(document.getElementsByClassName('audioCrac2')).forEach(a=>a.pause());
            Array.from(document.getElementsByClassName('videoRTC')).forEach(a=>a.pause());
            break;
          case "btn_sceneWAIT":
            data = {"scene": 8};
            currentSceneNb = 8;
            data = {"scene": currentSceneNb};
            scene.style.border = 'solid';
            scene.style.borderColor = 'red';
            Array.from(document.getElementsByClassName('audioCrac2')).forEach(a=>a.pause());
            Array.from(document.getElementsByClassName('videoRTC')).forEach(a=>a.pause());
            break;
          default:
            alert('Sélectionne une scène ! (1)');
            break;
        }
      } else {
        alert('Sélectionne une scène ! (2)');
      }

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
  if (readyState == 'open'){
    sendChannel.send(JSON.stringify({"scene":  currentSceneNb}));
    if (currentSceneNb == 3) change2Crac();
  }
}

function onSendChannelMessageCallback(event) {
  console.log('Message sent');
}

function change2Crac(){
  // let audioCrac2 = document.getElementsByName('audioCrac2' + clientS[0].clientId)[0];
  // let audioSource2 = ctx.createMediaElementSource(audioCrac2);
  Array.from(document.getElementsByClassName('audioCrac2')).forEach(a=>a.play());
  clientS.forEach((client)=>{
    try {
      if (client.rtcPeerConnection.connectionState !== "closed"){
        let audioCrac = document.getElementsByName('audioCrac' + client.clientId)[0];
        let audioSource = ctx.createMediaElementSource(audioCrac);
        audioSource.connect(client.audioCrac_myPeer);
        let audioCrac2 = document.getElementsByName('audioCrac2' + client.clientId)[0];
        let audioSource2 = ctx.createMediaElementSource(audioCrac2);
        audioSource2.connect(client.audioCrac_myPeer);
        audioCrac2.playbackRate = Math.random() + 1;
        audioCrac2.play();
        let audioSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === "audio");
        audioSender.replaceTrack(client.audioCrac_myPeer.stream.getTracks()[0]);
        let videoSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === "video");
        client.rtcPeerConnection.removeTrack(videoSender);
      }
    } catch(err){
      console.log(err);
    }
  });
}

function randVid(event){
  const clientId = event.target.name.substring(3);
  const scene = scenes_array.find(c=>c.style.background == 'orange');
  if (scene){
    switch (scene.getAttribute('id')){
      case "btn_scene20":
        break;
      case "btn_scene21":
        data = {"scene": 21, "video": event.target.innerText};
        const client = clientS.find(c=>c.clientId == clientId);
        if (client.rtcDataSendChannel.readyState === 'open') {
          client.rtcDataSendChannel.send(JSON.stringify(data));
        }
    }
  }
}

function changeVid(event){
  for (const child of event.target.parentElement.children) {
    child.style.background = 'white';
  }
  event.target.style.background = 'green';
  const clientId = event.target.name.substring(3);
  const scene = scenes_array.find(c=>c.style.background == 'orange');
  if (scene){
    switch (scene.getAttribute('id')){
      case "btn_scene20":
        let videoelement = document.getElementsByName('video' + clientId)[0];
        videoelement.src = './videosNEW/video'+event.target.innerText+'.mp4';
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
        break;
      case "btn_scene21":
        const data = {"scene": 21, "video": event.target.innerText};
        console.log(data);
        const client = clientS.find(c=>c.clientId == clientId);
        if (client.rtcDataSendChannel.readyState === 'open') {
          client.rtcDataSendChannel.send(JSON.stringify(data));
        }
    }
  }
}

function changeScene(event){
  if (event.target.style.background == 'orange'){
    event.target.style.background = 'yellow';
    document.getElementsByName('divS1').forEach(d=>d.style.display='flex');
    document.getElementsByName('divS2').forEach(d=>d.style.display='flex');
    document.getElementsByName('divS3').forEach(d=>d.style.display='flex');
    document.getElementsByName('divTech').forEach(d=>d.style.display='flex');
    currentSel = 0;
    } else {
    for (const child of scenes.children) {
      child.style.background = 'yellow';
    }
    event.target.style.background = 'orange';
    switch (event.target.getAttribute('id')){
      case "btn_scene1":
        document.getElementsByName('divS1').forEach(d=>d.style.display='flex');
        document.getElementsByName('divS2').forEach(d=>d.style.display='none');
        document.getElementsByName('divS3').forEach(d=>d.style.display='none');
        document.getElementsByName('divTech').forEach(d=>d.style.display='none');
        currentSel = 1;
        break;
      case "btn_scene20":
        document.getElementsByName('divS1').forEach(d=>d.style.display='none');
        document.getElementsByName('divS2').forEach(d=>d.style.display='flex');
        document.getElementsByName('divS3').forEach(d=>d.style.display='none');
        document.getElementsByName('divTech').forEach(d=>d.style.display='none');
        currentSel = 20;
        break;
      case "btn_scene21":
        document.getElementsByName('divS1').forEach(d=>d.style.display='none');
        document.getElementsByName('divS2').forEach(d=>d.style.display='flex');
        document.getElementsByName('divS3').forEach(d=>d.style.display='none');
        document.getElementsByName('divTech').forEach(d=>d.style.display='none');
        currentSel = 21;
        break;
      case "btn_scene3":
        document.getElementsByName('divS1').forEach(d=>d.style.display='none');
        document.getElementsByName('divS2').forEach(d=>d.style.display='none');
        document.getElementsByName('divS3').forEach(d=>d.style.display='flex');
        document.getElementsByName('divTech').forEach(d=>d.style.display='none');
        currentSel = 3;
        break;
      case "btn_scene6":
        document.getElementsByName('divS1').forEach(d=>d.style.display='flex');
        document.getElementsByName('divS2').forEach(d=>d.style.display='none');
        document.getElementsByName('divS3').forEach(d=>d.style.display='none');
        document.getElementsByName('divTech').forEach(d=>d.style.display='none');
        currentSel = 1;
        break;
      case "btn_sceneTHEEND":
        document.getElementsByName('divS1').forEach(d=>d.style.display='flex');
        document.getElementsByName('divS2').forEach(d=>d.style.display='none');
        document.getElementsByName('divS3').forEach(d=>d.style.display='none');
        document.getElementsByName('divTech').forEach(d=>d.style.display='none');
        currentSel = 1;
        break;
      case "btn_tech":
        document.getElementsByName('divS1').forEach(d=>d.style.display='none');
        document.getElementsByName('divS2').forEach(d=>d.style.display='none');
        document.getElementsByName('divS3').forEach(d=>d.style.display='none');
        document.getElementsByName('divTech').forEach(d=>d.style.display='flex');
        currentSel = 4;
        break;
      case "btn_sceneWAIT":
        document.getElementsByName('divS1').forEach(d=>d.style.display='flex');
        document.getElementsByName('divS2').forEach(d=>d.style.display='none');
        document.getElementsByName('divS3').forEach(d=>d.style.display='none');
        document.getElementsByName('divTech').forEach(d=>d.style.display='none');
        currentSel = 1;
        break;
    }
  }
}

function changeChan(event){
  const clientId = event.target.name.substring(3);
  let client = clientS.find(t=>t.clientId==clientId);
  client.analyser.disconnect(0);
  client.analyser.connect(merger, 0, parseInt(event.target.innerText)-1);
  // for (let i = 0; i<client.spatGains.length; i++){ 
  //   if (i == parseInt(event.target.innerText)-1){
  //     client.spatGains[i].gain.exponentialRampToValueAtTime(1.0, ctx.currentTime + 2);
  //   } else {
  //     client.spatGains[i].gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
  //   }
  // }
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
}

function stop(event){
  const clientId = event.target.name.substring(3);
  removeClient(clientId);
}

function clientResearch(event){
  const clientId = event.target.name.substring(6);
  const client = clientS.find(c=>c.clientId == clientId);
  if (client.rtcDataSendChannel.readyState === 'open') {
    const data = {"id": clientId};
    client.rtcDataSendChannel.send(JSON.stringify(data));
  }
}

function removeClient(clientId){
  let client = clientS.find(t=>t.clientId==clientId);
  let ind = clientS.findIndex(t=>t.clientId==clientId);
  try{
    client.rtcDataSendChannel.close();
    client.rtcPeerConnection.close();
    client.rtcPeerConnection = null;
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
  clientS.filter(c=>c.rtcPeerConnection.connectionState!=='connected').forEach(c=>removeClient(c.clientId));
  console.log(clientS);
}

function changeBackgroundColor(event){
  if  (event.code == "Space"){
    let randNumber = Math.max(Math.round(Math.random()*clientS.length), 1);
    try {
      const data = {"scene": 4};
      for (let i = 0; i < randNumber; i++){
        let datachan = clientS[(iterKey+i) % clientS.length].rtcDataSendChannel;
        let audioCrac = document.getElementsByName('audioCrac'+clientS[(iterKey+i) % clientS.length].clientId)[0];
        if (datachan.readyState === 'open') {
          datachan.send(JSON.stringify(data));
          audioCrac.playbackRate = Math.random()+0.1;
          audioCrac.play();
          setTimeout(()=>{audioCrac.pause()}, 2000);
        } else {
          audioCrac.pause();
        }
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
  // console.log(event.data);
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
	// logger(keyData, 'key data', data);

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
  } else if (note == 60){
      if (velocity==80){
        const scene = scenes_array.find(c=>c.style.background == 'orange');
        if ((scene==undefined)||(scene.getAttribute("id")!=="btn_scene6")){
          document.getElementById("btn_scene6").click();
        }
        document.getElementById("btn_lauch").click();
    } else {
      document.getElementById("btn_scene1").click();
      document.getElementById("btn_lauch").click();
    }
  } else if ((note == 41)&&(velocity==127)){
      document.getElementById("btn_lauch").click();
  } else if ((note == 59)&&(velocity==127)){
      const scenes = Array.from(document.getElementsByClassName('scene'));
      const index = scenes.findIndex(c=>c.style.background == 'orange');
      console.log(index);
      if ((index>-1)&&(index<scenes_array.length-2)){
        scenes[index+1].click();
      }
    } else if ((note == 58)&&(velocity==127)){
      const scenes = Array.from(document.getElementsByClassName('scene'));
      const index = scenes.findIndex(c=>c.style.background == 'orange');
      if ((index>0)&&(index<scenes_array.length-1)){
        scenes[index-1].click();
      }
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