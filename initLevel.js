import { darkenColor } from './utils.js';
import Tower from './tower.js';

export default class initLevel { 
    constructor(game) {
        // We store the game reference so it can be used in the draw functions
        this.game = game;
        let nextSlotId = 0;

        // --- 1. CORE ENVIRONMENT & COLORS ---
        const groundPlatform = { 
            x: 0, 
            y: game.PLAYABLE_AREA_HEIGHT + 28, // Move ground down by 100px relative to new playable area
            width: game.width, 
            height: 330, 
            hitboxOffsetY: -95, // Move hitbox 100px UP from visual Y
            type: 'ground'
        };

        // Pre-calculate ground slots
        const groundSlots = [];
        const turretWidth = 46; // Assuming auto-turret width
        const turretHeight = 70.4;
        const slotSpacing = 90; // Every 90 pixels
        const startX = groundPlatform.x + turretWidth / 2; // Start half a turret width in
        
        for (let i = startX; i < groundPlatform.x + groundPlatform.width - turretWidth / 2; i += slotSpacing) {
            groundSlots.push({
                id: nextSlotId++,
                x: i,
                y: game.PLAYABLE_AREA_HEIGHT - 142 + (turretHeight / 2), // Adjusted to be on top of visible ground
                isOccupied: false
            });
        }
        groundPlatform.slots = groundSlots; // Assign pre-calculated slots


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
                type: 'castle',
                slots: [
                    { 
                        id: nextSlotId++,
                        x: (game.width - 1100) + (350 / 2), // Center X on vWidth
                        y: (game.PLAYABLE_AREA_HEIGHT - 20) + (20 - 250) + (70.4 / 2) - 30, // Adjust Y to be on top of castle visually
                        isOccupied: false 
                    }
                ]
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
                type: 'castle',
                slots: [
                    { 
                        id: nextSlotId++,
                        x: (game.width - 425) + (350 / 2), 
                        y: (game.PLAYABLE_AREA_HEIGHT - 20) + (20 - 250) + (70.4 / 2) - 30, 
                        isOccupied: false 
                    }
                ]
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
                type: 'castle',
                slots: [
                    { 
                        id: nextSlotId++,
                        x: (game.width - 760) + (350 / 2), 
                        y: (game.PLAYABLE_AREA_HEIGHT + 30) + (20 - 250) + (70.4 / 2) - 30, 
                        isOccupied: false 
                    }
                ]
            },
        ];        // Push platforms directly to the game object
        game.platforms = [...castlePlatforms, groundPlatform];

        // Cloud Platforms logic
        const floatingConfigs = [
            { x: 100, y: game.PLAYABLE_AREA_HEIGHT - 580, width: 280, height: 65 },
            { x: 900, y: game.PLAYABLE_AREA_HEIGHT - 500, width: 290, height: 65 },
            { x: 500, y: game.PLAYABLE_AREA_HEIGHT - 850, width: 300, height: 69 },
            { x: 100, y: game.PLAYABLE_AREA_HEIGHT - 1050, width: 275, height: 60 },
            { x: 800, y: game.PLAYABLE_AREA_HEIGHT - 1150, width: 285, height: 60 },
            { x: 450, y: game.PLAYABLE_AREA_HEIGHT - 1400, width: 295, height: 65 }
        ];

        floatingConfigs.forEach(cfg => {
            const platform = { ...cfg, type: 'cloud', hitboxOffsetY: 15 };
            platform.slots = [
                { id: nextSlotId++, x: platform.x + (platform.width / 4), y: platform.y - 35.2, isOccupied: false },
                { id: nextSlotId++, x: platform.x + (platform.width * 3 / 4), y: platform.y - 35.2, isOccupied: false }
            ];
            game.platforms.push(platform);
        });

        // game.towers = floatingConfigs.map(p => new Tower(game, p.x + (p.width / 2) - 23, p.y - 35.2)); // REMOVED PLAYER CONTROLLED TOWERS
        game.towers = []; // Initialize empty array for auto-turrets
    }
}