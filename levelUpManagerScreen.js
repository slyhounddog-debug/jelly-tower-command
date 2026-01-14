export default class LevelUpManagerScreen {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        this.cards = [];
        this.titleY = -100;
        this.rarityColors = {
            normal: '#2ecc71',
            rare: '#9b59b6',
            legendary: '#f1c40f'
        };
    }

    show() {
        this.isOpen = true;
        this.game.isPaused = true;
        this.organizeCards();
    }

    hide() {
        this.isOpen = false;
        this.game.isPaused = false;
    }

    organizeCards() {
        this.cards = [];
        const upgrades = this.game.levelingManager.upgrades;
        const cardWidth = 150;
        const cardHeight = 220;
        const gap = 20;
        const topMargin = 200;

        let yOffset = topMargin;

        // Normal Upgrades
        const normalUpgrades = upgrades.normal;
        let xOffset = (this.game.width - (normalUpgrades.length * (cardWidth + gap))) / 2;
        normalUpgrades.forEach((upgrade, index) => {
            this.cards.push({
                x: xOffset + index * (cardWidth + gap),
                y: yOffset,
                width: cardWidth,
                height: cardHeight,
                choice: upgrade,
            });
        });

        yOffset += cardHeight + 80;

        // Rare Upgrades
        const rareUpgrades = upgrades.rare;
        xOffset = (this.game.width - (rareUpgrades.length * (cardWidth + gap))) / 2;
        rareUpgrades.forEach((upgrade, index) => {
            this.cards.push({
                x: xOffset + index * (cardWidth + gap),
                y: yOffset,
                width: cardWidth,
                height: cardHeight,
                choice: upgrade,
            });
        });

        yOffset += cardHeight + 80;

        // Legendary Upgrades
        const legendaryUpgrades = upgrades.legendary;
        xOffset = (this.game.width - (legendaryUpgrades.length * (cardWidth + gap))) / 2;
        legendaryUpgrades.forEach((upgrade, index) => {
            this.cards.push({
                x: xOffset + index * (cardWidth + gap),
                y: yOffset,
                width: cardWidth,
                height: cardHeight,
                choice: upgrade,
            });
        });
    }

    update(tsf) {
        if (!this.isOpen) return;
        this.titleY += (100 - this.titleY) * 0.1 * tsf;
    }

    draw(ctx) {
        if (!this.isOpen) return;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        ctx.fillStyle = 'white';
        ctx.font = '80px "Titan One"';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.fillText('Level Up Manager', this.game.width / 2, this.titleY);
        ctx.restore();

        // Draw rarity titles
        ctx.save();
        ctx.font = '40px "Titan One"';
        ctx.textAlign = 'center';
        ctx.fillStyle = this.rarityColors.normal;
        ctx.fillText('Normal', this.game.width / 2, 180);
        ctx.fillStyle = this.rarityColors.rare;
        ctx.fillText('Rare', this.game.width / 2, 480);
        ctx.fillStyle = this.rarityColors.legendary;
        ctx.fillText('Legendary', this.game.width / 2, 780);
        ctx.restore();

        this.cards.forEach(card => {
            this.drawCard(ctx, card);
        });
    }

    drawCard(ctx, card) {
        ctx.save();
        
        const hasUpgrade = this.game.player.upgrades[card.choice.name] > 0;
        const upgradeCount = this.game.player.upgrades[card.choice.name];

        const rarityGlows = {
            normal: 'rgba(46, 204, 113, 0.5)',
            rare: 'rgba(155, 89, 182, 0.5)',
            legendary: 'rgba(241, 196, 15, 0.7)'
        };

        const rarity = card.choice.rarity;
        let color = this.rarityColors[rarity] || '#ffffff';
        let glow = rarityGlows[rarity] || 'rgba(255, 255, 255, 0.5)';
        let cardBg = `linear-gradient(0deg, ${color}, ${glow})`;

        if (!hasUpgrade) {
            ctx.filter = 'grayscale(1)';
            color = '#888';
            cardBg = '#333';
        }

        const gradient = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.height);
        gradient.addColorStop(0, '#444');
        gradient.addColorStop(1, '#222');

        ctx.fillStyle = hasUpgrade ? gradient : '#333';
        ctx.strokeStyle = hasUpgrade ? 'white' : '#555';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.roundRect(card.x, card.y, card.width, card.height, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = color;
        ctx.font = '20px "Fredoka One"';
        ctx.textAlign = 'center';
        
        const title = card.choice.name.toUpperCase();
        ctx.fillText(title, card.x + card.width / 2, card.y + 25);

        ctx.font = '40px "Fredoka One"';
        ctx.fillText(card.choice.icon, card.x + card.width / 2, card.y + 70);

        ctx.fillStyle = hasUpgrade ? 'white' : '#aaa';
        ctx.font = '14px "Nunito"';
        this.wrapText(ctx, card.choice.description, card.x + card.width / 2, card.y + 110, card.width - 20, 16);

        ctx.fillStyle = color;
        ctx.font = '16px "Fredoka One"';
        ctx.fillText(rarity.toUpperCase(), card.x + card.width / 2, card.y + card.height - 15);

        if (hasUpgrade && rarity === 'normal' && upgradeCount > 0) {
            const circleRadius = 12;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(card.x + circleRadius + 5, card.y + circleRadius + 5, circleRadius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = 'white';
            ctx.font = '14px "Fredoka One"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(upgradeCount, card.x + circleRadius + 5, card.y + circleRadius + 5);
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
