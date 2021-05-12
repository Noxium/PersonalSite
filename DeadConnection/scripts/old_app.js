const app = new PIXI.Application({ 
  backgroundColor: 0x10A0C0,
  antialias: false,
  width: 1200,
  height: 600,
});
document.body.appendChild(app.view);
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

var Engine = Matter.Engine,
    World = Matter.World,
    Bodies = Matter.Bodies;
    Body = Matter.Body;

var engine = Engine.create();

const texture = PIXI.Texture,
      sprite = PIXI.Sprite;

const WIDTH = app.screen.width,
      HEIGHT = app.screen.height;

const CHUNK_SIZE = 32,
      BLOCK_SIZE = 100,
      WORLD_WIDTH = 50,
      WORLD_HEIGHT = 30,
      SURFACE_Z = 5,
      MOVE_SPEED = BLOCK_SIZE/15,
      PLAYER_WIDTH = BLOCK_SIZE-5,
      PLAYER_HEIGHT = BLOCK_SIZE-5,
      JUMP_HEIGHT = 9;

const sceneObjects = [];

function createObject(image, x, y, width, height, gravity_enabled=true, type='default') {
  const imageBody = Bodies.rectangle(
    x,
    y,
    width,
    height,
    {
      isStatic: !gravity_enabled,
      restitution: 0.0,  // prevent bouncing
      inertia: Infinity, // prevent rotation
      world_type: type,
      collisions_down: 0,
    }
  );

  World.addBody(engine.world, imageBody);

  const imageTex = new texture.from(image);
  const imageSprite = new sprite(imageTex);
  imageSprite.width = width;
  imageSprite.height = height;
  imageSprite.position;
  imageSprite.anchor.set(0.5, 0.5);
  app.stage.addChild(imageSprite);

  sceneObjects.push({
    body: imageBody,
    sprite: imageSprite,
  });
}

const world_blocks = new PIXI.Container()
app.stage.addChild(world_blocks);

createObject(
  'assets/grass_3.png',
  BLOCK_SIZE,
  SURFACE_Z * BLOCK_SIZE - BLOCK_SIZE,
  BLOCK_SIZE,
  BLOCK_SIZE,
  false
);
for(let i = 0; i < WORLD_HEIGHT; i++) {
  for(let j = -WORLD_WIDTH; j < WORLD_WIDTH; j++) {
    if(i == 0){
      createObject(
        'assets/grass_3.png',
        j * BLOCK_SIZE,
        (i + SURFACE_Z) * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE,
        false
      );
  } else {
      createObject(
        'assets/dirt_3.png',
        j * BLOCK_SIZE,
        (i + SURFACE_Z) * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE,
        false
      );
    }
  }
}

createObject(
  'assets/robot_3.png',
  app.screen.width/2,
  app.screen.height/2,
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  true,
  'player'
);


var keyState = {};
window.addEventListener('keydown',function(e){
    keyState[e.keyCode || e.which] = true;
    //console.log(e.keyCode + " " + e.key);
},true);
window.addEventListener('keyup',function(e){
    keyState[e.keyCode || e.which] = false;
},true);


//Start the game loop
app.ticker.add(delta => gameLoop(delta));

sprint_speed = 1;

Matter.Events.on(engine, 'collisionStart', function(event) {
  event.pairs.forEach(function(obj) {
    let player, floor = null;
    if(obj.bodyA.world_type == 'player') {
      player = obj.bodyA;
      floor = obj.bodyB;
    } else if(obj.bodyB.world_type == 'player') {
      player = obj.bodyB;
      floor = obj.bodyA;
    }
    if(player != null && floor != null) {
      if(floor.position.y > player.position.y) {
        player.collisions_down++;
      }
    }
  });
});

Matter.Events.on(engine, 'collisionEnd', function(event) {
  event.pairs.forEach(function(obj) {
    let player, floor = null;
    if(obj.bodyA.world_type == 'player') {
      player = obj.bodyA;
      floor = obj.bodyB;
    } else if(obj.bodyB.world_type == 'player') {
      player = obj.bodyB;
      floor = obj.bodyA;
    }
    if(player != null && floor != null) {
      if(floor.position.y > player.position.y) {
        player.collisions_down--;
      }
    }
  });
});

//TODO this is awful
sceneObjectBodies = [];
sceneObjects.forEach(object => {
  sceneObjectBodies.push(object.body);
});

function gameLoop(delta) {
  sceneObjects.forEach(object => {
    if(object.body.world_type == 'player') {
      let player = object.body;
      if(keyState[16] || keyState[17]) {
        // shift or ctrl
        sprint_speed = 1.5
      } else {
        sprint_speed = 1;
      }
      if (keyState[65]){
        // a
          Body.setVelocity(player, {x: -MOVE_SPEED * sprint_speed, y: player.velocity.y});
        if(object.sprite.scale.x < 0) {
          object.sprite.scale.x *= -1;
        }
      } else {
        if(player.velocity.x < 0) {
          if(player.velocity.x > -0.0001) {
            Body.setVelocity(player, {x: 0, y: player.velocity.y});
          } else {
            Body.setVelocity(player, {x: player.velocity.x/1.07, y: player.velocity.y});
          }
        }
      }
      if (keyState[68]){
        // d
        Body.setVelocity(player, {x: MOVE_SPEED * sprint_speed, y: player.velocity.y});
        if(object.sprite.scale.x > 0) {
          object.sprite.scale.x *= -1;
        }
      } else {
        if(player.velocity.x > 0) {
          if(player.velocity.x < 0.0001) {
            Body.setVelocity(player, {x: 0, y: player.velocity.y});
          } else {
            Body.setVelocity(player, {x: player.velocity.x/1.07, y: player.velocity.y});
          }
        }
      }
      if (keyState[87]){
        // w
        if(player.collisions_down > 0) {
          Body.setVelocity(player, {x: player.velocity.x, y: -JUMP_HEIGHT});
        }
      } else if (keyState[83]){
        // s

        /*
        

        [0]        [1]        [2]        [3]        [4]        [5]
          [0]        [0]
            body       body
          [1]        [1]
            sprite     sprite


        */
        console.log(sceneObjects);
        console.log(sceneObjectBodies);
        closestBlock = raycast(sceneObjectBodies, player.position, {x: player.position.x, y: player.position.y + BLOCK_SIZE})[0];
        deltaX = player.position.x - closestBlock.body.position.x;
        if(Math.abs(deltaX) < 0.01) {
          Body.setPosition(player, {x: closestBlock.body.position.x, y: player.position.y});
          Body.setVelocity(player, {x: 0, y: 0});
          console.log("Hello");
          app.stage.removeChild(closestBlock);
        } else if(player.position.x < closestBlock.body.position.x) {
          Body.setVelocity(player, {x: -deltaX/5, y: player.velocity.y});
        } else {
          Body.setVelocity(player, {x: -deltaX/5, y: player.velocity.y});
        }
      }
      app.stage.pivot.x = player.position.x - (WIDTH / 2);
      app.stage.pivot.y = player.position.y - (HEIGHT / 2);
    }
    object.sprite.position = object.body.position;
    object.sprite.rotation = object.body.angle;
  });
}

Engine.run(engine);

