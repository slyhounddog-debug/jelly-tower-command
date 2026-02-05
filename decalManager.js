import { darkenColor } from './utils.js';

export default class DecalManager {
    constructor(game) {
        this.game = game;
        this.decals = [];
    }

    addDecal(x, y, size, color, rotation, tower = null) {
        const decal = {
            x,
            y,
            size: size * 5, // Make splats 200% bigger
            color: darkenColor(color, Math.random() * 13),
            life: 0.5,
            rotation,
            tower,
            splatParts: []
        };

        const numSplats = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numSplats; i++) {
            decal.splatParts.push({
                offsetX: (Math.random() - 0.5) * size * 1.5,
                offsetY: (Math.random() - 0.5) * size * 1.5,
                sizeX: (Math.random() * 1.0 + 0.2) * size * 2.5,
                sizeY: (Math.random() * 1.0 + 0.2) * size * 1.5,
                rotation: Math.random() * Math.PI
            });
        }

        if (tower) {
            decal.relativeX = x - tower.x - tower.width / 2;
            decal.relativeY = y - tower.y - tower.height / 2;
            decal.initialTowerWidth = tower.width;
            decal.initialTowerHeight = tower.height;
        }

        this.decals.push(decal);
    }

    update(tsf) {
        if (tsf <= 0) return; // Do not update if time is not advancing

        for (let i = this.decals.length - 1; i >= 0; i--) {
            const d = this.decals[i];
            d.life -= (0.0002 + (this.game.threatManager.threatRPM/200000)) * tsf;

            if (d.tower) {
                const scaleX = d.tower.width / d.initialTowerWidth;
                const scaleY = d.tower.height / d.initialTowerHeight;
                
                d.x = d.tower.x + d.tower.width / 2 + d.relativeX * scaleX;
                d.y = d.tower.y + d.tower.height / 2 + d.relativeY * scaleY;
                d.size *= scaleX;
                
                d.initialTowerWidth = d.tower.width;
                d.initialTowerHeight = d.tower.height;
            }

            if (d.life <= 0) {
                this.decals.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        this.decals.forEach(d => {
            ctx.globalAlpha = d.life;
            ctx.fillStyle = d.color;
            d.splatParts.forEach(part => {
                ctx.beginPath();
                ctx.ellipse(d.x + part.offsetX, d.y + part.offsetY, part.sizeX, part.sizeY, part.rotation, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
}
