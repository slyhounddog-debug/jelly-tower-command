
class LootPopup {
    constructor(type, text, value, x, y) {
        this.type = type;
        this.text = text;
        this.value = value;
        this.x = x;
        this.y = y;
        this.FADE_DURATION = 2000; // 2 second
        this.fadeTimer = this.FADE_DURATION;
        this.isFaded = false;
        this.shakeTimer = 0;
        this.targetY = y;
    }

    update(dt) {
        this.fadeTimer -= dt;
        if (this.fadeTimer <= 0) {
            this.isFaded = true;
        }

        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
        }
        
        // Animate position
        if (this.y > this.targetY) {
            this.y -= (this.y - this.targetY) * 0.1;
        }
    }

    draw(ctx) {
        const alpha = Math.max(0, this.fadeTimer / this.FADE_DURATION);
        if (alpha <= 0) return;

        const boxWidth = 225;
        const boxHeight = 60;
        const cornerRadius = 15;
        
        let displayX = this.x;
        if (this.shakeTimer > 0) {
            displayX += (Math.random() - 0.5) * 8;
        }

        ctx.save();
        ctx.globalAlpha = alpha * 0.9; 

        if (this.type === 'xp') {
            // Teal rectangle for XP
            ctx.fillStyle = 'rgba(0, 77, 74, 1)'; // Dark Teal
            ctx.strokeStyle = '#00f2ea'; // Bright Teal
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(displayX + cornerRadius, this.y);
            ctx.lineTo(displayX + boxWidth - cornerRadius, this.y);
            ctx.quadraticCurveTo(displayX + boxWidth, this.y, displayX + boxWidth, this.y + cornerRadius);
            ctx.lineTo(displayX + boxWidth, this.y + boxHeight - cornerRadius);
            ctx.quadraticCurveTo(displayX + boxWidth, this.y + boxHeight, displayX + boxWidth - cornerRadius, this.y + boxHeight);
            ctx.lineTo(displayX + cornerRadius, this.y + boxHeight);
            ctx.quadraticCurveTo(displayX, this.y + boxHeight, displayX, this.y + boxHeight - cornerRadius);
            ctx.lineTo(displayX, this.y + cornerRadius);
            ctx.quadraticCurveTo(displayX, this.y, displayX + cornerRadius, this.y);
            ctx.closePath();
            
            ctx.fill();
            ctx.stroke();

            // Text for XP
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#00f2ea';
            ctx.font = 'bold 34px "Lucky Guy"';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${this.text} +${Math.floor(this.value)}`, displayX + 20, this.y + boxHeight / 2);

        } else if (this.type === 'component') {
            // Purple rectangle for components
            ctx.fillStyle = 'rgba(139, 0, 139, 1)'; // Dark Magenta
            ctx.strokeStyle = '#ff00ff'; // Bright Magenta
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(displayX + cornerRadius, this.y);
            ctx.lineTo(displayX + boxWidth - cornerRadius, this.y);
            ctx.quadraticCurveTo(displayX + boxWidth, this.y, displayX + boxWidth, this.y + cornerRadius);
            ctx.lineTo(displayX + boxWidth, this.y + boxHeight - cornerRadius);
            ctx.quadraticCurveTo(displayX + boxWidth, this.y + boxHeight, displayX + boxWidth - cornerRadius, this.y + boxHeight);
            ctx.lineTo(displayX + cornerRadius, this.y + boxHeight);
            ctx.quadraticCurveTo(displayX, this.y + boxHeight, displayX, this.y + boxHeight - cornerRadius);
            ctx.lineTo(displayX, this.y + cornerRadius);
            ctx.quadraticCurveTo(displayX, this.y, displayX + cornerRadius, this.y);
            ctx.closePath();
            
            ctx.fill();
            ctx.stroke();

            // Text for component
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#ff00ff';
            ctx.font = 'bold 24px "Lucky Guy"';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${this.text}`, displayX + 20, this.y + boxHeight / 2);
        } else {
            // Original pink rounded rectangle for other loot
            ctx.fillStyle = 'rgba(236, 145, 171, 1)'; // Light pastel pink
            ctx.strokeStyle = 'rgb(255, 220, 230)'; // Lighter pastel pink 
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(displayX + cornerRadius, this.y);
            ctx.lineTo(displayX + boxWidth - cornerRadius, this.y);
            ctx.quadraticCurveTo(displayX + boxWidth, this.y, displayX + boxWidth, this.y + cornerRadius);
            ctx.lineTo(displayX + boxWidth, this.y + boxHeight - cornerRadius);
            ctx.quadraticCurveTo(displayX + boxWidth, this.y + boxHeight, displayX + boxWidth - cornerRadius, this.y + boxHeight);
            ctx.lineTo(displayX + cornerRadius, this.y + boxHeight);
            ctx.quadraticCurveTo(displayX, this.y + boxHeight, displayX, this.y + boxHeight - cornerRadius);
            ctx.lineTo(displayX, this.y + cornerRadius);
            ctx.quadraticCurveTo(displayX, this.y, displayX + cornerRadius, this.y);
            ctx.closePath();
            
            ctx.fill();
            ctx.stroke();

            // Draw the text
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'White';
            ctx.font = 'bold 34px "Lucky Guy"';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${this.text} +${this.value}`, displayX + 20, this.y + boxHeight / 2);
        }
        
        ctx.restore();
    }

    resetFade() {
        this.fadeTimer = this.FADE_DURATION;
        this.isFaded = false;
        this.shakeTimer = 150; // Shake for 150ms
    }
}

class LootPopupManager {
    constructor(game) {
        this.game = game;
        this.popups = [];
        this.baseX = 20;
        this.baseY = game.height - 200; // Adjust as needed, above money
        this.spacing = 50;
    }

    addLoot(type, text, value) {
        if (type === 'component') {
            this.popups.forEach(p => {
                p.targetY -= this.spacing;
            });
            const newPopup = new LootPopup(type, text, value, this.baseX, this.baseY);
            this.popups.push(newPopup);
            return;
        }
        const existingPopup = this.popups.find(p => p.type === type);

        if (existingPopup) {
            existingPopup.value += value;
            existingPopup.resetFade();
        } else {
            // Push all existing popups up
            this.popups.forEach(p => {
                p.targetY -= this.spacing;
            });

            const newPopup = new LootPopup(type, text, value, this.baseX, this.baseY);
            this.popups.push(newPopup);
        }
    }

    update(dt) {
        for (let i = this.popups.length - 1; i >= 0; i--) {
            const popup = this.popups[i];
            popup.update(dt);
            if (popup.isFaded) {
                this.popups.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        this.popups.forEach(popup => {
            popup.draw(ctx);
        });
    }
}

export default LootPopupManager;
