import Decal from './decal.js';

export default class DecalManager {
    constructor(game) {
        this.game = game;
    }

    addDecal(x, y, size, color, rotation, tower = null) {
        const decal = this.game.decalPool.get();
        if (decal) {
            decal.init(x, y, size, color, rotation, tower);
        }
    }

    update(tsf) {
        if (tsf <= 0) return; // Do not update if time is not advancing

        this.game.decalPool.forEach(decal => {
            decal.life -= (0.0002 + (this.game.threatManager.threatRPM/200000)) * tsf;

            if (decal.tower) {
                const scaleX = decal.tower.width / decal.initialTowerWidth;
                const scaleY = decal.tower.height / decal.initialTowerHeight;
                
                decal.x = decal.tower.x + decal.tower.width / 2 + decal.relativeX * scaleX;
                decal.y = decal.tower.y + decal.tower.height / 2 + decal.relativeY * scaleY;
                decal.size *= scaleX;
                
                decal.initialTowerWidth = decal.tower.width;
                decal.initialTowerHeight = decal.tower.height;
            }

            if (decal.life <= 0) {
                this.game.decalPool.returnToPool(decal);
            }
        });
    }

    draw(ctx) {
        ctx.save();
        this.game.decalPool.forEach(decal => {
            ctx.globalAlpha = decal.life;
            ctx.fillStyle = decal.color;
            decal.splatParts.forEach(part => {
                ctx.beginPath();
                ctx.ellipse(decal.x + part.offsetX, decal.y + part.offsetY, part.sizeX, part.sizeY, part.rotation, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        ctx.globalAlpha = 1.0;
        ctx.restore();
    }
}
