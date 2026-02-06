export default class LevelUpManagerScreen {
    constructor(game) {
        this.game = game;
        this.cards = [];
        this.titleY = 0;
        this.magnifiedCard = null;
        this.rarityColors = {
            normal: '#2ecc71',
            rare: '#9b59b6',
            legendary: '#f1c40f'
        };
    }

    resetMagnifiedCard() {
        this.magnifiedCard = null;
    }

    handleInput(mouseX, mouseY) {
        const modalConfig = this.game.modalManager.getModalConfig('player');
        if (!modalConfig) return false; // Should not happen if this modal is active

        // Check if click is within the modal's drawing area
        if (!(mouseX >= modalConfig.x && mouseX <= modalConfig.x + modalConfig.width &&
              mouseY >= modalConfig.y && mouseY <= modalConfig.y + modalConfig.height)) {
            return false; // Clicked outside the actual modal body, let modalManager handle closing
        }
        
        // If we reach here, the click is *inside* the modal's configured area.
        // It should be consumed by this modal, even if no specific card is clicked.

        let clickedCard = null;
        for (const card of this.cards) {
            if (mouseX > card.x && mouseX < card.x + card.width &&
                mouseY > card.y && mouseY < card.y + card.height) {
                clickedCard = card;
                break;
            }
        }

        if (this.magnifiedCard !== null) {
            this.magnifiedCard = null;
            this.game.audioManager.playSound('lick');
            return true; // Click consumed
        } else if (clickedCard !== null) {
            this.magnifiedCard = clickedCard;
            this.game.audioManager.playSound('lick');
            return true; // Click consumed
        }
        
        // If clicked inside modal area, but not on a card, still consume the click
        return true; // Click consumed
    }

    organizeCards(modalConfig) {
        if (!modalConfig) return;
        this.cards = [];
        const upgrades = this.game.levelingManager.upgrades;
        const cardWidth = 160; // Reduced size
        const cardHeight = 235; // Reduced size
        const gap = 15;
        const topMargin = 180 + (modalConfig.height * 0.07);

        let yOffset = modalConfig.y + topMargin;

        const processUpgrades = (upgradeList, y, cardsPerRowOverride = 0) => {
            const cardsPerRow = cardsPerRowOverride > 0 ? cardsPerRowOverride : Math.ceil(upgradeList.length / 2);
            const totalRows = Math.ceil(upgradeList.length / cardsPerRow);

            for (let i = 0; i < upgradeList.length; i++) {
                const rowIndex = Math.floor(i / cardsPerRow);
                const colIndex = i % cardsPerRow;

                const currentRowUpgradeCount = Math.min(cardsPerRow, upgradeList.length - (rowIndex * cardsPerRow));
                const rowWidth = (currentRowUpgradeCount * (cardWidth + gap)) - gap;
                const xOffset = modalConfig.x + (modalConfig.width - rowWidth) / 2;

                const card = {
                    x: xOffset + colIndex * (cardWidth + gap),
                    y: y + rowIndex * (cardHeight + gap),
                    width: cardWidth,
                    height: cardHeight,
                    choice: upgradeList[i],
                };

                const offscreenCanvas = document.createElement('canvas');
                offscreenCanvas.width = cardWidth;
                offscreenCanvas.height = cardHeight;
                const offscreenCtx = offscreenCanvas.getContext('2d');
                this.drawCard(offscreenCtx, { ...card, x: 0, y: 0 });
                card.preRenderedCanvas = offscreenCanvas;

                this.cards.push(card);
            }
            return totalRows * (cardHeight + gap);
        };

        const normalHeight = processUpgrades(upgrades.normal, yOffset, Math.ceil(upgrades.normal.length / 2));
        yOffset += normalHeight + 60; // Reduced gap

        const rareHeight = processUpgrades(upgrades.rare, yOffset, upgrades.rare.length);
        yOffset += rareHeight + 60; // Reduced gap

        processUpgrades(upgrades.legendary, yOffset, upgrades.legendary.length);
    }

    update(tsf) {
        // Title animation removed
    }

    draw(ctx) {
        const modalConfig = this.game.modalManager.getModalConfig('player');
        if (!modalConfig) return;

        // Title text rendering removed

        const topMargin = 170 + (modalConfig.height * 0.07);
        const rarityY1 = modalConfig.y + topMargin - 20;
        const normalRows = Math.ceil(this.game.levelingManager.upgrades.normal.length / Math.ceil(this.game.levelingManager.upgrades.normal.length / 2));
        const rarityY2 = rarityY1 + (normalRows * (235 + 15)) + 60; // Use new cardHeight
        const rareRows = Math.ceil(this.game.levelingManager.upgrades.rare.length / this.game.levelingManager.upgrades.rare.length);
        let rarityY3 = rarityY2 + (rareRows * (235 + 15)) + 60; // Use new cardHeight
        

        ctx.save();
        ctx.font = '38px "Titan One"'; // Slightly smaller
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        
        ctx.fillStyle = this.rarityColors.normal;
        ctx.fillText('Normal', modalConfig.x + modalConfig.width / 2, rarityY1);
        ctx.strokeText('Normal', modalConfig.x + modalConfig.width / 2, rarityY1);

        ctx.fillStyle = this.rarityColors.rare;
        ctx.fillText('Rare', modalConfig.x + modalConfig.width / 2, rarityY2);
        ctx.strokeText('Rare', modalConfig.x + modalConfig.width / 2, rarityY2);
        
        ctx.fillStyle = this.rarityColors.legendary;
        ctx.fillText('Legendary', modalConfig.x + modalConfig.width / 2, rarityY3);
        ctx.strokeText('Legendary', modalConfig.x + modalConfig.width / 2, rarityY3);
        ctx.restore();

        this.cards.forEach(card => {
            if (this.magnifiedCard !== card) { // Don't draw the card that's currently magnified
                if (card.preRenderedCanvas) {
                    ctx.drawImage(card.preRenderedCanvas, card.x, card.y);
                } else {
                    this.drawCard(ctx, card);
                }
            }
        });

        if (this.magnifiedCard && this.magnifiedCard.preRenderedCanvas) {
            const hoverScale = 2.8;
            const width = this.magnifiedCard.width * hoverScale;
            const height = this.magnifiedCard.height * hoverScale;
            const x = modalConfig.x + (modalConfig.width / 2) - (width / 2);
            const y = modalConfig.y + (modalConfig.height / 2) - (height / 2);

            ctx.save();
            ctx.globalAlpha = 1.0;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
            ctx.shadowBlur = 20;
            ctx.shadowOffsetX = 10;
            ctx.shadowOffsetY = 10;
            ctx.drawImage(this.magnifiedCard.preRenderedCanvas, x, y, width, height);
            ctx.restore();
        }
    }

    drawCard(ctx, card) {
        ctx.save();
        
        const scale = card.width / 180;

        const hasUpgrade = this.game.player.upgrades[card.choice.name] > 0;
        const upgradeCount = this.game.player.upgrades[card.choice.name];
        const rarity = card.choice.rarity;

        if (!hasUpgrade) {
            ctx.filter = 'saturate(0.2) brightness(0.7)';
        }
        
        const gradient = ctx.createLinearGradient(0, 0, 0, card.height);
        if (hasUpgrade) {
            gradient.addColorStop(0, '#6A11CB');
            gradient.addColorStop(1, '#2575FC');
        } else {
            gradient.addColorStop(0, '#444');
            gradient.addColorStop(1, '#222');
        }
        ctx.fillStyle = gradient;

        ctx.strokeStyle = this.rarityColors[rarity];
        ctx.lineWidth = 4 * scale;

        ctx.beginPath();
        ctx.roundRect(0, 0, card.width, card.height, 20 * scale);
        ctx.fill();
        ctx.stroke();

        // Use rarity color for the title
        ctx.fillStyle = this.rarityColors[rarity] || 'white';
        ctx.font = `24px "Titan One"`; // Fixed font size for consistent title size
        ctx.textAlign = 'center';
        
        const title = card.choice.name.toUpperCase();
        ctx.fillText(title, card.width / 2, 35 * scale); // Moved down slightly

        ctx.font = `${40 * scale}px "Fredoka One"`;
        ctx.fillText(card.choice.icon, card.width / 2, 80 * scale);

        ctx.fillStyle = '#eee';
        ctx.font = `${14 * scale}px "Nunito"`;
        this.wrapText(ctx, card.choice.description, card.width / 2, 130 * scale, card.width - 20 * scale, 16 * scale);

        let currentStatText = '';
        let showStat = false;

        switch (card.choice.name) {
             case 'Sticky Paw': currentStatText = `Current: ${this.game.player.pickupRange.toFixed(0)}px`; showStat = true; break;
             case 'Long Tongue': currentStatText = `Current: ${this.game.player.lickRange.toFixed(0)}px`; showStat = true; break;
             case 'Extra Jump': currentStatText = `Current: ${this.game.player.maxJumps}`; showStat = true; break;
             case 'Sugar Shove': currentStatText = `Current: ${this.game.stats.lickKnockback.toFixed(0)} KB`; showStat = true; break;
             case 'Greed': const bonus = Math.ceil(500 + (this.game.totalMoneyEarned * 0.025)); currentStatText = `Total: $${bonus}`; showStat = true; break;
        }

        if (showStat) {
            ctx.fillStyle = '#f1c40f';
            ctx.font = `bold ${16 * scale}px "Nunito"`; // Matched font size to description
            ctx.textAlign = 'center';
            ctx.fillText(currentStatText, card.width / 2, (205 * scale) + 100); // Added more padding
        }

        ctx.font = `${16 * scale}px "Titan One"`;
        ctx.fillStyle = this.rarityColors[rarity];
        ctx.fillText(rarity.toUpperCase(), card.width / 2, card.height - (20 * scale));

        if (hasUpgrade && rarity === 'normal' && upgradeCount > 0) {
            const circleRadius = 12 * scale;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(circleRadius + (5 * scale), circleRadius + (5 * scale), circleRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = `${14 * scale}px "Fredoka One"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(upgradeCount, circleRadius + (5 * scale), circleRadius + (5 * scale));
        }
        
        ctx.restore();
    }

    wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = context.measureText(testLine);
            const testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.fillText(line, x, y);
    }
}
