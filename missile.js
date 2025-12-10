import Particle from './particle.js';

export default class Missile {
    constructor(game, x, type = 'missile') {
        this.game = game;
        this.x = x; this.y = -60;
        this.baseSpeed = (type === 'piggy') ? 0.5 : 0.8;
        this.speed = (this.baseSpeed + (this.game.currentRPM * 0.08)) * 0.5;
        this.type = type;

        if (type === 'missile') {
            this.width = 45;
            this.height = 60;
            this.color = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
        } else if (type === 'piggy') {
            this.width = 33;
            this.height = 44;
        } else { // Default fallback
            this.width = 30;
            this.height = 40;
        }

        this.health = (type === 'piggy') ? (40 + this.game.currentRPM + (this.game.enemiesKilled * 0.1)) * 2 : 40 + this.game.currentRPM + (this.game.enemiesKilled * 0.1);
        this.maxHealth = this.health;
        this.kbVy = 0; // Knockback velocity Y
    }
    takeDamage(amount) {
        this.health -= amount;
        return this.health <= 0;
    }
    update(tsf) {
        // Smooth knockback decay
        this.kbVy *= 0.9;
        this.y += (this.speed + this.kbVy) * tsf;

        if (this.game.gameTime % 8 < 1 * tsf) {
            const color = (this.type === 'piggy') ? 'rgba(255, 105, 180, 0.6)' : this.color;
            this.game.particles.push(new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * 15, this.y, color, 'drip'));
            if (Math.random() < 0.3) {
                this.game.particles.push(new Particle(this.x + this.width / 2 + (Math.random() - 0.5) * 15, this.y, color, 'drip'));
            }
        }
    }
    draw(ctx) {
        ctx.save();
        ctx.shadowBlur = 15;
        const color = (this.type === 'piggy') ? '#ff69b4' : this.color;
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        if (this.type === 'piggy') {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(1.1, 1.1); // Scale by 10%

            // Re-create the original drawing, but centered around (0,0)
            ctx.beginPath(); ctx.ellipse(0, 0, 16, 12, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'white'; ctx.lineWidth = 1.5; ctx.stroke();
            ctx.fillStyle = '#ffb7b2';
            ctx.beginPath(); ctx.arc(0, 0, 4.8, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'black';
            ctx.beginPath(); ctx.arc(-2, -2, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(2, -2, 1, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = color;
            ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(-15, -20); ctx.lineTo(-5, -15); ctx.fill();
            ctx.beginPath(); ctx.moveTo(10, -10); ctx.lineTo(15, -20); ctx.lineTo(5, -15); ctx.fill();

            ctx.restore();
        } else {
            // Jelly Bean Draw
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(0.3);

            const beanWidth = 45; // 1.5x original
            const beanHeight = 30; // 1.5x original

            // Main body
            ctx.beginPath();
            ctx.moveTo(0, -beanHeight / 2);
            ctx.bezierCurveTo(beanWidth / 2, -beanHeight / 1.5, beanWidth / 2, beanHeight / 1.5, 0, beanHeight / 2);
            ctx.bezierCurveTo(-beanWidth / 3, beanHeight / 1.5, -beanWidth / 3, -beanHeight / 1.5, 0, -beanHeight / 2);
            ctx.closePath();

            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 3; // 1.5x original
            ctx.stroke();

            // Shiny glare
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.ellipse(7.5, -6, 4.5, 9, -0.3, 0, Math.PI * 2); // 1.5x original
            ctx.fill();

            ctx.restore();
        }

        ctx.shadowBlur = 0;
        const pct = Math.max(0, this.health / this.maxHealth);
        ctx.fillStyle = '#e74c3c'; ctx.fillRect(this.x, this.y - 10, this.width, 4);
        ctx.fillStyle = '#2ecc71'; ctx.fillRect(this.x, this.y - 10, this.width * pct, 4);
        ctx.restore();
    }
}
