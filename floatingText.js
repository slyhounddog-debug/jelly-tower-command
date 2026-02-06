export default class FloatingText {
    constructor() {
        this.active = false;
    }

    init(game, x, y, text, color = 'white', sizeIncrease = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.contentString = text;
        this.life = 60; 
        this.opacity = 1;
        this.color = color;
        this.sizeIncrease = sizeIncrease;
        
        // Physics for the "Pop" effect
        this.vx = (Math.random() - 0.5) * 2; // Random left/right burst
        this.vy = -5 - Math.random() * 3;    // Initial upward burst
        this.gravity = 0.6;                  // Pulls the number down slightly
        this.scale = 1.6;                    // Start big for "impact"
        this.active = true;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.contentString = '';
        this.life = 0;
        this.opacity = 0;
        this.color = 'white'; // Default color
        this.sizeIncrease = 0;
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0;
        this.scale = 1.0; // Reset to default scale
        this.active = false;
    }

    update(tsf) {
        if (!this.active) return;
        // Apply physics
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.vy += this.gravity * tsf;
        
        this.life -= 2 * tsf;
        if (this.life <= 0) {
            this.reset();
            return;
        }
        this.opacity = this.life / 60;
        
        // Shrink scale back to normal over time
        if (this.scale > 1) this.scale -= 0.01 * tsf;
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        
        // Apply scaling for the "impact" look
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);

        ctx.font = `bold ${28 + this.sizeIncrease}px 'VT323'`;
        ctx.textAlign = 'center';

        // 1. Draw thick outer stroke for readability (The "Gamey" look)
        ctx.strokeStyle = '#0c0202ff';
        ctx.lineWidth = 1;
        ctx.lineJoin = 'round';
        ctx.strokeText(this.contentString, 0, 0);

        // 2. Draw main color
        ctx.fillStyle = this.color;
        ctx.fillText(this.contentString, 0, 0);

        ctx.restore();
    }
}