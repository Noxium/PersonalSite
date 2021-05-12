class Block extends GameObject {
  constructor(x, y, texture, type, hp) {
    super(engine, x, y, BLOCK_SIZE, BLOCK_SIZE, texture, type, hp, true, false, false);
    this.body.worldType = type;
    //this.surroundingBlocks = 0x00;
    this.readyToBeRemoved = false;

    if(this.body.worldType == "grass") {
      this.surfaceDebris = null;
      switch(parseInt(Math.random() * 8) + 1) {
        case 1:
          this.surfaceDebris = new PIXI.Sprite(app.loader.resources.tuft1.texture);
          break;

        case 2:
          this.surfaceDebris = new PIXI.Sprite(app.loader.resources.tuft2.texture);
          break;

        case 3:
          this.surfaceDebris = new PIXI.Sprite(app.loader.resources.tuft3.texture);
          break;

        case 4:
          this.surfaceDebris = new PIXI.Sprite(app.loader.resources.tuft4.texture);
          break;

        default:
          break;
      }
      if(this.surfaceDebris) {
        this.surfaceDebris.x = this.x;// - (this.sprite.width/2);
        this.surfaceDebris.y = this.y - (this.sprite.height * 1.5);
        this.surfaceDebris.scale.x *= (Math.random() > 0.5 ? 1 : -1);
        containers.mainContainer.addChild(this.surfaceDebris);
      }
    }
  }

  /*

 128  1   2
    \ | /
 64 - ■ - 4
    / | \
 32   16  8

 to add west, north-west, and north blocks: 2_11000001, setblocks(0xC1);

  */
  /*
  setBlocks(whichBlocks) {
    this.surroundingBlocks = whichBlocks;
  }

  addBlocks(whichBlocks) {
    this.surroundingBlocks |= whichBlocks;
  }

  removeBlocks(whichBlocks) {
    this.surroundingBlocks &= ~whichBlocks;
  }

  getBlocks() {
    return this.surroundingBlocks;
  }*/

  updateBlockFormsAroundMe() {
    let castCoordinates = [
      { x: this.body.position.x, y: this.body.position.y - BLOCK_SIZE }, // north
      { x: this.body.position.x + BLOCK_SIZE, y: this.body.position.y }, // east
      { x: this.body.position.x, y: this.body.position.y + BLOCK_SIZE }, // south
      { x: this.body.position.x - BLOCK_SIZE, y: this.body.position.y }, // west
    ]

    console.log(Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, {x: this.body.position.x, y:this.body.position.y + BLOCK_SIZE}));
    for(let coords of castCoordinates) {
      //console.log(coords)
      let cast = Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, coords);

        //console.log(Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, coords));
        let curObject = getGameObjectFromBody(cast[0].body);
        if(curObject != undefined) {
          //TODO Implement dynamic block shapes
          //TODO
          /*
          //var triangle_points = this.matter.world.fromPath('0 0 100 0 0 100');
          let curGameObject = getGameObjectFromBody(Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, coords)[0].body);
          //var trianglePoints = curGameObject.vertices.slice(0, 3);
          let trianglePoints = Object.entries(curGameObject.body.vertices).slice(0,3).map(entry => entry[1]);
          console.log(trianglePoints)

          let newObject = Matter.Bodies.fromVertices(x, y, trianglePoints);
          World.addBody(engine.world, newObject)
          console.log(curGameObject.id)
          //curGameObject.body.angle = Math.PI / 4;
          */
        }
    }
  }

  gameTick() {
    if(this.removeAnimation) {
      this.sprite.position.x = lerp(this.sprite.position.x, player.position.x, .1)
      this.sprite.position.y = lerp(this.sprite.position.y, player.position.y + 20, .1)
      this.sprite.width = lerp(this.sprite.width, 0, .1)
      this.sprite.height = lerp(this.sprite.height, 0, .1)
      if(this.sprite.width <= 5) {
        queueSF(sounds.pop);
        let firstSlot = player.crafting.getFirstAvailableSlot();
        if(firstSlot >= 0) {
          let itemObject = new Item(this._engine, firstSlot, this.texture, this.worldType)
          player.onObjectMined(itemObject)
        }
        super.destroy();
      }
    }
  }

  destroy(actually=false) {
    this.readyToBeRemoved = true;
    if(actually) { // I was tired okay
      this.updateBlockFormsAroundMe();
      Matter.Composite.remove(engine.world, this.body);
      this.body = false;
      this.removeAnimation = true;
      /*new Item(this._engine, this.position.x, this.position.y, BLOCK_SIZE, this.texture, this.body.worldType);
      super.destroy();*/
    }
  }

  cleanup() {
    if(this.surfaceDebris) {
      this.surfaceDebris.parent.removeChild(this.surfaceDebris);
      this.surfaceDebris = null;
    }
  }

  get hp() {
    return this._hp;
  }

  set hp(hp) {
    this._hp = hp;
    if(hp > 0) {
      this.readyToBeRemoved = false;
    }
  }

  status() {
    return this.type + " has " + this.hp + " hit points";
  }
}

