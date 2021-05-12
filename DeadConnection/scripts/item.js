class Item extends GameObject {
  constructor(engine, slot, texture, type) {
    super(engine, -1, -1, BLOCK_SIZE, BLOCK_SIZE, texture, type, 100, false, false, false, null, containers.craftingContainer);
    this.slot = slot;
    this.sprite.parentObject = this; // fuck it
    this.sprite.interactive = true;
    this.sprite.buttonMode = true;
    this.sprite.on('mousedown', function(e) { clickSprite(this.parentObject); });
  }

  gameTick() {
  }
}
