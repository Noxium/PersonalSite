const drillTypes = {
  DRILL: 0,
}

var group = Matter.Body.nextGroup(true);
class Player extends GameObject {
  constructor(engine, x, y) {
    super(engine, x, y, 64, 64, null, "player", 100, true, true, true, null, containers.playerContainer);
    this.currentlyFocusedObject = null;
    this.collisionsW = 0;
    this.collisionsE = 0;
    this.collisionsS = 0;
    this.miningDirection = null;
    this.inventory = new Inventory();
    this.crafting = new Crafting(this.inventory);

    let trackssheet = app.loader.resources.tracks.spritesheet
    this.tracksprite = new PIXI.AnimatedSprite(trackssheet.animations.track);
    this.tracksprite.anchor.set(0.5, 0.75);
    this.tracksprite.animationSpeed = 0.25;
    this.tracksprite.play();
    this.sprite = this.tracksprite;
    containers.playerContainer.addChild(this.sprite);

    let bodysheet = app.loader.resources.body.spritesheet;
    this.bodysprite = new PIXI.AnimatedSprite(bodysheet.animations.track);
    this.bodysprite.anchor.set(0.5, 0.75);
    this.bodysprite.animationSpeed = 0.4;
    this.bodysprite.loop = false;
    this.bodysprite.onComplete = function() {
      this.gotoAndStop(0);
    };
    containers.playerContainer.addChild(this.bodysprite);

    let drillsheet = app.loader.resources.drill.spritesheet;
    this.drillsprite = new PIXI.AnimatedSprite(drillsheet.animations.track);
    this.drillsprite.anchor.set(0.5, 0.75);
    this.drillsprite.animationSpeed = 0.4;
    this.drillsprite.play();
    containers.playerParentContainer.addChild(this.drillsprite);

    this.initPhysics();
  }

  onObjectMined(object) {
    this.inventory.addItem(object);
  }

  openCraftingMenu() {
    this.crafting.openMenu();
    this.inventory.hide();
  }

  closeCraftingMenu() {
    this.crafting.closeMenu();
    this.inventory.show();
  }

  initPhysics() {
    // I haven't had much success simply defining the rover as an SVG and applying a force along the ground
    // since the movement is jerky and occasionally catches on the boundaries between the blocks it's sliding
    // across. Instead, the physics body for the player is represented as two wheels with a rectangle joining the two
    let wheelRadius = 16;
    this.body = Bodies.rectangle(this.sprite.x + wheelRadius, this.sprite.y - 2, this.sprite.width - wheelRadius * 2, this.sprite.height/2 - 4, {
      label: "player",
      isStatic: false,
      restitution: 0,
      inertia: Infinity,
      collisions_down: 0,
      collisionFilter: {
        group: group
      }
    });

    this.lWheel = Matter.Bodies.circle(this.sprite.x, this.sprite.y, wheelRadius, {
      label: "player",
      collisionsDown: 0,
      collisionFilter: {
        group: group
      }
    });
    this.rWheel = Matter.Bodies.circle(this.sprite.x + 32, this.sprite.y, wheelRadius, {
      label: "player",
      collisionsDown: 0,
      collisionFilter: {
        group: group
      }
    });

    // hitbox for the main body piece
    this.hull = Matter.Bodies.circle(this.sprite.x + 16, this.sprite.y - 16, 20, {
      label: "player",
      inertia: Infinity,
      collisionFilter: {
        group: group
      }
    });
    Matter.Body.scale(this.hull, 1, 0.75); // flatten into an oval shape

    this.collisionW = Matter.Bodies.rectangle(this.sprite.x - 16, this.sprite.y - 5, 5, 25, {
      label: "playerCollisionW",
      isStatic: false,
      restitution: 0,
      inertia: Infinity,
      density: 0,
      isSensor: true,
    });

    this.collisionE = Matter.Bodies.rectangle(this.sprite.x + 48, this.sprite.y - 5, 5, 25, {
      label: "playerCollisionE",
      isStatic: false,
      restitution: 0,
      inertia: Infinity,
      density: 0,
      isSensor: true,
    });

    this.collisionS = Matter.Bodies.rectangle(this.sprite.x + 16, this.sprite.y + 14, 25, 5, {
      label: "playerCollisionS",
      isStatic: false,
      restitution: 0,
      inertia: Infinity,
      density: 0,
      isSensor: true,
    });

    this.playerCompound = Body.create({
      parts: [this.body, this.hull, this.collisionW, this.collisionE, this.collisionS],
      collisionFilter: {
        group: group
      }
    });

    World.add(engine.world, [this.playerCompound]);
    World.addBody(engine.world, this.lWheel);
    World.addBody(engine.world, this.rWheel);
  }

