export default class EnemyDebris {
    constructor() {
        this.active = false;
    }

    init(game, enemy, enemySpriteWidth = null, enemySpriteHeight = null, numCols = 2, numRows = 2) {
        this.game = game;
        this.image = enemy.sprite ? enemy.sprite.image : enemy.image;
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

        this.lifespan = 600;
        this.fadeStart = 120;
        this.alpha = 1;
        
        this.onGround = false;
        this.bounceCount = 0;
        this.maxBounces = 2;
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.lifespan = 0;
        this.onGround = false;
        this.image = null;
    }

    update(tsf) {
        if (!this.active) return;

        this.lifespan -= tsf;

        if (!this.onGround) {
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
            this.reset();
            return;
        }

        if (this.lifespan <= this.fadeStart) {
            this.alpha = this.lifespan / this.fadeStart;
        }

        if (!this.onGround) {
            this.vy += this.gravity * tsf;
        } else {
            this.vx *= Math.pow(0.9, tsf);
            this.rotationSpeed *= Math.pow(0.9, tsf);
            if (Math.abs(this.vx) < 0.1) this.vx = 0;
            if (Math.abs(this.rotationSpeed) < 0.01) this.rotationSpeed = 0;
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
                        this.onGround = true;
                        collidedWithPlatformThisFrame = true;
                        this.bounceCount++;
                        this.vy = -this.vy * 0.19;

                        if (this.bounceCount === 1) {
                            const decalSize = (this.width / 2) * 0.67; // 33% smaller
                            this.game.decalManager.addDecal(this.x + this.width / 2, this.y + this.height, decalSize, this.color, Math.random() * Math.PI * 2);
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

        if (!collidedWithPlatformThisFrame && debrisBottom > (this.game.PLAYABLE_AREA_HEIGHT - 50)) {
            this.y = this.game.PLAYABLE_AREA_HEIGHT - 50 - this.height;
            this.onGround = true;
            collidedWithPlatformThisFrame = true;
            this.bounceCount++;
            this.vy = -this.vy * 0.1;

            if (this.bounceCount > this.maxBounces || Math.abs(this.vy) < 0.5) {
                this.vy = 0;
                this.bounceCount = this.maxBounces;
            }
            this.vx *= 0.8;
        }

        this.onGround = collidedWithPlatformThisFrame;
        if (this.y > this.game.PLAYABLE_AREA_HEIGHT - 50 && !this.onGround) {
            this.onGround = false;
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
            this.reset();
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