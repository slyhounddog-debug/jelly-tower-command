import Particle from './particle.js';

export default class Projectile {
    constructor(game, x, y, angle, damage, range, origin, speed, radius = 15, equippedComponents = {}) {
        this.game = game;
        this.x = x; this.y = y; this.damage = damage; this.range = range; this.origin = origin;
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
        this.hp = damage; this.dead = false; this.hasHit = false;
        this.rotation = Math.random() * Math.PI * 2; // Start with random rotation
        this.radius = radius;
        this.equippedComponents = equippedComponents;
        this.hasFire = !!this.equippedComponents['Fire Damage'];
    }
    update(tsf) {
        this.x += this.vx * tsf; this.y += this.vy * tsf;
        this.rotation += 0.2 * tsf;
        // Use a mix of pink and white particles for the trail
        if (Math.random() < 0.536) { // 20% less particles (on top of previous 33%)
            const trailColor = (Math.random() < 0.5) ? 'rgba(255, 105, 180, 0.7)' : 'rgba(255, 255, 255, 0.7)';
            this.game.particles.push(new Particle(this.x, this.y, trailColor, 'smoke'));
        }
        if (Math.hypot(this.x - this.origin.x, this.y - this.origin.y) > this.range) this.dead = true;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);

        // Base white circle
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Stripes
        const numStripes = 4; // 2 red, 2 pink
        const stripeAngle = Math.PI / 8; // Width of stripe
        for (let i = 0; i < numStripes; i++) {
            ctx.fillStyle = (i % 2 === 0) ? '#e74c3c' : '#ff9ff3'; // Alternate red/pink
            const angle = (i / numStripes) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.radius, angle, angle + stripeAngle);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}
