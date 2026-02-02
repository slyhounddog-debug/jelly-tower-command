const EMPORIUM_UPGRADE_COSTS = [1, 3, 6, 10, 15, 22, 30, 40, 50, 70];
const COLORS = {
    DARK_LILAC: '#8e44ad',
    DARK_PINK: '#c0392b',
    DARK_GRAY: '#34495e',
    LIGHT_GRAY: '#95a5a6',
    YELLOW: '#f1c40f',
};

export default class Emporium {
    constructor(game) {
        this.game = game;
        this.isEmporiumOpen = false;
        this.selectedEmporiumItem = null;
        this.gridSlots = [];
        this.detailPanel = {};
        this.buyButton = {};
        this.resetButton = {};
        this.closeButton = {};

        this.loadEmporiumUpgrades();
        this.emporiumItems = [ // This data structure is great, we'll keep it.
            { 
                id: 'starting_money', name: 'Initial Funding', icon: '💰', 
                desc: 'Increases the amount of money you start each run with.',
                getCost: () => (this.game.emporiumUpgrades.starting_money.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.starting_money.level],
                getValue: () => `$${this.game.emporiumUpgrades.starting_money.values[this.game.emporiumUpgrades.starting_money.level]}`,
                getNext: () => (this.game.emporiumUpgrades.starting_money.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `$${this.game.emporiumUpgrades.starting_money.values[this.game.emporiumUpgrades.starting_money.level + 1]}`,
                getLevel: () => `${this.game.emporiumUpgrades.starting_money.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.starting_money.level++; }
            },
            { 
                id: 'piggy_cooldown', name: 'Piggy Bank Timer', icon: '🐷', 
                desc: 'Reduces the cooldown for Piggy Bank spawns.',
                getCost: () => (this.game.emporiumUpgrades.piggy_cooldown.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.piggy_cooldown.level],
                getValue: () => `${this.game.emporiumUpgrades.piggy_cooldown.values[this.game.emporiumUpgrades.piggy_cooldown.level]}s`,
                getNext: () => (this.game.emporiumUpgrades.piggy_cooldown.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.game.emporiumUpgrades.piggy_cooldown.values[this.game.emporiumUpgrades.piggy_cooldown.level + 1]}s`,
                getLevel: () => `${this.game.emporiumUpgrades.piggy_cooldown.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.piggy_cooldown.level++; }
            },
            { 
                id: 'castle_health', name: 'Castle Durability', icon: '🏰', 
                desc: 'Increases the starting health of your castle.',
                getCost: () => (this.game.emporiumUpgrades.castle_health.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.castle_health.level],
                getValue: () => `${this.game.emporiumUpgrades.castle_health.values[this.game.emporiumUpgrades.castle_health.level]} HP`,
                getNext: () => (this.game.emporiumUpgrades.castle_health.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.game.emporiumUpgrades.castle_health.values[this.game.emporiumUpgrades.castle_health.level + 1]} HP`,
                getLevel: () => `${this.game.emporiumUpgrades.castle_health.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.castle_health.level++; }
            },
            { 
                id: 'heart_heal', name: 'Heart Heal Amount', icon: '❤️', 
                desc: 'Increases the amount of health restored by hearts.',
                getCost: () => (this.game.emporiumUpgrades.heart_heal.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.heart_heal.level],
                getValue: () => `+${this.game.emporiumUpgrades.heart_heal.values[this.game.emporiumUpgrades.heart_heal.level]} HP`,
                getNext: () => (this.game.emporiumUpgrades.heart_heal.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `+${this.game.emporiumUpgrades.heart_heal.values[this.game.emporiumUpgrades.heart_heal.level + 1]} HP`,
                getLevel: () => `${this.game.emporiumUpgrades.heart_heal.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.heart_heal.level++; }
            },
            { 
                id: 'big_coin_value', name: 'Big Coin Value', icon: '🪙', 
                desc: 'Increases the value of Big Coins.',
                getCost: () => (this.game.emporiumUpgrades.big_coin_value.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.big_coin_value.level],
                getValue: () => `$${this.game.emporiumUpgrades.big_coin_value.values[this.game.emporiumUpgrades.big_coin_value.level]}`,
                getNext: () => (this.game.emporiumUpgrades.big_coin_value.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `$${this.game.emporiumUpgrades.big_coin_value.values[this.game.emporiumUpgrades.big_coin_value.level + 1]}`,
                getLevel: () => `${this.game.emporiumUpgrades.big_coin_value.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.big_coin_value.level++; }
            },
            { 
                id: 'ice_cream_chance', name: 'Ice Cream Scoop Chance', icon: '🍦', 
                desc: 'Increases the drop chance of Ice Cream Scoops from enemies and piggy banks.',
                getCost: () => (this.game.emporiumUpgrades.ice_cream_chance.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.ice_cream_chance.level],
                getValue: () => `${this.game.emporiumUpgrades.ice_cream_chance.values[this.game.emporiumUpgrades.ice_cream_chance.level][0]}% / ${this.game.emporiumUpgrades.ice_cream_chance.values[this.game.emporiumUpgrades.ice_cream_chance.level][1]}%`,
                getNext: () => (this.game.emporiumUpgrades.ice_cream_chance.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.game.emporiumUpgrades.ice_cream_chance.values[this.game.emporiumUpgrades.ice_cream_chance.level + 1][0]}% / ${this.game.emporiumUpgrades.ice_cream_chance.values[this.game.emporiumUpgrades.ice_cream_chance.level + 1][1]}%`,
                getLevel: () => `${this.game.emporiumUpgrades.ice_cream_chance.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.ice_cream_chance.level++; }
            },
            { 
                id: 'enemy_xp', name: 'XP Boost', icon: '✨',
                desc: 'Increases XP gained from enemies.',
                getCost: () => (this.game.emporiumUpgrades.enemy_xp.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.enemy_xp.level],
                getValue: () => `x${this.game.emporiumUpgrades.enemy_xp.values[this.game.emporiumUpgrades.enemy_xp.level].toFixed(1)}`,
                getNext: () => (this.game.emporiumUpgrades.enemy_xp.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `x${this.game.emporiumUpgrades.enemy_xp.values[this.game.emporiumUpgrades.enemy_xp.level + 1].toFixed(1)}`,
                getLevel: () => `${this.game.emporiumUpgrades.enemy_xp.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.enemy_xp.level++; }
            },
            {
                id: 'starting_component_points', name: 'Component Capacity', icon: '🧰',
                desc: 'Increases your starting component points.',
                getCost: () => (this.game.emporiumUpgrades.starting_component_points.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.starting_component_points.level],
                getValue: () => `${this.game.emporiumUpgrades.starting_component_points.values[this.game.emporiumUpgrades.starting_component_points.level]}`,
                getNext: () => (this.game.emporiumUpgrades.starting_component_points.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.game.emporiumUpgrades.starting_component_points.values[this.game.emporiumUpgrades.starting_component_points.level + 1]}`,
                getLevel: () => `${this.game.emporiumUpgrades.starting_component_points.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.starting_component_points.level++; }
            }
        ];
    }

    loadEmporiumUpgrades() {
        const savedUpgrades = localStorage.getItem('emporiumUpgrades');
        if (savedUpgrades) {
            this.game.emporiumUpgrades = JSON.parse(savedUpgrades);
            // Ensure all expected upgrades are present, add if not
            const initialUpgrades = this.getInitialEmporiumUpgrades();
            for (const key in initialUpgrades) {
                if (!this.game.emporiumUpgrades.hasOwnProperty(key)) {
                    this.game.emporiumUpgrades[key] = initialUpgrades[key];
                }
            }
        } else {
            this.game.emporiumUpgrades = this.getInitialEmporiumUpgrades();
        }
    }

    getInitialEmporiumUpgrades() {
        return {
            starting_money: { level: 0, values: [25, 150, 300, 450, 600, 800, 1000, 1500, 2000, 3000, 4000] },
            piggy_cooldown: { level: 0, values: [60, 56, 52, 48, 44, 40, 37, 34, 31, 28, 25] },
            castle_health: { level: 0, values: [100, 110, 120, 130, 140, 160, 180, 200, 220, 250, 300] },
            heart_heal: { level: 0, values: [6, 8, 9, 10, 11, 12, 14, 16, 18, 19, 20] },
            big_coin_value: { level: 0, values: [75, 85, 100, 120, 140, 160, 180, 200, 220, 240, 250] },
            ice_cream_chance: { level: 0, values: [[1.5, 5], [1.75, 6], [2, 7], [2.25, 8], [2.5, 9], [2.75, 10], [3, 11], [3.25, 12], [3.5, 13], [3.75, 14], [4, 15]] },
            enemy_xp: { level: 0, values: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0] },
            starting_component_points: { level: 0, values: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
        };
    }
    
    saveEmporiumUpgrades(upgrades) {
        localStorage.setItem('emporiumUpgrades', JSON.stringify(upgrades));
    }

    getEnemyXpMultiplier() {
        return this.game.emporiumUpgrades.enemy_xp.values[this.game.emporiumUpgrades.enemy_xp.level];
    }

    getStartingComponentPoints() {
        return this.game.emporiumUpgrades.starting_component_points.values[this.game.emporiumUpgrades.starting_component_points.level];
    }

    getStartingMoney() {
        return this.game.emporiumUpgrades.starting_money.values[this.game.emporiumUpgrades.starting_money.level];
    }

    getStartingHealth() {
        return this.game.emporiumUpgrades.castle_health.values[this.game.emporiumUpgrades.castle_health.level];
    }

    getCastleMaxHealth() {
        return this.game.emporiumUpgrades.castle_health.values[this.game.emporiumUpgrades.castle_health.level];
    }

    getBigCoinValue() {
        return this.game.emporiumUpgrades.big_coin_value.values[this.game.emporiumUpgrades.big_coin_value.level];
    }

    getHeartHeal() {
        return this.game.emporiumUpgrades.heart_heal.values[this.game.emporiumUpgrades.heart_heal.level];
    }

    getPiggyCooldown() {
        return this.game.emporiumUpgrades.piggy_cooldown.values[this.game.emporiumUpgrades.piggy_cooldown.level];
    }

    getIceCreamChance() {
        return this.game.emporiumUpgrades.ice_cream_chance.values[this.game.emporiumUpgrades.ice_cream_chance.level];
    }

    // --- NEW METHODS FOR CANVAS-BASED UI ---

    layout() {
        const modalConfig = this.game.modalManager.getModalConfig('shop'); // Reuse shop modal dimensions
        if (!modalConfig) return;

        const padding = 50;
        const panelHeight = 400;

        const top_offset = 98 + (modalConfig.height * 0.08);
        this.detailPanel.x = modalConfig.x + padding;
        this.detailPanel.y = modalConfig.y + top_offset;
        this.detailPanel.width = modalConfig.width - (padding * 2) + 100;
        this.detailPanel.height = panelHeight;

        this.buyButton.width = 105;
        this.buyButton.height = 90;
        this.buyButton.x = this.detailPanel.x + this.detailPanel.width - this.buyButton.width - 480;
        this.buyButton.y = this.detailPanel.y + 150 + this.detailPanel.height / 2 - this.buyButton.height / 2;

        this.resetButton.width = 105;
        this.resetButton.height = 90;
        this.resetButton.x = this.buyButton.x - this.resetButton.width - 20;
        this.resetButton.y = this.buyButton.y;

        this.closeButton.width = 105;
        this.closeButton.height = 90;
        this.closeButton.x = this.buyButton.x + this.buyButton.width + 20;
        this.closeButton.y = this.buyButton.y;

        const gridStartY = this.detailPanel.y + this.detailPanel.height + 40 + (modalConfig.height * 0.02);
        
        const columnGap = 20;
        const rowGap = 40;
        
        const effectiveInnerModalWidth = modalConfig.width - (padding * 2);
        const effectiveGridContainerWidth = effectiveInnerModalWidth * 0.95;
        
        const slotWidth = (effectiveGridContainerWidth - (3 * columnGap)) / 4; 
        const slotHeight = 220 * 1.25;

        this.gridSlots = [];
        this.emporiumItems.forEach((item, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const slot = {
                item: item,
                x: modalConfig.x + padding + col * (slotWidth + columnGap),
                y: gridStartY + row * (slotHeight + rowGap),
                width: slotWidth,
                height: slotHeight,
            };
            this.gridSlots.push(slot);
        });
    }

    handleInput() {
        for (const slot of this.gridSlots) {
            if (this.game.mouse.x > slot.x && this.game.mouse.x < slot.x + slot.width &&
                this.game.mouse.y > slot.y && this.game.mouse.y < slot.y + slot.height) {
                if (this.selectedEmporiumItem !== slot.item) {
                    this.selectedEmporiumItem = slot.item;
                    this.game.audioManager.playSound('lick');
                }
                return;
            }
        }
        
        if (this.game.mouse.x > this.buyButton.x && this.game.mouse.x < this.buyButton.x + this.buyButton.width &&
            this.game.mouse.y > this.buyButton.y && this.game.mouse.y < this.buyButton.y + this.buyButton.height) {
            this.buyItem(this.selectedEmporiumItem);
        }

        if (this.game.mouse.x > this.resetButton.x && this.game.mouse.x < this.resetButton.x + this.resetButton.width &&
            this.game.mouse.y > this.resetButton.y && this.game.mouse.y < this.resetButton.y + this.resetButton.height) {
            this.reset();
        }

        if (this.game.mouse.x > this.closeButton.x && this.game.mouse.x < this.closeButton.x + this.closeButton.width &&
            this.game.mouse.y > this.closeButton.y && this.game.mouse.y < this.closeButton.y + this.closeButton.height) {
            this.toggle();
        }
    }

    update(tsf) {
        this.layout();
    }

    draw(ctx) {
        const modalConfig = this.game.modalManager.getModalConfig('shop');
        if (!modalConfig) return;
        
        ctx.save();
        ctx.fillStyle = COLORS.YELLOW;
        ctx.font = 'bold 80px "VT323"';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.fillText(`🍦${Math.floor(this.game.iceCreamScoops)}`, modalConfig.x + modalConfig.width / 2, modalConfig.y + 180);
        ctx.restore();

        this.drawDetailPanel(ctx);
        this.drawGrid(ctx);
    }

    drawGrid(ctx) {
        const upgradeSlotImage = this.game.upgradeSlotImage;
        this.gridSlots.forEach(slot => {
            ctx.save();
            
            const isSelected = this.selectedEmporiumItem && this.selectedEmporiumItem.id === slot.item.id;
            
            ctx.globalAlpha = isSelected ? 1.0 : 0.7;
            if (isSelected) {
                ctx.filter = 'brightness(1.2)';
            }

            if (upgradeSlotImage && upgradeSlotImage.complete) {
                ctx.drawImage(upgradeSlotImage, slot.x, slot.y, slot.width, slot.height);
            }

            const centerX = slot.x + slot.width / 2;
            let currentY = slot.y + 85;

            ctx.fillStyle = COLORS.DARK_GRAY;
            ctx.font = '54px "Fredoka One"';
            ctx.textAlign = 'center';
            ctx.fillText(slot.item.icon, centerX, currentY);
            currentY += 50;

            ctx.font = '26px "Fredoka One"';
            this.wrapText(ctx, slot.item.name, centerX, currentY, slot.width - 20, 32);
            currentY += 35;
            
            ctx.font = '38px "VT323"';
            const cost = slot.item.getCost();
            const canAfford = typeof cost === 'number' && this.game.iceCreamScoops >= cost;
            ctx.fillStyle = (canAfford || cost === 'MAX') ? COLORS.DARK_LILAC : COLORS.LIGHT_GRAY;
            ctx.fillText(cost === 'MAX' ? 'MAX' : `🍦${cost}`, centerX, currentY);

            if (slot.item.getLevel) {
                currentY += 30;
                ctx.font = '28px "VT323"';
                ctx.fillStyle = COLORS.DARK_GRAY;
                ctx.fillText(slot.item.getLevel(), centerX, currentY);
            }

            ctx.restore();
        });
    }

    drawDetailPanel(ctx) {
        if (!this.selectedEmporiumItem) return;

        ctx.save();
        const item = this.selectedEmporiumItem;
        const alignmentX = this.detailPanel.x + 240;

        ctx.font = '115px "Fredoka One"';
        ctx.textAlign = 'center';
        ctx.fillText(item.icon, this.detailPanel.x + 120, this.detailPanel.y + 220);

        ctx.fillStyle = "#9c536cff";
        ctx.font = '48px "Titan One"';
        ctx.textAlign = 'left';
        ctx.fillText(item.name, alignmentX, this.detailPanel.y + 100);

        ctx.font = '26px "Nunito"';
        ctx.fillStyle = COLORS.DARK_GRAY;
        let newY = this.wrapText(ctx, item.desc, alignmentX, this.detailPanel.y + 150, this.detailPanel.width - 350, 33);
        
        newY += 35;
        ctx.font = '36px "VT323"';
        const nextValue = item.getNext();
        const currentValue = item.getValue();
        ctx.textAlign = 'left'
        ctx.fillText('Current: ' + currentValue, alignmentX, newY);
        newY += 38;
        if (nextValue !== "MAX") {
            ctx.fillStyle = COLORS.DARK_PINK;
            ctx.fillText('Next: ' + nextValue, alignmentX, newY);
        } else {
             ctx.fillStyle = COLORS.LIGHT_GRAY;
            ctx.fillText('MAX LEVEL', alignmentX, newY);
        }
        newY += 38;
        
        ctx.fillStyle = COLORS.DARK_GRAY;
        ctx.font = '32px "VT323"';
        ctx.fillText(item.getLevel(), alignmentX, newY);

        this.drawBuyButton(ctx, item);
        this.drawResetButton(ctx);
        this.drawCloseButton(ctx);

        ctx.restore();
    }

    drawBuyButton(ctx, item) {
        const cost = item.getCost();
        const canAfford = typeof cost === 'number' && this.game.iceCreamScoops >= cost;
        const isMax = cost === 'MAX';
        
        let buttonImage = isMax || !canAfford ? this.game.disabledButtonImage : this.game.shopUpgradeDownImage;
        
        if (buttonImage && buttonImage.complete) {
            ctx.drawImage(buttonImage, this.buyButton.x, this.buyButton.y, this.buyButton.width, this.buyButton.height);
        }

        ctx.fillStyle = COLORS.DARK_GRAY;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (!isMax) {
            ctx.font = '32px "VT323"';
            ctx.fillText(`🍦${cost}`, this.buyButton.x + this.buyButton.width / 2, this.buyButton.y + this.buyButton.height / 2);
        }
    }

    drawResetButton(ctx) {
        if (this.game.resetButtonImage && this.game.resetButtonImage.complete) {
            ctx.drawImage(this.game.resetButtonImage, this.resetButton.x, this.resetButton.y, this.resetButton.width, this.resetButton.height);
        }
    }

    drawCloseButton(ctx) {
        if (this.game.modalConfirmUpImage && this.game.modalConfirmUpImage.complete) {
            ctx.drawImage(this.game.modalConfirmUpImage, this.closeButton.x, this.closeButton.y, this.closeButton.width, this.closeButton.height);
        }
    }

    // --- END NEW METHODS ---

    toggle() {
        if (this.game.modalManager.activeModal === 'emporium') {
            this.game.modalManager.close();
        } else {
            this.game.modalManager.open('emporium');
            this.selectedEmporiumItem = this.emporiumItems[0];
        }
    }

    buyItem(item) {
        const cost = item.getCost();
        if (typeof cost === 'number' && this.game.iceCreamScoops >= cost) {
            this.game.audioManager.playSound('purchase');
            this.game.iceCreamScoops -= cost;
            item.action();
            this.saveEmporiumUpgrades(this.game.emporiumUpgrades);
            localStorage.setItem('iceCreamScoops', this.game.iceCreamScoops);
        }
    }

    reset() {
        this.game.audioManager.playSound('reset');
        let refundedScoops = 0;
        for (const key in this.game.emporiumUpgrades) {
            const upgrade = this.game.emporiumUpgrades[key];
            const costs = EMPORIUM_UPGRADE_COSTS;
            for (let i = 0; i < upgrade.level; i++) {
                refundedScoops += costs[i];
            }
        }

        this.game.iceCreamScoops += refundedScoops;
        this.game.emporiumUpgrades = this.getInitialEmporiumUpgrades();

        this.saveEmporiumUpgrades(this.game.emporiumUpgrades);
        localStorage.setItem('iceCreamScoops', this.game.iceCreamScoops);

        // Refresh the emporium display
        // The draw loop will handle this automatically
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
