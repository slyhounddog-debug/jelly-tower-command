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
        this.width = 70; // Changed from 40 to 70 (75% bigger)
        this.coinValue = (type === 'lucky_coin') ? 100 : (type === 'coin' ? 25 : 0);
        this.xpValue = (type === 'xp_orb') ? value : 0;
        this.rotation = 0;
        this.rotationSpeed = this.vx * 0.1;
        this.glow = 0;
        this.glowTimer = 0;
        this.hue = 0;
        this.id = this.game.getNewId();
        this.isBeingLicked = false;
        this.lickedByPlayer = null;
    }
    update(tsf) {
        if (this.isBeingLicked) {
            this.x = this.lickedByPlayer.tongueTipX - this.width / 2;
            this.y = this.lickedByPlayer.tongueTipY - this.width / 2;

            if (this.lickedByPlayer.lickAnim <= 0) {
                // Collect the drop
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
                        id: this.game.getNewId()
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
                for (let i = 0; i < 5; i++) this.game.particles.push(new Particle(this.game, this.x, this.y, '#fff'));
            }
            return; // Skip normal physics if being licked
        }

        this.vy += this.gravity * tsf;
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        
        // Always apply rotation
        this.rotation += this.rotationSpeed * tsf;
        
        // Apply friction to slow down rotation over time
        this.rotationSpeed *= 0.98;

        this.glowTimer = (this.glowTimer + 0.03 * tsf) % (Math.PI * 2); // Slower cycle
        this.glow = (Math.sin(this.glowTimer) + 1) / 2;
        this.vx *= 0.95;
        this.hue = (this.hue + 0.5 * tsf) % 360;

        if (this.x < 0) { this.x = 0; this.vx *= -0.8; }
        if (this.x > this.game.width - this.width) { this.x = this.game.width - this.width; this.vx *= -0.8; }
        if (this.y > this.game.height - 90 - this.width / 2) { this.y = this.game.height - 90 - this.width / 2; this.vy *= -0.3; }

        if (Math.abs(this.game.player.x - this.x) < this.game.player.pickupRange && Math.abs(this.game.player.y - this.y) < this.game.player.pickupRange) {
            // This is the normal pickup logic
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
                    id: this.game.getNewId()
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
            for (let i = 0; i < 5; i++) this.game.particles.push(new Particle(this.game, this.x, this.y, '#fff'));
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
                const shadowHeight = shadowWidth * 0.25; // Make it an ellipse
                const shadowOpacity = 0.2 * shadowFactor;

                // Use a generic shadow color
                ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
                ctx.beginPath();
                ctx.ellipse(this.x + this.width / 2, ground.y + 2, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.width / 2);
        ctx.rotate(this.rotation);

        const lootSprite = this.game.lootImage;
        const spriteWidth = 64;
        const spriteHeight = 64;
        let spriteX = 0;

        switch (this.type) {
            case 'coin':
                spriteX = 0;
                break;
            case 'lucky_coin':
                spriteX = 64;
                break;
            case 'xp_orb':
                spriteX = 128;
                break;
            case 'heart':
                spriteX = 192;
                break;
            case 'ice_cream_scoop':
                spriteX = 256;
                break;
            case 'component':
                spriteX = 320;
                break;
        }

        ctx.drawImage(
            lootSprite,
            spriteX,
            0,
            spriteWidth,
            spriteHeight,
            -this.width / 2,
            -this.width / 2,
            this.width,
            this.width
        );

        ctx.restore();
    }
}