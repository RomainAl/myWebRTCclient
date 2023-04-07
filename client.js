const socket = io.connect("https://192.168.1.42:1337");

let userCanvas = document.getElementById("canvas");
let adminVideo = document.getElementById("video");
let webgl = document.getElementById("webgl");
let fullscreen = document.getElementById("fullscreen");
fullscreen.onclick = toggleFullScreen;
mywebgl(webgl);

let roomName = "test";
let rtcPeerConnection;
let receiveChannel;
let sendChannel;
let userStream;
let adminStream;

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

socket.emit("join", roomName, false);

// Triggered when a room is succesfully created.
socket.on("create", function () {
  //console.log(navigator.mediaDevices.enumerateDevices())
  //navigator.wakeLock.request("screen").then(lock => {setTimeout(()=>Lock.release(), 10*60*1000)});
  navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: false,
    })
    .then(function (stream) {
      /* use the stream */
      userStream = stream;
      const audioTracks = userStream.getAudioTracks();
      if (audioTracks.length > 0) {
        console.log(`Using Audio device: ${audioTracks[0].label}`);
      }
      const streamVisualizer4Clients = new StreamVisualizer4Clients(stream, canvas, false);
      streamVisualizer4Clients.start();

    })
    .catch(function (err) {
      /* handle the error */
      alert(`getUserMedia() error: ${err.name}`);
      console.log(err);
    })
    .then(function(){
      rtcPeerConnection = new RTCPeerConnection(iceServers);
      rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
      rtcPeerConnection.ontrack = OnTrackFunction;
      //userStream.getTracks().forEach(track => rtcPeerConnection.addTrack(track, userStream));
      console.log('Adding Local Stream to peer connection');
      // rtcPeerConnection = new RTCPeerConnection(iceServers);
      // rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
      // rtcPeerConnection.ontrack = OnTrackFunction;
      rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
      sendChannel = rtcPeerConnection.createDataChannel('mySceneName');
      sendChannel.onopen = onSendChannelStateChange;
      sendChannel.onmessage = onSendChannelMessageCallback;
      sendChannel.onclose = onSendChannelStateChange;
      rtcPeerConnection.ondatachannel = receiveChannelCallback;
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
      //rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
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


// Triggered on receiving an ice candidate from the peer.

socket.on("candidate", function (candidate) {
  let icecandidate = new RTCIceCandidate(candidate);
  rtcPeerConnection.addIceCandidate(icecandidate);
});


// Triggered on receiving an answer from the person who joined the room.

socket.on("answer", function (answer) {
  rtcPeerConnection.setRemoteDescription(answer);
});

// Implementing the OnIceCandidateFunction which is part of the RTCPeerConnection Interface.

function OnIceCandidateFunction(event) {
  console.log("Candidate");
  //console.log(event.candidate);
  if (event.candidate) {
    socket.emit("candidate", event.candidate, roomName);
  }
}

// Implementing the OnTrackFunction which is part of the RTCPeerConnection Interface.
function OnTrackFunction(event) {
  // Attention need a video to have a sound
  if (event.track.kind === 'video'){
    adminVideo.volume = 1;
    adminVideo.srcObject = event.streams[0];
    adminVideo.onloadedmetadata = function (e) {
      adminVideo.play();
    };
    adminVideo.style.display = "none";
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
  switch (JSON.parse(event.data).scene){
    case 1:
      adminVideo.style.display = "none";
      userCanvas.style.display = "initial";
      webgl.style.display = "none";
      break;
    case 2:
      userCanvas.style.display = "none";
      adminVideo.style.display = "initial";
      webgl.style.display = "none";
      break;
    case 3:
      adminVideo.style.display = "none";
      userCanvas.style.display = "none";
      webgl.style.display = "initial";
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

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    toggleFullScreen();
  }
}, false);

function toggleFullScreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    let myScreenOrientation = window.screen.orientation;
    myScreenOrientation.lock("portrait-primary");
  } else if (document.exitFullscreen) {
    document.exitFullscreen();
  }
}

