import { darkenColor } from './utils.js';
import Tower from './tower.js';

export default class initLevel { 
    constructor(game) {
        // We store the game reference so it can be used in the draw functions
        this.game = game;

        // --- 1. CORE ENVIRONMENT & COLORS ---
        const groundPlatform = { 
            x: 0, 
            y: game.height +28, 
            width: game.width, 
            height: 330, 
            hitboxOffsetY: -95, // Move hitbox 100px UP from visual Y
            type: 'ground'
        };

                         const castlePlatforms = [
            { 
                x: game.width - 1100, 
                y: game.height - 10,
                hitboxOffsetX: 100,
                hitboxOffsetY: -200, // MOVED UP 100 (was -200)
                width: 150,   
                height: 20,   
                vWidth: 350,  
                vHeight: 250, 
                type: 'castle' 
            },
            { 
                x: game.width - 425, 
                y: game.height - 10, 
                hitboxOffsetX: 100,
                hitboxOffsetY: -200, // MOVED UP 100 (was -200)
                width: 150, 
                height: 20, 
                vWidth: 350, 
                vHeight: 250, 
                type: 'castle' 
            },
            { 
                x: game.width - 760, 
                y: game.height + 30, 
                hitboxOffsetX: 100,
                hitboxOffsetY: -200, // MOVED UP 100 (was -200)
                width: 150, 
                height: 20, 
                vWidth: 350, 
                vHeight: 250, 
                type: 'castle' 
            },

                    ];        // Push platforms directly to the game object
        game.platforms = [...castlePlatforms, groundPlatform];

        // Cloud Platforms logic
        const floatingConfigs = [
            { x: 100, y: game.height - 399, width: 200, height: 65 }, 
            { x: 900, y: game.height - 430, width: 200, height: 65 },
            { x: 500, y: game.height - 660, width: 250, height: 69 }, 
            { x: 100, y: game.height - 800, width: 180, height: 60 },
            { x: 800, y: game.height - 890, width: 180, height: 60 }, 
            { x: 450, y: game.height - 1140, width: 200, height: 65 }
        ];

        floatingConfigs.forEach(cfg => {
            game.platforms.push({ ...cfg, type: 'cloud', hitboxOffsetY: 15 });
        });

        game.towers = floatingConfigs.map(p => new Tower(game, p.x + (p.width / 2) - 23, p.y - 35.2));
    }
}