import Particle from './particle.js';
import Drop from './drop.js';
import { darkenColor } from './utils.js?v=25';
import DamageSpot from './damageSpot.js';
import FloatingText from './floatingText.js';

export default class Missile {
    constructor(game, x, type = 'missile', y = -60) {
        this.game = game;
        this.x = x; 
        this.y = y;
        this.baseSpeed = (type === 'piggy') ? 0.2 : 0.4;
        this.speed = (this.baseSpeed + (this.game.currentRPM * 0.02)) * 0.5;
        this.type = type;

        if (type === 'missile') {
            this.width = 50; // 45 * 1.1
            this.height = 66;  // 60 * 1.1
            this.color = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.health = (40 + this.game.currentRPM + (this.game.enemiesKilled * 0.06));
        } else if (type === 'gummy_worm') {
            this.width = 25;
            this.height = 80;
            this.color1 = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.color2 = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.color = this.color1; 
            this.health = 15 + ((this.game.currentRPM + (this.game.enemiesKilled * 0.06)) * 0.5);
            this.baseSpeed = 1.2; 
        } else if (type === 'marshmallow_large') {
            this.width = 76.5;
            this.height = 76.5;
            this.color = '#F8F8FF';
            this.health = 50 + ((this.game.currentRPM + (this.game.enemiesKilled * 0.08)) * 1.4);
            this.baseSpeed = 0.5;
            this.rotationSpeed = (Math.random() - 0.5) * 0.02;
        } else if (type === 'marshmallow_medium') {
            this.width = 45;
            this.height = 45;
            this.color = '#F8F8FF';
            this.health = 25 + ((this.game.currentRPM + (this.game.enemiesKilled * 0.1)) * 0.5);
            this.baseSpeed = 0.5;
        } else if (type === 'marshmallow_small') {
            this.width = 22;
            this.height = 22;
            this.color = '#F8F8FF';
            this.health = 9;
            this.baseSpeed = 0.5;
        }
        else if (type === 'piggy') {
            this.width = 33;
            this.height = 44;
            this.health = (40 + this.game.currentRPM + (this.game.enemiesKilled * 0.1)) * 2;
            this.baseSpeed = 0.5;
        } else { 
            this.width = 30;
            this.height = 40;
            this.health = (40 + this.game.currentRPM + (this.game.enemiesKilled * 0.1));
            this.baseSpeed = 0.8;
        }
        this.speed = (this.baseSpeed + (this.game.currentRPM * 0.08)) * 0.5;
        this.maxHealth = this.health;
        this.kbVy = 0; 
        this.damageSpots = [];
        this.scale = 1;
        this.angle = 0;
        this.animationTimer = Math.random() * Math.PI * 2;
        this.hitTimer = 0;
        this.stretch = 1;
        this.squash = 1;
        this.damageText = null;
        this.damageTextTimer = 0;
        this.criticalHitFlashTimer = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
        this.healScale = 1;
        this.slowEffects = [];
        this.auraSlowTimer = 0;
        this.fireStacks = [];
        this.fireFlashTimer = 0;
        this.totalSlow = 0; // Initialize total slow effect
        this.slowParticleTimer = 0; // Timer for emitting slow particles
    }

    applyFire(damage, stacks) {
        if (stacks <= 0) return;
        this.fireStacks.push({
            damage: damage * 0.1 * stacks, // 10% of shot damage per stack
            duration: 300, // 5 seconds at 60fps
            timer: 300,
        });
    }

    applySlow(duration, amount, source = 'generic') {
        // Prevent stacking the same type of slow from the same source
        if (!this.slowEffects.some(e => e.source === source)) {
            this.slowEffects.push({ timer: duration, amount, source });
        }
    }

