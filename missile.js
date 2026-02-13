import Particle from './particle.js';
import Drop from './drop.js';
import { darkenColor, showNotification } from './utils.js?v=26';
import FloatingText from './floatingText.js';
import SpriteAnimation from './SpriteAnimation.js';
import FrostingParticle from './frostingParticle.js';
import Player from './player.js';
import EnemyDebris from './EnemyDebris.js';
import Soul from './Soul.js'; // Corrected placement
import { jellyBeanBag, getVariantFromBag } from './shuffleUtils.js';

const enemyDefinitions = {
    missile: { // Jelly Bean
        baseHealth: 25,
        baseMass: 0.5,
        baseSpeed: 1,
        baseDamage: 5,
        baseWidth: 70,
        baseHeight: 75,
        hpMultiplier: 1, // Added
    },
    gummy_worm: {
        baseHealth: 20,
        baseMass: 1,
        baseSpeed: 1.6,
        baseDamage: 6,
        baseWidth: 26,
        baseHeight: 85,
        hpMultiplier: 1, // Added
    },
    marshmallow_large: {
        baseHealth: 150,
        baseMass: 10,
        baseSpeed: 0.4,
        baseDamage: 10, 
        baseWidth: 76.5 * 1.5,
        baseHeight: 76.5 * 1.5,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        imageKey: 'marshmallowBigImage', 
        color: '#fffaf2ff',
        hpMultiplier: 1, // Added
    },
    marshmallow_medium: {
        baseHealth: 50,
        baseMass: 6,
        baseSpeed: 0.7,
        baseDamage: 7, 
        baseWidth: 45 * 1.6,
        baseHeight: 45 * 1.6,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        imageKey: 'marshmallowMediumImage',
        color: '#fffcf8ff',
        hpMultiplier: 1, // Added
    },
    marshmallow_small: {
        baseHealth: 10,
        baseMass: 2,
        baseSpeed: 1,
        baseDamage: 4, 
        baseWidth: 22 * 2.5,
        baseHeight: 22 * 2.5,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        imageKey: 'marshmallowSmallImage',
        color: '#fffdf8ff',
        hpMultiplier: 1, // Added
    },
    piggy: {
        baseHealth: 50,
        baseMass: 6,
        baseSpeed: 0.5,
        baseDamage: 5, 
        baseWidth: 84,
        baseHeight: 86,
        imageKey: 'piggybankImage',
        color: '#FFC0CB',
        hpMultiplier: 1, // Added
    },
    jaw_breaker: {
        baseHealth: 200,
        baseMass: 999,
        baseSpeed: 0.6,
        baseDamage: 15,
        baseWidth: 76.5 * 1.7,
        baseHeight: 76.5 * 1.7,
        imageKey: 'jawbreakerenemyImage',
        color: '#00ffd5ff',
        isJawBreaker: true,
        hpMultiplier: 1, // Added
    },
    jelly_pudding: {
        baseHealth: 100,
        baseMass: 0.001,
        baseSpeed: .6,
        baseDamage: 12,
        baseWidth: 95,
        baseHeight: 95,
        imageKey: 'jellypuddingenemyImage',
        color: '#d400ffff',
        isJellyPudding: true,
        hpMultiplier: 1, // Added
    },
    donut: {
        baseHealth: 80,
        baseMass: 1.5,
        baseSpeed: .7,
        baseDamage: 9,
        baseWidth: 90,
        baseHeight: 90,
        imageKey: 'donutenemyImage',
        color: '#00e1ffff',
        isDonut: true,
        isVulnerable: true,
        vulnerabilityDuration: 120,
        invulnerabilityDuration: 90,
        hpMultiplier: 1, // Added
    },
    ice_cream: {
        baseHealth: 120,
        baseMass: 5,
        baseSpeed: 1.2,
        baseDamage: 8,
        baseWidth: 85,
        baseHeight: 85,
        imageKey: 'icecreamenemyImage',
        color: '#ffdbedff',
        isIceCream: true,
        hpMultiplier: 1, // Added
    },
    component_enemy: {
        baseHealth: 50,
        baseMass: 2.9,
        baseSpeed: 0.6,
        baseDamage: 7,
        baseWidth: 78,
        baseHeight: 78,
        imageKey: 'componentenemyImage',
        color: '#B03060',
        isComponentEnemy: true,
        hpMultiplier: 1, // Added
    },
    heartenemy: {
        baseHealth: 40,
        baseMass: 2,
        baseSpeed: 1.5,
        baseDamage: 5,
        baseWidth: 68,
        baseHeight: 68,
        imageKey: 'heartenemyImage',
        color: '#ff90acff',
        isHeartEnemy: true,
        hpMultiplier: 1, // Added
    },
    cotton_cloud: {
        baseHealth: 50, 
        baseMass: 3,
        baseSpeed: 2, 
        baseDamage: 0, 
        baseWidth: 100,
        baseHeight: 70,
        imageKey: 'cloudMainImage',
        color: '#FFFFFF',
        hpMultiplier: 1, // Added
    },
    taffy_wrapper: {
        baseHealth: 37.5, 
        baseMass: 4,
        baseSpeed: 1, 
        baseDamage: 4, 
        baseWidth: 70,
        baseHeight: 105,
        imageKey: 'taffyWrappedImage',
        color: '#FFF5F5', // Lighter, almost white pink
        hpMultiplier: 1, // Added
    },
    gummy_bear: {
        baseHealth: 25, 
        baseMass: 6,
        baseSpeed: 1.9, 
        baseDamage: 7, 
        baseWidth: 100,
        baseHeight: 100,
        color: 'brown',
        hpMultiplier: 1, // Added
    },
};
export default class Missile {
    constructor() {
        this.active = false;
    }

