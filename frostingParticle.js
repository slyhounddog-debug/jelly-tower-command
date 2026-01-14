export default class FrostingParticle {
    constructor(game, x, y, vx, vy, radius, color, lifespan) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.color = color;
        this.lifespan = lifespan;
        this.initialLifespan = lifespan;
        this.gravity = 0.3;
        this.dragY = 0.95; // High vertical drag
    }

    update(tsf) {
        this.lifespan -= tsf;
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.vy += this.gravity * tsf;
        this.vy *= this.dragY;
        this.radius *= 0.98;
    }

    draw(ctx) {
        const alpha = this.lifespan / this.initialLifespan;
        ctx.save();
        ctx.globalAlpha = alpha > 0 ? alpha : 0;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