    takeDamage(amount, isCritical = false) {
        this.game.audioManager.playSound('towerHit');
        const roundedAmount = amount;
        this.health -= roundedAmount;
        this.hitTimer = 10; 
        this.shakeDuration = 10;
        this.shakeMagnitude = 4;

        if (isCritical) {
            this.criticalHitFlashTimer = 15;
            this.game.floatingTexts.push(new FloatingText(this.game, this.x + this.width / 2, this.y, `-${roundedAmount.toFixed(0)}`, 'yellow', 4)); 
        } else {
            this.game.floatingTexts.push(new FloatingText(this.game, this.x + this.width / 2, this.y, `-${roundedAmount.toFixed(0)}`, 'red'));
        }

        this.damageText = `${this.health.toFixed(0)}/${this.maxHealth.toFixed(0)}`;
        this.damageTextTimer = 30; 

        const numSpots = Math.floor(roundedAmount / 5);
        for (let i = 0; i < numSpots; i++) {
            const spotX = (this.width / 2) + (Math.random() - 0.5) * (this.width * 0.5);
            const spotY = (this.height / 2) + (Math.random() - 0.5) * (this.height * 0.5);
            const spotRadius = Math.random() * 3 + 2;
            const color = (this.type === 'piggy') ? '#ff69b4' : this.color;
            const spotColor = darkenColor(color, 20);
            this.damageSpots.push(new DamageSpot(spotX, spotY, spotRadius, spotColor, this));
        }
        return this.health <= 0.5;
    }

