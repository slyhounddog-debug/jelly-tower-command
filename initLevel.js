import { darkenColor } from './utils.js';
import Tower from './tower.js';

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
    }
}