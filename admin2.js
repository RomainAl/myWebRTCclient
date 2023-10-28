//const socket = io.connect("https://maman-jk7dceleka-od.a.run.app");
//const socket = io.connect("https://maman2-jk7dceleka-od.a.run.app");
const socket = io.connect("https://mywrtc-ro5o23vkzq-od.a.run.app");
console.log("lulu ok");
//const socket = io.connect("https://192.168.10.2:1337");


const btn_start = document.getElementById('btn_start');
const btn_reload = document.getElementById('btn_reload');
const btn_reco = document.getElementById('btn_reco');
const btn_scene1 = document.getElementById('btn_scene1');
const btn_scene2 = document.getElementById('btn_scene2');
const btn_scene3 = document.getElementById('btn_scene3');

btn_start.onclick = startContext;
btn_reload.onclick = sendData;
btn_reco.onclick = sendData;
btn_scene1.onclick = sendData;
btn_scene2.onclick = sendData;
btn_scene3.onclick = sendData;

const divGStats = document.getElementById('stats');

let clientS = [];
let sendChannel;
let receiveChannel;

let iterKey = 0;
document.addEventListener('keydown', changeBackgroundColor);

const roomName = "atablee";
let currentClientId;

let iceServers = {
  iceServers: [
    { urls: "stun:stun.services.mozilla.com" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
};

console.log(navigator.mediaDevices.enumerateDevices());

//{ sinkId: "124e612f375942fd133185c04186d1a26bc79eda5e4fc75317b508430d00e4ea" }
//dd857c29f4637fcbf86c57824bb2a1a64bf64a1df8e63d004230d6cb31ccc748
let ctx;
let merger;
let bitcrush;
let ch = 0;
let source;
let audio;
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

//source = new Tone.Player("https://s3-us-west-1.amazonaws.com/leesamples/samples/Natural+Sounds/Birdsong.mp3").connect(bitcrush); 

function startContext(event) {
  
  //merger.channelInterpretation = 'discrete';
  console.log(ctx);
  Tone.start();

  console.log(source);
}

socket.emit("join", roomName, true);

/*socket.on("create", function (id) {
  currentAdminId = id;
});*/

socket.on("create", function () {
});

socket.on("offer", function (offer, clientId) {

  currentClientId = clientId;
  console.log('Offer receive from = '+clientId);
  //let videoelement = document.getElementById("adminVideos");
  //videoelement = videoelement.getElementsByTagName("video")[0];
  //let adminStream = videoelement.captureStream();
  let rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
  rtcPeerConnection.ontrack = OnTrackFunction;
  rtcPeerConnection.setRemoteDescription(offer);
  //adminStream.getTracks().forEach((track) => rtcPeerConnection.addTrack(track, adminStream));
  //rtcPeerConnection.ondatachannel = receiveChannelCallback;
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
        //client = clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29)));
        //client.div.style.borderColor = "green";
        break;
      case "disconnected":
        console.log("Disconnecting…");
        //client = clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29)));
        //client.div.style.borderColor = "red";
        //removeClient(clientId);
        //ev.currentTarget.close();
        break;
      case "closed":
        console.log("Offline");
        break;
      case "failed":
        console.log("Error");
        //client = clientS.find(t=>t.rtcPeerCoID.includes(ev.currentTarget.remoteDescription.sdp.slice(9, 29)));
        //client.div.style.borderColor = "red";
        //ev.currentTarget.close();
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
      console.log('answer sent to : ' + clientId);
      //sendChannel = rtcPeerConnection.createDataChannel('mySceneName');
      /*sendChannel.onopen = onSendChannelStateChange;
      sendChannel.onmessage = onSendChannelMessageCallback;
      sendChannel.onclose = onSendChannelStateChange;*/
      let client = {
        //rtcDataSendChannel: sendChannel,
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
    audio = document.createElement("audio");
    audio.setAttribute("name", 'audio' + currentClientId);
    audio.controls = true;
    audio.autoplay = true;
    audio.muted = false;
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
    gainNode = new Tone.Gain(gain.value)
    analyser = new Tone.Analyser();
    analyser.minDecibels = -140;
    analyser.maxDecibels = 0;
    bitcrush = new Tone.BitCrusher(1).toDestination();
    let cutFreq_f = document.createElement('input');
    cutFreq_f.setAttribute("name", 'input'+currentClientId);
    cutFreq_f.type = 'range';
    cutFreq_f.min = 0;
    cutFreq_f.max = 22050;
    cutFreq_f.value = 0;
    cutFreq_f.step = 100;
    
    cutFreq_f.onchange = changeCutFreq;
    clientdiv.appendChild(cutFreq_f);

    /*cutFreq = ctx.createBiquadFilter();
    cutFreq.frequency.value = cutFreq_f.value;
    cutFreq.type = "peaking";
    cutFreq.gain.value = -40;*/

    /*const splitter = ctx.createChannelSplitter(1);
    source.connect(splitter).connect(cutFreq).connect(gainNode).connect(analyser).connect(merger, 0, ch);*/
    //source.connect(gainNode).connect(analyser).connect(merger, 0, ch);
    let btn_chan = document.createElement("div");
    clientdiv.appendChild(btn_chan);
    /*for (let i=0; i<ctx.destination.maxChannelCount; i++){
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
    ch = ch % ctx.destination.maxChannelCount;*/
    //const streamVisualizer = new MyWebAudio(source, analyser, canvas, false);
    //streamVisualizer.start();

    //let videoMaster = document.getElementById("adminVideos");
    /*videoMaster = videoMaster.getElementsByTagName("video")[0];
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
    }*/

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
  bitcrush = new Tone.BitCrusher(1).toDestination();
  source = Tone.context.createMediaElementSource(audio).connect(bitcrush);
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