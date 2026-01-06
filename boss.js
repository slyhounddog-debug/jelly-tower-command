import { darkenColor } from './utils.js';
import Missile from './missile.js';
import Particle from './particle.js';
import Drop from './drop.js';
import FloatingText from './floatingText.js';

export class GummyBear {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 30;
        this.height = 40;
        this.speed = (0.4 + (this.game.currentRPM * 0.01)) * 0.5 * 2; // Slightly faster than a jelly bean
        this.health = (40 + this.game.currentRPM + (this.game.enemiesKilled * 0.06));
        this.maxHealth = this.health;
        this.color = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
        this.vy = -5;
        this.vx = (Math.random() - 0.5) * 6;
        this.gravity = 0.3;
        this.type = 'gummy_bear';
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
        this.totalSlow = 0;
        this.slowParticleTimer = 0;

        // Gummy bear shape
        this.circles = [
            { x: 0, y: -10, r: 10 }, // head
            { x: -12, y: -18, r: 6 }, // left ear
            { x: 12, y: -18, r: 6 }, // right ear
            { x: 0, y: 5, r: 12 }, // body
            { x: -10, y: 15, r: 7 }, // left leg
            { x: 10, y: 15, r: 7 }, // right leg
            { x: 0, y: -5, r: 5 } // snout
        ];
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

        return this.health <= 0.5;
    }

    kill(index) {
        this.game.missiles.splice(index, 1);
        this.game.enemiesKilled++;
        this.game.drops.push(new Drop(this.game, this.x, this.y, 'coin'));
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

        let totalSlow = 0;
        for (let i = this.slowEffects.length - 1; i >= 0; i--) {
            const effect = this.slowEffects[i];
            effect.timer -= tsf;
            if (effect.timer <= 0) {
                this.slowEffects.splice(i, 1);
            } else {
                totalSlow += effect.amount;
            }
        }
        
        if (this.auraSlowTimer > 0) {
            totalSlow += 0.5;
        }
        
        this.totalSlow = Math.min(0.9, totalSlow);
        
        const currentSpeed = this.speed * (1 - this.totalSlow);

        if (this.hitTimer > 0) this.hitTimer -= tsf;
        if (this.damageTextTimer > 0) this.damageTextTimer -= tsf;
        if (this.criticalHitFlashTimer > 0) this.criticalHitFlashTimer -= tsf;
        if (this.shakeDuration > 0) this.shakeDuration -= tsf;
        if (this.healScale > 1) this.healScale -= 0.05 * tsf;
        else this.healScale = 1;

        this.kbVy *= 0.9;
        this.y += (currentSpeed + this.kbVy) * tsf;

        if (this.y > this.game.height) {
            // Remove if off screen
            this.game.missiles.splice(this.game.missiles.indexOf(this), 1);
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Draw border
        ctx.strokeStyle = darkenColor(this.color, 20);
        ctx.lineWidth = 5;
        ctx.beginPath();
        this.circles.forEach(circle => {
            ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
        });
        ctx.stroke();


        // Draw gummy bear
        ctx.fillStyle = this.color;
        this.circles.forEach(circle => {
            ctx.beginPath();
            ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Shiny effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.beginPath();
        ctx.arc(-5, -15, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}


export default class GummyCluster {
    constructor(game) {
        this.game = game;
        this.x = Math.random() * (this.game.width - 100) + 50;
        this.y = -150;
        this.width = 200;
        this.height = 200;
        this.speed = (0.4 + (this.game.currentRPM * 0.01)) * 0.5 / 5; // 1/5th speed of jelly bean
        this.health = 150 + (this.game.currentRPM * 100);
        this.maxHealth = this.health;
        this.type = 'gummy_cluster_boss';
        this.hitTimer = 0;
        this.gummyBears = [];
        this.healthThresholds = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, .05, .02, .01];
        this.createGummyBears();
    }

    createGummyBears() {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * (this.width / 3);
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const color = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.gummyBears.push({ x, y, r: 20, color });
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        this.hitTimer = 10;
        this.game.audioManager.playSound('bossHit');

        const healthPercentage = this.health / this.maxHealth;
        
        const bossHealthContainer = document.getElementById('boss-health-container');
        if (bossHealthContainer) {
            bossHealthContainer.style.animation = 'shake 0.2s';
            setTimeout(() => {
                bossHealthContainer.style.animation = '';
            }, 200);
        }

        for (let i = 0; i < this.healthThresholds.length; i++) {
            if (healthPercentage <= this.healthThresholds[i]) {
                this.healthThresholds.splice(i, 1);
                this.spawnGummyBear();
                this.width *= 0.95;
                this.height *= 0.95;
                break; // only spawn one per frame
            }
        }

        if (this.health <= 0) {
            this.kill();
        }
    }

    kill() {
        this.game.audioManager.playSound('bossKilled');
        this.game.screenShake.trigger(30, 60);
        this.game.currentRPM += 10;

        const lootCount = 3 + (this.game.bossesKilled * 2);
        for (let i = 0; i < lootCount; i++) {
            this.game.drops.push(new Drop(this.game, this.x, this.y, 'coin'));
        }

        const componentCount = 1 + this.game.bossesKilled;
        for (let i = 0; i < componentCount; i++) {
            this.game.drops.push(new Drop(this.game, this.x, this.y, 'component'));
        }
        
        this.game.bossesKilled++;
        this.game.boss = null;
    }

    spawnGummyBear() {
        if(this.gummyBears.length > 0) {
            this.gummyBears.pop();
        }
        const gummyBear = new GummyBear(this.game, this.x, this.y);
        this.game.missiles.push(gummyBear);
    }

    update(tsf) {
        this.y += this.speed * tsf;

        if (this.hitTimer > 0) {
            this.hitTimer -= tsf;
        }

        if (this.y > this.game.height) {
            this.game.castleHealth -= 50;
            this.game.castleHealthBar.triggerHit();
            this.game.boss = null;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Blinking effect
        if (this.hitTimer > 0 && Math.floor(this.hitTimer / 2) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw gummy bears
        this.gummyBears.forEach(bear => {
            ctx.fillStyle = bear.color;
            ctx.beginPath();
            ctx.arc(bear.x, bear.y, bear.r, 0, Math.PI * 2);
            ctx.fill();

            // Shiny effect
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.beginPath();
            ctx.arc(bear.x - 5, bear.y - 5, 5, 0, Math.PI * 2);
            ctx.fill();
        });

        // Health bar
        if (this.health < this.maxHealth) {
            const pct = Math.max(0, this.health / this.maxHealth);
            const barWidth = this.width * 1.2;
            const barHeight = 18;
            const barX = -barWidth / 2;
            const barY = -this.height / 2 - 30;

            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth, barHeight, 8);
            ctx.fill();

            let healthFillColor = '#2ecc71'; // Green
            if (pct < 0.25) healthFillColor = '#ff3131'; // Red
            else if (pct < 0.60) healthFillColor = '#f1c40f'; // Yellow
            
            ctx.fillStyle = healthFillColor;
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth * pct, barHeight, 8);
            ctx.fill();
        }

        ctx.restore();
    }
}