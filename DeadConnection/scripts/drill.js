class Drill extends GameObject {
  constructor(engine, parentObject, cFilter) {
    super(engine, parentObject.position.x, parentObject.position.y, -1, -1, app.loader.resources.r_drill.texture, "drill", 0, true, false, false, cFilter, containers.mainContainer);
    this.parentObject = parentObject;
    this.animationSpeed = 0.3; // seconds between each sprite transition
    this.frameCounter = 0; // used for changing sprite
    this.currentSpriteIndex = 0;
    //this.currentlyFocusedObject = null;
    this.currentlyFocusedObjects = [];
    this.objectsReadyToBeRemoved = 0; // how many objects are ready to be removed
    this.coolDownSpeed = 0.1; // time in seconds between damage dealt
    this.coolDownCounter = 0;
  }

  gameTick() {
    this.frameCounter++;

    //TODO calculate delta time instead of counting frames
    if(this.frameCounter % (this.animationSpeed*60)) {
      switch(this.currentSpriteIndex) {
        case 0:
          this.sprite.texture = this.sprite.texture; //TODO
      }
      if(this.currentSpriteIndex < 0) {
        this.currentSpriteIndex++;
      } else {
        this.currentSpriteIndex = 0;
      }
    }
    if(this.currentlyFocusedObjects.length) {
      if(this.coolDownCounter >= this.coolDownSpeed * 60) { //TODO
        let cfo = this.currentlyFocusedObjects[this.objectsReadyToBeRemoved];
        cfo.dealDamage(10);
        this.coolDownCounter = 0;
        if(cfo.readyToBeRemoved) {
          this.objectsReadyToBeRemoved++;
          this.parentObject.objectsReadyToBeRemoved++;
          if(this.objectsReadyToBeRemoved >= this.currentlyFocusedObjects.length) {
            for(let object of this.currentlyFocusedObjects) {
              object.destroy(true);
            }
            this.currentlyFocusedObjects = [];
            this.parentObject.clearCurrentlyFocusedObjects();
          }
        }
      }
      this.coolDownCounter++;
    }

    if(this.parentObject != null) {
      this.body.position.x = this.parentObject.body.position.x + (this.parentObject.sprite.width * Math.cos(this.parentObject.body.angle)) / 2 + (this.sprite.width * Math.cos(this.parentObject.body.angle) / 2);
      this.body.position.y = this.parentObject.body.position.y + (this.parentObject.sprite.width * Math.sin(this.parentObject.body.angle)) / 2 + (this.sprite.width * Math.sin(this.parentObject.body.angle) / 2);
      this.body.angle = this.parentObject.body.angle;
    }
  }

  drill(objects) {
    if(this.currentlyFocusedObjects.length > 0) {
      for(let object of this.currentlyFocusedObjects) {
        object.hp = object.maxHP
      }
    }
    this.coolDownCounter = 0;
    this.currentlyFocusedObjects = objects;
    this.objectsReadyToBeRemoved = 0;
  }
}
