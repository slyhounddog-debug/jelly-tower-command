import Particle from './particle.js';
import FloatingText from './floatingText.js';
import { lightenColor, darkenColor } from './utils.js';
import { getRandomComponent } from './components.js';

export default class Drop {
    constructor(game, x, y, type, value = 0) {
        this.game = game;
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y + (Math.random() - 0.5) * 20;
        this.type = type;
        this.vy = -6 + (Math.random() - 0.5) * 4;
        this.vx = (Math.random() - 0.5) * 6;
        this.gravity = 0.3;
        this.life = 1200; // Longer life
       // Coins/Lucky coins are now 12-18px, Ice cream is 40px, others 15px
this.width = (type === 'lucky_coin') ? 35 : (type === 'coin' ? 20 : (type === 'ice_cream_scoop' ? 40 : (type === 'xp_orb' ? 20 : (type === 'component' ? 25 : 30))));
        this.coinValue = (type === 'lucky_coin') ? 100 : (type === 'coin' ? 25 : 0);
        this.xpValue = (type === 'xp_orb') ? value : 0;
        this.rot = 0;
        this.glow = 0;
        this.glowTimer = 0;
        this.hue = 0;
    }
    update(tsf) {
        this.vy += this.gravity * tsf;
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.rot += 0.05 * tsf;
        this.glowTimer = (this.glowTimer + 0.03 * tsf) % (Math.PI * 2); // Slower cycle
        this.glow = (Math.sin(this.glowTimer) + 1) / 2;
        this.vx *= 0.95;
        this.hue = (this.hue + 0.5 * tsf) % 360;

        if (this.x < 0) { this.x = 0; this.vx *= -0.8; }
        if (this.x > this.game.width - this.width) { this.x = this.game.width - this.width; this.vx *= -0.8; }
        if (this.y > this.game.height - 80 - this.width / 2) { this.y = this.game.height - 80 - this.width / 2; this.vy *= -0.3; }

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
                localStorage.setItem('iceCreamScoops', this.game.iceCreamScoops);
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
            if (this.type === 'component') {
                const componentName = getRandomComponent();
                this.game.player.collectedComponents.push({
                    name: componentName,
                    id: Date.now() + Math.random()
                });
                this.game.lootPopupManager.addLoot('component', componentName, 1);
                this.game.audioManager.playSound('scoop'); // Sound for picking up a component
                if (!this.game.player.firstComponentCollected) {
                    this.game.player.firstComponentCollected = true;
                    document.getElementById('component-modal').style.display = 'block';
                    this.game.isPaused = true;
                }
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
        
        // --- Initial Translate to center of the loot item (and thus the bubble) ---
        ctx.translate(this.x + radius, this.y + radius);

        // --- Draw Bubble (Shiny, 3D effect) ---
        const bubbleRadius = 30; // Fixed size for all loot, now 30px
        const bubbleAlpha = 0.4 + (this.glow * 0.2); // Pulsating alpha

        ctx.beginPath();
        ctx.arc(0, 0, bubbleRadius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(173, 216, 230, ${bubbleAlpha})`; // Light blue base for bubble
        ctx.fill();

        // Inner highlight for depth and shine
        const innerGradient = ctx.createRadialGradient(0, 0, bubbleRadius * 0.3, 0, 0, bubbleRadius * 0.8);
        innerGradient.addColorStop(0, `rgba(255, 255, 255, ${bubbleAlpha * 0.8})`); // White highlight
        innerGradient.addColorStop(1, `rgba(255, 255, 255, ${bubbleAlpha * 0.0})`); // Transparent
        ctx.fillStyle = innerGradient;
        ctx.fill();

        // Outer rim for depth
        const outerGradient = ctx.createRadialGradient(0, 0, bubbleRadius * 0.8, 0, 0, bubbleRadius);
        outerGradient.addColorStop(0, `rgba(173, 216, 230, ${bubbleAlpha * 0.0})`); // Transparent
        outerGradient.addColorStop(1, `rgba(173, 216, 230, ${bubbleAlpha * 0.5})`); // Light blue
        ctx.strokeStyle = outerGradient;
        ctx.lineWidth = 2;
        ctx.stroke();
        // --- End Draw Bubble ---

        // Loot movement inside the bubble
        // Added a random component to the movement for a more natural float
        const lootX = (Math.cos(this.glowTimer * 0.5 + this.rot) * 5) + (Math.random() - 0.5) * 2;
        const lootY = (Math.sin(this.glowTimer * 0.5 + this.rot) * 5) + (Math.random() - 0.5) * 2;
        ctx.translate(lootX, lootY);

        // Determine base color and a lighter variant for glowing
        let baseColor;
        let iconText = '';
        if (this.type === 'coin') {
            baseColor = '#f1c40f'; // Yellow coin
        } else if (this.type === 'lucky_coin') {
            baseColor = '#ffe082'; // Gold lucky coin
        } else if (this.type === 'heart') {
            baseColor = '#e74c3c'; // Red heart
        } else if (this.type === 'ice_cream_scoop') {
            baseColor = '#fdfdfd'; // White ice cream
            iconText = '🍦';
        } else if (this.type === 'xp_orb') {
            baseColor = '#39FF14'; // Neon Green XP orb
            iconText = 'XP';
        } else if (this.type === 'component') {
            baseColor = `hsl(${this.hue}, 100%, 70%)`;
            iconText = 'C';
        }

        ctx.fillStyle = baseColor;

        if (this.type === 'component') {
            ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
            ctx.beginPath();
            ctx.roundRect(-radius, -radius, this.width, this.width, 5);
            ctx.fill();

            ctx.strokeStyle = `hsl(${this.hue + 180}, 100%, 80%)`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -radius);
            ctx.lineTo(0, radius);
            ctx.moveTo(-radius, 0);
            ctx.lineTo(radius, 0);
            ctx.stroke();
        } else if (this.type === 'heart') {
            const x = 0;
            const y = 0;
            const w = this.width;
            const h = this.width;
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y + h);
            ctx.bezierCurveTo(x + w / 2, y + h * 0.7, x, y + h * 0.5, x, y + h * 0.25);
            ctx.bezierCurveTo(x, y, x + w / 2, y, x + w / 2, y + h * 0.25);
            ctx.bezierCurveTo(x + w / 2, y, x + w, y, x + w, y + h * 0.25);
            ctx.bezierCurveTo(x + w, y + h * 0.5, x + w / 2, y + h * 0.7, x + w / 2, y + h);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
        }


        // Draw the icon/shape
        if (this.type === 'coin' || this.type === 'lucky_coin') {
            ctx.strokeStyle = darkenColor(baseColor, 20);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#000';
            ctx.font = 'bold 18px "Lucky Guy"'; // Adjusted font size
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle'; // Center vertically
            ctx.fillText('$', 0, 0); // Centered
        } else if (this.type === 'xp_orb') {
            ctx.fillStyle = '#004d4a';
            ctx.font = 'bold 12px "Lucky Guy"'; // Smaller font for "XP"
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(iconText, 0, 0);
        } else if (this.type === 'ice_cream_scoop') {
            ctx.font = '48px "Lucky Guy"'; // Increased size for better visibility
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle'; // Center vertically
            ctx.fillText(iconText, 0, 0); // Centered
        }
    
        ctx.restore();
    }
}