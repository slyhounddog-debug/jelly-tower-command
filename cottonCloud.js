// JellyTowerCommand/cottonCloud.js
import SpriteAnimation from './SpriteAnimation.js';

export default class CottonCloud {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.width = 100; // Placeholder, adjust based on sprite
        this.height = 70; // Placeholder, adjust based on sprite
        this.speed = 0; // Will be set based on "missile" jelly bean speed
        this.baseSpeed = 0; // To store missile jelly bean base speed

        // Stats
        this.health = 0;
        this.maxHealth = 0;
        this.baseWeight = 15;
        this.weightModifier = 0.05;
        this.threshold = 55;
        this.cost = 5;
        this.mass = 3;

        this.isEscaping = false;
        this.targetLoot = null;
        this.lootParented = false;
        this.lootOffsetX = 0;
        this.lootOffsetY = 0;
        this.lootBounceOffset = 0; // For the slight bouncing effect

        // Visuals
        this.sprite = null; // Will be the cloud_main sprite
        this.spriteAnimation = null;
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.pulseTimer = 0;
        this.pulseDuration = 0.4; // Normal pulse duration

        // Movement
        this.vx = 0;
        this.vy = 0;
        this.driftOffset = 0; // For Math.sin() X-axis drifting
        this.targetingTimer = 0;
        this.TARGETING_INTERVAL = 60; // Search every 60 frames

