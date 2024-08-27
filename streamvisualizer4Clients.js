// TODO -> Module or Class !!!
const SMOOTHING = 1.0;
const FFT_SIZE = 512;

function StreamVisualizer4Clients(analyser, canvas) {
  this.canvas = canvas;
  this.drawContext = this.canvas.getContext('2d');
  this.analyser = analyser;
  this.mycolor = 'white';
  this.rectSize = 8;
  this.gain = 1.0;
  this.analyser.fftSize = FFT_SIZE;
  this.analyser.smoothingTimeConstant = SMOOTHING;
  this.times = new Uint8Array(this.analyser.frequencyBinCount);
  this.startTime = 0;
  this.startOffset = 0;
}

StreamVisualizer4Clients.prototype.start = function() {
  this.myAnim = requestAnimationFrame(this.draw.bind(this));
};

StreamVisualizer4Clients.prototype.stop = function() {
  cancelAnimationFrame(this.myAnim);
  this.drawContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
};

StreamVisualizer4Clients.prototype.setColor = function(col) {
  this.mycolor = col;
};

StreamVisualizer4Clients.prototype.draw = function() {
  this.analyser.getByteTimeDomainData(this.times);
  this.drawContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

  let meanVal = 0;
  let barWidth;
  let value;
  for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
    value = (this.times[i] / 256)-0.5;
    if (Math.abs(value) < 0.01) value = 0;
    meanVal += Math.abs(value);
    value = value * this.canvas.height * this.gain;
    y = Math.min(Math.max(value + this.canvas.height*0.5,0),this.canvas.height) - this.rectSize/2;
    barWidth = this.canvas.width/this.analyser.frequencyBinCount;
    this.drawContext.fillStyle = this.mycolor;
    this.drawContext.fillRect(i * barWidth, y, this.rectSize, this.rectSize);
  }
  meanVal /= this.analyser.frequencyBinCount;
  if (meanVal > 0.25) {
    this.rectSize = 20;
  } else {
    this.rectSize = 10;
  };
  requestAnimationFrame(this.draw.bind(this));
};