// TODO -> Module or Class !!!
const SMOOTHING = 1.0;
function StreamVisualizer4Clients(analyser, canvas) {
  this.canvas = canvas;
  this.drawContext = this.canvas.getContext('2d');
  this.analyser = analyser;
  this.myColor = 'white';
  this.rectSize = 10;
  this.rectSize_ = this.rectSize;
  this.gain = 1.0;
  this.FFT_SIZE = 512;
  this.analyser.fftSize = this.FFT_SIZE;
  this.analyser.smoothingTimeConstant = SMOOTHING;
  this.times = new Uint8Array(this.analyser.frequencyBinCount);
  this.startTime = 0;
  this.startOffset = 0;
  this.goStroke = false;
}

StreamVisualizer4Clients.prototype.start = function() {
  this.myAnim = requestAnimationFrame(this.draw.bind(this));
};

StreamVisualizer4Clients.prototype.stop = function() {
  this.drawContext.clearRect(0, 0, this.canvas.width, this.canvas.height);
  cancelAnimationFrame(this.myAnim);
};

StreamVisualizer4Clients.prototype.setColor = function(col) {
  this.myColor = col;
};

StreamVisualizer4Clients.prototype.setSize = function(size) {
  this.rectSize = size;
};

StreamVisualizer4Clients.prototype.setStroke = function(goStroke) {
  this.goStroke = goStroke;
};

StreamVisualizer4Clients.prototype.setFFT_SIZE = function(FFT_SIZE) {
  this.FFT_SIZE = FFT_SIZE;
  this.analyser.fftSize = FFT_SIZE;
};

StreamVisualizer4Clients.prototype.draw = function() {
  this.analyser.getByteTimeDomainData(this.times);
  this.drawContext.clearRect(0, 0, this.canvas.width, this.canvas.height);

  let meanVal = 0;
  let barWidth;
  let value;
  if (this.goStroke){
    for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
      value = (this.times[i] / 256)-0.5;
      meanVal += Math.abs(value);
      let y = Math.min(Math.max(value * this.canvas.height * this.gain*10000 + this.canvas.height*0.5,0),this.canvas.height) - this.rectSize/2;
      value = Math.abs(value);
      barWidth = this.canvas.width/this.analyser.frequencyBinCount;
      this.drawContext.strokeStyle = this.myColor; //'hsl(' + (1-2*value)*500 + ', 100%, 50%)';
      this.drawContext.strokeRect(i * barWidth, y, this.rectSize*(1-value), this.rectSize*(1-value));
      this.drawContext.lineWidth = value*value*value*10000;
    }
  } else {
    for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
      value = (this.times[i] / 256)-0.5;
      if (Math.abs(value) < 0.01) value = 0;
      meanVal += Math.abs(value);
      let y = Math.min(Math.max(value * this.canvas.height * this.gain + this.canvas.height*0.5,0),this.canvas.height) - this.rectSize/2;
      barWidth = this.canvas.width/this.analyser.frequencyBinCount;
      this.drawContext.fillStyle = this.myColor;
      this.drawContext.fillRect(i * barWidth, y, this.rectSize, this.rectSize);
    }
  }
  meanVal /= this.analyser.frequencyBinCount;
  if (meanVal > 0.25) {
    this.rectSize_ = this.rectSize*2;
  } else {
    this.rectSize_ = this.rectSize;
  };
  requestAnimationFrame(this.draw.bind(this));
};