import Particle from './particle.js';
import { calculateChainBounceDamage } from './utils.js';

export default class Projectile {
    constructor(game, x, y, angle, damage, range, origin, speed, radius = 15, gummyImpactCount = 0, popRockCount = 0, bubbleGumCount = 0, fireDamageCount = 0, chainBounceCount = 0, isAutoTurret = false, isCrit = false) {
        this.game = game;
        this.x = x; this.y = y; this.damage = damage; this.range = range; this.origin = origin;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.angle = angle;
        this.hp = damage; this.dead = false; this.hasHit = false;
        this.rotation = Math.random() * Math.PI * 2; // Start with random rotation
        this.radius = radius;
        this.gummyImpactStacks = gummyImpactCount;
        this.popRockStacks = popRockCount;
        this.bouncesLeft = bubbleGumCount;
        this.fireDamageCount = fireDamageCount;
        this.chainBounceCount = chainBounceCount;
        this.isAutoTurret = isAutoTurret;
        this.isCrit = isCrit;
        this.bounceDamageFalloff = calculateChainBounceDamage(this.chainBounceCount);
        this.hitEnemies = [];
        this.hasHitBoss = false;
        this.hasHitBoss = false; // ADDED THIS LINE
    }
    update(tsf) {
        this.x += this.vx * tsf; this.y += this.vy * tsf;
        this.rotation += 0.2 * tsf;

        let particleChance = 0.15;
        if (this.game.player.getEquippedComponentCount('Split Shot') > 0 || this.game.player.getEquippedComponentCount('Bubble Gum Shots') > 0) {
            particleChance = 0.05;
        }
        if (this.isAutoTurret) {
            particleChance /= 2;
        }

        if (Math.random() < particleChance) {
            const trailColor = (Math.random() < 0.5) ? 'rgba(255, 105, 180, 0.7)' : 'rgba(255, 255, 255, 0.7)';
            this.game.particles.push(new Particle(this.game, this.x, this.y, trailColor, 'smoke'));
        }

        // Collision detection with missiles
        let hitSomething = false;
        const allEnemies = [...this.game.missiles];
        if (this.game.boss) {
            allEnemies.push(this.game.boss);
        }

        for (let i = allEnemies.length - 1; i >= 0; i--) {
            const m = allEnemies[i];
            if (this.hitEnemies.includes(m)) continue;

            const dist = Math.hypot(this.x - (m.x + m.width / 2), this.y - (m.y + m.height / 2));
            if (dist < this.radius + m.width / 2) { // Simplified collision
                hitSomething = true;
                let damage = this.damage;
                if (this.chainBounceCount > 0 && this.hitEnemies.length < this.bounceDamageFalloff.length) {
                    damage *= this.bounceDamageFalloff[this.hitEnemies.length];
                }

                if (this.popRockStacks > 0) this.createExplosion();
                if (this.fireDamageCount > 0) m.applyFire(damage, this.fireDamageCount);
                if (this.gummyImpactStacks > 0) {
                    m.kbVy -= this.game.stats.lickKnockback * 0.1 * this.gummyImpactStacks;
                }
                
                if (this.popRockStacks <= 0) {
                    if (m.takeDamage(damage, this.isCrit, this)) {}
                }
                this.hitEnemies.push(m);
                this.hasHit = true;
                this.game.shotsHit++;

                if (this.chainBounceCount > 0 && this.hitEnemies.length <= this.chainBounceCount) {
                    let closestEnemy = null;
                    let minDistance = Infinity;
                    for (const enemy of allEnemies) {
                        if (!this.hitEnemies.includes(enemy)) {
                            const distance = Math.hypot(this.x - enemy.x, this.y - enemy.y);
                            if (distance < minDistance) {
                                minDistance = distance;
                                closestEnemy = enemy;
                            }
                        }
                    }

                    if (closestEnemy) {
                        const angle = Math.atan2(closestEnemy.y - this.y, closestEnemy.x - this.x);
                        const speed = Math.hypot(this.vx, this.vy);
                        this.vx = Math.cos(angle) * speed;
                        this.vy = Math.sin(angle) * speed;
                        for (let j = 0; j < 10; j++) {
                            this.game.particles.push(new Particle(this.game, this.x, this.y, 'lightblue', 'spark'));
                            this.game.particles.push(new Particle(this.game, this.x, this.y, 'darkblue', 'spark'));
                        }
                    } else {
                        this.dead = true;
                    }
                } else {
                    this.hp -= m.maxHealth;
                    if (this.hp <= 0) this.dead = true;
                }
                if(this.dead) break;
            }
        }

        // Wall and Ground Collision for Bubblegum Shots
        if (this.bouncesLeft > 0) {
            let bounced = false;
            // Wall bounce
            if ((this.vx < 0 && this.x < this.radius) || (this.vx > 0 && this.x > this.game.width - this.radius)) {
                this.vx *= -1;
                bounced = true;
            }

            // Ground bounce
            this.game.platforms.forEach(p => {
                if (p.type === 'ground' && this.vy > 0 && this.y + this.radius > p.y) {
                    this.vy *= -1;
                    this.y = p.y - this.radius;
                    bounced = true;
                }
            });

            if (bounced) {
                this.bouncesLeft--;
                this.game.audioManager.playSound('pop');
                for(let i = 0; i < 5; i++) {
                    this.game.particles.push(new Particle(this.game, this.x, this.y, 'rgba(255, 192, 203, 0.8)', 'spark'));
                }
            }
        }

        // Check if out of range OR off screen
        const outOfRange = Math.hypot(this.x - this.origin.x, this.y - this.origin.y) > this.range;
        const offScreen = this.y > this.game.PLAYABLE_AREA_HEIGHT;

        if ((outOfRange && this.bouncesLeft <= 0) || offScreen) {
            this.dead = true;
        }
    }

