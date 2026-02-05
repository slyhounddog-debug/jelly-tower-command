import Particle from './particle.js';

const LICK_BASE_LIFESPAN = 30 * 1.33; // ~0.665 seconds at 60 FPS

export default class WaveAttack {
    constructor() {
        // Parameterless constructor for pooling
        this.active = false;
    }

    init(game, x, y, angle, damageMultiplier = 1, playerVx = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = Math.abs(playerVx) * .8; // 10% faster than player's post-dash velocity
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.lifespan = LICK_BASE_LIFESPAN;
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
        this.active = true;
    }

    reset() {
        this.active = false;
        this.game = null;
        this.x = 0; this.y = 0; this.angle = 0;
        this.speed = 0; this.vx = 0; this.vy = 0;
        this.lifespan = 0;
        this.arcs = [];
        this.hitEnemies = [];
        this.damageMultiplier = 0;
    }

    update(tsf) {
        if (!this.active) return;

        this.lifespan -= tsf;
        if (this.lifespan <= 0) {
            this.game.waveAttackPool.returnToPool(this);
            return;
        }

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;

        // Collision detection
        for (const type in this.game.enemyPools) {
            this.game.enemyPools[type].forEach(m => {
                if (!m.active || this.hitEnemies.includes(m)) return;

                const dist = Math.hypot(this.x - (m.x + m.width / 2), this.y - (m.y + m.height / 2));
                if (dist < this.arcs[this.arcs.length - 1].radius + m.width / 2) {
                    m.takeDamage(this.game.stats.lickDamage * this.damageMultiplier, false, this);
                    m.kbVy = -this.game.stats.lickKnockback * 0.15; // Half knockback
                    this.hitEnemies.push(m);
                }
            });
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.globalAlpha = this.lifespan / LICK_BASE_LIFESPAN; // Use base lifespan for alpha calculation
        
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
