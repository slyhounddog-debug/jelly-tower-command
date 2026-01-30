import Drop from './drop.js';

export default class LevelingManager {
    constructor(game) {
        this.game = game;
        this.isLevelingUp = false;
        this.upgradeChoices = [];

        // --- ADJUST THESE THREE NUMBERS TO CHANGE BALANCING ---
        const totalLevels = 125; 
        const startXP = 100;      // XP needed for Level 2
        const endXP = 200000;    // XP needed for the final level
        const curve = 2.2;       // 1.0 = linear, 2.0 = normal, 3.0+ = very slow start/fast end
        
        this.xpLevels = this.generateXPLevels(totalLevels, startXP, endXP, curve);

        this.upgrades = {
            normal: [
                { name: "Sweet Aura", description: "Enemies within tongue range take 10% more damage.", icon: "💖", rarity: "normal" },
                { name: "Greed", description: "Cash injection bonus ($500 + 2.5% total money earned).", icon: "💰", rarity: "normal" },
                { name: "Sticky Paw", description: "25% increase in loot pickup range.", icon: "👐", rarity: "normal" },
                { name: "Long Tongue", description: "20% increase in tongue length.", icon: "👅", rarity: "normal" },
                { name: "Extra Jump", description: "Adds 1 extra jump.", icon: "🤸", rarity: "normal" },
                { name: "Sugar Shove", description: "Increases knockback by 5.", icon: "👊", rarity: "normal" }
            ],
            rare: [
                { name: "Winged Boots", description: "Glide while holding space in air.", icon: "🕊️", rarity: "rare" },
                { name: "Ice Tongue", description: "Lick slows enemies by 20% for 3 seconds.", icon: "❄️", rarity: "rare" },
                { name: "Jelly Tag", description: "Licked enemies drop another instance of loot.", icon: "🎯", rarity: "rare" },
                { name: "Squishy Butt", description: "Landing creates a damaging shockwave (AOE affected by tongue range)", icon: "💥", rarity: "rare" },
                { name: "Sugar Rush", description: "+20% tower dmg & fire rate for 10 sec on tongue kill.", icon: "🧁", rarity: "rare" }
            ],
            legendary: [
                { name: "Dash Flash", description: "Ouchie dash wave dealing 200% lick damage.", icon: "🛡️", rarity: "legendary" },
                { name: "Twin Scoop", description: "50% chance to double ice cream scoop.", icon: "✌️", rarity: "legendary" },
                { name: "Gumball Volley", description: "Licked enemies spawn 2 gumballs that shoot in random directions.", icon: "🍬", rarity: "legendary" },
                { name: "Lick Mania", description: "Dash then lick for a tongue whirlwind.", icon: "🌪️", rarity: "legendary" }
            ]
        };
    }

    // THE GENERATOR: This creates the numbers for you automatically
    generateXPLevels(num, min, max, exponent) {
        let levels = [];
        for (let i = 0; i < num; i++) {
            let progress = i / (num - 1);
            let curvedProgress = Math.pow(progress, exponent);
            let xp = min + (max - min) * curvedProgress;
            // Rounding to keep the UI clean
            levels.push(Math.round(xp / 10) * 10);
        }
        return levels;
    }

    initializePlayer(player) {
        player.level = 1;
        player.xp = 0;
        player.xpForNextLevel = this.xpLevels[0];
        player.totalMoneyEarned = 0;
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
                player.xpForNextLevel += 1000; // Infinite level scaling
            }

            this.isLevelingUp = true;
            if (this.game.audioManager) {
                this.game.audioManager.setMuffled(true);
                this.game.audioManager.playSound('levelUp');
            }
            this.getUpgradeChoices();
            this.game.levelUpScreen.startLevelUp(this.upgradeChoices);
        }
    }

    getUpgradeChoices() {
        const allUpgrades = [...this.upgrades.normal, ...this.upgrades.rare, ...this.upgrades.legendary];
        const playerUpgrades = this.game.player.upgrades;
        const availableUpgrades = allUpgrades.filter(upgrade => {
            const hasRequirements = !upgrade.requires || playerUpgrades[upgrade.requires] > 0;
            if (!hasRequirements) return false;
            const isUnique = upgrade.rarity === 'rare' || upgrade.rarity === 'legendary';
            if (isUnique && playerUpgrades[upgrade.name] > 0) return false;
            return true;
        });

        const choices = [];
        for (let i = 0; i < 3; i++) {
            let chosen;
            let attempts = 0;
            do {
                const rand = Math.random();
                let rarityPool;
                if (rand < 0.05) rarityPool = availableUpgrades.filter(u => u.rarity === 'legendary');
                else if (rand < 0.25) rarityPool = availableUpgrades.filter(u => u.rarity === 'rare');
                else rarityPool = availableUpgrades.filter(u => u.rarity === 'normal');

                rarityPool = rarityPool.filter(u => !choices.includes(u));

                if (rarityPool.length > 0) {
                    chosen = rarityPool[Math.floor(Math.random() * rarityPool.length)];
                } else {
                    const fallback = availableUpgrades.filter(u => !choices.includes(u));
                    if (fallback.length > 0) chosen = fallback[Math.floor(Math.random() * fallback.length)];
                }
                attempts++;
            } while (choices.includes(chosen) && attempts < 50);

            if (chosen) choices.push(chosen);
        }
        this.upgradeChoices = choices;
    }

    addXp(x, y, amount) {
        const drop = new Drop(this.game, x, y, 'xp_orb');
        drop.xpValue = amount;
        this.game.drops.push(drop);
    }

    applyUpgrade(upgrade) {
        const player = this.game.player;
        player.upgrades[upgrade.name]++;

        switch (upgrade.name) {
            case 'Greed':
                const bonus = Math.ceil(500 + (this.game.totalMoneyEarned * 0.025));
                this.game.money += bonus;
                this.game.totalMoneyEarned += bonus;
                break;
            case 'Extra Jump':
                player.maxJumps++;
                break;
            case 'Sticky Paw':
                player.pickupRange = player.basePickupRange * (1 + player.upgrades['Sticky Paw'] * 0.25);
                break;
        }
    }
}