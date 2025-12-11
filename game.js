import Player from './player.js?v=2';
import Shield from './shield.js';
import Tower from './tower.js';
import Missile from './missile.js?v=25';
import Cloud from './cloud.js?v=25';
import ThreatManager from './threatManager.js';
import { ScreenShake, darkenColor, lightenColor } from './utils.js?v=25';
import Drop from './drop.js?v=25';
import Particle from './particle.js';
import FloatingText from './floatingText.js?v=25';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.PASTEL_COLORS = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'];
        this.DAMAGE_TIERS = [10, 15, 20, 25, 35, 45, 55, 70, 85, 100, 118, 137, 160, 180, 200, 250];
        this.UPGRADE_COSTS = [75, 150, 250, 400, 700, 1000, 1250, 1500, 1800, 2150, 2500, 3000, 4000, 5000, 7500];
        this.SLAP_DAMAGE_TIERS = [10, 20, 30, 40, 50];
        this.SLAP_KNOCKBACK_TIERS = [75, 150, 250, 400, 600];
        this.SHIELD_COSTS = [75, 150, 200, 300, 400];
        this.PIGGY_TIERS = [
            { bonus: 0.10, mult: 2 },
            { bonus: 0.12, mult: 3 },
            { bonus: 0.15, mult: 4 },
            { bonus: 0.17, mult: 5 },
            { bonus: 0.20, mult: 6 }
        ];

        this.lastTime = 0;
        this.targetFrameTime = 1000 / 60;

        this.money = 0;
        this.castleHealth = 100;
        this.isPaused = true;
        this.isShopOpen = false;
        this.isGameOver = false;
        this.gameTime = 0;
        this.placementMode = null;
        this.sellMode = null;
        this.placementItemCost = 0;
        this.shopOpenedFirstTime = false;
        this.shopReminderShown = false;

       this.totalMoneyEarned = 0;
        this.enemiesKilled = 0;
        this.wasRunningBeforeHidden = false; // Tracks if game was running before tab switch
        this.shotsFired = 0;
        this.shotsHit = 0;

        this.piggyTimer = 0;
        this.piggyBankSeen = false;

        this.stats = {
            damageLvl: 0,
            fireRateLvl: 0,
            rangeLvl: 0,
            shieldLvl: 0,
            luckLvl: 0,
            slapLvl: 0,
            piggyLvl: 0,
            baseDamage: 10,
            baseFireRate: 60,
            baseRange: 300,
            baseShieldHp: 15,
            turretsBought: 0,
            maxTurrets: 3,
            game: this,
            get damage() { return this.game.DAMAGE_TIERS[Math.min(this.damageLvl, this.game.DAMAGE_TIERS.length - 1)]; },
            getNextDamage() { return (this.damageLvl >= this.game.DAMAGE_TIERS.length - 1) ? "MAX" : this.game.DAMAGE_TIERS[this.damageLvl + 1]; },
            get fireRate() { return Math.max(5, Math.floor(this.baseFireRate * Math.pow(0.85, this.fireRateLvl))); },
            get projectileSpeed() { return 3 + 1.2 * this.fireRateLvl; },
            getNextProjectileSpeed() { return 3 + 1.2 * (this.fireRateLvl + 1); },
            get range() { return this.baseRange + (this.rangeLvl * 50); },
            get shieldMaxHp() { return this.baseShieldHp + (this.shieldLvl * 5); },
            getNextShieldHp() { return this.shieldMaxHp + 5; },
            get luckCoin() { return Math.min(55, 7 + this.luckLvl * 3); },
            get luckHeart() { return Math.min(45, 3 + (this.luckLvl * 2)); },
            get slapDamage() { return this.game.SLAP_DAMAGE_TIERS[Math.min(this.slapLvl, this.game.SLAP_DAMAGE_TIERS.length - 1)]; },
            get slapKnockback() { return this.game.SLAP_KNOCKBACK_TIERS[Math.min(this.slapLvl, this.game.SLAP_KNOCKBACK_TIERS.length - 1)]; },
            get piggyStats() { return this.game.PIGGY_TIERS[Math.min(this.piggyLvl, this.game.PIGGY_TIERS.length - 1)]; }
        };

        this.shopItems = [
            { id: 'dmg', name: 'Piercing Ammo', icon: '💥', desc: 'Increases damage & pierce capacity.', type: 'upgrade', 
              getCost: () => (this.stats.damageLvl >= this.DAMAGE_TIERS.length - 1) ? 'MAX' : this.UPGRADE_COSTS[this.stats.damageLvl], 
              getValue: () => this.stats.damage, 
              getNext: () => this.stats.getNextDamage(),
              getLevel: () => `${this.stats.damageLvl}/${this.DAMAGE_TIERS.length}`,
              action: () => { if (this.stats.damageLvl < this.DAMAGE_TIERS.length - 1) this.stats.damageLvl++; }
            },
            { id: 'rate', name: 'Reload Speed', icon: '⚡', desc: 'Increases fire rate and projectile speed by 1.2.', type: 'upgrade', 
              getCost: () => this.UPGRADE_COSTS[this.stats.fireRateLvl] || 'MAX',
              getValue: () => `${(60/this.stats.fireRate).toFixed(1)}/s | ${this.stats.projectileSpeed.toFixed(1)} pps`, 
              getNext: () => `${(60/Math.max(5, Math.floor(this.stats.baseFireRate * Math.pow(0.85, this.stats.fireRateLvl + 1)))).toFixed(1)}/s | ${this.stats.getNextProjectileSpeed().toFixed(1)} pps`,
              getLevel: () => `${this.stats.fireRateLvl}/15`,
              action: () => this.stats.fireRateLvl++ 
            },
            { id: 'range', name: 'Scope', icon: '🔭', desc: 'Increases firing range.', type: 'upgrade', 
              getCost: () => this.UPGRADE_COSTS[this.stats.rangeLvl] || 'MAX', 
              getValue: () => this.stats.range + 'px', 
              getNext: () => (this.stats.range + 50) + 'px',
              getLevel: () => `${this.stats.rangeLvl}/15`, 
              action: () => this.stats.rangeLvl++ 
            },
            { id: 'shield_tech', name: 'Barrier HP', icon: '🛡️', desc: 'Increases Shield HP. Regen 1% HP/s.', type: 'upgrade', 
              getCost: () => this.UPGRADE_COSTS[this.stats.shieldLvl] || 'MAX', 
              getValue: () => this.stats.shieldMaxHp + ' HP', 
              getNext: () => (this.stats.getNextShieldHp()) + ' HP', 
              getLevel: () => `${this.stats.shieldLvl}/15`,
              action: () => this.stats.shieldLvl++ 
            },
            { id: 'luck', name: 'Luck', icon: '🍀', desc: 'Increases drop chance. Heart heals 10 and Big Coins give $100.', type: 'upgrade', 
              getCost: () => this.UPGRADE_COSTS[this.stats.luckLvl] || 'MAX', 
              getValue: () => `❤️${this.stats.luckHeart}% 💰${this.stats.luckCoin}%`, 
              getNext: () => `❤️${Math.min(45, 3 + (this.stats.luckLvl+1)*2)}% 💰${Math.min(55, 7+ (this.stats.luckLvl+1)*3)}%`, 
              getLevel: () => `${this.stats.luckLvl}/15`,
              action: () => this.stats.luckLvl++ 
            },
            { id: 'slap_dmg', name: 'Slap Strength', icon: '✋', 
              desc: `Increases slap damage and knockback.`, type: 'upgrade', 
              getCost: () => (this.stats.slapLvl >= this.SLAP_DAMAGE_TIERS.length - 1) ? 'MAX' : this.UPGRADE_COSTS[this.stats.slapLvl], 
              getValue: () => `D:${this.stats.slapDamage} K:${this.stats.slapKnockback}`, 
              getNext: () => (this.stats.slapLvl >= this.SLAP_DAMAGE_TIERS.length - 1) ? "MAX" : `D:${this.SLAP_DAMAGE_TIERS[this.stats.slapLvl+1]} K:${this.SLAP_KNOCKBACK_TIERS[this.stats.slapLvl+1]}`,
              getLevel: () => `${this.stats.slapLvl}/${this.SLAP_DAMAGE_TIERS.length}`,
              action: () => { if (this.stats.slapLvl < this.SLAP_DAMAGE_TIERS.length - 1) this.stats.slapLvl++; } 
            },
            { id: 'piggy_bonus', name: 'Piggy Bank Bonus', icon: '🐷', 
              desc: 'Increases instant cash bonus % and kill count multiplier.', type: 'upgrade',
              getCost: () => (this.stats.piggyLvl >= this.PIGGY_TIERS.length - 1) ? 'MAX' : this.UPGRADE_COSTS[this.stats.piggyLvl],
              getValue: () => `${(this.stats.piggyStats.bonus*100).toFixed(0)}% | ${this.stats.piggyStats.mult}x`,
              getNext: () => {
                 if (this.stats.piggyLvl >= this.PIGGY_TIERS.length - 1) return "MAX";
                 const next = this.PIGGY_TIERS[this.stats.piggyLvl+1];
                 return `${(next.bonus*100).toFixed(0)}% | ${next.mult}x`;
              },
              getLevel: () => `${this.stats.piggyLvl}/${this.PIGGY_TIERS.length}`,
              action: () => { if (this.stats.piggyLvl < this.PIGGY_TIERS.length - 1) this.stats.piggyLvl++; }
            },
            { id: 'buy_turret', name: 'Auto-Turret', icon: '🤖', desc: 'Placeable defense.', type: 'item',
              getCost: () => { const costs = [1000, 3000, 5000]; return this.stats.turretsBought < 3 ? costs[this.stats.turretsBought] : 'MAX'; }, 
              getValue: () => `${this.stats.turretsBought}/3 Owned`, 
              getNext: () => "Place on Map", 
              getLevel: () => `${this.stats.turretsBought}/3`,
              action: () => { } 
            },
            { id: 'buy_shield', name: 'Barrier', icon: '🧱', desc: 'Placeable regenerative shield. Max 5.', type: 'item',
              getCost: () => this.shields.length < 5 ? this.SHIELD_COSTS[Math.min(this.shields.length, 4)] : 'MAX', 
              getValue: () => `${this.shields.length}/5 Active`, 
              getNext: () => "Place on Map", 
              getLevel: () => `${this.shields.length}/5`,
              action: () => { }
            },
            { id: 'sell_item', name: 'Sell Item', icon: '♻️', desc: 'Sell a placed turret or barrier for 90% of its cost.', type: 'sell',
              getCost: () => (this.stats.turretsBought > 0 || this.shields.length > 0) ? 'SELECT' : 'N/A',
              getValue: () => `${this.stats.turretsBought + this.shields.length} Items`,
              getNext: () => "Select on Map",
              getLevel: () => ``,
              action: () => {}
            }
        ];
        this.selectedShopItem = this.shopItems[0];

        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };

        this.platforms = [];
        this.towers = [];
        this.missiles = [];
        this.projectiles = [];
        this.particles = [];
        this.drops = [];
        this.shields = [];
        this.clouds = [];
        this.floatingTexts = [];
        this.damageSpots = [];
        this.currentRPM = 5.5;
        this.backgroundCastlePlatforms = [];
        this.trees = [];

        this.player = new Player(this);
        this.threatManager = new ThreatManager(this);
        this.screenShake = ScreenShake;
        
        this.initListeners();
        this.resetGame();
    }

    initListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const k = e.key.toLowerCase();
            this.keys[k] = true;
            if (k === 'f') this.toggleShop();
            if (k === 'escape') {
                if (document.getElementById('guide-modal').style.display === 'block') document.getElementById('guide-modal').style.display = 'none';
                else if (document.getElementById('piggy-modal').style.display === 'block') this.closePiggyModal();
                else if (this.placementMode) this.cancelPlacement();
                else if (this.sellMode) this.cancelSell();
                else if (this.isShopOpen) this.toggleShop();
            }
            if (k === 'a') {
                if (Date.now() - this.player.lastAPress < 300) {
                    this.player.tryDash(-1);
                }
                this.player.lastAPress = Date.now();
            }
            if (k === 'd') {
                if (Date.now() - this.player.lastDPress < 300) {
                    this.player.tryDash(1);
                }
                this.player.lastDPress = Date.now();
            }
        });
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        });
        this.canvas.addEventListener('mousedown', () => {
            this.mouse.isDown = true;
            if (this.placementMode) this.tryPlaceItem();
            else if (!this.isShopOpen && !this.player.isControlling) this.player.trySlap();
        });
        this.canvas.addEventListener('mouseup', () => this.mouse.isDown = false);
        document.getElementById('start-game-btn').addEventListener('click', () => {
            document.getElementById('start-game-modal').style.display = 'none';
            this.isPaused = false;
        });

        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());
        
        document.getElementById('help-btn').addEventListener('click', () => document.getElementById('guide-modal').style.display = 'block');

        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    closePiggyModal() {
        document.getElementById('piggy-modal').style.display = 'none';
        this.isPaused = false;
    }

    closeShopReminder() {
        document.getElementById('shop-reminder').style.display = 'none';
        this.isPaused = false;
    }
    handleVisibilityChange() {
        // document.hidden is true when the tab is not visible/active
        if (document.hidden) {
            // Only flag and pause if the game was currently running
            if (!this.isPaused) {
                this.isPaused = true;
                this.wasRunningBeforeHidden = true; 
            }
        } else {
            // The tab is now visible. If the game was paused by us, resume it.
            if (this.wasRunningBeforeHidden) {
                this.isPaused = false;
                this.wasRunningBeforeHidden = false;

                // CRUCIAL: Reset lastTime to prevent a huge deltaTime calculation 
                // that would launch the player off-screen.
                this.lastTime = 0; 
            }
        }
    }
    
    resetGame() {
        this.money = 25; this.totalMoneyEarned = 0; this.enemiesKilled = 0; this.shotsFired = 0; this.shotsHit = 0;
        this.castleHealth = 100; this.gameTime = 0; this.isGameOver = false; this.currentRPM = 5.5;
        this.piggyTimer = 0; this.piggyBankSeen = false;
        this.shopOpenedFirstTime = false;
        this.shopReminderShown = false;

        this.stats.damageLvl = 0; this.stats.fireRateLvl = 0; this.stats.rangeLvl = 0;
        this.stats.shieldLvl = 0; this.stats.luckLvl = 0; this.stats.slapLvl = 0; this.stats.piggyLvl = 0;
        this.stats.turretsBought = 0;

        this.missiles = []; this.projectiles = []; this.particles = []; this.drops = []; this.shields = []; this.damageSpots = []; this.floatingTexts = [];
        this.player.reset();
        this.lastTime = 0;
        document.getElementById('restart-btn').style.display = 'none';
        document.getElementById('game-over-stats').style.display = 'none';
        this.initLevel();
        this.threatManager.reset();

        document.getElementById('rpm-display').innerText = "5.5";
        document.getElementById('threat-level').innerText = (30 + this.currentRPM + (this.enemiesKilled * 0.1)).toFixed(0);
    }

    initLevel() {
        const castleColor = '#f8c8dc'; // Pastel Pink
        const groundPlatform = { x: 0, y: this.height - 60, width: this.width, height: 60, color: castleColor, type: 'ground' };
        const castlePlatforms = [
            { x: 50, y: this.height - 160, width: 100, height: 160, color: castleColor, type: 'castle' },
            { x: this.width - 150, y: this.height - 160, width: 100, height: 160, color: castleColor, type: 'castle' },
            { x: this.width / 2 - 100, y: this.height - 120, width: 200, height: 120, color: castleColor, type: 'castle' }
        ];

        this.platforms = [
            ...castlePlatforms,
            groundPlatform,
        ];

        const floatingPlatforms = [
            { x: 100, y: this.height - 250, width: 200 }, { x: 900, y: this.height - 350, width: 200 },
            { x: 500, y: this.height - 550, width: 250 }, { x: 100, y: this.height - 750, width: 180 },
            { x: 800, y: this.height - 850, width: 180 }, { x: 450, y: this.height - 1100, width: 200 }
        ];

        floatingPlatforms.forEach(cfg => {
            const platform = { ...cfg, height: 30, type: 'cloud', circles: [] };
            const baseNumCircles = Math.ceil(platform.width / 40 * 1.5);
            const minRadius = 23.4375;
            const maxRadius = 43.75;

            for (let i = 0; i < baseNumCircles; i++) {
                const xOffset = (i / (baseNumCircles - 1)) * platform.width;
                const mainCircleRadius = minRadius + Math.random() * (maxRadius - minRadius);
                platform.circles.push({
                    dx: xOffset + (Math.random() - 0.5) * 10,
                    dy: platform.height / 2 + (Math.random() - 0.5) * 5,
                    radius: mainCircleRadius,
                    hasGlare: Math.random() < 0.23
                });
                if (Math.random() < 0.7) {
                    const fillerRadius = minRadius * 0.75 + Math.random() * (minRadius * 0.75);
                    platform.circles.push({
                        dx: xOffset + (Math.random() - 0.5) * 20,
                        dy: platform.height / 2 + (Math.random() - 0.5) * 15,
                        radius: fillerRadius,
                        hasGlare: Math.random() < 0.23
                    });
                }
            }
            this.platforms.push(platform);
        });

        this.towers = [
            new Tower(this, 172.4, floatingPlatforms[0].y - 55.2), new Tower(this, 972.4, floatingPlatforms[1].y - 55.2),
            new Tower(this, 597.4, floatingPlatforms[2].y - 55.2), new Tower(this, 172.4, floatingPlatforms[3].y - 55.2),
            new Tower(this, 872.4, floatingPlatforms[4].y - 55.2), new Tower(this, 522.4, floatingPlatforms[5].y - 55.2)
        ];

        this.clouds = [];
        for (let i = 0; i < 4; i++) {
            this.clouds.push(new Cloud(this));
        }

        // Background Castle
        this.backgroundCastlePlatforms = [];
        const bgCastleColor = darkenColor(castleColor, 15);
        const bgCastleOffsetX = -75;
        const bgCastleOffsetY = -38;
        castlePlatforms.forEach(p => {
            this.backgroundCastlePlatforms.push({
                x: p.x + bgCastleOffsetX,
                y: p.y + bgCastleOffsetY,
                width: p.width,
                height: p.height,
                color: bgCastleColor,
                type: 'castle'
            });
        });
        const bgGroundPlatform = { x: groundPlatform.x, y: groundPlatform.y + bgCastleOffsetY, width: groundPlatform.width, height: groundPlatform.height, color: bgCastleColor, type: 'ground' };
        this.backgroundCastlePlatforms.push(bgGroundPlatform);

        // Background Trees
        this.trees = [];
        const treeColors = ['#9bf6ff', '#a0c4ff'];
        const sectionWidth = this.width / 8;
        for (let i = 0; i < 8; i++) {
            const z = Math.random();
            const width = (z * 150) + 75;
            const height = width * (2.5 + Math.random() * 2);
            this.trees.push({
                x: (sectionWidth * i) + (Math.random() * sectionWidth),
                y: this.height,
                z: z,
                width: width,
                height: height,
                color: treeColors[i % 2]
            });
        }
    }

    killMissile(m, index) {
        this.missiles.splice(index, 1);
        const pStats = this.stats.piggyStats;
        const count = (m.type === 'piggy') ? pStats.mult : 1;
        if (m.type === 'piggy') {
            const bonus = Math.floor(this.money * pStats.bonus);
            this.money += bonus;
            this.totalMoneyEarned += bonus;
            document.getElementById('notification').innerText = `PIGGY SMASHED! +$${bonus}`;
            document.getElementById('notification').style.opacity = 1;
            setTimeout(() => document.getElementById('notification').style.opacity = 0, 2000);
        }
        for (let c = 0; c < count; c++) {
            this.enemiesKilled++;
            this.drops.push(new Drop(this, m.x, m.y, 'coin'));
            if (Math.random() * 100 < this.stats.luckHeart) this.drops.push(new Drop(this, m.x, m.y, 'heart'));
            if (Math.random() * 100 < this.stats.luckCoin) this.drops.push(new Drop(this, m.x, m.y, 'lucky_coin'));
        }
        for (let k = 0; k < 20; k++) this.particles.push(new Particle(m.x, m.y, (m.type === 'piggy' ? '#ff69b4' : m.color), 'smoke'));
    }

    toggleShop() {
        if (this.placementMode) { this.cancelPlacement(); return; }
        if (this.isGameOver) return;
        this.isShopOpen = !this.isShopOpen; this.isPaused = this.isShopOpen;
        if (this.isShopOpen) this.shopOpenedFirstTime = true;
        document.getElementById('shop-overlay').style.display = this.isShopOpen ? 'flex' : 'none';
        if (this.isShopOpen) { 
            document.getElementById('shop-money-display').innerText = this.money; 
            this.renderShopGrid(); 
            this.selectShopItem(this.shopItems[0]); 
        }
    }

    renderShopGrid() {
        document.getElementById('shop-grid').innerHTML = '';
        this.shopItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            if (this.selectedShopItem === item) div.classList.add('selected');
            const cost = item.getCost();
            div.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-cost">${cost === 'MAX' ? 'MAX' : '$' + cost}</div>
                ${item.getLevel ? `<div class="shop-item-count">${item.getLevel()}</div>` : ''}
            `;
            div.onclick = () => this.selectShopItem(item);
            document.getElementById('shop-grid').appendChild(div);
        });
    }

    selectShopItem(item) {
        this.selectedShopItem = item;
        this.renderShopGrid();
        document.getElementById('detail-icon').innerText = item.icon;
        document.getElementById('detail-title').innerText = item.name;
        document.getElementById('detail-desc').innerText = item.desc;
        const cost = item.getCost();
        if (item.type === 'sell') {
            document.getElementById('buy-btn').disabled = (cost === 'N/A');
            document.getElementById('buy-btn').innerText = 'SELL';
        } else {
            document.getElementById('buy-btn').innerText = cost === 'MAX' ? 'MAXED' : `BUY ($${cost})`;
            document.getElementById('buy-btn').disabled = !((typeof cost === 'number' && this.money >= cost));
        }
        document.getElementById('buy-btn').onclick = () => this.buyItem(item);
        let nextValue = item.getNext();
        if (nextValue === "MAX") document.getElementById('detail-stats').innerHTML = `<div class="stat-old">${item.getValue()}</div><div class="arrow">➜</div><div class="stat-new">MAX</div>`;
        else document.getElementById('detail-stats').innerHTML = `<div class="stat-old">${item.getValue()}</div><div class="arrow">➜</div><div class="stat-new">${nextValue}</div>`;
    }

    buyItem(item) {
        const cost = item.getCost();
        if (item.type === 'item' && typeof cost === 'number' && this.money >= cost) {
            this.placementMode = item.id === 'buy_turret' ? 'turret' : 'shield';
            this.placementItemCost = cost;
            this.isPaused = true; this.isShopOpen = false; document.getElementById('shop-overlay').style.display = 'none';
            document.getElementById('notification').innerText = `Click to Place ${this.placementMode.toUpperCase()} | ESC to Cancel`;
            document.getElementById('notification').style.opacity = 1;
            setTimeout(() => { if (this.placementMode) document.getElementById('notification').style.opacity = 0; }, 2000);
        } else if (item.type === 'sell' && cost !== 'N/A') {
            this.sellMode = true;
            this.isPaused = true; this.isShopOpen = false; document.getElementById('shop-overlay').style.display = 'none';
            document.getElementById('notification').innerText = `Click an item to Sell | ESC to Cancel`;
            document.getElementById('notification').style.opacity = 1;
            setTimeout(() => { if (this.sellMode) document.getElementById('notification').style.opacity = 0; }, 2000);
        } else {
            if (typeof cost === 'number' && this.money >= cost) {
                this.money -= cost; item.action(); this.selectShopItem(item);
            }
        }
        document.getElementById('shop-money-display').innerText = this.money;
    }
    
    cancelPlacement() { this.placementMode = null; this.isPaused = false; document.getElementById('notification').style.opacity = 0; }
    cancelSell() { this.sellMode = null; this.isPaused = false; document.getElementById('notification').style.opacity = 0; }

    tryPlaceItem() {
        if (this.money < this.placementItemCost) return;
        if (this.placementMode === 'turret') { this.towers.push(new Tower(this, this.mouse.x - 23, this.mouse.y - 23, true)); this.stats.turretsBought++; }
        else if (this.placementMode === 'shield') { this.shields.push(new Shield(this, this.mouse.x - 64, this.mouse.y - 33)); }
        this.money -= this.placementItemCost; this.placementMode = null; this.isPaused = false;
        document.getElementById('notification').innerText = "DEPLOYED";
        document.getElementById('notification').style.opacity = 1;
        setTimeout(() => document.getElementById('notification').style.opacity = 0, 1000);
        document.getElementById('shop-money-display').innerText = this.money;
    }

    start() {
        window.closePiggyModal = this.closePiggyModal.bind(this);
        window.closeShopReminder = this.closeShopReminder.bind(this);
        this.gameLoop(0);
    }
    
        gameLoop(currentTime) {
            if (!this.lastTime) this.lastTime = currentTime;
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            const tsf = deltaTime / this.targetFrameTime;
    
            this.screenShake.update(tsf);
    
            const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
            skyGradient.addColorStop(0, '#a1c4fd');
            skyGradient.addColorStop(1, '#ffdde1');
            this.ctx.fillStyle = skyGradient;
            this.ctx.fillRect(0, 0, this.width, this.height);
    
            if (!this.isPaused && !this.isGameOver) {
                this.gameTime += tsf;
                this.threatManager.update(tsf);
    
                if (this.money >= 100 && !this.shopOpenedFirstTime && !this.shopReminderShown) {
                    this.shopReminderShown = true;
                    document.getElementById('shop-reminder').style.display = 'block';
                    this.isPaused = true;
                }
    
                this.piggyTimer += tsf;
                if (this.piggyTimer >= 3600) {
                    this.piggyTimer = 0;
                    this.missiles.push(new Missile(this, Math.random() * (this.width - 50) + 25, 'piggy'));
                    if (!this.piggyBankSeen) {
                        this.piggyBankSeen = true;
                        this.isPaused = true;
                        document.getElementById('piggy-modal').style.display = 'block';
                    }
                }
    
                this.clouds.forEach(c => c.update(tsf));
                this.player.update(tsf);
                this.towers.forEach(t => t.update(tsf));
                this.shields.forEach(s => s.update(tsf));
    
                for (let i = this.missiles.length - 1; i >= 0; i--) {
                    const m = this.missiles[i];
                    m.update(tsf);
                    if (m.health <= 0) { this.killMissile(m, i); continue; }
                    let blocked = false;
                    for (let sIdx = this.shields.length - 1; sIdx >= 0; sIdx--) {
                        const s = this.shields[sIdx];
                        if (m.x < s.x + s.width && m.x + m.width > s.x && m.y < s.y + s.height && m.y + m.height > s.y) {
                            for (let k = 0; k < 10; k++) this.particles.push(new Particle(m.x, m.y, '#3498db', 'spark'));
                            if (s.takeDamage(10)) { this.shields.splice(sIdx, 1); this.screenShake.trigger(3, 5); } else this.screenShake.trigger(1, 3);
                            this.killMissile(m, i);
                            blocked = true;
                            break;
                        }
                    }
                    if (blocked) continue;
                    if (m.y > this.height - 80) {
                        this.castleHealth -= 10; this.missiles.splice(i, 1); this.screenShake.trigger(5, 10);
                        for (let k = 0; k < 15; k++) this.particles.push(new Particle(m.x, m.y, '#e74c3c', 'smoke'));
                    }
                }
    
                for (let i = this.projectiles.length - 1; i >= 0; i--) {
                    const p = this.projectiles[i];
                    p.update(tsf);
                    if (p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height || p.dead) { this.projectiles.splice(i, 1); continue; }
                    for (let j = this.missiles.length - 1; j >= 0; j--) {
                        const m = this.missiles[j];
                        if (p.x > m.x && p.x < m.x + m.width && p.y > m.y && p.y < m.y + m.height) {
                            const damageDealt = Math.min(p.hp, m.health);
                            p.hp -= damageDealt;
                            if (m.takeDamage(damageDealt)) {
                            }
                            m.kbVy = -2;
                            this.particles.push(new Particle(p.x, p.y, '#fff', 'spark'));
                            if (!p.hasHit) { p.hasHit = true; this.shotsHit++; }
                            if (p.hp <= 0) { this.projectiles.splice(i, 1); break; }
                        }
                    }
                }
    
                for (let i = this.drops.length - 1; i >= 0; i--) { this.drops[i].update(tsf); if (this.drops[i].life <= 0) this.drops.splice(i, 1); }
                for (let i = this.particles.length - 1; i >= 0; i--) { this.particles[i].update(tsf); if (this.particles[i].life <= 0) this.particles.splice(i, 1); }
                for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
                    this.floatingTexts[i].update(tsf);
                    if (this.floatingTexts[i].life <= 0) {
                        this.floatingTexts.splice(i, 1);
                    }
                }
                
               if (this.castleHealth <= 0) {
                    this.isGameOver = true;
                    document.getElementById('restart-btn').style.display = 'block';
                    document.getElementById('game-over-stats').style.display = 'block';
                    
                    const timeSec = (this.gameTime / 60);
                    const accuracy = (this.shotsFired > 0) ? (this.shotsHit / this.shotsFired) : 0;
                    let mult = 0.5;
                    if (accuracy <= 0.5) mult = 0.5 + (accuracy * 100 * 0.01);
                    else mult = 1.0 + ((accuracy - 0.5) * 100 * 0.02);
                    
                    // Calculate scores
                    const timeScore = timeSec * 5;
                    const killsScore = this.enemiesKilled * 10;
                    const moneyScore = this.totalMoneyEarned * 1;
                    
                    const scoreBase = timeScore + killsScore + moneyScore;
                    const finalScore = Math.floor(scoreBase * mult);
                    
                    // --- High Score Logic (NEW) ---
                    // Get current high score (default to 0)
                    let highScore = parseInt(localStorage.getItem('myGameHighScore')) || 0;

                    // Check for a new high score
                    if (finalScore > highScore) {
                        highScore = finalScore;
                        localStorage.setItem('myGameHighScore', highScore);
                    }
                    // --- End High Score Logic ---

                    // Update HTML elements
                    document.getElementById('go-time').textContent = `${timeSec.toFixed(1)}s`;
                    document.getElementById('go-kills').textContent = this.enemiesKilled.toLocaleString();
                    document.getElementById('go-money').textContent = `$${this.totalMoneyEarned.toLocaleString()}`;
                    document.getElementById('go-acc').textContent = `${(accuracy * 100).toFixed(1)}%`;
                    
                    document.getElementById('go-time-points').textContent = `(+${Math.floor(timeScore).toLocaleString()})`;
                    document.getElementById('go-kills-points').textContent = `(+${Math.floor(killsScore).toLocaleString()})`;
                    document.getElementById('go-money-points').textContent = `(+${Math.floor(moneyScore).toLocaleString()})`;
                    document.getElementById('go-mult-display').textContent = `(${mult.toFixed(2)}x)`;
                    
                    // Display scores
                    document.getElementById('go-score').textContent = finalScore.toLocaleString();
                    document.getElementById('go-high-score').textContent = highScore.toLocaleString();
                }
            }
    
            const offset = this.screenShake.getOffset();
            this.ctx.save(); this.ctx.translate(offset.x, offset.y);
    
            const backgroundElements = [...this.trees, ...this.clouds];
            backgroundElements.sort((a, b) => (a.z || a.y) - (b.z || b.y));
            backgroundElements.forEach(elem => {
                if (elem.z) { // It's a tree
                    this.drawTree(elem);
                } else { // It's a cloud
                    elem.draw(this.ctx);
                }
            });

            this.backgroundCastlePlatforms.forEach(p => {
                this.ctx.save();
                this.ctx.fillStyle = p.color;
                
                if (p.type === 'castle') { this.ctx.beginPath(); this.ctx.roundRect(p.x, p.y, p.width, p.height, 20); this.ctx.fill(); } else {
                    this.ctx.fillRect(p.x, p.y, p.width, p.height);
                }
                this.drawPlatformFrosting(p);
                this.ctx.restore();
            });
    
            this.platforms.forEach(p => {
                this.ctx.fillStyle = p.color;
                this.ctx.save();
                if (p.type === 'cloud') {
                    const pink = [255, 182, 193];
                    const blue = [135, 206, 250];
                    const ratio = (p.y - (this.height - 1100)) / ((this.height - 250) - (this.height - 1100));
                    const invRatio = 1 - Math.max(0, Math.min(1, ratio));
                    const r = Math.floor(pink[0] * (1 - invRatio) + blue[0] * invRatio);
                    const g = Math.floor(pink[1] * (1 - invRatio) + blue[1] * invRatio);
                    const b = Math.floor(pink[2] * (1 - invRatio) + blue[2] * invRatio);
                    const cloudColor = `rgb(${r}, ${g}, ${b})`;
                    const borderWidth = 4;
                    this.ctx.fillStyle = 'white';
                    this.ctx.beginPath();
                    p.circles.forEach(circle => {
                        this.ctx.moveTo(p.x + circle.dx + circle.radius + borderWidth, p.y + circle.dy);
                        this.ctx.arc(p.x + circle.dx, p.y + circle.dy, circle.radius + borderWidth, 0, Math.PI * 2);
                    });
                    this.ctx.fill();
                    p.circles.forEach(circle => {
                        this.ctx.fillStyle = cloudColor;
                        this.ctx.beginPath();
                        this.ctx.arc(p.x + circle.dx, p.y + circle.dy, circle.radius, 0, Math.PI * 2);
                        this.ctx.fill();
                        if (circle.hasGlare) {
                            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
                            this.ctx.beginPath();
                            this.ctx.ellipse(
                                p.x + circle.dx - circle.radius * 0.3,
                                p.y + circle.dy - circle.radius * 0.3,
                                circle.radius * 0.4,
                                circle.radius * 0.6,
                                -0.8, 0, Math.PI * 2
                            );
                            this.ctx.fill();
                        }
                    });
                } else if (p.type === 'castle') {
                    this.ctx.beginPath(); this.ctx.roundRect(p.x, p.y, p.width, p.height, 20); this.ctx.fill();
                    this.drawPlatformFrosting(p);
                } else {
                    this.ctx.beginPath();
                    this.ctx.roundRect(p.x, p.y, p.width, p.height, 20);
                    this.ctx.fill();
                    this.drawPlatformFrosting(p);
                }
                this.ctx.restore();
            });
            
            if (!this.isGameOver) {
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 24px Segoe UI';
                this.ctx.textAlign = 'center';
                this.ctx.fillText("[F] SHOP", this.width / 2, this.height - 60);
            }
    
            this.towers.forEach(t => t.draw(this.ctx));
            this.shields.forEach(s => s.draw(this.ctx));
            this.missiles.forEach(m => m.draw(this.ctx));
            this.projectiles.forEach(p => p.draw(this.ctx));
            this.drops.forEach(d => d.draw(this.ctx));
            this.particles.forEach(p => p.draw(this.ctx));
            this.player.draw(this.ctx);
            this.floatingTexts.forEach(ft => ft.draw(this.ctx));
    
            this.ctx.restore();
    
            if (!this.player.isControlling && !this.isPaused && !this.isGameOver) {
                this.towers.forEach(t => {
                    if (!t.isAuto && Math.hypot((t.x + 20) - (this.player.x + 12), (t.y + 20) - (this.player.y + 18)) < 80) {
                        this.ctx.fillStyle = 'white'; this.ctx.font = '20px Arial'; this.ctx.fillText('Press E', t.x + 5, t.y - 15);
                    }
                });
            }
    
            if (this.placementMode) {
                this.ctx.globalAlpha = 0.6;
                if (this.placementMode === 'turret') {
                    this.ctx.fillStyle = '#546e7a'; this.ctx.fillRect(this.mouse.x - 23, this.mouse.y - 23, 46, 46);
                    this.ctx.beginPath(); this.ctx.arc(this.mouse.x, this.mouse.y, this.stats.range * 0.5, 0, Math.PI * 2); this.ctx.strokeStyle = 'white'; this.ctx.stroke();
                } else if (this.placementMode === 'shield') {
                    this.ctx.fillStyle = '#3498db'; this.ctx.beginPath(); this.ctx.arc(this.mouse.x, this.mouse.y + 33, 64, Math.PI, 0); this.ctx.fill();
                }
                this.ctx.globalAlpha = 1.0;
                this.ctx.fillStyle = '#333'; this.ctx.font = 'bold 20px Arial'; this.ctx.textAlign = 'center'; this.ctx.fillText('Click to Place | ESC to Cancel', this.mouse.x, this.mouse.y - 50);
            }
    
            if (this.sellMode) {
                let hoverTarget = null;
                let refundAmount = 0;
                let targetType = '';
                for (const t of this.towers) {
                    if (t.isAuto && this.mouse.x > t.x && this.mouse.x < t.x + t.width && this.mouse.y > t.y && this.mouse.y < t.y + t.height) {
                        hoverTarget = t;
                        targetType = 'turret';
                        const costs = [1000, 3000, 5000];
                        refundAmount = Math.floor(costs[this.stats.turretsBought - 1] * 0.9);
                        break;
                    }
                }
                if (!hoverTarget) {
                    for (const s of this.shields) {
                        if (this.mouse.x > s.x && this.mouse.x < s.x + s.width && this.mouse.y > s.y && this.mouse.y < s.y + s.height) {
                            hoverTarget = s;
                            targetType = 'shield';
                            refundAmount = Math.floor(this.SHIELD_COSTS[this.shields.length - 1] * 0.9);
                            break;
                        }
                    }
                }
                if (hoverTarget) {
                    this.ctx.globalAlpha = 0.8;
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    this.ctx.fillRect(this.mouse.x + 10, this.mouse.y - 50, 133, 40);
                    this.ctx.fillStyle = '#2ecc71';
                    this.ctx.font = 'bold 24px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(`+$${refundAmount}`, this.mouse.x + 10 + (133 / 2), this.mouse.y - 25);
                    this.ctx.globalAlpha = 0.2;
                    this.ctx.fillStyle = 'white';
                    this.ctx.fillRect(hoverTarget.x, hoverTarget.y, hoverTarget.width, hoverTarget.height);
                    this.ctx.globalAlpha = 1.0;
                }
                if (this.mouse.isDown && hoverTarget) {
                    this.money += refundAmount;
                    if (targetType === 'turret') {
                        this.towers.splice(this.towers.indexOf(hoverTarget), 1);
                        this.stats.turretsBought--;
                    } else if (targetType === 'shield') {
                        this.shields.splice(this.shields.indexOf(hoverTarget), 1);
                    }
                    this.sellMode = null;
                    this.isPaused = false;
                    document.getElementById('notification').innerText = "SOLD!";
                    document.getElementById('notification').style.opacity = 1;
                    setTimeout(() => document.getElementById('notification').style.opacity = 0, 1000);
                }
            }
            
            document.getElementById('money-display').innerText = this.money;
            if (this.isShopOpen) document.getElementById('shop-money-display').innerText = this.money;
    
            document.getElementById('health-bar-fill').style.width = Math.max(0, this.castleHealth) + '%';
            document.getElementById('health-text').innerText = `${Math.max(0, this.castleHealth)}/100`;
            document.getElementById('threat-level').innerText = (30 + this.currentRPM + (this.enemiesKilled * 0.1)).toFixed(0);
    
            requestAnimationFrame(() => this.gameLoop(performance.now()));
        }
    
        drawTree(tree) {
            this.ctx.save();
            this.ctx.globalAlpha = tree.z * 0.1 + 0.8;
    
            const trunkWidth = tree.width * 0.25;
            const trunkHeight = tree.height;
            const leafStartY = tree.y - trunkHeight;
    
            // Trunk
            this.ctx.fillStyle = '#A0522D'; // Sienna
            this.ctx.fillRect(tree.x - trunkWidth / 2, tree.y - trunkHeight, trunkWidth, trunkHeight);
            
            // Leaves
            this.ctx.fillStyle = tree.color;
            const R = tree.width * 0.315; // base radius

            // bottom row
            this.ctx.beginPath(); this.ctx.ellipse(tree.x - R, leafStartY + R*2.5, R, R*1.2, 0, 0, Math.PI*2); this.ctx.fill();
            this.ctx.beginPath(); this.ctx.ellipse(tree.x, leafStartY + R*2.5, R, R*1.2, 0, 0, Math.PI*2); this.ctx.fill();
            this.ctx.beginPath(); this.ctx.ellipse(tree.x + R, leafStartY + R*2.5, R, R*1.2, 0, 0, Math.PI*2); this.ctx.fill();

            // middle row
            this.ctx.beginPath(); this.ctx.ellipse(tree.x - R*0.7, leafStartY + R*1.5, R, R*1.2, 0, 0, Math.PI*2); this.ctx.fill();
            this.ctx.beginPath(); this.ctx.ellipse(tree.x + R*0.7, leafStartY + R*1.5, R, R*1.2, 0, 0, Math.PI*2); this.ctx.fill();
            
            // top
            this.ctx.beginPath(); this.ctx.ellipse(tree.x, leafStartY + R*0.5, R, R*1.2, 0, 0, Math.PI*2); this.ctx.fill();

            this.ctx.restore();
        }
        
        drawPlatformFrosting(platform) {
            this.ctx.save(); // Save context state
            this.ctx.beginPath();
            this.ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 20); // Use the same rounding as the platform
            this.ctx.clip(); // Clip to this rounded rectangle

            const frostingColor = lightenColor(platform.color, 10);
            this.ctx.fillStyle = frostingColor;
            this.ctx.beginPath();
            let startY = platform.y + 5;
            this.ctx.moveTo(platform.x, startY);
            let numDrips = Math.floor(platform.width / 30);
            let dripHeight = platform.type === 'ground' ? 30 : 20;
            let dripRandomness = platform.type === 'ground' ? 1.5 : 4;
            const animSpeed = platform.type === 'ground' ? 82 : 65;
            const animAmplitude = platform.type === 'ground' ? 11 : 16.5;
    
            for (let i = 0; i < numDrips; i++) {
                let x1 = platform.x + (i / numDrips) * platform.width;
                let x2 = platform.x + ((i + 0.5) / numDrips) * platform.width;
                let x3 = platform.x + ((i + 1) / numDrips) * platform.width;
                let staticDrip = (Math.sin((platform.x + i) * dripRandomness) + 1) * dripHeight;
                let animatedDrip = (Math.sin(this.gameTime / animSpeed + i * (Math.PI / 2)) + 1) * animAmplitude;
                let dripY = startY + 10 + staticDrip + animatedDrip;
                this.ctx.lineTo(x1, startY);
                this.ctx.quadraticCurveTo(x2, dripY, x3, startY);
            }
            this.ctx.lineTo(platform.x + platform.width, startY);
            this.ctx.lineTo(platform.x + platform.width, platform.y + platform.height); // Draw frosting over the whole platform
            this.ctx.lineTo(platform.x, platform.y + platform.height); //
            this.ctx.closePath();
            this.ctx.fill();
            this.ctx.restore(); // Restore context state, removing the clip
        }}

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    game.start();
});