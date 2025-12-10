import BaseStructure from './baseStructure.js';
import Particle from './particle.js';

export default class Shield extends BaseStructure {
    constructor(game, x, y) {
        super(x, y, 86, 44);
        this.game = game;
        this.maxHp = this.game.stats.shieldMaxHp;
        this.hp = this.maxHp;
    }
    update(tsf) {
        if (this.hp < this.maxHp) {
            this.hp += (this.maxHp * 0.01) * (tsf / 60); // 1% Regen
            if (this.hp > this.maxHp) this.hp = this.maxHp;
            if (Math.random() < 0.2) {
                const angle = Math.random() * Math.PI;
                const px = this.x + this.width / 2 + Math.cos(angle) * 30;
                const py = this.y + this.height + Math.sin(-angle) * 30;
                this.game.particles.push(new Particle(px, py, '#2ecc71', 'heal'));
            }
        }
    }
    takeDamage(amount) { this.hp -= amount; return this.hp <= 0; }
    draw(ctx) {
        const pct = Math.max(0, this.hp / this.maxHp);
        ctx.save();
        // Shadow
        ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
        ctx.fillStyle = `rgba(52, 152, 219, ${0.4 + pct * 0.6})`;
        ctx.beginPath(); ctx.arc(this.x + this.width / 2, this.y + this.height, this.width / 2, Math.PI, 0); ctx.fill();
        ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        if (this.hp < this.maxHp) {
            ctx.fillStyle = 'black'; ctx.fillRect(this.x, this.y - 10, this.width, 4);
            ctx.fillStyle = '#2ecc71'; ctx.fillRect(this.x, this.y - 10, this.width * pct, 4);
        }
        ctx.restore();
    }
}