    update(tsf) {
        if (this.auraSlowTimer > 0) this.auraSlowTimer -= tsf;

        if (this.fireFlashTimer > 0) this.fireFlashTimer -= tsf;
        // Fire damage
        for (let i = this.fireStacks.length - 1; i >= 0; i--) {
            const stack = this.fireStacks[i];
            stack.timer -= tsf;
            if (stack.timer <= 0) {
                this.fireStacks.splice(i, 1);
            } else {
                if (Math.floor(stack.timer) % 60 === 0) { // Every second
                    this.health -= stack.damage;
                    this.game.floatingTexts.push(new FloatingText(this.game, this.x + this.width / 2, this.y, `-${stack.damage.toFixed(0)}`, 'orange'));
                    this.fireFlashTimer = 10;
                }
            }
        }

        let tongueSlow = 0;
        for (let i = this.slowEffects.length - 1; i >= 0; i--) {
            const effect = this.slowEffects[i];
            effect.timer -= tsf;
            if (effect.timer <= 0) {
                this.slowEffects.splice(i, 1);
            } else {
                if (effect.source === 'tongue') {
                    tongueSlow = effect.amount;
                }
            }
        }
        
        let auraSlow = this.auraSlowTimer > 0 ? 0.5 : 0;
        
        let totalSlow = tongueSlow + auraSlow;
        if (tongueSlow > 0 && auraSlow > 0) {
            totalSlow = 0.75; // Cap at 75% if both are active
        }

        this.totalSlow = totalSlow;

        if (this.totalSlow > 0) {
            this.slowParticleTimer += tsf;
            if (this.slowParticleTimer >= 5) { // Emit particles every 5 frames (approx)
                this.slowParticleTimer = 0;
                const particleCount = Math.floor(this.totalSlow * 3); // More particles for stronger slow
                for (let i = 0; i < particleCount; i++) {
                    const px = this.x + (Math.random() * this.width);
                    const py = this.y + (Math.random() * this.height);
                    this.game.particles.push(new Particle(px, py, 'rgba(100, 150, 255, 0.7)', 'spark')); // Bluish particles
                }
            }
        }

        const currentSpeed = this.speed * (1 - this.totalSlow);

        if (this.hitTimer > 0) this.hitTimer -= tsf;
        if (this.damageTextTimer > 0) this.damageTextTimer -= tsf;
        if (this.criticalHitFlashTimer > 0) this.criticalHitFlashTimer -= tsf;
        if (this.shakeDuration > 0) this.shakeDuration -= tsf;
        if (this.healScale > 1) this.healScale -= 0.05 * tsf;
        else this.healScale = 1;

        // Ground Squish Logic - tightened distance from 15 to 5
        const ground = this.game.platforms.find(p => p.type === 'ground');
        const distToGround = ground ? ground.y - (this.y + this.height) : 1000;
        if (distToGround < 5 && distToGround > -10) {
            this.squash = 1.35;
            this.stretch = 0.65;
        } else {
            const stretch_factor = 0.2;
            this.stretch = 1 + Math.abs(this.kbVy) * stretch_factor;
            this.squash = 1 - Math.abs(this.kbVy) * stretch_factor * 0.5;
        }

        this.animationTimer += 0.1 * tsf;
        if (this.type === 'missile') {
            this.scale = 1 + Math.sin(this.animationTimer) * 0.04;
            this.angle = Math.sin(this.animationTimer * 0.5) * (Math.PI / 18);
        } else if (this.type === 'gummy_worm') {
            this.x += Math.sin(this.y / 30) * 2.5 * tsf;
        } else if (this.type === 'marshmallow_large') {
            this.angle += this.rotationSpeed * tsf;
        }

        this.kbVy *= 0.9;
        this.y += (currentSpeed + this.kbVy) * tsf;

        if (this.type === 'gummy_worm') {
            if (this.x < 0) this.x = 0;
            if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
        }

        if (this.game.gameTime % 8 < 1 * tsf) {
            const color = (this.type === 'piggy') ? 'rgba(255, 105, 180, 0.6)' : this.color;
            this.game.particles.push(new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * 15, this.y, color, 'drip'));
            if (Math.random() < 0.3) {
                this.game.particles.push(new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * 15, this.y, color, 'drip'));
            }
        }

        for (let i = this.damageSpots.length - 1; i >= 0; i--) {
            this.damageSpots[i].update(tsf);
            if (this.damageSpots[i].opacity <= 0) this.damageSpots.splice(i, 1);
        }
    }

    draw(ctx) {
        const ground = this.game.platforms.find(p => p.type === 'ground');
        if (ground) {
            const distance = ground.y - (this.y + this.height);
            const maxShadowDistance = 800;
            if (distance < maxShadowDistance && distance > -this.height) {
                const shadowFactor = 1 - (distance / maxShadowDistance);
                const shadowWidth = (this.width * 0.5) * shadowFactor;
                const shadowHeight = shadowWidth * 0.25;
                const shadowOpacity = 0.3 * shadowFactor;
                ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
                ctx.beginPath();
                ctx.ellipse(this.x + this.width / 2, ground.y + 2, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.save();

        // Draw blue overlay if slowed
        if (this.totalSlow > 0) {
            ctx.fillStyle = `rgba(100, 150, 255, ${this.totalSlow * 0.5})`; // More opaque for stronger slow
            ctx.beginPath();
            // Use enemy's actual dimensions
            ctx.roundRect(this.x, this.y, this.width, this.height, 10);
            ctx.fill();
        }

        ctx.shadowBlur = 15;
        let color = (this.type === 'piggy') ? '#ff69b4' : this.color;
        if(this.hitTimer > 0) color = '#FFFFFF';
        if (this.fireFlashTimer > 0) {
            const alpha = (this.fireFlashTimer / 10);
            color = `rgba(255, 0, 0, ${alpha})`;
        }
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        const shadowOffset = 5;
        const shadowDarkness = 20;
        const shadowColor = darkenColor(color, shadowDarkness);
        
        if (this.type === 'piggy') {
            const piggyLevel = this.game.stats.piggyLvl;
            const sizeMultiplier = 1 + (piggyLevel * 0.15);
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            ctx.save();
            ctx.fillStyle = shadowColor;
            ctx.translate(cx, cy + shadowOffset);
            ctx.scale(1.1 * this.squash * sizeMultiplier * 1.1, 1.1 * this.stretch * sizeMultiplier * 1.1);
            ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(1.1 * this.squash * sizeMultiplier, 1.1 * this.stretch * sizeMultiplier);
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#ffb7b2';
            ctx.beginPath(); ctx.arc(0, 0, 4.8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(-2, -2, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(2, -2, 1, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-15, -20); ctx.lineTo(-5, -15); ctx.fill();
            ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(15, -20); ctx.lineTo(5, -15); ctx.fill();

            if (piggyLevel > 0) {
                ctx.globalAlpha = 0.6 + Math.sin(this.game.gameTime / 8) * 0.4;
                ctx.fillStyle = 'gold';
                for (let i = 0; i < piggyLevel * 2; i++) {
                    const shimmerAngle = (this.game.gameTime / 15) + (i * Math.PI * 2 / (piggyLevel * 2));
                    const shimmerX = Math.cos(shimmerAngle) * 12;
                    const shimmerY = Math.sin(shimmerAngle) * 8;
                    ctx.beginPath(); ctx.arc(shimmerX, shimmerY, 2.5, 0, Math.PI * 2); ctx.fill();
                }
                ctx.globalAlpha = 1.0;
            }
            ctx.restore();
        } else if (this.type === 'gummy_worm') {
            const segments = 10;
            const segmentHeight = this.height / segments;
            const wiggleAmplitude = 4;
            const wiggleFrequency = 0.2;

            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + shadowOffset);
            ctx.scale(this.squash * 1.09, this.stretch * 1.09);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
            const borderColor1 = darkenColor(this.color1, shadowDarkness);
            const borderColor2 = darkenColor(this.color2, shadowDarkness);
            const borderGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            borderGrad.addColorStop(0, borderColor1);
            borderGrad.addColorStop(1, borderColor2);
            ctx.strokeStyle = borderGrad; ctx.lineWidth = this.width + 4; ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const yPos = this.y + i * segmentHeight;
                const xPos = this.x + this.width / 2 + Math.sin(i * wiggleFrequency + this.animationTimer) * wiggleAmplitude;
                if (i === 0) ctx.moveTo(xPos, yPos);
                else ctx.lineTo(xPos, yPos);
            }
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(this.squash, this.stretch);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));
            const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            if (this.hitTimer > 0) {
                grad.addColorStop(0, 'white'); grad.addColorStop(1, 'white');
            } else {
                grad.addColorStop(0, this.color1); grad.addColorStop(1, this.color2);
            }
            ctx.strokeStyle = grad; ctx.lineWidth = this.width; ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const yPos = this.y + i * segmentHeight;
                const xPos = this.x + this.width / 2 + Math.sin(i * wiggleFrequency + this.animationTimer) * wiggleAmplitude;
                if (i === 0) ctx.moveTo(xPos, yPos);
                else ctx.lineTo(xPos, yPos);
            }
            ctx.stroke();
            ctx.restore();
        } else if (this.type.includes('marshmallow')) {
            ctx.save();
            ctx.fillStyle = shadowColor;
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2 + shadowOffset);
            ctx.rotate(this.angle);
            ctx.scale(this.squash * 1.1, this.stretch * 1.1);
            ctx.beginPath(); ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 10); ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.angle);
            ctx.scale(this.squash, this.stretch);
            ctx.fillStyle = (this.hitTimer > 0) ? 'white' : this.color;
            ctx.beginPath(); ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 10); ctx.fill();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath(); ctx.ellipse(-this.width * 0.2, -this.height * 0.2, this.width * 0.2, this.height * 0.3, -0.8, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }
       else {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            // Increased bean base dimensions by 10%
            const beanWidth = 49.5; 
            const beanHeight = 33;

            ctx.save();
            ctx.translate(cx, cy + shadowOffset);
            ctx.rotate(this.angle);
            ctx.scale(this.scale * this.squash * 1.15, this.scale * this.stretch * 1.15);
            ctx.fillStyle = shadowColor;
            ctx.beginPath();
            ctx.moveTo(0, -beanHeight / 2);
            ctx.bezierCurveTo(beanWidth / 2, -beanHeight / 1.5, beanWidth / 2, beanHeight / 1.5, 0, beanHeight / 2);
            ctx.bezierCurveTo(-beanWidth / 3, beanHeight / 1.5, -beanWidth / 3, -beanHeight / 1.5, 0, -beanHeight / 2);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(this.angle);
            ctx.scale(this.scale * this.squash, this.scale * this.stretch);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(0, -beanHeight / 2);
            ctx.bezierCurveTo(beanWidth / 2, -beanHeight / 1.5, beanWidth / 2, beanHeight / 1.5, 0, beanHeight / 2);
            ctx.bezierCurveTo(-beanWidth / 3, beanHeight / 1.5, -beanWidth / 3, -beanHeight / 1.5, 0, -beanHeight / 2);
            ctx.fill();
            ctx.strokeStyle = this.color; ctx.lineWidth = 3; ctx.stroke();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath(); ctx.ellipse(7.5, -6, 4.5, 9, -0.3, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
        }

        ctx.shadowBlur = 0;
      if (this.health < this.maxHealth) {
            const pct = Math.max(0, this.health / this.maxHealth);
            const isLow = pct < 0.25;
            
            // Calculate size based on enemy type
            let sizeMult = 1.0;
            if (this.type === 'piggy') sizeMult = 1.15;
            else if (this.type === 'marshmallow_large') sizeMult = 1.25;
            else if (this.type === 'marshmallow_small') sizeMult = 0.8;
            
            // Pulsing effect for low health (under 25%)
            const pulse = isLow ? 1 + Math.sin(this.game.gameTime * 0.2) * 0.1 : 1;
            const finalMult = sizeMult * pulse;
            
            let offsetX = (this.shakeDuration > 0) ? (Math.random() - 0.5) * this.shakeMagnitude : 0;
            let offsetY = (this.shakeDuration > 0) ? (Math.random() - 0.5) * this.shakeMagnitude : 0;
            
            const barWidth = (this.width * 1.2) * finalMult;
            const barHeight = 18 * finalMult; 
            const barX = (this.x + this.width/2 - barWidth/2) + offsetX;
            const barY = this.y - 22 + offsetY;

            const frameColor = shadowColor;

            // Glass Tube Background
            ctx.fillStyle = frameColor + '66'; 
            ctx.beginPath(); ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 10); ctx.fill();
            
            // Inner Empty Tube
            ctx.fillStyle = darkenColor(frameColor, 30) + '99'; 
            ctx.beginPath(); ctx.roundRect(barX, barY, barWidth, barHeight, 8); ctx.fill();

            // Health Fill Logic (Red < 25%, Yellow < 60%, Green otherwise)
            let healthFillColor = '#2ecc71'; // Green
            if (pct < 0.25) healthFillColor = '#ff3131'; // Red
            else if (pct < 0.60) healthFillColor = '#f1c40f'; // Yellow
            
            ctx.fillStyle = (this.hitTimer > 0) ? '#FFFFFF' : healthFillColor;
            ctx.beginPath(); ctx.roundRect(barX, barY, barWidth * pct, barHeight, 8); ctx.fill();

            // Candy Glaze Shine
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath(); ctx.roundRect(barX + 2, barY + 2, barWidth - 4, barHeight / 3, 8); ctx.fill();

            if (this.damageTextTimer > 0) {
                const alpha = Math.sin((this.damageTextTimer / 30) * Math.PI);
                ctx.save();
                ctx.globalAlpha = alpha; 
                ctx.font = 'bold 34px "Lucky Guy"';
                ctx.textAlign = 'center';
                
                const tx = barX + barWidth / 2;
                const ty = barY + 15;
                const val = Math.ceil(this.health);

                // Add the gray border
                ctx.strokeStyle = '#333333'; // Dark gray border
                ctx.lineWidth = 4;           // Thickness of the border
                ctx.strokeText(val, tx, ty);

                // Fill the white text
                ctx.fillStyle = 'white';
                ctx.fillText(val, tx, ty);
                
                ctx.restore();
            }
        }
        ctx.restore();

        for (const spot of this.damageSpots) spot.draw(ctx);
    }
    
       kill(index) {
        let xpGained = 0;
        let maxHealthForXp = this.maxHealth;

        if (this.type === 'marshmallow_small') {
            // Calculate what a standard jelly bean's health would be right now
            maxHealthForXp = (40 + this.game.currentRPM + (this.game.enemiesKilled * 0.1));
        }

        xpGained = 10 + (maxHealthForXp / 5);
        
        // Apply emporium multiplier
        const xpMultiplier = this.game.emporium.getEnemyXpMultiplier();
        xpGained *= xpMultiplier;

        this.game.levelingManager.addXp(this.x, this.y, xpGained);

           // Trigger global screen shake using the ScreenShake utility
           let shakeIntensity = 5; 
           if (this.type === 'marshmallow_large') shakeIntensity = 15;
           else if (this.type === 'marshmallow_medium') shakeIntensity = 8;        else if (this.type === 'marshmallow_small') shakeIntensity = 3;
        
        // Use the imported ScreenShake constant
        import('./utils.js?v=25').then(utils => {
            if (utils.ScreenShake && typeof utils.ScreenShake.trigger === 'function') {
                utils.ScreenShake.trigger(shakeIntensity, 15);
            }
        });

        if (this.type === 'marshmallow_large') {
            this.game.missiles.splice(index, 1);
            for (let i = 0; i < 2; i++) {
                this.game.missiles.push(new Missile(this.game, this.x + (i * 30) - 15, 'marshmallow_medium', this.y));
            }
            for (let k = 0; k < 20; k++) this.game.particles.push(new Particle(this.x, this.y, this.color, 'smoke'));
            return;
        }

        if (this.type === 'marshmallow_medium') {
            this.game.missiles.splice(index, 1);
            for (let i = 0; i < 2; i++) {
                this.game.missiles.push(new Missile(this.game, this.x + (i * 20) - 10, 'marshmallow_small', this.y));
            }
            for (let k = 0; k < 10; k++) this.game.particles.push(new Particle(this.x, this.y, this.color, 'smoke'));
            return;
        }

        this.game.missiles.splice(index, 1);
        const pStats = this.game.stats.piggyStats;
        const count = (this.type === 'piggy') ? pStats.mult : 1;
        
        this.game.enemiesKilled++;

        const dropsToCreate = [];
        
        for (let c = 0; c < count; c++) {
            dropsToCreate.push('coin');
            if (Math.random() * 100 < this.game.stats.luckHeart) dropsToCreate.push('heart');
            if (Math.random() * 100 < this.game.stats.luckCoin) dropsToCreate.push('lucky_coin');

            const iceCreamChanceLevel = this.game.emporiumUpgrades.ice_cream_chance.level;
            const chances = this.game.emporiumUpgrades.ice_cream_chance.values[iceCreamChanceLevel];
            const dropChance = (this.type === 'piggy') ? chances[1] : chances[0];
            if (Math.random() * 100 < dropChance) {
                dropsToCreate.push('ice_cream_scoop');
            }
            if (this.game.player.upgrades['Scoop Doubler'] > 0) {
                if (Math.random() < 0.33) {
                    dropsToCreate.push('ice_cream_scoop');
                }
            }
        }

        dropsToCreate.forEach((dropType, i) => {
            setTimeout(() => {
                this.game.drops.push(new Drop(this.game, this.x, this.y, dropType));
            }, i * 100);
        });

        if (this.type === 'piggy') {
            if (Math.random() < 0.99) {
                this.game.drops.push(new Drop(this.game, this.x, this.y, 'component'));
            }
            const bonus = Math.floor(this.game.money * pStats.bonus);
            this.game.money += bonus;
            this.game.totalMoneyEarned += bonus;
            document.getElementById('notification').innerText = `PIGGY SMASHED! +$${bonus}`;
            document.getElementById('notification').style.opacity = 1;
            setTimeout(() => document.getElementById('notification').style.opacity = 0, 2000);
        }
        
        for (let k = 0; k < 20; k++) this.game.particles.push(new Particle(this.x, this.y, (this.type === 'piggy' ? '#ff69b4' : this.color), 'smoke'));
    }
}