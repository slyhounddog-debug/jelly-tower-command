const COLORS = {
    DARK_LILAC: '#8e44ad',
    DARK_PINK: '#c0392b',
    DARK_GRAY: '#34495e',
    LIGHT_GRAY: '#95a5a6',
    YELLOW: '#f1c40f',
};

export default class Shop {
    constructor(game) {
        this.game = game;
        this.shopItems = this.game.shopItems;
        this.selectedShopItem = this.shopItems[0];
        
        this.gridSlots = [];
        this.detailPanel = {};
        this.buyButton = {};

        this.buyButton = {
            isAnimating: false,
            isShaking: false,
            animTimer: 0,
            animDuration: 12
        };
        
        this.layout();
    }

    layout() {
        const modalConfig = this.game.modalManager.getModalConfig('shop');
        if (!modalConfig) return;

        const padding = 50;
        const panelHeight = 400;

        const top_offset = 98 + (modalConfig.height * 0.08);
        this.detailPanel.x = modalConfig.x + padding;
        this.detailPanel.y = modalConfig.y + top_offset;
        this.detailPanel.width = modalConfig.width - (padding * 2) + 100;
        this.detailPanel.height = panelHeight;

        this.buyButton.width = 105; // Keep dimensions on the object
        this.buyButton.height = 90;
        this.buyButton.x = this.detailPanel.x + this.detailPanel.width - this.buyButton.width - 480; // Position
        this.buyButton.y = this.detailPanel.y + 150 + this.detailPanel.height / 2 - this.buyButton.height / 2; // Position

        const gridStartY = this.detailPanel.y + this.detailPanel.height + 40 + (modalConfig.height * 0.02);
        
        // --- MODIFIED CODE FOR GRID WIDTH AND PADDING ---
        const columnGap = 20; // Original horizontal gap
        const rowGap = 40;    // Doubled vertical gap as requested
        
        const effectiveInnerModalWidth = modalConfig.width - (padding * 2);
        const effectiveGridContainerWidth = effectiveInnerModalWidth * 0.95; // Shrink by 5% as requested
        
        const slotWidth = (effectiveGridContainerWidth - (3 * columnGap)) / 4; 
        const slotHeight = 220 * 1.25; // Keep original slot height calculation

        this.gridSlots = [];
        this.shopItems.forEach((item, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const slot = {
                item: item,
                x: modalConfig.x + padding + col * (slotWidth + columnGap), // Use columnGap
                y: gridStartY + row * (slotHeight + rowGap), // Use rowGap
                width: slotWidth,
                height: slotHeight,
                isAnimating: false,
                animTimer: 0,
                animDuration: 12
            };
            this.gridSlots.push(slot);
        });
    }

    handleInput() {
        for (const slot of this.gridSlots) {
            if (this.game.mouse.x > slot.x && this.game.mouse.x < slot.x + slot.width &&
                this.game.mouse.y > slot.y && this.game.mouse.y < slot.y + slot.height) {
                if (this.selectedShopItem !== slot.item) {
                    this.selectedShopItem = slot.item;
                    slot.isAnimating = true;
                    slot.animTimer = 0;
                    this.game.audioManager.playSound('lick');
                }
                return;
            }
        }
        
        if (this.game.mouse.x > this.buyButton.x && this.game.mouse.x < this.buyButton.x + this.buyButton.width &&
            this.game.mouse.y > this.buyButton.y && this.game.mouse.y < this.buyButton.y + this.buyButton.height) {
            this.buyItem(this.selectedShopItem);
        }
    }
    
    buyItem(item) {
        const cost = item.getCost();
        if (typeof cost === 'number' && this.game.money >= cost) {
            if (item.id === 'buy_turret') {
                // The new building mode is activated by holding the build button, not from the shop
                // So, no action here for buy_turret beyond checking cost.
                // The item would still need to be "purchased" to increase money.
            }
            this.game.money -= cost;
            item.action();
            this.game.audioManager.playSound('purchase');
            this.buyButton.isAnimating = true;
            this.buyButton.animTimer = 0;
        } else {
            this.game.audioManager.playSound('pop');
            this.buyButton.isShaking = true;
            this.buyButton.animTimer = 0;
        }
    }

    update(tsf) {
        this.layout();
        this.gridSlots.forEach(slot => {
            if (slot.isAnimating) {
                slot.animTimer += tsf;
                if (slot.animTimer >= slot.animDuration) slot.isAnimating = false;
            }
        });
        if (this.buyButton.isAnimating || this.buyButton.isShaking) {
            this.buyButton.animTimer += tsf;
            if (this.buyButton.animTimer >= this.buyButton.animDuration) {
                this.buyButton.isAnimating = false;
                this.buyButton.isShaking = false;
            }
        }
    }

    draw(ctx) {
        const modalConfig = this.game.modalManager.getModalConfig('shop');
        if (!modalConfig) return;
        
        ctx.save();
        
        ctx.fillStyle = COLORS.DARK_LILAC;
        ctx.font = 'bold 80px "VT323"';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.fillText(`$${Math.floor(this.game.money)}`, modalConfig.x + modalConfig.width / 2, modalConfig.y + 210);
        ctx.restore();

        this.drawDetailPanel(ctx);
        this.drawGrid(ctx);
    }
    
