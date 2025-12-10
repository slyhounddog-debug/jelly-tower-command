export default class Particle {
    constructor(x, y, color, type = 'spark') {
        this.x = x; this.y = y; this.color = color; this.type = type;
        const angle = Math.random() * Math.PI * 2;
        const speed = (type === 'regen') ? Math.random() * 1 + 0.5 : Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.03 + 0.02;
        this.size = Math.random() * 5 + 2;
    }
    update(tsf) {
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.life -= this.decay * tsf;
        if (this.type === 'smoke') { this.vx *= 0.95; this.vy -= 0.05 * tsf; this.size += 0.2 * tsf; }
        if (this.type === 'drip') { this.vy += 0.1 * tsf; this.vx *= 0.9; this.size *= 0.95; }
        if (this.type === 'heal') { this.y -= 1 * tsf; this.size *= 0.98; }
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        if (this.type === 'spark') ctx.fillRect(this.x, this.y, this.size, this.size);
        else { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1.0;
    }
}