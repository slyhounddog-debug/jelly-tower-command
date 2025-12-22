import Particle from './particle.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.reset();
        this.width = 37.191; this.height = 54.45825; this.color = '#ffc1cc';
        this.scaleX = 1; this.scaleY = 1;
        this.lickCooldown = 0; this.lickAnim = 0;
        this.maxVel = 12.1; this.acceleration = 1.815; this.gravity = 1.2;
        this.jumpForce = -26;
        this.airJumpForce = -26; // Fixed: Same as ground jump
        this.passThroughTimer = 0;
        this.lickAngle = 0;
        this.dashCooldown = 0;
        this.lastAPress = 0;
        this.lastDPress = 0;
        this.dashSpeed = 30;
        this.jumpSquash = 0;
    }
    reset() {
        this.x = this.game.width / 2; this.y = this.game.height - 120; this.vx = 0; this.vy = 0;
        this.isOnGround = false; this.isControlling = null;
        this.jumpsLeft = 2; this.jumpLock = false;
        this.isPassingThrough = false;
        this.transitionState = null; this.transitionProgress = 0; this.transitionTarget = null;
        this.dashCooldown = 0;
        this.lastAPress = 0;
        this.lastDPress = 0;
        this.jumpSquash = 0;
    }
    tryDash(direction) {
        if (this.dashCooldown <= 0) {
            this.vx += this.dashSpeed * direction;
            this.dashCooldown = 40; // 75% of 1 second cooldown

            // Add dash particle effect
            for (let i = 0; i < 10; i++) { // More particles for a dash
                this.game.particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, 'rgba(255, 255, 255, 0.7)', 'spark'));
            }
        }
    }
    tryLick() {
        if (this.lickCooldown > 0) return;
        const cx = this.x + this.width / 2; const cy = this.y + this.height / 2;
        this.lickAngle = Math.atan2(this.game.mouse.y - cy, this.game.mouse.x - cx);
        this.lickOffsetX = Math.cos(this.lickAngle) * 66.5; // Increased range
        this.lickOffsetY = Math.sin(this.lickAngle) * 66.5; // Increased range
        this.lickAnim = 15; this.lickCooldown = 20;

        // Hitbox logic
        const impactX = cx + this.lickOffsetX;
        const impactY = cy + this.lickOffsetY;
        this.game.missiles.forEach(m => {
            const missileCx = m.x + m.width / 2;
            const missileCy = m.y + m.height / 2;

            // Check for collision with the hand hitbox OR the player's hitbox
            const hitByHand = Math.hypot(missileCx - impactX, missileCy - impactY) < 80; // Increased hitbox
            const hitByPlayer = (
                this.x < m.x + m.width &&
                this.x + this.width > m.x &&
                this.y < m.y + m.height &&
                this.y + this.height > m.y
            );

            if (hitByHand || hitByPlayer) {
                m.takeDamage(this.game.stats.lickDamage);
                // Smooth Knockback application
                m.kbVy = -this.game.stats.lickKnockback * 0.3; // Initial impulse
                this.game.screenShake.trigger(4, 10); // Increased
                // More particles
                for (let i = 0; i < 15; i++) { // Increased particle count
                    this.game.particles.push(new Particle(m.x, m.y, this.color, 'spark'));
                    if (i < 5) this.game.particles.push(new Particle(m.x, m.y, '#fff', 'smoke'));
                }
            }
        });
    }
    update(tsf) {
        if (this.jumpSquash > 0) this.jumpSquash -= tsf;
        if (this.dashCooldown > 0) this.dashCooldown -= tsf;

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
            const pIdx = this.game.platforms.findIndex(p => p.type === 'cloud' && this.x < p.x + p.width && this.x + this.width > p.x && this.y + this.height >= p.y - 1 && this.y + this.height <= p.y + 10);
            if (pIdx !== -1) { this.isPassingThrough = true; this.y += 10; this.passThroughTimer = 20; this.isOnGround = false; }
        }
        if (this.passThroughTimer > 0) { this.passThroughTimer -= tsf; if (this.passThroughTimer <= 0) this.isPassingThrough = false; }

        if ((this.game.keys[' '] || this.game.keys['w']) && !this.jumpLock) {
            if (this.isOnGround) {
                this.vy = this.jumpForce; this.isOnGround = false; this.jumpsLeft = 1; this.jumpLock = true;
                this.jumpSquash = 15;
            } else if (this.jumpsLeft > 0) {
                this.vy = this.airJumpForce; this.jumpsLeft--; this.jumpLock = true;
                this.jumpSquash = 15;
                for (let i = 0; i < 5; i++) this.game.particles.push(new Particle(this.x + this.width / 2, this.y + this.height, '#fff'));
            }
        }
        if (!this.game.keys[' '] && !this.game.keys['w']) this.jumpLock = false;

        this.vy += this.gravity * tsf;
        
        // --- FIXED COLLISION LOGIC ---
        this.x += this.vx * tsf;
        if (this.x < 0) this.x = 0;
        if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;

        const wasOnGround = this.isOnGround;
        this.isOnGround = false;

        this.game.platforms.forEach((p) => {
            if (p.type === 'cloud' && this.isPassingThrough) return;
            const isMovingDown = this.vy >= 0;
            const playerWasAbove = (this.y) + this.height <= p.y + 2; 
            const horizontalOverlap = this.x < p.x + p.width && this.x + this.width > p.x;
            const verticalOverlap = (this.y + this.vy * tsf) + this.height > p.y && (this.y + this.vy * tsf) < p.y + p.height;
            
            if (horizontalOverlap && verticalOverlap && isMovingDown && playerWasAbove) {
                this.y = p.y - this.height; 
                this.vy = 0;
                this.isOnGround = true;
                this.jumpsLeft = 2;
                if (this.isPassingThrough) this.isPassingThrough = false;
                if (!wasOnGround) this.jumpSquash = 15;
            }
        });
        
        // Only apply gravity movement if we didn't just snap to a floor
        if (!this.isOnGround) {
            this.y += this.vy * tsf;
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
  draw(ctx) {
        if (this.isControlling) return;

        // --- 1. DYNAMIC SHADOW ON GROUND ---
        let closestPlatform = null;
        let minDistance = Infinity;

        this.game.platforms.forEach(p => {
            const isHorizontallyOverlapping = this.x + this.width > p.x && this.x < p.x + p.width;
            const isBelow = this.y + this.height <= p.y;
            if (isHorizontallyOverlapping && isBelow) {
                const distance = p.y - (this.y + this.height);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestPlatform = p;
                }
            }
        });

        if (closestPlatform) {
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
                ctx.fillStyle = `rgba(${pCol.r*0.3}, ${pCol.g*0.3}, ${pCol.b*0.3}, ${0.4 * shadowFactor})`;
                ctx.beginPath();
                ctx.ellipse(this.x + this.width / 2, closestPlatform.y, (this.width * 0.5) * shadowFactor, (this.width * 0.12) * shadowFactor, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // --- 2. PREPARE PLAYER TRANSFORM ---
        const cx = this.x + this.width/2; 
        const cy = this.y + this.height;
        const eyeY = this.y + 12;
        const mouthY = eyeY + 15;
        const mouthX = this.x + this.width / 2;

        ctx.save(); 
        ctx.translate(cx, cy);
        ctx.scale(this.scaleX, this.scaleY); 
        ctx.translate(-cx, -cy);

        // --- 3. DRAW SHADOW ---
        const shadowOffset = 5;
        const shadowWidth = this.width * 1.05;
        const shadowHeight = this.height * 1.05;
        const shadowX = this.x - (shadowWidth - this.width) / 2;
        ctx.fillStyle = 'rgba(212, 123, 141, 0.5)';
        ctx.beginPath();
        ctx.roundRect(shadowX, this.y + shadowOffset, shadowWidth, shadowHeight, 10);
        ctx.fill();

        // --- 4. DRAW BODY (3D BEVEL STYLE) ---
        const bodyColor = this.color;      
        const depthPink = '#d47b8d'; 
        const highlightPink = '#ffeef1'; 

        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        
        const gradient = ctx.createRadialGradient(
            cx - 5, this.y + 10, 0,
            cx, cy - (this.height/2), this.width
        );
        gradient.addColorStop(0, highlightPink); 
        gradient.addColorStop(0.4, bodyColor);
        gradient.addColorStop(1, depthPink);
        ctx.fillStyle = gradient;
        ctx.fill();



        // TONE-ON-TONE BORDER
        ctx.strokeStyle = depthPink; 
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // --- 4. BUBBLES ---
        ctx.fillStyle = `rgba(255, 255, 255, 0.7)`;
        [20, 15, 25, 10].forEach((speed, i) => {
            const bx = this.x + this.width / 2 + Math.sin(this.game.gameTime / speed) * (this.width / 3.5);
            const by = this.y + this.height / 2 + Math.cos(this.game.gameTime / speed) * (this.height / 3.5);
            ctx.beginPath();
            ctx.arc(bx, by, 1.5 + (i % 2), 0, Math.PI * 2);
            ctx.fill();
        });

        // --- 5. EYES ---
        const ang = Math.atan2(this.game.mouse.y - eyeY, this.game.mouse.x - mouthX);
        ctx.fillStyle = 'white'; 
        ctx.beginPath(); 
        ctx.arc(mouthX, eyeY, 7.5, 0, Math.PI*2); 
        ctx.fill();
        ctx.fillStyle = '#4a101d'; 
        ctx.beginPath(); 
        ctx.arc(mouthX + Math.cos(ang)*3, eyeY + Math.sin(ang)*3, 3.5, 0, Math.PI*2); 
        ctx.fill();

        ctx.restore(); // END TRANSFORM

        // --- 6. TONGUE ATTACK LOGIC ---
        if (!this.isControlling) {
            const tongueOriginX = mouthX;
            const tongueOriginY = mouthY;
            const mouseAngle = Math.atan2(this.game.mouse.y - tongueOriginY, this.game.mouse.x - tongueOriginX);

            if (this.lickAnim > 0) {
                const animPhase = (15 - this.lickAnim) / 15; 
                const animCurve = Math.sin(animPhase * Math.PI);
                const lickDistance = 140 * animCurve;

                ctx.save();
                const mainColor = '#ff5e7a';
                const shadowCol = '#d6455d';
                const segments = 20; 

                for (let i = 0; i <= segments; i++) {
                    const t = i / segments;
                    const drag = 2.5;
                    const shiftX = Math.sin(t * Math.PI) * (this.vx * drag);
                    const shiftY = Math.sin(t * Math.PI) * (this.vy * drag);
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

                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(tongueOriginX, tongueOriginY);
                const midX = tongueOriginX + Math.cos(mouseAngle) * (lickDistance * 0.5) - (this.vx * 2);
                const midY = tongueOriginY + Math.sin(mouseAngle) * (lickDistance * 0.5) - (this.vy * 2);
                ctx.quadraticCurveTo(midX, midY, tongueOriginX + Math.cos(mouseAngle) * lickDistance, tongueOriginY + Math.sin(mouseAngle) * lickDistance);
                ctx.stroke();
                ctx.restore();
            } else {
                const idleBounce = Math.sin(this.game.gameTime * 0.15) * 2 + 2;
                ctx.fillStyle = '#ff5e7a';
                ctx.beginPath();
                ctx.roundRect(mouthX - 6, mouthY - 2, 12, 6 + idleBounce, 6);
                ctx.fill();
            }

            ctx.fillStyle = '#3a0014';
            ctx.beginPath();
            const mouthSize = this.lickAnim > 0 ? 8 : 4;
            ctx.arc(mouthX, mouthY, mouthSize, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}