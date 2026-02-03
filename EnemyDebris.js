export default class EnemyDebris {
    constructor(game, enemy, enemySpriteWidth = null, enemySpriteHeight = null) {
        this.game = game;
        this.image = enemy.sprite ? enemy.sprite.image : enemy.image;
        this.collisionWidth = enemy.width;
        this.collisionHeight = enemy.height;
        this.enemySpeed = enemy.speed;

        // Use the enemy's actual collision size for debris chunking to keep it proportional
        const baseWidth = this.collisionWidth;
        const baseHeight = this.collisionHeight;

        const visualSpriteWidth = enemySpriteWidth !== null ? enemySpriteWidth : this.collisionWidth;
        const visualSpriteHeight = enemySpriteHeight !== null ? enemySpriteHeight : this.collisionHeight;

        // Debris chunk size (3x3 grid from the collision box, 2x3 for piggy)
        let numCols = 2;
        let numRows = 2;

        if (enemy.type === 'piggy') {
            numCols = 2;
            numRows = 3;
        }
        const chunkWidth = baseWidth / numCols;
        const chunkHeight = baseHeight / numRows;

        let randomCol = Math.floor(Math.random() * numCols);
        let randomRow = Math.floor(Math.random() * numRows);

        // This is the drawn size of the debris piece
        this.width = chunkWidth;
        this.height = chunkHeight;

        // Determine the source rect from the sprite image
        if (enemy.sprite) {
            // It's a sprite, so we need to map our chunk to the visual sprite
            const spriteCol = Math.floor((randomCol * chunkWidth) / baseWidth * (visualSpriteWidth / chunkWidth));
            const spriteRow = Math.floor((randomRow * chunkHeight) / baseHeight * (visualSpriteHeight / chunkHeight));
            const spriteChunkWidth = visualSpriteWidth / numCols;
            const spriteChunkHeight = visualSpriteHeight / numRows;

            this.sx = (enemy.sprite.currentFrame * visualSpriteWidth) + (randomCol * spriteChunkWidth);
            this.sy = randomRow * spriteChunkHeight;
            this.sWidth = spriteChunkWidth;
            this.sHeight = spriteChunkHeight;
        } else {
            // It's a simple image, so the source is just the chunk's position
            this.sx = randomCol * chunkWidth;
            this.sy = randomRow * chunkHeight;
            this.sWidth = chunkWidth;
            this.sHeight = chunkHeight;
        }

        // Initial world position of the debris piece, relative to the enemy's center
        this.x = (enemy.x + randomCol * chunkWidth) + (Math.random() - 0.5) * 5;
        this.y = (enemy.y + randomRow * chunkHeight) + (Math.random() - 0.5) * 5;

        this.vx = (Math.random() - 0.5) * 8;
        this.vy = (enemy.speed * 0.5) - (Math.random() * 5);
        this.gravity = 0.3;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.4;

        this.lifespan = 1020;
        this.fadeStart = 120;
        this.alpha = 1;
        this.dead = false;

        this.onGround = false;
        this.bounceCount = 0;
        this.maxBounces = 2;
    }

    update(tsf) {
        this.lifespan -= tsf;

        if (this.lifespan <= 0) {
            this.dead = true;
            return;
        }

        if (this.lifespan <= this.fadeStart) {
            this.alpha = this.lifespan / this.fadeStart;
        }

        if (!this.onGround) {
            this.vy += this.gravity * tsf;
        } else {
            // Apply friction when on ground
            this.vx *= Math.pow(0.9, tsf); // Exponential decay for smoother stop
            this.rotationSpeed *= Math.pow(0.9, tsf);
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
            if (Math.abs(this.rotationSpeed) < 0.01) this.rotationSpeed = 0;
            // If almost stopped, no need to update more
            if (this.vx === 0 && this.rotationSpeed === 0 && this.vy === 0) {
                return;
            }
        }

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.rotation += this.rotationSpeed * tsf;

        let collidedWithPlatformThisFrame = false;
        const debrisBottom = this.y + this.height;
        const debrisLeft = this.x;
        const debrisRight = this.x + this.width;

        // Check collision with game platforms
        this.game.platforms.forEach(p => {
            // Only consider solid platforms (ground, castle, non-cloud platforms)
            if (p.type === 'ground' || p.type === 'castle' || (p.type !== 'cloud' && p.y)) {
                const platformTop = p.y;
                let collisionY;

                if (p.type === 'ground') {
                    // For the general ground, use the adjusted PLAYABLE_AREA_HEIGHT - 100
                    collisionY = this.game.PLAYABLE_AREA_HEIGHT - 50;
                } else {
                    // For specific platforms (castle, other), use their actual top Y
                    collisionY = platformTop;
                }
                
                const platformLeft = p.x;
                const platformRight = p.x + p.width;

                // Check for horizontal overlap
                if (debrisRight > platformLeft && debrisLeft < platformRight) {
                    // Check if debris is falling and hits the top of the platform
                    if (this.vy > 0 && debrisBottom - (this.vy * tsf) <= collisionY && debrisBottom >= collisionY) {
                        this.y = collisionY - this.height; // Place on top of platform
                        this.onGround = true;
                        collidedWithPlatformThisFrame = true;
                        this.bounceCount++;
                        // Reduce bounce significantly
                        this.vy = -this.vy * 0.19; // Less bounce

                        if (this.bounceCount > this.maxBounces || Math.abs(this.vy) < 0.5) { // Stop bouncing if too many or too weak
                            this.vy = 0;
                            this.bounceCount = this.maxBounces; // Prevent further bouncing
                        }
                        // this.game.audioManager.playSound('debrisHit'); // Play a sound
                        this.vx *= 0.8; // Lose some horizontal speed on impact
                    }
                }
            }
        });

        // --- Ground Fallback (if no platform collision) ---
        // If not colliding with any specific platform, check if it hit the effective ground
        if (!collidedWithPlatformThisFrame && debrisBottom > (this.game.PLAYABLE_AREA_HEIGHT - 50)) {
            this.y = this.game.PLAYABLE_AREA_HEIGHT - 50 - this.height;
            this.onGround = true;
            collidedWithPlatformThisFrame = true; // Consider it collided for the frame
            this.bounceCount++;
            this.vy = -this.vy * 0.1; // Less bounce

            if (this.bounceCount > this.maxBounces || Math.abs(this.vy) < 0.5) {
                this.vy = 0;
                this.bounceCount = this.maxBounces;
            }
            this.vx *= 0.8; // Lose some horizontal speed on impact
            // this.game.audioManager.playSound('debrisHit'); // Play a sound
        }

        // --- Update onGround state and handle rolling off ---
        this.onGround = collidedWithPlatformThisFrame;
        // If debris was on ground but now has horizontal velocity, it might roll off.
        // If it falls below the effective playable area, it should still fall.
        if (this.y > this.game.PLAYABLE_AREA_HEIGHT - 50 && !this.onGround) {
            this.onGround = false; // Ensure it's not considered on ground if falling past the floor
        }


        // Prevent debris from going through the side walls
        if (this.x < 0) {
            this.x = 0;
            this.vx *= -0.5; // Bounce off wall
            this.rotationSpeed *= -0.5;
        } else if (this.x + this.width > this.game.width) {
            this.x = this.game.width - this.width;
            this.vx *= -0.5; // Bounce off wall
            this.rotationSpeed *= -0.5;
        }

        // If debris goes off screen bottom, mark as dead
        if (this.y > this.game.height + 50) { // A bit below screen
            this.dead = true;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2); // Translate to center for rotation
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;

        if (this.image && this.image.complete) {
            ctx.drawImage(
                this.image,
                this.sx, this.sy, this.sWidth, this.sHeight,
                -this.width / 2, -this.height / 2, this.width, this.height // Draw centered
            );
        }
        
        ctx.restore();
    }
}