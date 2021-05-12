const drillTypes = {
  DRILL: 0,
}

var group = Matter.Body.nextGroup(true);
class Player extends GameObject {
  constructor(engine, x, y) {
    super(engine, x, y, -1, -1, app.loader.resources.r_base.texture, "player", 100, true, true, true, null, containers.playerContainer);
    let curObject = this; //TODO feels like there's a better way to do this
    this._body_loaded = false;
    $.get('./assets/robot/base.svg').done(function(data) {
      var vertexSet = [];
      $(data).find('path').each(function(i, path) {
        vertexSet.push(Matter.Svg.pathToVertices(path, 15));
      });

      let body = Bodies.fromVertices(x, y - 100, vertexSet, {
        isStatic: false,
        inertia: 70000,
        restitution: 0,
        collisionFilter: {
          group: group
        }
      });
      curObject.body = body;
      //curObject.body.position.x = curObject.sprite.position.x;
      //curObject.body.position.y = curObject.sprite.position.y;
      //curObject.body.positionPrev.x = curObject.sprite.position.x;
      //curObject.body.positionPrev.y = curObject.sprite.position.y;
      World.addBody(engine.world, body);
    });

    this.instrumentSprite = new PIXI.Sprite(app.loader.resources.r_instruments.texture);
    this.instrumentSprite.anchor.set(0.5);
    containers.playerParentContainer.addChild(this.instrumentSprite);

    this.currentlyFocusedObject = null;
    this.currentlyFocusedObjects = [];
    this.objectsReadyToBeRemoved = 0;
    this.currentGoal = {x: null, y: null};
    this.inventory = new Inventory();
    this.crafting = new Crafting(this.inventory);
  }

  onBodyLoaded() {
    this._child1 = new Wheel(engine, this, -47, 27);
    this._child3 = new Wheel(engine, this, -3, 27);
    this._child2 = new Wheel(engine, this, 48, 27);
    this.addArm();
    this.addArm();

    this.arm.setHead(drillTypes.DRILL);
  }

  openCraftingMenu() {
    this.crafting.openMenu();
    this.inventory.hide();
  }

  closeCraftingMenu() {
    this.crafting.closeMenu();
    this.inventory.show();
  }

  addArm() {
    if(this.arm) {
      this.arm.addArm(engine, this, group);
    } else {
      this.arm = new Arm(engine, this, group);
      //this.arm._demo = true;
    }
  }

  toggleManualArmControl() {
    this.arm.toggleManualArmControl();
  }

  clearCurrentlyFocusedObject() {
    this.currentlyFocusedObjects.shift();
  }
  /*
  clearCurrentlyFocusedObject(id) {
    console.log("clearing", id);
    //this.currentlyFocusedObjects[id] = null;
    let i = 0;
    for(i in this.currentlyFocusedObjects) {
      console.log("i =", i)
      if(this.currentlyFocusedObjects[i].id == id) {
        console.log("-------------")
        console.log("clearing at i =", i)
        console.log(this.currentlyFocusedObjects)
         this.currentlyFocusedObjects.splice(i, 1);
        console.log(this.currentlyFocusedObjects)
        console.log("-------------")
      }
    }
  }
  */

  clearCurrentlyFocusedObjects() {
    this.currentlyFocusedObjects = [];
  }

  drive(direction, speed = 0.08) {
    let lTire = this._child1._body;
    let rTire = this._child2._body;
    let mTire = this._child3._body; //TODO
    if(direction == directions.WEST) {
      Body.setAngularVelocity(lTire, lerp(lTire.angularVelocity, -PLAYER_SPEED, speed));
      Body.setAngularVelocity(rTire, lerp(rTire.angularVelocity, -PLAYER_SPEED, speed));
      Body.setAngularVelocity(mTire, lerp(mTire.angularVelocity, -PLAYER_SPEED, speed));
    } else if(direction == directions.EAST) {
      Body.setAngularVelocity(lTire, lerp(lTire.angularVelocity, PLAYER_SPEED, speed));
      Body.setAngularVelocity(rTire, lerp(rTire.angularVelocity, PLAYER_SPEED, speed));
      Body.setAngularVelocity(mTire, lerp(mTire.angularVelocity, PLAYER_SPEED, speed));
    }
  }

  driveToGoal() {
    if(this.currentGoal.x != null) {
      let delta = this.body.position.x - this.currentGoal.x;
      if(delta > 0) {
        if(delta > 20) {
          this.drive(directions.WEST);
        } else {
          // 0 < delta < 10
          this.drive(directions.WEST, lerp(this._child1.body.angularVelocity, ((delta / 20) * 0.08), 0.1));
        }
      } else {
        if(delta < 20) {
          this.drive(directions.EAST);
        } else {
          // -20 < delta < 0
          this.drive(directions.EAST, lerp(this._child1.body.angularVelocity, ((delta / 20) * 0.08), 0.1));
        }
      }
      return;
    }
  }

