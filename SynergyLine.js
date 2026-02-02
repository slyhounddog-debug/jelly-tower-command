export default class SynergyLine {
    constructor(game, startTower, endTower) {
        this.game = game;
        this.startTower = startTower;
        this.endTower = endTower;
        
        this.life = 80; // Animation duration in frames
        this.maxLife = this.life;
        this.dead = false;

        this.hue = Math.random() * 360; // For color
    }

    update(tsf) {
        this.life -= tsf;
        if (this.life <= 0) {
            this.dead = true;
        }
        this.hue = (this.hue + 2 * tsf) % 360; // Slow color shift
    }

    draw(ctx) {
        if (this.dead || !this.startTower || !this.endTower) return;

        // Calculate a life ratio that goes from 0 -> 1 -> 0 for a smooth fade-in and fade-out
        const progress = 1 - (this.life / this.maxLife);
        const alpha = Math.sin(progress * Math.PI);
        if (alpha <= 0) return;

        const startX = this.startTower.x + this.startTower.width / 2;
        const startY = this.startTower.y + this.startTower.height / 2;
        const endX = this.endTower.x + this.endTower.width / 2;
        const endY = this.endTower.y + this.endTower.height / 2;

        const color = `hsl(${this.hue}, 100%, 80%)`;
        const glowColor = `hsl(${this.hue}, 100%, 70%)`;

        ctx.save();

        // 1. Draw the main glowing line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.globalAlpha = alpha * 0.5; // Base line is more transparent
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 30;
        ctx.stroke();

        // 2. Draw the traveling pulse
        const pulseX = startX + (endX - startX) * progress;
        const pulseY = startY + (endY - startY) * progress;
        
        ctx.globalAlpha = alpha; // Pulse is fully visible
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(pulseX, pulseY, 6, 0, Math.PI * 2); // A small, bright circle
        ctx.fill();

        ctx.restore();
    }
}