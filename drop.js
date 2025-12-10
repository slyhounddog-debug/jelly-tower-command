import Particle from './particle.js';

export default class Drop {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x; this.y = y; this.type = type;
        this.vy = -5; this.vx = (Math.random() - 0.5) * 6;
        this.gravity = 0.3;
        this.life = 1200; // Longer life
        this.width = (type === 'lucky_coin') ? 35 : (type === 'coin' ? 20 : 30);
        this.coinValue = (type === 'lucky_coin') ? 100 : (type === 'coin' ? 25 : 0);
        this.rot = 0;
    }
    update(tsf) {
        this.vy += this.gravity * tsf;
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.rot += 0.1 * tsf;
        this.vx *= 0.95;

        if (this.x < 0) { this.x = 0; this.vx *= -0.8; }
        if (this.x > this.game.width - this.width) { this.x = this.game.width - this.width; this.vx *= -0.8; }
        if (this.y > this.game.height - 80 - this.width) { this.y = this.game.height - 80 - this.width; this.vy *= -0.5; }

        if (Math.abs(this.game.player.x - this.x) < 80 && Math.abs(this.game.player.y - this.y) < 80) {
            if (this.type === 'coin' || this.type === 'lucky_coin') {
                this.game.money += this.coinValue;
                this.game.totalMoneyEarned += this.coinValue;
            }
            if (this.type === 'heart') this.game.castleHealth = Math.min(100, this.game.castleHealth + 10);
            this.life = 0;
            for (let i = 0; i < 5; i++) this.game.particles.push(new Particle(this.x, this.y, '#fff'));
        }
    }
    draw(ctx) {
        const radius = this.width / 2;
        ctx.save(); ctx.translate(this.x + radius, this.y + radius);
        if (this.type === 'coin' || this.type === 'lucky_coin') {
            ctx.scale(Math.sin(this.rot), 1);
            ctx.fillStyle = this.type === 'lucky_coin' ? '#ffe082' : '#f1c40f';
            ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('$', 0, 4);
        } else {
            const scale = 1 + Math.sin(this.rot * 3) * 0.2;
            ctx.scale(scale, scale);
            ctx.fillStyle = '#e74c3c'; ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.fillText('♥', 0, 8);
        }
        ctx.restore();
    }
}
