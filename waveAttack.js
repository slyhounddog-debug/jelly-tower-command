import Particle from './particle.js';

export default class WaveAttack {
    constructor(game, x, y, angle, damageMultiplier = 1, playerVx = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = Math.abs(playerVx) * .8; // 10% faster than player's post-dash velocity
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.lifespan = 30 * 1.33; // 0.5 seconds * 1.33 = ~0.665 seconds
        this.arcs = [];
        this.hitEnemies = [];
        this.damageMultiplier = damageMultiplier;

        // Create multiple arcs
        for (let i = 0; i < 5; i++) {
            this.arcs.push({
                radius: (20 + i * 15) * 1.5, // 50% bigger
                width: (5 + Math.random() * 5) * 1.5, // 50% bigger
                color: Math.random() > 0.5 ? 'white' : 'lightblue',
                angleOffset: (Math.random() - 0.5) * 0.2
            });
        }
    }

    update(tsf) {
        this.lifespan -= tsf;
        this.x += Math.cos(this.angle) * this.speed * tsf;
        this.y += Math.sin(this.angle) * this.speed * tsf;

        // Collision detection
        this.game.missiles.forEach(m => {
            if (this.hitEnemies.includes(m)) return;

            const dist = Math.hypot(this.x - (m.x + m.width / 2), this.y - (m.y + m.height / 2));
            if (dist < this.arcs[this.arcs.length - 1].radius + m.width / 2) {
                m.takeDamage(this.game.stats.lickDamage * this.damageMultiplier, false, this);
                m.kbVy = -this.game.stats.lickKnockback * 0.15; // Half knockback
                this.hitEnemies.push(m);
            }
        });
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.lifespan / 30;
        
        this.arcs.forEach(arc => {
            ctx.beginPath();
            ctx.arc(this.x, this.y, arc.radius, this.angle - Math.PI / 4 + arc.angleOffset, this.angle + Math.PI / 4 + arc.angleOffset);
            ctx.strokeStyle = arc.color;
            ctx.lineWidth = arc.width;
            ctx.stroke();
        });

        ctx.restore();
    }
}
