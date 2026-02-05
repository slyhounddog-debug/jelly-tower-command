export default class FrostingParticle {
    constructor() {
        this.active = false;
    }

    init(game, x, y, vx, vy, radius, color, lifespan, gravity = 0.15, type = 'player') {
        this.game = game;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        
        this.radius = radius * 1.7; 
        
        this.color = color;
        this.lifespan = lifespan;
        this.initialLifespan = lifespan;
        this.gravity = gravity;
        this.dragY = 0.95;
        this.type = type;

        this.history = [];
        this.maxHistory = 7;
        this.isSplatting = false; // New state for when particle is about to become a decal
        this.active = true;
    }

    reset() {
        this.active = false;
        this.history = [];
    }

    update(tsf) {
        this.lifespan -= tsf;
        if (this.lifespan <= 0) {
            this.game.frostingParticlePool.returnToPool(this);
            return;
        }

        // If splatting, rapidly shorten the trail
        if (this.isSplatting) {
            this.maxHistory -= 1 * tsf; // Rapidly decrease history size
            if (this.maxHistory <= 0) {
                this.lifespan = 0; // Mark for removal after trail is gone
                this.game.frostingParticlePool.returnToPool(this);
                return;
            }
            this.radius *= 0.8; // Also make the head disappear faster
            return; // Stop further movement/collision checks
        }

        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > this.maxHistory) this.history.shift();

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.vy += this.gravity * tsf;
        
        if (this.type === 'player') {
            this.vy *= this.dragY;
        }

        if (this.type === 'enemy') {
            let collided = false;
            let collisionObject = null;
            let decalY = this.y;

            // Check tower collision first
            for (const tower of this.game.towers) {
                if (this.x > tower.x && this.x < tower.x + tower.width &&
                    this.y > tower.y && this.y < tower.y + tower.height) {
                    collided = true;
                    collisionObject = tower;
                    decalY = tower.y; // Place decal at the top of the tower
                    break;
                }
            }

            if (!collided) {
                for (const platform of this.game.platforms) {
                    let effectiveY = platform.y + (platform.hitboxOffsetY || 0);
                    let effectiveHeight = platform.height;
                     if (platform.type === 'ground') {                                                                                                                                                                            
                          effectiveY += 15;   }  

                    // Reverted ground offset: effectiveY -= 100 removed from here

                    if (this.x > platform.x && this.x < platform.x + platform.width &&
                        this.y > effectiveY && this.y < effectiveY + effectiveHeight) {
                        collided = true;
                        collisionObject = platform;
                        decalY = effectiveY; // Place decal at the top of the platform's hitbox
                        break;
                    }
                }
            }

            if (this.x < 0 || this.x > this.game.width || this.y > this.game.PLAYABLE_AREA_HEIGHT || this.y < 0) {
                this.lifespan = 0; // Disappear off screen
                return;
            }

            if (collided) {
                let decalY = this.y;
                if (collisionObject) {
                    let effectiveY = collisionObject.y + (collisionObject.hitboxOffsetY || 0);
                    if (collisionObject.type === 'castle') { // For castle, place decal at its base Y
                        decalY = collisionObject.y;
                    } else {
                        decalY = effectiveY; // For other platforms, use the effective hitbox Y
                    }
                }
                this.game.decalManager.addDecal(this.x, decalY, this.radius, this.color, Math.random() * Math.PI, (collisionObject && collisionObject.type === 'tower') ? collisionObject : null);
                this.isSplatting = true; // Start splatting animation
                // Do NOT set lifespan = 0 here, let the splatting animation handle it
            }

        } else {
            // Original player particle behavior
            this.radius *= 0.99;
        }
    }

    draw(ctx) {
        if (this.type === 'enemy' && this.lifespan <=0) return;

        const alpha = Math.max(0, this.lifespan / this.initialLifespan);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = this.color;
        ctx.fillStyle = this.color;

        if (this.history.length > 1) {
            ctx.beginPath();
            ctx.moveTo(this.history[0].x, this.history[0].y);
            
            for (let i = 1; i < this.history.length; i++) {
                ctx.lineTo(this.history[i].x, this.history[i].y);
            }
            
            ctx.lineTo(this.x, this.y);
            
            ctx.lineWidth = this.radius * 2;
            ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
