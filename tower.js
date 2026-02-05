import BaseStructure from './baseStructure.js';
import Projectile from './projectile.js';
import Particle from './particle.js';
import FrostingParticle from './frostingParticle.js';

export default class Tower extends BaseStructure {
    static lastSpriteIndex = -1; // Add this line

    // Static properties for sprite dimensions and padding
    static SPRITE_FRAME_WIDTH = 137;
    static SPRITE_FRAME_HEIGHT = 190;
    static PADDING_LEFT = 10;
    static PADDING_RIGHT = 10;
    static PADDING_TOP = 10;
    static PADDING_BOTTOM = 20;

    constructor(game, x, y, isAuto = true, platformSlotId = null) { // Default to true now
        const hitboxWidth = Tower.SPRITE_FRAME_WIDTH - Tower.PADDING_LEFT - Tower.PADDING_RIGHT;
        const hitboxHeight = Tower.SPRITE_FRAME_HEIGHT - Tower.PADDING_TOP - Tower.PADDING_BOTTOM;
        
        // These are the dimensions of the collision box passed to BaseStructure
        super(x, y, hitboxWidth * 0.76, hitboxHeight * 0.76); // Apply overall scaling to the hitbox
        
        this.game = game;
        this.isAuto = isAuto;
        this.platformSlotId = platformSlotId;

        // Offsets to correctly draw the original sprite frame relative to the new, smaller hitbox
        // The drawn image will still be the original scaled size (0.9), but its top-left will be offset.
        this.drawOffsetX = (this.width + 85 - Tower.SPRITE_FRAME_WIDTH * 0.9) / 2;
        this.drawOffsetY = (this.height + 80 - Tower.SPRITE_FRAME_HEIGHT * 0.9);
        
        // Ensure the new sprite index is different from the last one
        let newSpriteIndex;
        do {
            newSpriteIndex = Math.floor(Math.random() * 8);
        } while (newSpriteIndex === Tower.lastSpriteIndex);
        this.spriteIndex = newSpriteIndex;
        Tower.lastSpriteIndex = newSpriteIndex;

        this.cooldown = 0;
        this.barrelAngle = Math.random() * Math.PI;
        this.range = 300;
        this.isAnimating = false;
        this.recoil = 0;

        // Sell animation properties
        this.isSelling = false;
        this.sellAnimTimer = 0;
        this.sellAnimDuration = 20; // 1/3 of a second at 60fps

        // Placement animation properties
        this.isPlacing = true;
        this.finalY = y; // Store the target Y
        this.y = y - 80; // Start 80px higher
        this.placementVY = 0;
        this.placementGravity = 1.5;
        this.squashTimer = 0;
    }
    calculateSynergyBonus() {
        const synergyComponentCount = this.game.player.getEquippedComponentCount('Turret Synergy');
        if (synergyComponentCount === 0) {
            return { damage: 1, fireRate: 1, critChance: 0, critDamage: 0 };
        }

        const towersInRange = this.game.towers.filter(otherTower => {
            if (otherTower === this) return false;
            const dist = Math.hypot(this.x - otherTower.x, this.y - otherTower.y);
            return dist < this.range;
        });

        const bonusPerTower = 0.02 * synergyComponentCount;
        const damageBonus = 1 + (towersInRange.length * bonusPerTower);
        const fireRateBonus = 1 - (towersInRange.length * bonusPerTower); // Fire rate is a cooldown, so we decrease it
        let critChanceBonus = towersInRange.length * bonusPerTower * 100; // As a percentage

        let finalCritChance = this.game.stats.criticalHitChance + critChanceBonus;
        let critDamageBonus = 0;

        if (finalCritChance > 100) {
            critDamageBonus = (finalCritChance - 100) / 100;
            finalCritChance = 100;
        }

        return {
            damage: damageBonus,
            fireRate: fireRateBonus,
            critChance: finalCritChance,
            critDamage: critDamageBonus
        };
    }

