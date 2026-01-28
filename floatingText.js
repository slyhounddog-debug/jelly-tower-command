export default class FloatingText {
    constructor(game, x, y, text, color = 'white', sizeIncrease = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.text = text;
        this.life = 60; 
        this.opacity = 1;
        this.color = color;
        this.sizeIncrease = sizeIncrease;
        
        // Physics for the "Pop" effect
        this.vx = (Math.random() - 0.5) * 2; // Random left/right burst
        this.vy = -5 - Math.random() * 3;    // Initial upward burst
        this.gravity = 0.6;                  // Pulls the number down slightly
        this.scale = 1.6;                    // Start big for "impact"
    }

    update(tsf) {
        // Apply physics
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.vy += this.gravity * tsf;
        
        this.life -= 2 * tsf;
        if (this.life < 0) this.life = 0;
        this.opacity = this.life / 60;
        
        // Shrink scale back to normal over time
        if (this.scale > 1) this.scale -= 0.01 * tsf;
    }

    draw(ctx) {
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
        ctx.strokeText(this.text, 0, 0);

        // 2. Draw main color
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, 0, 0);

        ctx.restore();
    }
}