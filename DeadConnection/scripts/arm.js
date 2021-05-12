const configurations = {
  RETRACT: 1000,
  HALFRETRACT: 2000,
  POINTING: 3000,
}

class Arm extends GameObject {
  constructor(engine, parentObject, cFilter, id=0) {
    super(engine, parentObject.position.x+100, parentObject.position.y, -1, -1, app.loader.resources.r_arm.texture, "arm", 0, true, false, true, cFilter, (id ? containers.mainContainer : containers.mainContainer));
    this.maxRotateSpeed = 0.06;
    this.parentObject = parentObject;
    this.childObject = null;
    this._drill = null;
    //this.currentlyFocusedObject = null;
    this.currentlyFocusedObjects = [];
    this._objectsReadyToBeRemoved = 0;
    this.armID = id;
    this.numArmsAhead = 0;
    this.manualControl = false;
    this.body.isSensor = true;
    this.armStatus = configurations.RETRACT;
    if(id == 0) {
      var constraint = Matter.Constraint.create({
        bodyA: this.body,
        bodyB: parentObject.body,
        pointA: {x: -this.sprite.width/2, y: 0},
        pointB: {x: 45, y: -8},
        length: 0,
      });
      World.add(engine.world, constraint);
    } else {
      var constraint = Matter.Constraint.create({
        bodyA: this.body,
        bodyB: parentObject.body,
        pointA: {x: -this.sprite.width/2, y: 0},
        pointB: {x: 30, y: 0},
        length: 0,
      });
      World.add(engine.world, constraint);
    }

    this._demo = 0;
    this._randX = 0;
    this._randY = 0;
    /*this.debug = true;
    if(this.debug) {
      this._debug = new PIXI.Sprite(app.loader.resources.debug.texture);
      this._debug.anchor.set(0.5);
      app.stage.addChild(this._debug);
    }*/
  }

  onBodyLoaded() {
    Matter.Body.setMass(this.body, 0.00001);
  }

  setHead(head) {
    if(this.numArmsAhead != 0) {
      this.childObject.setHead(head);
    } else {
      switch(head) {
        case drillTypes.DRILL:
          this._drill = new Drill(engine, this, group);
          break;
      }
    }
  }

  get head() {
    if(this.numArmsAhead != 0) {
      return this.childObject.head;
    } else {
      return this._drill;
    }
  }


  /*
   * Arms are stored in something of a linked list, the player has access
   * to the root arm, each arm points to the next one in the chain.
   * Arms can be traversed with parentObject and childObject
   */
  addArm(engine, parentObject, cFilter) {
    this.numArmsAhead++;
    if(this.childObject != null) {
      this.childObject.addArm(engine, this, group);//, this.armID + 1);
    } else {
      this.sprite.texture = app.loader.resources.r_arm.texture;
      this.childObject = new Arm(engine, this, group, this.armID + 1);
    }
  }

  toggleManualArmControl() {
    this.manualControl = !this.manualControl;
    if(this.childObject != null) {
      this.childObject.toggleManualArmControl();
    }
  }

  drill(objects) {
    if(!this.manualControl) {
      //this.currentlyFocusedObject = object;
      this.currentlyFocusedObjects = objects;
      this.objectsReadyToBeRemoved = 0;
      if(this.childObject) {
        this.childObject.drill(objects);
      } else {
        if(this._drill) {
          this._drill.drill(objects);
        }
      }
    }
  }

  demo() {
    //TODO jank as hell
    if(this.armID == 0) {
      let armStartX = this.body.position.x + (-Math.cos(this.body.angle) * (this.sprite.width / 2));
      let armStartY = this.body.position.y + (-Math.sin(this.body.angle) * (this.sprite.width / 2));
      let maxRange = (this.numArmsAhead + 1) * this.sprite.width;
      if(this._demo % 60 == 0) {
        this._randX = (Math.random() * maxRange) * Math.cos(Math.random()*2*Math.PI);
        this._randY = (Math.random() * maxRange) * Math.sin(Math.random()*2*Math.PI);
        this._debug.x = this._randX + armStartX;
        this._debug.y = this._randY + armStartY;

        this._demo = 1;
      }
      if(this._randX != 0 && this._randY != 0) {
        this.point(Math.round(this._randX + armStartX), Math.round(this._randY + armStartY));
      } else {
        this.point(configurations.RETRACT);
      }
      this._demo++
    }
  }

  clearCurrentlyFocusedObjects() {
    this.objectsReadyToBeRemoved = 0;
    this.currentlyFocusedObjects = [];
    this.parentObject.clearCurrentlyFocusedObjects();
  }