    init(game, x, type = 'missile', y = -50) { // hpMultiplier parameter removed
        this.game = game;
        this.x = x; 
        this.y = y + 90;
        this.type = type;
        this.groundProximity = false;
        this.active = true;
        this.knockbackTimer = 0;

        // Retrieve base stats from centralized definitions
        const definition = enemyDefinitions[type];
        if (!definition) {
            console.error(`Unknown enemy type: ${type}`);
            this.active = false;
            return;
        }

        // Apply base stats
        let baseWidth = definition.baseWidth;
        let baseHeight = definition.baseHeight;
        let baseHealth = definition.baseHealth;
        let baseMass = definition.baseMass;
        let baseSpeed = definition.baseSpeed;
        let baseDamage = definition.baseDamage;

        // Reset all special flags that might have been set in a previous life
        this.isDonut = definition.isDonut || false;
        this.isIceCream = definition.isIceCream || false;
        this.isJellyPudding = definition.isJellyPudding || false;
        this.isJawBreaker = definition.isJawBreaker || false;
        this.isComponentEnemy = definition.isComponentEnemy || false;
        this.isHeartEnemy = definition.isHeartEnemy || false;
        this.isWrapped = this.type === 'taffy_wrapper'; // Taffy Wrapper specific, starts wrapped if type matches
        this.isEscaping = false; // Cotton Cloud specific, always starts not escaping
        this.targetLoot = null; // Cotton Cloud specific
        this.lootParented = false; // Cotton Cloud specific
        this.lootOffsetX = 0; // Cotton Cloud specific
        this.lootOffsetY = 0; // Cotton Cloud specific
        this.lootBounceOffset = 0; // Cotton Cloud specific
        this.pulseTimer = 0; // Cotton Cloud specific
        this.pulseDuration = definition.pulseDuration || 0.4; // Cotton Cloud specific
        this.scaleX = 1; // Cotton Cloud specific
        this.scaleY = 1; // Cotton Cloud specific
        this.driftOffset = definition.driftOffset || Math.random() * Math.PI * 2; // Cotton Cloud specific
        this.targetingTimer = 0; // Cotton Cloud specific
        this.TARGETING_INTERVAL = definition.TARGETING_INTERVAL || 60; // Cotton Cloud specific
        this.unwrappedTimer = 0; // Taffy Wrapper specific

        // Donut specific properties
        this.isVulnerable = definition.isVulnerable || true;
        this.vulnerabilityDuration = definition.vulnerabilityDuration || 0;
        this.invulnerabilityDuration = definition.invulnerabilityDuration || 0;
        this.vulnerabilityTimer = this.isDonut ? this.vulnerabilityDuration : 0;

        // General properties
        this.image = definition.imageKey ? this.game[definition.imageKey] : null;
        this.sprite = null;
        this.color = definition.color;

        // Handle type-specific initializations
        if (this.type === 'missile') { // Jelly Bean
            const variantIndex = getVariantFromBag(jellyBeanBag, 8); // Use shuffle bag
            this.sprite = new SpriteAnimation({
                src: 'assets/Images/jellybeans.png',
                frameWidth: 165,
                frameHeight: 175,
                totalFrames: 8,
                fps: 0,
                row: 0
            });
            this.sprite.currentFrame = variantIndex;
            this.color = this.game.PASTEL_COLORS[variantIndex % this.game.PASTEL_COLORS.length];
        } else if (this.type === 'gummy_worm') {
            this.color1 = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.color2 = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
            this.color = this.color1;
        } else if (this.type.includes('marshmallow')) {
            this.rotationSpeed = definition.rotationSpeed; // From definition
        } else if (this.type === 'cotton_cloud') {
            // Initial position: upper corners for cotton cloud
            this.x = (Math.random() < 0.5 ? -baseWidth : this.game.canvas.width);
            this.y = Math.random() * (this.game.canvas.height / 4);
            // Initial velocity for diagonal descent with drifting
            const angleToCenter = Math.atan2(this.game.PLAYABLE_AREA_HEIGHT - this.y, (this.game.canvas.width / 2) - this.x);
            this.vx = Math.cos(angleToCenter) * baseSpeed * 0.5;
            this.vy = Math.sin(angleToCenter) * baseSpeed * 0.5;
        } else if (this.type === 'gummy_bear') {
            this.image = this.game.gummybearImages[Math.floor(Math.random() * this.game.gummybearImages.length)];
        }


        // Calculate sizeScale and apply it to all relevant properties
        // Only jellyBean and gummyWorm have sizeScale variation
        if (this.type === 'missile' || this.type === 'gummy_worm') {
            this.sizeScale = 0.75 + (Math.random() / 2); // User specified formula for 0.75 to 1.25 range
            this.width = baseWidth * this.sizeScale;
            this.height = baseHeight * this.sizeScale;
            this.health = baseHealth * (this.sizeScale * this.sizeScale); // Health scales with size squared
            this.mass = baseMass * (this.sizeScale * this.sizeScale); // Mass scales with size squared, no minimum
            this.damage = baseDamage * this.sizeScale; // Damage scales with size
        } else {
            this.sizeScale = 1;
            this.width = baseWidth;
            this.height = baseHeight;
            this.health = baseHealth;
            this.mass = baseMass;
            this.damage = baseDamage; 
        }

        // Apply health multiplier and RPM scaling
        this.health = (this.health + (this.game.currentRPM * 0.1 * baseHealth / 25)) * definition.hpMultiplier; // Using definition.hpMultiplier
        this.maxHealth = this.health; // Max health is the scaled health
        
        this.speed = (baseSpeed + (this.game.currentRPM * 0.002)) * 0.5;


        this.baseHealth = baseHealth; // Store base health
        this.baseMass = baseMass; // Store base mass
        
        this.kbVy = 0; 
        this.scale = 1;
        this.angle = 0;
        this.animationTimer = Math.random() * Math.PI * 2;
        this.hitTimer = 0;
        this.stretch = 1;
        this.squash = 1;
        this.damageText = null;
        this.damageTextTimer = 0;
        this.criticalHitFlashTimer = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
        this.healScale = 1;
        this.slowEffects = [];
        this.auraSlowTimer = 0;
        this.fireStacks = [];
        this.fireFlashTimer = 0;
        this.totalSlow = 0;
        this.slowParticleTimer = 0;
        this.isJellyTagged = false;
        this.slowTrailTimer = 0;
        this.id = this.game.getNewId();
        this.lastDamageSource = null;
        this.knockbackImmunityTimer = 0;
        this.speedBoostTimer = 0;
        this.isTeleporting = false; // Teleport animation flag
        this.teleportAnimTimer = 0; // Teleport animation timer
        this.teleportAnimDuration = 15; // Teleport animation duration (frames)
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.health = 0;
        this.maxHealth = 0;
        this.slowEffects = [];
        this.fireStacks = [];
        this.lastDamageSource = null;
        this.isJellyTagged = false;
        this.sprite = null; // Missile uses sprite
        this.image = null; // Other enemies use image
        this.knockbackTimer = 0; // Reset knockback timer
        this.isTeleporting = false; // Reset teleport flag
        this.teleportAnimTimer = 0; // Reset teleport animation timer
        this.scale = 1; // Reset scale
        this.baseSpeed = 0; // Ensure speed is reset to a safe default
        this.type = null; // Clear type
        this.groundProximity = false;
        this.damage = 0;
        this.mass = 0;
        this.hitTimer = 0;
        this.stretch = 1;
        this.squash = 1;
        this.damageText = null;
        this.damageTextTimer = 0;
        this.criticalHitFlashTimer = 0;
        this.shakeDuration = 0;
        this.shakeMagnitude = 0;
        this.healScale = 1;
        this.auraSlowTimer = 0;
        this.totalSlow = 0;
        this.slowParticleTimer = 0;
        this.slowTrailTimer = 0;
        this.id = -1; // Reset ID, will be reassigned on init
        this.knockbackImmunityTimer = 0;
        this.speedBoostTimer = 0;
        this.isDonut = false;
        this.isIceCream = false;
        this.isJellyPudding = false;
        this.isJawBreaker = false;
        this.isComponentEnemy = false;
        this.isVulnerable = true;
        this.vulnerabilityTimer = 0;
        this.vulnerabilityDuration = 0;
        this.isHeartEnemy = false;
        this.isWrapped = false; // Taffy Wrapper specific
        this.isEscaping = false; // Cotton Cloud specific
        this.targetLoot = null; // Cotton Cloud specific
        this.lootParented = false; // Cotton Cloud specific
        this.lootOffsetX = 0; // Cotton Cloud specific
        this.lootOffsetY = 0; // Cotton Cloud specific
        this.lootBounceOffset = 0; // Cotton Cloud specific
        this.pulseTimer = 0; // Cotton Cloud specific
        this.pulseDuration = 0.4; // Cotton Cloud specific
        this.scaleX = 1; // Cotton Cloud specific
        this.scaleY = 1; // Cotton Cloud specific
        this.driftOffset = 0; // Cotton Cloud specific
        this.targetingTimer = 0; // Cotton Cloud specific
        this.unwrappedTimer = 0; // Taffy Wrapper specific
        this.color1 = null;
        this.color2 = null;
        this.sizeScale = 1; // Reset the sizeScale
    }