  onBodyLoaded() {
    let lWheelConstraint = Matter.Constraint.create({
      bodyA: this.playerCompound,
      bodyB: this.lWheel,
      pointA: {x: -16, y: 8},
      pointB: {x: 0, y: 0},
      length: 0,
      stiffness: 1.00,
    });
    let rWheelConstraint = Matter.Constraint.create({
      bodyA: this.playerCompound,
      bodyB: this.rWheel,
      pointA: {x: 16, y: 8},
      pointB: {x: 0, y: 0},
      length: 0,
      stiffness: 1.00,
    });
    World.add(engine.world, lWheelConstraint);
    World.add(engine.world, rWheelConstraint);

  }

  gameTick() {
    this.processKeyInput(keyState);
    this.inventory.gameTick();
    this.crafting.gameTick();
    this.tracksprite.animationSpeed = (this.playerCompound.velocity.x / PLAYER_SPEED) * 0.1;
    this.bodysprite.position = this.body.position;
    if(this.currentlyFocusedObject) {
      if(this.miningDirection == directions.SOUTH) {
        // center player over object
        let diff = (this.currentlyFocusedObject.position.x - this.playerCompound.position.x);
        let velocity = lerp(diff, BLOCK_SIZE/2, 0.08) / (BLOCK_SIZE / 2);
        Body.setAngularVelocity(this.lWheel, lerp(this.lWheel.angularVelocity, velocity * PLAYER_SPEED, 0.16));
        Body.setAngularVelocity(this.rWheel, lerp(this.rWheel.angularVelocity, velocity * PLAYER_SPEED, 0.16));

        this.drillsprite.position.x = this.body.position.x;
        if(this.drillsprite.position.y < (this.currentlyFocusedObject.y - BLOCK_SIZE/4)) {
          this.drillsprite.position.y += 0.5
        } else {
          //TODO this currently destroys the object when the drill animation is complete instead of dealing damage over time
          this.currentlyFocusedObject.destroy(true);
          this.currentlyFocusedObject = null;
        }
      } else if(this.miningDirection == directions.WEST) {
        this.drillsprite.rotation = Math.PI/2;
        if(this.drillsprite.position.x > (this.currentlyFocusedObject.x + BLOCK_SIZE/4)) {
          this.drillsprite.position.x--;
        } else {
          //TODO this currently destroys the object when the drill animation is complete instead of dealing damage over time
          this.drillsprite.rotation = 0;
          this.currentlyFocusedObject.destroy(true);
          this.currentlyFocusedObject = null;
        }
      } else if(this.miningDirection == directions.EAST) {
        this.drillsprite.rotation = -Math.PI/2;
        if(this.drillsprite.position.x < (this.currentlyFocusedObject.x - BLOCK_SIZE/4)) {
          this.drillsprite.position.x++;
        } else {
          //TODO this currently destroys the object when the drill animation is complete instead of dealing damage over time
          this.drillsprite.rotation = 0;
          this.currentlyFocusedObject.destroy(true);
          this.currentlyFocusedObject = null;
        }
      }
    } else {
        this.drillsprite.rotation = 0;
        this.drillsprite.position = this.body.position;
    }
  }