  gameTick() {
    if(this._debug) {
      //this._debug.x = lerp(this._debug.x, 500, 0.05);
    }
    if(this.manualControl) {
      this.point(mousePos.x + screenBoundaries.west, mousePos.y + screenBoundaries.north);
    } else if(this._demo) {
      if(this.childObject) {
        this.childObject._demo = true;
      }
      this.demo();
    } else if(this.currentlyFocusedObjects.length) {
      let cfo = this.currentlyFocusedObjects[this.objectsReadyToBeRemoved];
      let xOffset = BLOCK_SIZE - ((cfo.hp / cfo.maxHP) * BLOCK_SIZE);
      this.point(cfo.position.x - (cfo.width / 2) + xOffset, cfo.position.y-(32));
    } else {
      this.point(configurations.RETRACT);
    }
  }

  point(x, y=configurations.RETRACT) {
    if(x == configurations.RETRACT || y == configurations.RETRACT ) {
      this.rotate(configurations.RETRACT);
    } else {
      let armStartX = this.body.position.x + (-Math.cos(this.body.angle) * (this.sprite.width / 2));
      let armStartY = this.body.position.y + (-Math.sin(this.body.angle) * (this.sprite.width / 2));
      let deltaX = x - armStartX;
      let deltaY = y - armStartY;
      let distance = Math.sqrt(Math.pow(Math.abs(deltaX), 2) + Math.pow(Math.abs(deltaY), 2));
      let numArmsRequiredToReach = parseInt((distance/(this.sprite.width))) + 1;
      if(numArmsRequiredToReach > this.numArmsAhead + 2) {
        // retract when point is outside reach radius + 1 arm
        this.armStatus = configurations.RETRACT;
        this.rotate(configurations.RETRACT);
      } else {
        if(this.armID == 0) {
          let aX = armStartX;
          let aY = armStartY;
          let bX = x;// - (this.childObject._drill.sprite.width * Math.cos(this.childObject.body.angle));
          let bY = y;// + (this.childObject._drill.sprite.width * Math.sin(this.childObject.body.angle));
          // angle dif between 0° and target Angle
          let theta = Math.atan((bY-aY)/(bX-aX));
          if(bX < aX) {
            theta = (((Math.PI/2) - theta) + (Math.PI/2)) * -1;
          }

          // side length (length of each arm)
          let s = this.sprite.width;

          // distance between this and target
          let d = distance;
          if(d >= (this.numArmsAhead+1) * s) {
            // if target is just outside of range, attempt to 'reach'
            d = this.sprite.width * (this.numArmsAhead + 1)-.0001;
          }

          // angle offset each arm takes on
          // use law of cosines to find the angle arm must bend at to reach target
          let o = Math.acos(((2*(Math.pow(s,2)))-(Math.pow(d,2)))/((2*(Math.pow(s,2)))));

          // the initial angle the first arm bends at away from the robot
          let initAngle = (Math.PI - o) / 2;

          if(bX > aX) {
            o *= -1;
            initAngle *= -1;
          }

          this.rotate(theta + initAngle);
          this.childObject.rotate(theta+initAngle-(Math.PI-o));
        }
      }
    }
  }

  // arm attempts to rotate to the desired angle (in radians)
  rotate(bearing, speed = 0.005) {
    if(bearing == configurations.RETRACT) {
      if(this.armID % 2) {
        bearing = 3 * Math.PI/4;
      } else {
        bearing = -Math.PI / 4;
      }
    }
    if(bearing == configurations.HALFRETRACT) {
      bearing = -3 * Math.PI / 4;
    }

    let arm = this.body;
    let delta = bearing - arm.angle;

    // this allows the arm to swing fully around
    if(Math.abs(-bearing - arm.angle) < Math.abs(delta)) {
      delta *= -1;
      if(Math.abs(bearing) > Math.PI / 2) {
        if(arm.angle < 0) {
          Body.setAngle(arm, arm.angle + (2 * Math.PI));
        } else {
          Body.setAngle(arm, arm.angle - (2 * Math.PI));
        }
      }
    }

    // blessed is our lerp
    Body.setAngle(arm, lerp(arm.angle, bearing, 0.16))
  }

  set objectsReadyToBeRemoved(num) {
    this._objectsReadyToBeRemoved = num;
    this.parentObject.objectsReadyToBeRemoved = num;
  }

  get objectsReadyToBeRemoved() {
    return this._objectsReadyToBeRemoved;
  }
}

