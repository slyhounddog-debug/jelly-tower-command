export default class Thermometer {
    constructor(game) {
        this.game = game;
        this.width = this.game.width;
        this.height = this.game.height;
        this.thermometerStartTime = null;
        this.thermometerWarn = false;
        this.pulse = false;
        this.recoil = 0;
    }

    update(tsf) {
        if (this.recoil > 0) {
            this.recoil -= 0.5 * tsf;
        }
    }

    triggerRecoil() {
        this.recoil = 18;
    }

    getPosition() {
        const xBase = this.width - 80;
        const yBase = 100;
        const h = 375;
        const bulbY = yBase + h;
        return { x: xBase, y: bulbY };
    }

    draw(ctx) {
        // --- 1. DIMENSIONS ---
        const w = 42;
        const h = 375;
        const xBase = this.width - 60;
        const yBase = 150;
        const bulbRadius = 38;
        const bulbY = yBase + h;

        // --- 2. NEW KILL-BASED LOGIC ---
        let fillPercent = this.game.killsSinceLastBoss / this.game.killsForNextBoss;
        if (this.game.boss) {
            fillPercent = 1; // Keep it full during boss fight
        }
        fillPercent = Math.min(1, fillPercent);
        
        const totalFillHeight = (h + bulbRadius) * fillPercent;
        const jamTopY = (bulbY + bulbRadius) - totalFillHeight;

        const intersectAngle = Math.asin((w / 2) / bulbRadius);
        const intersectY = bulbY - Math.cos(intersectAngle) * bulbRadius;

        // --- 3. ANIMATION LOGIC ---
        let time = Date.now() * 0.001;
        let pulse, scale, wobbleAngle;

        if (this.game.boss) {
            // 50% faster animation and 10% more aggressive wobble/size change during boss event
            time = Date.now() * 0.0015;
            pulse = (this.pulse || this.game.boss) ? (Math.sin(Date.now() * 0.005) + 1) / 2 : (Math.sin(time * 2) + 1) / 2;
            scale = 1 + (pulse * 0.05); 
            wobbleAngle = Math.sin(time * 0.8) * 0.035; 
        } else {
            pulse = (this.pulse || this.game.boss) ? (Math.sin(Date.now() * 0.003) + 1) / 2 : (Math.sin(time * 2) + 1) / 2;
            scale = 1 + (pulse * 0.03); 
            wobbleAngle = Math.sin(time * 0.8) * 0.02; 
        }
        const recoilOffset = this.recoil > 0 ? Math.sin(this.recoil * 0.5) * this.recoil : 0;

        ctx.save();

        const centerX = xBase;
        const centerY = yBase + (h / 2);
        ctx.translate(centerX + recoilOffset, centerY);
        ctx.rotate(wobbleAngle);
        ctx.scale(scale, scale);
        ctx.translate(-centerX, -centerY);
        
        const x = xBase;
        const y = yBase;

        // 4. REUSABLE GLASS SHAPE
        const drawGlassShape = () => {
            ctx.beginPath();
            ctx.arc(x, y, w / 2, Math.PI, 0); 
            ctx.lineTo(x + w / 2, intersectY);
            ctx.arc(x, bulbY, bulbRadius, 1.5 * Math.PI + intersectAngle, 1.5 * Math.PI - intersectAngle);
            ctx.closePath();
        };

        // ... (The rest of the drawing logic remains largely the same, using the new fillPercent) ...
        // OUTER GLOW, GLASS SHAPE, INTERNAL JAM, PARTICLES, NOTCHES, BORDER, GLARE
        // (This logic is complex and stylistic, better to keep it and just feed it the new fillPercent)

        // OUTER GLOW
        ctx.save();
        ctx.shadowBlur = 15 + (pulse * 10);
        ctx.shadowColor = `rgba(255, 105, 180, ${0.4 + pulse * 0.3})`;
        if (this.pulse || this.game.boss) {
            ctx.shadowColor = `rgba(255, 0, 255, ${0.7 + pulse * 0.3})`;
        }
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        drawGlassShape();
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        drawGlassShape();
        ctx.fill();

        // "Boss Time" text
        ctx.save();
        ctx.translate(x, y + h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = 'bold 48px "VT323"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw transparent text first
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillText('B o s s   T i m e', 0, 0);

        // Draw filled text
        ctx.save();
        ctx.rect(-w / 2, h / 2, w, -h * fillPercent);
        ctx.clip();

        if (this.game.boss) {
            const gradient = ctx.createLinearGradient(-h/2, 0, h/2, 0);
            const hue = (this.game.gameTime * 2) % 360;
            gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
            gradient.addColorStop(0.5, `hsl(${(hue + 90) % 360}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${(hue + 180) % 360}, 100%, 50%)`);
            ctx.fillStyle = gradient;
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        }
        ctx.fillText('B o s s   T i m e', 0, 0);
        ctx.restore();

        ctx.restore();

        // 5. INTERNAL PINK JAM
        ctx.save();
        drawGlassShape();
        ctx.clip(); 

        const jamGrad = ctx.createLinearGradient(x, jamTopY, x, bulbY + bulbRadius);
        jamGrad.addColorStop(0, "rgba(255, 180, 220, 0.9)");
        jamGrad.addColorStop(0.3, "rgba(255, 20, 147, 0.75)"); 
        jamGrad.addColorStop(1, "rgba(139, 0, 139, 0.7)");    
        ctx.fillStyle = jamGrad;

        ctx.fillRect(x - bulbRadius - 10, jamTopY, (bulbRadius + 10) * 2, (bulbY + bulbRadius) - jamTopY);

        // Wave Surface
        const waveTime = Date.now() * 0.005;
        const waveWidth = bulbRadius + 10;
        ctx.beginPath();
        ctx.moveTo(x - waveWidth, jamTopY + 10);
        for (let i = -waveWidth; i <= waveWidth; i++) {
            const wave = Math.sin(i * 0.15 + waveTime * 1.5) * 4 + Math.cos(i * 0.1 - waveTime * 0.8) * 2;
            ctx.lineTo(x + i, jamTopY + wave);
        }
        ctx.lineTo(x + waveWidth, jamTopY + 10);
        ctx.fill();
        
        ctx.restore(); 

        // Main Border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
        ctx.lineWidth = 3;
        drawGlassShape();
        ctx.stroke();

        // Glare
        const glassGlare = ctx.createLinearGradient(x - w/2, 0, x + w/2, 0);
        glassGlare.addColorStop(0.2, "rgba(255, 255, 255, 0.3)");
        glassGlare.addColorStop(0.5, "rgba(255, 255, 255, 0)");
        ctx.fillStyle = glassGlare;
        ctx.fillRect(x - w/2, y - 10, w, h + 10);

        ctx.restore(); 
    }
}