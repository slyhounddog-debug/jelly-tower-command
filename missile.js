import Particle from './particle.js';
import { darkenColor } from './utils.js?v=25';
import DamageSpot from './damageSpot.js';

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
    }
    takeDamage(amount) {
        this.health -= amount;
        this.hitTimer = 10; // Start the hit blink animation
        const numSpots = Math.floor(amount / 5);
        for (let i = 0; i < numSpots; i++) {
            const spotX = (this.width / 2) + (Math.random() - 0.5) * (this.width * 0.5);
            const spotY = (this.height / 2) + (Math.random() - 0.5) * (this.height * 0.5);
            const spotRadius = Math.random() * 3 + 2;
            const color = (this.type === 'piggy') ? '#ff69b4' : this.color;
            const spotColor = darkenColor(color, 20);
            this.damageSpots.push(new DamageSpot(spotX, spotY, spotRadius, spotColor, this));
        }
        return this.health <= 0;
    }
    update(tsf) {
        if (this.hitTimer > 0) {
            this.hitTimer -= tsf;
        }

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

        if (this.type === 'piggy') {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(1.1 * this.squash, 1.1 * this.stretch); // Scale by 10%

            // Re-create the original drawing, but centered around (0,0)
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

            ctx.restore();
        } else if (this.type === 'gummy_worm') {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.scale(this.squash, this.stretch);
            ctx.translate(-(this.x + this.width / 2), -(this.y + this.height / 2));

            const segments = 10;
            const segmentHeight = this.height / segments;
            const wiggleAmplitude = 4;
            const wiggleFrequency = 0.2;
            
            // --- Draw Border ---
            const borderSize = 4;
            const borderColor1 = darkenColor(this.color1, 20);
            const borderColor2 = darkenColor(this.color2, 20);
            const borderGrad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.height);
            borderGrad.addColorStop(0, borderColor1);
            borderGrad.addColorStop(1, borderColor2);
            ctx.strokeStyle = borderGrad;
            ctx.lineWidth = this.width + borderSize;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const yPos = this.y + i * segmentHeight;
                const xOffset = Math.sin(i * wiggleFrequency + this.animationTimer) * wiggleAmplitude;
                const xPos = this.x + this.width / 2 + xOffset;
                if (i === 0) {
                    ctx.moveTo(xPos, yPos);
                } else {
                    ctx.lineTo(xPos, yPos);
                }
            }
            ctx.stroke();

            // --- Draw Fill ---
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
                if (i === 0) {
                    ctx.moveTo(xPos, yPos);
                } else {
                    ctx.lineTo(xPos, yPos);
                }
            }
            ctx.stroke();


            ctx.restore();
        } else if (this.type.includes('marshmallow')) {
            ctx.save();
            
            // Shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetY = 5;

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

            // Reset shadow for glare
            ctx.shadowColor = 'transparent';

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
            ctx.translate(cx, cy);
            ctx.rotate(this.angle); // Use dynamic angle
            ctx.scale(this.scale * this.squash, this.scale * this.stretch); // Apply dynamic scale

            const beanWidth = 45; // 1.5x original
            const beanHeight = 30; // 1.5x original

            // Main body
            ctx.beginPath();
            ctx.moveTo(0, -beanHeight / 2);
            ctx.bezierCurveTo(beanWidth / 2, -beanHeight / 1.5, beanWidth / 2, beanHeight / 1.5, 0, beanHeight / 2);
            ctx.bezierCurveTo(-beanWidth / 3, beanHeight / 1.5, -beanWidth / 3, -beanHeight / 1.5, 0, -beanHeight / 2);
            ctx.closePath();

            ctx.fill();
            ctx.filter = 'brightness(85%)';
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3; // 1.5x original
            ctx.stroke();
            ctx.filter = 'none';

            // Shiny glare
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.ellipse(7.5, -6, 4.5, 9, -0.3, 0, Math.PI * 2); // 1.5x original
            ctx.fill();

            ctx.restore();
        }

        ctx.shadowBlur = 0;
        if (this.health < this.maxHealth) {
            const pct = Math.max(0, this.health / this.maxHealth);
            const barY = this.y - 6;
            const barRadius = 2;

            // Background bar
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.roundRect(this.x, barY, this.width, 4, barRadius);
            ctx.fill();

            // Foreground (health) bar
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.roundRect(this.x, barY, this.width * pct, 4, barRadius);
            ctx.fill();
        }
        ctx.restore();

        for (const spot of this.damageSpots) {
            spot.draw(ctx);
        }
    }
}
