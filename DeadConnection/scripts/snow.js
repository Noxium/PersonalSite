class Snow extends GameObject {
  constructor(engine, x, y, snowLevel, container) {
    super(engine, x, y, 7, 7, app.loader.resources.snow.texture, "snow", -1, false, false, false, null, container);
    this.sprite.rotation = Math.random() * 2 * Math.PI - Math.PI;
    this.trackXMin = 1;
    this.trackXMax = 1;
    this.trackXIncreasing = ((Math.random() > 0.5) ? true : false);
    this.curTrackX = 0
    this.trackY = 1;
    this.snowLevel = snowLevel;
  }

  get snowLevel() {
    return this._snowLevel;
  }

  set snowLevel(SL) {
    this._snowLevel = SL;
    if(this.snowLevel < 4) {
      // SL: 1-3
      this.trackY = Math.random() * 1.5 + 5;
      this.trackXMax = (Math.random() * 1.5 + 1.5);
      this.trackXMin = this.trackXMax - 1;
    } else if(this.snowLevel < 7) {
      // SL: 4-6
      this.trackY = Math.random() * 1.75 + 5;
      this.trackXMax = (Math.random() * 1.5 + 3);
      this.trackXMin = this.trackXMax - 1.5;
    } else if(this.snowLevel <= 9) {
      // SL: 7-9
      this.trackY = Math.random() * 2.25 + 5;
      this.trackXMax = (Math.random() * 2 + 7);
      this.trackXMin = this.trackXMax - 2;
    } else {
      // SL: 10
      this.trackY = Math.random() * 2.5 + 5.5;
      this.trackXMax = (Math.random() * 3 + 15);
      this.trackXMin = this.trackXMax - 2;
    }
    this.curTrackX = Math.random() * (this.trackXMax - this.trackXMin) + this.trackXMin;
    let baseBG = 0x748184;
    let offsetBGDigit = parseInt(0x20 * ((this.snowLevel - 5) / 5));
    let offsetBG = (offsetBGDigit << 16) + (offsetBGDigit << 8) + offsetBGDigit;
    app.renderer.backgroundColor = baseBG - offsetBG;
  }

  gameTick() {
    this.sprite.x -= this.curTrackX * (this.snowLevel / 10);
    this.sprite.y += this.trackY * (this.snowLevel / 10);

    if(this.trackXIncreasing) {
      this.curTrackX += 0.005;
      if(this.curTrackX >= this.trackXMax) {
        this.trackXIncreasing = false;
      }
    } else {
      this.curTrackX -= 0.005;
      if(this.curTrackX <= this.trackXMin) {
        this.trackXIncreasing = true;
      }
    }

    this.sprite.rotation += 1 * (Math.PI/180);
    if(this.sprite.rotation == 2 * Math.PI) {
      this.sprite.rotation = 0;
    }

    // move sprite east
    if(this.sprite.x < screenBoundaries.west - this.sprite.width / 2) {
      //this.sprite.x = screenBoundaries.east + this.sprite.width / 2;
      this.sprite.x += (WIDTH + this.sprite.width);
    }

    // move sprite west
    if(this.sprite.x > screenBoundaries.east + this.sprite.width / 2) {
      //this.sprite.x = screenBoundaries.west - this.sprite.width / 2;
      this.sprite.x -= (WIDTH - this.sprite.width);
    }

    // move sprite north
    if(this.sprite.y > screenBoundaries.south + this.sprite.height / 2) {
      //this.sprite.y = screenBoundaries.north - this.sprite.height / 2;
      this.sprite.y -= (HEIGHT + this.sprite.height);
    }

    // move sprite south
    if(this.sprite.y < screenBoundaries.north - this.sprite.height / 2) {
      //this.sprite.y = screenBoundaries.south + this.sprite.height / 2;
      this.sprite.y += (HEIGHT + this.sprite.height);
    }
  }
}
