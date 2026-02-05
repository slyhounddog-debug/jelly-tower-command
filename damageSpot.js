export default class DamageSpot {
    constructor() {
        // Parameterless constructor for pooling
        this.active = false;
    }

    init(x, y, radius, color, attachedTo = null, life = null) {
        this.relativeX = x;
        this.relativeY = y;
        this.radius = radius;
        this.color = color;
        this.opacity = 1;
        this.life = life;
        this.attachedTo = attachedTo;
        this.x = attachedTo ? attachedTo.x + this.relativeX : x;
        this.y = attachedTo ? attachedTo.y + this.relativeY : y;
        this.active = true;
    }

    reset() {
        this.active = false;
        this.relativeX = 0;
        this.relativeY = 0;
        this.radius = 0;
        this.color = '';
        this.opacity = 0;
        this.life = null;
        this.attachedTo = null;
        this.x = 0;
        this.y = 0;
    }

    update(tsf) {
        if (!this.active) return;

        if (this.life !== null) {
            this.life -= tsf;
            if (this.life <= 0) {
                this.opacity = 0;
                this.active = false; // Mark inactive
                // Assuming there's a reference to the game object to return to pool
                // This would typically be passed in init, or accessed via this.attachedTo.game
                // For now, I'll assume game.damageSpotPool exists and can be accessed
                if (this.attachedTo && this.attachedTo.game && this.attachedTo.game.damageSpotPool) {
                     this.attachedTo.game.damageSpotPool.returnToPool(this);
                } else if (this.game && this.game.damageSpotPool) { // If not attached, check directly
                    this.game.damageSpotPool.returnToPool(this);
                }
                return;
            }
        }
        if (this.attachedTo) {
            this.x = this.attachedTo.x + this.relativeX;
            this.y = this.attachedTo.y + this.relativeY;
        }
    }

    draw(ctx) {
        if (!this.active || this.opacity <= 0) return; // Only draw active and visible damage spots
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}
