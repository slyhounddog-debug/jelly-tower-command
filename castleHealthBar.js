import { darkenColor } from './utils.js';
import Particle from './particle.js';

export default class CastleHealthBar {
    constructor(game) {
        this.game = game;
        this.hitAnimTimer = 0;
        this.healAnimTimer = 0;
    }

    update(tsf) {
        if (this.hitAnimTimer > 0) this.hitAnimTimer -= tsf;
        if (this.healAnimTimer > 0) this.healAnimTimer -= tsf;

        // Particle Effects
        const healthPct = this.game.castleHealth / this.game.emporium.getCastleMaxHealth();
        if (healthPct <= 0) return;

        let particleRate = 0;
        if (healthPct < 0.20) {
            particleRate = 0.1; // More particles
        } else if (healthPct < 0.50) {
            particleRate = 0.05; // Fewer particles
        }

        if (Math.random() < particleRate) {
            const barX = 20;
            const barY = 25;
            const barWidth = 350;
            
            const px = barX + (barWidth * healthPct) + (Math.random() * 10 - 5);
            const py = barY + (Math.random() * 28);
            this.game.particles.push(new Particle(this.game, px, py, 'magenta', 'spark'));
        }
    }

    triggerHit() {
        this.hitAnimTimer = 20;
        this.game.audioManager.playSound('towerHit');
    }

    triggerHeal() {
        this.healAnimTimer = 20;
    }

    draw(ctx) {
        const barWidth = 525; // 350 * 1.5
        const barHeight = 42; // 28 * 1.5
        const barX = 20;
        const barY = 25;

        const maxHealth = this.game.emporium.getCastleMaxHealth();
        const pct = Math.max(0, this.game.castleHealth / maxHealth);

        // Shake effect on hit
        let shakeX = 0;
        let shakeY = 0;
        if (this.hitAnimTimer > 0) {
            shakeX = Math.sin(this.hitAnimTimer * 0.8) * 5;
            shakeY = Math.cos(this.hitAnimTimer * 0.8) * 5;
        }
        
        ctx.save();
        ctx.translate(shakeX, shakeY);

        // Frame (Glass Tube)
        ctx.fillStyle = 'rgba(10, 0, 10, 0.6)';
        ctx.strokeStyle = '#ff00ff'; // Magenta border
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 21); // 14 * 1.5
        ctx.fill();
        ctx.stroke();

        // Health Fill
        if (pct > 0) {
            // Interpolate color from bright pink to magenta
            const pink = { r: 255, g: 105, b: 180 }; // Bright Pink
            const magenta = { r: 255, g: 0, b: 255 }; // Magenta
            
            const r = Math.round(pink.r + (magenta.r - pink.r) * (1 - pct));
            const g = Math.round(pink.g + (magenta.g - pink.g) * (1 - pct));
            const b = Math.round(pink.b + (magenta.b - pink.b) * (1 - pct));

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth * pct, barHeight, 21); // 14 * 1.5
            ctx.fill();
        }

        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(barX + 3, barY + 3, barWidth - 6, barHeight / 3, 15); // 10 * 1.5
        ctx.fill();

        // Text
        const healthText = `${Math.ceil(this.game.castleHealth)} / ${maxHealth}`;
        ctx.font = 'bold 24px "Lucky Guy"'; // 16 * 1.5
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(healthText, barX + barWidth / 2, barY + barHeight / 2 + 2);
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
}
