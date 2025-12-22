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
        const shadowOffset = 10;
        const shadowSizeIncrease = 2; // A more subtle increase

        ctx.save();

        // Draw shadow layer first
        ctx.fillStyle = 'rgba(200, 180, 170, 0.7)'; // Darker peachy shadow color
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.size + shadowOffset, this.size + shadowSizeIncrease, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.8, this.y + this.size * 0.8 + shadowOffset, this.size * 0.8 + shadowSizeIncrease, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 1.6, this.y + this.size + shadowOffset, this.size + shadowSizeIncrease, 0, Math.PI * 2);
        ctx.fill();

        // Draw main cloud layer
        ctx.fillStyle = 'rgba(255, 240, 230, 0.8)'; // Off-white, slightly pink/peach
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.size, this.size, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 0.8, this.y + this.size * 0.8, this.size * 0.8, 0, Math.PI * 2);
        ctx.arc(this.x + this.size * 1.6, this.y + this.size, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}