    update(tsf) {
        const sniperCount = this.game.player.getEquippedComponentCount('Sniper');
        // Player-controlled range indicator logic and player control checks removed
        
        const synergyBonus = this.calculateSynergyBonus();
        let fireRate = this.game.stats.fireRate * synergyBonus.fireRate;

        // Apply Sugar Rush fire rate buff
        if (this.game.player.sugarRushTimer > 0) {
            fireRate *= 0.75; // 25% faster fire rate (cooldown is 75% of normal)
        }

        if (this.isSelling) {
            this.sellAnimTimer += tsf;
            if (this.sellAnimTimer >= this.sellAnimDuration) {
                this.game.towers = this.game.towers.filter(t => t !== this);
            }
            return; // Don't do other updates while selling
        }

        if (this.squashTimer > 0) {
            this.squashTimer -= tsf;
        }

        if (this.isPlacing) {
            this.placementVY += this.placementGravity * tsf;
            this.y += this.placementVY * tsf;

            if (this.y >= this.finalY) {
                this.y = this.finalY; // Snap to final position
                this.isPlacing = false;
                this.squashTimer = 15; // Trigger squish animation (15 frames)
                
                // Spawn frosting particles on land
                const visualCx = this.x + this.width / 2 + this.drawOffsetX;
                const visualCy = this.y + this.height + this.drawOffsetY; // At the base
                for (let i = 0; i < 20; i++) { // Increased from 20 to 30
                    const vx = (Math.random() - 0.5) * 10; // Increased velocity slightly
                    const vy = -Math.random() * 12 - 5;   // Increased velocity slightly
                    const radius = Math.random() * 8 + 1; // Increased radius (was effectively 2-7, now 4-10)
                    const lifespan = 30 + Math.random() * 20;
                    this.game.frostingParticlePool.get(this.game, visualCx, visualCy, vx, vy, radius, this.game.FROSTING_COLORS[Math.floor(Math.random() * this.game.FROSTING_COLORS.length)], lifespan);
                }
            }
            return; // Don't do other updates while placing
        }

        this.recoil *= 0.9;
        this.range = (this.game.stats.range * 0.5);
        if (sniperCount > 0) {
            this.range *= (1 + sniperCount * 0.2); 
        }
        if (this.cooldown > 0) this.cooldown -= tsf;

        this.isAnimating = false;
        
        // Auto-turret logic only
        let target = null; let minDist = this.range;
        // Center of the hitbox, which is the logical center
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        for (const type in this.game.enemyPools) {
            this.game.enemyPools[type].forEach(m => {
                const dist = Math.hypot((m.x + m.width / 2) - (cx + this.drawOffsetX), (m.y + m.height / 2) - (cy + this.drawOffsetY - 30));
                if (dist < minDist) { minDist = dist; target = m; }
            });
        }
        if (target) {
            this.isAnimating = true;
            if (this.cooldown <= 0) {
                const projectileSpeed = this.game.stats.projectileSpeed;
                const dist = Math.hypot(target.x + 15 - cx, target.y + 20 - cy);
                const time = dist / projectileSpeed;
                const predY = target.y + 20 + (target.speed * time) - (cy + this.drawOffsetY - 30);
                this.barrelAngle = Math.atan2(predY, target.x + 15 - (cx + this.drawOffsetX));
                this.shoot(fireRate); this.cooldown = fireRate;
            }
        }
    }    shoot(fireRate) {
        this.recoil = 1;
        this.game.shotsFired++;
        // Center of the hitbox, which is the logical center
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const visualCx = cx + this.drawOffsetX;
        const visualCy = cy + this.drawOffsetY - 30; // Barrel pivot offset
        
        const splitShotCount = this.game.player.getEquippedComponentCount('Split Shot');
        const numShots = 1 + splitShotCount;
        const spread = numShots > 1 ? 10 * (Math.PI / 180) * splitShotCount : 0; // 10 degrees per stack
        const totalSpread = spread;
        const startAngle = this.barrelAngle - totalSpread / 2;

        const synergyBonus = this.calculateSynergyBonus();

        for (let i = 0; i < numShots; i++) {
            const angle = startAngle + i * (totalSpread / (numShots > 1 ? numShots - 1 : 1));
            const tx = visualCx + Math.cos(angle) * 30;
            const ty = visualCy + Math.sin(angle) * 30; 
            let damage = (this.game.stats.damage * 0.5) * synergyBonus.damage;
            const sniperCount = this.game.player.getEquippedComponentCount('Sniper');
            if (sniperCount > 0) damage *= (1 + sniperCount * 0.1);

            const isCrit = (Math.random() * 100 < synergyBonus.critChance);
            if (isCrit) {
                damage *= (2 + synergyBonus.critDamage);
            }

            let projectileSpeed = this.game.stats.projectileSpeed;
            const radius = 15 //+ (this.game.stats.damageLvl * 0.1) + (this.game.stats.fireRateLvl * 0.1) + (this.game.stats.rangeLvl * 0.2); // Always auto-turret radius
            
            const gummyImpactCount = this.game.player.getEquippedComponentCount('Gummy Impact');
            const popRockCount = this.game.player.getEquippedComponentCount('Pop-Rock Projectiles');
            const bubbleGumCount = this.game.player.getEquippedComponentCount('Bubble Gum Shots');
            const fireDamageCount = this.game.player.getEquippedComponentCount('Fire Damage');
            const chainBounceCount = this.game.player.getEquippedComponentCount('Chain Bounce');

            this.game.projectilesPool.get(this.game, tx, ty, angle, damage, this.range, { x: visualCx, y: visualCy }, projectileSpeed, radius, gummyImpactCount, popRockCount, bubbleGumCount, fireDamageCount, chainBounceCount, true, isCrit); // Always auto-turret
        }
    }

