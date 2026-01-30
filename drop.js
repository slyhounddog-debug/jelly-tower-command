import Particle from './particle.js';
import FloatingText from './floatingText.js';
import { lightenColor, darkenColor } from './utils.js';
import { getRandomComponent } from './components.js';

const NORMAL_LOOT_LIFESPAN = 1800; // 30 seconds at 60 FPS
const SPECIAL_LOOT_LIFESPAN = 3600; // 60 seconds at 60 FPS

export default class Drop {
    constructor(game, x, y, type, value = 0) {
        this.game = game;
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y + (Math.random() - 0.5) * 20;
        this.type = type;
        this.vy = -6 + (Math.random() - 0.5) * 4;
        this.vx = (Math.random() - 0.5) * 6;
        this.gravity = 0.3;
        this.life = (type === 'ice_cream_scoop' || type === 'component') ? SPECIAL_LOOT_LIFESPAN : NORMAL_LOOT_LIFESPAN;
        this.maxLife = this.life; // Store max life for blinking calculations
        this.width = 70; 
        this.coinValue = (type === 'lucky_coin') ? 100 : (type === 'coin' ? 25 : 0);
        this.xpValue = (type === 'xp_orb') ? value : 0;
        this.rotation = 0;
        this.rotationSpeed = this.vx * 0.1;
        
        this.glow = 0;
        this.glowTimer = Math.random() * Math.PI * 2; 
        
        // --- IMPACT CONFIGURATION ---
        // Vary pulse speeds: Lucky coins and hearts "throb" faster
        const speedMap = {
            'coin': 0.04,
            'lucky_coin': 0.09,
            'heart': 0.08,
            'xp_orb': 0.05,
            'ice_cream_scoop': 0.04,
            'component': 0.07
        };
        this.pulseSpeed = speedMap[type] || 0.05;

        // Assign Glow Color
        const colorMap = {
            'coin': 'yellow',
            'lucky_coin': 'yellow',
            'xp_orb': 'purple',
            'heart': 'red',
            'ice_cream_scoop': 'pink',
            'component': 'blue'
        };
        this.auraColor = colorMap[type] || 'yellow';

        this.id = this.game.getNewId();
        this.isBeingLicked = false;
        this.lickedByPlayer = null;
        this.spawnTime = this.game.gameTime;
    }

    update(tsf) {
        this.life -= tsf;

        if (this.isBeingLicked) {
            this.x = this.lickedByPlayer.tongueTipX - this.width / 2;
            this.y = this.lickedByPlayer.tongueTipY - this.width / 2;
            if (this.lickedByPlayer.lickAnim <= 0) {
                this.collect();
                this.life = 0;
                for (let i = 0; i < 5; i++) this.game.particles.push(new Particle(this.game, this.x, this.y, '#fff'));
            }
            return;
        }

        this.vy += this.gravity * tsf;
        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        
        this.rotation += this.rotationSpeed * tsf;
        this.rotationSpeed *= 0.98;

        // Pulse logic using individual speed
        this.glowTimer += this.pulseSpeed * tsf;
        this.glow = (Math.sin(this.glowTimer) + 1) / 2;

        this.vx *= 0.95;

        if (this.x < 0) { this.x = 0; this.vx *= -0.8; }
        if (this.x > this.game.width - this.width) { this.x = this.game.width - this.width; this.vx *= -0.8; }
        if (this.y > this.game.PLAYABLE_AREA_HEIGHT - 90 - this.width / 2) { 
            this.y = this.game.PLAYABLE_AREA_HEIGHT - 90 - this.width / 2; 
            this.vy *= -0.3; 
        }

        if (Math.abs(this.game.player.x - (this.x + this.width/2)) < this.game.player.pickupRange && 
            Math.abs(this.game.player.y - (this.y + this.width/2)) < this.game.player.pickupRange) {
            this.collect();
            this.life = 0;
            for (let i = 0; i < 5; i++) this.game.particles.push(new Particle(this.game, this.x, this.y, '#fff'));
        }
    }

    collect() {
        if (this.type === 'coin' || this.type === 'lucky_coin') {
            this.game.addMoney(this.coinValue);
            this.game.audioManager.playSound('money');
            this.game.lootPopupManager.addLoot('cash', 'Cash', this.coinValue);
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
                if (this.game.damageSpots.length > 0) this.game.damageSpots.splice(Math.floor(Math.random() * this.game.damageSpots.length), 1);
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
            this.game.addXp(this.xpValue);
            this.game.audioManager.playSound('xp');
            this.game.lootPopupManager.addLoot('xp', 'XP', this.xpValue);
        }
        if (this.type === 'component') {
            const componentName = getRandomComponent();
            this.game.player.collectedComponents.push({ name: componentName, id: this.game.getNewId() });
            this.game.lootPopupManager.addLoot('component', componentName, 1);
            this.game.audioManager.playSound('scoop');
            if (!this.game.player.firstComponentCollected) {
                this.game.player.firstComponentCollected = true;
                this.game.modalManager.toggle('component_modal');
                this.isPaused = true;
            }
        }
    }

    draw(ctx) {
        // --- DYNAMIC SHADOW ---
        const ground = this.game.platforms.find(p => p.type === 'ground');
        if (ground) {
            const distance = ground.y - (this.y + this.width);
            if (distance < 800 && distance > -this.width) {
                const shadowFactor = 1 - (distance / 800);
                let shadowWidth = (this.width * 0.5) * shadowFactor;
                ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * shadowFactor})`;
                ctx.beginPath();
                ctx.ellipse(this.x + this.width / 2, ground.y + 2, shadowWidth, shadowWidth * 0.25, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // --- COLORED PULSING GLOW ---
        const glowSprite = this.game.glowSprites[this.auraColor];
        if (glowSprite) {
            ctx.save();
            ctx.globalAlpha = 0.15 + (this.glow * 0.5); // Slightly stronger opacity
            const glowSize = this.width * (1.8 + this.glow * 0.5); // Sized up for "impact"
            ctx.drawImage(
                glowSprite, 
                this.x + this.width / 2 - glowSize / 2, 
                this.y + this.width / 2 - glowSize / 2, 
                glowSize, 
                glowSize
            );
            ctx.restore();
        }

        // --- LOOT SPRITE ---
        ctx.save();
        // Blinking logic
        const BLINK_START_FRAME_FAST = 180; // 3 seconds
        const BLINK_START_FRAME_NORMAL = 360; // 5 seconds

        if (this.life < BLINK_START_FRAME_NORMAL) {
            let blinkSpeed = 0.15; // Default slow blink
            if (this.life < BLINK_START_FRAME_FAST) {
                blinkSpeed = 0.35; // Faster blink
            }
            // Use sine wave for blinking effect, applying it to globalAlpha before drawing the sprite
            ctx.globalAlpha *= (Math.sin(this.game.gameTime * blinkSpeed) + 1) / 2;
        }
        ctx.translate(this.x + this.width / 2, this.y + this.width / 2);
        ctx.rotate(this.rotation);
        const typeMap = { 'coin': 0, 'lucky_coin': 64, 'xp_orb': 128, 'heart': 192, 'ice_cream_scoop': 256, 'component': 320 };
        ctx.drawImage(
            this.game.lootImage,
            typeMap[this.type] || 0, 0, 64, 64,
            -this.width / 2, -this.width / 2, this.width, this.width
        );
        ctx.restore();
    }
}