function mywebgl(canvas) {
  // Initialize the GL context
  const gl = canvas.getContext("webgl2");

  // Only continue if WebGL is available and working
  if (gl === null) {
    alert(
      "Unable to initialize WebGL. Your browser or machine may not support it."
    );
    return;
  }

  const vs = `#version 300 es
    // an attribute is an input (in) to a vertex shader.
    // It will receive data from a buffer
    in vec4 a_position;

    // all shaders have a main function
    void main() {

      // gl_Position is a special variable a vertex shader
      // is responsible for setting
      gl_Position = a_position;
    }
  `;

  const fs = `#version 300 es
    precision highp float;

    uniform vec2 iResolution;
    uniform vec2 iMouse;
    uniform float iTime;

    // we need to declare an output for the fragment shader
    out vec4 outColor;

    #define PI     3.14159265358
    #define TWO_PI 6.28318530718
    
    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {
        float time = iTime * 1.;									// adjust time
        vec2 uv = (2. * fragCoord - iResolution.xy) / iResolution.y;	// center coordinates
        float rads = atan(uv.x, uv.y);                   				// get radians to center
      float dist = length(uv);										// store distance to center
        float spinAmp = 4.;												// set spin amplitude
        float spinFreq = 2. + sin(time) * 0.5;							// set spin frequency
        rads += sin(time + dist * spinFreq) * spinAmp;					// wave based on distance + time
        float radialStripes = 10.;										// break the circle up
        float col = 0.5 + 0.5 * sin(rads * radialStripes);				// oscillate color around the circle
      col = smoothstep(0.5,0.6, col);									// remap color w/smoothstep to remove blurriness
        col -= dist / 2.;												// vignette - reduce color w/distance
        fragColor = vec4(vec3(col), 1.);
    }

    void main() {
      mainImage(outColor, gl_FragCoord.xy);
    }
  `;

  // setup GLSL program
  const program = webglUtils.createProgramFromSources(gl, [vs, fs]);

  // look up where the vertex data needs to go.
  const positionAttributeLocation = gl.getAttribLocation(program, "a_position");

  // look up uniform locations
  const resolutionLocation = gl.getUniformLocation(program, "iResolution");
  const mouseLocation = gl.getUniformLocation(program, "iMouse");
  const timeLocation = gl.getUniformLocation(program, "iTime");

  // Create a vertex array object (attribute state)
  const vao = gl.createVertexArray();

  // and make it the one we're currently working with
  gl.bindVertexArray(vao);

  // Create a buffer to put three 2d clip space points in
  const positionBuffer = gl.createBuffer();

  // Bind it to ARRAY_BUFFER (think of it as ARRAY_BUFFER = positionBuffer)
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // fill it with a 2 triangles that cover clip space
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1,  // first triangle
     1, -1,
    -1,  1,
    -1,  1,  // second triangle
     1, -1,
     1,  1,
  ]), gl.STATIC_DRAW);

  // Turn on the attribute
  gl.enableVertexAttribArray(positionAttributeLocation);

  // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
  gl.vertexAttribPointer(
      positionAttributeLocation,
      2,          // 2 components per iteration
      gl.FLOAT,   // the data is 32bit floats
      false,      // don't normalize the data
      0,          // 0 = move forward size * sizeof(type) each iteration to get the next position
      0,          // start at the beginning of the buffer
  );


  canvas.addEventListener('mouseover', requestFrame);
  canvas.addEventListener('mouseout', cancelFrame);

  let mouseX = 0;
  let mouseY = 0;

  function setMousePosition(e) {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = rect.height - (e.clientY - rect.top) - 1;  // bottom is 0 in WebGL
  }

  canvas.addEventListener('mousemove', setMousePosition);
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    //playpauseElem.classList.add('playpausehide');
    requestFrame();
  }, {passive: false});
  canvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    setMousePosition(e.touches[0]);
  }, {passive: false});
  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    //playpauseElem.classList.remove('playpausehide');
    cancelFrame();
  }, {passive: false});

  let requestId;
  function requestFrame() {
    if (!requestId) {
      requestId = requestAnimationFrame(render);
    }
  }
  function cancelFrame() {
    if (requestId) {
      cancelAnimationFrame(requestId);
      requestId = undefined;
    }
  }

  let then = 0;
  let time = 0;
  function render(now) {
    requestId = undefined;
    now *= 0.001;  // convert to seconds
    const elapsedTime = Math.min(now - then, 0.1);
    time += elapsedTime;
    then = now;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
    gl.uniform2f(mouseLocation, mouseX, mouseY);
    gl.uniform1f(timeLocation, time);

    gl.drawArrays(
        gl.TRIANGLES,
        0,     // offset
        6,     // num vertices to process
    );

    requestFrame();
  }

  requestFrame();
  requestAnimationFrame(cancelFrame);
}