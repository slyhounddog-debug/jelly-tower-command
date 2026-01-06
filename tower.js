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
        let targetScale = 1;
        if (this.game.player.isControlling === this) {
            this.barrelAngle = Math.atan2(this.game.mouse.y - (this.y + 12), this.game.mouse.x - (this.x + 23));
            if ((this.game.mouse.isDown || this.game.keys[' ']) && this.cooldown <= 0) { this.shoot(fireRate); this.cooldown = fireRate; }
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
            const sniperCount = this.game.player.getEquippedComponentCount('Sniper');
            if (sniperCount > 0) {
                damage *= (1 + sniperCount * 0.25); // +25% damage per stack
            }
            const projectileSpeed = this.game.stats.projectileSpeed;
            const radius = (this.isAuto ? 7 : 16) + (this.game.stats.damageLvl * 0.1) + (this.game.stats.fireRateLvl * 0.1) + (this.game.stats.rangeLvl * 0.2) + (this.game.stats.critLvl * 0.15);
            
            const freezeFrostingCount = this.game.player.getEquippedComponentCount('Freeze Frosting');
            const popRockCount = this.game.player.getEquippedComponentCount('Pop-Rock Projectiles');
            const bubbleGumCount = this.game.player.getEquippedComponentCount('Bubble Gum Shots');
            const fireDamageCount = this.game.player.getEquippedComponentCount('Fire Damage');
            const chainBounceCount = this.game.player.getEquippedComponentCount('Chain Bounce');

            const projectile = new Projectile(this.game, tx, ty, angle, damage, this.range, { x: cx, y: cy }, projectileSpeed, radius, freezeFrostingCount, popRockCount, bubbleGumCount, fireDamageCount, chainBounceCount);
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
                    if (m.takeDamage(damageDealt)) {
                        // The main loop will handle the missile removal
                    }
                    // Apply knockback
                    m.kbVy += -2;
                    // Create particles
                    this.game.particles.push(new Particle(missileCx, missileCy, '#fff', 'spark'));
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

        // --- BOTTOM SHADOW ---
        const shadowOffset = 5;
        const shadowColor = this.isAuto ? 'rgba(120, 150, 200, 0.5)' : 'rgba(200, 200, 200, 0.5)';
        ctx.fillStyle = shadowColor;
        ctx.beginPath();
        ctx.roundRect(-halfWidth * 1.09, -halfHeight * 1.09 + shadowOffset, this.width * 1.09, this.height * 1.09, 10);
        ctx.fill();

        // Tower Body
        ctx.fillStyle = this.isAuto ? '#a1c4fd' : '#ecf0f1';
        ctx.beginPath(); ctx.roundRect(-halfWidth, -halfHeight, this.width, this.height, 10); ctx.fill();

        const damageLevel = this.game.stats.damageLvl;
        const icingColors = ['#ffc1cc', '#ff99b3', '#ff7399', '#ff4d80', '#ff2666', '#ff004d', '#e60044', '#cc003b', '#b30033', '#99002a', '#800022'];
        const icingColor = icingColors[Math.min(damageLevel, icingColors.length - 1)];

        // Damage particle effect
        if (damageLevel > 0 && Math.random() < damageLevel * 0.05) {
            this.game.particles.push(new Particle(
                this.x + this.width / 2 + (Math.random() - 0.5) * this.width,
                this.y + this.height / 2 + (Math.random() - 0.5) * this.height,
                icingColor,
                'spark'
            ));
        }
		
        // FROSTING LAYER
        ctx.fillStyle = icingColor; // Matching castle frosting color
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

        // Reload Speed Visuals
        const fireRateLevel = this.game.stats.fireRateLvl;
        if (fireRateLevel > 0) {
            const maxLevel = this.game.shopItems.find(item => item.id === 'rate').getLevel().split('/')[1];
            const levelRatio = fireRateLevel / maxLevel;

            // Powdered sugar "steam" effect
            if (Math.random() < levelRatio * 0.3) { // Increased emission rate
                this.game.particles.push(new Particle(
                    this.x + this.width / 2 + (Math.random() - 0.5) * 30,
                    this.y - 15,
                    `rgba(255, 255, 255, ${Math.random() * 0.7 + 0.3})`,
                    'steam'
                ));
            }

            if (fireRateLevel >= 5) {
                // Level 5+: Spinning carousel of wafer pipes
                const numPipes = 6;
                for (let i = 0; i < numPipes; i++) {
                    const angle = (this.game.gameTime / 400) + (i * (Math.PI * 2 / numPipes));
                    const x = Math.cos(angle) * 20;
                    const y = Math.sin(angle) * 7 - 25;
                    ctx.fillStyle = '#d2b48c'; // Wafer color
                    ctx.beginPath();
                    ctx.roundRect(-halfWidth / 2 + x, -halfHeight - 20 + y, 10, 20, 4); // Bigger pipes
                    ctx.fill();
                }
            } else {
                // Level 1-4: Single icing tip
                const numNozzles = fireRateLevel;
                for (let i = 0; i < numNozzles; i++) {
                    ctx.fillStyle = '#c0c0c0'; // Silver
                    ctx.beginPath();
                    ctx.roundRect(-halfWidth / 2 + (i * 12), -halfHeight - 15, 7, 15, 3); // Bigger nozzles
                    ctx.fill();
                }
            }
        }


        const rangeLevel = this.game.stats.rangeLvl;
        if (rangeLevel > 0) {
            ctx.save();
            ctx.translate(0, -halfHeight - 10); // Position on top of the tower

            if (rangeLevel >= 8) {
                // Late: Candy cane antenna
                const antennaHeight = 30;
                ctx.beginPath();
                for (let i = 0; i < antennaHeight; i++) {
                    ctx.strokeStyle = (i % 8 < 4) ? '#ffffff' : '#ff0000';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(0, -i);
                    ctx.lineTo(0, -i - 1);
                    ctx.stroke();
                }
                ctx.lineWidth = 1;

                // Pulsing sugar-ring
                const pulse = (Math.sin(this.game.gameTime / 200) + 1) / 2;
                ctx.fillStyle = `rgba(130, 180, 200, ${0.5 - pulse * 0.4})`; // Make it a fill and subtler
                ctx.beginPath();
                ctx.arc(0, 0, 15 + pulse * 5, 0, Math.PI * 2); // Adjusted size
                ctx.fill();

            } else if (rangeLevel >= 4) {
                // Mid: Rotating stroopwafel radar
                ctx.rotate(this.game.gameTime / 1000);
                ctx.fillStyle = '#d2b48c'; // Stroopwafel color
                ctx.beginPath();
                ctx.arc(0, 0, 20, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // Early: Wafer stick
                ctx.fillStyle = '#d2b48c'; // Wafer color
                ctx.beginPath();
                ctx.roundRect(-15, -5, 30, 10, 4);
                ctx.fill();
            }
            ctx.restore();
        }

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
        ctx.fillStyle = icingColor; // Matching castle frosting color
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


    }
}
