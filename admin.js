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

let clientS = [];
let adminStream;
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

socket.emit("join", roomName, true);

socket.on("create", function () {
});

socket.on("offer", function (offer, clientId) {

  //console.log(navigator.mediaDevices.enumerateDevices());
  currentClientId = clientId;
  let videoelement = document.getElementById("adminVideos");
  videoelement = videoelement.getElementsByTagName("video")[0];
  adminStream = videoelement.captureStream();
  console.log(adminStream);
  let rtcPeerConnection = new RTCPeerConnection(iceServers);
  rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
  rtcPeerConnection.ontrack = OnTrackFunction;
  rtcPeerConnection.setRemoteDescription(offer);
  adminStream.getTracks().forEach((track) => rtcPeerConnection.addTrack(track, adminStream));
  rtcPeerConnection.ondatachannel = receiveChannelCallback;
  rtcPeerConnection.onconnectionstatechange = (ev) => {
    console.log(ev);
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
    let medias = document.getElementById('medias');
    let clientdiv = document.createElement("div");
    medias.appendChild(clientdiv);
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