import Particle from './particle.js';

export default class Player {
    constructor(game) {
        this.game = game;
        this.reset();
        this.width = 33.81; this.height = 49.5075; this.color = '#a0c4ff';
        this.scaleX = 1; this.scaleY = 1;
        this.slapCooldown = 0; this.slapAnim = 0;
        this.maxVel = 12.1; this.acceleration = 1.815; this.gravity = 0.968;
        this.jumpForce = -24.2;
        this.airJumpForce = -24.2; // Fixed: Same as ground jump
        this.passThroughTimer = 0;
        this.slapAngle = 0;
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
            this.dashCooldown = 45; // 75% of 1 second cooldown

            // Add dash particle effect
            for (let i = 0; i < 10; i++) { // More particles for a dash
                this.game.particles.push(new Particle(this.x + this.width / 2, this.y + this.height / 2, 'rgba(255, 255, 255, 0.7)', 'spark'));
            }
        }
    }
    trySlap() {
        if (this.slapCooldown > 0) return;
        const cx = this.x + this.width / 2; const cy = this.y + this.height / 2;
        this.slapAngle = Math.atan2(this.game.mouse.y - cy, this.game.mouse.x - cx);
        this.slapOffsetX = Math.cos(this.slapAngle) * 50;
        this.slapOffsetY = Math.sin(this.slapAngle) * 50;
        this.slapAnim = 15; this.slapCooldown = 24;

        // Hitbox logic
        const impactX = cx + this.slapOffsetX;
        const impactY = cy + this.slapOffsetY;
        this.game.missiles.forEach(m => {
            const missileCx = m.x + m.width / 2;
            const missileCy = m.y + m.height / 2;

            // Check for collision with the hand hitbox OR the player's hitbox
            const hitByHand = Math.hypot(missileCx - impactX, missileCy - impactY) < 60;
            const hitByPlayer = (
                this.x < m.x + m.width &&
                this.x + this.width > m.x &&
                this.y < m.y + m.height &&
                this.y + this.height > m.y
            );

            if (hitByHand || hitByPlayer) {
                m.takeDamage(this.game.stats.slapDamage);
                // Smooth Knockback application
                m.kbVy = -this.game.stats.slapKnockback * 0.1; // Initial impulse
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
            this.scaleY = 1 + this.transitionProgress * 0.5; // Stretch while entering

            if (this.transitionProgress >= 1) {
                this.isControlling = this.transitionTarget;
                this.transitionState = null;
                this.transitionProgress = 0;
            }
            return;
        }

        if (this.transitionState === 'leaving') {
            this.transitionProgress += 0.125 * tsf;
            this.scaleX = 1 - this.transitionProgress * 0.5; // Stretch while leaving
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

        if (this.slapCooldown > 0) this.slapCooldown -= tsf;
        if (this.slapAnim > 0) this.slapAnim -= tsf * 1.2;

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
        this.x += this.vx * tsf; this.y += this.vy * tsf;
        if (this.x < 0) this.x = 0; if (this.x + this.width > this.game.width) this.x = this.game.width - this.width;

        const wasOnGround = this.isOnGround;
        this.isOnGround = false;
        this.game.platforms.forEach((p, pIdx) => {
            if (p.type === 'cloud' && this.isPassingThrough) return;
            if (this.x < p.x + p.width && this.x + this.width > p.x && this.y + this.height > p.y && this.y < p.y + p.height + 10) {
                if (this.vy >= 0 && (this.y - (this.vy * tsf)) + this.height <= p.y + 25) {
                    if (!wasOnGround) {
                        this.jumpSquash = 15;
                    }
                    this.y = p.y - this.height; this.vy = 0; this.isOnGround = true; this.jumpsLeft = 2;
                    if (this.isPassingThrough) this.isPassingThrough = false;
                }
            }
        });

        if (this.jumpSquash > 0) {
            const progress = this.jumpSquash / 15;
            this.scaleY = 1 - Math.sin(progress * Math.PI) * 0.3;
            this.scaleX = 1 + Math.sin(progress * Math.PI) * 0.3;
        } else if (this.isOnGround) {
            const bounce = Math.sin(this.game.gameTime * 0.5) * Math.abs(this.vx) * 0.01;
            this.scaleX += (1 - this.scaleX) * 0.1 * tsf;
            this.scaleY += (1 - this.scaleY) * 0.1 * tsf + bounce;
        } else {
            const stretch_factor = 0.03;
            if (this.vy < 0) { // Moving up -> stretch
                this.scaleY = 1 + Math.abs(this.vy) * stretch_factor;
                this.scaleX = 1 - Math.abs(this.vy) * stretch_factor * 0.5;
            } else { // Moving down -> squash
                this.scaleY = 1 - Math.abs(this.vy) * stretch_factor * 0.5;
                this.scaleX = 1 + Math.abs(this.vy) * stretch_factor;
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

        // --- DYNAMIC SHADOW ---
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
            const maxShadowDistance = 400; // The distance at which the shadow is fully gone
            const distance = minDistance;
            
            if (distance < maxShadowDistance) {
                let platformColor;
                if (closestPlatform.type === 'cloud') {
                    const pink = [255, 182, 193];
                    const blue = [135, 206, 250];
                    const ratio = (closestPlatform.y - (this.game.height - 1100)) / ((this.game.height - 250) - (this.game.height - 1100));
                    const invRatio = 1 - Math.max(0, Math.min(1, ratio));
                    const r = Math.floor(pink[0] * (1 - invRatio) + blue[0] * invRatio);
                    const g = Math.floor(pink[1] * (1 - invRatio) + blue[1] * invRatio);
                    const b = Math.floor(pink[2] * (1 - invRatio) + blue[2] * invRatio);
                    platformColor = {r, g, b};
                } else {
                    // Assuming color is hex #RRGGBB
                    const hex = closestPlatform.color.substring(1);
                    platformColor = {
                        r: parseInt(hex.substring(0, 2), 16),
                        g: parseInt(hex.substring(2, 4), 16),
                        b: parseInt(hex.substring(4, 6), 16)
                    };
                }

                // Darken the color
                const darkR = Math.floor(platformColor.r * 0.5);
                const darkG = Math.floor(platformColor.g * 0.5);
                const darkB = Math.floor(platformColor.b * 0.5);
                
                const shadowFactor = 1 - (distance / maxShadowDistance);
                const shadowWidth = (this.width * 0.8) * shadowFactor;
                const shadowHeight = shadowWidth * 0.25; // Make it an ellipse
                const shadowOpacity = 0.5 * shadowFactor;

                ctx.fillStyle = `rgba(${darkR}, ${darkG}, ${darkB}, ${shadowOpacity})`;
                ctx.beginPath();
                ctx.ellipse(this.x + this.width / 2, closestPlatform.y, shadowWidth, shadowHeight, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const cx = this.x + this.width/2; const cy = this.y + this.height;
        ctx.save(); ctx.translate(cx, cy);
        ctx.scale(this.scaleX, this.scaleY); ctx.translate(-cx, -cy);
        ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.roundRect(this.x, this.y, this.width, this.height, 5); ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
        // Eyes
        const eyeX = this.x + this.width/2; const eyeY = this.y + 12;
        const ang = Math.atan2(this.game.mouse.y - eyeY, this.game.mouse.x - eyeX);
        ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(eyeX, eyeY, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(eyeX + Math.cos(ang)*3, eyeY + Math.sin(ang)*3, 3, 0, Math.PI*2); ctx.fill();
        ctx.restore();

        // Unified Glove Drawing Logic
        if (!this.isControlling) {
            const cx_glove = cx + this.width/2;
            const cy_glove = cy - (this.height/2);

            let distance, scale;
            // Updated baseSlapScale
            const baseSlapScale = 1.575; // Reverted 10% increase
            // Updated aimingScale (now baseSlapScale / 3)
            const aimingScale = baseSlapScale / 3; // Switched back to 1/3rd

            // Updated distances
            const aimingDistance = 39.0625; // 25% larger than previous 31.25
            const fullSlapDistance = 78.125; // 25% larger than previous 62.5

            if (this.slapAnim > 0) {
                const animPhase = (15 - this.slapAnim) / 15; // 0 -> 1 as anim progresses
                const animCurve = Math.sin(animPhase * Math.PI);
                distance = aimingDistance + (fullSlapDistance - aimingDistance) * animCurve; // Interpolate between new distances
                scale = aimingScale + (baseSlapScale - aimingScale) * animCurve; // Interpolate between new scales
            } else { // Aiming state
                distance = aimingDistance;
                scale = aimingScale;
            }
            
            const angle = Math.atan2(this.game.mouse.y - cy_glove, this.game.mouse.x - cx);
            const gloveOffsetX = Math.cos(angle) * distance;
            const gloveOffsetY = Math.sin(angle) * distance;
            
            ctx.save();
            ctx.translate(cx + gloveOffsetX, cy_glove + gloveOffsetY);
            ctx.scale(scale, scale);
            ctx.rotate(angle);

            // --- Boxing Glove Drawing Logic (remains unchanged) ---
            // 1. White Wrist Cuff
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.roundRect(-20, -10, 12, 20, 3);
            ctx.fill();

            // 2. Main Red Glove Body & Thumb
            ctx.fillStyle = '#e74c3c'; // Red
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            // Fist
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            // Thumb
            ctx.beginPath();
            ctx.arc(-5, -12, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 3. Shiny Glare
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.beginPath();
            ctx.ellipse(3, -5, 4, 8, -0.5, 0, Math.PI * 2);
            ctx.fill();
            // --- End of Glove Drawing ---
            
            ctx.restore();
        }
    }
}
