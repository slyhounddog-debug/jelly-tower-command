import Particle from './particle.js';
import FloatingText from './floatingText.js';

export default class Gumball {
    constructor(game, x, y, initialVx, initialVy, damage, color, spawner, canSpawn = true) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 22.5;
        this.height = 22.5;
        this.vx = initialVx;
        this.vy = initialVy;
        this.gravity = 0.5; // Gumballs are affected by gravity
        this.damage = damage;
        this.color = color;
        this.life = 120; // Lifespan of 2 seconds at 60fps
        this.dead = false;
        // this.hitEnemyIds = new Set(); // Removed for piercing
        this.spawner = spawner; // The enemy that spawned this gumball
        this.collisionDelay = 5; // 5 frames delay before collision is active
        this.canSpawn = canSpawn; // Keep this for clarity, but its impact on recursive spawning is removed here
        this.bossHit = false; // New property to track if this gumball has hit the boss
    }

    update(tsf) {
        this.life -= tsf;
        if (this.life <= 0) {
            this.dead = true;
            return;
        }

        if (this.collisionDelay > 0) {
            this.collisionDelay -= tsf;
        }

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.vy += this.gravity * tsf;

        // Disappear off-screen
        if (this.x < -this.width || this.x > this.game.width + this.width ||
            this.y < -this.height || this.y > this.game.PLAYABLE_AREA_HEIGHT + this.height) {
            this.dead = true;
            return;
        }

        if (this.collisionDelay > 0) return;

        // Collision with missiles
        this.game.missiles.forEach(m => {
            // Gumballs should not hit the enemy they spawned from
            if (m === this.spawner) { // Assuming enemies have an 'id' property
                return;
            }

            if (this.x < m.x + m.width &&
                this.x + this.width > m.x &&
                this.y < m.y + m.height &&
                this.y + this.height > m.y) {
                
                // Removed this.hitEnemyIds.add(m.id) for piercing behavior
                
                if (m.takeDamage(this.damage, false, this)) {
                    m.kill();
                }
                this.game.screenShake.trigger(1, 5); // Small shake for gumball hits

                // Add particles for impact
                for (let i = 0; i < 5; i++) {
                    this.game.particles.push(new Particle(this.game, this.x, this.y, this.color, 'spark'));
                }
                
                // Gumball damage counts towards sugar rush
                if (this.game.player.upgrades['Sugar Rush'] > 0) {
                    this.game.player.sugarRushTimer = 300; // Reset sugar rush timer to 5 seconds
                }
                // Removed recursive gumball spawning: this.game.player.spawnGumballs(m.x + m.width / 2, m.y + m.height / 2, m, 1, false);
            }
        });

        // Collision with boss
        if (this.game.boss && this.game.boss !== this.spawner && !this.bossHit) { // Assuming boss has an 'id' property
            if (this.x < this.game.boss.x + this.game.boss.width &&
                this.x + this.width > this.game.boss.x &&
                this.y < this.game.boss.y + this.game.boss.height &&
                this.y + this.height > this.game.boss.y) {
                
                this.bossHit = true; // Set to true after hitting the boss
                
                this.game.boss.takeDamage(this.damage, false);
                this.game.screenShake.trigger(1, 5);

                for (let i = 0; i < 5; i++) {
                    this.game.particles.push(new Particle(this.game, this.x, this.y, this.color, 'spark'));
                }

                if (this.game.player.upgrades['Sugar Rush'] > 0) {
                    this.game.player.sugarRushTimer = 300;
                }
                // Removed recursive gumball spawning logic
            }
        }
    }

    draw(ctx) {
        ctx.save();
        
        // Shadow/outline
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2 + 2, this.y + this.height / 2 + 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
