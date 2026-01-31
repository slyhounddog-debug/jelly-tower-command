
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
            const cardWidth = 337.5; // 225 * 1.5
            const cardHeight = 495; // 330 * 1.5
            return {
                x: this.game.width / 2 - (cardWidth * 1.5 + 20) + (index * (cardWidth + 20)),
                y: this.game.PLAYABLE_AREA_HEIGHT + 100, // Start below screen
                targetY: this.game.PLAYABLE_AREA_HEIGHT / 2 - cardHeight / 2,
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
        this.game.lootPopupManager.addLoot('upgrade', choice.name, null);
        this.game.levelingManager.applyUpgrade(choice);
        this.game.audioManager.playSound('upgrade'); // Play sound when selecting an upgrade card
        this.game.levelingManager.isLevelingUp = false;
        this.game.isPaused = false;
        this.game.audioManager.setMuffled(false);
    }

    update(tsf) {
        this.titleY += (this.game.PLAYABLE_AREA_HEIGHT / 2 - 250 - this.titleY) * 0.1 * tsf;

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
        ctx.fillRect(0, 0, this.game.width, this.game.PLAYABLE_AREA_HEIGHT);

        ctx.fillStyle = 'white';
        ctx.font = '96px "Titan One"'; // 20% bigger
        ctx.textAlign = 'center';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 10;
        ctx.fillText('Level Up!', this.game.width / 2, this.titleY - 200);
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
            ctx.shadowBlur = 50;
        }

        const gradient = ctx.createLinearGradient(card.x, card.y, card.x, card.y + card.height);
        gradient.addColorStop(0, '#3af8f8ff'); // Purple
        gradient.addColorStop(1, '#FF69B4'); // Pink

        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.roundRect(card.x, card.y, card.width, card.height, 45); // 50% bigger
        ctx.fill();
        ctx.stroke();

        // Draw card content
        ctx.fillStyle = 'white'; // Use white for better contrast on the new gradient
        ctx.font = '48px "Fredoka One"'; // 50% bigger
        ctx.textAlign = 'center';
        
        const title = card.choice.name.toUpperCase();
        const maxWidth = card.width - 20; // 10px padding on each side
        let textWidth = ctx.measureText(title).width;

        ctx.save();
        if (textWidth > maxWidth) {
            const scaleFactor = maxWidth / textWidth;
            ctx.translate(card.x + card.width / 2, card.y + 45);
            ctx.scale(scaleFactor, 1.5); // Scale Y as well
            ctx.fillText(title, 0, 0);
        } else {
            ctx.fillText(title, card.x + card.width / 2, card.y + 67.5); // 50% bigger
        }
        ctx.restore();

        ctx.font = '90px "Fredoka One"'; // 50% bigger
        ctx.fillText(card.choice.icon, card.x + card.width / 2, card.y + 180); // 50% bigger

        ctx.fillStyle = 'white';
        ctx.font = '31.5px "Nunito"'; // 50% bigger
        this.wrapText(ctx, card.choice.description, card.x + card.width / 2, card.y + 270, card.width - 45, 36); // 50% bigger

        // --- NEW SECTION FOR CURRENT/TOTAL STATS ---
        let currentStatText = '';
        let showStat = false;
        let isTotal = false;

        switch (card.choice.name) {
            case 'Sticky Paw':
                currentStatText = `Currently: ${this.game.player.pickupRange.toFixed(0)}px`;
                showStat = true;
                break;
            case 'Long Tongue':
                currentStatText = `Currently: ${this.game.player.lickRange.toFixed(0)}px`;
                showStat = true;
                break;
            case 'Extra Jump':
                currentStatText = `Currently: ${this.game.player.maxJumps}`;
                showStat = true;
                break;
            case 'Sugar Shove':
                currentStatText = `Currently: ${this.game.stats.lickKnockback.toFixed(0)} KB`;
                showStat = true;
                break;
            case 'Greed':
                const bonus = Math.ceil(500 + (this.game.totalMoneyEarned * 0.025));
                currentStatText = `Total: $${bonus}`;
                showStat = true;
                isTotal = true;
                break;
        }

        if (showStat) {
            ctx.fillStyle = 'white'; // Always white for choice cards
            ctx.font = `27px "Nunito"`; // 50% bigger
            ctx.textAlign = 'center';
            const statY = card.y + 330 + (isTotal ? 7.5 : 0); // 50% bigger
            ctx.fillText(currentStatText, card.x + card.width / 2, statY);
        }
        // --- END NEW SECTION ---

        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.font = '36px "Fredoka One"'; // 50% bigger
        ctx.fillText(rarity.toUpperCase(), card.x + card.width / 2, card.y + card.height - 30);


        ctx.restore();
    }

    wrapText(context, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let testLine;
        let metrics;
        let testWidth;

        context.save();
        context.strokeStyle = 'rgba(255, 188, 241, 0.7)';
        context.lineWidth = 1;
        context.shadowColor = 'black';
        context.shadowBlur = 0;

        for (let n = 0; n < words.length; n++) {
            testLine = line + words[n] + ' ';
            metrics = context.measureText(testLine);
            testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                context.strokeText(line, x, y);
                context.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        context.strokeText(line, x, y);
        context.fillText(line, x, y);
        context.restore();
    }
}
