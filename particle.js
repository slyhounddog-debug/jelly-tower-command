export default class Particle {
    constructor(x, y, color, type = 'spark', lifespan = 1.0, vx = null, vy = null, startRadius = 0, endRadius = 0) {
        this.x = x; this.y = y; this.color = color; this.type = type;

        if (vx === null || vy === null) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (type === 'regen') ? Math.random() * 1 + 0.5 : Math.random() * 3 + 1;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            this.vx = vx;
            this.vy = vy;
        }
        
        this.life = lifespan; // Use custom lifespan
        this.maxLife = lifespan; // Store max life for interpolation
        this.decay = Math.random() * 0.03 + 0.02; // Base decay rate

        if (this.type === 'explosion') {
            this.startRadius = startRadius;
            this.endRadius = endRadius;
            this.currentRadius = startRadius;
            this.decay = 1 / lifespan; // Decay based on custom lifespan
        } else {
            this.size = Math.random() * 5 + 2;
        }
    }
    update(tsf) {
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.life -= this.decay * tsf;

        if (this.type === 'smoke') { this.vx *= 0.95; this.vy -= 0.05 * tsf; this.size += 0.2 * tsf; }
        else if (this.type === 'drip') { this.vy += 0.1 * tsf; this.vx *= 0.9; this.size *= 0.95; }
        else if (this.type === 'heal') { this.y -= 1 * tsf; this.size *= 0.98; }
        else if (this.type === 'explosion') {
            const progress = 1 - (this.life / this.maxLife); // 0 to 1
            this.currentRadius = this.startRadius + (this.endRadius - this.startRadius) * progress;
        }
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        if (this.type === 'spark') ctx.fillRect(this.x, this.y, this.size, this.size);
        else if (this.type === 'explosion') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        else { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1.0;
    }
}