import { darkenColor } from './utils.js';
import Particle from './particle.js';

export default class CastleHealthBar {
    constructor(game) {
        this.game = game;
        this.hitAnimTimer = 0;
        this.healAnimTimer = 0;
        this.visualHealth = this.game.castleHealth;
        this.whiteBarCurrentHealth = this.game.castleHealth;
        this.whiteBarTargetHealth = this.game.castleHealth;
        this.whiteBarTimer = 0;
        this.pulseTimer = 0;
        this.wobbleTimer = 0;
        this.lowHealthFlashTimer = 0;
        this.width = 525;
        this.height = 42;
    }

    update(tsf) {
        if (this.hitAnimTimer > 0) this.hitAnimTimer -= tsf;
        if (this.healAnimTimer > 0) this.healAnimTimer -= tsf;

        // Decrease the white bar timer
        this.whiteBarTimer = Math.max(0, this.whiteBarTimer - tsf);

        // If the white bar timer has run out, start interpolating visualHealth towards actual health
        if (this.whiteBarTimer <= 0) {
            const maxHealth = this.game.emporium.getCastleMaxHealth();
            const targetHealth = this.game.castleHealth; // The actual current health

            // Smoothly interpolate visualHealth towards targetHealth
            if (Math.abs(this.visualHealth - targetHealth) > 0.1) {
                const interpolationSpeed = 0.05; 
                this.visualHealth += (targetHealth - this.visualHealth) * interpolationSpeed * tsf;
                // Clamp visualHealth to stay within bounds
                this.visualHealth = Math.min(maxHealth, Math.max(0, this.visualHealth));
            } else {
                this.visualHealth = targetHealth; // Snap to target when close enough
            }
            // Reset white bar drawing state when interpolation is active
            this.whiteBarCurrentHealth = this.visualHealth; 
            this.whiteBarTargetHealth = this.visualHealth;
        }

        // --- NEW PULSE/WOBBLE LOGIC ---
        const healthPct = this.game.castleHealth / this.game.emporium.getCastleMaxHealth();
        if (healthPct < 0.4) {
            if (healthPct < 0.2) {
                // Faster pulse and wobble below 20%
                this.pulseTimer += 0.15 * tsf;
                this.wobbleTimer += 0.2 * tsf;
                this.lowHealthFlashTimer += 0.1 * tsf;
            } else {
                // Slower pulse below 40%
                this.pulseTimer += 0.05 * tsf;
                this.wobbleTimer = 0; // Reset wobble if not below 20%
                this.lowHealthFlashTimer = 0;
            }
        } else {
            this.pulseTimer = 0; // Reset pulse if above 40%
            this.wobbleTimer = 0;
            this.lowHealthFlashTimer = 0;
        }
        // --- END NEW LOGIC ---

        // Particle Effects (remaining as is)
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
        this.whiteBarCurrentHealth = this.visualHealth; // What the bar was showing visually
        this.whiteBarTargetHealth = this.game.castleHealth; // What the health just became (lower)
        this.whiteBarTimer = 60; // Start timer. visualHealth will NOT update for 1 second.
    }

    triggerHeal() {
        this.healAnimTimer = 20;
        this.whiteBarCurrentHealth = this.visualHealth; // What the bar was showing visually
        this.whiteBarTargetHealth = this.game.castleHealth; // What the health just became (higher)
        this.whiteBarTimer = 60; // Start timer. visualHealth will NOT update for 1 second.
    }

