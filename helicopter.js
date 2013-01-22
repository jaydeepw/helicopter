var setInterval_ = function sI_(vCallback, nDelay /*, argumentToPass1, argumentToPass2, etc. */) {
  var oThis = this, aArgs = Array.prototype.slice.call(arguments, 2);
  return window.setInterval(vCallback instanceof Function ? function sI_vCallback() {
    vCallback.apply(oThis, aArgs);
  } : vCallback, nDelay);
};

function Helicopter(e, settings) {
  if (!settings)
    settings = {};
  this.canvas = e;
  this.bgcanvas = document.createElement("canvas");
  this.scorecanvas = document.createElement("canvas");
  this.resize(settings.height, settings.width);
  this.settings.sound = !!settings.sound;
  this.settings.fps = !!settings.fps;
  this.ctx.font = this.scorectx.font = "18px sans-serif";

  for (var i=12, idx=0; i<31; i++) {
    var img = new Image();
    img.src = "data/small-"+i+".png";
    img.height = 25;
    img.width = 52;
    this.helicopter[idx++] = img;
  }

  for (var i=0; i<8; i++) {
    var img = new Image();
    img.src = "data/small-smoke-0"+(i+1)+".png";
    img.height = 15;
    img.width = 15;
    this.smoke[i] = img;
  }

  this.audio = new Audio();
  this.audio.src="data/helicopter.ogg";
  this.audio.loop = true;
  this.audio.controls = false;

  this.rev = new Audio();
  this.rev.src="data/rev.ogg";
  this.rev.loop = false;
  this.rev.controls = false;

  this.highscore = localStorage.getItem("highscore") || 0;

  if (!!('ontouchstart' in window)) {
      var startEvent = "touchstart";
      var stopEvent  = "touchend";
  } else {
      var startEvent = "mousedown";
      var stopEvent  = "mouseup";
  }

  var self = this;
  e.addEventListener(startEvent, function H_mouseDown() {
    if (!self.runId)
      self.startGame();
    self.mouseDown = true;
    if (self.settings.sound && self.rev.paused && self.runId)
      self.rev.play();
  }, false);
  e.addEventListener(stopEvent, function H_mouseUp() {
    self.mouseDown = false;
    self.rev.pause();
  }, false);

  this.init();

  this.drawPlayer();
  this.drawScore();
}

