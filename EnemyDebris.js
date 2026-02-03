export default class EnemyDebris {
    constructor(game, enemy, enemySpriteWidth = null, enemySpriteHeight = null) {
        this.game = game;
        this.image = enemy.sprite ? enemy.sprite.image : enemy.image;
        this.collisionWidth = enemy.width; // e.g., 74 for jelly bean collision box
        this.collisionHeight = enemy.height; // e.g., 74 for jelly bean collision box
        this.enemySpeed = enemy.speed;

        // Determine effective visual sprite dimensions for slicing
        const visualSpriteWidth = enemySpriteWidth !== null ? enemySpriteWidth : this.collisionWidth; // e.g., 165 for jelly bean visual
        const visualSpriteHeight = enemySpriteHeight !== null ? enemySpriteHeight : this.collisionHeight; // e.g., 175 for jelly bean visual

        // Debris chunk size (2x3 grid)
        const numCols = 2;
        const numRows = 3;
        const chunkWidth = visualSpriteWidth / numCols;
        const chunkHeight = visualSpriteHeight / numRows;

        // Randomly pick which chunk of the overall visual sprite this debris piece represents
        let randomCol = Math.floor(Math.random() * numCols);
        let randomRow = Math.floor(Math.random() * numRows);
        
        // Calculate source X, Y for the specific chunk from the full sprite image
        // If it's a jelly bean, account for its frame in the sprite sheet
        if (enemy.type === 'missile' && enemy.sprite) {
            this.sx = (enemy.sprite.currentFrame * visualSpriteWidth) + (randomCol * chunkWidth);
            this.sy = randomRow * chunkHeight;
        } else {
            this.sx = randomCol * chunkWidth;
            this.sy = randomRow * chunkHeight;
        }

        this.sWidth = chunkWidth; // Source width for drawImage
        this.sHeight = chunkHeight; // Source height for drawImage

        // The actual drawn size of the debris piece, scaled down to appear as a "small square"
        const debrisScaleFactor = 0.7; // Adjust this value to make debris smaller/bigger
        this.width = this.sWidth * debrisScaleFactor; 
        this.height = this.sHeight * debrisScaleFactor; 

        // Initial world position of the debris piece
        // Spawn around the center of where the enemy died, slightly randomized
        // First, find the top-left of the enemy's visual sprite
        const spriteTopLeftX = enemy.x + (this.collisionWidth / 2) - (visualSpriteWidth / 2);
        const spriteTopLeftY = enemy.y + (this.collisionHeight / 2) - (visualSpriteHeight / 2);

        // Then, position the debris piece based on its selected chunk's origin relative to the sprite's top-left
        this.x = spriteTopLeftX + this.sx + (Math.random() - 0.5) * (this.width / 2); // Randomize slightly around its chunk's origin
        this.y = spriteTopLeftY + this.sy + (Math.random() - 0.5) * (this.height / 2);


        this.vx = (Math.random() - 0.5) * 8; // Random horizontal burst
        this.vy = (enemy.speed * 0.5) - (Math.random() * 5); // Inherit some enemy speed, but mostly upward burst
        this.gravity = 0.3; // Fall faster
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.4; // Tumble faster

        this.lifespan = 1020; // 17 seconds at 60fps
        this.fadeStart = 120; // Start fading in the last 2 seconds (120 frames)
        this.alpha = 1;
        this.dead = false;

        this.onGround = false;
        this.bounceCount = 0;
        this.maxBounces = 2; // Allow a few bounces
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
                    collisionY = this.game.PLAYABLE_AREA_HEIGHT - 100;
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
                        this.vy = -this.vy * 0.1; // Less bounce

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
        if (!collidedWithPlatformThisFrame && debrisBottom > (this.game.PLAYABLE_AREA_HEIGHT - 100)) {
            this.y = this.game.PLAYABLE_AREA_HEIGHT - 100 - this.height;
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
        if (this.y > this.game.PLAYABLE_AREA_HEIGHT - 100 && !this.onGround) {
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