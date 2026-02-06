// JellyTowerCommand/Soul.js
import Particle from './particle.js';

export default class Soul {
    constructor() {
        this.active = false;
    }

    init(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.active = true;

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3 + 1;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        
        this.life = 1.0;
        this.maxLife = 1.0;
        this.decay = (1 / (this.life * 60)) * (Math.random() * 0.5 + 0.75);

        const thermometerPos = this.game.thermometer.getPosition();
        this.targetX = thermometerPos.x;
        this.targetY = thermometerPos.y;
        this.homingStrength = 4;
        this.gracePeriod = 10; 

        this.size = Math.random() * 2 + 16; 
        this.emissionTimer = Math.random() * 2;
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.decay = 0;
        this.targetX = 0; // Or undefined
        this.targetY = 0; // Or undefined
        this.homingStrength = 0;
        this.gracePeriod = 0;
        this.size = 0;
        this.emissionTimer = 0;
    }

    update(tsf) {
        if (!this.active) return;

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
                this.game.thermometer.triggerRecoil();
                this.game.killsSinceLastBoss++;
                this.game.soulPool.returnToPool(this);
                return;
            }
        }

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;

        this.emissionTimer += tsf;
        if (this.emissionTimer >= 0.5) { 
            this.emissionTimer = 0;
            // The original particle code spawned new particles.
            // To keep pooling simple, we won't have souls spawn more particles from the general particle pool yet.
            // If this effect is desired, it will require passing the particle pool to the soul.
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);

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

        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, Math.PI * 2);
        ctx.fill();

        const shafts = 8; 
        const radius = 35;
        const pulse = (Math.sin(this.game.gameTime * 0.1) + 1) / 2;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.game.gameTime * 0.02); 

        for (let i = 0; i < shafts; i++) {
            ctx.rotate((Math.PI * 2 / shafts));
            const shaftGradient = ctx.createLinearGradient(0, 0, radius, 0);
            const color = i % 2 === 0 ? '255, 255, 255' : '173, 216, 230';
            
            shaftGradient.addColorStop(0, `rgba(${color}, ${0.4 * pulse})`);
            shaftGradient.addColorStop(1, `rgba(${color}, 0)`);
            
            ctx.fillStyle = shaftGradient;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(radius, 2);
            ctx.lineTo(radius, -2);
            ctx.fill();
        }
        ctx.restore();

        ctx.restore();
    }
}
