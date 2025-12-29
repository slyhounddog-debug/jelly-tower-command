
import Drop from './drop.js';
export default class LevelingManager {

    constructor(game) {

        this.game = game;

        this.isLevelingUp = false;

        this.upgradeChoices = [];

        this.xpLevels = [

            50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 350, 400, 450, 500, 550, ,600, 650, 700, 750, 800,

            850, 900, 950, 1000, 1075, 1150, 1225, 1300, 1375, 1450, 1525, 1600, 1700, 1800, 1900,

            2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3200, 3400, 3600, 3800, 4000, 4200, 4400, 4600, 4800, 5000, 

            5200, 5400, 5600, 5800, 6000, 6300, 6600, 6900, 7200, 7500, 8000, 8500, 9000, 9500, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000,

        ];

        

                this.upgrades = {

        

                    normal: [

        

                        { name: "Quick Boi", description: "10% increase in movement speed.", icon: "🏃", rarity: "normal" },

        

                        { name: "More Gelatin", description: "10% increase in jump height.", icon: "🔼", rarity: "normal" },

        

                        { name: "Tinkerer", description: "1 more component point.", icon: "🔧", rarity: "normal" },

        

                        { name: "Greed", description: "Cash injection bonus ($500 + 10% of total money).", icon: "💰", rarity: "normal" },

        

                        { name: "Dashier", description: "10% reduced cooldown for dash.", icon: "💨", rarity: "normal" },

        

                        { name: "Long Tongue", description: "10% increase in tongue length.", icon: "👅", rarity: "normal" },

        

                        { name: "Slower Aura Range", description: "Slow aura range increased by 20%.", requires: "Slow Aura", icon: " 범위", rarity: "normal" },

        

                        { name: "Extra Jump", description: "Adds 1 extra jump.", icon: "🤸", rarity: "normal" }

        

                    ],

        

                    rare: [

        

                        { name: "Winged Boots", description: "Glide while holding space in air.", icon: "🕊️", rarity: "rare" },

        

                        { name: "Ice Tongue", description: "Lick slows enemies by 20% for 3 seconds.", icon: "❄️", rarity: "rare" },

        

                        { name: "Wide Collector", description: "20% increase in loot pickup range.", icon: "👐", rarity: "rare" },

        

                        { name: "Marshmallow Landing", description: "Landing creates a damaging shockwave.", icon: "💥", rarity: "rare" },

        

                        { name: "Slow Aura", description: "Creates a slow aura around the character.", icon: "⏳", rarity: "rare" }

        

                    ],

        

                    legendary: [

        

                        { name: "Reflective Coating", description: "Dashing through enemies deals damage.", icon: "🛡️", rarity: "legendary" },

        

                        { name: "Scoop Doubler", description: "33% chance to double ice cream scoop.", icon: "✌️", rarity: "legendary" },

        

                        { name: "Tongue Whirlwind", description: "Dash then lick for a tongue whirlwind.", icon: "🌪️", rarity: "legendary" }

        

                    ]

        

                };

        

            }

        

        

        

            initializePlayer(player) {

        

                player.level = 1;

        

                player.xp = 0;

        

                player.xpForNextLevel = this.xpLevels[0];

        

                player.totalMoneyEarned = 0;

        

                player.componentPoints = 3;

        

                player.upgrades = {};

        

                Object.values(this.upgrades).flat().forEach(u => player.upgrades[u.name] = 0);

        

            }

        

        

        

            grantXpToPlayer(amount) {

        

                if (this.isLevelingUp) return;

        

                const player = this.game.player;

        

                player.xp += amount;

        

                while (player.xp >= player.xpForNextLevel) {

        

                    player.level++;

        

                    player.xp -= player.xpForNextLevel;

        

                    if (player.level - 1 < this.xpLevels.length) {

        

                        player.xpForNextLevel = this.xpLevels[player.level - 1];

        

                    } else {

        

                        player.xpForNextLevel += 200;

        

                    }

        

                                this.isLevelingUp = true;

        

                                this.game.audioManager.playSound('levelUp');

        

                                this.game.audioManager.stopMusic('music');

        

                                this.game.audioManager.playMusic('levelUpMusic');

        

                                this.getUpgradeChoices();

        

                                this.game.levelUpScreen.startLevelUp(this.upgradeChoices);

        

                }

        

            }

        

        

        

