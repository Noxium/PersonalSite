let app;
let player;
let Engine = Matter.Engine;
let World = Matter.World;
let Bodies = Matter.Bodies;
let Body = Matter.Body;
let keyState = {};
let loadingBarOutline;
let loadingBarFill;
let inStartMenu = true;
let startMenuScroll = 0.5;

let engine = Engine.create({
  enableSleeping: true,
});

const texture = PIXI.Texture;
const sprite = PIXI.Sprite;
const WIDTH = window.innerWidth;
const HEIGHT = window.innerHeight;
const CHUNK_SIZE = 32;
const BLOCK_SIZE = 64;
const ITEM_SIZE = BLOCK_SIZE/4;
const WORLD_WIDTH = 120;
const WORLD_HEIGHT = 20;
const SURFACE_Z = 7;
const PLAYER_SPEED = 0.3;
const PLAYER_WIDTH = 103;
const PLAYER_HEIGHT = 47;
const JUMP_HEIGHT = 0.09;
const gameObjects = [];
const RENDER_PHYSICS = false;
const directions = {
  NORTH: 0,
  EAST: 1,
  SOUTH: 2,
  WEST: 3,
}
var render;
const sounds = {
  pop: new Audio('audio/pop.mp3'),
}

let soundEffectQueue = []

const containers = {
  // rendered farthest from camera
  bgLayerParallax: new PIXI.Container,
  bgLayerFar: new PIXI.Container,
  mainContainer: new PIXI.Container(),
  playerParentContainer: new PIXI.Container(),
  playerContainer: new PIXI.Container(),
  playerChildContainer: new PIXI.Container(),
  bgLayerClose: new PIXI.Container,
  uiContainer: new PIXI.Container(),
  craftingContainer: new PIXI.Container(),
  craftingChildContainer: new PIXI.Container(),
  startMenuContainer: new PIXI.Container(),
  // rendered closest to camera
}

let mousePos = {x: 0, y: 0}
let screenBoundaries = {
  north: 0,
  east: WIDTH,
  south: HEIGHT,
  west: 0,
}
let fpsCount = new PIXI.Text("X");

window.onload = function() {
    app = new PIXI.Application({
      backgroundColor: 0x748184,
      antialias: false,
      width: WIDTH,
      height: HEIGHT,
    });

  app.renderer.resize(window.innerWidth, window.innerHeight);
  PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
  //if(RENDER_PHYSICS) {
    render = Matter.Render.create({
      element: document.body,
      engine: engine,
      options: {
        width: WIDTH,
        height: HEIGHT,
        showAngleIndicator: true,
        hasBounds: true, // allows us to update 'camera' position
      }
    });

  Matter.Render.run(render);
  if(!RENDER_PHYSICS) {
    document.body.removeChild(document.body.getElementsByTagName('canvas')[0]);
    document.body.appendChild(app.view);
  }
  document.body.scrollTop = 0;
  document.body.style.overflow = 'hidden';

  app.loader.baseUrl = "assets";
  app.loader
    .add("snow", "bg/snow.png")
    .add("cloud1", "bg/cloud1.png")
    .add("cloud2", "bg/cloud2.png")
    .add("sheet", "spriteSheet.json")
    .add("tracks", "tracks.json")
    .add("body", "body.json")
    .add("drill", "drill.json")
    .add("methane", "methanelow.json")
    .add("gasFlow", "gasFlow.json")
    .add("materialFormer", "materialFormer.json");
  app.loader.onProgress.add(showProgress);
  app.loader.onComplete.add(doneLoading);
  app.loader.load();
  loadingBarOutline = new PIXI.Graphics();
  loadingBarOutline.lineStyle(2, 0x000000);
  loadingBarOutline.beginFill(0x000000);
  loadingBarOutline.drawRect(app.screen.width / 2 - 150, 3 * app.screen.height/4, 300, 10);
  loadingBarOutline.endFill();

  loadingBarFill = new PIXI.Graphics();
  loadingBarFill.beginFill(0x00FF00);
  loadingBarFill.drawRect(0, 0, 1, 10);
  loadingBarFill.endFill();
  loadingBarFill.x = app.screen.width / 2 - 150;
  loadingBarFill.y = 3 * app.screen.height / 4
  app.stage.addChild(loadingBarOutline)
  app.stage.addChild(loadingBarFill);
}

