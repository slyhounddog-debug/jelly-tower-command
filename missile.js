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
        this.baseSpeed = (type === 'piggy') ? 0.5 : 0.8;
        this.speed = (this.baseSpeed + (this.game.currentRPM * 0.08)) * 0.5;
        this.type = type;

        if (type === 'missile') {
            this.width = 45;
            this.height = 60;
            this.color = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.health = (40 + this.game.currentRPM + (this.game.enemiesKilled * 0.1));
        } else if (type === 'gummy_worm') {
            this.width = 25;
            this.height = 80;
            this.color1 = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.color2 = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.color = this.color1; // For shared logic like blinking
            this.health = 15 + ((this.game.currentRPM + (this.game.enemiesKilled * 0.1)) * 0.5);
            this.baseSpeed = 1.2; // 50% faster than jelly bean
        } else if (type === 'marshmallow_large') {
            this.width = 76.5;
            this.height = 76.5;
            this.color = '#F8F8FF';
            this.health = 50 + ((this.game.currentRPM + (this.game.enemiesKilled * 0.1)) * 1.5);
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
        } else { // Default fallback
            this.width = 30;
            this.height = 40;
            this.health = (40 + this.game.currentRPM + (this.game.enemiesKilled * 0.1));
            this.baseSpeed = 0.8;
        }
        this.speed = (this.baseSpeed + (this.game.currentRPM * 0.08)) * 0.5;
        this.maxHealth = this.health;
        this.kbVy = 0; // Knockback velocity Y
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
    }
    takeDamage(amount, isCritical = false) {
        const roundedAmount = amount;
        this.health -= roundedAmount;
        this.hitTimer = 10; // Start the hit blink animation
        if (isCritical) {
            this.criticalHitFlashTimer = 15;
            this.game.floatingTexts.push(new FloatingText(this.game, this.x + this.width / 2, this.y, `-${roundedAmount}`, 'yellow', 4)); // Yellow, +4px size
        } else {
            this.game.floatingTexts.push(new FloatingText(this.game, this.x + this.width / 2, this.y, `-${roundedAmount}`, 'red'));
        }
        this.damageText = `${this.health.toFixed(0)}/${this.maxHealth.toFixed(0)}`;
        this.damageTextTimer = 30; // 0.5 seconds

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
        if (this.hitTimer > 0) {
            this.hitTimer -= tsf;
        }
        if (this.damageTextTimer > 0) {
            this.damageTextTimer -= tsf;
        }
        if (this.criticalHitFlashTimer > 0) {
            this.criticalHitFlashTimer -= tsf;
        }
if (this.shakeDuration > 0) this.shakeDuration -= tsf;
        if (this.healScale > 1) this.healScale -= 0.05 * tsf;
        else this.healScale = 1;

        const stretch_factor = 0.2;
        this.stretch = 1 + Math.abs(this.kbVy) * stretch_factor;
        this.squash = 1 - Math.abs(this.kbVy) * stretch_factor * 0.5;

        this.animationTimer += 0.1 * tsf;
        if (this.type === 'missile') {
            this.scale = 1 + Math.sin(this.animationTimer) * 0.04;
            this.angle = Math.sin(this.animationTimer * 0.5) * (Math.PI / 18);
        } else if (this.type === 'gummy_worm') {
            this.x += Math.sin(this.y / 30) * 2.5 * tsf;
        } else if (this.type === 'marshmallow_large') {
            this.angle += this.rotationSpeed * tsf;
        }

        // Smooth knockback decay
        this.kbVy *= 0.9;
        this.y += (this.speed + this.kbVy) * tsf;

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
            if (this.damageSpots[i].opacity <= 0) {
                this.damageSpots.splice(i, 1);
            }
        }
    }
    draw(ctx) {
        // --- DYNAMIC SHADOW ---
        const ground = this.game.platforms.find(p => p.type === 'ground');
        if (ground) {
            const distance = ground.y - (this.y + this.height);
            const maxShadowDistance = 800;

            if (distance < maxShadowDistance && distance > -this.height) { // Also check if missile is not below ground
                const shadowFactor = 1 - (distance / maxShadowDistance);
                const shadowWidth = (this.width * 0.5) * shadowFactor;
                const shadowHeight = shadowWidth * 0.25; // Make it an ellipse
                const shadowOpacity = 0.3 * shadowFactor;

                // Use a generic shadow color
                ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
                ctx.beginPath();
                ctx.ellipse(this.x + this.width / 2, ground.y + 2, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.save();
        ctx.shadowBlur = 15;
        let color = (this.type === 'piggy') ? '#ff69b4' : this.color;
        if(this.hitTimer > 0) {
            color = '#FFFFFF';
        }
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        // --- BOTTOM SHADOW ---
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
                    ctx.beginPath();
                    ctx.arc(shimmerX, shimmerY, 2.5, 0, Math.PI * 2);
                    ctx.fill();
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
            ctx.strokeStyle = borderGrad;
            ctx.lineWidth = this.width + 4;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const yPos = this.y + i * segmentHeight;
                const xOffset = Math.sin(i * wiggleFrequency + this.animationTimer) * wiggleAmplitude;
                const xPos = this.x + this.width / 2 + xOffset;
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
                grad.addColorStop(0, 'white');
                grad.addColorStop(1, 'white');
            } else {
                grad.addColorStop(0, this.color1);
                grad.addColorStop(1, this.color2);
            }
            ctx.strokeStyle = grad;
            ctx.lineWidth = this.width;
            ctx.lineCap = 'round';

            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const yPos = this.y + i * segmentHeight;
                const xOffset = Math.sin(i * wiggleFrequency + this.animationTimer) * wiggleAmplitude;
                const xPos = this.x + this.width / 2 + xOffset;
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
            ctx.beginPath();
            ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 10);
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.angle);
            ctx.scale(this.squash, this.stretch);
            
            if (this.hitTimer > 0) {
                ctx.fillStyle = 'white';
            } else {
                ctx.fillStyle = this.color;
            }
            
            ctx.beginPath();
            ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 10);
            ctx.fill();

            // Glare
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.ellipse(
                -this.width * 0.2,
                -this.height * 0.2,
                this.width * 0.2,
                this.height * 0.3,
                -0.8, 0, Math.PI * 2
            );
            ctx.fill();

            ctx.restore();
        }
        else {
            // Jelly Bean Draw
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            ctx.save();
            ctx.translate(cx, cy + shadowOffset);
            ctx.rotate(this.angle);
            ctx.scale(this.scale * this.squash * 1.15, this.scale * this.stretch * 1.15);
            ctx.fillStyle = shadowColor;
            const beanWidth = 45;
            const beanHeight = 30;
            ctx.beginPath();
            ctx.moveTo(0, -beanHeight / 2);
            ctx.bezierCurveTo(beanWidth / 2, -beanHeight / 1.5, beanWidth / 2, beanHeight / 1.5, 0, beanHeight / 2);
            ctx.bezierCurveTo(-beanWidth / 3, beanHeight / 1.5, -beanWidth / 3, -beanHeight / 1.5, 0, -beanHeight / 2);
            ctx.closePath();
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
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.stroke();

            // Shiny glare
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.ellipse(7.5, -6, 4.5, 9, -0.3, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        }

        ctx.shadowBlur = 0;
       if (this.health < this.maxHealth) {
            const pct = Math.max(0, this.health / this.maxHealth);
            
            // --- SHAKE LOGIC ---
            let offsetX = 0;
            let offsetY = 0;
            if (this.shakeDuration > 0) {
                offsetX = (Math.random() - 0.5) * this.shakeMagnitude;
                offsetY = (Math.random() - 0.5) * this.shakeMagnitude;
            }

            const barWidth = this.width;
            const barHeight = 10;
            const barX = this.x + offsetX;
            const barY = this.y - 15 + offsetY;
            const barRadius = 3;

            // --- HEAL PULSE BORDER ---
            if (this.healScale > 1) {
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.strokeRect(barX - (this.healScale * 2), barY - (this.healScale * 2), barWidth + (this.healScale * 4), barHeight + (this.healScale * 4));
            }

            // --- MAGENTA BACKGROUND & BORDER ---
            ctx.fillStyle = '#4a004a'; // Dark Magenta background
            ctx.strokeStyle = '#ff00ff'; // Bright Magenta border
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth, barHeight, barRadius);
            ctx.fill();
            ctx.stroke();

            // --- DYNAMIC FILL COLOR ---
            let healthColor = '#2ecc71'; // Green
            if (pct <= 0.5) healthColor = '#f1c40f'; // Yellow
            if (pct <= 0.2) healthColor = '#e74c3c'; // Red
            
            // FLASH EFFECT (White fill if hit)
            ctx.fillStyle = (this.hitTimer > 0) ? '#FFFFFF' : healthColor;

            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth * pct, barHeight, barRadius);
            ctx.fill();

            // DAMAGE TEXT
            if (this.damageTextTimer > 0) {
                const alpha = Math.sin((this.damageTextTimer / 30) * Math.PI);
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.fillStyle = 'white';
                ctx.font = 'bold 28px "Lucky Guy"';
                ctx.textAlign = 'center';
                ctx.fillText(Math.ceil(this.health), barX + barWidth / 2, barY - 5);
                ctx.restore();
            }
        }
        ctx.restore(); // Restores from the main missile draw save

        for (const spot of this.damageSpots) {
            spot.draw(ctx);
        }
    }

    kill(index) {
        // Splitting logic for marshmallows
        if (this.type === 'marshmallow_large') {
            this.game.missiles.splice(index, 1);
            for (let i = 0; i < 2; i++) {
                // Spawn two medium marshmallows with a bit of horizontal offset
                const newMissile = new Missile(this.game, this.x + (i * 30) - 15, 'marshmallow_medium', this.y);
                this.game.missiles.push(newMissile);
            }
            for (let k = 0; k < 20; k++) this.game.particles.push(new Particle(this.x, this.y, this.color, 'smoke'));
            return; // Skip loot drop
        }

        if (this.type === 'marshmallow_medium') {
            this.game.missiles.splice(index, 1);
            for (let i = 0; i < 2; i++) {
                // Spawn two small marshmallows
                const newMissile = new Missile(this.game, this.x + (i * 20) - 10, 'marshmallow_small', this.y);
                this.game.missiles.push(newMissile);
            }
            for (let k = 0; k < 10; k++) this.game.particles.push(new Particle(this.x, this.y, this.color, 'smoke'));
            return; // Skip loot drop
        }

        // Default kill logic for all other enemies (including small marshmallow)
        this.game.missiles.splice(index, 1);
        const pStats = this.game.stats.piggyStats;
        const count = (this.type === 'piggy') ? pStats.mult : 1;
        if (this.type === 'piggy') {
            const bonus = Math.floor(this.game.money * pStats.bonus);
            this.game.money += bonus;
            this.game.totalMoneyEarned += bonus;
            document.getElementById('notification').innerText = `PIGGY SMASHED! +$${bonus}`;
            document.getElementById('notification').style.opacity = 1;
            setTimeout(() => document.getElementById('notification').style.opacity = 0, 2000);
        }
        for (let c = 0; c < count; c++) {
            this.game.enemiesKilled++;
            this.game.drops.push(new Drop(this.game, this.x, this.y, 'coin'));
            if (Math.random() * 100 < this.game.stats.luckHeart) this.game.drops.push(new Drop(this.game, this.x, this.y, 'heart'));
            if (Math.random() * 100 < this.game.stats.luckCoin) this.game.drops.push(new Drop(this.game, this.x, this.y, 'lucky_coin'));

            const iceCreamChanceLevel = this.game.emporiumUpgrades.ice_cream_chance.level;
            const chances = this.game.emporiumUpgrades.ice_cream_chance.values[iceCreamChanceLevel];
            const dropChance = (this.type === 'piggy') ? chances[1] : chances[0];
            if (Math.random() * 100 < dropChance) {
                this.game.drops.push(new Drop(this.game, this.x, this.y, 'ice_cream_scoop'));
            }
        }
        for (let k = 0; k < 20; k++) this.game.particles.push(new Particle(this.x, this.y, (this.type === 'piggy' ? '#ff69b4' : this.color), 'smoke'));
    }
}