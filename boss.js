import { darkenColor } from './utils.js';
import Missile from './missile.js';
import Particle from './particle.js';
import Drop from './drop.js';
import FloatingText from './floatingText.js';
import EnemyDebris from './EnemyDebris.js';

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
        this.color = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
        this.vy = -5;
        this.vx = (Math.random() - 0.5) * 6;
        this.gravity = 0.3;
        this.type = 'gummy_bear';
        this.kbVy = 0;
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
        this.isJellyTagged = false;
        this.id = this.game.getNewId();
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
        const player = this.game.player;
        if (player.upgrades['Sweet Aura'] > 0) {
            const dist = Math.hypot(this.x - player.x, this.y - player.y);
            if (dist < player.lickRange) {
                amount *= (1 + player.upgrades['Sweet Aura'] * 0.1);
            }
        }

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
        


        if (this.health <= 0) {
            this.kill();
        }
    }

    kill(killedBy = 'unknown') {
        this.dead = true;
        this.game.enemiesKilled++;
        
        let lootMultiplier = 1;
        let luckMultiplier = 1;
        if (this.isJellyTagged && killedBy !== 'tongue') { // Any kill not by tongue is considered a tower kill for Jelly Tag purposes
            lootMultiplier = 2;
        }

        for (let c = 0; c < lootMultiplier; c++) {
            this.game.drops.push(new Drop(this.game, this.x, this.y, 'coin'));
            this.game.levelingManager.addXp(this.x, this.y, 10); // Gummy bears give a base of 10 xp
        }
        
        for (let l = 0; l < luckMultiplier; l++) {
            if (Math.random() * 100 < this.game.stats.luckHeart) this.game.drops.push(new Drop(this.game, this.x, this.y, 'heart'));
            if (Math.random() * 100 < this.game.stats.luckCoin) this.game.drops.push(new Drop(this.game, this.x, this.y, 'lucky_coin'));

            const iceCreamChanceLevel = this.game.emporiumUpgrades.ice_cream_chance.level;
            const chances = this.game.emporiumUpgrades.ice_cream_chance.values[iceCreamChanceLevel];
            const dropChance = chances[0];
            if (Math.random() * 100 < dropChance) {
                this.game.drops.push(new Drop(this.game, this.x, this.y, 'ice_cream_scoop'));
            }
            if (this.game.player.upgrades['Twin Scoop'] > 0) {
                if (Math.random() < 0.33) {
                    this.game.drops.push(new Drop(this.game, this.x, this.y, 'ice_cream_scoop'));
                }
            }
        }
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
                    this.takeDamage(stack.damage, false);
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

        if (this.y > this.game.PLAYABLE_AREA_HEIGHT) {
            this.dead = true;
        }
    }

    draw(ctx) {
        ctx.save();
        if (this.groundProximity) {
            const alpha = Math.abs(Math.sin(this.game.gameTime * 0.1));
            ctx.globalAlpha = 1 - alpha * 0.5;
            if (alpha > 0.5) {
                ctx.fillStyle = `rgba(255, 105, 180, 0.2)`;
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
        }
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        if (this.image && this.image.complete) {
            ctx.drawImage(this.image, 0, 0, this.width, this.height);
        }

        // Draw Jelly Tag Crown
        if (this.isJellyTagged) {
            const crownImg = this.game.tagCrownImage;
            // --- CROWN SIZE AND POSITION ADJUSTMENT ---
            // Adjust this value to change the size of the crown
            const crownSize = this.width * 0.35;
            // Adjust this value to change the vertical position of the crown
            const yOffset = 50;

            const bob = Math.sin(this.game.gameTime * 0.2) * 5; // Bobbing effect
            const crownX = (this.width - crownSize) / 2;
            const crownY = -yOffset + bob;

            ctx.drawImage(crownImg, crownX, crownY, crownSize, crownSize);
        }

        ctx.restore();

        if (this.health < this.maxHealth) {
            const pct = Math.max(0, this.health / this.maxHealth);
            const isLow = pct < 0.25;
            
            // Calculate size based on enemy type
            let sizeMult = 1.0;
            
            // Pulsing effect for low health (under 25%)
            const pulse = isLow ? 1 + Math.sin(this.game.gameTime * 0.2) * 0.1 : 1;
            const finalMult = sizeMult * pulse;
            
            let offsetX = (this.shakeDuration > 0) ? (Math.random() - 0.5) * this.shakeMagnitude : 0;
            let offsetY = (this.shakeDuration > 0) ? (Math.random() - 0.5) * this.shakeMagnitude : 0;
            
            const barWidth = (this.width * 1.2) * finalMult;
            const barHeight = 18 * finalMult; 
            const barX = (this.x + this.width/2 - barWidth/2) + offsetX;
            const barY = this.y - 22 + offsetY;

            const frameColor = darkenColor(this.color, 10);

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
                ctx.font = 'bold 44px "VT323"';
                ctx.textAlign = 'center';
                
                const tx = barX + barWidth / 2;
                const ty = barY + 5;
                const val = Math.ceil(this.health);

                // Add the gray border
                ctx.strokeStyle = '#213625ff'; // Dark gray border
                ctx.lineWidth = 3;           // Thickness of the border
                ctx.strokeText(val, tx, ty);

                // Fill the white text
                ctx.fillStyle = 'white';
                ctx.fillText(val, tx, ty);
                
                ctx.restore();
            }
        }
    }
}


