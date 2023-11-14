/*
 * Copyright 2016 Boris Smus. All Rights Reserved.

 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Adapted from Boris Smus's demo at http://webaudioapi.com/samples/visualizer

/* globals AudioContext, webkitAudioContext */

//const WIDTH = 300;
//const HEIGHT = 100;

// Interesting parameters to tweak!
const SMOOTHING = 0.0;
const FFT_SIZE = 256;

function StreamVisualizer4Clients(analyser, canvas, doSound) {
  //console.log('Creating StreamVisualizer with remoteStream and canvas: ', remoteStream, canvas);
  this.canvas = canvas;
  this.drawContext = this.canvas.getContext('2d');
  this.analyser = analyser;

  //this.freqs = new Uint8Array(this.analyser.frequencyBinCount);
  this.times = new Uint8Array(this.analyser.frequencyBinCount);

  this.startTime = 0;
  this.startOffset = 0;
}

StreamVisualizer4Clients.prototype.start = function() {
  requestAnimationFrame(this.draw.bind(this));
};

StreamVisualizer4Clients.prototype.draw = function() {
  let barWidth;
  let offset;
  let height;
  let percent;
  let value;
  this.analyser.smoothingTimeConstant = SMOOTHING;
  this.analyser.fftSize = FFT_SIZE;

  // Get the frequency data from the currently playing music
  //this.analyser.getByteFrequencyData(this.freqs);
  this.analyser.getByteTimeDomainData(this.times);


  //this.canvas.width = WIDTH;
  //this.canvas.height = HEIGHT;
  this.drawContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
  // Draw the frequency domain chart.
  // for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
  //   value = this.freqs[i];
  //   percent = value / 256;
  //   height = this.canvas.height * percent;
  //   offset = this.canvas.height - height - 1;
  //   barWidth = this.canvas.width / this.analyser.frequencyBinCount;
  //   let hue = i/this.analyser.frequencyBinCount * 360;
  //   this.drawContext.fillStyle = 'hsl(' + hue + ', 100%, 50%)';
  //   this.drawContext.fillRect(i * barWidth, offset, barWidth, height);
  // }

  
  // Draw the time domain chart.
  for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
    value = this.times[i];
    percent = value / 256;
    height = this.canvas.height * percent;
    offset = this.canvas.height - height - 1;
    barWidth = this.canvas.width/this.analyser.frequencyBinCount;
    this.drawContext.fillStyle = 'white';
    this.drawContext.fillRect(i * barWidth, offset, 5, 2);
  }

  requestAnimationFrame(this.draw.bind(this));
};