export default class DamageSpot {
    constructor(x, y, radius, color, attachedTo = null, life = null) {
        this.relativeX = x;
        this.relativeY = y;
        this.radius = radius;
        this.color = color;
        this.opacity = 1;
        this.life = life;
        this.attachedTo = attachedTo;
        this.x = attachedTo ? attachedTo.x + this.relativeX : x;
        this.y = attachedTo ? attachedTo.y + this.relativeY : y;
    }

    update(tsf) {
        if (this.life !== null) {
            this.life -= tsf;
            if (this.life <= 0) {
                this.opacity = 0;
            }
        }
        if (this.attachedTo) {
            this.x = this.attachedTo.x + this.relativeX;
            this.y = this.attachedTo.y + this.relativeY;
        }
    }

    draw(ctx) {
        if (this.opacity <= 0) return;
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

