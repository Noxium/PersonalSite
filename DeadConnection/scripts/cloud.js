class Cloud extends GameObject {
  constructor(engine, x, y, snowLevel) {
    let texture = null;
    switch(parseInt(Math.random() * 2)) {
      case 0:
        texture = app.loader.resources.cloud1.texture;
        break;

      case 1:
        texture = app.loader.resources.cloud2.texture;
        break;

    }
    super(engine, x, y, 256, 256, texture, "cloud", -1, false, false, false, null, containers.bgLayerParallax);
    this.sprite.alpha = 0.7;
    this.sprite.scale.x *= (Math.random() > 0.5 ? 1 : -1);
    this.offsetX = x;
    this.yCounter = parseInt(Math.random() * 300);
    this.yIncreasing = ((Math.random() > 0.5) ? true : false);
    this.distance = Math.random() * 0.3 + 0.25; // how 'far' away the clouds are
    this.sprite.width *= (this.distance + 0.5);
    this.sprite.heiht *= (this.distance + 0.5);

    this.speed = 0.3 + (Math.random() * 0.1);
  }

  gameTick() {
    this.offsetX -= this.speed;
    this.sprite.x = this.offsetX + (screenBoundaries.west * this.distance);
    if(this.sprite.x > screenBoundaries.east + (this.sprite.width/2)) {
      this.offsetX -= (WIDTH + (this.sprite.width));
    }
    if(this.sprite.x < screenBoundaries.west - (this.sprite.width/2)) {
      this.offsetX += (WIDTH + (this.sprite.width));
    }

    if(this.yIncreasing) {
      this.sprite.y += 0.05;
    } else {
      this.sprite.y -= 0.05;
    }
    this.yCounter++;
    if(this.yCounter == 300) {
      this.yIncreasing = !this.yIncreasing;
      this.yCounter = 0;
    }
  }
}