function showProgress(e) {
  loadingBarFill.scale.x = e.progress * 3;
}

function doneLoading() {
  app.stage.removeChild(loadingBarFill);
  app.stage.removeChild(loadingBarOutline);
  for(container in containers) {
    app.stage.addChild(containers[container]);
  }

  let sheet = app.loader.resources.sheet;

  genMap();
  background = new Background(engine);

  //player = new Player(engine, app.screen.width/2, app.screen.height/2 - BLOCK_SIZE);
  fpsCount.x = 0;
  fpsCount.y = 0;
  //app.stage.addChild(fpsCount);

  let overlay = new PIXI.Graphics();
  overlay.beginFill(0x191C20);
  overlay.drawRect(0, 0, WIDTH, HEIGHT);
  overlay.alpha = 0.5
  containers.startMenuContainer.addChild(overlay);

  let titleText1 = new PIXI.Text("DEAD", {fontFamily: 'Formal Future', fontSize: 128, fill: "black"});
  let titleText2 = new PIXI.Text("CONNECTION", {fontFamily: 'Formal Future', fontSize: 128, fill: "black"});
  titleText1.fill = 0xffffff;
  titleText2.fill = 0xffffff;
  titleText1.x = 100;
  titleText1.y = 50;
  titleText2.x = 100;
  titleText2.y = 250;
  containers.startMenuContainer.addChild(titleText1);
  containers.startMenuContainer.addChild(titleText2);

  this.planet = new PIXI.Sprite(sheet.textures["planet.png"]);
  planet.anchor.set(0.5, 0.5);
  planet.x = titleText1.x + titleText1.width + planet.width;
  planet.y = 150;
  containers.startMenuContainer.addChild(planet);



  let startButton = new PIXI.Graphics();
  startButton.lineStyle(1, 0x000000);
  startButton.beginFill(0x707070);
  startButton.drawRect(0, 0, 225, 50);
  startButton.endFill;
  startButton.position.x = WIDTH / 2 - startButton.width / 2;
  startButton.position.y = HEIGHT - 200;

  let startText = new PIXI.Text("new game", {fontFamily: 'Formal Future', fontSize: 28, fill: "black"});
  startText.anchor.set(0.5, 0.0);
  startText.x = startButton.x + startButton.width/2;
  startText.y = startButton.y;

  startButton.interactive = true;
  startButton.buttonMode = true;
  startButton.on('mouseover', function(e) { newGameMouseOver(startText); })
  startButton.on('mouseout', function(e) { newGameMouseOut(startText); })
  startButton.on('mousedown', function(e) { newGame(); })
  containers.startMenuContainer.addChild(startButton);
  containers.startMenuContainer.addChild(startText);

  let rendererIsPhysics = RENDER_PHYSICS;
  window.addEventListener('keydown',function(e){
      //console.log(e.key, e.keyCode)
      keyState[e.keyCode || e.which] = true;
      /*if(e.keyCode == 69) {
        // \t (toggle manual arm control on rover)
        player.toggleManualArmControl();
      }*/
      if(e.keyCode == 70) {
        // f
        //player.inventory.removeItem();
        if(player.crafting.menuIsOpen) {
          player.closeCraftingMenu();
        } else {
          player.openCraftingMenu();
        }
      }
      if(e.keyCode == 27) {
        // esc
        if(player.crafting.pickup != -1) {
          player.crafting.cancelPickup();
        } else if(player.crafting.menuIsOpen) {
          player.closeCraftingMenu();
        } else if(app.ticker.started){
          engine.enabled = false
          app.ticker.stop();
        } else {
          app.ticker.start();
        }
      }
      if (e.keyCode == 82){
        // r (toggle renderer between physics and sprite)
        //if(RENDER_PHYSICS) {
          document.body.removeChild(document.body.getElementsByTagName('canvas')[0]);
          if(rendererIsPhysics) {
            document.body.appendChild(app.view);
          } else {
            document.body.appendChild(render.canvas);
          }
          rendererIsPhysics = !rendererIsPhysics;
        //}
      }
  },true);
  window.addEventListener('keyup',function(e){
      keyState[e.keyCode || e.which] = false;
  },true);

  Engine.run(engine);
  app.ticker.add(gameLoop);
}

function newGameMouseOver(startText) {
  startText.style.fill = "white"
}

function newGameMouseOut(startText) {
  startText.style.fill = "black"
}

