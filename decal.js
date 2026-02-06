import { darkenColor } from './utils.js';

export default class Decal {
    constructor() {
        this.active = false;
    }

    init(x, y, size, color, rotation, tower = null) {
        this.x = x;
        this.y = y;
        this.size = size * 5; // Make splats 200% bigger
        this.color = darkenColor(color, Math.random() * 13);
        this.life = 0.5;
        this.rotation = rotation;
        this.tower = tower;
        this.splatParts = [];
        this.active = true;

        const numSplats = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numSplats; i++) {
            this.splatParts.push({
                offsetX: (Math.random() - 0.5) * size * 1.5,
                offsetY: (Math.random() - 0.5) * size * 1.5,
                sizeX: (Math.random() * 1.0 + 0.2) * size * 2.5,
                sizeY: (Math.random() * 1.0 + 0.2) * size * 1.5,
                rotation: Math.random() * Math.PI
            });
        }

        if (tower) {
            this.relativeX = x - tower.x - tower.width / 2;
            this.relativeY = y - tower.y - tower.height / 2;
            this.initialTowerWidth = tower.width;
            this.initialTowerHeight = tower.height;
        }
    }

    reset() {
        this.active = false;
        this.x = 0;
        this.y = 0;
        this.size = 0;
        this.color = null;
        this.life = 0;
        this.rotation = 0;
        this.tower = null;
        this.splatParts = [];
    }

    update(tsf) {
        // This is managed by DecalManager
    }
}
