import { darkenColor, lightenColor } from './utils.js?v=26';

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

    drawGear(ctx, x, y, radius, teeth, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / teeth;

        ctx.beginPath();
        for (let i = 0; i < teeth; i++) {
            let angle = rot + i * 2 * step;
            ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
            ctx.lineTo(x + radius * Math.cos(angle + step), y + radius * Math.sin(angle + step));
        }
        ctx.closePath();
        
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'white';
        ctx.stroke();
        
        ctx.fillStyle = '#7f8c8d';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, innerRadius, 0, Math.PI * 2, true);
        ctx.fillStyle = '#eb9cbeff'; // Match UI bar color to 'cut out' the center
        ctx.fill();
    }

    drawTitleScreen(ctx) {
        if (this.game.titlescreenImage && this.game.titlescreenImage.complete) {
            ctx.drawImage(this.game.titlescreenImage, 0, 0, this.width, this.game.PLAYABLE_AREA_HEIGHT);
        }

        const btn = this.game.ui.readyButton;
        if (!btn) return;

        let buttonImage;
        if (this.game.assetsReady) {
            buttonImage = this.game.readybuttonImage;
                    btn.width = buttonImage.naturalWidth * 1.5;
                    btn.height = buttonImage.naturalHeight * 1.5;
                    btn.x = (this.width - btn.width) / 2;
                    btn.y = this.game.PLAYABLE_AREA_HEIGHT - (this.game.PLAYABLE_AREA_HEIGHT * 0.045) - btn.height - 50;            ctx.drawImage(buttonImage, btn.x, btn.y, btn.width, btn.height);
        }
    }

    drawLoadingScreen(ctx) {
        ctx.clearRect(0, 0, this.width, this.game.PLAYABLE_AREA_HEIGHT);
        if (this.game.titlescreenImage && this.game.titlescreenImage.complete) {
            ctx.drawImage(this.game.titlescreenImage, 0, 0, this.width, this.game.PLAYABLE_AREA_HEIGHT);
        }

        const btn = this.game.ui.readyButton;
        if (!btn) return;

        let buttonImage = this.game.loadingbuttonImage;

        if (buttonImage && buttonImage.complete) {
            btn.width = buttonImage.naturalWidth * 1.5;
            btn.height = buttonImage.naturalHeight * 1.5;
            btn.x = (this.width - btn.width) / 2;
            btn.y = this.game.PLAYABLE_AREA_HEIGHT - (this.game.PLAYABLE_AREA_HEIGHT * 0.045) - btn.height - 50;
            ctx.drawImage(buttonImage, btn.x, btn.y, btn.width, btn.height);
        }
    }
}