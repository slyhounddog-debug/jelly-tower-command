import Particle from './particle.js';
import WaveAttack from './waveAttack.js';
import Gumball from './gumball.js';
import FrostingParticle from './frostingParticle.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.width = 55; this.height = 100; this.color = '#ffc1cc';
        this.scaleX = 1; this.scaleY = 1;
        this.lickCooldown = 0; this.lickAnim = 0;

        this.baseAcceleration = 1.815 * 1.25;
        this.baseJumpForce = -26;
        this.baseAirJumpForce = -26;
        this.baseDashCooldown = 40;
        this.baseLickRange = 140;

        this.acceleration = this.baseAcceleration;
        this.jumpForce = this.baseJumpForce;
        this.airJumpForce = this.baseAirJumpForce;
        this.dashCooldown = 0;
        this.lickRange = this.baseLickRange;
        this.basePickupRange = 80;
        this.pickupRange = this.basePickupRange;

        this.maxVel = 12.1; 
        this.gravity = 1.2;
        this.passThroughTimer = 0;
        this.lickAngle = 0;
        this.lastAPress = 0;
        this.lastDPress = 0;
        this.dashSpeed = 30;
        this.jumpSquash = 0;
        this.maxJumps = 2;
        this.firstComponentCollected = false;
        this.collectedComponents = [];
        this.equippedComponents = [];
        this.maxComponentPoints = 3;
        this.characterImage = new Image();
        this.characterImage.src = 'assets/Images/character.png';
        this.tongueTipX = 0;
        this.tongueTipY = 0;
        this.shockwaveAnimations = [];
        this.reset();
    }
    reset() {
        this.x = this.game.width / 2; this.y = this.game.height - 350; this.vx = 0; this.vy = 0;
        this.isOnGround = false; this.isControlling = null;
        this.jumpsLeft = 2; this.jumpLock = false;
        this.isPassingThrough = false;
        this.transitionState = null; this.transitionProgress = 0; this.transitionTarget = null;
        this.dashCooldown = 0;
        this.lastAPress = 0;
        this.lastDPress = 0;
        this.jumpSquash = 0;
        this.maxJumps = 2;
        this.firstComponentCollected = false;
        this.collectedComponents = [];
        this.equippedComponents = [];
        this.maxComponentPoints = 3;
        
        // Leveling
        this.level = 1;
        this.xp = 0;
        this.xpForNextLevel = 100;
        this.totalMoneyEarned = 0;
        this.upgrades = {
            // Normals
            'Sweet Aura': 0,
            'Tinkerer': 0,
            'Greed': 0,
            'Long Tongue': 0,
            'Sticky Paw': 0,
            // Rares
            'Winged Boots': 0,
            'Air Tricks': 0,
            'Ice Tongue': 0,
            
            'Squishy Butt': 0,
            'Sugar Rush': 0,
            // Legendaries
            'Dash Flash': 0,
            'Twin Scoop': 0,
            'Lick Mania': 0,
        };

        this.acceleration = this.baseAcceleration;
        this.jumpForce = this.baseJumpForce;
        this.airJumpForce = this.baseAirJumpForce;
        this.lickRange = this.baseLickRange;
        this.pickupRange = this.basePickupRange;
        this.baseSlowAuraRange = 100;
        this.slowAuraRange = this.baseSlowAuraRange;
        this.lastDashTime = 0;
        this.isWhirlwinding = false;
        this.whirlwindTimer = 0;
        this.whirlwindAngle = 0;
        this.auraParticleTimer = 0;
        this.sugarRushTimer = 0;
        this.tongueTipX = 0;
        this.tongueTipY = 0;
        this.shockwaveAnimations = [];
    }
    tryDash(direction) {
        if (this.dashCooldown <= 0) {
            this.vx += this.dashSpeed * direction;
            this.dashCooldown = this.baseDashCooldown;
            this.game.audioManager.playSound('dash');
            this.lastDashTime = Date.now();

            if (this.upgrades['Dash Flash'] > 0) {
                const hitboxX = this.x - this.width / 2;
                const hitboxY = this.y - this.height / 2;
                const hitboxWidth = this.width * 2;
                const hitboxHeight = this.height * 2;

                this.game.missiles.forEach(m => {
                    if (hitboxX < m.x + m.width && hitboxX + hitboxWidth > m.x &&
                        hitboxY < m.y + m.height && hitboxY + hitboxHeight > m.y) {
                        m.takeDamage(this.game.stats.lickDamage * 2, false);
                        m.kbVy = -this.game.stats.lickKnockback * .3;
                    }
                });

                const angle = Math.atan2(this.vy, this.vx);
                this.game.waveAttacks.push(new WaveAttack(this.game, this.x + this.width / 2, this.y + this.height / 2, angle, 2, this.vx));
            }

            // Add dash particle effect
            for (let i = 0; i < 10; i++) { // More particles for a dash
                this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height / 2, 'rgba(255, 255, 255, 0.7)', 'spark'));
            }
        }
    }
    tryLick() {
        if (this.lickCooldown > 0) return;

        if (this.upgrades['Lick Mania'] > 0 && (Date.now() - this.lastDashTime < 200)) {
            this.isWhirlwinding = true;
            this.whirlwindTimer = 100; // 1.5 seconds
            this.lickCooldown = 101; // 1.5 second cooldown
            this.game.audioManager.playSound('dash'); // Temporary sound
            return;
        }

        this.game.audioManager.playSound('mlem');
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        this.lickAngle = Math.atan2(this.game.mouse.y - cy, this.game.mouse.x - cx);
        this.lickAnim = 15;
        this.lickCooldown = 20;
        this.hitEnemies = [];
    }
    update(tsf) {
        this.lickRange = this.baseLickRange * (1 + this.upgrades['Long Tongue'] * 0.2);
        if (this.jumpSquash > 0) this.jumpSquash -= tsf;
        if (this.dashCooldown > 0) this.dashCooldown -= tsf;
        if (this.sugarRushTimer > 0) this.sugarRushTimer -= tsf;

        if (this.isWhirlwinding) {
            this.whirlwindTimer -= tsf;
            if (this.whirlwindTimer <= 0) {
                this.isWhirlwinding = false;
            }
            this.whirlwindAngle += 0.8 * tsf; // Faster rotation

            const whirlwindRange = this.lickRange * 1.3;
            this.game.missiles.forEach(m => {
                const dist = Math.hypot(this.x - m.x, this.y - m.y);
                if (dist < whirlwindRange) {
                    if(m.takeDamage(this.game.stats.lickDamage * 0.1, false)) {
                        m.kill('tongue');
                    }
                    if (this.upgrades['Ice Tongue'] > 0) {
                        m.applySlow(180, 0.5, 'tongue'); // 3 seconds, 50% slow
                    }
                }
            });
        }

        if (this.lickAnim > 0) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const animPhase = (15 - this.lickAnim) / 15;
            const animCurve = Math.sin(animPhase * Math.PI);
            const lickDistance = this.lickRange * animCurve;
            const lickSegments = 10;
            const lickLength = this.lickRange;

            // --- Drop Collision ---
            this.game.drops.forEach(d => {
                if (d.isBeingLicked || (this.game.gameTime - d.spawnTime < 30)) return; // Already being licked or too new

                let hit = false;
                for (let i = 1; i <= lickSegments; i++) {
                    const progress = i / lickSegments;
                    const drag = 2.5;
                    const shiftX = Math.sin(progress * Math.PI) * (this.vx * drag);
                    const shiftY = Math.sin(progress * Math.PI) * (this.vy * drag);
                    const checkX = cx + Math.cos(this.lickAngle) * (lickLength * progress) - shiftX;
                    const checkY = cy + Math.sin(this.lickAngle) * (lickLength * progress) - shiftY;

                    const dropCenterX = d.x + d.width / 2;
                    const dropCenterY = d.y + d.width / 2;
                    const dropRadius = d.width / 2;

                    if (Math.hypot(checkX - dropCenterX, checkY - dropCenterY) < dropRadius + 10) { // 10 is a small tolerance
                        hit = true;
                        break;
                    }
                }

                if (hit) {
                    d.isBeingLicked = true;
                    d.lickedByPlayer = this;
                    d.vx = 0; // Disable drop's physics
                    d.vy = 0;
                    d.gravity = 0;
                    d.life = 600; // Give it a longer life to be brought back
                }
            });

            // --- Missile Collision ---
            this.game.missiles.forEach(m => {
                let hit = false;
                for (let i = 1; i <= lickSegments; i++) {
                    const progress = i / lickSegments;
                    const drag = 2.5;
                    const shiftX = Math.sin(progress * Math.PI) * (this.vx * drag);
                    const shiftY = Math.sin(progress * Math.PI) * (this.vy * drag);
                    const checkX = cx + Math.cos(this.lickAngle) * (lickLength * progress) - shiftX;
                    const checkY = cy + Math.sin(this.lickAngle) * (lickLength * progress) - shiftY;

                    const missileCx = m.x + m.width / 2;
                    const missileCy = m.y + m.height / 2;

                    if (Math.hypot(missileCx - checkX, missileCy - checkY) < 35) {
                        hit = true;
                        break;
                    }
                }

                if (hit && !this.hitEnemies.includes(m.id)) {
                    this.hitEnemies.push(m.id);
                    if (this.upgrades['Jelly Tag'] > 0) {
                        m.isJellyTagged = true;
                    }
                    if (m.takeDamage(this.game.stats.lickDamage, false)) {
                        m.kill('tongue');
                    }
                    if (this.upgrades['Ice Tongue'] > 0) {
                        m.applySlow(180, 0.5, 'tongue');
                    }
                    m.kbVy = -this.game.stats.lickKnockback * 0.3;
                    this.game.screenShake.trigger(4, 10);
                    for (let i = 0; i < 15; i++) {
                        this.game.particles.push(new Particle(this.game, m.x, m.y, this.color, 'spark'));
                        if (i < 5) this.game.particles.push(new Particle(this.game, m.x, m.y, '#fff', 'smoke'));
                    }
                    this.spawnGumballs(m.x + m.width / 2, m.y + m.height / 2, m);
                }
            });

            // --- Boss Collision ---
            if (this.game.boss) {
                let hit = false;
                const boss = this.game.boss;
                for (let i = 1; i <= lickSegments; i++) {
                    const progress = i / lickSegments;
                    const drag = 2.5;
                    const shiftX = Math.sin(progress * Math.PI) * (this.vx * drag);
                    const shiftY = Math.sin(progress * Math.PI) * (this.vy * drag);
                    const checkX = cx + Math.cos(this.lickAngle) * (lickLength * progress) - shiftX;
                    const checkY = cy + Math.sin(this.lickAngle) * (lickLength * progress) - shiftY;

                    // Simple AABB check for boss
                    if (checkX > boss.x && checkX < boss.x + boss.width &&
                        checkY > boss.y && checkY < boss.y + boss.height) {
                        hit = true;
                        break;
                    }
                }

                if (hit && !this.hitEnemies.includes(boss.id)) {
                    this.hitEnemies.push(boss.id);
                    boss.takeDamage(this.game.stats.lickDamage, false);
                    this.game.screenShake.trigger(4, 10);
                    for (let i = 0; i < 15; i++) {
                        this.game.particles.push(new Particle(this.game, boss.x + boss.width/2, boss.y + boss.height/2, this.color, 'spark'));
                        if (i < 5) this.game.particles.push(new Particle(this.game, boss.x + boss.width/2, boss.y + boss.height/2, '#fff', 'smoke'));
                    }
                    this.spawnGumballs(boss.x + boss.width / 2, boss.y + boss.height / 2, boss);
                }
            }
        }

        if (this.transitionState === 'entering') {
            this.transitionProgress += 0.125 * tsf;
            const targetX = this.transitionTarget.x + this.transitionTarget.width / 2 - this.width / 2;
            const targetY = this.transitionTarget.y + this.transitionTarget.height / 2 - this.height / 2;
            this.x += (targetX - this.x) * this.transitionProgress * 0.2;
            this.y += (targetY - this.y) * this.transitionProgress * 0.2;
            this.scaleX = 1 - this.transitionProgress;
            this.scaleY = 1 + this.transitionProgress * 0.5;

            if (this.transitionProgress >= 1) {
                this.isControlling = this.transitionTarget;
                this.transitionState = null;
                this.transitionProgress = 0;
            }
            return;
        }

        if (this.transitionState === 'leaving') {
            this.transitionProgress += 0.125 * tsf;
            this.scaleX = 1 - this.transitionProgress * 0.5;
            this.scaleY = 1 + this.transitionProgress;
            this.y -= 2 * tsf;

            if (this.transitionProgress >= 1) {
                this.transitionState = null;
                this.transitionProgress = 0;
                this.scaleX = 1; this.scaleY = 1;
            }
            return;
        }

        if (this.isControlling) {
            this.vx = 0; this.vy = 0;
            if (this.game.keys['e'] && !this.keyLock) {
                const tower = this.isControlling;
                this.isControlling = null;
                this.scaleX = 0; this.scaleY = 0;
                this.x = tower.x + tower.width / 2 - this.width / 2;
                this.y = tower.y - this.height;
                this.transitionState = 'leaving';
                this.keyLock = true;
                setTimeout(() => this.keyLock = false, 300);
            }
            return;
        }

        if (this.lickCooldown > 0) this.lickCooldown -= tsf;
        if (this.lickAnim > 0) this.lickAnim -= tsf * 1.2;

        if (this.game.keys['a']) this.vx -= this.acceleration * tsf;
        if (this.game.keys['d']) this.vx += this.acceleration * tsf;

        this.vx *= (0.85 ** tsf);

        if (this.game.keys['s'] && this.isOnGround && this.passThroughTimer <= 0) {
            const pIdx = this.game.platforms.findIndex(p => {
                const hitboxY = p.y + (p.hitboxOffsetY || 0);
                const hitboxX = p.x + (p.hitboxOffsetX || 0);
                return (p.type === 'cloud' || p.type === 'castle') &&
                       this.x < hitboxX + p.width &&
                       this.x + this.width > hitboxX &&
                       this.y + this.height >= hitboxY - 1 &&
                       this.y + this.height <= hitboxY + 10;
            });
            if (pIdx !== -1) {
                this.isPassingThrough = true;
                this.y += 10;
                this.passThroughTimer = 20;
                this.isOnGround = false;
            }
        }
        if (this.passThroughTimer > 0) { this.passThroughTimer -= tsf; if (this.passThroughTimer <= 0) this.isPassingThrough = false; }

        if ((this.game.keys[' '] || this.game.keys['w']) && !this.jumpLock) {
            if (this.isOnGround) {
                this.vy = this.jumpForce; this.isOnGround = false; this.jumpsLeft = this.maxJumps - 1; this.jumpLock = true;
                this.jumpSquash = 15;
                this.game.audioManager.playSound('jump');
                // Spawn frosting particles for jumping
                const numParticles = 8 + Math.floor(Math.random() * 4);
                for (let i = 0; i < numParticles; i++) {
                    const radius = Math.random() * 4 + 2;
                    const color = this.game.FROSTING_COLORS[Math.floor(Math.random() * this.game.FROSTING_COLORS.length)];
                    const lifespan = 50 + Math.random() * 20;
                    const vx = (Math.random() - 0.5) * 8;
                    const vy = -Math.random() * 8 - 3.5;
                    this.game.frostingParticles.push(new FrostingParticle(this.game, this.x + this.width / 2, this.y + this.height, vx, vy, radius, color, lifespan));
                }
            } else if (this.jumpsLeft > 0) {
                this.vy = this.airJumpForce; this.jumpsLeft--; this.jumpLock = true;
                this.jumpSquash = 15;
                for (let i = 0; i < 5; i++) this.game.particles.push(new Particle(this.game, this.x + this.width / 2, this.y + this.height, '#fff'));
                this.game.audioManager.playSound('midAirJump');
                // Spawn frosting particles for double jumping
                const numParticles = 4 + Math.floor(Math.random() * 4);
                for (let i = 0; i < numParticles; i++) {
                    const radius = Math.random() * 4 + 2;
                    const color = this.game.FROSTING_COLORS[Math.floor(Math.random() * this.game.FROSTING_COLORS.length)];
                    const lifespan = 50 + Math.random() * 20;
                    const vx = (Math.random() - 0.5) * 4;
                    const vy = -Math.random() * 5 - 2;
                    this.game.frostingParticles.push(new FrostingParticle(this.game, this.x + this.width / 2, this.y + this.height, vx, vy, radius, color, lifespan));
                }
            }
        }
        if (!this.game.keys[' '] && !this.game.keys['w']) this.jumpLock = false;

        if (this.game.keys['s'] && !this.isOnGround) {
            this.vy += 0.9;
        }

        this.vy += this.gravity * tsf;

        if (this.upgrades['Winged Boots'] > 0 && (this.game.keys[' '] || this.game.keys['w']) && this.vy > 0) {
            this.vy = 2; // Glide speed
        }
        
        // --- FIXED COLLISION LOGIC ---
        this.x += this.vx * tsf;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;

        const wasOnGround = this.isOnGround;
        this.isOnGround = false;

        this.game.platforms.forEach((p) => {
            let hitboxX = p.x + (p.hitboxOffsetX || 0);
            let hitboxY = p.y + (p.hitboxOffsetY || 0);
            let hitboxWidth = p.width;
            let hitboxHeight = p.height;

            if (p.type === 'castle') {
                hitboxWidth *= 0.8;
                hitboxHeight *= 0.95;
                hitboxX += (p.width - hitboxWidth) / 2;
                hitboxY += (p.height - hitboxHeight) / 2;
            } else if (p.type === 'cloud') {
                hitboxWidth *= 0.85;
                hitboxX += (p.width - hitboxWidth) / 2;
            }

            if ((p.type === 'cloud' || p.type === 'castle') && this.isPassingThrough) return;
            const isMovingDown = this.vy >= 0;
            const playerWasAbove = (this.y) + this.height <= hitboxY + 2; 
            const horizontalOverlap = this.x < hitboxX + hitboxWidth && this.x + this.width > hitboxX;
            const verticalOverlap = (this.y + this.vy * tsf) + this.height > hitboxY && (this.y + this.vy * tsf) < hitboxY + hitboxHeight;
            
            if (horizontalOverlap && verticalOverlap && isMovingDown && playerWasAbove) {
                if (!wasOnGround && this.vy > 5) {
                    this.game.audioManager.playSound('land');
                    // Spawn frosting particles for landing
                    const numParticles = 2 + Math.floor(Math.random() * 6 * (this.vy / 5) + (this.vx / 22));
                    for (let i = 0; i < numParticles; i++) {
                        const radius = Math.random() * 4 + 2;
                        const color = this.game.FROSTING_COLORS[Math.floor(Math.random() * this.game.FROSTING_COLORS.length)];
                        const lifespan = 60 + Math.random() * 30 * (this.vy / 20);
                        const vx = (Math.random() + (this.vx / 19) - 0.5) * 6 * (this.vy / 20);
                        const vy = -Math.random() * 8 * (this.vy / 17);
                        this.game.frostingParticles.push(new FrostingParticle(this.game, this.x + this.width / 2, this.y + this.height, vx, vy, radius, color, lifespan));
                    }

                    if (this.upgrades['Squishy Butt'] > 0) {
                        const shockwaveRange = this.lickRange * 0.76;
                        this.game.missiles.forEach(m => {
                            const dist = Math.hypot(this.x - m.x, this.y - m.y);
                            if (dist < shockwaveRange) {
                                m.takeDamage(this.game.stats.lickDamage, false);
                                m.kbVy = -this.game.stats.lickKnockback * .3;
                            }
                        });
                        this.shockwaveAnimations.push({
                            x: this.x + this.width / 2,
                            y: this.y + this.height,
                            maxRadius: shockwaveRange,
                            timer: 0,
                            maxTimer: 38, // half a second
                            rings: [
                                { progress: 0, speed: 1 },
                                { progress: -0.2, speed: 1 },
                                { progress: -0.4, speed: 1 }
                            ]
                        });
                    }
                }
                this.y = hitboxY - this.height; 
                this.vy = 0;
                this.isOnGround = true;
                this.jumpsLeft = this.maxJumps;
                if (this.isPassingThrough) this.isPassingThrough = false;
                if (!wasOnGround) this.jumpSquash = 15;
            }
        });
        
        // Only apply gravity movement if we didn't just snap to a floor
        if (!this.isOnGround) {
            this.y += this.vy * tsf;
        }

        // Update shockwave animations
        for (let i = this.shockwaveAnimations.length - 1; i >= 0; i--) {
            const anim = this.shockwaveAnimations[i];
            anim.timer += tsf;
            if (anim.timer >= anim.maxTimer) {
                this.shockwaveAnimations.splice(i, 1);
                continue;
            }
            anim.rings.forEach(ring => {
                if (ring.progress >= 0) {
                    ring.progress += (ring.speed / anim.maxTimer) * tsf;
                } else {
                    ring.progress += (1 / anim.maxTimer) * tsf;
                }
            });
        }

        // --- ENHANCED SQUASH/STRETCH ---
        if (this.jumpSquash > 0) {
            const progress = this.jumpSquash / 15;
            this.scaleY = 1 - Math.sin(progress * Math.PI) * 0.3;
            this.scaleX = 1 + Math.sin(progress * Math.PI) * 0.3;
        } else if (this.isOnGround) {
            this.scaleX += (1 - this.scaleX) * 0.3; 
            this.scaleY += (1 - this.scaleY) * 0.3;
            // Breathe/Bounce only when moving
            if (Math.abs(this.vx) > 0.5) { 
                const bounce = Math.sin(this.game.gameTime * 0.4) * 0.02;
                this.scaleY += bounce;
                this.scaleX -= bounce;

                // Spawn frosting particles for movement
                const speedFactor = Math.floor(Math.abs(this.vx) / 5); 
                const numParticles = .3 + Math.min(speedFactor, 2);
                for (let i = 0; i < numParticles; i++) {
                    const radius = Math.random() * 4 + 1;
                    const color = this.game.FROSTING_COLORS[Math.floor(Math.random() * this.game.FROSTING_COLORS.length)];
                    const lifespan = 30 + Math.random() * 20;
                    const vx = -this.vx * 0.7 + (Math.random() - 0.5) * 1.7;
                    const vy = -Math.random() * 2 - .5 - (Math.abs(this.vx / 7));
                    this.game.frostingParticles.push(new FrostingParticle(this.game, this.x + this.width / 2, this.y + this.height, vx, vy, radius, color, lifespan));
                }
            }
        } else {
            // Cap the stretch so he doesn't look like a needle when falling fast
            const stretchVal = Math.min(Math.abs(this.vy) * 0.015, 0.4);
            if (this.vy < 0) { 
                this.scaleY = 1 + stretchVal;
                this.scaleX = 1 - stretchVal * 0.5;
            } else { 
                this.scaleY = 1 - stretchVal * 0.5;
                this.scaleX = 1 + stretchVal;
            }
        }

        if (this.game.keys['e'] && !this.keyLock && !this.isControlling) {
            this.game.towers.forEach(t => {
                if (!this.transitionState && Math.hypot((t.x + 23) - (this.x + 14), (t.y + 23) - (this.y + 20.5)) < 144) {
                    this.transitionState = 'entering';
                    this.transitionTarget = t;
                    this.transitionProgress = 0;
                    this.keyLock = true;
                    setTimeout(() => this.keyLock = false, 300);
                }
            });
        }
    }
      getEquippedComponentCount(componentName) {
          return this.equippedComponents.filter(c => c.name === componentName).length;
      }

    spawnGumballs(x, y, spawner, count = 2) {
        if (this.upgrades['Gumball Volley'] > 0) {
            for (let i = 0; i < count; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = 5 + Math.random() * 3;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const randomColor = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
                this.game.gumballs.push(new Gumball(this.game, x, y, vx, vy, this.game.stats.lickDamage * 0.5, randomColor, spawner));
            }
        }
    }
      draw(ctx) {
        if (this.isControlling) return;

        // Sweet Aura Effect
        if (this.upgrades['Sweet Aura'] > 0) {
            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const radius = this.lickRange * ((Math.sin(this.game.gameTime * 0.1) + 1) / 2 * 0.2 + 0.8);
            
            // Pulsing glow
            const gradient = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius);
            const pulse = (Math.sin(this.game.gameTime * 0.15) + 1) / 2;
            gradient.addColorStop(0, `rgba(255, 255, 220, ${0.45 * pulse})`);
            gradient.addColorStop(1, `rgba(255, 255, 220, 0)`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();

            // Light shafts
            const shafts = 5 + (this.upgrades['Sweet Aura'] * 2);
            ctx.save();
            ctx.translate(cx, cy);
            for (let i = 0; i < shafts; i++) {
                ctx.rotate((Math.PI * 2 / shafts));
                const shaftGradient = ctx.createLinearGradient(0, 0, radius, 0);
                shaftGradient.addColorStop(0, `rgba(255, 255, 240, ${0.5 * pulse})`);
                shaftGradient.addColorStop(1, `rgba(255, 255, 240, 0)`);
                ctx.fillStyle = shaftGradient;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(radius, 10);
                ctx.lineTo(radius, -10);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
        }

        // Draw whirlwind
        if (this.isWhirlwinding) {
            const whirlwindRange = this.lickRange * 0.8;
            const tongueOriginX = this.x + this.width / 2;
            const tongueOriginY = this.y + this.height / 2;
            const mainColor = this.upgrades['Ice Tongue'] > 0 ? '#a0c4ff' : '#ff5e7a';
            const shadowCol = this.upgrades['Ice Tongue'] > 0 ? '#6a8ebf' : '#d6455d';

            ctx.save();
            const segments = 15;
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const segmentX = tongueOriginX + Math.cos(this.whirlwindAngle) * (whirlwindRange * t);
                const segmentY = tongueOriginY + Math.sin(this.whirlwindAngle) * (whirlwindRange * t);

                let size = (t < 0.3) ? 10 - (t * 5) : 5 + (Math.pow(t, 2) * 19);
                size *= 0.8;

                ctx.fillStyle = mainColor;
                ctx.beginPath();
                ctx.arc(segmentX, segmentY, size, 0, Math.PI * 2);
                ctx.fill();

                if (i === segments || i % 5 === 0) {
                    ctx.strokeStyle = shadowCol;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
            ctx.restore();
        }

        // --- 1. DYNAMIC SHADOW ON GROUND ---
        let closestPlatform = null;
        let minDistance = Infinity;

        this.game.platforms.forEach(p => {
            let hitboxX = p.x + (p.hitboxOffsetX || 0);
            let hitboxY = p.y + (p.hitboxOffsetY || 0);
            let hitboxWidth = p.width;

            if (p.type === 'castle') {
                hitboxWidth *= 0.9;
                hitboxX += (p.width - hitboxWidth) / 2;
            } else if (p.type === 'cloud') {
                hitboxWidth *= 0.9;
                hitboxX += (p.width - hitboxWidth) / 2;
            }

            const isHorizontallyOverlapping = this.x + this.width > hitboxX && this.x < hitboxX + hitboxWidth;
            const shadowIsHorizontallyOverlapping = this.x + this.width / 1.5 > hitboxX && this.x + this.width / 5 < hitboxX + hitboxWidth;

            // Allow a small tolerance for when the player is standing on the platform
            const isBelow = this.y + this.height <= hitboxY + 1; 

            if (isHorizontallyOverlapping && shadowIsHorizontallyOverlapping && isBelow) {
                const distance = hitboxY - (this.y + this.height);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlatform = p;
                }
            }
        });

        if (closestPlatform) {
            const hitboxY = closestPlatform.y + (closestPlatform.hitboxOffsetY || 0);
            const maxShadowDistance = 400;
            const distance = minDistance;
            if (distance < maxShadowDistance) {
                let pCol = {r: 0, g: 0, b: 0};
                if (closestPlatform.type === 'cloud') {
                    pCol = {r: 150, g: 150, b: 200};
                } else if (closestPlatform.color) {
                    const hex = closestPlatform.color.substring(1);
                    pCol = {
                        r: parseInt(hex.substring(0, 2), 16),
                        g: parseInt(hex.substring(2, 4), 16),
                        b: parseInt(hex.substring(4, 6), 16)
                    };
                }
                const shadowFactor = 1 - (distance / maxShadowDistance);
                let shadowY = hitboxY;
                if (closestPlatform.type === 'ground') {
                    shadowY -= 1; //player shadow offset
                }
                ctx.fillStyle = `rgba(${pCol.r*0.3}, ${pCol.g*0.3}, ${pCol.b*0.3}, ${0.4 * shadowFactor})`;
                ctx.beginPath();
                ctx.ellipse(this.x + this.width / 2, shadowY + 2, (this.width * this.scaleX * 0.5 / 1.2) * shadowFactor, (this.width * 0.12 / 1.2) * shadowFactor, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // --- 2. PREPARE PLAYER TRANSFORM ---
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        const eyeY = this.y + this.height * 0.3;
        const mouthY = eyeY + this.height * 0.4;
        const mouthX = this.x + this.width / 2;

        // --- 3. APPLY TRANSFORMATIONS AND DRAW PLAYER ---
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(this.scaleX, this.scaleY);

        const isMirrored = this.vx > 0;
        if (isMirrored) {
            ctx.scale(-1, 1);
        }
        
        ctx.drawImage(this.characterImage, -this.width / 2, -this.height / 2, this.width, this.height);

        // --- 4. EYES AND MOUTH (within the transform) ---
        let mouseXForAngle = this.game.mouse.x;
        if (isMirrored) {
            mouseXForAngle = mouthX - (this.game.mouse.x - mouthX);
        }
        const ang = Math.atan2(this.game.mouse.y - eyeY, mouseXForAngle - mouthX);
        const pupilDist = 3.5;
        const eyeRadius = 7.5;
        const pupilRadius = 3.5;
        const eyeXOffset = -(this.width * 0.05);
        const relativeEyeY = -this.height/2 + this.height * 0.55;

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(eyeXOffset, relativeEyeY, eyeRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#4a101d';
        ctx.beginPath();
        ctx.arc(eyeXOffset + Math.cos(ang) * pupilDist, relativeEyeY + Math.sin(ang) * pupilDist, pupilRadius, 0, Math.PI * 2);
        ctx.fill();

        if (this.lickAnim <= 0) {
            const idleBounce = Math.sin(this.game.gameTime * 0.15) * 2 + 2;
            const relativeMouthY = mouthY - cy;
            
            ctx.fillStyle = this.upgrades['Ice Tongue'] > 0 ? '#a0c4ff' : '#ff5e7a';
            ctx.beginPath();
            ctx.roundRect(eyeXOffset - 6, relativeMouthY - 2, 12, 6 + idleBounce, 6);
            ctx.fill();

            ctx.fillStyle = '#3a0014';
            ctx.beginPath();
            const mouthSize = 4;
            ctx.arc(eyeXOffset, relativeMouthY, mouthSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore(); // END PLAYER TRANSFORM

     if (this.sugarRushTimer > 0) {
    ctx.save();
    
    // 1. BOUNDARY LOCK: Keeps waves from bleeding out of character bounds
    ctx.beginPath();
    ctx.rect(this.x, this.y + (this.height * 0.33), this.width, this.height * 0.67);
    ctx.clip();

    const waveCount = 3;
    const slowSpeed = 0.025; 
    const colorSpeed = 2; 
    const arcHeight = 10; // Controls how much the wave "curves"
    
    for (let i = 0; i < waveCount; i++) {
        // 2. REVERSED DIRECTION: subtracted from 1 to move bottom-to-top
        const progress = 1 - ((this.game.gameTime * slowSpeed + i * (1 / waveCount)) % 1);
        
        const minY = this.y + (this.height * 0.33);
        const maxY = this.y + this.height;
        const yPos = minY + ((maxY - minY) * progress);
        
        const alpha = Math.sin(progress * Math.PI);
        const hue = (this.game.gameTime * colorSpeed + i * (360 / waveCount)) % 360;
        
        ctx.strokeStyle = `hsla(${hue}, 90%, 65%, ${alpha * 0.47})`;
        ctx.lineWidth = 11;

        // 3. ARCHED WAVE LOGIC: Using Quadratic Curve
        ctx.beginPath();
        // Start point (left side)
        ctx.moveTo(this.x, yPos);
        // Arched path: control point is at center width but raised/lowered by arcHeight
        ctx.quadraticCurveTo(
            this.x + this.width / 2, yPos - arcHeight, 
            this.x + this.width, yPos
        );
        ctx.stroke();
    }

    ctx.restore();
}

        // --- 5. TONGUE ATTACK LOGIC (outside the transform) ---
        if (!this.isControlling && this.lickAnim > 0) {
            const tongueOriginX = mouthX;
            const tongueOriginY = mouthY;
            const mouseAngle = Math.atan2(this.game.mouse.y - tongueOriginY, this.game.mouse.x - tongueOriginX);
            const animPhase = (15 - this.lickAnim) / 15; 
            const animCurve = Math.sin(animPhase * Math.PI);
            const lickDistance = this.lickRange * animCurve;

            const drag = 2.5;
            const shiftX = Math.sin(animPhase * Math.PI) * (this.vx * drag);
            const shiftY = Math.sin(animPhase * Math.PI) * (this.vy * drag);

            this.tongueTipX = tongueOriginX + Math.cos(mouseAngle) * lickDistance - shiftX;
            this.tongueTipY = tongueOriginY + Math.sin(mouseAngle) * lickDistance - shiftY;

            ctx.save();
            const mainColor = this.upgrades['Ice Tongue'] > 0 ? '#a0c4ff' : '#ff5e7a';
            const shadowCol = this.upgrades['Ice Tongue'] > 0 ? '#6a8ebf' : '#d6455d';
            const segments = 20; 

            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const segmentX = tongueOriginX + Math.cos(mouseAngle) * (lickDistance * t) - shiftX;
                const segmentY = tongueOriginY + Math.sin(mouseAngle) * (lickDistance * t) - shiftY;

                let size = (t < 0.3) ? 10 - (t * 5) : 5 + (Math.pow(t, 2) * 19);
                size *= animCurve;

                ctx.fillStyle = mainColor;
                ctx.beginPath();
                ctx.arc(segmentX, segmentY, size, 0, Math.PI * 2);
                ctx.fill();

                if (i === segments || i % 5 === 0) {
                    ctx.strokeStyle = shadowCol;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
                if (i > segments * 0.8) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.beginPath();
                    ctx.arc(segmentX, segmentY - (size * 0.3), size * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            ctx.restore();

            // Also draw the base of the tongue/mouth hole when licking
            ctx.fillStyle = '#3a0014';
            ctx.beginPath();
            const mouthSize = 8;
            ctx.arc(mouthX, mouthY, mouthSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw shockwave animations
        this.shockwaveAnimations.forEach(anim => {
            anim.rings.forEach(ring => {
                if (ring.progress > 0 && ring.progress < 1) {
                    const radius = anim.maxRadius * ring.progress;
                    const alpha = 1 - ring.progress;
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(anim.x, anim.y, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            });
        });
    }}