    createExplosion() {
        if (this.popRockStacks <= 0) return;

        let multiplier = 3;
        if (this.popRockStacks > 1) {
            multiplier = 3 * Math.pow(1.5, this.popRockStacks - 1);
        }

        const explosionRadius = this.radius * multiplier;
        const explosionDamage = this.damage * 0.5;

        const allEnemies = [...this.game.missiles];
        if (this.game.boss) {
            allEnemies.push(this.game.boss);
        }

        allEnemies.forEach(m => {
            if (m.dead) return;
            const dist = Math.hypot(this.x - (m.x + m.width / 2), this.y - (m.y + m.height / 2));
            if (dist < explosionRadius + m.width / 2) {
                if (m.takeDamage(explosionDamage, false, this)) {
                    m.kill();
                }
            }
        });

        // Visual effect: one large expanding circle
        const explosionColors = ['rgba(255, 140, 0, 0.6)', 'rgba(255, 69, 0, 0.6)', 'rgba(255, 215, 0, 0.6)', 'rgba(139, 69, 19, 0.6)'];
        const color = explosionColors[Math.floor(Math.random() * explosionColors.length)];
        this.game.particles.push(new Particle(this.game, this.x, this.y, color, 'explosion', 0.5, 0, 0, 0, explosionRadius));

        // Visual effect: multiple small circles
        for (let i = 0; i < 20 * this.popRockStacks; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * explosionRadius;
            const particleX = this.x + Math.cos(angle) * distance;
            const particleY = this.y + Math.sin(angle) * distance;
            const sparkColor = explosionColors[Math.floor(Math.random() * explosionColors.length)];
            this.game.particles.push(new Particle(this.game, particleX, particleY, sparkColor, 'spark', 0.5));
        }

        this.game.screenShake.trigger(2 * this.popRockStacks, 10);
        this.game.audioManager.playSound('pop');
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Base white circle
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Stripes
        const numStripes = 4; // 2 red, 2 pink
        const stripeAngle = Math.PI / 8; // Width of stripe
        for (let i = 0; i < numStripes; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#e74c3c' : '#ff9ff3'; // Alternate red/pink
            const angle = (i / numStripes) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.radius, angle, angle + stripeAngle);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