Helicopter.prototype = {
  runId: null,
  height: 0,
  width: 0,
  playerX: 0,
  playerY: 0,
  playerAcc: 0,
  offset: 0,
  step: 0,
  mouseDown: false,
  mouseDownCnt: 0,
  helicopter: [],
  canvas: null,
  ctx: null,
  bgcanvas: null,
  bgctx: null,
  lastDraw: null,
  fps: [],
  settings: {
    sound: false
  },
  mapData: [],
  audio: null,
  rev: null,
  highscore: 0,
  scorecanvas: null,
  scorectx: null,
  posCache: Array(8),
  course: function H_course(x) {
    var x = x + this.offset;
    var tmp = Math.sin(x/this.width)*this.height/4;
    return [this.height/2-tmp, this.height-this.height/4-tmp];
  },
  init: function H_init() {
    this.playerX = this.width/5;
    this.playerY = this.height/2;
    this.playerAcc = 0;
    this.offset = 0;
    this.step = 8;
    this.mouseDown = false;
    this.mouseDownCnt = 0;
    this.initBackground();
    this.ctx.drawImage(this.bgcanvas, 0, 0, this.width, this.height);
    
    this.ctx.fillStyle = "white";
    this.ctx.textAlign = "center";
    this.ctx.fillText("Click to start", this.width/2, this.height-20);
  },
  difficulty: function H_difficulty() {
    return Math.max(100, 4*this.height/5-this.offset/200-65);
  },
  initBackground: function H_initBackground() {
    this.mapData = [];
    var blocksize = 1;
    this.bgctx.fillStyle = "white";
    this.bgctx.fillRect(0, 0, this.width, this.height);
    this.bgctx.fillStyle = 'black';
    for (var x=0; x<this.width; x+=blocksize) {
      this.mapData[x] = [this.height/5, 4*this.height/5];
      this.bgctx.fillRect(x, 0, blocksize, this.height/5);
      this.bgctx.fillRect(x, 4*this.height/5, blocksize, this.height/5);
    }
  },
  smoke: [],
  startGame: function H_startGame() {
    this.init();
    if (this.settings.sound)
      this.audio.play();
    this.runId = setInterval_.call(this, this.main, 1000/60);
  },
  stopGame: function H_stopGame() {
    clearInterval(this.runId);
    this.audio.pause();
    this.rev.pause();
    this.runId = 0;
    if (this.highscore < this.offset/10) {
      this.highscore = this.offset/10;
      localStorage.setItem("highscore", this.offset/10);
    }
  },
  genNextMapFragment: function H_genMapFragment() {
    var fragmentSize = (2<<6)+1;
    var last = this.mapData.length-1;
    var tmp = Array(fragmentSize);
    tmp[0] = this.mapData[last][0];
    tmp[fragmentSize-1] = Math.floor(20+(this.height-this.difficulty()-40)*Math.random());
    for (var i = (fragmentSize-1)/2; i >= 1; i = i/2) {
      for (var o = i; o < fragmentSize-1; o += 2*i) {
        tmp[o] = Math.floor((tmp[o-i]+tmp[o+i])/2+(Math.random()*i-i/2));
      }
    }
    this.mapData = this.mapData.concat(tmp.splice(0).map(function gNMF_map(x) {return [x, x+this.difficulty()]}, this));
  },
  drawCourse: function H_drawCourse() {
    var blocksize = 1;
    this.ctx.drawImage(this.bgcanvas, -this.step, 0, this.width, this.height);
    this.ctx.fillStyle = "white";
    this.ctx.fillRect(this.width-this.step, 20, this.step, this.height-20);
    this.ctx.fillStyle = 'black ';

    this.mapData.splice(0, this.step);
    if (this.mapData.length < this.width+1)
      this.genNextMapFragment();
    this.ctx.beginPath();
    this.ctx.moveTo(this.width-this.step, 20);
    for (var x=this.width-this.step; x<=this.width; x+=blocksize) {
      this.ctx.lineTo(x, this.mapData[x][0]);
    }
    this.ctx.lineTo(this.width, 20);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.moveTo(this.width-this.step, this.height);
    for (var x=this.width-this.step; x<=this.width; x+=blocksize) {
      this.ctx.lineTo(x, this.mapData[x][1]);
    }
    this.ctx.lineTo(this.width, this.height);
    this.ctx.fill();
    this.bgctx.drawImage(this.canvas, 0, 0, this.width, this.height);
  },
  drawPlayer: function H_drawPlayer() {
    this.ctx.drawImage(this.helicopter[this.mouseDownCnt],
                       this.playerX,
                       this.playerY, 52, 25);
  },
  drawScore: function H_drawScore() {
    if (this.offset%(this.step*10) == 0) {
      this.scorectx.fillStyle = "black";
      this.scorectx.fillRect(0, 0, this.width, this.scorecanvas.height);
      this.scorectx.fillStyle = "white";
      this.scorectx.textAlign = "left";
      this.scorectx.fillText("Distance: "+this.offset/10, 10, 20);
      this.scorectx.textAlign = "right";
      this.scorectx.fillText("Highscore: "+this.highscore, this.width-10, 20);
    }
    this.ctx.drawImage(this.scorecanvas, 0, 0, this.width, this.scorecanvas.height);


  },
  drawFps: function H_drawFps() {
    if (this.settings.fps)
      this.ctx.fillText("FPS: "+this.fps, this.width-10, 50);
  },
  main: function H_main() {
    if (this.settings.fps) {
      var now = Date.now();
      this.fps = Math.floor(1000/(now-this.lastDraw));
      this.lastDraw = now;
    }
    this.drawCourse();

    // draw the player
    this.drawPlayer();

    // draw score
    this.drawScore();

    this.drawFps();

    // only update posCache periodically
    if (this.offset%Math.floor(this.step*2) == 0) {
      this.posCache.pop();
      this.posCache.unshift(this.playerY);
    }

    this.drawSmoke();

    this.offset += this.step;

    this.playerAcc += 0.2;
    this.mouseDownCnt = Math.max(0, this.mouseDownCnt-1);
    if (this.mouseDown) {
      this.playerAcc -= 0.4;
      this.mouseDownCnt = Math.min(18, this.mouseDownCnt+2);
    }

    this.playerY += this.playerAcc;

    colPoints = this.mapData[this.playerX+25];//this.course(this.playerX+25);
    if (this.playerY < colPoints[0]-5 || this.playerY > colPoints[1]-20) {
      // COLISSION!
      this.stopGame();
      //this.dieSplash(ctx, offset/10);
    }
  },
  drawSmoke: function H_drawSmoke() {
    var rand = Math.floor(Math.random()*10);
    var posLength = this.posCache.length;
    for (var i=0; i<posLength; i++) {
      if (typeof this.posCache[i] == 'number') {
        this.ctx.drawImage(this.smoke[i], this.playerX-(i*this.step*2)-rand, this.posCache[i]+5, this.smoke[i].width, this.smoke[i].height);
      }
    }
  },
  resize: function H_resize(h, w) {
    if (!h) h = this.canvas.height;
    if (!w) w = this.canvas.width;
    this.height = this.canvas.height = this.bgcanvas.height = h;
    this.width = this.canvas.width = this.bgcanvas.width = this.scorecanvas.width = w;
    this.scorecanvas.height = 20;
    this.ctx = this.canvas.getContext("2d");
    this.bgctx = this.bgcanvas.getContext("2d");
    this.scorectx = this.scorecanvas.getContext("2d");
  }
}
window.addEventListener("load", function D_onload() {
  new Helicopter(document.getElementById("game"), {sound: false, fps: false, width: 480, height: 320 });
}, false);