function newGame() {
  player = new Player(engine, app.screen.width/2, app.screen.height/2 - BLOCK_SIZE);
  inStartMenu = false;
  containers.startMenuContainer.destroy({children: true});
}

function getGameObjectFromBody(body) {
  return gameObjects.find(object => object.id == body.id);
}

Matter.Events.on(engine, 'collisionStart', function(event) {
  event.pairs.forEach(function(obj) {
    if(obj.bodyA.label == "playerCollisionW" || obj.bodyB.label == "playerCollisionW") {
      player.collisionsW++;
    }
    if(obj.bodyA.label == "playerCollisionE" || obj.bodyB.label == "playerCollisionE") {
      player.collisionsE++;
    }
    if(obj.bodyA.label == "playerCollisionS" || obj.bodyB.label == "playerCollisionS") {
      player.collisionsS++;
    }
  });
});

Matter.Events.on(engine, 'collisionEnd', function(event) {
  event.pairs.forEach(function(obj) {
    if(obj.bodyA.label == "playerCollisionW" || obj.bodyB.label == "playerCollisionW") {
      player.collisionsW--;
    }
    if(obj.bodyA.label == "playerCollisionE" || obj.bodyB.label == "playerCollisionE") {
      player.collisionsE--;
    }
    if(obj.bodyA.label == "playerCollisionS" || obj.bodyB.label == "playerCollisionS") {
      player.collisionsS--;
    }
  });
});

onmousemove = function(e){
  mousePos.x = e.clientX;
  mousePos.y = e.clientY;
};

let sprint_speed = 1;

// credit to @mattdesl on Github for the following linear interpolation code
// https://github.com/mattdesl/lerp
function lerp(v0, v1, t) {
  return v0 * (1 - t) + v1 * t;
}

let lastFPS = 0;

function queueSF(audio) {
  soundEffectQueue.push(audio);
  if(soundEffectQueue.length == 1) {
    //soundEffectQueue[0].play()
  }
}

function gameLoop(delta) {
  gameObjects.forEach(object => {
    object.update(delta);
  });
  if(inStartMenu) {
    app.stage.pivot.x += startMenuScroll;
    app.stage.pivot.y = - 2 * HEIGHT/3;
    containers.startMenuContainer.pivot.x = -screenBoundaries.west;
    containers.startMenuContainer.pivot.y = -screenBoundaries.north;
  }
  containers.uiContainer.pivot.x = -screenBoundaries.west;
  containers.uiContainer.pivot.y = -screenBoundaries.north;
  containers.craftingContainer.pivot.x = -screenBoundaries.west;
  containers.craftingContainer.pivot.y = -screenBoundaries.north;
  containers.craftingChildContainer.pivot.x = -screenBoundaries.west;
  containers.craftingChildContainer.pivot.y = -screenBoundaries.north;
  if(soundEffectQueue.length != 0) {
    if(soundEffectQueue[0].paused) {
      soundEffectQueue.shift();
      if(soundEffectQueue.length != 0) {
        //soundEffectQueue[0].play();
      }
    }
  }
  if(player && player.physicsLoaded) {
    app.stage.pivot.x = lerp(-app.stage.worldTransform.tx, player.body.position.x - (WIDTH / 2), 0.1 * delta);
    app.stage.pivot.y = lerp(-app.stage.worldTransform.ty, player.body.position.y - (3 * HEIGHT / 5), 0.1 * delta);
  }
  screenBoundaries.north = app.stage.pivot.y;
  screenBoundaries.east = app.stage.pivot.x + WIDTH;
  screenBoundaries.south =  app.stage.pivot.y + HEIGHT;
  screenBoundaries.west = app.stage.pivot.x;

  //if(RENDER_PHYSICS) {
    render.bounds.min.x = screenBoundaries.west;
    render.bounds.max.x = screenBoundaries.east
    render.bounds.min.y = screenBoundaries.north
    render.bounds.max.y = screenBoundaries.south
  //}

  let fps = Math.round(app.ticker.FPS);
  if(lastFPS - fps > 20) {
    fpsCount.text = Math.round(app.ticker.FPS) + " SPIKE";
    //console.log("SPIKE!");
  } else {
    fpsCount.text = Math.round(app.ticker.FPS);
  }
  fpsCount.x = screenBoundaries.west;
  fpsCount.y = screenBoundaries.north;
  lastFPS = fps;
}

