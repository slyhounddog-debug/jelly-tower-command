import { darkenColor, lightenColor } from './utils.js?v=25';

export default class Drawing {
    constructor(game) {
        this.game = game;
        this.width = this.game.width;
        this.height = this.game.height;
    }

    drawPlatformFrosting(platform) {
        this.game.ctx.save();
        this.game.ctx.beginPath();
        this.game.ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 20);
        this.game.ctx.clip();
        const fColor = lightenColor(platform.color, 15);
        this.game.ctx.fillStyle = fColor;
        this.game.ctx.beginPath();
        let sY = platform.y + 5;
        this.game.ctx.moveTo(platform.x, sY);
        let nD = Math.floor(platform.width / 25);
        for (let i = 0; i < nD; i++) {
            let x1 = platform.x + (i / nD) * platform.width;
            let x2 = platform.x + ((i + 0.5) / nD) * platform.width;
            let x3 = platform.x + ((i + 1) / nD) * platform.width;
            let dY = sY + 18 + (Math.sin(this.game.gameTime / 60 + i) * 8);
            this.game.ctx.quadraticCurveTo(x2, dY, x3, sY);
        }
        this.game.ctx.lineTo(platform.x + platform.width, platform.y + platform.height);
        this.game.ctx.lineTo(platform.x, platform.y + platform.height);
        this.game.ctx.fill();
        this.game.ctx.restore();
    }

    drawTurretIcon(ctx, x, y, radius) {
        ctx.fillStyle = '#C0C0C0';
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#808080';
        ctx.fillRect(x - radius * 0.4, y - radius * 0.2, radius * 0.8, radius * 0.4);
    }
}