import { darkenColor } from './utils.js';
import Tower from './tower.js';

export default class initLevel { 
    constructor(game) {
        // We store the game reference so it can be used in the draw functions
        this.game = game;

        // --- 1. CORE ENVIRONMENT & COLORS ---
        const groundPlatform = { 
            x: 0, 
            y: game.PLAYABLE_AREA_HEIGHT + 28, // Move ground down by 100px relative to new playable area
            width: game.width, 
            height: 330, 
            hitboxOffsetY: -95, // Move hitbox 100px UP from visual Y
            type: 'ground'
        };

                         const castlePlatforms = [
            { 
                x: game.width - 1100, 
                y: game.PLAYABLE_AREA_HEIGHT - 20, // Move castle up by 90px
                hitboxOffsetX: 100,
                hitboxOffsetY: -200, 
                width: 150,   
                height: 20,   
                vWidth: 350,  
                vHeight: 250, 
                type: 'castle' 
            },
            { 
                x: game.width - 425, 
                y: game.PLAYABLE_AREA_HEIGHT - 20, // Move castle up by 90px
                hitboxOffsetX: 100,
                hitboxOffsetY: -200, 
                width: 150, 
                height: 20, 
                vWidth: 350, 
                vHeight: 250, 
                type: 'castle' 
            },
            { 
                x: game.width - 760,
                y: game.PLAYABLE_AREA_HEIGHT + 30, // Move castle up by 90px
                hitboxOffsetX: 100,
                hitboxOffsetY: -200, 
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
            { x: 100, y: game.PLAYABLE_AREA_HEIGHT - 449 + 90, width: 200, height: 65 }, // Lowest Y (highest on screen) + 50px
            { x: 900, y: game.PLAYABLE_AREA_HEIGHT - 505 + 80, width: 200, height: 65 }, // + 75px
            { x: 500, y: game.PLAYABLE_AREA_HEIGHT - 760 + 70, width: 250, height: 69 }, // + 100px
            { x: 100, y: game.PLAYABLE_AREA_HEIGHT - 925 + 60, width: 180, height: 60 }, // + 125px
            { x: 800, y: game.PLAYABLE_AREA_HEIGHT - 1040 + 50, width: 180, height: 60 }, // + 150px
            { x: 450, y: game.PLAYABLE_AREA_HEIGHT - 1340 + 40, width: 200, height: 65 } // Highest Y (lowest on screen) + 200px
        ];

        floatingConfigs.forEach(cfg => {
            game.platforms.push({ ...cfg, type: 'cloud', hitboxOffsetY: 15 });
        });

        game.towers = floatingConfigs.map(p => new Tower(game, p.x + (p.width / 2) - 23, p.y - 35.2));
    }
}