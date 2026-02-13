// JellyTowerCommand/taffyUnwrapSlice.js
// New class for Taffy Unwrap Slices
export default class TaffyUnwrapSlice {
    constructor() {
        this.active = false;
    }

    init(game, image, sx, sy, sSourceWidth, sSourceHeight, x, y, sDisplayWidth, sDisplayHeight, vx, vy, gravity, rotationSpeed, lifespan, fadeStart, color) {
        this.game = game;
        this.image = image;
        this.sx = sx;
        this.sy = sy;
        this.sSourceWidth = sSourceWidth;
        this.sSourceHeight = sSourceHeight;
        this.sDisplayWidth = sDisplayWidth;
        this.sDisplayHeight = sDisplayHeight;
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.gravity = gravity;
        this.rotation = Math.random() * Math.PI * 2; // Initial random rotation
        this.rotationSpeed = rotationSpeed;
        this.lifespan = lifespan;
        this.fadeStart = fadeStart;
        this.color = color; // For emitted particles, if any
        this.alpha = 1;
        this.active = true;
    }

    reset() {
        this.active = false;
        this.game = null;
        this.image = null;
        this.sx = 0; this.sy = 0; this.sSourceWidth = 0; this.sSourceHeight = 0; this.sDisplayWidth = 0; this.sDisplayHeight = 0;
        this.x = 0; this.y = 0; this.vx = 0; this.vy = 0;
        this.gravity = 0; this.rotation = 0; this.rotationSpeed = 0;
        this.lifespan = 0; this.fadeStart = 0; this.alpha = 1;
        this.color = null;
    }

    update(tsf) {
        if (!this.active) return;

        this.lifespan -= tsf;
        if (this.lifespan <= 0) {
            this.game.taffyUnwrapSlicePool.returnToPool(this);
            return;
        }

        if (this.lifespan <= this.fadeStart) {
            this.alpha = this.lifespan / this.fadeStart;
        }

        // Apply gravity
        this.vy += this.gravity * tsf;

        // Apply air drag (slowing quicker)
        this.vx *= Math.pow(0.95, tsf); // Stronger drag
        this.vy *= Math.pow(0.95, tsf); // Stronger drag

        this.x += this.vx * tsf;
        this.y += this.vy * tsf;
        this.rotation += this.rotationSpeed * tsf;

        // Optional: Emit tiny particles as they fly
        if (Math.random() < 0.5) { // Emit more frequently (50% chance each frame)
             const spark = this.game.taffySparkParticlePool.get(); // Use new pool
             if (spark) {
                 // Calculate vx and vy for outward spray, relative to slice's current velocity, but without slice's gravity-affected vy
                 const randomAngle = Math.random() * Math.PI * 2; // Full circle
                 const sparkSpeed = Math.random() * 3 + 1; // Speed for emitted sparks
                 const sparkVx = Math.cos(randomAngle) * sparkSpeed;
                 const sparkVy = Math.sin(randomAngle) * sparkSpeed;
                 // TaffySparkParticle.init(game, x, y, color, size, vx, vy, lifespan)
                 spark.init(this.game, this.x + this.sDisplayWidth / 2, this.y + this.sDisplayHeight / 2, 'rgba(255,255,255,0.9)', 5.4, sparkVx, sparkVy, 25); // Bigger, faster, longer-lived
             }
        }
    }

    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        ctx.translate(this.x + this.sDisplayWidth / 2, this.y + this.sDisplayHeight / 2); // Translate to center of slice
        ctx.rotate(this.rotation);
        ctx.globalAlpha = this.alpha;

        if (this.image && this.image.complete) {
            ctx.drawImage(
                this.image,
                this.sx, this.sy, this.sSourceWidth, this.sSourceHeight,
                -this.sDisplayWidth / 2, -this.sDisplayHeight / 2, this.sDisplayWidth, this.sDisplayHeight
            );
        }
        ctx.restore();
    }
}