    drawGrid(ctx) {
        const upgradeSlotImage = this.game.upgradeSlotImage;
        this.gridSlots.forEach(slot => {
            ctx.save();
            
            const isSelected = this.selectedShopItem.id === slot.item.id;
            
            ctx.globalAlpha = isSelected ? 1.0 : 0.7;
            if (isSelected) {
                ctx.filter = 'brightness(1.2)';
            }
            
            const slotCenterX = slot.x + slot.width / 2;
            const slotCenterY = slot.y + slot.height / 2;
            ctx.translate(slotCenterX, slotCenterY);
            if (slot.isAnimating) {
                const progress = slot.animTimer / slot.animDuration;
                const scale = 1 - Math.sin(progress * Math.PI) * 0.1; // Smaller boing for slots
                const squish = 1 + Math.sin(progress * Math.PI) * 0.05;
                ctx.scale(squish, scale);
            }
            ctx.translate(-slotCenterX, -slotCenterY);

            if (upgradeSlotImage && upgradeSlotImage.complete) {
                ctx.drawImage(upgradeSlotImage, slot.x, slot.y, slot.width, slot.height);
            }

            const centerX = slot.x + slot.width / 2;
            let currentY = slot.y + 155; // Move icon down

            ctx.fillStyle = COLORS.DARK_GRAY;
            ctx.font = '78px "Fredoka One"'; // Double icon size
            ctx.textAlign = 'center';
            ctx.fillText(slot.item.icon, centerX, currentY);
            currentY += 70; // Adjust for larger icon
            
            ctx.font = '56px "VT323"'; // Double cost text size
            const cost = slot.item.getCost();
            ctx.fillStyle = (typeof cost === 'number' && this.game.money >= cost) ? COLORS.DARK_LILAC : COLORS.LIGHT_GRAY;
            ctx.fillText(cost === 'MAX' ? 'MAX' : `$${cost}`, centerX, currentY);

            ctx.restore();
        });
    }

    drawDetailPanel(ctx) {
        ctx.save();
        const item = this.selectedShopItem;
        const alignmentX = this.detailPanel.x + 240;

        ctx.font = '135px "Fredoka One"';
        ctx.textAlign = 'center';
        ctx.fillStyle = COLORS.DARK_GRAY; // Set the icon color to be solid
        ctx.fillText(item.icon, this.detailPanel.x + 120, this.detailPanel.y + 220);

        ctx.fillStyle = "#9c536cff";
        ctx.font = '48px "Titan One"'; // Increase title size by ~20%
        ctx.textAlign = 'left';
        ctx.fillText(item.name, alignmentX, this.detailPanel.y + 100);

        ctx.font = '36px "Nunito"'; // Double description size
        ctx.fillStyle = COLORS.DARK_GRAY;
        let newY = this.wrapText(ctx, item.desc, alignmentX, this.detailPanel.y + 150, this.detailPanel.width - 500, 60); // Double line height
        
        newY += 35; // Double spacing
        ctx.font = '48px "VT323"'; // Double stat text size
        const nextValue = item.getNext();
        const currentValue = item.getValue();
        ctx.textAlign = 'left'
        ctx.fillText('Current: ' + currentValue, alignmentX, newY);
        newY += 38; // Double spacing
        if (nextValue !== "MAX") {
            ctx.fillStyle = COLORS.DARK_PINK;
            ctx.fillText('Next: ' + nextValue, alignmentX, newY);
        } else {
             ctx.fillStyle = COLORS.LIGHT_GRAY;
            ctx.fillText('MAX LEVEL', alignmentX, newY);
        }
        newY += 38; // Double spacing
        
        ctx.fillStyle = COLORS.DARK_GRAY;
        ctx.font = '44px "VT323"'; // Double level text size
        ctx.fillText(item.getLevel(), alignmentX, newY);

        this.drawBuyButton(ctx, item);

        ctx.restore();
    }
    
    drawBuyButton(ctx, item) {
        const cost = item.getCost();
        const canAfford = typeof cost === 'number' && this.game.money >= cost;
        const isMax = cost === 'MAX';
        
        let buttonImage;
        if(isMax) {
            buttonImage = this.game.disabledButtonImage;
        } else if (canAfford) {
            buttonImage = this.game.shopUpgradeDownImage; 
        } else {
            buttonImage = this.game.disabledButtonImage;
        }
        
        ctx.save();
        const btnCenterX = this.buyButton.x + this.buyButton.width / 2;
        const btnCenterY = this.buyButton.y + this.buyButton.height / 2;
        ctx.translate(btnCenterX, btnCenterY);

        if (this.buyButton.isAnimating) {
            const progress = this.buyButton.animTimer / this.buyButton.animDuration;
            const scale = 1 - Math.sin(progress * Math.PI) * 0.2;
            const squish = 1 + Math.sin(progress * Math.PI) * 0.1;
            ctx.scale(squish, scale);
        } else if (this.buyButton.isShaking) {
            const progress = this.buyButton.animTimer / this.buyButton.animDuration;
            const shakeOffset = Math.sin(progress * Math.PI * 4) * 8; // 4 shakes
            ctx.translate(shakeOffset, 0);
        }

        if (buttonImage && buttonImage.complete) {
            ctx.drawImage(buttonImage, -this.buyButton.width / 2, -this.buyButton.height / 2, this.buyButton.width, this.buyButton.height);
        }

        ctx.translate(-btnCenterX, -btnCenterY); // Untranslate before drawing text
        
        ctx.fillStyle = COLORS.DARK_GRAY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (!isMax) {
            ctx.font = '64px "VT323"'; // Double cost text on button
            ctx.fillText(`$${cost}`, this.buyButton.x + this.buyButton.width / 2, this.buyButton.y + this.buyButton.height / 2);
        }
        ctx.restore();
    }
    
    wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let startY = y;
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, startY);
                line = words[n] + ' ';
                startY += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, startY);
        return startY;
    }
}