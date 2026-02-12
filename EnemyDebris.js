export default class EnemyDebris {
    constructor() {
        this.active = false;
    }

    init(game, enemy, image, enemySpriteWidth = null, enemySpriteHeight = null, numCols = 2, numRows = 2) {
        this.game = game;
        this.image = image;
        this.color = enemy.color;
        this.collisionWidth = enemy.width;
        this.collisionHeight = enemy.height;
        this.enemySpeed = enemy.speed;
        this.active = true;

        const baseWidth = this.collisionWidth;
        const baseHeight = this.collisionHeight;

        const visualSpriteWidth = enemySpriteWidth !== null ? enemySpriteWidth : this.collisionWidth;
        const visualSpriteHeight = enemySpriteHeight !== null ? enemySpriteHeight : this.collisionHeight;

        const chunkWidth = baseWidth / numCols;
        const chunkHeight = baseHeight / numRows;

        let randomCol = Math.floor(Math.random() * numCols);
        let randomRow = Math.floor(Math.random() * numRows);

        this.width = chunkWidth;
        this.height = chunkHeight;

        if (enemy.sprite) {
            const spriteCol = randomCol;
            const spriteRow = randomRow;
            const spriteChunkWidth = visualSpriteWidth / numCols;
            const spriteChunkHeight = visualSpriteHeight / numRows;

            this.sx = (enemy.sprite.currentFrame * visualSpriteWidth) + (spriteCol * spriteChunkWidth);
            this.sy = spriteRow * spriteChunkHeight;
            this.sWidth = spriteChunkWidth;
            this.sHeight = spriteChunkHeight;
        } else {
            this.sx = randomCol * chunkWidth;
            this.sy = randomRow * chunkHeight;
            this.sWidth = chunkWidth;
            this.sHeight = chunkHeight;
        }

        this.x = (enemy.x + randomCol * chunkWidth) + (Math.random() - 0.5) * 5;
        this.y = (enemy.y + randomRow * chunkHeight) + (Math.random() - 0.5) * 5;

        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (enemy.speed * 0.5) - (Math.random() * 5);
        this.gravity = 0.3;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.4;
        this.rotationDecelFactor = 0.95; // New deceleration factor for rotation

        this.lifespan = 600;
        this.fadeStart = 120;
        this.alpha = 1;
        
        this.onGround = false;
        this.bounceCount = 0;
        this.maxBounces = 2;
    }

    reset() {
        this.active = false;
        this.game = null; // Clear game reference
        this.image = null;
        this.color = null;
        this.collisionWidth = 0;
        this.collisionHeight = 0;
        this.enemySpeed = 0;
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;
        this.sx = 0;
        this.sy = 0;
        this.sWidth = 0;
        this.sHeight = 0;
        this.vx = 0;
        this.vy = 0;
        this.gravity = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.rotationDecelFactor = 0; // Reset deceleration factor
        this.lifespan = 0;
        this.fadeStart = 0;
        this.alpha = 1; // Reset alpha to full
        this.onGround = false;
        this.bounceCount = 0;
        this.maxBounces = 0;
    }

    update(tsf) {
        if (!this.active) return;

        this.lifespan -= tsf;
        this.onGround = false; // Reset onGround at the start of each update cycle

        // Emit particles only when not on ground, or if just starting to bounce
        if (this.vy !== 0 || !this.onGround) { // Only emit particles if moving or not yet settled
            const particle = this.game.particlePool.get();
            if (particle) {
                const initialSize = (Math.random() * 8 + 4) * 1.25; // Base size 4-12, then 25% bigger
                particle.init(this.game, this.x + this.width / 2, this.y + this.height / 2, this.color, 'trail', initialSize, 0.5, 0, 0);
                particle.emitter = this;
            }

            // Emit separate smoke particles
            if (this.game.gameTime % 5 === 0) { // Throttle emission
                const smokeParticle = this.game.particlePool.get();
                if (smokeParticle) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = Math.random() * 1 + 0.5;
                    const vx = Math.cos(angle) * speed * 0.5;
                    const vy = Math.sin(angle) * speed * 0.5;
                    smokeParticle.init(this.game, this.x + this.width / 2, this.y + this.height / 2, 'rgba(100,100,100,0.5)', 'smoke', 2, vx, vy);
                }
            }
        }

        if (this.lifespan <= 0) {
            this.game.enemyDebrisPool.returnToPool(this);
            return;
        }

        if (this.lifespan <= this.fadeStart) {
            this.alpha = this.lifespan / this.fadeStart;
        }

        // Apply global deceleration to rotation speed
        this.rotationSpeed *= Math.pow(this.rotationDecelFactor, tsf);

        // Apply gravity only if not currently considered on ground
        if (!this.onGround) {
            this.vy += this.gravity * tsf;
        } else {
            // Apply friction and rotational slowdown when on ground
            this.vx *= Math.pow(0.9, tsf);
            // rotationSpeed is now decelerated globally, no need to do it again here
        }

        // If horizontal velocity is very small, or stopped, also stop rotation
        // This links rotation stopping to horizontal movement stopping
        if (Math.abs(this.vx) < 0.1 && Math.abs(this.rotationSpeed) < 0.01) {
            this.rotationSpeed = 0;
        }

        // Stop linear movement if very slow
        if (Math.abs(this.vx) < 0.1) this.vx = 0;
        if (Math.abs(this.vy) < 0.1 && this.onGround) this.vy = 0; // Only stop vertical if on ground and very slow

        if (this.vx === 0 && this.vy === 0 && this.rotationSpeed === 0 && this.onGround) {
            // If completely stopped and on ground, no need to update further
            return;
        }

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.rotation += this.rotationSpeed * tsf;

        const debrisBottom = this.y + this.height;
        const debrisLeft = this.x;
        const debrisRight = this.x + this.width;

        this.game.platforms.forEach(p => {
            if (p.type === 'ground' || p.type === 'castle' || (p.type !== 'cloud' && p.y)) {
                const platformTop = p.y;
                let collisionY;

                if (p.type === 'ground') {
                    collisionY = this.game.PLAYABLE_AREA_HEIGHT - 50;
                } else {
                    collisionY = platformTop;
                }
                
                const platformLeft = p.x;
                const platformRight = p.x + p.width;

                if (debrisRight > platformLeft && debrisLeft < platformRight) {
                    if (this.vy > 0 && debrisBottom - (this.vy * tsf) <= collisionY && debrisBottom >= collisionY) {
                        this.y = collisionY - this.height;
                        this.onGround = true; // Correctly set onGround to true
                        this.bounceCount++;
                        this.vy = -this.vy * 0.19;

                        if (this.bounceCount === 1) {
                            const decalSize = (this.width / 2) * 0.67;
                            const randomPastelColor = this.game.PASTEL_COLORS[Math.floor(Math.random() * this.game.PASTEL_COLORS.length)];
                            this.game.decalManager.addDecal(this.x + this.width / 2, this.y + this.height, decalSize, randomPastelColor, Math.random() * Math.PI * 2);
                        }

                        if (this.bounceCount > this.maxBounces || Math.abs(this.vy) < 0.5) {
                            this.vy = 0;
                            this.bounceCount = this.maxBounces;
                        }
                        this.vx *= 0.8;
                    }
                }
            }
        });

        // Fallback ground collision
        if (!this.onGround && debrisBottom > (this.game.PLAYABLE_AREA_HEIGHT - 50)) { // Only apply if not already collided with a platform
            this.y = this.game.PLAYABLE_AREA_HEIGHT - 50 - this.height;
            this.onGround = true;
            this.bounceCount++;
            this.vy = -this.vy * 0.1;
            if (this.bounceCount > this.maxBounces || Math.abs(this.vy) < 0.5) {
                this.vy = 0;
                this.bounceCount = this.maxBounces;
            }
            this.vx *= 0.8;
        }

        if (this.x < 0) {
            this.x = 0;
            this.vx *= -0.5;
            this.rotationSpeed *= -0.5;
        } else if (this.x + this.width > this.game.width) {
            this.x = this.game.width - this.width;
            this.vx *= -0.5;
            this.rotationSpeed *= -0.5;
        }

        if (this.y > this.game.height + 50) {
            this.game.enemyDebrisPool.returnToPool(this);
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;

        if (this.image && this.image.complete) {
            ctx.drawImage(
                this.image,
                this.sx, this.sy, this.sWidth, this.sHeight,
                -this.width / 2, -this.height / 2, this.width, this.height
            );
        }
        
        ctx.restore();
    }
}