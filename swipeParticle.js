export default class SwipeParticle {
    constructor() {
        this.active = false;
    }

    init(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = Math.random() * 5 + 2;
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 2 - 1;
        this.color = `hsl(${Math.random() * 60 + 200}, 100%, 75%)`;
        this.lifespan = Math.random() * 60 + 30;
        this.life = this.lifespan;
        this.active = true;
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.size = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.color = null; // Reset color
        this.lifespan = 0; // Reset lifespan
        this.life = 0;
    }

    update(tsf) {
        if (!this.active) return;
        this.x += this.speedX * tsf;
        this.y += this.speedY * tsf;
        this.life -= tsf;
        if (this.life <= 0) {
            this.active = false;
        }
        this.size = Math.max(0, this.size - 0.1 * tsf);
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / this.lifespan;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}