    sell() {
        if (this.isSelling) return;
        this.isSelling = true;
        this.sellAnimTimer = 0;

        // Puff of pink smoke
        const visualCx = this.x + this.width / 2 + this.drawOffsetX;
        const visualCy = this.y + this.height / 2 + this.drawOffsetY;
        for (let i = 0; i < 25; i++) {
            this.game.particles.push(new Particle(this.game, visualCx, visualCy, 'rgba(255, 105, 180, 0.7)', 'smoke', 0.8));
        }
    }

    draw(ctx) {
        const visualCx = this.x + this.width / 2 + this.drawOffsetX;
        const visualCy = this.y + this.height / 2 + this.drawOffsetY;

        // Only draw range circle after placement is complete
        if (!this.isPlacing && !this.isSelling) {
            ctx.beginPath(); ctx.arc(visualCx, visualCy, this.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(130, 180, 200, 0.3)';
            ctx.fillStyle = 'rgba(130, 180, 200, 0.1)';
            ctx.fill();
            ctx.stroke();
        }

        ctx.save();
        // Translate to the center of the tower to scale from the center
        ctx.translate(visualCx, visualCy);

        // Sell Animation: Squish, shrink, and fade
        if (this.isSelling) {
            const progress = this.sellAnimTimer / this.sellAnimDuration;
            const scale = 1 - progress;
            const squishY = 1 - progress * 0.8; // Squishes down
            const squishX = 1 + progress * 0.5; // Bulges out
            ctx.scale(scale * squishX, scale * squishY);
            ctx.globalAlpha = 1 - progress;
        }

        // Landing Squish Animation
        if (this.squashTimer > 0) {
            const progress = this.squashTimer / 15;
            const scaleY = 1 - Math.sin(progress * Math.PI) * 0.3;
            const scaleX = 1 + Math.sin(progress * Math.PI) * 0.3;
            ctx.scale(scaleX, scaleY);
        }


        // Apply body shake
        const bodyShakeX = Math.cos(this.barrelAngle) * this.recoil * -2.2;
        const bodyShakeY = Math.sin(this.barrelAngle) * this.recoil * -2.2;
        ctx.translate(bodyShakeX, bodyShakeY);

        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

        // Draw Auto-Turret Image (always auto-turret)
        const towerBodyImage = this.game.towersImage;
        if (towerBodyImage && towerBodyImage.complete) {
            const sWidth = 137;
            const sHeight = 190;
            const sx = (this.spriteIndex % 4) * sWidth;
            const sy = Math.floor(this.spriteIndex / 4) * sHeight;
            ctx.drawImage(towerBodyImage, sx, sy, sWidth, sHeight, 
                          -sWidth * 0.9 / 2, -sHeight * 0.9 / 2, // Center the image
                          Tower.SPRITE_FRAME_WIDTH * 0.9, Tower.SPRITE_FRAME_HEIGHT * 0.9); // Draw at original scaled size
        }

        // --- Sugar Rush Animation ---
        if (this.game.player.sugarRushTimer > 0) {
            ctx.save();
            // Create a clipping mask from the tower sprite
            ctx.beginPath();
            const sWidth = 137, sHeight = 190;
            const drawWidth = sWidth * 0.9, drawHeight = sHeight * 0.9;
            ctx.rect(-drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
            ctx.clip();

            const waveCount = 3;
            const slowSpeed = 0.05; 
            const colorSpeed = 2; 
            const arcHeight = -10;
            
            for (let i = 0; i < waveCount; i++) {
                const progress = 1 - ((this.game.gameTime * slowSpeed + i * (1 / waveCount)) % 1);
                
                const minY = -drawHeight / 2;
                const maxY = drawHeight / 2;
                const yPos = minY + ((maxY - minY) * progress);
                
                const alpha = Math.sin(progress * Math.PI);
                const hue = (this.game.gameTime * colorSpeed + i * (360 / waveCount)) % 360;
                
                ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${alpha * 0.47})`;
                ctx.lineWidth = 11;

                ctx.beginPath();
                ctx.moveTo(-drawWidth / 2, yPos);
                ctx.quadraticCurveTo(0, yPos - arcHeight, drawWidth / 2, yPos);
                ctx.stroke();
            }
            ctx.restore(); // Restore from clipping mask
        }
        // --- End Sugar Rush ---

        ctx.restore(); // Restore from the main tower body's translation and scaling
        if (this.isPlacing) { return; } // Don't draw arm while falling
        ctx.save(); // A NEW save specifically for the arm
        ctx.translate(visualCx, visualCy - 30); // Translate to the arm's pivot point

        // Apply the same squish/sell animations to the arm
        if (this.isSelling) {
            const progress = this.sellAnimTimer / this.sellAnimDuration;
            const scale = 1 - progress;
            const squishY = 1 - progress * 0.8;
            const squishX = 1 + progress * 0.5;
            ctx.scale(scale * squishX, scale * squishY);
        }
        if (this.squashTimer > 0) {
            const progress = this.squashTimer / 15;
            const scaleY = 1 - Math.sin(progress * Math.PI) * 0.3;
            const scaleX = 1 + Math.sin(progress * Math.PI) * 0.3;
            ctx.scale(scaleX, scaleY);
        }

        ctx.rotate(this.barrelAngle);

        // Apply barrel recoil
        const recoilX = this.recoil * -38;
        ctx.translate(recoilX, 0);

        // Mirror arm if in left half (271 to 89 degrees)
        const isMirrored = Math.cos(this.barrelAngle) < 0;
        
        // Draw Arm Image
        const armImg = this.game.armsImage;
        if (armImg && armImg.complete) {
            const sWidth = 140;
            const sHeight = 58;
            const sx = (this.spriteIndex % 4) * sWidth;
            const sy = Math.floor(this.spriteIndex / 4) * sHeight;
            const armOffsetY = -sHeight / 2; // Arm always centered vertically on pivot

            if (isMirrored) {
                ctx.save(); // Save context before scaling for arm
                ctx.scale(1, -1);
                // After ctx.scale(1, -1), drawing at (0, Y) will map to (0, -Y) in the unflipped space.
                // So to keep its center at (0,0) we still draw at (0, armOffsetY).
                ctx.drawImage(armImg, sx, sy, sWidth, sHeight, 0, armOffsetY, sWidth * 0.75, sHeight * 0.75);
                ctx.restore(); // Restore context after drawing mirrored arm
            } else {
                ctx.drawImage(armImg, sx, sy, sWidth, sHeight, 0, armOffsetY, sWidth * 0.75, sHeight * 0.75);
            }
        }

        // Muzzle Flash
        ctx.fillStyle = (this.cooldown > this.game.stats.fireRate - 3) ? '#e67e22' : 'transparent';
        ctx.beginPath(); ctx.arc(100, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore(); // Restore from the arm's transformations
    }
}
