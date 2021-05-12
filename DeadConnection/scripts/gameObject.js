class GameObject {
  constructor(engine, x, y, width, height, texture, type="none", hp=100, isPhysics=false, isSVG=false, gravityEnabled=true, cFilter=null, container=containers.mainContainer) {
    this._engine = engine;
    this.alive = true;
    this.x = x;
    this.y = y;
    if(width > 0 && height > 0) {
      this.width = width;
      this.height = height;
    }
    this.texture = texture;
    this.worldType = type;
    this.maxHP = hp;
    this._hp = hp;
    this.isPhysics = isPhysics;
    this.isSVG = isSVG;
    this.gravityEnabled = gravityEnabled;

    this.initSprite(container);
    this.id = -1;
    if(this.isPhysics && !this.isSVG) {
      this.initPhysics(null, cFilter);
      this.id = this.body.id;
    } else {
      this.id = Matter.Common.nextId();
    }
    this.physicsLoaded = false;
    gameObjects.push(this);
  }

  initSprite(container) {
    this.sprite = new PIXI.Sprite(this.texture);
    this.sprite.anchor.set(0.5);
    this.sprite.x = this.x;
    this.sprite.y = this.y;
    if(this.width > 0 && this.height > 0) {
      this.sprite.width = this.width;
      this.sprite.height = this.height;
    }

    container.addChild(this.sprite);
  }

  initPhysics(svg=null, cFilter=null) {
    if(svg == null) {
      if(cFilter) {
        this._body = Bodies.rectangle(this.sprite.x, this.sprite.y, this.sprite.width, this.sprite.height, {
          isStatic: !this.gravityEnabled,
          restitution: 0,
          inertia: Infinity,
          collisions_down: 0,
          collisionFilter: {
            group: cFilter
          }
        });
        World.addBody(engine.world, this._body);
      } else {
        this._body = Bodies.rectangle(this.sprite.x, this.sprite.y, this.sprite.width, this.sprite.height, {
          isStatic: !this.gravityEnabled,
          restitution: 0,
          inertia: Infinity,
          collisions_down: 0,
        });
        World.addBody(engine.world, this._body);
      }
    }
  }

  get body() {
    return this._body;
  }

  set body(body) {
    this._body = body;
  }

  get sprite() {
    return this._sprite;
  }

  set sprite(sprite) {
    this._sprite = sprite;
  }

  get position() {
    return this._body.position
  }

  get type() {
    return this.worldType;
  }

  get hp() {
    return this._hp;
  }

  set hp(hp) {
    this._hp = hp;
  }

  /*
  get width() {
    return this.sprite.width
  }

  get height() {
    return this.sprite.height
  }

  set width(w) {
    this.sprite.width = w;
    this.body
  }

  set height(h) {

  }
  */

  getNeighbor(direction) {
    if(this.physicsLoaded) {
      let object;
      switch(direction) {
        case directions.NORTH:
          object = Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, {x: this.body.position.x, y: this.body.position.y - BLOCK_SIZE})[1];
          if(object) {
            return getGameObjectFromBody(object.body);
          }
          break;

        case directions.EAST:
          object = Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, {x: this.body.position.x + BLOCK_SIZE, y: this.body.position.y})[1];
          if(object) {
            return getGameObjectFromBody(object.body);
          }
          break;

        case directions.SOUTH:
          object = Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, {x: this.body.position.x, y: this.body.position.y + BLOCK_SIZE})[1];
          if(object) {
            return getGameObjectFromBody(object.body);
          }
          break;

        case directions.WEST:
          object = Matter.Query.ray(Matter.Composite.allBodies(engine.world), this.body.position, {x: this.body.position.x - BLOCK_SIZE, y: this.body.position.y})[0];
          if(object) {
            return getGameObjectFromBody(object.body);
          }
          break;

        default:
          console.error("attempting to get the neighbor in an invalid direction")
      }
    }
    // not physics, or physics not loaded
    return null;
  }

  update(delta) {
    if(this.alive) {
      if(this.isPhysics) {
        if(!this.physicsLoaded) {
          if(this.body) {
            this.physicsLoaded = true;
            this.onBodyLoaded();
          }
        }
      }

      this.gameTick(delta);

      if(this.body) {
        this.sprite.position = this.body.position;
        this.sprite.rotation = this.body.angle;
      }
    }
  }

  gameTick(delta) {
    // placeholder
  }

  onBodyLoaded() {
    // placeholder
  }

  // called on object destruction
  cleanup() {
    // placeholder
  }

  dealDamage(damage) {
    if(this.alive) {
      this.hp -= damage;
      if(this.hp <= 0) {
        this.hp = 0;
        this.destroy();
      }
    }
  }

  destroy() {
    this.alive = false;
    this.cleanup();
    this.sprite.parent.removeChild(this.sprite);
    this.sprite = null;
    Matter.Composite.remove(engine.world, this.body);
    this.body = null;
    let i = 0;
    for(i in gameObjects) {
      if(gameObjects[i].id == this.id) {
        gameObjects.splice(i, 1);
      }
    }
    // gameObjects.splice(gameObjects.find(object => object.id == this.id), 1);
  }
}

