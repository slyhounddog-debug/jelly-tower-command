import Particle from './particle.js';
import Drop from './drop.js';
import { darkenColor, showNotification } from './utils.js?v=26';
import FloatingText from './floatingText.js';
import SpriteAnimation from './SpriteAnimation.js';
import FrostingParticle from './frostingParticle.js';
import Player from './player.js';
import EnemyDebris from './EnemyDebris.js';
import Soul from './Soul.js'; // Corrected placement

export default class Missile {
    constructor() {
        this.active = false;
    }

    init(game, x, type = 'missile', y = -50, hpMultiplier = 1) {
        this.game = game;
        this.x = x; 
        this.y = y + 90;
        this.baseSpeed = (type === 'piggy') ? 0.5 : 1;
        this.type = type;
        this.groundProximity = false;
        this.active = true;
        this.knockbackTimer = 0; // Initialize knockback timer

        this.health = (45 + (this.game.currentRPM * 2.2) + (this.game.enemiesKilled * 0.1)) * hpMultiplier;

        this.width = 70;
        this.height = 70;
        this.image = null;
        this.sprite = null;
        this.mass = 1; // Default mass

       if (type === 'missile') {
            this.width = 70; 
            this.health = (25 + (this.game.currentRPM * 2)) * hpMultiplier;
            this.height = 70;
            const variantIndex = Math.floor(Math.random() * 8);
            this.sprite = new SpriteAnimation({
                src: 'assets/Images/jellybeans.png',
                frameWidth: 165,
                frameHeight: 175,
                totalFrames: 8,
                fps: 0,
                row: 0
            });
            this.sprite.currentFrame = variantIndex;
            this.color = this.game.PASTEL_COLORS[variantIndex % this.game.PASTEL_COLORS.length];
            this.damage = 5;
            this.mass = 1; // Missile (Jelly Bean): Mass 1
        
        } else if (type === 'gummy_worm') {
            this.health = (20 + (this.game.currentRPM * 1.8)) * hpMultiplier;
            this.width = 26;
            this.height = 85;
            this.color1 = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.color2 = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.color = this.color1; 
            this.baseSpeed = 1.6; 
            this.damage = 6;
            this.mass = 1.2; // Gummy Worm: Mass 1.2
        } else if (type === 'marshmallow_large') {
            this.health = (150 + (this.game.currentRPM * 5.5)) * hpMultiplier;
            this.width = 76.5 * 1.5;
            this.height = 76.5 * 1.5;
            this.color = '#fffaf2ff';
            this.baseSpeed = 0.4;
            this.rotationSpeed = (Math.random() - 0.5) * 0.02;
            this.image = this.game.marshmallowBigImage;
            this.mass = 10; // Marshmallow (Large): Mass 10
        } else if (type === 'marshmallow_medium') {
            this.health = (50 + (this.game.currentRPM * 3)) * hpMultiplier;
            this.width = 45 * 1.6;
            this.height = 45 * 1.6;
            this.color = '#fffcf8ff';
            this.baseSpeed = 0.7;
            this.rotationSpeed = (Math.random() - 0.5) * 0.02;
            this.image = this.game.marshmallowMediumImage;
            this.mass = 6; // Marshmallow (Med): Mass 6
        } else if (type === 'marshmallow_small') {
            this.health = (10 + (this.game.currentRPM * .5)) * hpMultiplier;
            this.width = 22 * 2.5;
            this.height = 22 * 2.5;
            this.color = '#fffdf8ff';
            this.baseSpeed = 1;
            this.rotationSpeed = (Math.random() - 0.5) * 0.02;
            this.image = this.game.marshmallowSmallImage;
            this.mass = 2; // Marshmallow (Small): Mass 2
        } else if (type === 'piggy') {
            this.health = (50 + (this.game.currentRPM * 3)) * hpMultiplier;
            this.width = 84;
            this.height = 86;
            this.baseSpeed = 0.5;
            this.image = this.game.piggybankImage;
            this.color = '#FFC0CB'; // Pink color for piggy bank
            this.mass = 6; // Piggy is similar to component, giving it a mass of 3. User didn't specify.
        } else if (type === 'jaw_breaker') {
            this.health = (200 + (this.game.currentRPM * 7)) * hpMultiplier;
            this.width = 76.5 * 1.7;
            this.height = 76.5 * 1.7;
            this.baseSpeed = 0.6;
            this.image = this.game.jawbreakerenemyImage;
            this.color = '#00ffd5ff';
            this.isJawBreaker = true;
            this.damage = 18;
            this.mass = 999; // Jawbreaker: Mass 999
        } else if (type === 'jelly_pudding') {
            this.health = (100 + (this.game.currentRPM * 5)) * hpMultiplier;
            this.width = 95;
            this.height = 95;
            this.baseSpeed = 1;
            this.image = this.game.jellypuddingenemyImage;
            this.color = '#d400ffff';
            this.isJellyPudding = true;
            this.damage = 14;
            this.mass = 0.5; // Jelly Pudding: Mass 0.5
        } else if (type === 'donut') {
            this.health = (80 + (this.game.currentRPM * 2.5)) * hpMultiplier;
            this.width = 70;
            this.height = 70;
            this.baseSpeed = 1.2;
            this.image = this.game.donutenemyImage;
            this.color = '#00e1ffff';
            this.isDonut = true;
            this.damage = 10;
            this.mass = 1.5; // Donut: Mass 1.5
        } else if (type === 'ice_cream') {
            this.health = (120 + (this.game.currentRPM * 3)) * hpMultiplier;
            this.width = 85;
            this.height = 85;
            this.baseSpeed = 0.8;
            this.image = this.game.icecreamenemyImage;
            this.color = '#ffdbedff';
            this.isIceCream = true;
            this.damage = 8;
            this.mass = 5; // Ice Cream: Mass 5
        } else if (type === 'component_enemy') {
            this.health = (50 + (this.game.currentRPM * 3)) * hpMultiplier;
            this.width = 78;
            this.height = 78;
            this.baseSpeed = 0.6;
            this.image = this.game.componentenemyImage;
            this.color = '#B03060'; // Light maroon color for component enemy
            this.isComponentEnemy = true;
            this.damage = 9;
            this.mass = 2.9; // Component: Mass 3
        } else if (type === 'heartenemy') {
            this.health = (50 + (this.game.currentRPM * 2.2)) * hpMultiplier;
            this.width = 68;
            this.height = 68;
            this.baseSpeed = 1.4;
            this.image = this.game.heartenemyImage;
            this.color = '#ff90acff';
            this.isHeartEnemy = true;
            this.damage = 5;
            this.mass = 2; // Heart: Mass 2
        } else if (type === 'gummy_bear') { // Assuming 'gummy_bear' is a type
            this.health = (250 + (this.game.currentRPM * 8)) * hpMultiplier;
            this.width = 100;
            this.height = 100;
            this.baseSpeed = 0.3;
            this.image = this.game.gummybearImages[0]; // Assuming an array of gummy bear images
            this.color = 'brown'; // Placeholder color
            this.mass = 6; // Gummy Bear: Mass 6
        }
        this.speed = (this.baseSpeed + (this.game.currentRPM * 0.002)) * 0.5;
        this.maxHealth = this.health;
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
        this.isJellyTagged = false;
        this.slowTrailTimer = 0;
        this.id = this.game.getNewId();
        this.lastDamageSource = null;
        this.knockbackImmunityTimer = 0;
        this.speedBoostTimer = 0;
        this.isTeleporting = false; // Teleport animation flag
        this.teleportAnimTimer = 0; // Teleport animation timer
        this.teleportAnimDuration = 15; // Teleport animation duration (frames)
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.health = 0;
        this.maxHealth = 0;
        this.slowEffects = [];
        this.fireStacks = [];
        this.lastDamageSource = null;
        this.isJellyTagged = false;
        this.sprite = null;
        this.image = null;
        this.knockbackTimer = 0; // Reset knockback timer
        this.isTeleporting = false; // Reset teleport flag
        this.teleportAnimTimer = 0; // Reset teleport animation timer
        this.scale = 1; // Reset scale
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
            this.slowEffects.push({ timer: duration, amount, source, initialDuration: duration });
        }
    }

    takeDamage(amount, isCritical = false, source = null) {
        if (!this.active) return false;
        if (this.isDonut && Math.random() < 0.5) {
            const ft = this.game.floatingTextPool.get(this.game, this.x + this.width / 2, this.y, 'Miss', 'white');
            return false;
        }

        const oldX = this.x;
        const oldY = this.y;

        if (source) {
            this.lastDamageSource = source;
            if (source.gummyImpactStacks > 0 && this.knockbackTimer <= 0 && this.mass < 999) { // Jawbreakers and Bosses are immune to knockback (mass 999)
                let knockbackAmount = (this.game.stats.lickKnockback * 0.1 * source.gummyImpactStacks) / this.mass;
                if (this.isJellyPudding) {
                    knockbackAmount *= 2; // Jelly Puddings are extra bouncy
                }

                if (this.mass < 3) { // Launchable enemies
                    this.kbVy -= knockbackAmount; // Apply full force upwards
                } else { // Heavies
                    this.kbVy = Math.max(0.1, this.kbVy - knockbackAmount); // Dampen, but ensure minimum downward movement
                }
                this.knockbackTimer = 15; // Set ICD to 0.25 seconds (15 frames)
            }
        }

        if (this.isIceCream) {
            this.speedBoostTimer = 120;
        }

        if (this.isComponentEnemy) {
            // Teleportation particles at old location
            const teleportColors = ['#E0BBE4', '#957DAD', '#C7CEEA']; // Light magenta, lavender, light blue-purple
            for (let i = 0; i < 15; i++) { // More particles for a noticeable puff
                const color = teleportColors[Math.floor(Math.random() * teleportColors.length)];
                const particle = this.game.particlePool.get();
                if (particle) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 3 + 1;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    particle.init(this.game, oldX + this.width / 2, oldY + this.height / 2, color, 'spark', 0.6, vx, vy);
                }
            }

            // Teleport to new random position
            this.x = Math.random() * (this.game.width - this.width);
        }

        this.game.hitStopFrames = 0;
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
            this.game.floatingTextPool.get(this.game, oldX + this.width / 2, oldY, `-${roundedAmount.toFixed(0)}`, 'yellow', 4); 
        } else {
            this.game.floatingTextPool.get(this.game, oldX + this.width / 2, oldY, `-${roundedAmount.toFixed(0)}`, 'red');
        }

        this.damageText = `${this.health.toFixed(0)}/${this.maxHealth.toFixed(0)}`;
        this.damageTextTimer = 60;
        
        if (this.health <= 0) {
            this.kill(oldX, oldY);
            return true;
        }
        return false;
    }

    update(tsf) {
        if (!this.active) return;

        if (this.isTeleporting) {
            this.teleportAnimTimer += tsf;
            const progress = this.teleportAnimTimer / this.teleportAnimDuration;
            // Shrink down and then grow back up
            if (progress < 0.5) {
                this.scale = 1 - (progress * 2); // Shrink from 1 to 0
            } else {
                this.scale = (progress - 0.5) * 2; // Grow from 0 to 1
            }
            this.scale = Math.max(0, Math.min(1, this.scale)); // Clamp between 0 and 1

            if (this.teleportAnimTimer >= this.teleportAnimDuration) {
                this.isTeleporting = false;
                this.scale = 1;
            }
            return; // Prevent other updates during teleport animation
        }
        
        if (this.knockbackTimer > 0) this.knockbackTimer -= tsf; // Decrement knockback timer
        if (this.auraSlowTimer > 0) this.auraSlowTimer -= tsf;

        if (this.fireFlashTimer > 0) this.fireFlashTimer -= tsf;
        for (let i = this.fireStacks.length - 1; i >= 0; i--) {
            const stack = this.fireStacks[i];
            stack.timer -= tsf;
            if (stack.timer <= 0) {
                this.fireStacks.splice(i, 1);
            } else {
                if (Math.floor(stack.timer) % 60 === 0) {
                    this.takeDamage(stack.damage, false, null);
                    this.game.floatingTextPool.get(this.game, this.x + this.width / 2, this.y, `-${stack.damage.toFixed(0)}`, 'orange');
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
        
        if (this.totalSlow > 0) {
            this.slowParticleTimer += tsf;
            if (this.slowParticleTimer >= 5) {
                this.slowParticleTimer = 0;
                // Particle pooling will be added later
            }
        }

        const isSlowedByTongue = this.slowEffects.some(e => e.source === 'tongue');
        if (isSlowedByTongue) {
            this.slowTrailTimer += tsf;
            if (this.slowTrailTimer >= 4.5) {
                this.slowTrailTimer = 0;
                // Particle pooling will be added later
            }
        }

        let currentSpeed = this.speed * (1 - this.totalSlow);
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer -= tsf;
            currentSpeed *= 1.5;
        }

        if (this.hitTimer > 0) this.hitTimer -= tsf;
        if (this.damageTextTimer > 0) this.damageTextTimer -= tsf;
        if (this.criticalHitFlashTimer > 0) this.criticalHitFlashTimer -= tsf;
        if (this.shakeDuration > 0) this.shakeDuration -= tsf;
        if (this.healScale > 1) this.healScale -= 0.05 * tsf;
        else this.healScale = 1;

        const ground = this.game.platforms.find(p => p.type === 'ground');
        const distToGround = ground ? ground.y - (this.y + this.height) : 1000;
        this.groundProximity = distToGround < this.game.groundProximityThreshold;

        if (distToGround < 150) {
            this.squash = 1.35;
            this.stretch = 0.65;
        } else {
            const stretch_factor = 0.4;
            this.stretch = 1 + Math.abs(this.kbVy) * stretch_factor;
            this.squash = 1 - Math.abs(this.kbVy) * stretch_factor * 0.5;
        }

        this.animationTimer += 0.1 * tsf;
        if (this.type === 'missile') {
            this.scale = 1 + Math.sin(this.animationTimer) * 0.04;
            this.angle = Math.sin(this.animationTimer * 0.5) * (Math.PI / 18);
        } else if (this.type === 'gummy_worm') {
            this.x += Math.sin(this.y / 30) * 2.5 * tsf;
        } else if (this.type.includes('marshmallow')) {
            this.angle += this.rotationSpeed * tsf;
        }

        this.kbVy *= 0.9;
        // Recovery logic: if knocked up, slowly return to neutral
        if (this.kbVy < 0) {
            this.kbVy = Math.min(0, this.kbVy + (0.05 * tsf)); // Gradually increase towards 0
        }
        this.y += ((currentSpeed + this.kbVy) * tsf);

        if (this.type === 'gummy_worm') {
            if (this.x < 0) this.x = 0;
            if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
        }

        if (this.y > this.game.PLAYABLE_AREA_HEIGHT - 110) {
            this.game.castleHealth -= this.damage || 10;
            this.game.castleHealthBar.triggerHit();
            this.game.hitStopFrames = 5;
            this.game.screenShake.trigger(5, 10);
            this.reset();
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();

        if (this.isIceCream && this.speedBoostTimer > 0) {
            ctx.translate(Math.sin(this.game.gameTime * 0.5) * 2, Math.cos(this.game.gameTime * 0.5) * 2);
        }
        if (this.groundProximity) {
            const alpha = Math.abs(Math.sin(this.game.gameTime * 0.1));
            ctx.globalAlpha = 1 - alpha * 0.5;
           
        }
        
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
                ctx.ellipse(this.x + this.width / 2, ground.y - 90, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (this.totalSlow > 0) {
            const tongueSlow = this.slowEffects.find(e => e.source === 'tongue');
            if (tongueSlow) {
                const progress = tongueSlow.timer / tongueSlow.initialDuration;
                const alpha = 0.2 + (0.6 * progress);
                ctx.globalAlpha = alpha;
                ctx.filter = 'hue-rotate(180deg) brightness(1.5)';
                this.drawEnemy(ctx);
                ctx.filter = 'none';
                ctx.globalAlpha = 1;
            } else {
                ctx.fillStyle = `rgba(100, 150, 255, ${this.totalSlow * 0.5})`;
                ctx.beginPath();
                ctx.roundRect(this.x, this.y, this.width, this.height, 10);
                ctx.fill();
            }
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

        this.drawEnemy(ctx);

        ctx.shadowBlur = 0;

        if (this.isJellyTagged) {
            const crownImg = this.game.tagCrownImage;
            const crownSize = 40; 
            const yOffset = 50; 
            
            const bob = Math.sin(this.game.gameTime * 0.1) * 5;
            const crownX = this.x + (this.width - crownSize) / 2;
            const crownY = this.y - yOffset + bob;

            ctx.drawImage(crownImg, crownX, crownY, crownSize, crownSize);
        }

      if (this.health < this.maxHealth) {
            const pct = Math.max(0, this.health / this.maxHealth);
            const isLow = pct < 0.25;
            
            let sizeMult = 1.0;
            if (this.type === 'piggy') sizeMult = 1.15;
            else if (this.type === 'marshmallow_large') sizeMult = 1.25;
            else if (this.type === 'marshmallow_small') sizeMult = 0.8;
            
            const pulse = isLow ? 1 + Math.sin(this.game.gameTime * 0.2) * 0.1 : 1;
            const finalMult = sizeMult * pulse;
            
            let offsetX = (this.shakeDuration > 0) ? (Math.random() - 0.5) * this.shakeMagnitude : 0;
            let offsetY = (this.shakeDuration > 0) ? (Math.random() - 0.5) * this.shakeMagnitude : 0;
            
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
        ctx.restore();
    }

    drawEnemy(ctx) {
        const shadowOffset = 5;
        const shadowDarkness = 20;
        const shadowColor = darkenColor(this.color, shadowDarkness);

        if (this.type === 'piggy') {
            const piggyLevel = this.game.stats.piggyLvl;
            const sizeMultiplier = 1.0 + (piggyLevel * 0.1);
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(this.squash * sizeMultiplier, this.stretch * sizeMultiplier);
            
            if (piggyLevel > 0) {
                ctx.globalAlpha = 0.6 + Math.sin(this.game.gameTime / 8) * 0.4;
                ctx.fillStyle = 'gold';
                const auraSize = this.width * 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, auraSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            if (this.game.piggybankImage && this.game.piggybankImage.complete) {
                ctx.drawImage(this.game.piggybankImage, -this.width / 2, -this.height / 2, this.width, this.height);
            }
            
            ctx.restore();
        } else if (this.type === 'gummy_worm') {
            const segments = 10;
            const segmentHeight = this.height / segments;
            const wiggleAmplitude = 4;
            const wiggleFrequency = 0.2;
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            ctx.save();
            ctx.translate(cx, cy + shadowOffset);
            ctx.scale(this.squash * 1.09, this.stretch * 1.09);
            const borderColor1 = darkenColor(this.color1, shadowDarkness);
            const borderColor2 = darkenColor(this.color2, shadowDarkness);
            const borderGrad = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
            borderGrad.addColorStop(0, borderColor1);
            borderGrad.addColorStop(1, borderColor2);
            ctx.strokeStyle = borderGrad; ctx.lineWidth = this.width + 4; ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const yPos = -this.height/2 + i * segmentHeight;
                const xPos = Math.sin(i * wiggleFrequency + this.animationTimer) * wiggleAmplitude;
                if (i === 0) ctx.moveTo(xPos, yPos);
                else ctx.lineTo(xPos, yPos);
            }
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(this.squash, this.stretch);
            const grad = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
            if (this.hitTimer > 0) {
                grad.addColorStop(0, 'white'); grad.addColorStop(1, 'white');
            } else {
                grad.addColorStop(0, this.color1); grad.addColorStop(1, this.color2);
            }
            ctx.strokeStyle = grad; ctx.lineWidth = this.width; ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const yPos = -this.height/2 + i * segmentHeight;
                const xPos = Math.sin(i * wiggleFrequency + this.animationTimer) * wiggleAmplitude;
                if (i === 0) ctx.moveTo(xPos, yPos);
                else ctx.lineTo(xPos, yPos);
            }
            ctx.stroke();
            ctx.restore();
        } else if (this.type.includes('marshmallow')) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.angle);
            ctx.scale(this.squash, this.stretch);

            if (this.image && this.image.complete) {
                ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            }
            ctx.restore();
        }
       else {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2; // Removed +40 offset

            ctx.save();
            if (this.hitTimer > 0) {
                ctx.filter = 'brightness(2)';
            }
            ctx.translate(cx, cy);
            ctx.rotate(this.angle);
            ctx.scale(this.scale, this.scale); // Apply animation scale
            
            if (this.sprite) {
                this.sprite.draw(
                    ctx, 
                    0, 40, // Lower the sprite by 10 pixels
                    this.width, 
                    this.height, 
                    this.stretch - 1, 
                    this.squash - 1
                );
            } else if (this.image && this.image.complete) {
                ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            }
            ctx.restore();
        }
    }
    
    kill(spawnX = this.x, spawnY = this.y) {
        if (!this.active) return;

        let numDebris = 0;
        let numCols = 2; // Default for most enemies
        let numRows = 2; // Default for most enemies

        if (this.type === 'gummy_cluster') {
            numDebris = 4 + Math.floor(Math.random() * 3);
            numCols = 3;
            numRows = 3;
        } else if (this.type === 'gummy_worm') {
            numDebris = 2 + Math.floor(Math.random() * 2); // 2-3 pieces
            numCols = 1; // 1 column
            numRows = 4; // 4 rows
        } else { // For regular enemies
            numDebris = 2 + Math.floor(Math.random() * 2); // 2-3 pieces
            numCols = 2;
            numRows = 2;
        }

        for (let i = 0; i < numDebris; i++) {
            let spriteWidth = this.width;
            let spriteHeight = this.height;

            if (this.type === 'missile' && this.sprite) {
                spriteWidth = this.sprite.frameWidth;
                spriteHeight = this.sprite.frameHeight;
            } else if (this.type === 'piggy') {
                const piggyLevel = this.game.stats.piggyLvl;
                const sizeMultiplier = 1.0 + (piggyLevel * 0.1);
                spriteWidth = this.width * sizeMultiplier;
                spriteHeight = this.height * sizeMultiplier;
            }
            
            const debris = this.game.enemyDebrisPool.get(this.game, this, spriteWidth, spriteHeight, numCols, numRows);
        }
        
        const numParticles = 10 + Math.floor(this.maxHealth / 15);
        const source = this.lastDamageSource;

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = source && source.isCrit ? '#FFD700' : this.color;
            this.game.particlePool.get(this.game, spawnX + this.width / 2, spawnY + this.height / 2, color, 'spark', 0.75, vx, vy);
        }

       let intensity = 4; 
        if (this.type === 'marshmallow_large') intensity = 5;
        else if (this.type === 'marshmallow_medium') intensity = 4;
        else if (this.type === 'marshmallow_small') intensity = 2;
        else if (this.type === 'piggy') intensity = 5;

        import('./utils.js?v=26').then(utils => {
            if (utils.ScreenShake && typeof utils.ScreenShake.trigger === 'function') {
                utils.ScreenShake.trigger(intensity, 15);
            }
        });
        
        let xpGained = 10 + (this.maxHealth / 10);
        const xpMultiplier = this.game.emporium.getEnemyXpMultiplier();
        xpGained *= xpMultiplier;

        if (this.type === 'marshmallow_large') {
            const parentHeight = this.height;
            const childHeight = 45 * 1.33;
            const spawnY_child = spawnY + (parentHeight / 2) - (childHeight / 2) - 90;
            for (let i = 0; i < 2; i++) {
                const missile = this.game.enemyPools['marshmallow_medium'].get(this.game, spawnX + (i * 30) - 15, 'marshmallow_medium', spawnY_child);
            }
            this.reset();
            return;
        }

        if (this.type === 'marshmallow_medium') {
            const parentHeight = this.height;
            const childHeight = 22 * 1.5;
            const spawnY_child = spawnY + (parentHeight / 2) - (childHeight / 2) - 90;
            for (let i = 0; i < 2; i++) {
                const missile = this.game.enemyPools['marshmallow_small'].get(this.game, spawnX + (i * 20) - 10, 'marshmallow_small', spawnY_child);
            }
            this.reset();
            return;
        }

        const pStats = this.game.stats.piggyStats;
        
        this.game.enemiesKilled++;

        if (this.game.wasLickKill && this.game.player.upgrades['Sugar Rush'] > 0) {
            this.game.player.sugarRushTimer = 300;
        }

        const soul = this.game.soulPool.get(this.game, spawnX + this.width / 2, spawnY + this.height / 2);

        // --- Drop Logic ---
        if (this.type === 'piggy') {
            // Piggy Bank specific drops
            const bonus = Math.floor(this.game.money * pStats.bonus);
            this.game.money += bonus;
            this.game.totalMoneyEarned += bonus;
            this.game.handlePiggyDeath(bonus);

            // Apply Piggy Bank loot multiplier for XP, coins, and multiple chances for special drops
            for (let i = 0; i < pStats.mult; i++) {
                this.game.dropPool.get(this.game, spawnX, spawnY, 'xp_orb', xpGained); // Multiplied XP
                this.game.dropPool.get(this.game, spawnX, spawnY, 'coin'); // Multiplied regular coins

                // Multiple chances for lucky coin, heart, component based on luck
                const randHeart = Math.random() * 100;
                if (randHeart < this.game.stats.luckHeart) {
                    this.game.dropPool.get(this.game, spawnX, spawnY, 'heart');
                }

                const randLuckyCoin = Math.random() * 100;
                if (randLuckyCoin < this.game.stats.luckCoin) {
                    this.game.dropPool.get(this.game, spawnX, spawnY, 'lucky_coin');
                }
                
                // Chance for component drop (evaluated per multiplier iteration)
                const componentDropChance = 0.5 + (this.game.stats.luckLvl * 0.25); // Use the general formula
                if (Math.random() * 100 < componentDropChance) {
                    this.game.dropPool.get(this.game, spawnX, spawnY, 'component');
                }
            }

            // Ice Cream Scoop chance for Piggy Bank
            const iceCreamChance = this.game.emporium.getIceCreamChance();
            if (Math.random() * 100 < iceCreamChance[1]) { // Use piggy-specific ice cream chance
                this.game.dropPool.get(this.game, spawnX, spawnY, 'ice_cream_scoop');
            }

        } else { // For all other enemy types
            // General drops for all non-piggy enemies
            this.game.dropPool.get(this.game, spawnX, spawnY, 'xp_orb', xpGained); // One XP orb

            const randHeart = Math.random() * 100;
            if (randHeart < this.game.stats.luckHeart) {
                this.game.dropPool.get(this.game, spawnX, spawnY, 'heart'); // One heart chance
            }

            const randCoin = Math.random() * 100;
            if (randCoin < this.game.stats.luckCoin) {
                this.game.dropPool.get(this.game, spawnX, spawnY, 'lucky_coin'); // One lucky coin chance
            } else if (randCoin < 40) { // 40% chance for a regular coin if lucky coin doesn't drop
                this.game.dropPool.get(this.game, spawnX, spawnY, 'coin'); // One regular coin chance
            }

            // Component Drop Logic for non-piggy enemies
            if (this.type === 'component_enemy') {
                this.game.dropPool.get(this.game, spawnX, spawnY, 'component'); // Guaranteed drop for component_enemy
            } else { // Other regular enemies get a chance
                const componentDropChance = 0.5 + (this.game.stats.luckLvl * 0.25); // Reverted to original formula
                if (Math.random() * 100 < componentDropChance) {
                    this.game.dropPool.get(this.game, spawnX, spawnY, 'component');
                }
            }
            
            // Ice Cream Scoop chance for non-Piggy enemies
            const iceCreamChance = this.game.emporium.getIceCreamChance();
            if (Math.random() * 100 < iceCreamChance[0]) { // Use general ice cream chance
                this.game.dropPool.get(this.game, spawnX, spawnY, 'ice_cream_scoop');
            }
        }

        this.reset();
    }
}