import BaseStructure from './baseStructure.js';
import Projectile from './projectile.js';
import Particle from './particle.js';

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
        this.drawOffsetX = (this.width + 80 - Tower.SPRITE_FRAME_WIDTH * 0.9) / 2;
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
    }
    update(tsf) {
        // Player-controlled range indicator logic and player control checks removed
        
        const sniperCount = this.game.player.getEquippedComponentCount('Sniper');
        let fireRate = this.game.stats.fireRate; // No longer checking isAuto here for fireRate
        if (sniperCount > 0) {
            fireRate *= (1 + sniperCount * 0.1); 
        }

        this.recoil *= 0.9;
        this.range = this.game.stats.range * 0.5; // Always auto-turret range
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

        this.game.missiles.forEach(m => {
            const dist = Math.hypot((m.x + m.width / 2) - (cx + this.drawOffsetX), (m.y + m.height / 2) - (cy + this.drawOffsetY - 30));
            if (dist < minDist) { minDist = dist; target = m; }
        });
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
    }
    shoot(fireRate) {
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

        for (let i = 0; i < numShots; i++) {
            const angle = startAngle + i * (totalSpread / (numShots > 1 ? numShots - 1 : 1));
            const tx = visualCx + Math.cos(angle) * 30;
            const ty = visualCy + Math.sin(angle) * 30;
            let damage = this.game.stats.damage * 0.5; // Always auto-turret damage
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
            const radius = 15 //+ (this.game.stats.damageLvl * 0.1) + (this.game.stats.fireRateLvl * 0.1) + (this.game.stats.rangeLvl * 0.2); // Always auto-turret radius
            
            const gummyImpactCount = this.game.player.getEquippedComponentCount('Gummy Impact');
            const popRockCount = this.game.player.getEquippedComponentCount('Pop-Rock Projectiles');
            const bubbleGumCount = this.game.player.getEquippedComponentCount('Bubble Gum Shots');
            const fireDamageCount = this.game.player.getEquippedComponentCount('Fire Damage');
            const chainBounceCount = this.game.player.getEquippedComponentCount('Chain Bounce');

            const projectile = new Projectile(this.game, tx, ty, angle, damage, this.range, { x: visualCx, y: visualCy }, projectileSpeed, radius, gummyImpactCount, popRockCount, bubbleGumCount, fireDamageCount, chainBounceCount, true); // Always auto-turret
            this.game.projectiles.push(projectile);
        }
    }
    draw(ctx) {
        const visualCx = this.x + this.width / 2 + this.drawOffsetX;
        const visualCy = this.y + this.height / 2 + this.drawOffsetY;

        // Always-visible auto-turret radius
        ctx.beginPath(); ctx.arc(visualCx, visualCy - 30, this.range, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(130, 180, 200, 0.3)';
        ctx.fillStyle = 'rgba(130, 180, 200, 0.1)';
        ctx.fill();
        ctx.stroke();

        ctx.save();
        // Translate to the center of the tower to scale from the center
        ctx.translate(visualCx, visualCy);

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

        ctx.save();
        ctx.translate(0, -30); // Barrel pivot point relative to tower center
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
        ctx.restore();

        ctx.restore();
    }
}
