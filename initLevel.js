import { darkenColor } from './utils.js';
import Tower from './tower.js';
import Cloud from './cloud.js';

export default class initLevel { 
    constructor(game) {
        // We store the game reference so it can be used in the draw functions
        this.game = game;

        // --- 1. CORE ENVIRONMENT & COLORS ---
        const castleColor = '#f8c8dc'; 
        const groundColor = '#f8c8dc';
        const lollipopPalette = ['#ff9ff3', '#feca57', '#48dbfb']; 
        
        // Use game.width and game.height to fix the "disappearing" issue
        const groundPlatform = { 
            x: 0, 
            y: game.height - 60, 
            width: game.width, 
            height: 60, 
            color: groundColor, 
            type: 'ground' 
        };

        const castlePlatforms = [
            { x: 50, y: game.height - 160, width: 100, height: 160, color: castleColor, type: 'castle' },
            { x: game.width - 150, y: game.height - 160, width: 100, height: 160, color: castleColor, type: 'castle' },
            { x: game.width / 2 - 100, y: game.height - 120, width: 200, height: 120, color: castleColor, type: 'castle' }
        ];

        // Push platforms directly to the game object
        game.platforms = [...castlePlatforms, groundPlatform];

        // Cloud Platforms logic
        const floatingConfigs = [
            { x: 100, y: game.height - 250, width: 200 }, 
            { x: 900, y: game.height - 350, width: 200 },
            { x: 500, y: game.height - 550, width: 250 }, 
            { x: 100, y: game.height - 750, width: 180 },
            { x: 800, y: game.height - 850, width: 180 }, 
            { x: 450, y: game.height - 1100, width: 200 }
        ];

        floatingConfigs.forEach(cfg => {
            const platform = { ...cfg, height: 30, type: 'cloud' };
            const shadowOffset = 10;
            const width = platform.width;
            const height = platform.height * 1.5;

            platform.canvas = document.createElement('canvas');
            platform.canvas.width = width;
            platform.canvas.height = height + shadowOffset;
            const pCtx = platform.canvas.getContext('2d');

            pCtx.fillStyle = '#A99075';
            if (pCtx.roundRect) {
                pCtx.beginPath();
                pCtx.roundRect(0, shadowOffset, width, height, height * 0.3);
                pCtx.fill();
            } else {
                pCtx.fillRect(0, shadowOffset, width, height);
            }

            const gradient = pCtx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#E6CBA7');
            gradient.addColorStop(1, '#D2B48C');
            pCtx.fillStyle = gradient;
            if (pCtx.roundRect) {
                pCtx.beginPath();
                pCtx.roundRect(0, 0, width, height, height * 0.3);
                pCtx.fill();
            } else {
                pCtx.fillRect(0, 0, width, height);
            }

            pCtx.fillStyle = '#FFC0CB';
            if (pCtx.roundRect) {
                pCtx.beginPath();
                pCtx.roundRect(0, 0, width, height * 0.6, [height * 0.3, height * 0.3, 0, 0]);
                pCtx.fill();
            } else {
                pCtx.fillRect(0, 0, width, height * 0.6);
            }

            for (let i = 0; i < (width / 40); i++) {
                const dripX = Math.random() * width;
                const dripY = (height * 0.6) - 5;
                const dripWidth = 8 + Math.random() * 8;
                const dripHeight = 10 + Math.random() * 10;
                pCtx.beginPath();
                if (pCtx.roundRect) pCtx.roundRect(dripX, dripY, dripWidth, dripHeight, 4);
                pCtx.fill();
            }

            const sprinkles = ['#FF1493', '#00BFFF', '#ADFF2F', '#FFD700', '#FF4500'];
            for (let i = 0; i < (width / 10); i++) {
                const sX = 5 + Math.random() * (width - 10);
                const sY = 5 + Math.random() * ((height * 0.6) - 20);
                pCtx.fillStyle = sprinkles[Math.floor(Math.random() * sprinkles.length)];
                pCtx.fillRect(sX, sY, 2 + Math.random() * 2, 5 + Math.random() * 3);
            }

            game.platforms.push(platform);
        });

        game.towers = floatingConfigs.map(p => new Tower(game, p.x + 72.4, p.y - 55.2));
        game.clouds = Array.from({ length: 4 }, () => new Cloud(game));

        // --- 2. LOLLIPOP TREES SETUP ---
        game.trees = [];
        const treeCount = 8;
        const spacing = game.width / treeCount;

        for (let i = 0; i < treeCount; i++) {
            const depth = Math.random(); 
            game.trees.push({
                x: (spacing * i) + (Math.random() * (spacing * 0.4)),
                y: game.height - 55,
                z: depth,
                width: 110 + (depth * 90), 
                height: 380 + (depth * 520), 
                color: lollipopPalette[i % lollipopPalette.length]
            });
        }

        // --- 3. MOUNTAIN DRAWING ---
        game.drawMountains = (ctx) => {
            const mountainColors = ['#ffafbd', '#ffc3a0', '#ff9ff3'];
            ctx.save();
            ctx.globalAlpha = 0.9;
            mountainColors.forEach((color, i) => {
                const yBase = game.height - 60;
                const mWidth = game.width / 1.4;
                const xStart = (i * game.width / 4) - 150;
                const peakX = xStart + mWidth / 2;
                const peakY = yBase - 280 - (i * 60);

                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(xStart, yBase + 10);
                ctx.lineTo(peakX, peakY);
                ctx.lineTo(xStart + mWidth, yBase + 10);
                ctx.closePath();
                ctx.fill();

                const grad = ctx.createLinearGradient(peakX, peakY, peakX, peakY + 200);
                grad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
                grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = grad;
                ctx.fill();
            });
            ctx.restore();
        };

        // --- 4. TREE DRAWING ---
        game.drawTree = (ctx, t) => {
            ctx.save();
            const scale = 0.45 + (t.z * 0.55);
            ctx.globalAlpha = 0.7 + (t.z * 0.3);
            const trunkW = 16 * scale;
            const trunkH = t.height;
            const headR = (t.width / 2) * scale;
            const headY = t.y - trunkH;

            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(-trunkW/2, -trunkH, trunkW, trunkH);
            ctx.beginPath();
            ctx.rect(-trunkW/2, -trunkH, trunkW, trunkH);
            ctx.clip();
            ctx.strokeStyle = "#ffb3c1";
            ctx.lineWidth = 6 * scale;
            for (let j = -trunkH - 50; j < 50; j += 40 * scale) {
                ctx.beginPath();
                ctx.moveTo(-trunkW, j);
                ctx.lineTo(trunkW, j + (25 * scale));
                ctx.stroke();
            }
            ctx.restore();

            ctx.beginPath();
            ctx.arc(t.x, headY, headR, 0, Math.PI * 2);
            ctx.fillStyle = t.color;
            ctx.fill();

            ctx.save();
            ctx.translate(t.x, headY);
            ctx.beginPath();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
            ctx.lineWidth = 2.5 * scale;
            for (let a = 0; a < 15; a += 0.1) {
                const radius = (a / 15) * headR;
                const angle = a * 1.8; 
                ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            }
            ctx.stroke();
            ctx.restore();

            const shine = ctx.createRadialGradient(
                t.x - headR * 0.4, headY - headR * 0.4, headR * 0.05,
                t.x - headR * 0.4, headY - headR * 0.4, headR * 0.8
            );
            shine.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
            shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = shine;
            ctx.beginPath();
            ctx.arc(t.x, headY, headR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        // --- 5. BACKGROUND CASTLE ---
        const bgCastleColor = darkenColor(castleColor, 12);
        game.backgroundCastlePlatforms = castlePlatforms.map(p => ({
            ...p, x: p.x - 75, y: p.y - 30, color: bgCastleColor
        }));
        game.backgroundCastlePlatforms.push({ 
            ...groundPlatform, 
            y: groundPlatform.y - 30, 
            color: bgCastleColor 
        });
    }
}