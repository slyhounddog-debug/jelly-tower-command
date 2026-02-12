export default class Particle {
    constructor() {
        // Constructor is now parameterless, init() handles actual setup
    }

    init(game, x, y, color, type = 'spark', initialSize = null, lifespan = 1.0, vx = null, vy = null, startRadius = 0, endRadius = 0) {
        this.game = game;
        this.x = x; this.y = y; this.color = color; this.type = type;

        if (vx === null || vy === null) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (type === 'regen') ? Math.random() * 1 + 0.5 : Math.random() * 3 + 1;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            this.vx = vx;
            this.vy = vy;
        }
        
        this.life = 1;
        this.maxLife = 1;
        this.decay = (1 / (lifespan * 60)) * (Math.random() * 0.5 + 0.75) ;

        this.targetX = undefined;
        this.targetY = undefined;
        this.homingStrength = 0;
        this.recoils = false;
        this.emissionTimer = 0;
        this.gracePeriod = 10; 

        if (this.type === 'explosion') {
            this.startRadius = startRadius;
            this.endRadius = endRadius;
            this.currentRadius = startRadius;
        } else if (this.type === 'soul') {
            this.size = Math.random() * 2 + 16; 
            this.emissionTimer = Math.random() * 2;
        } else {
            this.size = initialSize !== null ? initialSize : (Math.random() * 5 + 2);
        }
        this.active = true; // Added for pooling
        this.emitter = null;
    }

    reset() {
        this.active = false;
        this.game = null;
        this.x = 0; this.y = 0; this.color = ''; this.type = '';
        this.life = 0; this.maxLife = 0; this.decay = 0;
        this.vx = 0; this.vy = 0;
        this.targetX = undefined; this.targetY = undefined;
        this.homingStrength = 0; this.recoils = false;
        this.emissionTimer = 0; this.gracePeriod = 0;
        this.startRadius = 0; this.endRadius = 0; this.currentRadius = 0;
        this.size = 0;
        this.emitter = null;
    }

    update(tsf) {
        if (!this.active) return; // Added for pooling

        if (this.gracePeriod > 0) this.gracePeriod -= tsf;

        if (this.targetX !== undefined && this.targetY !== undefined) {
            const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
            const speed = this.homingStrength || 2;
            this.vx += Math.cos(angle) * speed * 0.1 * tsf;
            this.vy += Math.sin(angle) * speed * 0.1 * tsf;
            this.vx *= 0.95;
            this.vy *= 0.95;

            const dist = Math.hypot(this.targetX - this.x, this.targetY - this.y);
            if (this.gracePeriod <= 0 && dist < 20) {
                this.life = 0; 
                if (this.type === 'soul') {
                    this.game.thermometer.triggerRecoil();
                    this.game.killsSinceLastBoss++;
                }
            }
        }

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.life -= this.decay * tsf;

        // NEW: Off-screen check for returning particles to pool
        const screenMargin = 100; // Pixels outside screen bounds
        if (this.x < -screenMargin || this.x > this.game.width + screenMargin ||
            this.y < -screenMargin || this.y > this.game.height + screenMargin) {
            this.active = false;
            if (this.game && this.game.particlePool) {
                this.game.particlePool.returnToPool(this);
            }
            return; // Immediately return from update, as it's now pooled
        }

        if (this.life <= 0) { // Existing check
            this.active = false;
            if (this.game && this.game.particlePool) { // Ensure pool exists
                this.game.particlePool.returnToPool(this);
            }
            return;
        }


        if (this.type === 'smoke') { this.vx *= 0.95; this.vy -= 0.05 * tsf; this.size += 0.2 * tsf; }
        else if (this.type === 'trail') {
            // Check if emitter is still active. If not, terminate this trail particle.
            if (this.emitter && !this.emitter.active) {
                // Immediately return to pool if emitter is inactive
                this.active = false; // Mark as inactive
                if (this.game && this.game.particlePool) {
                    this.game.particlePool.returnToPool(this);
                }
                return; // Exit this update cycle cleanly
            }

            if (this.emitter && this.emitter.onGround) {
                this.targetX = this.emitter.x + this.emitter.width / 2;
                this.targetY = this.emitter.y + this.emitter.height / 2;
                this.homingStrength = 2;
            }
            this.vx *= 0.95; // Some horizontal drag
            this.vy -= 0.01 * tsf; // Small upward smoke-like movement
            this.size = Math.max(0.5, this.size + 0.02 * tsf); // Slight expansion, with minimum size
            this.size *= 0.95; // Overall shrinking
        }
        else if (this.type === 'drip') { this.vy += 0.1 * tsf; this.vx *= 0.9; this.size *= 0.95; }
        else if (this.type === 'heal') { this.y -= 1 * tsf; this.size *= 0.98; }
        else if (this.type === 'explosion') {
            const progress = 1 - (this.life / this.maxLife);
            this.currentRadius = this.startRadius + (this.endRadius - this.startRadius) * progress;
        } else if (this.type === 'soul') { 
            this.emissionTimer += tsf;
            if (this.emissionTimer >= 0.5) { 
                this.emissionTimer = 0;
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 1 + 0.5;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const color = Math.random() < 0.5 ? 'rgba(255,255,255,0.7)' : 'rgba(173, 216, 230, 0.7)';
                // Change here to use particle pool
                const newParticle = this.game.particlePool.get();
                if (newParticle) {
                    newParticle.init(this.game, this.x, this.y, color, 'spark', 0.5, 1.0, vx, vy);
                }
            }
        }
    }

    draw(ctx) {
        if (!this.active) return; // Added for pooling

        ctx.save(); // Save once at the start
        ctx.globalAlpha = Math.max(0, this.life);

        if (this.type === 'spark') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'explosion') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'soul') {
            // Volumetric Gradient Orb
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0, 
                this.x, this.y, this.size * 1.5
            );
            gradient.addColorStop(0, 'white'); 
            gradient.addColorStop(0.4, 'rgba(27, 146, 185, 0.8)'); 
            gradient.addColorStop(1, 'rgba(27, 146, 185, 0)'); 

            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Inner Core
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
            ctx.fill();

            // Light Shafts
            const shafts = 8; 
            const radius = 35;
            const pulse = (Math.sin(this.game.gameTime * 0.1) + 1) / 2;
            
            ctx.save(); // Inner save for translation
            ctx.translate(this.x, this.y);
            ctx.rotate(this.game.gameTime * 0.02); 

            for (let i = 0; i < shafts; i++) {
                ctx.rotate((Math.PI * 2 / shafts));
                const shaftGradient = ctx.createLinearGradient(0, 0, radius, 0);
                const color = Math.random() < 0.5 ? '255, 255, 255' : '173, 216, 230'; // Use random color for variation
                
                shaftGradient.addColorStop(0, `rgba(${color}, ${0.4 * pulse})`);
                shaftGradient.addColorStop(1, `rgba(${color}, 0)`);
                
                ctx.fillStyle = shaftGradient;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(radius, 2);
                ctx.lineTo(radius, -2);
                ctx.fill();
            }
            ctx.restore(); // Restore translation
        } else {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore(); // Final restore
    }
}