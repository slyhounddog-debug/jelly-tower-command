export default class Particle {
    constructor(game, x, y, color, type = 'spark', lifespan = 1.0, vx = null, vy = null, startRadius = 0, endRadius = 0) {
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
        
        this.life = lifespan;
        this.maxLife = lifespan;
        this.decay = (1 / (lifespan * 60)) * (Math.random() * 0.5 + 0.75) ;

        this.targetX = undefined;
        this.targetY = undefined;
        this.homingStrength = 0;
        this.recoils = false;
        this.emissionTimer = 0;
        this.gracePeriod = 10; // A short period where the particle cannot collide with its target

        if (this.type === 'explosion') {
            this.startRadius = startRadius;
            this.endRadius = endRadius;
            this.currentRadius = startRadius;
        } else if (this.type === 'soul') { // For the new 'soul' particle
            this.size = (Math.random() * 4 + 8) * 1.25; // 25% larger
            this.emissionTimer = Math.random() * 2; // More frequent emission (was 5)
        } else {
            this.size = Math.random() * 5 + 2;
        }
    }
    update(tsf) {
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
                this.life = 0; // "die"
                if (this.type === 'soul') {
                    this.game.thermometer.triggerRecoil();
                    this.game.killsSinceLastBoss++;
                }
            }
        }

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.life -= this.decay * tsf;

        if (this.type === 'smoke') { this.vx *= 0.95; this.vy -= 0.05 * tsf; this.size += 0.2 * tsf; }
        else if (this.type === 'drip') { this.vy += 0.1 * tsf; this.vx *= 0.9; this.size *= 0.95; }
        else if (this.type === 'heal') { this.y -= 1 * tsf; this.size *= 0.98; }
        else if (this.type === 'explosion') {
            const progress = 1 - (this.life / this.maxLife); // 0 to 1
            this.currentRadius = this.startRadius + (this.endRadius - this.startRadius) * progress;
        } else if (this.type === 'soul') { // Emit smaller particles
            this.emissionTimer += tsf;
            if (this.emissionTimer >= 0.5) { // Emit every ~0.5 frames (was 2)
                this.emissionTimer = 0;
                // Emit a small white spark particle from the soul
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 1 + 0.5;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const color = Math.random() < 0.5 ? 'rgba(255,255,255,0.7)' : 'rgba(173, 216, 230, 0.7)';
                this.game.particles.push(new Particle(this.game, this.x, this.y, color, 'spark', 0.5, vx, vy));
            }
        }
    }
    draw(ctx) {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        if (this.type === 'spark') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (this.type === 'explosion') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.currentRadius, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'soul') { // Draw glowing white ball
            ctx.save();
            ctx.shadowBlur = 25;
            ctx.shadowColor = '#add8e6';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore(); // Restore to remove shadow for other drawings
        }
        else { ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1.0;
    }
}