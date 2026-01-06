import { darkenColor } from './utils.js';
import Tower from './tower.js';

export default class initLevel { 
    constructor(game) {
        // We store the game reference so it can be used in the draw functions
        this.game = game;

        // --- 1. CORE ENVIRONMENT & COLORS ---
        const groundPlatform = { 
            x: 0, 
            y: game.height - 65, 
            width: game.width, 
            height: 320, 
            type: 'ground' 
        };

                           const castlePlatforms = [

                        { 

                            x: game.width - 1050, 

                            y: game.height - 10,

                            //NOTE: To move the hitbox without moving the image, adjust these offset values.

                            //Positive X moves the hitbox right, Positive Y moves the hitbox down.

                            hitboxOffsetX: 100,

                            hitboxOffsetY: -200,

                            width: 150,   // Collision Width

                            height: 20,   // Collision Height (Thin for landing)

                            vWidth: 350,  // Visual Width for drawing

                            vHeight: 250, // Visual Height for drawing

                            type: 'castle' 

                        },

                        { 

                            x: game.width - 475, 

                            y: game.height - 10, 

                            //NOTE: To move the hitbox without moving the image, adjust these offset values.

                            //Positive X moves the hitbox right, Positive Y moves the hitbox down.

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
            { x: 100, y: game.height - 300, width: 200, height: 60 }, 
            { x: 900, y: game.height - 350, width: 200, height: 60 },
            { x: 500, y: game.height - 600, width: 250, height: 65 }, 
            { x: 100, y: game.height - 750, width: 180, height: 55 },
            { x: 800, y: game.height - 850, width: 180, height: 55 }, 
            { x: 450, y: game.height - 1100, width: 200, height: 60 }
        ];

        floatingConfigs.forEach(cfg => {
            game.platforms.push({ ...cfg, type: 'cloud' });
        });

        game.towers = floatingConfigs.map(p => new Tower(game, p.x + (p.width / 2) - 23, p.y - 35.2));
    }
}