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

    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }

    organizeCards() {
        this.cards = [];
        const upgrades = this.game.levelingManager.upgrades;
        const cardWidth = 180;
        const cardHeight = 264;
        const gap = 15;
        const topMargin = 250;

        let yOffset = topMargin;

        // Normal Upgrades in two rows
        const normalUpgrades = upgrades.normal;
        const cardsPerRow = Math.ceil(normalUpgrades.length / 2);
        const totalWidth = (cardsPerRow * (cardWidth + gap)) - gap;


        for (let i = 0; i < normalUpgrades.length; i++) {
            const rowIndex = Math.floor(i / cardsPerRow);
            const colIndex = i % cardsPerRow;
            const rowUpgrades = normalUpgrades.slice(rowIndex * cardsPerRow, (rowIndex + 1) * cardsPerRow);
            const rowWidth = (rowUpgrades.length * (cardWidth + gap)) - gap;
            const xOffset = (this.game.width - rowWidth) / 2;

            this.cards.push({
                x: xOffset + colIndex * (cardWidth + gap),
                y: yOffset + rowIndex * (cardHeight + gap),
                width: cardWidth,
                height: cardHeight,
                choice: normalUpgrades[i],
            });
        }

        yOffset += (cardHeight + gap) * 2 + 70;

        // Rare Upgrades
        const rareUpgrades = upgrades.rare;
        let xOffset = (this.game.width - (rareUpgrades.length * (cardWidth + gap))) / 2;
        rareUpgrades.forEach((upgrade, index) => {
            this.cards.push({
                x: xOffset + index * (cardWidth + gap),
                y: yOffset,
                width: cardWidth,
                height: cardHeight,
                choice: upgrade,
            });
        });

        yOffset += cardHeight + 70;

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
        this.titleY += (150 - this.titleY) * 0.1 * tsf;
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
        ctx.fillText('Normal', this.game.width / 2, 220);
        ctx.fillStyle = this.rarityColors.rare;
        ctx.fillText('Rare', this.game.width / 2, 850);
        ctx.fillStyle = this.rarityColors.legendary;
        ctx.fillText('Legendary', this.game.width / 2, 960 + 220);
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

        if (!hasUpgrade) {
            ctx.filter = 'grayscale(1)';
            color = '#888';
        }

        if (hasUpgrade) {
            const gradient = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.height);
            gradient.addColorStop(0, '#3af8f8ff'); // Purple
            gradient.addColorStop(1, '#FF69B4'); // Pink
            ctx.fillStyle = gradient;
        } else {
            const gradient = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.height);
            gradient.addColorStop(0, '#444');
            gradient.addColorStop(1, '#222');
            ctx.fillStyle = gradient;
        }

        ctx.strokeStyle = hasUpgrade ? '#ba9bdaff' : '#444444ff';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.roundRect(card.x, card.y, card.width, card.height, 20);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = hasUpgrade ? 'white' : color;
        ctx.font = '20px "Fredoka One"';
        ctx.textAlign = 'center';
        
        const title = card.choice.name.toUpperCase();
        ctx.fillText(title, card.x + card.width / 2, card.y + 25);

        ctx.font = '40px "Fredoka One"';
        ctx.fillText(card.choice.icon, card.x + card.width / 2, card.y + 70);

        ctx.fillStyle = hasUpgrade ? 'white' : '#aaa';
        ctx.font = '14px "Nunito"';
        this.wrapText(ctx, card.choice.description, card.x + card.width / 2, card.y + 110, card.width - 20, 16);

        ctx.fillStyle = hasUpgrade ? 'white' : color;
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
