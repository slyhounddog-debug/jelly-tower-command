export default class FrostingParticle {
    constructor(game, x, y, vx, vy, radius, color, lifespan) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        
        // 1. Slightly bigger initial radius
        this.radius = radius * 1.7; 
        
        this.color = color;
        this.lifespan = lifespan;
        this.initialLifespan = lifespan;
        this.gravity = 0.15; // Lowered gravity for a "lighter" cream feel
        this.dragY = 0.95;

        // 2. Track history for the trail
        this.history = [];
        this.maxHistory = 10; // Adjust for longer/shorter trails
    }

    update(tsf) {
        // Store current position before moving
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.maxHistory) this.history.shift();

        this.lifespan -= tsf;
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.vy += this.gravity * tsf;
        this.vy *= this.dragY;

        // 3. Slow down the radius shrinkage so it stays "thick" longer
        this.radius *= 0.99;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.lifespan / this.initialLifespan);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;

        // 4. Draw the Trail (The "Frosting Ribbon")
        if (this.history.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            
            // Current position
            ctx.lineTo(this.x, this.y);
            
            // Set line width to the current radius to make it look like one thick stroke
            ctx.lineWidth = this.radius * 2;
            ctx.stroke();
        }

        // 5. Draw the "Head" of the frosting
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
