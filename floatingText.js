export default class FloatingText {
    constructor(game, x, y, text, color = 'white', sizeIncrease = 0) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.text = text;
        this.life = 60; // 1 second
        this.opacity = 1;
        this.color = color;
        this.sizeIncrease = sizeIncrease;
    }

    update(tsf) {
        this.y -= 1 * tsf;
        this.life -= 1 * tsf;
        if (this.life < 0) this.life = 0;
        this.opacity = this.life / 60;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = `${24 + this.sizeIncrease}px 'Lucky Guy'`;
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}