  processKeyInput(keyState) {
    // return if the physics body is not yet ready
    if(!this.physicsLoaded) {
      return;
    }

    if (keyState[65]){
      // a
      if(this.collisionsS == 0) {
        // if we're currently in the air, apply force on the body
        Body.applyForce(this.playerCompound, this.playerCompound.position, {x: -0.001, y: 0});
      }
      if(!keyState[83]) {
        if(this.collisionsW > 0) {
          // mine west
          /*
          let path = new PIXI.Graphics();
          path.lineStyle(2, 0xFF0000, 1);
          path.moveTo(0, 0);
          path.lineTo(-BLOCK_SIZE, 0);
          path.position = this.body.position;
          app.stage.addChild(path);
           */
          let curBody = Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, {x: this.body.position.x - BLOCK_SIZE, y: this.body.position.y});

          for(let body of curBody) {
            if(body.body.label == "player") {
              continue;
            }
            curBody = body.body;
            break;
          }
          let curObject = getGameObjectFromBody(curBody);
          if(curObject) {
            this.currentlyFocusedObject = curObject;
            this.miningDirection = directions.WEST;
          }
        } else {
          Body.setAngularVelocity(this.lWheel, lerp(this.lWheel.angularVelocity, -PLAYER_SPEED, 0.08));
          Body.setAngularVelocity(this.rWheel, lerp(this.rWheel.angularVelocity, -PLAYER_SPEED, 0.08));
        }
      }
    } else if (keyState[68]){
      // d
      if(this.collisionsS == 0) {
        // if we're currently in the air, apply force on the body
        Body.applyForce(this.playerCompound, this.playerCompound.position, {x: 0.001, y: 0});
      }
      if(!keyState[83]) {
        if(this.collisionsE > 0) {
          // mine east
          /*
          let path = new PIXI.Graphics();
          path.lineStyle(2, 0xFF0000, 1);
          path.moveTo(0, 0);
          path.lineTo(BLOCK_SIZE, 0);
          path.position = this.body.position;
          app.stage.addChild(path);
          */
          let curBody = Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, {x: this.body.position.x + BLOCK_SIZE, y: this.body.position.y});

          for(let body of curBody) {
            if(body.body.label == "player") {
              continue;
            }
            curBody = body.body;
            break;
          }
          let curObject = getGameObjectFromBody(curBody);
          if(curObject) {
            this.currentlyFocusedObject = curObject;
            this.miningDirection = directions.EAST;
          }
        } else {
          Body.setAngularVelocity(this.lWheel, lerp(this.lWheel.angularVelocity, PLAYER_SPEED, 0.08));
          Body.setAngularVelocity(this.rWheel, lerp(this.rWheel.angularVelocity, PLAYER_SPEED, 0.08));
        }
      }
    } else {
      if(this.miningDirection == directions.WEST || this.miningDirection == directions.EAST) {
        this.currentlyFocusedObject = null;
        this.miningDirection = null;
      }
    }
    if (keyState[87]){
      // w
      if(!keyState[83]) {
        if(!this.bodysprite.playing) {
          Body.applyForce(this.playerCompound, this.playerCompound.position, {x: 0, y: -JUMP_HEIGHT});
          this.bodysprite.play();
        }
      }
    }
    if (keyState[83]) {
      // s
      if(!this.currentlyFocusedObject) {
        if(this.collisionsS > 0) {
          // mine down
          /*
          let path = new PIXI.Graphics();
          path.lineStyle(2, 0xFF0000, 1);
          path.moveTo(0, 0);
          path.lineTo(0, BLOCK_SIZE);
          path.position = this.body.position;
          app.stage.addChild(path);
           */
          let curBody = Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, {x: this.body.position.x, y: this.body.position.y + BLOCK_SIZE});

          // this is what they show under the dictionary definition of jank
          for(let body of curBody) {
            if(body.body.label == "player") {
              continue;
            }
            curBody = body.body;
            break;
          }
          let curObject = getGameObjectFromBody(curBody);
          if(curObject) {
            this.currentlyFocusedObject = curObject;
            this.miningDirection = directions.SOUTH;
          }
        }
      }
    } else {
      if(this.currentlyFocusedObject && this.miningDirection == directions.SOUTH) {
        this.currentlyFocusedObject = null;
        this.miningDirection = null;
      }
    }
  }
}







/*
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
*/




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



/*
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

    */
    /*let debug = new PIXI.Sprite(app.loader.resources.dev.texture);
    debug.width = this.sprite.width;
    debug.height = this.sprite.height;
    debug.anchor.set(0.5);
    debug.position.x = this.body.position.x;
    debug.position.y = this.body.position.y;
    app.stage.addChild(debug);*/ /*
  }
}
*/

