const EMPORIUM_UPGRADE_COSTS = [1, 3, 6, 10, 15, 20, 25, 30, 40, 50];

export default class Emporium {
    constructor(game) {
        this.game = game;
        this.isEmporiumOpen = false;
        this.selectedEmporiumItem = null;
        this.loadEmporiumUpgrades();
        this.emporiumItems = [
            { 
                id: 'starting_money', name: 'Initial Funding', icon: '💰', 
                desc: 'Increases the amount of money you start each run with.',
                getCost: () => (this.game.emporiumUpgrades.starting_money.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.starting_money.level],
                getValue: () => `$${this.game.emporiumUpgrades.starting_money.values[this.game.emporiumUpgrades.starting_money.level]}`,
                getNext: () => (this.game.emporiumUpgrades.starting_money.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `$${this.game.emporiumUpgrades.starting_money.values[this.game.emporiumUpgrades.starting_money.level + 1]}`,
                getLevel: () => `${this.game.emporiumUpgrades.starting_money.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.starting_money.level++; }
            },
            { 
                id: 'piggy_cooldown', name: 'Piggy Bank Timer', icon: '🐷', 
                desc: 'Reduces the cooldown for Piggy Bank spawns.',
                getCost: () => (this.game.emporiumUpgrades.piggy_cooldown.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.piggy_cooldown.level],
                getValue: () => `${this.game.emporiumUpgrades.piggy_cooldown.values[this.game.emporiumUpgrades.piggy_cooldown.level]}s`,
                getNext: () => (this.game.emporiumUpgrades.piggy_cooldown.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.game.emporiumUpgrades.piggy_cooldown.values[this.game.emporiumUpgrades.piggy_cooldown.level + 1]}s`,
                getLevel: () => `${this.game.emporiumUpgrades.piggy_cooldown.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.piggy_cooldown.level++; }
            },
            { 
                id: 'castle_health', name: 'Castle Durability', icon: '🏰', 
                desc: 'Increases the starting health of your castle.',
                getCost: () => (this.game.emporiumUpgrades.castle_health.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.castle_health.level],
                getValue: () => `${this.game.emporiumUpgrades.castle_health.values[this.game.emporiumUpgrades.castle_health.level]} HP`,
                getNext: () => (this.game.emporiumUpgrades.castle_health.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.game.emporiumUpgrades.castle_health.values[this.game.emporiumUpgrades.castle_health.level + 1]} HP`,
                getLevel: () => `${this.game.emporiumUpgrades.castle_health.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.castle_health.level++; }
            },
            { 
                id: 'heart_heal', name: 'Heart Heal Amount', icon: '❤️', 
                desc: 'Increases the amount of health restored by hearts.',
                getCost: () => (this.game.emporiumUpgrades.heart_heal.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.heart_heal.level],
                getValue: () => `+${this.game.emporiumUpgrades.heart_heal.values[this.game.emporiumUpgrades.heart_heal.level]} HP`,
                getNext: () => (this.game.emporiumUpgrades.heart_heal.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `+${this.game.emporiumUpgrades.heart_heal.values[this.game.emporiumUpgrades.heart_heal.level + 1]} HP`,
                getLevel: () => `${this.game.emporiumUpgrades.heart_heal.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.heart_heal.level++; }
            },
            { 
                id: 'big_coin_value', name: 'Big Coin Value', icon: '🪙', 
                desc: 'Increases the value of Big Coins.',
                getCost: () => (this.game.emporiumUpgrades.big_coin_value.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.big_coin_value.level],
                getValue: () => `$${this.game.emporiumUpgrades.big_coin_value.values[this.game.emporiumUpgrades.big_coin_value.level]}`,
                getNext: () => (this.game.emporiumUpgrades.big_coin_value.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `$${this.game.emporiumUpgrades.big_coin_value.values[this.game.emporiumUpgrades.big_coin_value.level + 1]}`,
                getLevel: () => `${this.game.emporiumUpgrades.big_coin_value.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.big_coin_value.level++; }
            },
            { 
                id: 'ice_cream_chance', name: 'Ice Cream Scoop Chance', icon: '🍦', 
                desc: 'Increases the drop chance of Ice Cream Scoops from enemies and piggy banks.',
                getCost: () => (this.game.emporiumUpgrades.ice_cream_chance.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.ice_cream_chance.level],
                getValue: () => `${this.game.emporiumUpgrades.ice_cream_chance.values[this.game.emporiumUpgrades.ice_cream_chance.level][0]}% / ${this.game.emporiumUpgrades.ice_cream_chance.values[this.game.emporiumUpgrades.ice_cream_chance.level][1]}%`,
                getNext: () => (this.game.emporiumUpgrades.ice_cream_chance.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.game.emporiumUpgrades.ice_cream_chance.values[this.game.emporiumUpgrades.ice_cream_chance.level + 1][0]}% / ${this.game.emporiumUpgrades.ice_cream_chance.values[this.game.emporiumUpgrades.ice_cream_chance.level + 1][1]}%`,
                getLevel: () => `${this.game.emporiumUpgrades.ice_cream_chance.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.ice_cream_chance.level++; }
            },
            { 
                id: 'enemy_xp', name: 'XP Boost', icon: '✨',
                desc: 'Increases XP gained from enemies.',
                getCost: () => (this.game.emporiumUpgrades.enemy_xp.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.enemy_xp.level],
                getValue: () => `x${this.game.emporiumUpgrades.enemy_xp.values[this.game.emporiumUpgrades.enemy_xp.level].toFixed(1)}`,
                getNext: () => (this.game.emporiumUpgrades.enemy_xp.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `x${this.game.emporiumUpgrades.enemy_xp.values[this.game.emporiumUpgrades.enemy_xp.level + 1].toFixed(1)}`,
                getLevel: () => `${this.game.emporiumUpgrades.enemy_xp.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.enemy_xp.level++; }
            }
        ];
    }

    loadEmporiumUpgrades() {
        const savedUpgrades = localStorage.getItem('emporiumUpgrades');
        if (savedUpgrades) {
            this.game.emporiumUpgrades = JSON.parse(savedUpgrades);
            // Ensure all expected upgrades are present, add if not
            const initialUpgrades = this.getInitialEmporiumUpgrades();
            for (const key in initialUpgrades) {
                if (!this.game.emporiumUpgrades.hasOwnProperty(key)) {
                    this.game.emporiumUpgrades[key] = initialUpgrades[key];
                }
            }
        } else {
            this.game.emporiumUpgrades = this.getInitialEmporiumUpgrades();
        }
    }

    getInitialEmporiumUpgrades() {
        return {
            starting_money: { level: 0, values: [25, 150, 300, 450, 600, 800, 1000, 1500, 2000, 3000] },
            piggy_cooldown: { level: 0, values: [60, 55, 50, 45, 40, 35, 30] },
            castle_health: { level: 0, values: [100, 110, 120, 130, 140, 160, 180, 200, 220, 250] },
            heart_heal: { level: 0, values: [10, 12, 14, 16, 18, 20, 22, 24, 26, 30] },
            big_coin_value: { level: 0, values: [100, 120, 140, 160, 180, 200, 220, 240, 260, 300] },
            ice_cream_chance: { level: 0, values: [[1.5, 10], [2.5, 15], [3.5, 20], [4.5, 25], [5.5, 30], [6.5, 35], [7.5, 40], [8.5, 50]] },
            enemy_xp: { level: 0, values: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0] },
        };
    }
    
    saveEmporiumUpgrades(upgrades) {
        localStorage.setItem('emporiumUpgrades', JSON.stringify(upgrades));
    }

    getEnemyXpMultiplier() {
        return this.game.emporiumUpgrades.enemy_xp.values[this.game.emporiumUpgrades.enemy_xp.level];
    }

    getStartingMoney() {
        return this.game.emporiumUpgrades.starting_money.values[this.game.emporiumUpgrades.starting_money.level];
    }

    getStartingHealth() {
        return this.game.emporiumUpgrades.castle_health.values[this.game.emporiumUpgrades.castle_health.level];
    }

    getCastleMaxHealth() {
        return this.game.emporiumUpgrades.castle_health.values[this.game.emporiumUpgrades.castle_health.level];
    }

    getBigCoinValue() {
        return this.game.emporiumUpgrades.big_coin_value.values[this.game.emporiumUpgrades.big_coin_value.level];
    }

    getHeartHeal() {
        return this.game.emporiumUpgrades.heart_heal.values[this.game.emporiumUpgrades.heart_heal.level];
    }

    getPiggyCooldown() {
        return this.game.emporiumUpgrades.piggy_cooldown.values[this.game.emporiumUpgrades.piggy_cooldown.level];
    }

    getIceCreamChance() {
        return this.game.emporiumUpgrades.ice_cream_chance.values[this.game.emporiumUpgrades.ice_cream_chance.level];
    }

    toggle() {
        // Only allow opening if game is over
        if (!this.isEmporiumOpen && !this.game.isGameOver) {
            return;
        }

        this.isEmporiumOpen = !this.isEmporiumOpen;
        const gamePausedIndicator = document.getElementById('game-paused-indicator');

        if (this.isEmporiumOpen) {
            this.game.audioManager.stopMusic('gameOverMusic');
            this.game.audioManager.playMusic('shopMusic');
            this.game.isPaused = true; // Always pause when emporium is open
            gamePausedIndicator.style.display = 'flex';
            document.getElementById('emporium-scoops-display').innerText = '🍦' + this.game.iceCreamScoops;
            this.renderGrid();
            document.getElementById('emporium-overlay').style.display = 'flex';
        } else {
            this.game.audioManager.stopMusic('shopMusic');
            if (this.game.isGameOver) {
                this.game.audioManager.playMusic('gameOverMusic');
            }
            // When closing, if game is over, remain paused. Otherwise, unpause.
            if (!this.game.isGameOver) {
                this.game.isPaused = false;
            }
            gamePausedIndicator.style.display = 'none';
            document.getElementById('emporium-overlay').style.display = 'none';
        }
    }

    renderGrid() {
        document.getElementById('emporium-grid').innerHTML = '';
        this.emporiumItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            if (this.selectedEmporiumItem === item) div.classList.add('selected');
            const cost = item.getCost();
            div.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class.shop-item-name">${item.name}</div>
                <div class="shop-item-cost">${cost === 'MAX' ? 'MAX' : `🍦${cost}`}</div>
                ${item.getLevel ? `<div class="shop-item-count">${item.getLevel()}</div>` : ''}
            `;
            div.onclick = () => this.selectItem(item);
            document.getElementById('emporium-grid').appendChild(div);
        });
    }

    selectItem(item) {
        this.selectedEmporiumItem = item;
        this.renderGrid();
        document.getElementById('emporium-detail-icon').innerText = item.icon;
        document.getElementById('emporium-detail-title').innerText = item.name;
        document.getElementById('emporium-detail-desc').innerText = item.desc;
        const cost = item.getCost();

        document.getElementById('emporium-buy-btn').innerText = cost === 'MAX' ? 'MAXED' : `UPGRADE (🍦${cost})`;
        document.getElementById('emporium-buy-btn').disabled = !((typeof cost === 'number' && this.game.iceCreamScoops >= cost));
        document.getElementById('emporium-buy-btn').onclick = () => this.buyItem(item);

        let nextValue = item.getNext();
        if (nextValue === "MAX") document.getElementById('emporium-detail-stats').innerHTML = `<div class="stat-old">${item.getValue()}</div><div class="arrow">➜</div><div class="stat-new">MAX</div>`;
        else document.getElementById('emporium-detail-stats').innerHTML = `<div class="stat-old">${item.getValue()}</div><div class="arrow">➜</div><div class="stat-new">${nextValue}</div>`;

        const levelDisplay = document.getElementById('emporium-detail-level-display');
        if (item.getLevel) {
            levelDisplay.innerText = `Level: ${item.getLevel()}`;
        } else {
            levelDisplay.innerText = '';
        }
    }

    buyItem(item) {
        const cost = item.getCost();
        if (typeof cost === 'number' && this.game.iceCreamScoops >= cost) {
            this.game.audioManager.playSound('purchase');
            this.game.iceCreamScoops -= cost;
            item.action();
            this.selectItem(item);
            document.getElementById('emporium-scoops-display').innerText = '🍦' + this.game.iceCreamScoops;
            this.saveEmporiumUpgrades(this.game.emporiumUpgrades);
            localStorage.setItem('iceCreamScoops', this.game.iceCreamScoops);
        }
    }

    reset() {
        this.game.audioManager.playSound('reset');
        let refundedScoops = 0;
        for (const key in this.game.emporiumUpgrades) {
            const upgrade = this.game.emporiumUpgrades[key];
            const costs = EMPORIUM_UPGRADE_COSTS;
            for (let i = 0; i < upgrade.level; i++) {
                refundedScoops += costs[i];
            }
        }

        this.game.iceCreamScoops += refundedScoops;
        this.game.emporiumUpgrades = this.getInitialEmporiumUpgrades();

        this.saveEmporiumUpgrades(this.game.emporiumUpgrades);
        localStorage.setItem('iceCreamScoops', this.game.iceCreamScoops);

        // Refresh the emporium display
        this.renderGrid();
        if (this.selectedEmporiumItem) {
            this.selectItem(this.selectedEmporiumItem);
        }
        document.getElementById('emporium-scoops-display').innerText = '🍦' + this.game.iceCreamScoops;
    }
}