        this.init(game); // Call init to ensure sprite is loaded
    }

    init(game, x = 0, y = 0) {
        this.game = game;
        if (!this.sprite) {
            this.sprite = this.game.assetLoader.getImage('cloud_main');
            // Assuming the sprite is 100x70, adjust as needed
            this.width = this.sprite.width; 
            this.height = this.sprite.height;
            // No animation frames needed for a single sprite, but SpriteAnimation can handle pulsing scale
            this.spriteAnimation = new SpriteAnimation(this.sprite, 0, 0, this.width, this.height, 1, 1, false);
        }

        // Set initial position - spawn from upper corners
        this.x = (Math.random() < 0.5 ? 0 : this.game.canvas.width) - this.width / 2;
        this.y = Math.random() * (this.game.canvas.height / 4); // Upper quarter of the screen

        this.isEscaping = false;
        this.targetLoot = null;
        this.lootParented = false;
        this.lootOffsetX = 0;
        this.lootOffsetY = 0;
        this.lootBounceOffset = 0;
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.pulseTimer = 0;
        this.pulseDuration = 0.4;
        this.driftOffset = Math.random() * Math.PI * 2; // Random start for sin wave

        // Set initial speed based on "missile" jelly bean speed (need to get this from game)
        // For now, using a placeholder. Will need to fetch actual value from game.js or similar.
        // Assuming game.enemyStats.jellyBean.missile.speed exists.
        this.baseSpeed = (this.game.enemyStats?.jellyBean?.missile?.speed || 1) * 2; // 2x standard missile speed
        this.speed = this.baseSpeed;
        
        this.maxHealth = (this.game.enemyStats?.jellyBean?.health || 100) * 2; // 2x missile jelly bean health
        this.health = this.maxHealth;

        // Initial velocity for diagonal descent with drifting
        const angleToCenter = Math.atan2(this.game.canvas.height / 2 - this.y, this.game.canvas.width / 2 - this.x);
        this.vx = Math.cos(angleToCenter) * this.speed * 0.5; // Initial diagonal movement
        this.vy = Math.sin(angleToCenter) * this.speed * 0.5;

        this.active = true;
        this.targetingTimer = 0;
        this.searchForTarget(); // Initial target search
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.health = 0;
        this.maxHealth = 0;
        this.isEscaping = false;
        this.targetLoot = null;
        this.lootParented = false;
        this.lootOffsetX = 0;
        this.lootOffsetY = 0;
        this.lootBounceOffset = 0;
        this.scaleX = 1.0;
        this.scaleY = 1.0;
        this.pulseTimer = 0;
        this.pulseDuration = 0.4;
        this.driftOffset = 0;
        this.speed = 0;
        this.baseSpeed = 0;
        this.targetingTimer = 0;
        // Don't reset sprite and animation as they are constant for all clouds
    }

    searchForTarget() {
        if (!this.game || !this.game.activeLoot || this.game.activeLoot.length === 0) {
            this.targetLoot = null;
            return;
        }

        // Weighted random selection based on user requirements
        const lootWeights = {
            'iceCreamScoop': 10,
            'components': 10,
            'heart': 5,
            'coin': 1
        };

        let totalWeight = 0;
        const availableLootWithWeights = [];

        for (const loot of this.game.activeLoot) {
            const weight = lootWeights[loot.type] || 0; // Get weight, default to 0 if type not listed
            if (weight > 0) {
                totalWeight += weight;
                availableLootWithWeights.push({ loot, weight });
            }
        }

        if (totalWeight === 0) {
            this.targetLoot = null;
            return;
        }

        let randomWeight = Math.random() * totalWeight;
        for (const entry of availableLootWithWeights) {
            randomWeight -= entry.weight;
            if (randomWeight <= 0) {
                this.targetLoot = entry.loot;
                // Pause despawn timer for targetLoot
                if (this.targetLoot.despawnTimer) {
                    this.targetLoot.despawnTimer.pause();
                }
                break;
            }
        }
    }

    update(tsf) {
        if (!this.active) return;

        this.targetingTimer += tsf;
        if (this.targetingTimer >= this.TARGETING_INTERVAL || !this.targetLoot || !this.targetLoot.active) {
            this.searchForTarget();
            this.targetingTimer = 0;
        }
        
        // Animation Logic (Pulsing)
        this.pulseTimer += tsf;
        const currentPulseDuration = this.isEscaping ? 0.2 : this.pulseDuration;
        const pulseProgress = (this.pulseTimer % (currentPulseDuration * 60)) / (currentPulseDuration * 60); // 60 for frames
        
        this.scaleY = 0.9 + Math.sin(pulseProgress * Math.PI * 2) * 0.1; // Scale Y between 0.9 and 1.1
        this.scaleX = 1.0 + (1.0 - this.scaleY); // Counter-scale X to maintain volume

        if (this.isEscaping) {
            this.x += this.vx * 0.5 * tsf; // 0.5x standard speed
            this.y -= this.speed * tsf; // Move upwards
            if (this.y + this.height < 0) {
                this.game.cottonCloudPool.returnToPool(this);
            }
        } else if (this.targetLoot && this.targetLoot.active) {
            // Move at 2x standard jelly bean "missile" speed diagonally toward target
            const targetX = this.targetLoot.x + this.targetLoot.width / 2;
            const targetY = this.targetLoot.y + this.targetLoot.height / 2;

            const dx = targetX - (this.x + this.width / 2);
            const dy = targetY - (this.y + this.height / 2);
            const distSq = dx * dx + dy * dy; // Use squared distance for optimization

            if (distSq < (this.width / 2 + this.targetLoot.width / 2) ** 2) { // Collision detection
                this.lootParented = true;
                // Calculate offset from cloud center
                this.lootOffsetX = (this.targetLoot.x + this.targetLoot.width / 2) - (this.x + this.width / 2);
                this.lootOffsetY = (this.targetLoot.y + this.targetLoot.height / 2) - (this.y + this.height / 2);
                this.targetLoot.x = this.x + this.width / 2 - this.targetLoot.width / 2 + this.lootOffsetX;
                this.targetLoot.y = this.y + this.height / 2 - this.targetLoot.height / 2 + this.lootOffsetY;
                this.isEscaping = true; // Once loot is snatched, start escaping
                // Set escape velocity
                this.vx = (this.game.canvas.width / 2 - (this.x + this.width/2)) / (this.game.canvas.height / (this.speed * 0.5)); // Aim for center top
            } else {
                const angle = Math.atan2(dy, dx);
                this.vx = Math.cos(angle) * this.speed * tsf;
                this.vy = Math.sin(angle) * this.speed * tsf;
            }
            this.x += this.vx;
            this.y += this.vy;
            
        } else { // No target or target lost, just drift and descend
            this.driftOffset += 0.05 * tsf; // Adjust drift speed
            this.vx = Math.sin(this.driftOffset) * 0.5; // Gentle X-axis drifting
            this.vy = this.speed * 0.1 * tsf; // Slow descent
            this.x += this.vx;
            this.y += this.vy;

            if (this.y > this.game.canvas.height) { // If it drifts off screen without loot, return to pool
                this.game.cottonCloudPool.returnToPool(this);
            }
        }
        
        if (this.lootParented) {
            // Slight bouncing movement for loot inside the cloud
            this.lootBounceOffset = Math.sin(this.game.gameTime * 0.2) * 5; // Adjust amplitude and frequency
            this.targetLoot.x = this.x + this.width / 2 - this.targetLoot.width / 2 + this.lootOffsetX;
            this.targetLoot.y = this.y + this.height / 2 - this.targetLoot.height / 2 + this.lootOffsetY + this.lootBounceOffset;
            // Update loot's internal position or just its rendered position, depending on loot object structure
        }

        // Handle health and destruction (licking)
        if (this.health <= 0) {
            if (this.lootParented && this.targetLoot) {
                // Drop loot with gravity
                this.targetLoot.x = this.x + this.width / 2 - this.targetLoot.width / 2;
                this.targetLoot.y = this.y + this.height / 2 - this.targetLoot.height / 2;
                this.targetLoot.vx = (Math.random() - 0.5) * 5; // Random horizontal velocity
                this.targetLoot.vy = (Math.random() * -3); // Upward initial velocity
                this.targetLoot.applyGravity = true; // Assuming loot objects have this
                this.targetLoot.active = true; // Ensure loot is active and independent
                if (this.targetLoot.despawnTimer) {
                    this.targetLoot.despawnTimer.unpause();
                    this.targetLoot.despawnTimer.reset();
                }
            }
            this.game.cottonCloudPool.returnToPool(this);
        }
    }

    draw(ctx) {
        if (!this.active || !this.spriteAnimation) return;

        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.scale(this.scaleX, this.scaleY);
        this.spriteAnimation.draw(ctx, -this.width / 2, -this.height / 2);
        ctx.restore();
    }
    
    // Method to simulate taking damage (e.g., from player licking)
    takeDamage(amount) {
        this.health -= amount;
        // Optionally add visual feedback for damage
    }
}
