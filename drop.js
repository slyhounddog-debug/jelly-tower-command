import Particle from './particle.js';
import FloatingText from './floatingText.js';

export default class Drop {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x; this.y = y; this.type = type;
        this.vy = -5; this.vx = (Math.random() - 0.5) * 6;
        this.gravity = 0.3;
        this.life = 1200; // Longer life
       // Coins/Lucky coins are now 12-18px, Ice cream is 40px, others 15px
this.width = (type === 'lucky_coin') ? 35 : (type === 'coin' ? 20 : (type === 'ice_cream_scoop' ? 120 : 30));
        this.coinValue = (type === 'lucky_coin') ? 100 : (type === 'coin' ? 25 : 0);
        this.rot = 0;
        this.glow = 0;
    }
    update(tsf) {
        this.vy += this.gravity * tsf;
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.rot += 0.05 * tsf;
        this.glow = (Math.sin(this.rot) + 1) / 2; // Cycle glow with rotation
        this.vx *= 0.95;

        if (this.x < 0) { this.x = 0; this.vx *= -0.8; }
        if (this.x > this.game.width - this.width) { this.x = this.game.width - this.width; this.vx *= -0.8; }
        if (this.y > this.game.height - 80 - this.width / 2) { this.y = this.game.height - 80 - this.width / 2; this.vy *= -0.5; }

        if (Math.abs(this.game.player.x - this.x) < 80 && Math.abs(this.game.player.y - this.y) < 80) {
            if (this.type === 'coin') {
                this.game.money += this.coinValue;
                this.game.totalMoneyEarned += this.coinValue;
                this.game.floatingTexts.push(new FloatingText(this.game, this.x, this.y, '+💰'));
            }
            if (this.type === 'lucky_coin') {
                this.game.money += this.coinValue;
                this.game.totalMoneyEarned += this.coinValue;
                this.game.floatingTexts.push(new FloatingText(this.game, this.x, this.y, '+💰💰'));
            }
            if (this.type === 'heart') {
                this.game.castleHealth = Math.min(100, this.game.castleHealth + 10);
                this.game.floatingTexts.push(new FloatingText(this.game, this.x, this.y, '+❤️'));
                const spotsToRemove = Math.floor(this.game.damageSpots.length / 5);
                for (let i = 0; i < spotsToRemove; i++) {
                    if (this.game.damageSpots.length > 0) {
                        this.game.damageSpots.splice(Math.floor(Math.random() * this.game.damageSpots.length), 1);
                    }
                }
            }
            if (this.type === 'ice_cream_scoop') {
                this.game.iceCreamScoops++;
                this.game.floatingTexts.push(new FloatingText(this.game, this.x, this.y, '🍦'));
            }
            this.life = 0;
            for (let i = 0; i < 5; i++) this.game.particles.push(new Particle(this.x, this.y, '#fff'));
        }
    }
    draw(ctx) {
        // --- DYNAMIC SHADOW ---
        const ground = this.game.platforms.find(p => p.type === 'ground');
        if (ground) {
            const distance = ground.y - (this.y + this.width);
            const maxShadowDistance = 800;

            if (distance < maxShadowDistance && distance > -this.width) { // Also check if drop is not below ground
                const shadowFactor = 1 - (distance / maxShadowDistance);
                let shadowWidth = (this.width * 0.5) * shadowFactor;
                if (this.type === 'ice_cream_scoop') {
                    shadowWidth = (this.width * 0.18) * shadowFactor;
                }
                const shadowHeight = shadowWidth * 0.25; // Make it an ellipse
                const shadowOpacity = 0.2 * shadowFactor;

                // Use a generic shadow color
                ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
                ctx.beginPath();
                ctx.ellipse(this.x + this.width / 2, ground.y + 2, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const radius = this.width / 2;
        ctx.save(); ctx.translate(this.x + radius, this.y + radius);
        if (this.type === 'coin' || this.type === 'lucky_coin') {
            ctx.scale(Math.sin(this.rot), 1);
            ctx.fillStyle = this.type === 'lucky_coin' ? '#ffe082' : '#f1c40f';
            ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center'; ctx.fillText('$', 0, 4);
        } else if (this.type === 'heart') {
            const scale = 1 + Math.sin(this.rot * 3) * 0.2;
            ctx.scale(scale, scale);
            ctx.fillStyle = '#e74c3c'; ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.fillText('♥', 0, 8);
        } else if (this.type === 'ice_cream_scoop') {
            const scale = 1 + Math.sin(this.rot * 3) * 0.2;
            ctx.scale(scale, scale);
            ctx.fillStyle = '#fff';
            ctx.font = '48px Arial'; ctx.textAlign = 'center'; ctx.fillText('🍦', 0, 8);
        }

        // Glow effect
        ctx.fillStyle = `rgba(255, 255, 255, ${this.glow * 0.5})`;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}