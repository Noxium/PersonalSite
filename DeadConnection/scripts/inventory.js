class Inventory {
  constructor() {
    this.inventoryItems = [];
    this.inventoryItemSprites = [];

    this.inventorySpriteItemSize = 60;
    this.inventorySpriteSlotSize = 80;
    this.inventorySpritePadding = (this.inventorySpriteSlotSize - this.inventorySpriteItemSize) / 2;
    this.inventorySpriteOffsetX = 20;
    this.inventorySpriteOffsetY = 10;
    this.inventorySpriteHeight = 80;
    this.inventorySpriteWidth = 1;
    this.inventorySpriteTargetWidth = 0;
    this.inventorySpriteCornerRadius = 10;
    this.inventorySpriteAlpha = 0.75

    this.inventorySpriteLeftBar = new PIXI.Graphics();
    this.inventorySpriteLeftBar.beginFill(0x000000);
    this.inventorySpriteLeftBar.arc(this.inventorySpriteOffsetX, this.inventorySpriteOffsetY + this.inventorySpriteHeight - this.inventorySpriteCornerRadius, this.inventorySpriteCornerRadius, Math.PI/2, Math.PI);
    this.inventorySpriteLeftBar.arc(this.inventorySpriteOffsetX, this.inventorySpriteOffsetY + this.inventorySpriteCornerRadius, this.inventorySpriteCornerRadius, Math.PI, 3 * Math.PI/2);
    this.inventorySpriteLeftBar.endFill();

    this.inventorySpriteMainBar = new PIXI.Graphics();
    this.inventorySpriteMainBar.beginFill(0x000000);
    this.inventorySpriteMainBar.drawRect(0, 0, this.inventorySpriteWidth, this.inventorySpriteHeight);
    this.inventorySpriteMainBar.endFill();

    this.inventorySpriteRightBar = new PIXI.Graphics();
    this.inventorySpriteRightBar.beginFill(0x000000);
    this.inventorySpriteRightBar.arc(0, this.inventorySpriteHeight - this.inventorySpriteCornerRadius, this.inventorySpriteCornerRadius, 0, Math.PI/2);
    this.inventorySpriteRightBar.arc(0, this.inventorySpriteCornerRadius, this.inventorySpriteCornerRadius, 3 * Math.PI/2, 0);
    this.inventorySpriteRightBar.endFill();

    this.inventorySpriteLeftBar.alpha = this.inventorySpriteAlpha;
    this.inventorySpriteMainBar.alpha = this.inventorySpriteAlpha;
    this.inventorySpriteRightBar.alpha = this.inventorySpriteAlpha;
    containers.uiContainer.addChild(this.inventorySpriteLeftBar);
    containers.uiContainer.addChild(this.inventorySpriteMainBar);
    containers.uiContainer.addChild(this.inventorySpriteRightBar);
  }

  addItem(item) {
    if(this.inventoryItems.length >= 12) {
      return;
    }
    this.inventoryItems.push(item)
    this.inventorySpriteTargetWidth = this.inventoryItems.length * this.inventorySpriteSlotSize;
    let sprite = new PIXI.Sprite(item.texture);
    sprite.width = 0;
    sprite.height = 0;
    containers.uiContainer.addChild(sprite);
    this.inventoryItemSprites.push(sprite);
  }

  removeItem(index) {
    //TODO
    if(this.inventoryItems.length == 0) {
      return;
    }
    this.inventoryItems.shift();
    let IISlen = this.inventoryItemSprites.length
    this.inventoryItemSprites[IISlen - 1].parent.removeChild(this.inventoryItemSprites[IISlen - 1])
    this.inventoryItemSprites[IISlen - 1] = null;
    this.inventoryItemSprites.pop();
    this.inventorySpriteTargetWidth = this.inventoryItems.length * this.inventorySpriteSlotSize;
    /*if(index >= this.inventory.size()) {
      console.error("attempting to remove an inventory item that doesn't exist");
      return;
    }
    this.inventory.shift*/
  }

  gameTick() {
    if(this.inventorySpriteWidth != this.inventorySpriteTargetWidth) {
      this.inventorySpriteWidth = lerp(this.inventorySpriteWidth, this.inventorySpriteTargetWidth, .1);
      if(Math.abs(this.inventorySpriteWidth - this.inventorySpriteTargetWidth) < 1) {
        this.inventorySpriteWidth = this.inventorySpriteTargetWidth;
      }
    }
    if(this.inventorySpriteWidth < this.inventorySpriteSlotSize) {
      this.inventorySpriteLeftBar.alpha = (this.inventorySpriteWidth / this.inventorySpriteSlotSize) * this.inventorySpriteAlpha;
      this.inventorySpriteMainBar.alpha = (this.inventorySpriteWidth / this.inventorySpriteSlotSize) * this.inventorySpriteAlpha;
      this.inventorySpriteRightBar.alpha = (this.inventorySpriteWidth / this.inventorySpriteSlotSize) * this.inventorySpriteAlpha;
    }

    this.inventorySpriteMainBar.x = this.inventorySpriteOffsetX;
    this.inventorySpriteMainBar.y = this.inventorySpriteOffsetY;
    this.inventorySpriteMainBar.width = this.inventorySpriteWidth;
    this.inventorySpriteRightBar.x = this.inventorySpriteOffsetX + this.inventorySpriteWidth;
    this.inventorySpriteRightBar.y = this.inventorySpriteOffsetY;

    for(let i in this.inventoryItemSprites) {
      let sprite = this.inventoryItemSprites[i];
      sprite.x = (this.inventorySpriteSlotSize * i) + this.inventorySpriteOffsetX + this.inventorySpritePadding;
      sprite.y = this.inventorySpriteOffsetY + this.inventorySpritePadding;
      if(sprite != this.inventorySpriteItemSize) {
        sprite.width = lerp(sprite.width, this.inventorySpriteItemSize, .1);
        sprite.height = lerp(sprite.height, this.inventorySpriteItemSize, .1);
      }
    }
  }

  hide() {
    containers.uiContainer.alpha = 0.0;
  }

  show() {
    containers.uiContainer.alpha = 1.0;
  }

  getItem(slotNumber) {
    if(slotNumber < this.inventoryItems.length) {
      return this.inventoryItems[slotNumber];
    }
    return null;
  }
}
