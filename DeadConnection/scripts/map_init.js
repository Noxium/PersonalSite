console.log("map_init.js loaded");

function genMap() {
  //let map = new Array(width).fill(0).map(() => new Array(height).fill(0));

  let surface = [];
  noise.seed(Date.now());
  let sheet = app.loader.resources.sheet

  for(let x = -WORLD_WIDTH/2; x < WORLD_WIDTH/2; x++) {
    let value = noise.simplex2(x / 100, x / 100);
    let surfheight = Math.floor(value * 5);
    surface.push(new Block(x * BLOCK_SIZE, surfheight * BLOCK_SIZE + BLOCK_SIZE * 2,sheet.textures["compactedIceSurface.png"], "compactedIce", 100));
  }
  for(let surf of surface) {
    for(let y = surf.y + BLOCK_SIZE; y < WORLD_HEIGHT * BLOCK_SIZE; y += BLOCK_SIZE) {
      if(Math.floor(Math.random() * 35) == 0) {
        new Block(surf.body.position.x, y, sheet.textures["copper.png"], "copper", 100);
      } else {
        new Block(surf.body.position.x, y, sheet.textures["compactedIce.png"], "compactedIce", 100);
      }
    }
  }
}

