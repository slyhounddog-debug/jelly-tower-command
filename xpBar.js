
import { darkenColor } from './utils.js';

export default class XPBar {
    constructor(game) {
        this.game = game;
    }

    draw(ctx, x, y) {
        const player = this.game.player;
        if (!player) return;

        const barWidth = 200;
        const barHeight = 28; // Slightly taller
        // Position in the top center, but offset to the right of the health bar
        const barX = x;
        const barY = y;

        const pct = Math.max(0, player.xp / player.xpForNextLevel);

        // Frame
        ctx.fillStyle = 'rgba(0, 77, 74, 0.6)'; // Dark Teal background
        ctx.strokeStyle = '#00f2ea'; // Bright Teal border
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barWidth, barHeight, 14);
        ctx.fill();
        ctx.stroke();

        // Fill
        if (pct > 0) {
            ctx.fillStyle = '#00f2ea';
            ctx.beginPath();
            ctx.roundRect(barX, barY, barWidth * pct, barHeight, 14);
            ctx.fill();
        }

        // Shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(barX + 2, barY + 2, barWidth - 4, barHeight / 3, 10);
        ctx.fill();

        // Text
        const xpText = `${Math.floor(player.xp)} / ${player.xpForNextLevel}`;
        ctx.font = 'bold 32px "VT323"'; // Increased font size
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'black';
        ctx.shadowBlur = 4;
        ctx.fillText(xpText, barX + barWidth / 2, barY + barHeight / 2 + 1);
        ctx.shadowBlur = 0;

        // Level Bulb
        const bulbRadius = 22; // Larger bulb
        const bulbX = barX - bulbRadius + 8;
        const bulbY = barY + barHeight / 2;

        ctx.beginPath();
        ctx.arc(bulbX, bulbY, bulbRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#004d4a'; // Dark Teal
        ctx.fill();
        ctx.strokeStyle = '#00f2ea';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Level Text
        ctx.font = 'bold 26px "VT323"'; // Increased font size
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.fillText(player.level, bulbX, bulbY + 2);
    }
}
