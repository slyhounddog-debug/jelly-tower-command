
export default class LevelUpScreen {
    constructor(game) {
        this.game = game;
        this.upgradeChoices = [];
        this.cards = [];
        this.titleY = -100;
        this.canChoose = false;
    }

    startLevelUp(choices) {
        this.titleY = -100;
        this.canChoose = false;
        setTimeout(() => {
            this.canChoose = true;
        }, 1000);
        this.upgradeChoices = choices;
        this.cards = this.upgradeChoices.map((choice, index) => {
            const cardWidth = 225; // 150 * 1.5
            const cardHeight = 330; // 220 * 1.5
            return {
                x: this.game.width / 2 - (cardWidth * 1.5 + 20) + (index * (cardWidth + 20)),
                y: this.game.height + 100, // Start below screen
                targetY: this.game.height / 2 - cardHeight / 2,
                width: cardWidth,
                height: cardHeight,
                choice: choice,
                isFlipping: false,
                flipProgress: 0,
                hovered: false,
            };
        });
    }

    applyUpgrade(choice) {
        this.game.levelingManager.applyUpgrade(choice);
        this.game.audioManager.playSound('upgrade'); // Play sound when selecting an upgrade card
        this.game.levelingManager.isLevelingUp = false;
        this.game.isPaused = false;
        this.game.audioManager.setMuffled(false);
    }

    update(tsf) {
        this.titleY += (this.game.height / 2 - 250 - this.titleY) * 0.1 * tsf;

        this.cards.forEach(card => {
            card.y += (card.targetY - card.y) * 0.1 * tsf;

            if (this.game.mouse.x > card.x && this.game.mouse.x < card.x + card.width &&
                this.game.mouse.y > card.y && this.game.mouse.y < card.y + card.height) {
                card.hovered = true;
                if (this.game.mouse.isDown && this.canChoose) {
                    this.applyUpgrade(card.choice);
                }
            } else {
                card.hovered = false;
            }
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        ctx.fillStyle = 'white';
        ctx.font = '80px "Lucky Guy"';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.fillText('Level Up!', this.game.width / 2, this.titleY);
        ctx.restore();

        this.cards.forEach(card => {
            this.drawCard(ctx, card);
        });
    }

    drawCard(ctx, card) {
        ctx.save();
        
        const rarityColors = {
            normal: '#2ecc71',   // Green
            rare: '#9b59b6',     // Purple
            legendary: '#f1c40f'  // Gold
        };
        const rarityGlows = {
            normal: 'rgba(46, 204, 113, 0.5)',
            rare: 'rgba(155, 89, 182, 0.5)',
            legendary: 'rgba(241, 196, 15, 0.7)'
        };

        const rarity = card.choice.rarity;
        const color = rarityColors[rarity] || '#ffffff';
        const glow = rarityGlows[rarity] || 'rgba(255, 255, 255, 0.5)';

        if (card.hovered) {
            ctx.shadowColor = glow;
            ctx.shadowBlur = 30;
        }

        const gradient = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.height);
        gradient.addColorStop(0, '#3af8f8ff'); // Purple
        gradient.addColorStop(1, '#FF69B4'); // Pink

        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.roundRect(card.x, card.y, card.width, card.height, 30);
        ctx.fill();
        ctx.stroke();

        // Draw card content
        ctx.fillStyle = color;
        ctx.font = '36px "Lucky Guy"'; // Increased font size
        ctx.textAlign = 'center';
        ctx.fillText(card.choice.name, card.x + card.width / 2, card.y + 45);

        ctx.font = '60px "Lucky Guy"'; // Increased font size
        ctx.fillText(card.choice.icon, card.x + card.width / 2, card.y + 120);

        ctx.fillStyle = 'white';
        ctx.font = '21px sans-serif'; // Increased font size
        this.wrapText(ctx, card.choice.description, card.x + card.width / 2, card.y + 210, card.width - 30, 24);

        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.font = '24px "Lucky Guy"'; // Increased font size
        ctx.fillText(rarity.toUpperCase(), card.x + card.width / 2, card.y + card.height - 30);


        ctx.restore();
    }

    wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testLine;
        let metrics;
        let testWidth;

        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            metrics = context.measureText(testLine);
            testWidth = metrics.width;
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
