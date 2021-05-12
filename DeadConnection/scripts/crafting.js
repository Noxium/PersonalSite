class Crafting {
  constructor(inventory) {
    this.inventory = inventory;
    this.inventorySprites = [];
    this.menuIsOpen = false;
    this.pickup = undefined;
    this.currentPickupIsValidLocation = false;
    this.currentPickupOriginX = -1;
    this.currentPickupOriginY = -1;

    this.centerX = WIDTH/2;
    this.centerY = HEIGHT/2;
    let windowWidth = 800
    let windowHeight = 500
    let craftingSpriteAlpha = 0.98

    this.craftingRows = 3;
    this.craftingCols = 4;
    this.craftingInventorySlots = [];
    this.craftingInventoryHighlightSlots = [];
    this.activeInventoryHighlightSlots = [];
    this.keepGas = true; // state of the gas diverter
    this.gasFlowSprites = []
    this.ovenItem = null;

    this.craftingBase = new PIXI.Graphics();
    this.craftingBase.lineStyle(2, 0x30363d);
    this.craftingBase.beginFill(0x090C10);
    this.craftingBase.drawRoundedRect(this.centerX - windowWidth/2, this.centerY - windowHeight/2, windowWidth, windowHeight, 15);
    this.craftingBase.endFill();
    this.craftingBase.alpha = craftingSpriteAlpha;
    containers.craftingContainer.addChild(this.craftingBase);

    this.rtgSprite = new PIXI.Sprite(app.loader.resources.sheet.textures["rtg.png"]);
    this.rtgSprite.anchor.set(0.5);
    this.rtgSprite.x = this.centerX + 90;
    this.rtgSprite.y = this.centerY + 135;
    this.rtgSprite.scale.x = 3;
    this.rtgSprite.scale.y = 3;
    containers.craftingContainer.addChild(this.rtgSprite);

    this.flamez = new PIXI.Sprite(app.loader.resources.sheet.textures["fire.png"]);
    this.flamez.anchor.set(0.5);
    this.flamez.x = this.centerX + 190;
    this.flamez.y = this.centerY + 185;
    this.flamez.scale.x = 3;
    this.flamez.scale.y = 3;
    containers.craftingContainer.addChild(this.flamez);

    this.leftEdge = this.centerX - windowWidth/2;
    this.topEdge = this.centerY - windowHeight/2;
    this.rightEdge = this.centerX + windowWidth/2;
    this.bottomEdge = this.centerY + windowHeight/2;
    this.slotOffsetX = 40;
    this.slotOffsetY = 30;
    this.slotSize = 75;
    this.slotPadding = 90;
    this.slotBounds = []; // {x, y, slotID, label}
    for(let i = 0; i < this.craftingRows; i++) {
      for(let j = 0; j < this.craftingCols; j++) {
        // add slot box
        let slotX = this.leftEdge + this.slotOffsetX + (j * this.slotPadding)
        let slotY = this.centerY - this.slotSize/2 + (i * this.slotPadding)
        let slotSprite = new PIXI.Graphics();
        slotSprite.lineStyle(1, 0x30363d);
        slotSprite.beginFill(0x090C10);
        slotSprite.drawRect(slotX, slotY, this.slotSize, this.slotSize);
        slotSprite.endFill()
        let slotNumber = i * this.craftingCols + j;

        this.slotBounds.push({x: slotX, y: slotY, slotID: slotNumber, label: "inventory"});

        this.craftingInventorySlots.push(slotSprite);

        this.craftingInventorySlots[slotNumber].interactive = true;
        this.craftingInventorySlots[slotNumber].on('mousedown', function(e) { placeSprite(slotNumber); })
        containers.craftingContainer.addChild(this.craftingInventorySlots[slotNumber]);

        // add mouseover highlight per slot box
        let highlightSprite = new PIXI.Graphics();
        highlightSprite.beginFill(0xd7dbde);
        highlightSprite.drawRect(this.leftEdge + this.slotOffsetX + (j * this.slotPadding), this.centerY - this.slotSize/2 + (i * this.slotPadding), this.slotSize, this.slotSize);
        slotSprite.endFill()
        highlightSprite.alpha = 0.0;

        this.craftingInventoryHighlightSlots.push(highlightSprite);

        containers.craftingContainer.addChild(this.craftingInventoryHighlightSlots[slotNumber]);
        this.craftingInventoryHighlightSlots[slotNumber].interactive = true;
        this.craftingInventoryHighlightSlots[slotNumber].on('mouseover', function(e) { mouseOverSlot(slotNumber); })
      }
    }

    let slotX = this.rightEdge - this.slotSize - 100;
    let slotY = this.bottomEdge - this.slotSize - 32.5;
    //let ovenSlot = new PIXI.Graphics();
    this.ovenSlot = new PIXI.Graphics();
    this.ovenSlot.lineStyle(1, 0x30363d);
    this.ovenSlot.beginFill(0x090C10);
    this.ovenSlot.drawRect(slotX, slotY, this.slotSize, this.slotSize);
    this.ovenSlot.endFill()
    containers.craftingContainer.addChild(this.ovenSlot);
    this.slotBounds.push({x: slotX, y: slotY, slotID: this.slotBounds.length, label: "oven"});

    // gas flow animations
    let gf1 = new PIXI.AnimatedSprite(app.loader.resources.gasFlow.spritesheet.animations.track);
    gf1.animationSpeed = 0.25;
    gf1.scale.x = 0.9;
    gf1.scale.y = 0.8;
    gf1.position.x = slotX + this.slotSize;
    gf1.position.y = slotY + this.slotSize/2 - gf1.height/2;
    gf1.play();
    this.gasFlowSprites.push(gf1);

    let gf2 = new PIXI.AnimatedSprite(app.loader.resources.gasFlow.spritesheet.animations.track);
    gf2.animationSpeed = 0.25;
    gf2.scale.x = 0.9;
    gf2.scale.y = 0.8;
    gf2.position.x = slotX + this.slotSize + gf2.width;
    gf2.position.y = slotY + this.slotSize/2 - gf2.height/2;
    gf2.play();
    this.gasFlowSprites.push(gf2);

    let gf3 = new PIXI.AnimatedSprite(app.loader.resources.gasFlow.spritesheet.animations.track);
    gf3.animationSpeed = 0.25;
    gf3.scale.x = 0.9;
    gf3.scale.y = 0.8;
    gf3.position.x = (this.rightEdge - this.slotSize/2 + 4);
    gf3.position.y = slotY + this.slotSize/2 - gf3.width;
    gf3.angle = 90;
    gf3.play();
    this.gasFlowSprites.push(gf3);

    let gf4 = new PIXI.AnimatedSprite(app.loader.resources.gasFlow.spritesheet.animations.track);
    gf4.animationSpeed = 0.25;
    gf4.scale.x = 0.9;
    gf4.scale.y = 0.8;
    gf4.position.x = (this.rightEdge - this.slotSize/2 + 4);
    gf4.position.y = slotY + this.slotSize/2 - gf4.width * 2;
    gf4.angle = 90;
    gf4.play();
    this.gasFlowSprites.push(gf4);

    let gf5 = new PIXI.AnimatedSprite(app.loader.resources.gasFlow.spritesheet.animations.track);
    gf5.animationSpeed = 0.25;
    gf5.scale.x = 0.9;
    gf5.scale.y = 0.8;
    gf5.position.x = (this.rightEdge - this.slotSize/2 + 4);
    gf5.position.y = slotY + this.slotSize/2 - gf5.width * 3;
    gf5.angle = 90;
    gf5.play();
    this.gasFlowSprites.push(gf5);

    this.gfIn = new PIXI.AnimatedSprite(app.loader.resources.gasFlow.spritesheet.animations.track);
    this.gfIn.animationSpeed = 0.25;
    this.gfIn.scale.x = 0.9;
    this.gfIn.scale.y = 0.8;
    this.gfIn.position.x = slotX + this.slotSize * 1.25;
    this.gfIn.position.y = slotY - this.slotSize/1 + this.gfIn.height/2-2;
    this.gfIn.play();
    this.gfIn.alpha = 0;
    containers.craftingContainer.addChild(this.gfIn);

    this.gfOut = new PIXI.AnimatedSprite(app.loader.resources.gasFlow.spritesheet.animations.track);
    this.gfOut.animationSpeed = 0.25;
    this.gfOut.scale.x = 0.9;
    this.gfOut.scale.y = 0.8;
    this.gfOut.position.x = slotX + this.slotSize * 2.0-4;
    this.gfOut.position.y = slotY - this.slotSize/1 + this.gfOut.height/2-2;
    this.gfOut.play();
    this.gfOut.alpha = 0;
    containers.craftingContainer.addChild(this.gfOut);

    for(let sprite of this.gasFlowSprites) {
      sprite.alpha = 0;
      containers.craftingContainer.addChild(sprite);
    }

    this.canisterEmpty = new PIXI.Sprite(app.loader.resources.sheet.textures["canisterEmpty.png"]);
    this.canisterEmpty.scale.x = 2;
    this.canisterEmpty.scale.y = 2;
    this.canisterEmpty.angle = 90;
    this.canisterEmpty.position.x = slotX + 3*this.canisterEmpty.height/4;
    this.canisterEmpty.position.y = slotY - this.canisterEmpty.width * 1.5;
    containers.craftingContainer.addChild(this.canisterEmpty);

    this.canisterLow = new PIXI.AnimatedSprite(app.loader.resources.methane.spritesheet.animations.track);
    this.canisterLow.scale.x = 2;
    this.canisterLow.scale.y = 2;
    this.canisterLow.angle = 90;
    this.canisterLow.position.x = slotX + 3*this.canisterLow.height/4;
    this.canisterLow.position.y = slotY - this.canisterLow.width * 1.5;
    this.canisterLow.animationSpeed = 0.2;
    this.canisterLow.play();
    this.canisterLow.alpha = 0;
    containers.craftingContainer.addChild(this.canisterLow);

    this.gasPipe = new PIXI.Graphics();
    this.gasPipe.lineStyle(2, 0xC0C0C0, 1);
    // top pipe 1
    let midY = this.canisterLow.position.y + this.canisterLow.width/2;
    this.gasPipe.moveTo(this.canisterLow.position.x, midY-5);
    this.gasPipe.lineTo(this.rightEdge, midY-5);
    // top pipe 2
    this.gasPipe.moveTo(this.canisterLow.position.x, midY+5);
    this.gasPipe.lineTo(this.rightEdge, midY+5);
    // mid pipe 1
    let midX = (this.rightEdge - this.canisterLow.position.x) / 2 + this.canisterLow.position.x;
    let lowmidY = slotY+this.slotSize/2;
    this.gasPipe.moveTo(midX-5, midY+5);
    this.gasPipe.lineTo(midX-5, lowmidY-5);
    // mid pipe 2
    this.gasPipe.moveTo(midX+5, midY+5);
    this.gasPipe.lineTo(midX+5, lowmidY+5);

    // low pipe 1
    let lowX = slotX + this.slotSize;
    this.gasPipe.moveTo(lowX, lowmidY - 5);
    this.gasPipe.lineTo(midX-5, lowmidY - 5);

    // low pipe 2
    this.gasPipe.moveTo(lowX, lowmidY + 5);
    this.gasPipe.lineTo(midX+5, lowmidY + 5);

    containers.craftingContainer.addChild(this.gasPipe);

    this.diverter = new PIXI.Sprite(app.loader.resources.sheet.textures["gasDiverter.png"]);
    this.diverter.anchor.set(0.5);
    this.diverter.x = midX;
    this.diverter.y = midY;
    this.diverter.scale.x = 1.5;
    this.diverter.scale.y = 1.5;
    containers.craftingContainer.addChild(this.diverter);

    this.diverter.interactive = true;
    this.diverter.buttonMode = true;
    this.diverter.on('mousedown', function(e) {
      player.crafting.toggleDiverter();
    });

    this.materialFormerSprite = new PIXI.AnimatedSprite(app.loader.resources.materialFormer.spritesheet.animations.track);
    this.materialFormerSprite.anchor.set(0.5, 0.5);
    this.materialFormerSprite.scale.x = 1;
    this.materialFormerSprite.scale.y = 1;
    this.materialFormerSprite.position.x = this.rightEdge - this.materialFormerSprite.width/2 - 25;
    this.materialFormerSprite.position.y = this.topEdge + this.materialFormerSprite.height/2;
    this.materialFormerSprite.animationSpeed = 0.3;
    this.materialFormerAnimationBounds = [];
    for(let animation of app.loader.resources.materialFormer.spritesheet.data.meta.frameTags) {
      this.materialFormerAnimationBounds[animation.name] = {"from": animation.from, "to": animation.to};
    }
    containers.craftingChildContainer.addChild(this.materialFormerSprite);

    this.craftButton = new PIXI.Graphics();
    //this.craftButton.anchor.set(0.5, 0.5);
    this.craftButton.lineStyle(1, 0x292929);
    //this.craftButton.beginFill(0x00a666);
    this.craftButton.beginFill(0xffffff);
    this.craftButton.drawRoundedRect(0, 0, 150, 30, 15);
    this.craftButton.endFill();
    this.craftButton.x = this.materialFormerSprite.x - 75;
    this.craftButton.y = this.materialFormerSprite.y + 105,
    this.craftButton.interactive = false;
    this.craftButton.buttonMode = false;
    this.craftButton.on('mousedown', function(e) {
      player.crafting.playCraftingAnimation(40);
    });
    this.craftText = new PIXI.Text("Craft", {fontFamily: 'Formal Future', fontSize: 18});//, align: "center"});
    this.craftText.anchor.set(0.5, 0.0);
    this.craftText.x = this.craftButton.x + this.craftButton.width/2;
    this.craftText.y = this.craftButton.y;
    this.craftButton.tint = 0xdda6a6;
    this.craftText.text = "Invalid"
    this.craftText.fill = 0x000000
    this.craftText.text = "Craft"
    this.craftButton.tint = 0x00a666;
    this.craftText.fill = 0x292929;

    containers.craftingContainer.addChild(this.craftButton);
    containers.craftingContainer.addChild(this.craftText);

    this.craftSlot1 = new PIXI.Graphics();
    this.craftSlot1.lineStyle(1, 0x30363d);
    this.craftSlot1.beginFill(0x090C10);
    this.craftSlot1.drawRect(0, 0, this.slotSize, this.slotSize);
    this.craftSlot1.endFill();
    this.craftSlot1.x = this.materialFormerSprite.x - 3 * this.slotSize / 2;
    this.craftSlot1.y = this.materialFormerSprite.y - this.slotSize;
    this.slotBounds.push({x: this.craftSlot1.x, y: this.craftSlot1.y, slotID: this.slotBounds.length, label: "craft"});

    this.craftSlot2 = new PIXI.Graphics();
    this.craftSlot2.lineStyle(1, 0x30363d);
    this.craftSlot2.beginFill(0x090C10);
    this.craftSlot2.drawRect(0, 0, this.slotSize, this.slotSize);
    this.craftSlot2.endFill();
    this.craftSlot2.x = this.materialFormerSprite.x + this.slotSize / 2;
    this.craftSlot2.y = this.materialFormerSprite.y - this.slotSize;
    this.slotBounds.push({x: this.craftSlot2.x, y: this.craftSlot2.y, slotID: this.slotBounds.length, label: "craft"});

    this.craftSlot3 = new PIXI.Graphics();
    this.craftSlot3.lineStyle(1, 0x30363d);
    this.craftSlot3.beginFill(0x090C10);
    this.craftSlot3.drawRect(0, 0, this.slotSize, this.slotSize);
    this.craftSlot3.endFill();
    this.craftSlot3.x = this.materialFormerSprite.x - 3 * this.slotSize / 2;
    this.craftSlot3.y = this.materialFormerSprite.y;
    this.slotBounds.push({x: this.craftSlot3.x, y: this.craftSlot3.y, slotID: this.slotBounds.length, label: "craft"});

    this.craftSlot4 = new PIXI.Graphics();
    this.craftSlot4.lineStyle(1, 0x30363d);
    this.craftSlot4.beginFill(0x090C10);
    this.craftSlot4.drawRect(0, 0, this.slotSize, this.slotSize);
    this.craftSlot4.endFill();
    this.craftSlot4.x = this.materialFormerSprite.x + this.slotSize / 2;
    this.craftSlot4.y = this.materialFormerSprite.y;
    this.slotBounds.push({x: this.craftSlot4.x, y: this.craftSlot4.y, slotID: this.slotBounds.length, label: "craft"});

    this.craftSlotOut = new PIXI.Graphics();
    this.craftSlotOut.lineStyle(1, 0x30363d);
    this.craftSlotOut.beginFill(0x191C20);
    this.craftSlotOut.drawRect(0, 0, this.slotSize, this.slotSize);
    this.craftSlotOut.endFill();
    this.craftSlotOut.x = this.materialFormerSprite.x - this.slotSize / 2;
    this.craftSlotOut.y = this.materialFormerSprite.y - this.slotSize / 2;

    /*this.craftSlot1.interactive = true;
    this.craftSlot1.buttonMode = true;
    this.craftSlot1.on('mousedown', function(e) {
      console.log("slot1");
    });
    this.craftSlot2.interactive = true;
    this.craftSlot2.buttonMode = true;
    this.craftSlot2.on('mousedown', function(e) {
      console.log("slot2");
    });
    this.craftSlot3.interactive = true;
    this.craftSlot3.buttonMode = true;
    this.craftSlot3.on('mousedown', function(e) {
      console.log("slot3");
    });
    this.craftSlot4.interactive = true;
    this.craftSlot4.buttonMode = true;
    this.craftSlot4.on('mousedown', function(e) {
      player.crafting.placeItem();
    });
    */
    containers.craftingContainer.addChild(this.craftSlot1);
    containers.craftingContainer.addChild(this.craftSlot2);
    containers.craftingContainer.addChild(this.craftSlot3);
    containers.craftingContainer.addChild(this.craftSlot4);
    containers.craftingContainer.addChild(this.craftSlotOut);

    containers.craftingContainer.alpha = 0.0;
    containers.craftingChildContainer.alpha = 0.0;
  }
  playCraftingAnimation(craftTime) {
    this.materialFormerSprite.gotoAndPlay(this.materialFormerAnimationBounds.Close.from);
    this.craftButton.tint = 0xc0c0c0;
    this.craftText.text = "Crafting..."
    this.materialFormerSprite.loopCount = 0;
    this.materialFormerSprite.onFrameChange = function() {
      if(this.loopCount++ >= craftTime) {
          this.loopCount = -1;
          this.gotoAndPlay(player.crafting.materialFormerAnimationBounds.Open.from);
          this.loop = false;
          player.crafting.craftButton.tint = 0xdda6a6;
          player.crafting.craftText.text = "Invalid"
          player.crafting.craftText.fill = 0x000000
          player.crafting.craftText.text = "Craft"
          player.crafting.craftButton.tint = 0x00a666;
          player.crafting.craftText.fill = 0x292929;
      } else {
        if(this.loopCount >= 0) {
          if(this.currentFrame == player.crafting.materialFormerAnimationBounds.Spin.to) {
            this.gotoAndPlay(player.crafting.materialFormerAnimationBounds.Spin.from);
          }
        }
      }
    }
  }

  toggleDiverter() {
    this.keepGas = !this.keepGas;
  }

  getFirstAvailableSlot() {
    let occupiedSlots = []
    for(let item of this.inventory.inventoryItems){
      occupiedSlots.push(item.slot);
    }
    for(let i = 0; i < this.craftingRows * this.craftingCols; i++) {
      if(!(occupiedSlots.includes(i))) {
        return i;
      }
    }
    return -1;
  }

  getInventoryItemBySlotID(slot) {
    for(let item of this.inventory.inventoryItems) {
      if(item.slot == slot) {
        return item;
      }
    }
    return null;
  }

  openMenu() {
    this.craftButton.interactive = true;
    this.craftButton.buttonMode = true;
    containers.craftingContainer.alpha = 1.0;
    containers.craftingChildContainer.alpha = 1.0;

    for(let item of this.inventory.inventoryItems) {
      let slotObj = this.slotBounds.find(object => object.slotID == item.slot);
      item.sprite.position.x = slotObj.x + this.slotSize / 2;
      item.sprite.position.y = slotObj.y + this.slotSize / 2;
    }

    this.menuIsOpen = true;
  }

  closeMenu() {
    this.craftButton.interactive = false;
    this.craftButton.buttonMode = false;
    this.cancelPickup();
    containers.craftingContainer.alpha = 0.0;
    containers.craftingChildContainer.alpha = 0.0;
    for(let i = 0; i < this.inventorySprites.length; i++) {
      containers.craftingContainer.removeChild(this.inventorySprites[i]);
    }
    this.inventorySprites = [];
    this.menuIsOpen = false;
  }

  cancelPickup() {
    if(this.pickup != undefined) {
      this.pickup.sprite.x = this.currentPickupOriginX;
      this.pickup.sprite.y = this.currentPickupOriginY;
    }
    this.pickup = undefined;
  }

  placeItem() {
    for(let slot of this.slotBounds) {
      if(mousePos.x > slot.x && mousePos.x < slot.x + this.slotSize && mousePos.y > slot.y && mousePos.y < slot.y + this.slotSize) {
        player.crafting.currentPickupOriginX = slot.x + this.slotSize/2;
        player.crafting.currentPickupOriginY = slot.y + this.slotSize/2;
        player.crafting.pickup.slot = slot.slotID;

        if(slot.label == "oven") {
          console.log("oven");
          console.log(this.ovenItem);
          this.ovenItem = player.crafting.pickup;
          console.log(this.ovenItem);
        }
        this.cancelPickup();
      }
    }
  }

  gameTick() {
      if(this.pickup != undefined) {
      this.pickup.sprite.x = mousePos.x;
      this.pickup.sprite.y = mousePos.y;
    }
    for(let slotNumber in this.activeInventoryHighlightSlots) {
      let curAlpha = this.craftingInventoryHighlightSlots[slotNumber].alpha;
      this.craftingInventoryHighlightSlots[slotNumber].alpha = lerp(curAlpha, 0, 0.08);
      if(this.craftingInventoryHighlightSlots[slotNumber].alpha <= 0.1) {
        this.activeInventoryHighlightSlots[slotNumber] = null;
      }
    }
    if(this.keepGas) {
      if(this.diverter.angle != 0) {
        if(this.diverter.angle > -5) {
          this.diverter.angle = 0;
        } else {
          this.diverter.angle = lerp(this.diverter.angle, 0, 0.12);
        }
      }
    } else {
      if(this.diverter.angle != 90) {
        if(this.diverter.angle < -85) {
          this.diverter.angle = -90;
        } else {
          this.diverter.angle = lerp(this.diverter.angle, -90, 0.12);
        }
      }
    }
    if(this.ovenItem != null) {
      if(this.keepGas) {
        if(this.gfIn.alpha != 0.5) {
          if(this.ovenItem != null) {
            this.gfIn.alpha = lerp(this.gfIn.alpha, 0.5, 0.12);
            this.gfOut.alpha = lerp(this.gfOut.alpha, 0.0, 0.12);
            if(this.gfIn.alpha >= 0.4) {
              this.gfIn.alpha = 0.5;
              this.gfOut.alpha = 0.0;
            }
          }
        }
      } else {
        if(this.gfOut.alpha != 0.5) {
          if(this.ovenItem != null) {
            this.gfOut.alpha = lerp(this.gfOut.alpha, 0.5, 0.12);
            this.gfIn.alpha = lerp(this.gfIn.alpha, 0.0, 0.12);
            if(this.gfOut.alpha >= 0.4) {
              this.gfOut.alpha = 0.5;
              this.gfIn.alpha = 0.0;
            }
          }
        }
      }
      if(this.canisterLow.alpha != 1.0) {
        this.canisterLow.alpha = lerp(this.canisterLow.alpha, 1.0, 0.12);
        if(this.canisterLow.alpha >= 0.9) {
          this.canisterLow.alpha = 1.0;
          this.canisterEmpty.alpha = 0.0;
        }
      }
      for(let sprite of this.gasFlowSprites) {
        if(sprite.alpha != 0.5) {
          sprite.alpha = lerp(sprite.alpha, 0.5, 0.12);
          if(sprite.alpha >= 0.4) {
            sprite.alpha = 0.5;
          }
        }
      }
    } else {
      if(this.canisterLow.alpha != 0.0) {
        this.canisterEmpty.alpha = 1.0;
        this.canisterLow.alpha = lerp(this.canisterLow.alpha, 0.0, 0.12);
        if(this.canisterLow.alpha <= 0.1) {
          this.canisterLow.alpha = 0.0;
        }
      }
      for(let sprite of this.gasFlowSprites) {
        if(sprite.alpha != 0.0) {
          sprite.alpha = lerp(sprite.alpha, 0.0, 0.12);
          if(sprite.alpha <= 0.1) {
            sprite.alpha = 0.0;
          }
        }
      }
      if(this.gfIn.alpha != 0) {
        this.gfIn.alpha = lerp(this.gfIn.alpha, 0.0, 0.12);
      }
      if(this.gfOut.alpha != 0) {
        this.gfOut.alpha = lerp(this.gfOut.alpha, 0.0, 0.12);
      }
    }
  }
}

function clickSprite(item) {
  // prevent replacing origin while an item is already picked up
  if(player.crafting.pickup == undefined) {
    player.crafting.currentPickupOriginX = this.x;
    player.crafting.currentPickupOriginY = this.y
    player.crafting.pickup = item;//this.slot;
    if(player.crafting.pickup == player.crafting.ovenItem) {
      player.crafting.ovenItem = null;
    }
  } else {
    // place an item
    player.crafting.placeItem();
  }
}

function mouseOverSlot(slotNumber) {
  //player.crafting.craftingInventoryHighlightSlots[slotNumber].alpha = 1.0;
  //player.crafting.activeInventoryHighlightSlots[slotNumber] = 1.0;
}