    applyFire(damage, stacks) {
        if (stacks <= 0) return;
        this.fireStacks.push({
            damage: damage * 0.1 * stacks,
            duration: 300,
            timer: 300,
        });
    }

    applySlow(duration, amount, source = 'generic') {
        if (!this.slowEffects.some(e => e.source === source)) {
            this.slowEffects.push({ timer: duration, amount, source, initialDuration: duration });
        }
    }

    takeDamage(amount, isCritical = false, source = null) {
        if (!this.active) return false;

        // --- Taffy Wrapper specific: ---
        if (this.type === 'taffy_wrapper') {
            if (this.isWrapped) { // Currently wrapped
                if (source && source.type === 'player_lick') {
                    // Unwrap it!
                    this.isWrapped = false;
                    this.image = this.game.taffyUnwrappedImage; // Switch image (will be drawn by drawEnemy)
                    this.triggerTaffyUnwrapAnimation(); // NEW: Spawn debris pieces for unwrapping
                    this.game.audioManager.playSound('pop');
                    // No damage from this lick hit, just unwraps.
                    return false; // Stop further damage/knockback processing for THIS hit
                } else {
                    // Hit by non-lick source (e.g., turret) while wrapped
                    return false; // No damage/knockback when wrapped from non-lick sources
                }
            }
            // If taffy is unwrapped (this.isWrapped is false), it falls through to general logic.
            // If taffy is wrapped but hit by non-lick, it returned false above.
        }
        // --- END Taffy Wrapper specific ---

        // Cotton Cloud specific: If licked, destroy and drop loot
        if (this.type === 'cotton_cloud' && source && source.type === 'player_lick') {
            this.health = 0; // Instantly destroy
            // Loot dropping handled in kill method
        }

        if (this.isDonut && !this.isVulnerable) {
            const ft = this.game.floatingTextPool.get(this.game, this.x + this.width / 2, this.y, 'Miss', 'white');
            return false;
        }

        const oldX = this.x;
        const oldY = this.y;

        if (source) {
            this.lastDamageSource = source;
            if (source && source.gummyImpactStacks > 0 && this.knockbackTimer <= 0 && this.mass < 999) { // Jawbreakers and Bosses are immune to knockback (mass 999)
                let directKnockbackForce = 100 / this.mass; // Force a strong inverse relationship with mass
                if (this.isJellyPudding) {
                    directKnockbackForce *= 2; // Jelly Puddings are extra bouncy
                }

                if (this.mass < 3) { // Launchable enemies
                    directKnockbackForce *= 1.5; // Apply additional multiplier for light enemies
                    this.kbVy -= directKnockbackForce; // Apply full force upwards
                } else { // Heavies
                    this.kbVy -= directKnockbackForce; // Apply full force upwards
                }
                this.knockbackTimer = 15; // Set ICD to 0.25 seconds (15 frames)
            }
        }

        if (this.isIceCream) {
            this.speedBoostTimer = 120;
        }

        this.game.hitStopFrames = 0;
        const player = this.game.player;
        if (player.upgrades['Sweet Aura'] > 0) {
            const dist = Math.hypot(this.x - player.x, this.y - player.y);
            if (dist < player.lickRange) {
                amount *= (1 + player.upgrades['Sweet Aura'] * 0.1);
            }
        }

        this.game.audioManager.playSound('towerHit');
        const roundedAmount = amount;
        this.health -= roundedAmount;
        this.hitTimer = 10; 
        this.shakeDuration = 10;
        this.shakeMagnitude = 4;

        if (isCritical) {
            this.game.floatingTextPool.get(this.game, oldX + this.width / 2, oldY, `-${roundedAmount.toFixed(0)}`, 'yellow', 4); 
        } else {
            this.game.floatingTextPool.get(this.game, oldX + this.width / 2, oldY, `-${roundedAmount.toFixed(0)}`, 'red');
        }

        this.damageText = `${this.health.toFixed(0)}/${this.maxHealth.toFixed(0)}`;
        this.damageTextTimer = 60;
        
        if (this.health <= 0) {
            this.kill(oldX, oldY);
            return true;
        }

        if (this.isComponentEnemy) {
            // Teleportation particles at old location
            const teleportColors = ['#E0BBE4', '#957DAD', '#C7CEEA']; // Light magenta, lavender, light blue-purple
            for (let i = 0; i < 15; i++) { // More particles for a noticeable puff
                const color = teleportColors[Math.floor(Math.random() * teleportColors.length)];
                const particle = this.game.particlePool.get();
                if (particle) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 3 + 1;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;
                    particle.init(this.game, oldX + this.width / 2, oldY + this.height / 2, color, 'spark', 0.6, vx, vy);
                }
            }

            // Teleport to new random position
            this.x = Math.random() * (this.game.width - this.width);
        }

