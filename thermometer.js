export default class Thermometer {
    constructor(game) {
        this.game = game;
        this.width = this.game.width;
        this.height = this.game.height;
        this.thermometerStartTime = null;
        this.thermometerWarn = false;
    }

    draw(ctx) {
        // --- 1. DIMENSIONS ---
        const w = 42;           
        const h = 375;          
        const xBase = this.width - 80;
        const yBase = 100;
        const bulbRadius = 38;  
        const bulbY = yBase + h;

        // --- 2. 10-MINUTE TIMER LOGIC ---
        if (!this.thermometerStartTime) {
            this.thermometerStartTime = Date.now();
        }
        const duration = 10 * 60 * 1000; 
        const elapsed = Date.now() - this.thermometerStartTime;
        const fillPercent = Math.min(1, elapsed / duration);
        
        const totalFillHeight = (h + bulbRadius) * fillPercent;
        const jamTopY = (bulbY + bulbRadius) - totalFillHeight;

        const intersectAngle = Math.asin((w / 2) / bulbRadius);
        const intersectY = bulbY - Math.cos(intersectAngle) * bulbRadius;

        // --- 3. ANIMATION LOGIC (HALF SPEED) ---
        const time = Date.now() * 0.001; // Slower time (multiplied by 0.001 instead of 0.002)
        const pulse = (Math.sin(time * 2) + 1) / 2; 
        const scale = 1 + (pulse * 0.05); 
        
        // Wobble: 2 degrees is ~0.035 radians
        const wobbleAngle = Math.sin(time * 0.8) * 0.035; 

        ctx.save();

        const centerX = xBase;
        const centerY = yBase + (h / 2);
        ctx.translate(centerX, centerY);
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

        // OUTER GLOW
        ctx.save();
        ctx.shadowBlur = 15 + (pulse * 10);
        ctx.shadowColor = `rgba(255, 105, 180, ${0.4 + pulse * 0.3})`; 
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        drawGlassShape();
        ctx.stroke();
        ctx.restore();

        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        drawGlassShape();
        ctx.fill();

        // 5. INTERNAL PINK JAM
        ctx.save();
        drawGlassShape();
        ctx.clip(); 

        const jamGrad = ctx.createLinearGradient(x, jamTopY, x, bulbY + bulbRadius);
        jamGrad.addColorStop(0, "rgba(255, 180, 220, 0.9)"); // Brighter pink
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

        // SPITTING PARTICLES (Only if > 80% full)
        if (fillPercent > 0.8) {
            ctx.fillStyle = "rgba(255, 105, 180, 0.8)";
            for (let i = 0; i < 5; i++) {
                const pTime = Date.now() * 0.002 + i;
                const px = x + Math.cos(pTime * 2) * 15;
                const py = jamTopY - (Math.abs(Math.sin(pTime * 5)) * 30);
                ctx.beginPath();
                ctx.arc(px, py, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // SLOW BUBBLES
        const bTime = Date.now();
        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        for (let i = 0; i < 8; i++) {
            const bX = x + Math.sin(bTime * 0.001 + i) * (w * 0.3);
            const bY = (bulbY + 10) - ((bTime * (0.015 + i * 0.003)) % (totalFillHeight + 20));
            if (bY > jamTopY + 5) {
                ctx.beginPath();
                ctx.arc(bX, bY, 1 + (i % 2), 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore(); 

        // 6. NOTCHES WITH GLOW LOGIC
        for (let i = 1; i <= 10; i++) {
            const notchPct = i / 10;
            const notchY = bulbY - (h * notchPct);
            const isGlowing = fillPercent >= notchPct;

            ctx.beginPath();
            ctx.moveTo(x - w / 2 + 5, notchY);
            ctx.quadraticCurveTo(x, notchY + 5, x + w / 2 - 5, notchY);
            
            if (isGlowing) {
                ctx.strokeStyle = "rgba(255, 180, 220, 0.9)";
                ctx.lineWidth = 3;
                ctx.shadowBlur = 5;
                ctx.shadowColor = "pink";
            } else {
                ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
                ctx.lineWidth = 1.5;
                ctx.shadowBlur = 0;
            }
            ctx.stroke();
        }
        ctx.shadowBlur = 0; // Reset shadow

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