            getUpgradeChoices() {

        

                const choices = [];

        

                const allUpgrades = [...this.upgrades.normal, ...this.upgrades.rare, ...this.upgrades.legendary];

        

                const playerUpgrades = this.game.player.upgrades;

        

        

        

                // Filter out upgrades that have unmet requirements or are non-stackable and already acquired

        

                const availableUpgrades = allUpgrades.filter(upgrade => {

        

                    const hasRequirements = !upgrade.requires || playerUpgrades[upgrade.requires] > 0;

        

                    if (!hasRequirements) return false;

        

        

        

                    const isRareOrLegendary = upgrade.rarity === 'rare' || upgrade.rarity === 'legendary';

        

                    const alreadyAcquired = playerUpgrades[upgrade.name] > 0;

        

        

        

                    if (isRareOrLegendary && alreadyAcquired) {

        

                        return false; // Exclude if rare/legendary and already have it

        

                    }

        

        

        

                    return true;

        

                });

        

        

        

                for (let i = 0; i < 3; i++) {

        

                    let chosen;

        

                    let attempts = 0;

        

                    do {

        

                        const rand = Math.random();

        

                        let rarityPool;

        

        

        

                        if (rand < 0.05) { // 5% chance for Legendary

        

                            rarityPool = availableUpgrades.filter(u => u.rarity === 'legendary' && !choices.includes(u));

        

                        } else if (rand < 0.25) { // 20% chance for Rare (0.25 - 0.05)

        

                            rarityPool = availableUpgrades.filter(u => u.rarity === 'rare' && !choices.includes(u));

        

                        } else { // 75% chance for Normal

        

                            rarityPool = availableUpgrades.filter(u => u.rarity === 'normal' && !choices.includes(u));

        

                        }

        

        

        

                        if (rarityPool.length > 0) {

        

                            chosen = rarityPool[Math.floor(Math.random() * rarityPool.length)];

        

                        } else {

        

                            // Fallback to any available upgrade if a specific rarity pool is empty

        

                            const fallbackPool = availableUpgrades.filter(u => !choices.includes(u));

        

                            if (fallbackPool.length > 0) {

        

                                chosen = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];

        

                            }

        

                        }

        

                        attempts++;

        

                    } while (choices.includes(chosen) && attempts < 50); // Prevent infinite loops

        

                    

        

                    if (chosen && !choices.includes(chosen)) {

        

                        choices.push(chosen);

        

                    }

        

                }

        

                

        

                // Ensure we have 3 choices, even if we have to add duplicates (should be rare)

        

                while (choices.length < 3 && availableUpgrades.length > 0) {

        

                    const fallback = availableUpgrades.filter(u => !choices.includes(u));

        

                    if(fallback.length > 0) {

        

                        choices.push(fallback[Math.floor(Math.random() * fallback.length)]);

        

                    } else {

        

                        // If there are truly no more unique options, we might have to stop

        

                        break;

        

                    }

        

                }

        

        

        

                this.upgradeChoices = choices;

        

            }

        

        

        

                addXp(x, y, amount) {

        

        

        

                    // This method is now for creating XP orbs

        

        

        

                    const drop = new Drop(this.game, x, y, 'xp_orb');

        

        

        

                    drop.xpValue = amount;

        

        

        

                    this.game.drops.push(drop);

        

                }

        

        

        

                applyUpgrade(upgrade) {

        

        

        

                    const player = this.game.player;

        

        

        

                    player.upgrades[upgrade.name]++;

        

        

        

                    switch (upgrade.name) {

        

                        case 'Quick Boi':

        

                            player.acceleration = player.baseAcceleration * (1 + player.upgrades['Quick Boi'] * 0.1);

        

                            break;

        

                        case 'More Gelatin':

        

                            player.jumpForce = player.baseJumpForce * (1 + player.upgrades['More Gelatin'] * 0.1);

        

                            player.airJumpForce = player.baseAirJumpForce * (1 + player.upgrades['More Gelatin'] * 0.1);

        

                            break;

        

                        case 'Tinkerer':

        

                            player.componentPoints++;

        

                            break;

        

                        case 'Greed':

        

                            const bonus = 500 + (player.totalMoneyEarned * 0.1);

        

                            this.game.money += bonus;

        

                            break;

        

                        case 'Dashier':

        

                            // The logic is in tryDash, this just increments the upgrade count

        

                            break;

        

                        case 'Long Tongue':

        

                            player.lickRange = player.baseLickRange * (1 + player.upgrades['Long Tongue'] * 0.1);

        

                            break;

        

                        case 'Extra Jump':

        

                            player.maxJumps++;

        

                            break;

        

                        case 'Winged Boots':

        

                            // Logic is in player.js update method

        

                            break;

        

                        case 'Ice Tongue':

        

                            // Logic is in player.js tryLick and draw, and missile.js update

        

                            break;

        

                        case 'Wide Collector':

        

                            player.pickupRange = player.basePickupRange * (1 + player.upgrades['Wide Collector'] * 0.2);

        

                            break;

        

                        case 'Marshmallow Landing':

        

                            // Logic is in player.js update method

        

                            break;

        

                        case 'Slow Aura':

        

                            // Logic is in player.js update method

        

                            break;

        

                        case 'Slower Aura Range':

        

                            player.slowAuraRange = player.baseSlowAuraRange * (1 + player.upgrades['Slower Aura Range'] * 0.2);

        

                            break;

        

                        case 'Reflective Coating':

        

                            // Logic is in player.js tryDash method

        

                            break;

        

                        case 'Scoop Doubler':

        

                            // Logic is in missile.js kill method

        

                            break;

        

                        case 'Tongue Whirlwind':

        

                            // Logic is in player.js tryLick, update, and draw methods

        

                            break;

        

                    }

        

                }

        

            }


