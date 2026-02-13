export default class TaffySparkParticle {
    constructor() {
        this.active = false;
    }

    init(game, x, y, color, size, vx, vy, lifespan) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.lifespan = lifespan; // in frames
        this.maxLifespan = lifespan;
        this.alpha = 1;
        this.active = true;
    }

    reset() {
        this.active = false;
        this.game = null;
        this.x = 0; this.y = 0;
        this.color = ''; this.size = 0;
        this.vx = 0; this.vy = 0;
        this.lifespan = 0; this.maxLifespan = 0;
        this.alpha = 1;
    }

    update(tsf) {
        if (!this.active) return;

        this.lifespan -= tsf;
        if (this.lifespan <= 0) {
            this.game.taffySparkParticlePool.returnToPool(this);
            return;
        }

        // Apply drag (slowing over time)
        this.vx *= Math.pow(0.9, tsf);
        this.vy *= Math.pow(0.9, tsf);

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;

        // Fade out
        this.alpha = this.lifespan / this.maxLifespan;

        // Off-screen check for returning particles to pool
        const screenMargin = 100; // Pixels outside screen bounds
        if (this.x < -screenMargin || this.x > this.game.width + screenMargin ||
            this.y < -screenMargin || this.y > this.game.height + screenMargin) {
            this.active = false;
            if (this.game && this.game.taffySparkParticlePool) { // Use its own pool
                this.game.taffySparkParticlePool.returnToPool(this);
            }
            return; // Immediately return from update, as it's now pooled
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
