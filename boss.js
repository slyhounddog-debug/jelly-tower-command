import { darkenColor } from './utils.js';
import Missile from './missile.js';
import Particle from './particle.js';
import Drop from './drop.js';
import FloatingText from './floatingText.js';
import DamageSpot from './damageSpot.js';

export class GummyBear {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 80;
        this.speed = (0.4 + (this.game.currentRPM * 0.01)) * 0.5 * 3; // Slightly faster than a jelly bean
        this.health = (40 + this.game.currentRPM + (this.game.enemiesKilled * 0.06));
        this.maxHealth = this.health;
        this.image = this.game.gummybearImages[Math.floor(Math.random() * this.game.gummybearImages.length)];
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
        this.groundProximity = false;
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
        
        const numSpots = Math.floor(roundedAmount / 5);
        for (let i = 0; i < numSpots; i++) {
            const spotX = (this.width / 2) + (Math.random() - 0.5) * (this.width * 0.5);
            const spotY = (this.height / 2) + (Math.random() - 0.5) * (this.height * 0.5);
            const spotRadius = Math.random() * 3 + 2;
            const spotColor = darkenColor('#FF0000', 20);
            this.damageSpots.push(new DamageSpot(spotX, spotY, spotRadius, spotColor, this));
        }

        if (this.health <= 0) {
            this.kill();
        }
    }

    kill() {
        this.dead = true;
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

        const ground = this.game.platforms.find(p => p.type === 'ground');
        const distToGround = ground ? ground.y - (this.y + this.height) : 1000;
        this.groundProximity = distToGround < this.game.groundProximityThreshold;

        this.animationTimer += 0.05 * tsf;
        this.angle = Math.sin(this.animationTimer) * 0.1;

        if (this.y > this.game.height) {
            this.dead = true;
        }

        for (let i = this.damageSpots.length - 1; i >= 0; i--) {
            this.damageSpots[i].update(tsf);
            if (this.damageSpots[i].opacity <= 0) this.damageSpots.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.groundProximity) {
            const alpha = Math.abs(Math.sin(this.game.gameTime * 0.1));
            ctx.globalAlpha = 1 - alpha * 0.5;
            if (alpha > 0.5) {
                ctx.fillStyle = `rgba(255, 105, 180, 0.2)`;
                ctx.fillRect(this.x, this.y + 100, this.width, this.height);
            }
        }
        ctx.translate(this.x, this.y + 100);
        ctx.rotate(this.angle);
        if (this.image && this.image.complete) {
            ctx.drawImage(this.image, 0, 0, this.width, this.height);
        }

        for (const spot of this.damageSpots) {
            spot.draw(ctx);
        }

        ctx.restore();
    }
}


export default class GummyCluster {
    constructor(game) {
        this.game = game;
        this.x = (this.game.width / 2) + (Math.random() * 200 - 100);
        this.y = +20;
        this.width = 450;
        this.height = 450;
        this.speed = (0.4 + (this.game.currentRPM * 0.01)) * 0.5 / 5;
        this.health = 150 + (this.game.currentRPM * 100);
        this.maxHealth = this.health;
        this.type = 'gummy_cluster_boss';
        this.hitTimer = 0;
        this.healthThresholds = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, .05, .02, .01];
        this.groundProximity = false;
        this.damageSpots = [];
        this.criticalHitFlashTimer = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
        this.fireStacks = [];
        this.fireFlashTimer = 0;
        this.slowEffects = [];
        this.totalSlow = 0;
    }

    applyFire(damage, stacks) {
        if (stacks <= 0) return;
        this.fireStacks.push({
            damage: damage * 0.1 * stacks,
            duration: 300,
            timer: 300,
        });
    }

    applySlow(duration, amount, source = 'generic') {
        if (!this.slowEffects.some(e => e.source === source)) {
            this.slowEffects.push({ timer: duration, amount, source });
        }
    }

    takeDamage(amount, isCritical = false) {
        this.health -= amount;
        this.hitTimer = 10;
        this.game.audioManager.playSound('bossHit');

        this.shakeDuration = 10;
        this.shakeMagnitude = 4;

        if (isCritical) {
            this.criticalHitFlashTimer = 15;
            this.game.floatingTexts.push(new FloatingText(this.game, this.x + this.width / 2, this.y, `-${amount.toFixed(0)}`, 'yellow', 4));
        } else {
            this.game.floatingTexts.push(new FloatingText(this.game, this.x + this.width / 2, this.y, `-${amount.toFixed(0)}`, 'red'));
        }

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
                this.width *= 0.995;
                this.height *= 0.995;
                break;
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
        
        
        this.game.killsSinceLastBoss = 0;
        this.game.killsForNextBoss = Math.floor(50 + this.game.threatManager.threatRPM * 2.5);
        this.game.bossesKilled++;
        this.game.boss = null;
    }

    spawnGummyBear() {
        const spawnX = this.x + Math.random() * this.width;
        const spawnY = this.y + Math.random() * this.height;
        const gummyBear = new GummyBear(this.game, spawnX, spawnY);
        gummyBear.vx = (Math.random() - 0.5) * 12;
        gummyBear.vy = -Math.random() * 10;
        this.game.missiles.push(gummyBear);
    }

    update(tsf) {
        if (this.fireFlashTimer > 0) this.fireFlashTimer -= tsf;
        for (let i = this.fireStacks.length - 1; i >= 0; i--) {
            const stack = this.fireStacks[i];
            stack.timer -= tsf;
            if (stack.timer <= 0) {
                this.fireStacks.splice(i, 1);
            } else {
                if (Math.floor(stack.timer) % 60 === 0) {
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
        this.totalSlow = Math.min(0.9, totalSlow);
        const currentSpeed = this.speed * (1 - this.totalSlow);

        this.y += currentSpeed * tsf;

        if (this.hitTimer > 0) {
            this.hitTimer -= tsf;
        }

        if (this.shakeDuration > 0) this.shakeDuration -= tsf;

        const ground = this.game.platforms.find(p => p.type === 'ground');
        const distToGround = ground ? ground.y - (this.y + this.height) : 1000;
        this.groundProximity = distToGround < this.game.groundProximityThreshold;

        if (this.y > this.game.height) {
            this.game.castleHealth -= 50;
            this.game.castleHealthBar.triggerHit();
            this.game.boss = null;
        }

        for (let i = this.damageSpots.length - 1; i >= 0; i--) {
            this.damageSpots[i].update(tsf);
            if (this.damageSpots[i].opacity <= 0) this.damageSpots.splice(i, 1);
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.groundProximity) {
            const alpha = Math.abs(Math.sin(this.game.gameTime * 0.1));
            ctx.globalAlpha = 1 - alpha * 0.5;
            if (alpha > 0.5) {
                ctx.fillStyle = `rgba(255, 105, 180, 0.2)`;
                ctx.fillRect(this.x, this.y + 100, this.width, this.height);
            }
        }
        ctx.translate(this.x, this.y + 100);

        if (this.hitTimer > 0 && Math.floor(this.hitTimer / 2) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        let image = this.game.gummyclusterImages[0];
        const healthPercentage = this.health / this.maxHealth;
        if (healthPercentage < 0.7) {
            image = this.game.gummyclusterImages[1];
        }
        if (healthPercentage < 0.3) {
            image = this.game.gummyclusterImages[2];
        }

        if (image && image.complete) {
            ctx.drawImage(image, 0, 0, this.width, this.height);
        }

        for (const spot of this.damageSpots) {
            spot.draw(ctx);
        }

        ctx.restore();
    }
}