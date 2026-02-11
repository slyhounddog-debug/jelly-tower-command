import { darkenColor } from './utils.js';
import Missile from './missile.js';
import Particle from './particle.js';
import Drop from './drop.js';
import FloatingText from './floatingText.js';
import EnemyDebris from './EnemyDebris.js';

export class GummyBear {
    constructor(game) { // Constructor only takes `game` now. x,y come from init
        this.game = game;
        this.active = false; // Add active flag for pooling

        // Initialize properties that don't depend on game.currentRPM or game.enemiesKilled
        this.width = 60;
        this.height = 80;
        this.vy = -5; // Default/initial values
        this.vx = 0;
        this.gravity = 0.3;
        this.type = 'gummy_bear';
        this.kbVy = 0;
        this.scale = 1;
        this.angle = 0;
        this.animationTimer = 0; // Initialize with 0
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
        this.isJellyTagged = false;
        this.id = -1; // Default ID
        this.mass = 6;
        this.knockbackTimer = 0;
    }

    init(game, x, y) { // This init method is called by ObjectPool.get()
        this.game = game; // Re-assign or confirm game instance
        this.x = x;
        this.y = y;
        
        // Now calculate properties that depend on game.currentRPM and other game state
        // We know game is fully initialized when init is called from ObjectPool.get()
        const currentRPM = this.game.currentRPM || 9.25; // Fallback if still null/undefined
        const enemiesKilled = this.game.enemiesKilled || 0; // Fallback

        this.speed = (0.4 + (currentRPM * 0.01)) * 0.5 * 3;
        this.health = (40 + currentRPM + (enemiesKilled * 0.06));
        this.maxHealth = this.health;
        this.image = this.game.gummybearImages[Math.floor(Math.random() * this.game.gummybearImages.length)];
        this.color = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
        this.id = this.game.getNewId(); // Assign ID here
        this.animationTimer = Math.random() * Math.PI * 2; // Randomize here
        this.active = true; // Set active flag
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.width = 60; // Base width
        this.height = 80; // Base height
        this.vy = -5;
        this.vx = 0;
        this.gravity = 0.3;
        this.type = 'gummy_bear';
        this.kbVy = 0;
        this.scale = 1;
        this.angle = 0;
        this.animationTimer = 0;
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
        this.isJellyTagged = false;
        this.id = -1; // Reset ID, will be reassigned on init
        this.mass = 6; // Base mass
        this.knockbackTimer = 0;
        // Properties that are reassigned in init, but should have a default.
        this.speed = 0;
        this.image = null;
        this.color = null;
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

    takeDamage(amount, isCritical = false, source = null) {
        const player = this.game.player;
        if (player.upgrades['Sweet Aura'] > 0) {
            const dist = Math.hypot(this.x - player.x, this.y - player.y);
            if (dist < player.lickRange) {
                amount *= (1 + player.upgrades['Sweet Aura'] * 0.1);
            }
        }
        
        if (source && source.gummyImpactStacks > 0 && this.knockbackTimer <= 0 && this.mass < 999) {
            const knockbackAmount = (this.game.stats.lickKnockback * 0.1 * source.gummyImpactStacks) / this.mass;
            if (this.mass < 3) { // Launchable enemies
                this.kbVy -= knockbackAmount; // Apply full force upwards
            } else { // Heavies
                this.kbVy = Math.max(0.1, this.kbVy - knockbackAmount); // Dampen, but ensure minimum downward movement
            }
            this.knockbackTimer = 15; // 0.25 seconds * 60 frames/sec
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
        if (!this.active) return;
    
        this.active = false;
        this.game.enemyPools['gummy_bear'].returnToPool(this);
        this.game.enemiesKilled++;
    
        // --- Debris spawning for Gummy Bear ---
        let numDebris = 2 + Math.floor(Math.random() * 2); // 2-3 pieces
        const numCols = 2; // Default 2x2 cut
        const numRows = 2;
    
        for (let i = 0; i < numDebris; i++) {
            this.game.enemyDebrisPool.get(this.game, this, this.image, this.width, this.height, numCols, numRows);
        }
    
        // --- Particle spawning ---
        const numParticles = Math.min(50, 10 + Math.floor(this.maxHealth / 30));
        const source = this.lastDamageSource; // Assuming lastDamageSource is tracked
    
        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = source && source.isCrit ? '#FFD700' : this.color;
            this.game.particlePool.get(this.game, this.x + this.width / 2, this.y + this.height / 2, color, 'spark', 0.75, vx, vy);
        }
    
        // --- Screen Shake ---
        this.game.screenShake.trigger(4, 15);
    
        // --- XP and Souls ---
        let xpGained = 10 + (this.maxHealth / 10);
        const xpMultiplier = this.game.emporium.getEnemyXpMultiplier();
        xpGained *= xpMultiplier;
        
        this.game.soulPool.get(this.game, this.x + this.width / 2, this.y + this.height / 2);
    
        // --- Drop Logic ---
        let dropMultiplier = 1;
        if (this.isJellyTagged) {
            dropMultiplier *= 2;
        }
    
        for (let i = 0; i < dropMultiplier; i++) {
            this.game.dropPool.get(this.game, this.x, this.y, 'coin');
            this.game.dropPool.get(this.game, this.x, this.y, 'xp_orb', xpGained);
    
            const randLuckyCoin = Math.random() * 100;
            if (randLuckyCoin < this.game.stats.luckCoin) {
                this.game.dropPool.get(this.game, this.x, this.y, 'lucky_coin');
            }
    
            let finalHeartChance = this.game.stats.luckHeart;
            if (Math.random() * 100 < finalHeartChance) {
                this.game.dropPool.get(this.game, this.x, this.y, 'heart');
            }
    
            let componentDropChance = 0.5 + (this.game.stats.luckLvl * 0.25);
            if (Math.random() * 100 < componentDropChance) {
                this.game.dropPool.get(this.game, this.x, this.y, 'component');
            }
    
            const iceCreamChance = this.game.emporium.getIceCreamChance();
            let finalIceCreamChance = iceCreamChance[0];
            if (Math.random() * 100 < finalIceCreamChance) {
                this.game.dropPool.get(this.game, this.x, this.y, 'ice_cream_scoop');
            }
        }
    }

    update(tsf) {
        if (this.knockbackTimer > 0) this.knockbackTimer -= tsf;
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
        // Recovery logic: if knocked up, slowly return to neutral
        if (this.kbVy < 0) {
            this.kbVy = Math.min(0, this.kbVy + (0.05 * tsf)); // Gradually increase towards 0
        }
        this.y += (currentSpeed + this.kbVy) * tsf;

        const ground = this.game.platforms.find(p => p.type === 'ground');
        const distToGround = ground ? ground.y - (this.y + this.height) : 1000;
        this.groundProximity = distToGround < this.game.groundProximityThreshold;

        this.animationTimer += 0.05 * tsf;
        this.angle = Math.sin(this.animationTimer) * 0.1;

        if (this.y > this.game.PLAYABLE_AREA_HEIGHT) {
            this.active = false;
            this.game.enemyPools['gummy_bear'].returnToPool(this);
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

        // Health bar drawing logic
        if (this.health < this.maxHealth) {
            const pct = Math.max(0, this.health / this.maxHealth);
            const isLow = pct < 0.25;
            
            let sizeMult = 1.0;
            
            const pulse = isLow ? 1 + Math.sin(this.game.gameTime * 0.2) * 0.1 : 1;
            const finalMult = sizeMult * pulse;
            
            let offsetX = (this.shakeDuration > 0) ? (Math.random() - 0.5) * this.shakeMagnitude : 0;
            let offsetY = (this.shakeDuration > 0) ? (Math.random() - 0.5) * this.shakeMagnitude : 0;
            
            // Calculate bar positions relative to the GummyBear's absolute position
            const barWidth = (this.width * 1.2) * finalMult;
            const barHeight = 18 * finalMult; 
            const barX = (this.x + this.width/2 - barWidth/2) + offsetX;
            const barY = this.y - 22 + offsetY;

            const frameColor = darkenColor(this.color, 10);

            ctx.fillStyle = frameColor + '66'; 
            ctx.beginPath(); ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 10); ctx.fill();
            
            ctx.fillStyle = darkenColor(frameColor, 30) + '99'; 
            ctx.beginPath(); ctx.roundRect(barX, barY, barWidth, barHeight, 8); ctx.fill();

            let healthFillColor = '#2ecc71';
            if (pct < 0.25) healthFillColor = '#ff3131';
            else if (pct < 0.60) healthFillColor = '#f1c40f';
            
            ctx.fillStyle = (this.hitTimer > 0) ? '#FFFFFF' : healthFillColor;
            ctx.beginPath(); ctx.roundRect(barX, barY, barWidth * pct, barHeight, 8); ctx.fill();

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

                ctx.strokeStyle = '#213625ff';
                ctx.lineWidth = 3;
                ctx.strokeText(val, tx, ty);

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
        this.mass = 999; // Boss: Mass 999
        this.knockbackTimer = 0; // Initialize knockback timer
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

        let image = this.game.gummyclusterImages[0];
        const healthPercentage = this.health / this.maxHealth; // Recalculate if needed, or use a cached value
        if (healthPercentage < 0.7) {
            image = this.game.gummyclusterImages[1];
        }
        if (healthPercentage < 0.3) {
            image = this.game.gummyclusterImages[2];
        }

        const numDebris = 4 + Math.floor(Math.random() * 3);
        const numCols = 3;
        const numRows = 3;

        for (let i = 0; i < numDebris; i++) {
            this.game.enemyDebrisPool.get(this.game, this, image, this.width, this.height, numCols, numRows);
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
        const gummyBear = this.game.enemyPools['gummy_bear'].get(this.game, spawnX, spawnY);
        gummyBear.vx = (Math.random() - 0.5) * 12;
        gummyBear.vy = -Math.random() * 10;
    }

    update(tsf) {
        if (this.knockbackTimer > 0) this.knockbackTimer -= tsf;
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