import Particle from './particle.js';
import FloatingText from './floatingText.js';
import { lightenColor } from './utils.js';

export default class Drop {
    constructor(game, x, y, type) {
        this.game = game;
        this.x = x; this.y = y; this.type = type;
        this.vy = -5; this.vx = (Math.random() - 0.5) * 6;
        this.gravity = 0.3;
        this.life = 1200; // Longer life
       // Coins/Lucky coins are now 12-18px, Ice cream is 40px, others 15px
this.width = (type === 'lucky_coin') ? 35 : (type === 'coin' ? 20 : (type === 'ice_cream_scoop' ? 40 : (type === 'xp_orb' ? 20 : 30)));
        this.coinValue = (type === 'lucky_coin') ? 100 : (type === 'coin' ? 25 : 0);
        this.xpValue = 0;
        this.rot = 0;
        this.glow = 0;
    }
    update(tsf) {
        this.vy += this.gravity * tsf;
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.rot += 0.05 * tsf;
        this.glowTimer = (this.glowTimer + 0.03 * tsf) % (Math.PI * 2); // Slower cycle
        this.glow = (Math.sin(this.glowTimer) + 1) / 2;
        this.vx *= 0.95;

        if (this.x < 0) { this.x = 0; this.vx *= -0.8; }
        if (this.x > this.game.width - this.width) { this.x = this.game.width - this.width; this.vx *= -0.8; }
        if (this.y > this.game.height - 80 - this.width / 2) { this.y = this.game.height - 80 - this.width / 2; this.vy *= -0.5; }

        if (Math.abs(this.game.player.x - this.x) < this.game.player.pickupRange && Math.abs(this.game.player.y - this.y) < this.game.player.pickupRange) {
            if (this.type === 'coin') {
                this.game.money += this.coinValue;
                this.game.totalMoneyEarned += this.coinValue;
                this.game.audioManager.playSound('money');
                this.game.lootPopupManager.addLoot('cash', 'Cash', this.coinValue);
                this.game.floatingTexts.push(new FloatingText(this.game, this.x, this.y, '+💰'));
            }
            if (this.type === 'lucky_coin') {
                this.game.money += this.coinValue;
                this.game.totalMoneyEarned += this.coinValue;
                this.game.audioManager.playSound('money');
                this.game.lootPopupManager.addLoot('cash', 'Cash', this.coinValue);
                this.game.floatingTexts.push(new FloatingText(this.game, this.x, this.y, '+💰💰'));
            }
            if (this.type === 'heart') {
                const healAmount = this.game.emporium.getHeartHeal();
                this.game.castleHealth = Math.min(this.game.emporium.getCastleMaxHealth(), this.game.castleHealth + healAmount);
                this.game.castleHealthBar.triggerHeal();
                this.game.audioManager.playSound('heart');
                this.game.lootPopupManager.addLoot('health', 'Health', healAmount);
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
                this.game.audioManager.playSound('scoop');
                this.game.lootPopupManager.addLoot('scoop', 'Scoop', 1);
                this.game.floatingTexts.push(new FloatingText(this.game, this.x, this.y, '🍦'));
            }
            if (this.type === 'xp_orb') {
                this.game.levelingManager.grantXpToPlayer(this.xpValue);
                this.game.audioManager.playSound('xp');
                this.game.lootPopupManager.addLoot('xp', 'XP', this.xpValue);
                this.game.floatingTexts.push(new FloatingText(this.game, this.x, this.y, '+XP'));
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
        ctx.save();
        ctx.translate(this.x + radius, this.y + radius);

        // Determine base color and a lighter variant for glowing
        let baseColor;
        let iconText = '';
        if (this.type === 'coin') {
            baseColor = '#f1c40f'; // Yellow coin
            iconText = '$';
            ctx.scale(Math.sin(this.rot) * 0.7 + 0.3, 1); // Keep coin wobble
        } else if (this.type === 'lucky_coin') {
            baseColor = '#ffe082'; // Gold lucky coin
            iconText = '$';
            ctx.scale(Math.sin(this.rot) * 0.7 + 0.3, 1); // Keep coin wobble
        } else if (this.type === 'heart') {
            baseColor = '#e74c3c'; // Red heart
            iconText = '♥';
        } else if (this.type === 'ice_cream_scoop') {
            baseColor = '#fdfdfd'; // White ice cream
            iconText = '🍦';
        } else if (this.type === 'xp_orb') {
            baseColor = '#00f2ea'; // Teal XP orb
            iconText = 'XP';
        }

        const glowColor = lightenColor(baseColor, this.glow * 15); // Lighten more for stronger glow
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw the icon/shape
        if (this.type === 'coin' || this.type === 'lucky_coin') {
            ctx.fillStyle = '#000';
            ctx.font = 'bold 18px "Lucky Guy"'; // Adjusted font size
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle'; // Center vertically
            ctx.fillText(iconText, 0, 0); // Centered
        } else if (this.type === 'xp_orb') {
            ctx.fillStyle = '#004d4a';
            ctx.font = 'bold 12px "Lucky Guy"'; // Smaller font for "XP"
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iconText, 0, 0);
        } else {
            ctx.fillStyle = baseColor;
            ctx.font = '48px "Lucky Guy"'; // Increased size for better visibility
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle'; // Center vertically
            if (this.type === 'heart') {
                ctx.font = '24px "Lucky Guy"'; // Adjust heart size if needed
                ctx.fillText(iconText, 0, 0);
            } else { // Ice cream scoop
                ctx.fillText(iconText, 0, 0); // Centered
            }
        }

        ctx.restore();
    }
}