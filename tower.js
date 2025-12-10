import BaseStructure from './baseStructure.js';
import Projectile from './projectile.js';
import Particle from './particle.js';

export default class Tower extends BaseStructure {
    constructor(game, x, y, isAuto = false) {
        const size = isAuto ? 46 : 55.2;
        super(x, y, size, size);
        this.game = game;
        this.isAuto = isAuto;
        this.cooldown = 0;
        this.barrelAngle = -Math.PI / 2;
        this.range = 300;
        this.isAnimating = false;
        this.scale = 1;
        this.recoil = 0;
        const locatedPlatform = this.game.platforms.find(p => p.type === 'cloud' && Math.abs((y + this.height) - p.y) < 15 && (x + this.width / 2) > p.x && (x + this.width / 2) < p.x + p.width);
        this.isOnCloud = !!locatedPlatform;
        this.cloudPlatform = locatedPlatform; // Store the platform object
    }
    update(tsf) {
        this.recoil *= 0.9;
        this.range = this.isAuto ? this.game.stats.range * 0.5 : this.game.stats.range;
        if (this.cooldown > 0) this.cooldown -= tsf;

        this.isAnimating = false;
        let targetScale = 1;
        if (this.game.player.isControlling === this) {
            this.barrelAngle = Math.atan2(this.game.mouse.y - (this.y + 12), this.game.mouse.x - (this.x + 23));
            if ((this.game.mouse.isDown || this.game.keys[' ']) && this.cooldown <= 0) { this.shoot(); this.cooldown = this.game.stats.fireRate; }
            this.isAnimating = true;
            targetScale = 1.25;
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
                    this.shoot(); this.cooldown = this.game.stats.fireRate;
                }
            }
        }
        this.scale += (targetScale - this.scale) * 0.1 * tsf;
    }
    shoot() {
        this.recoil = 1;
        this.game.shotsFired++;
        const cx = this.x + 23; const cy = this.y + 12;
        const tx = cx + Math.cos(this.barrelAngle) * 30 * this.scale;
        const ty = cy + Math.sin(this.barrelAngle) * 30 * this.scale;
        const damage = this.isAuto ? this.game.stats.damage * 0.5 : this.game.stats.damage;
        const projectileSpeed = this.game.stats.projectileSpeed; // get the speed
        const radius = this.isAuto ? 9 : 15;
        const projectile = new Projectile(this.game, tx, ty, this.barrelAngle, damage, this.range, { x: cx, y: cy }, projectileSpeed, radius); // pass it
        this.game.projectiles.push(projectile);

        // Immediate hit-check for controlled towers
        if (this.game.player.isControlling === this) {
            for (let i = this.game.missiles.length - 1; i >= 0; i--) {
                const m = this.game.missiles[i];
                const missileCx = m.x + m.width / 2;
                const missileCy = m.y + m.height / 2;

                // Check for collision within the "arm radius" around the turret's center (cx, cy)
                if (Math.hypot(missileCx - cx, missileCy - cy) < (30 * this.scale) + m.width / 2) {
                    const damageDealt = Math.min(projectile.hp, m.health);
                    projectile.hp -= damageDealt;
                    if (m.takeDamage(damageDealt)) {
                        // The main loop will handle the missile removal
                    }
                    // Apply knockback
                    m.kbVy = -2;
                    // Create particles
                    this.game.particles.push(new Particle(missileCx, missileCy, '#fff', 'spark'));
                    if (!projectile.hasHit) {
                        projectile.hasHit = true;
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
            ctx.strokeStyle = 'rgba(130, 180, 200, 0.3)'; // Decreased from 0.45
            ctx.fillStyle = 'rgba(130, 180, 200, 0.1)'; // Decreased from 0.15
            ctx.fill();
            ctx.stroke();
        }

        ctx.save();
        // Translate to the center of the tower to scale from the center
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.scale, this.scale);

        // Apply body shake
        const bodyShakeX = Math.cos(this.barrelAngle) * this.recoil * -2.2; // 10% more
        const bodyShakeY = Math.sin(this.barrelAngle) * this.recoil * -2.2; // 10% more
        ctx.translate(bodyShakeX, bodyShakeY);

        // Now draw everything relative to the center
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;

        // Shadow
        if (this.isAuto) {
            ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
        }
        // Tower Body
        ctx.fillStyle = this.isAuto ? '#a1c4fd' : '#ecf0f1';
        ctx.beginPath(); ctx.roundRect(-halfWidth, -halfHeight, this.width, this.height, 10); ctx.fill();

        // FROSTING LAYER
        ctx.fillStyle = '#f0a9bb'; // Matching castle frosting color
        ctx.beginPath();
        let startY = -halfHeight + 5;
        ctx.moveTo(-halfWidth, startY);
        let numDrips = 4;
        for (let i = 0; i < numDrips; i++) {
            let x1 = -halfWidth + (i / numDrips) * this.width;
            let x2 = -halfWidth + ((i + 0.5) / numDrips) * this.width;
            let x3 = -halfWidth + ((i + 1) / numDrips) * this.width; // Corrected typo here

            let staticDrip = (Math.sin((this.x + i) * 10) + 1) * 5;
            let animatedDrip = 0;
            if (this.isAnimating) {
                animatedDrip = (Math.sin(this.game.gameTime / 36 + i * (Math.PI / 2)) + 1) * 21; // Reverted to original tower animation
            }
            let dripY = startY + 10 + staticDrip + animatedDrip;

            ctx.lineTo(x1, startY);
            ctx.quadraticCurveTo(x2, dripY, x3, startY);
        }
        ctx.lineTo(halfWidth, startY);
        ctx.lineTo(halfWidth, -halfHeight);
        ctx.lineTo(-halfWidth, -halfHeight);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        ctx.save();
        ctx.translate(0, -11); // Barrel pivot point relative to tower center
        ctx.rotate(this.barrelAngle);

        // Apply barrel recoil
        const recoilX = this.recoil * -11; // 10% more
        const scaleX = 1 - this.recoil * 0.22; // 10% more
        const scaleY = 1 + this.recoil * 0.22; // 10% more
        ctx.translate(recoilX, 0);
        ctx.scale(scaleX, scaleY);


        // Barrel Gradient
        const gradient = ctx.createLinearGradient(0, 0, 28, 0);
        gradient.addColorStop(0, 'lightblue');
        gradient.addColorStop(1, 'lightpink');
        ctx.fillStyle = gradient;
        ctx.beginPath(); ctx.roundRect(0, -6.5, 28, 13, 5); ctx.fill();

        // BARREL FROSTING
        ctx.fillStyle = '#f0a9bb'; // Matching castle frosting color
        ctx.beginPath();
        let barrelFrostingY = -6.5 + 2; // Start a bit lower
        ctx.moveTo(0, barrelFrostingY);
        let numDripsBarrel = 2;
        for (let i = 0; i < numDripsBarrel; i++) {
            let x1 = (i / numDripsBarrel) * 28;
            let x2 = ((i + 0.5) / numDripsBarrel) * 28;
            let x3 = ((i + 1) / numDripsBarrel) * 28;

            let staticDrip = (Math.sin((this.x + i * 2) * 15) + 1) * 2;
            let animatedDrip = 0;
            if (this.isAnimating) {
                animatedDrip = (Math.sin(this.game.gameTime / 36 + i * Math.PI) + 1) * 3; // Reverted to original barrel animation
            }
            let dripY = barrelFrostingY + staticDrip + animatedDrip;

            ctx.lineTo(x1, barrelFrostingY);
            ctx.quadraticCurveTo(x2, dripY, x3, barrelFrostingY);
        }
        ctx.lineTo(28, barrelFrostingY);
        ctx.lineTo(28, -6.5);
        ctx.lineTo(0, -6.5);
        ctx.closePath();
        ctx.fill();


        ctx.fillStyle = (this.cooldown > this.game.stats.fireRate - 3) ? '#e67e22' : 'transparent';
        ctx.beginPath(); ctx.arc(28, 0, 10, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        ctx.restore();

        // Draw the NON-SCALING cloud effect here
        if (this.isOnCloud && this.cloudPlatform) {
            const p = this.cloudPlatform;
            const pink = [255, 182, 193]; // Lighter Pastel Pink
            const blue = [135, 206, 250]; // Light Sky Blue
            const ratio = (p.y - (this.game.height - 1100)) / ((this.game.height - 250) - (this.game.height - 1100));
            const invRatio = 1 - Math.max(0, Math.min(1, ratio));

            const r = Math.floor(pink[0] * (1 - invRatio) + blue[0] * invRatio);
            const g = Math.floor(pink[1] * (1 - invRatio) + blue[1] * invRatio);
            const b = Math.floor(pink[2] * (1 - invRatio) + blue[2] * invRatio);
            const cloudColor = `rgba(${r}, ${g}, ${b}, 0.7)`;

            ctx.fillStyle = cloudColor;

            const centerX = this.x + this.width / 2;
            const bottomY = this.y + this.height;

            // Draw overlapping circles to create a fluffy cloud effect at the base
            ctx.beginPath();
            ctx.arc(centerX - (15 * (this.width / 46)), bottomY + (5 * (this.height / 46)), (25 * (this.width / 46)), 0, Math.PI * 2);
            ctx.arc(centerX + (15 * (this.width / 46)), bottomY + (5 * (this.height / 46)), (25 * (this.width / 46)), 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
