import Particle from './particle.js';

export default class Projectile {
    constructor(game, x, y, angle, damage, range, origin, speed, radius = 15, freezeFrostingCount = 0, popRockCount = 0, bubbleGumCount = 0, fireDamageCount = 0, gravityPullCount = 0) {
        this.game = game;
        this.x = x; this.y = y; this.damage = damage; this.range = range; this.origin = origin;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.hp = damage; this.dead = false; this.hasHit = false;
        this.rotation = Math.random() * Math.PI * 2; // Start with random rotation
        this.radius = radius;
        this.freezeStacks = freezeFrostingCount;
        this.popRockStacks = popRockCount;
        this.bouncesLeft = bubbleGumCount;
        this.fireDamageCount = fireDamageCount;
        this.gravityPullCount = gravityPullCount;
    }
    update(tsf) {
        this.x += this.vx * tsf; this.y += this.vy * tsf;
        this.rotation += 0.2 * tsf;
        // Use a mix of pink and white particles for the trail
        if (Math.random() < 0.5) { // 20% less particles (on top of previous 33%)
            const trailColor = (Math.random() < 0.5) ? 'rgba(255, 105, 180, 0.7)' : 'rgba(255, 255, 255, 0.7)';
            this.game.particles.push(new Particle(this.x, this.y, trailColor, 'smoke'));
        }

        // Collision detection with missiles
        for (let i = this.game.missiles.length - 1; i >= 0; i--) {
            const m = this.game.missiles[i];
            const dist = Math.hypot(this.x - (m.x + m.width / 2), this.y - (m.y + m.height / 2));
            if (dist < this.radius + m.width / 2) { // Simplified collision
                // Apply Pop-Rock Projectiles effect on impact
                if (this.popRockStacks > 0) {
                    this.createExplosion();
                }

                // Apply Fire Damage effect
                if (this.fireDamageCount > 0) {
                    m.applyFire(this.damage, this.fireDamageCount);
                }

                // Apply Freeze Frosting effect
                if (this.freezeStacks > 0) {
                    m.applySlow(5 * 60, 0.1 * this.freezeStacks); // 5 seconds duration, 10% slow per stack
                }

                // Apply Gravity Pull effect
                if (this.gravityPullCount > 0) {
                    m.kbVy += (this.gravityPullCount * 2); // Simple downward pull
                }

                if (m.takeDamage(this.hp)) {
                    // Missile is dead, main loop will remove it
                }
                this.hp -= m.maxHealth; // Reduce projectile HP by missile health
                this.hasHit = true;
                this.game.shotsHit++;

                if (this.hp <= 0) { // Projectile runs out of damage or pierces
                    this.dead = true;
                    break;
                }
            }
        }

        // Check if out of range
        if (Math.hypot(this.x - this.origin.x, this.y - this.origin.y) > this.range) {
            if (this.bouncesLeft > 0 && !this.dead) { // Only bounce if not already dead from damage
                this.bouncesLeft--;
                
                // Add particles for bounce
                for(let i = 0; i < 5; i++) {
                    this.game.particles.push(new Particle(this.x, this.y, 'rgba(255, 255, 255, 0.8)', 'spark'));
                }
                this.game.audioManager.playSound('pop'); // Bounce sound

                // Invert velocity
                this.vx *= -1;
                this.vy *= -1;

                // Add random angle change to make bounces less predictable
                const currentAngle = Math.atan2(this.vy, this.vx);
                const randomAngle = (Math.random() - 0.5) * (Math.PI / 4); // +/- 22.5 degrees
                const speed = Math.hypot(this.vx, this.vy);
                this.vx = Math.cos(currentAngle + randomAngle) * speed;
                this.vy = Math.sin(currentAngle + randomAngle) * speed;
                
                // Reset origin to current position for next bounce's range check
                this.origin.x = this.x;
                this.origin.y = this.y;

            } else {
                this.dead = true;
            }
        }
    }

    createExplosion() {
        if (this.popRockStacks <= 0) return;

        let explosionRadius = 20; // Base radius for 28px diameter
        explosionRadius *= (1 + this.popRockStacks * 0.5); // 50% area increase per stack
        
        const explosionDamage = this.damage * 0.5;

        this.game.missiles.forEach(m => {
            const dist = Math.hypot(this.x - (m.x + m.width / 2), this.y - (m.y + m.height / 2));
            if (dist < explosionRadius + m.width / 2) {
                if (m.takeDamage(explosionDamage)) {
                    // a bit of a hack to get the index.
                    const index = this.game.missiles.indexOf(m);
                    if (index > -1) {
                        m.kill(index);
                    }
                }
            }
        });

        // Visual effect
        for (let i = 0; i < this.popRockStacks * 10; i++) {
            this.game.particles.push(new Particle(this.x, this.y, 'rgba(255, 105, 180, 0.9)', 'spark'));
        }
        this.game.screenShake.trigger(3 * this.popRockStacks, 10);
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