        return false;
    }

    update(tsf) {
        if (!this.active) return;

        if (this.isTeleporting) {
            this.teleportAnimTimer += tsf;
            const progress = this.teleportAnimTimer / this.teleportAnimDuration;
            // Shrink down and then grow back up
            if (progress < 0.5) {
                this.scale = 1 - (progress * 2); // Shrink from 1 to 0
            } else {
                this.scale = (progress - 0.5) * 2; // Grow from 0 to 1
            }
            this.scale = Math.max(0, Math.min(1, this.scale)); // Clamp between 0 and 1

            if (this.teleportAnimTimer >= this.teleportAnimDuration) {
                this.isTeleporting = false;
                this.scale = 1;
            }
            return; // Prevent other updates during teleport animation
        }
        
        // Donut specific update logic for vulnerability phasing
        if (this.type === 'donut') {
            this.vulnerabilityTimer -= tsf;
            if (this.vulnerabilityTimer <= 0) {
                this.isVulnerable = !this.isVulnerable;
                if (this.isVulnerable) {
                    this.vulnerabilityTimer = this.vulnerabilityDuration;
                } else {
                    this.vulnerabilityTimer = this.invulnerabilityDuration;
                }
            }
        }


        // Cotton Cloud specific update logic
        if (this.type === 'cotton_cloud') {
            this.targetingTimer += tsf;
            // Search for target on spawn, target loss, or every 60 frames
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

            let currentSpeed = this.speed; // Base speed for cotton cloud
            if (this.isEscaping) {
                currentSpeed *= 0.5; // 0.5x standard speed
                this.y -= currentSpeed * tsf; // Move upwards
                // If it escapes off screen, return to pool
                if (this.y + this.height < 0) {
                    if (this.lootParented && this.targetLoot) {
                        this.targetLoot.active = false; // Destroy loot if stolen
                        if (this.targetLoot.despawnTimer) {
                            this.targetLoot.despawnTimer.reset(); // Reset timer to prevent immediate despawn
                        }
                    }
                    this.game.enemyPools['cotton_cloud'].returnToPool(this);
                }
            } else if (this.targetLoot && this.targetLoot.active) {
                // Move at 2x standard jelly bean "missile" speed diagonally toward target
                const targetCenterX = this.targetLoot.x + this.targetLoot.width / 2;
                const targetCenterY = this.targetLoot.y + this.targetLoot.height / 2;
                const myCenterX = this.x + this.width / 2;
                const myCenterY = this.y + this.height / 2;

                const dx = targetCenterX - myCenterX;
                const dy = targetCenterY - myCenterY;
                const distSq = dx * dx + dy * dy; // Use squared distance for optimization

                // Collision detection with loot
                const collisionThresholdSq = (this.width / 3 + this.targetLoot.width / 3) ** 2; // Reduced threshold to make collision more precise
                if (distSq < collisionThresholdSq) {
                    this.lootParented = true;
                    // Calculate offset from cloud center
                    this.lootOffsetX = targetCenterX - myCenterX;
                    this.lootOffsetY = targetCenterY - myCenterY;
                    this.isEscaping = true; // Once loot is snatched, start escaping
                    // Immediately change direction to aim upwards
                    this.vy = -currentSpeed;
                    this.vx = (Math.random() - 0.5) * currentSpeed * 0.2; // Small random horizontal for escape
                    if (this.targetLoot.despawnTimer) {
                        this.targetLoot.despawnTimer.pause();
                    }
                } else {
                    const angle = Math.atan2(dy, dx);
                    this.vx = Math.cos(angle) * currentSpeed * tsf;
                    this.vy = Math.sin(angle) * currentSpeed * tsf;
                    
                    // Cloud Flight: X-axis drifting with Math.sin()
                    this.driftOffset += 0.05 * tsf; // Adjust drift speed
                    this.vx += Math.sin(this.driftOffset) * currentSpeed * 0.1;
                }
                this.x += this.vx;
                this.y += this.vy;
            } else { // No target or target lost, implement patrolling behavior
                const ground = this.game.platforms.find(p => p.type === 'ground');
                const groundY = ground ? ground.y : this.game.PLAYABLE_AREA_HEIGHT; // Approximate ground level
                const hoverHeight = 200; // Hover 200 pixels above ground
                const targetHoverY = groundY - hoverHeight;

                // Vertical floating (sine wave)
                this.verticalFloatTimer = (this.verticalFloatTimer || 0) + tsf;
                const floatAmplitude = 10; // Pixels it floats up and down
                const floatSpeed = 0.05; // How fast it floats
                this.vy = Math.sin(this.verticalFloatTimer * floatSpeed) * floatAmplitude * 0.1; // Reduced magnitude for slow float

                // Slowly move towards the target hover height
                if (this.y < targetHoverY) {
                    this.vy += 0.05 * tsf; // Gently float down
                } else if (this.y > targetHoverY + floatAmplitude) { // Avoid going too far below target
                    this.vy -= 0.05 * tsf; // Gently float up
                }

                // Horizontal patrolling (sine wave across screen width)
                this.horizontalPatrolTimer = (this.horizontalPatrolTimer || 0) + tsf;
                const patrolAmplitude = (this.game.canvas.width / 2) - this.width; // Half screen width
                const patrolSpeed = 0.005; // Slower patrol speed
                this.vx = Math.sin(this.horizontalPatrolTimer * patrolSpeed) * patrolAmplitude * 0.01; // Slower horizontal movement

                // Apply movement
                this.x += this.vx * tsf;
                this.y += this.vy * tsf;

                // Keep within screen bounds horizontally (gentle bounce off edges)
                if (this.x < 0) {
                    this.x = 0;
                    this.horizontalPatrolTimer += Math.PI; // Reverse direction
                }
                if (this.x + this.width > this.game.canvas.width) {
                    this.x = this.game.canvas.width - this.width;
                    this.horizontalPatrolTimer += Math.PI; // Reverse direction
                }

                // If it accidentally drifts too high, gently pull it down
                if (this.y < 0) this.vy += 0.1 * tsf;
            }
            
            if (this.lootParented && this.targetLoot) {
                // Slight bouncing movement for loot inside the cloud
                this.lootBounceOffset = Math.sin(this.game.gameTime * 0.2) * 5; // Adjust amplitude and frequency
                this.targetLoot.x = this.x + this.width / 2 - this.targetLoot.width / 2 + this.lootOffsetX;
                this.targetLoot.y = this.y + this.height / 2 - this.targetLoot.height / 2 + this.lootOffsetY + this.lootBounceOffset;
            }
            return; // Cotton cloud has its own movement and update cycle
        }
        

        
        if (this.knockbackTimer > 0) this.knockbackTimer -= tsf; // Decrement knockback timer
        if (this.auraSlowTimer > 0) this.auraSlowTimer -= tsf;

        if (this.fireFlashTimer > 0) this.fireFlashTimer -= tsf;
        for (let i = this.fireStacks.length - 1; i >= 0; i--) {
            const stack = this.fireStacks[i];
            if (!stack || typeof stack.timer === 'undefined') { // Defensive check for undefined or missing timer
                this.fireStacks.splice(i, 1); // Remove the malformed element
                continue; // Skip to the next iteration
            }
            stack.timer -= tsf;
            if (stack.timer <= 0) {
                this.fireStacks.splice(i, 1);
            } else {
                if (Math.floor(stack.timer) % 60 === 0) {
                    this.takeDamage(stack.damage, false, null);
                    this.game.floatingTextPool.get(this.game, this.x + this.width / 2, this.y, `-${stack.damage.toFixed(0)}`, 'orange');
                    this.fireFlashTimer = 10;
                }
            }
        }

        let totalSlow = 0;
        for (let i = this.slowEffects.length - 1; i >= 0; i--) {
            const effect = this.slowEffects[i];
            effect.timer -= tsf;
            if (effect.timer <= 0) {
                this.slowEffects.splice(i, 1);
            } else {
                totalSlow += effect.amount;
            }
        }
        
        if (this.auraSlowTimer > 0) {
            totalSlow += 0.5;
        }
        
        this.totalSlow = Math.min(0.9, totalSlow);
        
        if (this.totalSlow > 0) {
            this.slowParticleTimer += tsf;
            if (this.slowParticleTimer >= 5) {
                this.slowParticleTimer = 0;
                // Particle pooling will be added later
            }
        }

        const isSlowedByTongue = this.slowEffects.some(e => e.source === 'tongue');
        if (isSlowedByTongue) {
            this.slowTrailTimer += tsf;
            if (this.slowTrailTimer >= 4.5) {
                this.slowTrailTimer = 0;
                // Particle pooling will be added later
            }
        }

        let currentSpeed = this.speed * (1 - this.totalSlow);
        if (this.speedBoostTimer > 0) {
            this.speedBoostTimer -= tsf;
            currentSpeed *= 1.5;
        }

        if (this.hitTimer > 0) this.hitTimer -= tsf;
        if (this.damageTextTimer > 0) this.damageTextTimer -= tsf;
        if (this.criticalHitFlashTimer > 0) this.criticalHitFlashTimer -= tsf;
        if (this.shakeDuration > 0) this.shakeDuration -= tsf;
        if (this.healScale > 1) this.healScale -= 0.05 * tsf;
        else this.healScale = 1;

        const ground = this.game.platforms.find(p => p.type === 'ground');
        const distToGround = ground ? ground.y - (this.y + this.height) : 1000;
        this.groundProximity = distToGround < this.game.groundProximityThreshold;

        if (distToGround < 150) {
            this.squash = 1.35;
            this.stretch = 0.65;
        } else {
            const stretch_factor = 0.4;
            this.stretch = 1 + Math.abs(this.kbVy) * stretch_factor;
            this.squash = 1 - Math.abs(this.kbVy) * stretch_factor * 0.5;
        }

        this.animationTimer += 0.1 * tsf;
        if (this.type === 'missile') {
            this.scale = 1 + Math.sin(this.animationTimer) * 0.04;
            this.angle = Math.sin(this.animationTimer * 0.5) * (Math.PI / 18);
        } else if (this.type === 'gummy_worm') {
            this.x += Math.sin(this.y / 30) * 2.5 * tsf;
        } else if (this.type.includes('marshmallow')) {
            this.angle += this.rotationSpeed * tsf;
        }

        this.kbVy *= 0.9;
        // Recovery logic: if knocked up, slowly return to neutral
        if (this.kbVy < 0) {
            this.kbVy = Math.min(0, this.kbVy + (0.05 * tsf)); // Gradually increase towards 0
        }
        this.y += ((currentSpeed + this.kbVy) * tsf);

        if (this.type === 'gummy_worm') {
            if (this.x < 0) this.x = 0;
            if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;
        }

        if (this.y > this.game.PLAYABLE_AREA_HEIGHT - 110) {
            this.game.castleHealth -= this.damage || 10;
            this.game.castleHealthBar.triggerHit();
            this.game.hitStopFrames = 5;
            this.game.screenShake.trigger(5, 10);
            this.reset();
        }
    }

    // Cotton Cloud specific: Searches for loot based on weighted system
    searchForTarget() {
        if (!this.game || !this.game.drops || this.game.drops.length === 0) {
            this.targetLoot = null;
            return;
        }

        // Weighted random selection based on user requirements
        const lootWeights = {
            'ice_cream_scoop': 10,
            'component': 10,
            'heart': 5,
            'coin': 1
        };

        let totalWeight = 0;
        const availableLootWithWeights = [];

        // Filter for active drops and assign weights
        for (const drop of this.game.dropPool.pool) { // Access the raw pool to check activity
            if (drop.active && drop.y < this.game.PLAYABLE_AREA_HEIGHT) { // Only target active drops that are above ground
                const weight = lootWeights[drop.type] || 0; // Get weight, default to 0 if type not listed
                if (weight > 0) {
                    totalWeight += weight;
                    availableLootWithWeights.push({ drop, weight });
                }
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
                this.targetLoot = entry.drop;
                // Pause despawn timer for targetLoot
                if (this.targetLoot.despawnTimer) {
                    this.targetLoot.despawnTimer.pause();
                }
                break;
            }
        }
    }

    // Taffy Wrapper specific: Spawns sugar particles on unwrap
    spawnSugarParticles(count = 5) { // Corrected: Single function declaration with default parameter
        if (!this.game || !this.game.sugarParticlePool) return;

        for (let i = 0; i < count; i++) {
            const particle = this.game.sugarParticlePool.get();
            if (particle) {
                // Spawn from the center of the taffy
                particle.init(this.game, this.x + this.width / 2, this.y + this.height / 2, {
                    color: '#ffc1cc', // Pink sugar (removed duplicate)
                    size: Math.random() * 3 + 1,
                    lifespan: Math.random() * 0.8 + 0.7,
                    speed: Math.random() * 3 + 1
                });
            }
        }
    }

    // New method for Taffy Unwrapping Animation
    triggerTaffyUnwrapAnimation() {
        const image = this.game.taffyWrappedImage;
        if (!image || !image.complete) return;

        // Apply the 33% size reduction here
        const originalSliceWidth = image.width / 2;    // Source width on image
        const originalSliceHeight = image.height / 3;   // Source height on image
        const displaySliceWidth = originalSliceWidth * 0.67; // 33% smaller for display
        const displaySliceHeight = originalSliceHeight * 0.67; // 33% smaller for display

        // Define the 4 corner slices (source rectangle on the wrapped image)
        const cornerSlices = [
            { sx: 0, sy: 0, dx: -1, dy: -3, col: 0, row: 0 }, // Top-left (more upward)
            { sx: originalSliceWidth, sy: 0, dx: 1, dy: -3, col: 1, row: 0 }, // Top-right (more upward)
            { sx: 0, sy: 2 * originalSliceHeight, dx: -1, dy: 0.3, col: 0, row: 2 }, // Bottom-left
            { sx: originalSliceWidth, sy: 2 * originalSliceHeight, dx: 1, dy: 0.3, col: 1, row: 2 } // Bottom-right
        ];

        cornerSlices.forEach(slice => {
            // Initial position for slice to originate from enemy's current x,y + width/height/2
            const sliceInitialX = this.x + (this.width / 2);
            const sliceInitialY = this.y + (this.height / 2);

            // Initial velocity for outward diagonal movement
            const speed = Math.random() * 5 + 3; // Random speed for outward burst
            const vx = slice.dx * speed;
            const vy = slice.dy * speed;

            const rotationSpeed = (Math.random() - 0.5) * 0.3; // Random spin direction and speed

            // Custom properties for taffy unwrap slices
            const sliceGravity = 0.5; // Stronger gravity
            const sliceLifespan = 90; // 1.5 seconds at 60 FPS
            const sliceFadeStart = sliceLifespan * 0.75; // Start fading over the last 0.375 seconds

            // Pass all the init arguments directly to taffyUnwrapSlicePool.get()
            const sliceObj = this.game.taffyUnwrapSlicePool.get(
                this.game,       // game
                image,           // image
                slice.sx,        // sx
                slice.sy,        // sy
                originalSliceWidth,      // sSourceWidth (source width from original image)
                originalSliceHeight,     // sSourceHeight (source height from original image)
                sliceInitialX - (displaySliceWidth / 2), // x (display position)
                sliceInitialY - (displaySliceHeight / 2),// y (display position)
                displaySliceWidth,       // sDisplayWidth
                displaySliceHeight,      // sDisplayHeight
                vx,              // vx
                vy,              // vy
                sliceGravity,    // gravity
                rotationSpeed,   // rotationSpeed
                sliceLifespan,   // lifespan
                sliceFadeStart,  // fadeStart
                '#FFF5F5'        // color for sparks or internal use
            );

            if (sliceObj) {
                // Add spark particles to each corner slice
                for (let i = 0; i < 4; i++) { // More sparks per corner
                    const spark = this.game.taffySparkParticlePool.get(); // Use new pool
                    if (spark) {
                        const sparkSpeed = Math.random() * 3 + 2; // Bigger speed
                        const sparkAngle = Math.atan2(slice.dy, slice.dx) + (Math.random() - 0.5) * Math.PI * 0.5;
                        const sparkVx = Math.cos(sparkAngle) * sparkSpeed;
                        const sparkVy = Math.sin(sparkAngle) * sparkSpeed;
                        // Use sliceObj's position for sparks, pass to TaffySparkParticle.init
                        // TaffySparkParticle.init(game, x, y, color, size, vx, vy, lifespan)
                        spark.init(this.game, sliceObj.x + sliceObj.sDisplayWidth / 2, sliceObj.y + sliceObj.sDisplayHeight / 2, 'white', 0.8, sparkVx * 2, sparkVy * 2, 25); // Bigger and longer lifespan, new init signature
                    }
                }
            }
        });
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();

        if (this.isIceCream && this.speedBoostTimer > 0) {
            ctx.translate(Math.sin(this.game.gameTime * 0.5) * 2, Math.cos(this.game.gameTime * 0.5) * 2);
        }
        if (this.groundProximity) {
            const alpha = Math.abs(Math.sin(this.game.gameTime * 0.1));
            ctx.globalAlpha = 1 - alpha * 0.5;
           
        }
        
        const ground = this.game.platforms.find(p => p.type === 'ground');
        if (ground) {
            const distance = ground.y - (this.y + this.height);
            const maxShadowDistance = 800;
            if (distance < maxShadowDistance && distance > -this.height) {
                const shadowFactor = 1 - (distance / maxShadowDistance);
                const shadowWidth = (this.width * 0.5) * shadowFactor;
                const shadowHeight = shadowWidth * 0.25;
                const shadowOpacity = 0.3 * shadowFactor;
                ctx.fillStyle = `rgba(0, 0, 0, ${shadowOpacity})`;
                ctx.beginPath();
                ctx.ellipse(this.x + this.width / 2, ground.y - 90, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (this.totalSlow > 0) {
            const tongueSlow = this.slowEffects.find(e => e.source === 'tongue');
            if (tongueSlow) {
                const progress = tongueSlow.timer / tongueSlow.initialDuration;
                const alpha = 0.2 + (0.6 * progress);
                ctx.globalAlpha = alpha;
                ctx.filter = 'hue-rotate(180deg) brightness(1.5)';
                this.drawEnemy(ctx);
                ctx.filter = 'none';
                ctx.globalAlpha = 1;
            } else {
                ctx.fillStyle = `rgba(100, 150, 255, ${this.totalSlow * 0.5})`;
                ctx.beginPath();
                ctx.roundRect(this.x, this.y, this.width, this.height, 10);
                ctx.fill();
            }
        }

        ctx.shadowBlur = 15;
        let color = (this.type === 'piggy') ? '#ff69b4' : this.color;
        if(this.hitTimer > 0) color = '#FFFFFF';
        if (this.fireFlashTimer > 0) {
            const alpha = (this.fireFlashTimer / 10);
            color = `rgba(255, 0, 0, ${alpha})`;
        }
        ctx.shadowColor = color;
        ctx.fillStyle = color;

        // Donut phasing effect
        if (this.isDonut && !this.isVulnerable) {
            const phaseAlpha = 0.3 + Math.sin(this.game.gameTime * 0.2) * 0.2; // Pulse between 0.1 and 0.5
            ctx.globalAlpha = phaseAlpha;
        }

        this.drawEnemy(ctx);

        ctx.shadowBlur = 0;

        if (this.isJellyTagged) {
            const crownImg = this.game.tagCrownImage;
            const crownSize = 40; 
            const yOffset = 50; 
            
            const bob = Math.sin(this.game.gameTime * 0.1) * 5;
            const crownX = this.x + (this.width - crownSize) / 2;
            const crownY = this.y - yOffset + bob;

            ctx.drawImage(crownImg, crownX, crownY, crownSize, crownSize);
        }

      if (this.health < this.maxHealth) {
            const pct = Math.max(0, this.health / this.maxHealth);
            const isLow = pct < 0.25;
            
            let sizeMult = 1.0;
            if (this.type === 'piggy') sizeMult = 1.15;
            else if (this.type === 'marshmallow_large') sizeMult = 1.25;
            else if (this.type === 'marshmallow_small') sizeMult = 0.8;
            else if (this.type === 'gummy_worm') sizeMult = 1.33; // Gummy worms health bar 33% bigger

            const pulse = isLow ? 1 + Math.sin(this.game.gameTime * 0.2) * 0.1 : 1;
            const finalMult = sizeMult * pulse;
            
            let offsetX = (this.shakeDuration > 0) ? (Math.random() - 0.5) * this.shakeMagnitude : 0;
            let offsetY = (this.shakeDuration > 0) ? (Math.random() - 0.5) * this.shakeMagnitude : 0;
            
            const barWidth = (this.width * finalMult); // Apply sizeMult directly here
            const barHeight = 18 * finalMult; 
            const barX = (this.x + this.width/2 - barWidth/2) + offsetX;
            const barY = this.y - 22 + offsetY;

            const frameColor = darkenColor(this.color, 10);

            ctx.fillStyle = frameColor + '66'; 
            ctx.beginPath(); ctx.roundRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4, 10); ctx.fill();
            
            ctx.fillStyle = darkenColor(frameColor, 30) + '99'; 
            ctx.beginPath(); ctx.roundRect(barX, barY, barWidth, barHeight, 8); ctx.fill();

            let healthFillColor = '#2ecc71';
            if (pct < 0.25) healthFillColor = '#ff3131';
            else if (pct < 0.60) healthFillColor = '#f1c40f';
            
            ctx.fillStyle = (this.hitTimer > 0) ? '#FFFFFF' : healthFillColor;
            ctx.beginPath(); ctx.roundRect(barX, barY, barWidth * pct, barHeight, 8); ctx.fill();

            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath(); ctx.roundRect(barX + 2, barY + 2, barWidth - 4, barHeight / 3, 8); ctx.fill();

            if (this.damageTextTimer > 0) {
                const alpha = Math.sin((this.damageTextTimer / 30) * Math.PI);
                ctx.save();
                ctx.globalAlpha = alpha; 
                ctx.font = 'bold 60px "VT323"';
                ctx.textAlign = 'center';
                
                const tx = barX + barWidth / 2;
                const ty = barY + 5;
                const val = Math.ceil(this.health);

                ctx.strokeStyle = '#213625ff';
                ctx.lineWidth = 3;
                ctx.strokeText(val, tx, ty);

                ctx.fillStyle = 'white';
                ctx.fillText(val, tx, ty);
                
                ctx.restore();
            }
        }
        ctx.restore();
    }

    drawEnemy(ctx) {
        const shadowOffset = 5;
        const shadowDarkness = 20;
        const shadowColor = darkenColor(this.color, shadowDarkness);

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        if (this.type === 'piggy') {
            const piggyLevel = this.game.stats.piggyLvl;
            const sizeMultiplier = 1.0 + (piggyLevel * 0.1);
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(this.squash * sizeMultiplier, this.stretch * sizeMultiplier);
            
            if (piggyLevel > 0) {
                ctx.globalAlpha = 0.6 + Math.sin(this.game.gameTime / 8) * 0.4;
                ctx.fillStyle = 'gold';
                const auraSize = this.width * 1.2;
                ctx.beginPath();
                ctx.arc(0, 0, auraSize / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }

            if (this.game.piggybankImage && this.game.piggybankImage.complete) {
                ctx.drawImage(this.game.piggybankImage, -this.width / 2, -this.height / 2, this.width, this.height);
            }
            
            ctx.restore();
        } else if (this.type === 'gummy_worm') {
            const segments = 10;
            const segmentHeight = this.height / segments;
            const wiggleAmplitude = 4;
            const wiggleFrequency = 0.2;
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;

            ctx.save();
            ctx.translate(cx, cy + shadowOffset);
            ctx.scale(this.squash * 1.09, this.stretch * 1.09);
            const borderColor1 = darkenColor(this.color1, shadowDarkness);
            const borderColor2 = darkenColor(this.color2, shadowDarkness);
            const borderGrad = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
            borderGrad.addColorStop(0, borderColor1);
            borderGrad.addColorStop(1, borderColor2);
            ctx.strokeStyle = borderGrad; ctx.lineWidth = this.width + 4; ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const yPos = -this.height/2 + i * segmentHeight;
                const xPos = Math.sin(i * wiggleFrequency + this.animationTimer) * wiggleAmplitude;
                if (i === 0) ctx.moveTo(xPos, yPos);
                else ctx.lineTo(xPos, yPos);
            }
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(this.squash, this.stretch);
            const grad = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
            if (this.hitTimer > 0) {
                grad.addColorStop(0, 'white'); grad.addColorStop(1, 'white');
            } else {
                grad.addColorStop(0, this.color1); grad.addColorStop(1, this.color2);
            }
            ctx.strokeStyle = grad; ctx.lineWidth = this.width; ctx.lineCap = 'round';
            ctx.beginPath();
            for (let i = 0; i <= segments; i++) {
                const yPos = -this.height/2 + i * segmentHeight;
                const xPos = Math.sin(i * wiggleFrequency + this.animationTimer) * wiggleAmplitude;
                if (i === 0) ctx.moveTo(xPos, yPos);
                else ctx.lineTo(xPos, yPos);
            }
            ctx.stroke();
            ctx.restore();
        } else if (this.type.includes('marshmallow')) {
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.angle);
            ctx.scale(this.squash, this.stretch);

            if (this.image && this.image.complete) {
                ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            }
            ctx.restore();
        } else if (this.type === 'cotton_cloud') {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(this.scaleX, this.scaleY);
            if (this.image && this.image.complete) {
                ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            }
            ctx.restore();
        } else if (this.type === 'taffy_wrapper') {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.scale(this.scale, this.scale); // Apply pop animation scale
            if (this.isWrapped && this.game.taffyWrappedImage && this.game.taffyWrappedImage.complete) {
                ctx.drawImage(this.game.taffyWrappedImage, -this.width / 2, -this.height / 2, this.width, this.height);
            } else if (!this.isWrapped && this.game.taffyUnwrappedImage && this.game.taffyUnwrappedImage.complete) {
                ctx.drawImage(this.game.taffyUnwrappedImage, -this.width / 2, -this.height / 2, this.width, this.height);
            }
            ctx.restore();
        }
       else {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2; // Removed +40 offset

            ctx.save();
            if (this.hitTimer > 0) {
                ctx.filter = 'brightness(2)';
            }
            ctx.translate(cx, cy);
            ctx.rotate(this.angle);
            ctx.scale(this.scale, this.scale); // Apply animation scale
            
            if (this.sprite) {
                this.sprite.draw(
                    ctx, 
                    0, 40, // Lower the sprite by 10 pixels
                    this.width, 
                    this.height, 
                    this.stretch - 1, 
                    this.squash - 1
                );
            } else if (this.image && this.image.complete) {
                ctx.drawImage(this.image, -this.width / 2, -this.height / 2, this.width, this.height);
            }
            ctx.restore();
        }
    }
    
    kill(spawnX = this.x, spawnY = this.y) {
        if (!this.active) return;

        let numDebris = 0;
        let numCols = 2; // Default for most enemies
        let numRows = 2; // Default for most enemies

        if (this.type === 'gummy_cluster') {
            numDebris = 4 + Math.floor(Math.random() * 3);
            numCols = 3;
            numRows = 3;
        } else if (this.type === 'gummy_worm') {
            numDebris = 2 + Math.floor(Math.random() * 2); // 2-3 pieces
            numCols = 1; // 1 column
            numRows = 4; // 4 rows
        } else { // For regular enemies
            numDebris = 2 + Math.floor(Math.random() * 2); // 2-3 pieces
            numCols = 2;
            numRows = 2;
        }

        for (let i = 0; i < numDebris; i++) {
            let spriteWidth = this.width;
            let spriteHeight = this.height;

            if (this.type === 'missile' && this.sprite) {
                spriteWidth = this.sprite.frameWidth;
                spriteHeight = this.sprite.frameHeight;
            } else if (this.type === 'piggy') {
                const piggyLevel = this.game.stats.piggyLvl;
                const sizeMultiplier = 1.0 + (piggyLevel * 0.1);
                spriteWidth = this.width * sizeMultiplier;
                spriteHeight = this.height * sizeMultiplier;
            }
            
            const imageForDebris = this.sprite ? this.sprite.image : this.image;
            this.game.enemyDebrisPool.get(this.game, this, imageForDebris, spriteWidth, spriteHeight, numCols, numRows);
        }
        
        const numParticles = Math.min(50, 10 + Math.floor(this.maxHealth / 30));
        const source = this.lastDamageSource;

        for (let i = 0; i < numParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const color = source && source.isCrit ? '#FFD700' : this.color;
            this.game.particlePool.get(this.game, spawnX + this.width / 2, spawnY + this.height / 2, color, 'spark', 0.75, vx, vy);
        }

       let intensity = 4; 
        if (this.type === 'marshmallow_large') intensity = 5;
        else if (this.type === 'marshmallow_medium') intensity = 4;
        else if (this.type === 'marshmallow_small') intensity = 2;
        else if (this.type === 'piggy') intensity = 5;

        import('./utils.js?v=26').then(utils => {
            if (utils.ScreenShake && typeof utils.ScreenShake.trigger === 'function') {
                utils.ScreenShake.trigger(intensity, 15);
            }
        });
        
        let xpGained = 10 + (this.maxHealth / 10);
        const xpMultiplier = this.game.emporium.getEnemyXpMultiplier();
        xpGained *= xpMultiplier;

        if (this.type === 'marshmallow_large') {
            const parentHeight = this.height;
            const childHeight = 45 * 1.33;
            const spawnY_child = spawnY + (parentHeight / 2) - (childHeight / 2) - 90;
            for (let i = 0; i < 2; i++) {
                const missile = this.game.enemyPools['marshmallow_medium'].get(this.game, spawnX + (i * 30) - 15, 'marshmallow_medium', spawnY_child);
            }
            this.reset();
            return;
        }

        if (this.type === 'marshmallow_medium') {
            const parentHeight = this.height;
            const childHeight = 22 * 1.5;
            const spawnY_child = spawnY + (parentHeight / 2) - (childHeight / 2) - 90;
            for (let i = 0; i < 2; i++) {
                const missile = this.game.enemyPools['marshmallow_small'].get(this.game, spawnX + (i * 20) - 10, 'marshmallow_small', spawnY_child);
            }
            this.reset();
            return;
        }

        const pStats = this.game.stats.piggyStats;
        
        this.game.enemiesKilled++;

        if (this.game.wasLickKill && this.game.player.upgrades['Sugar Rush'] > 0) {
            this.game.player.sugarRushTimer = 300;
        }

        const soul = this.game.soulPool.get(this.game, spawnX + this.width / 2, spawnY + this.height / 2);

        // Cotton Cloud specific: Drop loot if it was stolen
        if (this.type === 'cotton_cloud' && this.lootParented && this.targetLoot) {
            this.targetLoot.x = spawnX + this.width / 2 - this.targetLoot.width / 2;
            this.targetLoot.y = spawnY + this.height / 2 - this.targetLoot.height / 2;
            this.targetLoot.vx = (Math.random() - 0.5) * 5; // Random horizontal velocity
            this.targetLoot.vy = (Math.random() * -3); // Upward initial velocity
            this.targetLoot.applyGravity = true; // Assuming loot objects have this
            this.targetLoot.active = true; // Ensure loot is active and independent
            if (this.targetLoot.despawnTimer) {
                this.targetLoot.despawnTimer.unpause();
                this.targetLoot.despawnTimer.reset();
            }
        }

        // --- New Drop Logic ---
        const isMarshmallow = (this.type === 'marshmallow_large' || this.type === 'marshmallow_medium');
        let dropMultiplier = (this.type === 'piggy') ? pStats.mult : 1;

        // Apply JellyTag effect to drop multiplier
        if (this.isJellyTagged) {
            dropMultiplier *= 2;
        }

        // Piggy Bank specific bonus money
        if (this.type === 'piggy') {
            const bonus = Math.floor(this.game.money * pStats.bonus);
            this.game.money += bonus;
            this.game.totalMoneyEarned += bonus;
            this.game.handlePiggyDeath(bonus);
        }

        for (let i = 0; i < dropMultiplier; i++) {
            // Guaranteed Drops (Small Coin and XP Orb) for most enemies
            if (!isMarshmallow) {
                this.game.dropPool.get(this.game, spawnX, spawnY, 'coin'); // One small coin
                this.game.dropPool.get(this.game, spawnX, spawnY, 'xp_orb', xpGained); // One XP orb
            }

            // Chance-based Drops (Lucky Coin, Heart, Component)
            const randLuckyCoin = Math.random() * 100;
            if (randLuckyCoin < this.game.stats.luckCoin) {
                this.game.dropPool.get(this.game, spawnX, spawnY, 'lucky_coin');
            }

            // Heart Drop Logic
            let finalHeartChance = this.game.stats.luckHeart; // Base chance
            if (this.type === 'heartenemy') { // Guaranteed drop for heartenemy
                finalHeartChance = 100;
            }
            if (Math.random() * 100 < finalHeartChance) {
                this.game.dropPool.get(this.game, spawnX, spawnY, 'heart');
            }
            
            // Component Drop Logic
            let componentDropChance = 0.5 + (this.game.stats.luckLvl * 0.25);
            if (this.type === 'component_enemy') { // Guaranteed drop for component_enemy
                 componentDropChance = 100; 
            }
            if (Math.random() * 100 < componentDropChance) {
                this.game.dropPool.get(this.game, spawnX, spawnY, 'component');
            }

            // Ice Cream Scoop chance
            const iceCreamChance = this.game.emporium.getIceCreamChance();
            let finalIceCreamChance = (this.type === 'piggy') ? iceCreamChance[1] : iceCreamChance[0]; // Base chance
            if (this.type === 'ice_cream') { // Guaranteed drop for ice_cream enemy
                finalIceCreamChance = 100;
            }
            if (Math.random() * 100 < finalIceCreamChance) {
                this.game.dropPool.get(this.game, spawnX, spawnY, 'ice_cream_scoop');
            }
        }


        this.reset();
    }
}