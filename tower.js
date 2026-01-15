import BaseStructure from './baseStructure.js';
import Projectile from './projectile.js';
import Particle from './particle.js';

export default class Tower extends BaseStructure {
    constructor(game, x, y, isAuto = false) {
        const size = isAuto ? 46 : 56;
        super(x, y, size - 20, size);
        this.game = game;
        this.isAuto = isAuto;
        this.cooldown = 0;
        this.barrelAngle = -Math.PI / 2;
        this.range = 300;
        this.isAnimating = false;
        this.scale = 2;
        this.recoil = 0;
        const locatedPlatform = this.game.platforms.find(p => p.type === 'cloud' && Math.abs((y + this.height) - p.y) < 15 && (x + this.width / 2) > p.x && (x + this.width / 2) < p.x + p.width);
        this.isOnCloud = !!locatedPlatform;
        this.cloudPlatform = locatedPlatform; // Store the platform object
    }
    update(tsf) {
        const sniperCount = this.game.player.getEquippedComponentCount('Sniper');
        let fireRate = this.isAuto ? this.game.stats.fireRate : this.game.stats.fireRate;
        if (sniperCount > 0) {
            fireRate *= (1 + sniperCount * 0.1); // -10% fire rate per stack means *1.1 for smaller number
        }

        this.recoil *= 0.9;
        this.range = this.isAuto ? this.game.stats.range * 0.5 : this.game.stats.range;
        if (sniperCount > 0) {
            this.range *= (1 + sniperCount * 0.2); // +20% range per stack
        }
        if (this.cooldown > 0) this.cooldown -= tsf;

        this.isAnimating = false;
        let targetScale = 2;
        if (this.game.player.isControlling === this) {
            this.barrelAngle = Math.atan2(this.game.mouse.y - (this.y + 12), this.game.mouse.x - (this.x + 23));
            if ((this.game.mouse.isDown || this.game.keys[' ']) && this.cooldown <= 0) { this.shoot(fireRate); this.cooldown = fireRate; }
            this.isAnimating = true;
            targetScale = 2.4;
        } else if (this.isAuto) {
            let target = null; let minDist = this.range;
            const cx = this.x + 23; const cy = this.y + 12;
            this.game.missiles.forEach(m => {
                const dist = Math.hypot((m.x + m.width / 2) - cx, (m.y + m.height / 2) - cy);
                if (dist < minDist) { minDist = dist; target = m; }
            });
            if (target) {
                this.isAnimating = true;
                if (this.cooldown <= 0) {
                    const projectileSpeed = this.game.stats.projectileSpeed;
                    const dist = Math.hypot(target.x + 15 - cx, target.y + 20 - cy);
                    const time = dist / projectileSpeed;
                    const predY = target.y + 20 + (target.speed * time);
                    this.barrelAngle = Math.atan2(predY - cy, target.x + 15 - cx);
                    this.shoot(fireRate); this.cooldown = fireRate;
                }
            }
        }
        this.scale += (targetScale - this.scale) * 0.1 * tsf;
    }
    shoot(fireRate) {
        this.recoil = 1;
        this.game.shotsFired++;
        this.game.audioManager.playSound('fire');
        const cx = this.x + 23; const cy = this.y + 12;
        
        const splitShotCount = this.game.player.getEquippedComponentCount('Split Shot');
        const numShots = 1 + splitShotCount;
        const spread = numShots > 1 ? 10 * (Math.PI / 180) * splitShotCount : 0; // 10 degrees per stack
        const totalSpread = spread;
        const startAngle = this.barrelAngle - totalSpread / 2;

        for (let i = 0; i < numShots; i++) {
            const angle = startAngle + i * (totalSpread / (numShots > 1 ? numShots - 1 : 1));
            const tx = cx + Math.cos(angle) * 30 * this.scale;
            const ty = cy + Math.sin(angle) * 30 * this.scale;
            let damage = this.isAuto ? this.game.stats.damage * 0.5 : this.game.stats.damage;
            if (this.game.player.sugarRushTimer > 0) {
                damage *= 1.2;
            }
            const sniperCount = this.game.player.getEquippedComponentCount('Sniper');
            if (sniperCount > 0) {
                damage *= (1 + sniperCount * 0.25); // +25% damage per stack
            }
            let projectileSpeed = this.game.stats.projectileSpeed;
            if (this.game.player.sugarRushTimer > 0) {
                projectileSpeed *= 1.2;
            }
            const radius = (this.isAuto ? 7 : 16) + (this.game.stats.damageLvl * 0.1) + (this.game.stats.fireRateLvl * 0.1) + (this.game.stats.rangeLvl * 0.2) + (this.game.stats.critLvl * 0.15);
            
            const freezeFrostingCount = this.game.player.getEquippedComponentCount('Freeze Frosting');
            const popRockCount = this.game.player.getEquippedComponentCount('Pop-Rock Projectiles');
            const bubbleGumCount = this.game.player.getEquippedComponentCount('Bubble Gum Shots');
            const fireDamageCount = this.game.player.getEquippedComponentCount('Fire Damage');
            const chainBounceCount = this.game.player.getEquippedComponentCount('Chain Bounce');

            const projectile = new Projectile(this.game, tx, ty, angle, damage, this.range, { x: cx, y: cy }, projectileSpeed, radius, freezeFrostingCount, popRockCount, bubbleGumCount, fireDamageCount, chainBounceCount, this.isAuto);
            this.game.projectiles.push(projectile);
        }

        // Immediate hit-check for controlled towers
        if (this.game.player.isControlling === this) {
            for (let i = this.game.missiles.length - 1; i >= 0; i--) {
                const m = this.game.missiles[i];
                const missileCx = m.x + m.width / 2;
                const missileCy = m.y + m.height / 2;

                // Check for collision within the "arm radius" around the turret's center (cx, cy)
                if (Math.hypot(missileCx - cx, missileCy - cy) < (30 * this.scale) + m.width / 2) {
                    const damageDealt = Math.min(this.game.projectiles[this.game.projectiles.length-1].hp, m.health);
                    this.game.projectiles[this.game.projectiles.length-1].hp -= damageDealt;
                    if (m.takeDamage(damageDealt, false)) {
                        // The main loop will handle the missile removal
                    }
                    // Apply knockback
                    m.kbVy += -2;
                    // Create particles
                    this.game.particles.push(new Particle(this.game, missileCx, missileCy, '#fff', 'spark'));
                    if (!this.game.projectiles[this.game.projectiles.length-1].hasHit) {
                        this.game.projectiles[this.game.projectiles.length-1].hasHit = true;
                        this.game.shotsHit++;
                    }
                }
            }
        }
    }
    draw(ctx) {
        // Player-controlled radius
        if (this.game.player.isControlling === this) {
            ctx.beginPath(); ctx.arc(this.x + 23, this.y + 12, this.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(130, 180, 200, 0.9)';
            ctx.fillStyle = 'rgba(130, 180, 200, 0.3)';
            ctx.fill();
            ctx.stroke();
        }
        // Always-visible auto-turret radius
        else if (this.isAuto) {
            ctx.beginPath(); ctx.arc(this.x + 23, this.y + 12, this.range, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(130, 180, 200, 0.3)';
            ctx.fillStyle = 'rgba(130, 180, 200, 0.1)';
            ctx.fill();
            ctx.stroke();
        }

        ctx.save();
        // Translate to the center of the tower to scale from the center
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.scale, this.scale);

        // Apply body shake
        const bodyShakeX = Math.cos(this.barrelAngle) * this.recoil * -2.2;
        const bodyShakeY = Math.sin(this.barrelAngle) * this.recoil * -2.2;
        ctx.translate(bodyShakeX, bodyShakeY);

        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

        // --- NEW: Draw Tower or Auto-Turret Image ---
        const towerBodyImage = this.isAuto ? this.game.autoTurretImage : this.game.towerImage;
        if (towerBodyImage && towerBodyImage.complete) {
            ctx.drawImage(towerBodyImage, -halfWidth, -halfHeight - 12, this.width, this.height);
        }
        // --- END NEW ---

        ctx.save();
        ctx.translate(0, -24); // Barrel pivot point relative to tower center
        ctx.rotate(this.barrelAngle);

        // Apply barrel recoil
        const recoilX = this.recoil * -11;
        ctx.translate(recoilX, 0);

        // --- NEW: Draw Arm Image ---
        const armImg = this.game.armImage;
        if (armImg && armImg.complete) {
            // The original rect was at (0, -6.5) with size (28, 13).
            // We draw the new image to match this placement and size.
            ctx.drawImage(armImg, 0, -6.5, 40, 13); // A bit longer arm
        }
        // --- END NEW ---

        // Muzzle Flash
        ctx.fillStyle = (this.cooldown > this.game.stats.fireRate - 3) ? '#e67e22' : 'transparent';
        ctx.beginPath(); ctx.arc(28, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.restore();

        if (this.game.player.isControlling === this && this.game.player.sugarRushTimer > 0) {
            ctx.save();
            
            const animWidth = this.width * this.scale;
            const animHeight = this.height * this.scale;
            const animX = (this.x + this.width / 2) - (animWidth / 2);
            const animY = (this.y + this.height / 2) - (animHeight / 2);

            const towerAnimHeight = animHeight * 0.77;
            const towerAnimStartY = animY + (animHeight * 0.13);
            
            ctx.beginPath();
            ctx.rect(animX, towerAnimStartY, animWidth, towerAnimHeight);
            ctx.clip();
        
            const waveCount = 3;
            const slowSpeed = 0.025; 
            const colorSpeed = 2; 
            const arcHeight = -10;
            
            for (let i = 0; i < waveCount; i++) {
                const progress = 1 - ((this.game.gameTime * slowSpeed + i * (1 / waveCount)) % 1);
                
                const minY = towerAnimStartY;
                const maxY = animY + animHeight;
                const yPos = minY + ((maxY - minY) * progress);
                
                const alpha = Math.sin(progress * Math.PI);
                const hue = (this.game.gameTime * colorSpeed + i * (360 / waveCount)) % 360;
                
                ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${alpha * 0.47})`;
                ctx.lineWidth = 11;
        
                ctx.beginPath();
                ctx.moveTo(animX, yPos);
                ctx.quadraticCurveTo(
                    animX + animWidth / 2, yPos - arcHeight, 
                    animX + animWidth, yPos
                );
                ctx.stroke();
            }
        
            ctx.restore();
        }
    }
}
