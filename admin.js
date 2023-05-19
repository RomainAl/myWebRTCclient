const socket = io.connect("https://192.168.1.42:1337");

const adminVideo = document.getElementById("adminVideo");
const adminVideo2 = document.getElementById("adminVideo2");
const adminVideo3 = document.getElementById("adminVideo3");
const btn_reload = document.getElementById('btn_reload');
const btn_scene1 = document.getElementById('btn_scene1');
const btn_scene2 = document.getElementById('btn_scene2');
const btn_scene3 = document.getElementById('btn_scene3');
const btn_changevideo = document.getElementById('btn_changevideo');

btn_reload.onclick = sendData;
btn_scene1.onclick = sendData;
btn_scene2.onclick = sendData;
btn_scene3.onclick = sendData;
btn_changevideo.onclick = changeVid;

let admincount = 0;
let clientS = [];
let sendChannel;
let receiveChannel;
let adminStream;

const NVideo = 8;
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

  if (admincount == 0){
    adminStream = adminVideo.captureStream();
    admincount++;
  } else if (admincount == 1) {
    adminStream = adminVideo2.captureStream();
    admincount++;
  } else {
    adminStream = adminVideo3.captureStream();
  }

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
      socket.emit("candidate", event.candidate, roomName);
    }
  }
  
// Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.
function OnTrackFunction(event) {
  console.log(event);
  if (event.track.kind === 'audio'){
    /*let medias = document.getElementById('medias');
    let audio = document.getElementsByName('audio'+currentClientId);
    if (audio.length == 0){
      audio = document.createElement("audio");
      audio.setAttribute("name", 'audio'+currentClientId);
      audio.controls = true;
      audio.autoplay = true;
      medias.appendChild(audio);
    }
    if (audio.srcObject !== event.streams[0]) {
      audio.srcObject = event.streams[0];
      console.log('Received remote stream');
    }
    let canvass = document.getElementById('canvass');
    let canvas = document.getElementsByName(currentClientId);
    if (canvas.length == 0){
      canvas = document.createElement("canvas");
      canvas.setAttribute("name", 'canvas'+currentClientId)
      canvass.appendChild(canvas);
    }
    const streamVisualizer = new StreamVisualizer(event.streams[0], canvas, false);
    streamVisualizer.start();*/
    let medias = document.getElementById('medias');
    let clientdiv = document.createElement("div");
    medias.appendChild(clientdiv);
    clientdiv.setAttribute("name", 'div' + currentClientId);
    audio = document.createElement("audio");
    audio.setAttribute("name", 'audio' + currentClientId);
    audio.controls = true;
    audio.autoplay = true;
    clientdiv.appendChild(audio);
    
    if (audio.srcObject !== event.streams[0]) {
      audio.srcObject = event.streams[0];
      console.log('Received remote stream');
    }
    canvas = document.createElement("canvas");
    canvas.setAttribute("name", 'canvas' + currentClientId)
    clientdiv.appendChild(canvas);
    const streamVisualizer = new StreamVisualizer(event.streams[0], canvas, false);
    streamVisualizer.start();
    //let videoMaster = document.getElementById("adminVideo");
    let videoMaster = document.getElementById("adminVideos");
    videoMaster = videoMaster.getElementsByTagName("video")[0];
    if (videoMaster != undefined){
      videoMaster.setAttribute("name", 'video' + currentClientId);
      clientdiv.appendChild(videoMaster);
      for (i=0;i<NVideo;i++){
        let button = document.createElement("button");
        button.setAttribute("name", 'btn'+ currentClientId);
        button.innerText = i+1;
        button.onclick = changeVid2;
        clientdiv.appendChild(button);
      }
    }
  };
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
      parent.removeChild(parent.firstChild);
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
      adminVideo.pause();
      adminVideo.volume = 0;
      adminVideo2.pause();
      adminVideo2.volume = 0;
      adminVideo3.pause();
      adminVideo3.volume = 0;
      break;
    case "btn_scene2":
      data = {"scene": 2};
      adminVideo.play();
      adminVideo.volume = 1;
      adminVideo2.play();
      adminVideo2.volume = 1;
      adminVideo3.play();
      adminVideo3.volume = 1;
      break;
    case "btn_scene3":
      data = {"scene": 3};
      adminVideo.pause();
      adminVideo.volume = 0;
      adminVideo2.pause();
      adminVideo2.volume = 0;
      adminVideo3.pause();
      adminVideo3.volume = 0;
      break;
    default:
      console.log("Error : no scene found !")
  }
  
  for (i = 0; i < clientS.length; i++){
    if (clientS[i].rtcDataSendChannel.readyState === 'open') {
      clientS[i].rtcDataSendChannel.send(JSON.stringify(data));
    }
  }
  console.log('Sent Data: ' + data);
}

function onSendChannelStateChange() {
  const readyState = sendChannel.readyState;
  console.log('Send channel state is: ' + readyState);
}

function onSendChannelMessageCallback(event) {
  console.log('Received Message');
}

function changeVid(event){
  //console.log(event);
  adminVideo.src = "./videos/video2__.mp4";
  adminVideo.type="video/mp4";
  adminVideo.play()
  .then(() => {
    adminStream = adminVideo.captureStream()
    const [videoTrack] = adminStream.getVideoTracks();
    let videoSender = clientS[0].rtcPeerConnection.getSenders().find((s) => s.track.kind === videoTrack.kind);
    videoSender.replaceTrack(videoTrack);
    const [audioTrack] = adminStream.getAudioTracks();
    let audioSender = clientS[0].rtcPeerConnection.getSenders().find((s) => s.track.kind === audioTrack.kind);
    audioSender.replaceTrack(audioTrack);
    });
}

function changeVid2(event){
  const clientId = event.target.name.substring(3);
  let videoelement = document.getElementsByName('video' + clientId)[0];
  videoelement.src = './videos/video0'+event.target.innerText+'.mp4';
  videoelement.type="video/mp4";
  videoelement.play()
  .then(() => {
    adminStream = videoelement.captureStream()
    const [videoTrack] = adminStream.getVideoTracks();
    let client = clientS.find(t=>t.clientId==clientId);
    let videoSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === videoTrack.kind);
    videoSender.replaceTrack(videoTrack);
    const [audioTrack] = adminStream.getAudioTracks();
    let audioSender = client.rtcPeerConnection.getSenders().find((s) => s.track.kind === audioTrack.kind);
    audioSender.replaceTrack(audioTrack);
    });
}