export default class GummyCluster {
    constructor(game) {
        this.game = game;
        this.x = (this.game.width / 2) + (Math.random() * 200 - 100);
        this.y = +20;
        this.width = 450;
        this.height = 450;
        this.hitboxWidth = 350;
        this.hitboxHeight = 350;
        this.hitboxOffsetX = (this.width - this.hitboxWidth) / 2;
        this.hitboxOffsetY = (this.height - this.hitboxHeight) / 2;
        this.speed = (0.4 + (this.game.currentRPM * 0.01)) * 0.5 / 5;
        this.health = 150 + (this.game.currentRPM * 90);
        this.maxHealth = this.health;
        this.type = 'gummy_cluster_boss';
        this.hitTimer = 0;
        this.healthThresholds = [0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, .05, .02, .01];
        this.groundProximity = false;
        this.criticalHitFlashTimer = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
        this.fireStacks = [];
        this.fireFlashTimer = 0;
        this.slowEffects = [];
        this.totalSlow = 0;
        this.isJellyTagged = false;
        this.id = this.game.getNewId();
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
        // Gummy Cluster is immune to slows
    }

    takeDamage(amount, isCritical = false) {
        const player = this.game.player;
        if (player.upgrades['Sweet Aura'] > 0) {
            const dist = Math.hypot(this.x - player.x, this.y - player.y);
            if (dist < player.lickRange) {
                amount *= (1 + player.upgrades['Sweet Aura'] * 0.1);
            }
        }

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
                this.width *= 0.99999;
                this.height *= 0.99999;
                break;
            }
        }

        if (this.health <= 0) {
            this.kill();
        }
    }

    kill(killedBy = 'unknown') {
        this.game.audioManager.playSound('bossKilled');
        this.game.screenShake.trigger(30, 60);
        this.game.currentRPM += 10;

        // --- Debris spawning for Boss ---
        let numDebris = 4 + Math.floor(Math.random() * 3); // 4-6 pieces
        const cutSize = 3; // 3x3 cuts for boss

        for (let i = 0; i < numDebris; i++) {
            this.game.debris.push(new EnemyDebris(this.game, this, this.width, this.height, cutSize));
        }
        // --- End Debris spawning ---

        let lootMultiplier = 1;
        let luckMultiplier = 1;
        if (this.isJellyTagged && killedBy !== 'tongue') {
            lootMultiplier = 2;
        }

        const lootCount = (3 + (this.game.bossesKilled * 2)) * lootMultiplier;
        for (let i = 0; i < lootCount; i++) {
            this.game.drops.push(new Drop(this.game, this.x, this.y, 'coin'));
        }

        const componentCount = (1 + this.game.bossesKilled) * lootMultiplier;
        for (let i = 0; i < componentCount; i++) {
            this.game.drops.push(new Drop(this.game, this.x, this.y, 'component'));
        }
        
        // Apply XP
        const xpGained = (50 + (this.maxHealth / 10)) * lootMultiplier;
        this.game.levelingManager.addXp(this.x, this.y, xpGained);

        this.game.killsSinceLastBoss = 0;
        this.game.killsForNextBoss = Math.floor(50 + this.game.threatManager.threatRPM * 2.5);
        this.game.bossesKilled++;
        this.game.boss = null;

        for (let l = 0; l < luckMultiplier; l++) {
            if (Math.random() * 100 < this.game.stats.luckHeart) this.game.drops.push(new Drop(this.game, this.x, this.y, 'heart'));
            if (Math.random() * 100 < this.game.stats.luckCoin) this.game.drops.push(new Drop(this.game, this.x, this.y, 'lucky_coin'));

            const iceCreamChanceLevel = this.game.emporiumUpgrades.ice_cream_chance.level;
            const chances = this.game.emporiumUpgrades.ice_cream_chance.values[iceCreamChanceLevel];
            const dropChance = chances[0];
            if (Math.random() * 100 < dropChance) {
                this.game.drops.push(new Drop(this.game, this.x, this.y, 'ice_cream_scoop'));
            }
            if (this.game.player.upgrades['Twin Scoop'] > 0) {
                if (Math.random() < 0.33) {
                    this.game.drops.push(new Drop(this.game, this.x, this.y, 'ice_cream_scoop'));
                }
            }
        }
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
                    this.takeDamage(stack.damage, false);
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

        if (this.y > this.game.PLAYABLE_AREA_HEIGHT) {
            this.game.castleHealth -= 50;
            this.game.castleHealthBar.triggerHit();
            this.game.boss = null;
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
        ctx.translate(this.x, this.y);

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

        // Draw Jelly Tag Crown
        if (this.isJellyTagged) {
            const crownImg = this.game.tagCrownImage;
            // --- CROWN SIZE AND POSITION ADJUSTMENT ---
            // Adjust this value to change the size of the crown
            const crownSize = this.width * 0.8; 
            // Adjust this value to change the vertical position of the crown
            const yOffset = 80; 
            
            const bob = Math.sin(this.game.gameTime * 0.2) * 10; // Bobbing effect
            const crownX = (this.width - crownSize) / 2;
            const crownY = -yOffset + bob;

            ctx.drawImage(crownImg, crownX, crownY, crownSize, crownSize);
        }

        ctx.restore();
    }
}