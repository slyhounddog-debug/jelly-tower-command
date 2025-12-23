import { darkenColor, lightenColor } from './utils.js?v=25';

export default class Drawing {
    constructor(game) {
        this.game = game;
        this.width = this.game.width;
        this.height = this.game.height;
    }

    drawSunlight(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const rayCount = 2;
        for (let i = 0; i < rayCount; i++) {
            ctx.beginPath();
            const grad = ctx.createLinearGradient(0, 0, this.width, this.height);
            grad.addColorStop(0, 'rgba(255, 255, 220, 0.2)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.moveTo(150 + (i * 400), -100);
            ctx.lineTo(400 + (i * 400), -100);
            ctx.lineTo(-100 + (i * 400), this.height + 100);
            ctx.lineTo(-350 + (i * 400), this.height + 100);
            ctx.fill();
        }
        ctx.restore();
    }

    drawSugarSnow(ctx, tsf) {
        if (!this.sugarSnowflakes) {
            this.sugarSnowflakes = Array.from({ length: 70 }, () => ({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.6 + 0.2
            }));
        }
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        this.sugarSnowflakes.forEach(f => {
            f.y += f.speed * tsf;
            if (f.y > this.height) f.y = -20;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    drawIceCreamBackground(ctx) {
        if (!this.bgCanvas) {
            this.bgCanvas = document.createElement('canvas');
            this.bgCanvas.width = this.width;
            this.bgCanvas.height = this.height;
            const bctx = this.bgCanvas.getContext('2d');

            const centerX = this.width / 2;
            const scoopData = [
                { x: 0, y: this.height + 300, r: 400, color: '#FFB5C5' },
                { x: this.width * 0.25, y: this.height + 320, r: 450, color: '#C1FFC1' },
                { x: this.width * 0.5, y: this.height + 350, r: 500, color: '#FFE4B5' },
                { x: this.width * 0.75, y: this.height + 320, r: 450, color: '#FFC0CB' },
                { x: this.width, y: this.height + 300, r: 400, color: '#B0E2FF' },
                { x: this.width * 0.3, y: this.height + 100, r: 380, color: '#FFFACD' },
                { x: this.width * 0.7, y: this.height + 100, r: 380, color: '#D1FFD1' },
                { x: centerX, y: this.height - 240, r: 360, color: '#FFB5C5' },
                { x: centerX, y: this.height - 480, r: 295, color: '#FFF9F0', hasCherry: true }
            ];

            scoopData.forEach((s) => {
                const drawScoopShape = (context, x, y, r) => {
                    context.beginPath();
                    context.moveTo(x - r, y);
                    context.bezierCurveTo(x - r, y - r * 1.35, x + r, y - r * 1.35, x + r, y);
                    const ripples = 12;
                    for (let i = 0; i <= ripples; i++) {
                        let rx = x + r - (i * (r * 2 / ripples));
                        let ry = y + (i % 2 === 0 ? 35 : 15);
                        context.quadraticCurveTo(rx + (r / ripples), ry + 20, rx, y);
                    }
                };

                // 1. Scoop Base
                bctx.save();
                bctx.fillStyle = s.color;
                drawScoopShape(bctx, s.x, s.y, s.r);
                bctx.fill();
                bctx.strokeStyle = darkenColor(s.color, 10);
                bctx.lineWidth = 4;
                bctx.stroke();
                bctx.restore();

                // 2. Sprinkles
                const sprColors = ['#FF69B4', '#5DADE2', '#F4D03F', '#58D68D', '#EB984E'];
                bctx.save();
                bctx.clip();
                for (let i = 0; i < 12; i++) {
                    let angle = Math.PI + (Math.random() * Math.PI);
                    let dist = (s.r * 0.5) + (Math.random() * s.r * 0.4);
                    let sx = s.x + Math.cos(angle) * dist;
                    let sy = s.y + Math.sin(angle) * dist;
                    if (sy < s.y - (s.r * 0.4)) {
                        bctx.save();
                        bctx.translate(sx, sy);
                        bctx.rotate(Math.random() * Math.PI);
                        bctx.fillStyle = sprColors[i % sprColors.length];
                        bctx.beginPath();
                        bctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
                        bctx.fill();
                        bctx.restore();
                    }
                }
                bctx.restore();

                // 3. REFINED LAYERED CHERRY
                if (s.hasCherry) {
                    const cx = s.x;
                    const cy = s.y - s.r * 0.92;
                    const mainR = 60;
                    const bgR = 64;   // Size of the background layers
                    const shift = 3;  // Tightened offset

                    // Stem
                    bctx.beginPath();
                    bctx.strokeStyle = '#4E342E';
                    bctx.lineWidth = 6;
                    bctx.moveTo(cx, cy - 10);
                    bctx.quadraticCurveTo(cx + 10, cy - 80, cx + 45, cy - 110);
                    bctx.stroke();

                    // LIGHT LAYER (Visible Top Right - Anchored Bottom Left)
                    bctx.fillStyle = '#FFDDE4'; // Even lighter pink
                    bctx.beginPath();
                    bctx.arc(cx + shift, cy - shift, bgR, 0, Math.PI * 2);
                    bctx.fill();

                    // DARK LAYER (Visible Bottom Left - Anchored Top Right)
                    bctx.fillStyle = '#800015';
                    bctx.beginPath();
                    bctx.arc(cx - shift, cy + shift, bgR, 0, Math.PI * 2);
                    bctx.fill();

                    // MAIN LAYER (Center)
                    bctx.fillStyle = '#FF4D6D';
                    bctx.beginPath();
                    bctx.arc(cx, cy, mainR, 0, Math.PI * 2);
                    bctx.fill();

                    // Small Shine
                    bctx.fillStyle = '#FFFFFF';
                    bctx.globalAlpha = 0.3;
                    bctx.beginPath();
                    bctx.ellipse(cx - 15, cy - 15, 10, 5, Math.PI / 4, 0, Math.PI * 2);
                    bctx.fill();
                    bctx.globalAlpha = 1.0;

                    // Tuck-in (Hides clipping from background layers)
                    bctx.fillStyle = s.color;
                    bctx.beginPath();
                    bctx.ellipse(cx, cy + mainR + 5, mainR * 1.6, 25, 0, 0, Math.PI * 2);
                    bctx.fill();
                }
            });
        }
        ctx.drawImage(this.bgCanvas, 0, 0);
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