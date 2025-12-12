import Particle from './particle.js';
import FloatingText from './floatingText.js?v=25';

export default class Drop {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x; this.y = y; this.type = type;
        this.vy = -5; this.vx = (Math.random() - 0.5) * 6;
        this.gravity = 0.3;
        this.life = 1200; // Longer life
        this.width = (type === 'lucky_coin') ? 35 : (type === 'coin' ? 20 : 30);
        
        const bigCoinLevel = this.game.emporiumUpgrades.big_coin_value.level;
        const bigCoinValue = this.game.emporiumUpgrades.big_coin_value.values[bigCoinLevel];
        this.coinValue = (type === 'lucky_coin') ? bigCoinValue : (type === 'coin' ? 25 : 0);
        
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
                const heartHealLevel = this.game.emporiumUpgrades.heart_heal.level;
                const healAmount = this.game.emporiumUpgrades.heart_heal.values[heartHealLevel];
                const castleHealthLevel = this.game.emporiumUpgrades.castle_health.level;
                const maxHealth = this.game.emporiumUpgrades.castle_health.values[castleHealthLevel];
                this.game.castleHealth = Math.min(maxHealth, this.game.castleHealth + healAmount);
                this.game.floatingTexts.push(new FloatingText(this.game, this.x, this.y, '+❤️'));
            }
            if (this.type === 'ice_cream_scoop') {
                this.game.iceCreamScoops++;
                this.game.floatingTexts.push(new FloatingText(this.game, this.x, this.y, '+🍦'));
            }
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
        } else if (this.type === 'heart') {
            const scale = 1 + Math.sin(this.rot * 3) * 0.2;
            ctx.scale(scale, scale);
            ctx.fillStyle = '#e74c3c'; ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.fillText('♥', 0, 8);
        } else { // ice_cream_scoop
            const scale = 1 + Math.sin(this.rot * 3) * 0.2;
            ctx.scale(scale, scale);
            ctx.font = '24px Arial'; ctx.textAlign = 'center'; ctx.fillText('🍦', 0, 8);
        }
        ctx.restore();
    }
}
