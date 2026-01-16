const EMPORIUM_UPGRADE_COSTS = [1, 3, 6, 10, 15, 22, 30, 40, 50, 70];

export default class Emporium {
    constructor(game) {
        this.game = game;
        this.isEmporiumOpen = false;
        this.selectedEmporiumItem = null;
        this.loadEmporiumUpgrades();
        document.getElementById('open-emporium-btn').addEventListener('click', () => this.toggle());
        document.getElementById('emporium-close-btn').addEventListener('click', () => this.toggle());
        document.getElementById('emporium-reset-btn').addEventListener('click', () => this.reset());
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
            },
            {
                id: 'starting_component_points', name: 'Component Capacity', icon: '🧰',
                desc: 'Increases your starting component points.',
                getCost: () => (this.game.emporiumUpgrades.starting_component_points.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.game.emporiumUpgrades.starting_component_points.level],
                getValue: () => `${this.game.emporiumUpgrades.starting_component_points.values[this.game.emporiumUpgrades.starting_component_points.level]}`,
                getNext: () => (this.game.emporiumUpgrades.starting_component_points.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.game.emporiumUpgrades.starting_component_points.values[this.game.emporiumUpgrades.starting_component_points.level + 1]}`,
                getLevel: () => `${this.game.emporiumUpgrades.starting_component_points.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.game.emporiumUpgrades.starting_component_points.level++; }
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
            starting_money: { level: 0, values: [25, 150, 300, 450, 600, 800, 1000, 1500, 2000, 3000, 4000] },
            piggy_cooldown: { level: 0, values: [60, 56, 52, 48, 44, 40, 37, 34, 31, 28, 25] },
            castle_health: { level: 0, values: [100, 110, 120, 130, 140, 160, 180, 200, 220, 250, 300] },
            heart_heal: { level: 0, values: [6, 8, 9, 10, 11, 12, 14, 16, 18, 19, 20] },
            big_coin_value: { level: 0, values: [75, 85, 100, 120, 140, 160, 180, 200, 220, 240, 250] },
            ice_cream_chance: { level: 0, values: [[1.5, 5], [1.75, 6], [2, 7], [2.25, 8], [2.5, 9], [2.75, 10], [3, 11], [3.25, 12], [3.5, 13], [3.75, 14], [4, 15]] },
            enemy_xp: { level: 0, values: [1.0, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0] },
            starting_component_points: { level: 0, values: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
        };
    }
    
    saveEmporiumUpgrades(upgrades) {
        localStorage.setItem('emporiumUpgrades', JSON.stringify(upgrades));
    }

    getEnemyXpMultiplier() {
        return this.game.emporiumUpgrades.enemy_xp.values[this.game.emporiumUpgrades.enemy_xp.level];
    }

    getStartingComponentPoints() {
        return this.game.emporiumUpgrades.starting_component_points.values[this.game.emporiumUpgrades.starting_component_points.level];
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
        if (!this.isEmporiumOpen && !this.game.isGameOver) {
            return;
        }

        this.isEmporiumOpen = !this.isEmporiumOpen;
        this.game.isShopOpen = this.isEmporiumOpen; // The main shop overlay is used for the emporium as well
        document.getElementById('shop-overlay').style.display = this.isEmporiumOpen ? 'flex' : 'none';
        const gamePausedIndicator = document.getElementById('game-paused-indicator');

        if (this.isEmporiumOpen) {
            this.game.shopState = 'emporium';
            document.getElementById('shop-top-bar').style.display = 'none';
            document.getElementById('emporium-top-bar').style.display = 'flex';
            document.getElementById('emporium-buttons').style.display = 'flex';
            this.game.audioManager.stopMusic('gameOverMusic');
            this.game.audioManager.playMusic('shopMusic');
            this.game.isPaused = true; // Always pause when emporium is open
            gamePausedIndicator.style.display = 'block';
            document.getElementById('emporium-scoops-display').innerText = this.game.iceCreamScoops;
            this.renderGrid();
            this.selectItem(this.emporiumItems[0]);
            document.getElementById('emporium-reset-btn').addEventListener('click', () => this.reset());
        } else {
            this.game.shopState = 'shop';
            document.getElementById('shop-top-bar').style.display = 'flex';
            document.getElementById('emporium-top-bar').style.display = 'none';
            document.getElementById('emporium-buttons').style.display = 'none';
            this.game.audioManager.stopMusic('shopMusic');
            if (this.game.isGameOver) {
                this.game.audioManager.playMusic('gameOverMusic');
            }
            // When closing, if game is over, remain paused. Otherwise, unpause.
            if (!this.game.isGameOver) {
                this.game.isPaused = false;
            }
            gamePausedIndicator.style.display = 'none';
        }
    }

    renderGrid() {
        const grid = document.getElementById('shop-grid');
        grid.innerHTML = '';
        this.emporiumItems.forEach(item => {
            const slot = document.createElement('div');
            slot.className = 'upgrade-slot';

            const img = document.createElement('img');
            img.src = 'assets/Images/upgradeslot.png';

            const content = document.createElement('div');
            content.className = 'upgrade-slot-content';
            const cost = item.getCost();
            content.innerHTML = `
                <div class="upgrade-slot-icon">${item.icon}</div>
                <div class="upgrade-slot-name">${item.name}</div>
                <div class="upgrade-slot-cost">${cost === 'MAX' ? 'MAX' : `🍦${cost}`}</div>
                ${item.getLevel ? `<div class="upgrade-slot-level">${item.getLevel()}</div>` : ''}
            `;
            
            slot.appendChild(img);
            slot.appendChild(content);
            slot.onclick = () => this.selectItem(item);
            grid.appendChild(slot);
        });
    }

    selectItem(item) {
        this.selectedEmporiumItem = item;
        this.renderGrid();
        document.getElementById('detail-icon').innerText = item.icon;
        document.getElementById('detail-title').innerText = item.name;
        document.getElementById('detail-desc').innerText = item.desc;
        const cost = item.getCost();

        const buyBtn = document.getElementById('buy-btn');
        const canAfford = typeof cost === 'number' && this.game.iceCreamScoops >= cost;
        const isMaxLevel = cost === 'MAX';

        if (isMaxLevel) {
            buyBtn.src = 'assets/Images/disabledbutton.png';
            buyBtn.style.pointerEvents = 'none';
        } else {
            buyBtn.src = canAfford ? 'assets/Images/shopupgradeup.png' : 'assets/Images/disabledbutton.png';
            buyBtn.style.pointerEvents = canAfford ? 'all' : 'none';
        }
        
        buyBtn.onclick = () => this.buyItem(item);

        let nextValue = item.getNext();
        if (nextValue === "MAX") document.getElementById('detail-stats').innerHTML = `<div class="stat-old">${item.getValue()}</div><div class="arrow">➜</div><div class="stat-new">MAX</div>`;
        else document.getElementById('detail-stats').innerHTML = `<div class="stat-old">${item.getValue()}</div><div class="arrow">➜</div><div class="stat-new">${nextValue}</div>`;

        const levelDisplay = document.getElementById('detail-level-display');
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
            document.getElementById('emporium-scoops-display').innerText = this.game.iceCreamScoops;
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
        document.getElementById('emporium-scoops-display').innerText = this.game.iceCreamScoops;
    }
}
