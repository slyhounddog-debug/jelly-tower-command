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

    drawShieldIcon(ctx, x, y, radius) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale((radius / 64) * 0.85, (radius / 64) * 0.85);
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(0, 33, 64, Math.PI, 0);
        ctx.fill();
        ctx.restore();
    }

    drawTurretIcon(ctx, x, y, radius) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(radius / 46, radius / 46);
        ctx.fillStyle = '#a1c4fd';
        ctx.beginPath();
        ctx.roundRect(-23, -23, 46, 46, 10);
        ctx.fill();
        const gradient = ctx.createLinearGradient(0, 0, 28, 0);
        gradient.addColorStop(0, 'lightblue');
        gradient.addColorStop(1, 'lightpink');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, -11.5, 28, 13, 5);
        ctx.fill();
        ctx.restore();
    }

    drawActionButtons(ctx) {
        if (this.game.isGameOver) return;
        this.game.actionButtons.forEach(button => {
            if (button.errorShake > 0) {
                button.errorShake--;
            }
            const shakeX = button.errorShake > 0 ? Math.sin(button.errorShake * 2) * 5 : 0;
            const radius = button.radius * (button.hovered ? 1.1 : 1);
            
            ctx.save();
            ctx.translate(button.x + shakeX, button.y);

            // Outer glow
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';

            // 3D Bubble effect
            const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();

            // White border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Reset shadow for icon
            ctx.shadowBlur = 0;

            if (button.id === 'buy_shield') {
                this.drawShieldIcon(ctx, 0, 0, radius);
            } else if (button.id === 'buy_turret') {
                this.drawTurretIcon(ctx, 0, 0, radius);
            } else {
                ctx.font = `${radius * 0.8}px 'Lucky Guy'`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#333';
                ctx.fillText(button.icon, 0, 0);
            }

            if (button.hovered || button.errorShake > 0) {
                const cost = button.getCost();
                if (cost !== 'MAX' && cost !== 'N/A' && cost !== 'SELL') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fill();
                    ctx.fillStyle = button.errorShake > 0 ? 'red' : '#fff';
                    ctx.font = `bold ${radius * 0.5}px 'Lucky Guy'`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`$${cost}`, 0, 0);
                    ctx.restore();
                }
            }
            ctx.restore();
        });
    }
}