    draw(ctx, x, y, barWidth = this.width) {
        // const barWidth = 525; // 350 * 1.5 - Now comes from parameter or this.width
        const barHeight = this.height; // Now comes from this.height
        const barX = x;
        const barY = y;

        const maxHealth = this.game.emporium.getCastleMaxHealth();
        const pct = Math.max(0, this.game.castleHealth / maxHealth);

        // --- NEW PULSE/WOBBLE DRAW LOGIC ---
        let scaleEffect = 1.0;
        let wobbleX = 0;
        let wobbleY = 0;
        let rotationEffect = 0;

        if (pct < 0.4) {
            scaleEffect = 1.0 + Math.sin(this.pulseTimer) * 0.02; // Pulse 2%
            if (pct < 0.2) {
                scaleEffect = 1.0 + Math.sin(this.pulseTimer) * 0.04; // Pulse 4%
                wobbleX = Math.sin(this.wobbleTimer * 1.2) * 3;
                wobbleY = Math.sin(this.wobbleTimer * 0.8) * 3;
                rotationEffect = Math.sin(this.wobbleTimer * 0.5) * 0.02; // Tiny rotation
            }
        }
        // --- END NEW LOGIC ---

        // Shake effect on hit
        let shakeX = 0;
        let shakeY = 0;
        if (this.hitAnimTimer > 0) {
            shakeX = Math.sin(this.hitAnimTimer * 0.8) * 5;
            shakeY = Math.cos(this.hitAnimTimer * 0.8) * 5;
        }
        
        ctx.save();
        // Apply wobble and shake, then scale and rotate
        ctx.translate(barX + barWidth / 2, barY + barHeight / 2);
        ctx.translate(shakeX + wobbleX, shakeY + wobbleY);
        ctx.rotate(rotationEffect);
        ctx.scale(scaleEffect, scaleEffect);
        ctx.translate(-(barX + barWidth / 2), -(barY + barHeight / 2));

        // Frame (Glass Tube)
        ctx.fillStyle = 'rgba(10, 0, 10, 0.6)';
        ctx.strokeStyle = '#ff00ff'; // Magenta border
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 38); // 14 * 1.5
        ctx.fill();
        ctx.stroke();


        const currentHealthPct = Math.max(0, this.game.castleHealth / maxHealth);
        const visualHealthPct = Math.max(0, this.visualHealth / maxHealth);

        // Determine the two values to draw: actual (game.castleHealth) and visual (this.visualHealth)
        // If whiteBarTimer is active, one of these is the "pending" state.
        let lowerHealthPct = Math.min(currentHealthPct, visualHealthPct);
        let higherHealthPct = Math.max(currentHealthPct, visualHealthPct);

        // Draw the main colored health bar up to the lower of current or visual health
        // This ensures the main bar is always behind the white bar for healing, or the "solid" part for damage
        if (lowerHealthPct > 0) {
            const pink = { r: 255, g: 105, b: 180 }; // Bright Pink
            const magenta = { r: 255, g: 0, b: 255 }; // Magenta
            
            const r = Math.round(pink.r + (magenta.r - pink.r) * (1 - lowerHealthPct));
            const g = Math.round(pink.g + (magenta.g - pink.g) * (1 - lowerHealthPct));
            const b = Math.round(pink.b + (magenta.b - pink.b) * (1 - lowerHealthPct));

            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth * lowerHealthPct, barHeight, 38);
            ctx.fill();
        }

        // Draw the white bar for the "gap" or "pending" amount
        if (this.whiteBarTimer > 0 && Math.abs(currentHealthPct - visualHealthPct) > 0.001) { // Only draw if there's a significant difference
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'; // White with some transparency
            ctx.beginPath();
            ctx.roundRect(barX + (barWidth * lowerHealthPct), barY, barWidth * (higherHealthPct - lowerHealthPct), barHeight, 38);
            ctx.fill();
        }
        
        // --- Low Health Flash ---
        if (pct < 0.2) {
            const flashOpacity = (Math.sin(this.lowHealthFlashTimer) + 1) / 2 * 0.20; // Cycles between 0 and 0.20
            ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth, barHeight, 38);
            ctx.fill();
        }


        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(barX + 3, barY + 3, barWidth - 6, barHeight / 3, 20); // 10 * 1.5
        ctx.fill();

        // Text
        const healthText = `${Math.ceil(this.game.castleHealth)} / ${maxHealth}`;
        ctx.font = 'bold 58px "VT323"'; // 42 * 1.25 + 6
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