  get arm() {
    return this._arm;
  }

  set arm(arm) {
    this._arm = arm;
  }

  get head() {
    return this.arm.head;
  }

  get goal() {
    return this.currentGoal;
  }

  set goal(coords) {
    this.currentGoal = coords;
  }

  onObjectMined(object) {
    this.inventory.addItem(object);
  }

  gameTick() {
    this.processKeyInput(keyState);
    this.inventory.gameTick(); // jank af
    this.crafting.gameTick(); // jank af
    if(this.physicsLoaded) {
      this.instrumentSprite.x = this.body.position.x + 7;
      this.instrumentSprite.y = this.body.position.y - 30;
      //this.instrumentSprite.rotation = this.body.angle;
    }
  }

  processKeyInput(keyState) {
    // return if the physics body is not yet ready
    if(!this.physicsLoaded || !this._child1.physicsLoaded || !this._child2.physicsLoaded || !this._child3.physicsLoaded) {
      return;
    }

    let sprite = this._sprite;
    let body = this._body;
    let lTire = this._child1._body;
    let rTire = this._child2._body;
    let onGround = (lTire.collisionsDown > 0) && (rTire.collisionsDown > 0)

    if (keyState[65]){
      // a
      if(!keyState[83]) {
        this.drive(directions.WEST);
      }
    }
    if (keyState[68]){
      // d
      if(!keyState[83]) {
        this.drive(directions.EAST);
      }
    }
    if (keyState[87]){
      // w
      if(onGround) {
        if(!keyState[83]) {
          Body.applyForce(body, body.position, {x: 0, y: -JUMP_HEIGHT});
        }
      }
    }
    if (keyState[83]) {
      // s
      //if(onGround) {
        if(this.currentlyFocusedObjects.length == 0) {
          let curObject = getGameObjectFromBody(Matter.Query.ray(Matter.Composite.allBodies(engine.world), body.position, {x: body.position.x, y: body.position.y + BLOCK_SIZE})[0].body);
          if(curObject) {
            this.currentlyFocusedObjects.push(curObject);
            if(body.position.x > curObject.body.position.x) {
              // robot is closer to right side
              this.goal.x = curObject.body.position.x + (BLOCK_SIZE/2) - 10;
              let neighborEast = curObject.getNeighbor(directions.EAST);
              if(neighborEast) {
                this.currentlyFocusedObjects.push(neighborEast);
              }
            } else {
              // robot is closer to left side
              this.goal.x = curObject.body.position.x - (BLOCK_SIZE/2) - 10;
              let neighborWest = curObject.getNeighbor(directions.WEST);
              if(neighborWest) {
                this.currentlyFocusedObjects.unshift(neighborWest); // insert in front
              }
            }
            let i = 0;
            this.arm.drill(this.currentlyFocusedObjects)
            for(i in this.currentlyFocusedObjects) {
              //this.currentlyFocusedObjects[i].sprite.texture = app.loader.resources.dev.texture;
            }
          }
        }

      //}
    } else {
      if(this.currentlyFocusedObjects.length > 0) {
        let i = 0;
        for(i in this.currentlyFocusedObjects) {
          //this.currentlyFocusedObjects[i].sprite.texture = app.loader.resources.sheet.textures["compactedSnow.png"];
        }
        this.clearCurrentlyFocusedObjects();
        this.goal.x = null;
        this.goal.y = null;
        this.arm.drill([]);
      }
    }
    this.driveToGoal();
  }
}

class Wheel extends GameObject {
  constructor(engine, parentObject, offsetX, offsetY) {
    super(engine, parentObject.x, parentObject.y, -1, -1, app.loader.resources.r_wheel.texture, "wheel", -1, true, true, true, null, containers.playerContainer);

    this.parentObject = parentObject;
    this.offsetX = offsetX;
    this.offsetY = offsetY;

    this.body = Matter.Bodies.circle(parentObject.x, parentObject.y-100, 12.5, {
      worldType: "wheel",
      collisionsDown: 0,
      collisionFilter: {
        group: group
      }
    });
    World.addBody(engine.world, this.body);
  }

  onBodyLoaded() {
    var constraint = Matter.Constraint.create({
      bodyA: this.body,
      bodyB: this.parentObject.body,
      pointB: {x: this.offsetX, y: this.offsetY},
      length: 0,
      stiffness: 0.08,
    });
    World.add(engine.world, constraint);

    /*let debug = new PIXI.Sprite(app.loader.resources.dev.texture);
    debug.width = this.sprite.width;
    debug.height = this.sprite.height;
    debug.anchor.set(0.5);
    debug.position.x = this.body.position.x;
    debug.position.y = this.body.position.y;
    app.stage.addChild(debug);*/
  }
}

