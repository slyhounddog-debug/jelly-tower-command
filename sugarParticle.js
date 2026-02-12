// JellyTowerCommand/sugarParticle.js
export default class SugarParticle {
    constructor() {
        this.active = false;
        this.game = null;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.color = 'rgba(255, 255, 255, 0.8)'; // Default white for sugar
        this.size = 0;
        this.life = 0;
        this.maxLife = 0;
        this.decay = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
    }

    init(game, x, y, options = {}) {
        this.game = game;
        this.x = x;
        this.y = y;

        // Options for customization
        this.color = options.color || 'rgba(255, 255, 255, 0.8)';
        this.size = options.size || (Math.random() * 3 + 1); // Random size between 1 and 4
        this.maxLife = options.lifespan || (Math.random() * 0.8 + 0.7); // Lifespan between 0.7 and 1.5 seconds
        this.life = this.maxLife;
        this.decay = 1 / (this.maxLife * 60); // Assuming 60 updates per second

        // Random velocity to fly outward
        const angle = Math.random() * Math.PI * 2;
        const speed = options.speed || (Math.random() * 3 + 1); // Speed between 1 and 4
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.2; // Rotation speed between -0.1 and 0.1

        this.active = true;
    }

    reset() {
        this.active = false;
        this.game = null;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.color = 'rgba(255, 255, 255, 0.8)';
        this.size = 0;
        this.life = 0;
        this.maxLife = 0;
        this.decay = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
    }

    update(tsf) {
        if (!this.active) return;

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.vx *= 0.98; // Apply some drag
        this.vy *= 0.98;
        this.vy += 0.05 * tsf; // Slight gravity effect

        this.rotation += this.rotationSpeed * tsf;

        this.life -= this.decay * tsf;

        if (this.life <= 0) {
            this.active = false;
            // The pool that manages this particle will call its reset method
        }
    }

    draw(ctx) {
        if (!this.active) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife); // Fade out

        ctx.fillStyle = this.color;
        ctx.beginPath();
        // Draw a simple sugar crystal shape (e.g., a small diamond or star)
        // For simplicity, starting with a circle, could make it more complex later
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
