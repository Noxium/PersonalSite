class Background {
  constructor(engine) {
    this.snowLevel = 5; // 0-10 how intense is the snowstorm
    this.snowObjects = [];
    this.cloudObjects = [];
    this.addSnow();
    this.addClouds();
  }

  addSnow(jitter = 200) {
    let counterX = 0;
    let counterY = 0;
    while(counterX < WIDTH) {
      while(counterY < HEIGHT) {
        let xPos = screenBoundaries.west + counterX + Math.random() * jitter - jitter/2;
        let yPos = screenBoundaries.north + counterY + Math.random() * jitter - jitter/2;
        if(Math.random() > 0.75) {
          this.snowObjects.push(new Snow(engine, xPos, yPos, this.snowLevel, containers.bgLayerClose));
        } else {
          this.snowObjects.push(new Snow(engine, xPos, yPos, this.snowLevel,  containers.bgLayerFar));
        }


        counterY += ((20-75)/(10-1))*this.snowLevel+(730/9);
      }
      counterY = 0;
      counterX += ((20-75)/(10-1))*this.snowLevel+(730/9);
      // 20px interval at SL = 10
      // 75px interval at SL = 1
    }
  }

  addClouds(jitter=200) {
    let counter = 0;
    while(counter < WIDTH) {
      let xPos = counter + (Math.random() * jitter - (jitter/2));
      let yPos = 0 + (Math.random() * (jitter/2) - (jitter/4));
      this.cloudObjects.push(new Cloud(this.engine, xPos, yPos, this.snowLevel));
      counter += 300;
    }
  }
}
