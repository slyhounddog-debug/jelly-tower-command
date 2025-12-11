export default class Cloud {
    constructor(game) {
        this.game = game;
        this.x = Math.random() * this.game.width;
        this.y = Math.random() * this.game.height * 0.5;
        this.speed = Math.random() * 0.2 + 0.1;
        this.size = Math.random() * 100 + 100;
    }

    update(tsf) {
        this.x += this.speed * tsf;
        if (this.x > this.game.width + this.size) {
            this.x = -this.size;
        }
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.8, this.y, this.size * 0.8, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 1.6, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}