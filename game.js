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
import DamageSpot from './damageSpot.js';
import CastleHealthBar from './castleHealthBar.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.PASTEL_COLORS = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'];
        this.DAMAGE_TIERS = [10, 15, 20, 25, 35, 45, 55, 70, 85, 100, 118, 137, 160, 180, 200, 250];
        this.UPGRADE_COSTS = [75, 150, 250, 400, 700, 1000, 1250, 1500, 1800, 2150, 2500, 3000, 4000, 5000, 7500];
        this.LICK_DAMAGE_TIERS = [10, 20, 30, 40, 50];
        this.LICK_KNOCKBACK_TIERS = [75, 100, 150, 200, 250];
        this.CRITICAL_CHANCE_TIERS = [1, 4, 7, 10, 14, 18, 22, 26, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100];
        this.SHIELD_COSTS = [25, 35, 45, 55, 75];
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

        this.isEmporiumOpen = false;
        this.selectedEmporiumItem = null;

       this.totalMoneyEarned = 0;
        this.enemiesKilled = 0;
        this.currentScore = 0;
        this.wasRunningBeforeHidden = false; // Tracks if game was running before tab switch
        this.shotsFired = 0;
        this.shotsHit = 0;

        this.piggyTimer = 0;
        this.piggyBankSeen = false;

        this.gummyWormSpawnThreshold = 9;
        this.gummyWormSeen = false;
        this.marshmallowSpawnThreshold = 15;
        this.marshmallowSeen = false;
        this.thermometerWarn = false;

        this.iceCreamScoops = 0;
        this.emporiumUpgrades = {}; // Will be populated by loadEmporiumUpgrades
        this.emporiumItems = []; // Will be defined below

        this.stats = {
            damageLvl: 0,
            fireRateLvl: 0,
            rangeLvl: 0,
            shieldLvl: 0,
            luckLvl: 0,
            lickLvl: 0,
            piggyLvl: 0,
            baseDamage: 10,
            baseFireRate: 60,
            baseRange: 300,
            baseShieldHp: 15,
            turretsBought: 0,
            maxTurrets: 3,
            critLvl: 0,
            criticalHitChance: 1, // 1% initial chance
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
            get lickDamage() { return this.game.LICK_DAMAGE_TIERS[Math.min(this.lickLvl, this.game.LICK_DAMAGE_TIERS.length - 1)]; },
            get lickKnockback() { return this.game.LICK_KNOCKBACK_TIERS[Math.min(this.lickLvl, this.game.LICK_KNOCKBACK_TIERS.length - 1)]; },
            get criticalHitChance() { return this.game.CRITICAL_CHANCE_TIERS[Math.min(this.critLvl, this.game.CRITICAL_CHANCE_TIERS.length - 1)]; },
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
              getNext: () => `${(60/Math.max(5, Math.floor(this.baseFireRate * Math.pow(0.85, this.stats.fireRateLvl + 1)))).toFixed(1)}/s | ${this.stats.getNextProjectileSpeed().toFixed(1)} pps`,
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
            { id: 'slap_dmg', name: 'Tongue Strength', icon: '👅', 
              desc: `Increases tongue damage and knockback.`, type: 'upgrade', 
              getCost: () => (this.stats.lickLvl >= this.LICK_DAMAGE_TIERS.length - 1) ? 'MAX' : this.UPGRADE_COSTS[this.stats.lickLvl], 
              getValue: () => `D:${this.stats.lickDamage} K:${this.stats.lickKnockback}`, 
              getNext: () => (this.stats.lickLvl >= this.LICK_DAMAGE_TIERS.length - 1) ? "MAX" : `D:${this.LICK_DAMAGE_TIERS[this.stats.lickLvl+1]} K:${this.LICK_KNOCKBACK_TIERS[this.stats.lickLvl+1]}`,
              getLevel: () => `${this.stats.lickLvl}/${this.LICK_DAMAGE_TIERS.length}`,
              action: () => { if (this.stats.lickLvl < this.LICK_DAMAGE_TIERS.length - 1) this.stats.lickLvl++; } 
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
            { id: 'crit_chance', name: 'Critical Hit Chance', icon: '🎯', 
              desc: 'Increases the chance for tower projectiles to deal double damage.', type: 'upgrade',
              getCost: () => (this.stats.critLvl >= this.CRITICAL_CHANCE_TIERS.length - 1) ? 'MAX' : this.UPGRADE_COSTS[this.stats.critLvl],
              getValue: () => `${this.stats.criticalHitChance}%`,
              getNext: () => (this.stats.critLvl >= this.CRITICAL_CHANCE_TIERS.length - 1) ? "MAX" : `${this.CRITICAL_CHANCE_TIERS[this.stats.critLvl + 1]}%`,
              getLevel: () => `${this.stats.critLvl}/${this.CRITICAL_CHANCE_TIERS.length}`,
              action: () => { if (this.stats.critLvl < this.CRITICAL_CHANCE_TIERS.length - 1) this.stats.critLvl++; }
            }
        ];
        this.selectedShopItem = this.shopItems[0];

        this.actionButtons = [
            {
                id: 'buy_shield',
                icon: '🧱',
                x: this.width / 2 - 80, // Increased spacing
                y: this.height - 50,
                radius: 37.5, // 25% bigger
                hovered: false,
                getCost: () => this.shields.length < 5 ? this.SHIELD_COSTS[Math.min(this.shields.length, 4)] : 'MAX',
                errorShake: 0,
            },
            {
                id: 'buy_turret',
                icon: '🤖',
                x: this.width / 2,
                y: this.height - 50,
                radius: 37.5, // 25% bigger
                hovered: false,
                getCost: () => { const costs = [1000, 3000, 5000]; return this.stats.turretsBought < 3 ? costs[this.stats.turretsBought] : 'MAX'; },
                errorShake: 0,
            },
            {
                id: 'sell_item',
                icon: '🗑️',
                x: this.width / 2 + 80, // Increased spacing
                y: this.height - 50,
                radius: 37.5, // 25% bigger
                hovered: false,
                getCost: () => (this.stats.turretsBought > 0 || this.shields.length > 0) ? 'SELL' : 'N/A',
                errorShake: 0,
            }
        ];


        this.emporiumItems = [
            { 
                id: 'starting_money', name: 'Initial Funding', icon: '💰', 
                desc: 'Increases the amount of money you start each run with.',
                getCost: () => (this.emporiumUpgrades.starting_money.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.emporiumUpgrades.starting_money.level],
                getValue: () => `$${this.emporiumUpgrades.starting_money.values[this.emporiumUpgrades.starting_money.level]}`,
                getNext: () => (this.emporiumUpgrades.starting_money.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `$${this.emporiumUpgrades.starting_money.values[this.emporiumUpgrades.starting_money.level + 1]}`,
                getLevel: () => `${this.emporiumUpgrades.starting_money.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.emporiumUpgrades.starting_money.level++; }
            },
            { 
                id: 'piggy_cooldown', name: 'Piggy Bank Timer', icon: '🐷', 
                desc: 'Reduces the cooldown for Piggy Bank spawns.',
                getCost: () => (this.emporiumUpgrades.piggy_cooldown.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.emporiumUpgrades.piggy_cooldown.level],
                getValue: () => `${this.emporiumUpgrades.piggy_cooldown.values[this.emporiumUpgrades.piggy_cooldown.level]}s`,
                getNext: () => (this.emporiumUpgrades.piggy_cooldown.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.emporiumUpgrades.piggy_cooldown.values[this.emporiumUpgrades.piggy_cooldown.level + 1]}s`,
                getLevel: () => `${this.emporiumUpgrades.piggy_cooldown.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.emporiumUpgrades.piggy_cooldown.level++; }
            },
            { 
                id: 'castle_health', name: 'Castle Durability', icon: '🏰', 
                desc: 'Increases the starting health of your castle.',
                getCost: () => (this.emporiumUpgrades.castle_health.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.emporiumUpgrades.castle_health.level],
                getValue: () => `${this.emporiumUpgrades.castle_health.values[this.emporiumUpgrades.castle_health.level]} HP`,
                getNext: () => (this.emporiumUpgrades.castle_health.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.emporiumUpgrades.castle_health.values[this.emporiumUpgrades.castle_health.level + 1]} HP`,
                getLevel: () => `${this.emporiumUpgrades.castle_health.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.emporiumUpgrades.castle_health.level++; }
            },
            { 
                id: 'heart_heal', name: 'Heart Heal Amount', icon: '❤️', 
                desc: 'Increases the amount of health restored by hearts.',
                getCost: () => (this.emporiumUpgrades.heart_heal.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.emporiumUpgrades.heart_heal.level],
                getValue: () => `+${this.emporiumUpgrades.heart_heal.values[this.emporiumUpgrades.heart_heal.level]} HP`,
                getNext: () => (this.emporiumUpgrades.heart_heal.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `+${this.emporiumUpgrades.heart_heal.values[this.emporiumUpgrades.heart_heal.level + 1]} HP`,
                getLevel: () => `${this.emporiumUpgrades.heart_heal.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.emporiumUpgrades.heart_heal.level++; }
            },
            { 
                id: 'big_coin_value', name: 'Big Coin Value', icon: '🪙', 
                desc: 'Increases the value of Big Coins.',
                getCost: () => (this.emporiumUpgrades.big_coin_value.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.emporiumUpgrades.big_coin_value.level],
                getValue: () => `$${this.emporiumUpgrades.big_coin_value.values[this.emporiumUpgrades.big_coin_value.level]}`,
                getNext: () => (this.emporiumUpgrades.big_coin_value.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `$${this.emporiumUpgrades.big_coin_value.values[this.emporiumUpgrades.big_coin_value.level + 1]}`,
                getLevel: () => `${this.emporiumUpgrades.big_coin_value.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.emporiumUpgrades.big_coin_value.level++; }
            },
            { 
                id: 'ice_cream_chance', name: 'Ice Cream Scoop Chance', icon: '🍦', 
                desc: 'Increases the drop chance of Ice Cream Scoops from enemies and piggy banks.',
                getCost: () => (this.emporiumUpgrades.ice_cream_chance.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.emporiumUpgrades.ice_cream_chance.level],
                getValue: () => `${this.emporiumUpgrades.ice_cream_chance.values[this.emporiumUpgrades.ice_cream_chance.level][0]}% / ${this.emporiumUpgrades.ice_cream_chance.values[this.emporiumUpgrades.ice_cream_chance.level][1]}%`,
                getNext: () => (this.emporiumUpgrades.ice_cream_chance.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.emporiumUpgrades.ice_cream_chance.values[this.emporiumUpgrades.ice_cream_chance.level + 1][0]}% / ${this.emporiumUpgrades.ice_cream_chance.values[this.emporiumUpgrades.ice_cream_chance.level + 1][1]}%`,
                getLevel: () => `${this.emporiumUpgrades.ice_cream_chance.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.emporiumUpgrades.ice_cream_chance.level++; }
            },
            { 
                id: 'shield_regen', name: 'Shield Regen', icon: '🛡️', 
                desc: 'Increases the regeneration rate of shields.',
                getCost: () => (this.emporiumUpgrades.shield_regen.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : EMPORIUM_UPGRADE_COSTS[this.emporiumUpgrades.shield_regen.level],
                getValue: () => `${this.emporiumUpgrades.shield_regen.values[this.emporiumUpgrades.shield_regen.level]}%`,
                getNext: () => (this.emporiumUpgrades.shield_regen.level >= EMPORIUM_UPGRADE_COSTS.length) ? 'MAX' : `${this.emporiumUpgrades.shield_regen.values[this.emporiumUpgrades.shield_regen.level + 1]}%`,
                getLevel: () => `${this.emporiumUpgrades.shield_regen.level}/${EMPORIUM_UPGRADE_COSTS.length}`,
                action: () => { this.emporiumUpgrades.shield_regen.level++; }
            }
        ];

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

        // --- NEW BACKGROUND LOGIC ---
        const castleColor = '#ff85a2'; 
        const castlePlatforms = [
            { x: 40, y: this.height - 180, width: 120, height: 100 },
            { x: 70, y: this.height - 240, width: 60, height: 60 }
        ];
        const groundPlatform = { x: 0, y: this.height - 80, width: this.width, height: 80 };

        this.backgroundCastlePlatforms = [];
        castlePlatforms.forEach(p => {
            this.backgroundCastlePlatforms.push({
                x: p.x - 75, y: p.y - 38, width: p.width, height: p.height,
                color: '#d66d85', type: 'castle'
            });
        });
        this.backgroundCastlePlatforms.push({ 
            x: groundPlatform.x, y: groundPlatform.y - 38, width: groundPlatform.width, height: groundPlatform.height, 
            color: '#d66d85', type: 'ground' 
        });

        // Lollipop Trees Setup
       this.trees = [];
        const treeColors = ['#ff9ff3', '#feca57', '#48dbfb', '#a29bfe'];
        for (let i = 0; i < 12; i++) {
            const z = Math.random();
            this.trees.push({
                x: Math.random() * this.width,
                y: this.height - 80,
                z: z,
                width: (z * 40) + 40,
                // height is now significantly boosted (up to 550px)
                height: (z * 350) + 200, 
                color: treeColors[Math.floor(Math.random() * treeColors.length)]
            });
        }

        // Draw Logic for Mountains (with Sunlight Glow)
        this.drawMountains = (ctx) => {
            const mountainColors = ['#ffafbd', '#ffc3a0', '#ff9ff3'];
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = mountainColors[i];
                ctx.beginPath();
                const yBase = this.height - 80;
                const mWidth = this.width / 1.5;
                const xStart = (i * this.width / 4) - 100;
                ctx.moveTo(xStart, yBase);
                ctx.lineTo(xStart + mWidth / 2, yBase - 300 - (i * 50));
                ctx.lineTo(xStart + mWidth, yBase);
                ctx.fill();

                // RIM LIGHTING GLOW
                ctx.save();
                ctx.globalCompositeOperation = 'lighter';
                const glowGrad = ctx.createLinearGradient(xStart, yBase - 300, xStart + mWidth/2, yBase);
                glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)'); 
                glowGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
                ctx.fillStyle = glowGrad;
                ctx.fill();
                ctx.restore();
            }
        };

        // Draw Logic for Spiral Trees
        this.drawTree = (ctx, t) => {
            ctx.save();
            const scale = 0.4 + (t.z * 0.6);
            const trunkW = 20 * scale;
            const trunkH = t.height * 0.5;
            
            // Spiral Trunk
            ctx.save();
            ctx.translate(t.x, t.y);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-trunkW/2, -trunkH, trunkW, trunkH);
            ctx.clip(new Path2D(`M${-trunkW/2} ${-trunkH} h${trunkW} v${trunkH} h${-trunkW} z`));
            ctx.strokeStyle = '#ff4d4d'; // Red Stripe
            ctx.lineWidth = 8 * scale;
            for(let j = -trunkH - 20; j < 20; j += 20 * scale) {
                ctx.beginPath();
                ctx.moveTo(-trunkW, j);
                ctx.lineTo(trunkW, j + (20 * scale));
                ctx.stroke();
            }
            ctx.restore();

            // Lollipop Top
            const r = (t.width / 2) * scale;
            const headY = t.y - trunkH;
            const g = ctx.createRadialGradient(t.x - r*0.3, headY - r*0.3, r*0.1, t.x, headY, r);
            g.addColorStop(0, '#ffffff'); // Shine
            g.addColorStop(0.2, t.color); 
            g.addColorStop(1, 'rgba(0,0,0,0.2)'); 
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(t.x, headY, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        };

        this.player = new Player(this);
        this.threatManager = new ThreatManager(this);
        this.screenShake = ScreenShake;
        this.castleHealthBar = new CastleHealthBar(this);
        
        this.loadEmporiumUpgrades();
        this.initListeners();
        this.resetGame();
    }

    loadEmporiumUpgrades() {
        const initialUpgrades = getInitialEmporiumUpgrades();
        const savedUpgrades = loadEmporiumUpgrades();
        // Deep merge of initial and saved upgrades
        for (let key in initialUpgrades) {
            if (savedUpgrades[key]) {
                initialUpgrades[key] = { ...initialUpgrades[key], ...savedUpgrades[key] };
            }
        }
        this.emporiumUpgrades = initialUpgrades;
        this.iceCreamScoops = parseInt(localStorage.getItem('iceCreamScoops')) || 0;
    }

    resizeModals() {
        const modals = document.querySelectorAll('.modal');
        const canvasWidth = this.canvas.clientWidth;
        modals.forEach(modal => {
            modal.style.width = `${canvasWidth}px`;
        });
    }

    drawShieldIcon(ctx, x, y, radius) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale((radius / 64) * 0.85, (radius / 64) * 0.85);
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(0, 33, 64, Math.PI, 0);
        ctx.fill();
        ctx.restore();
    }

    drawTurretIcon(ctx, x, y, radius) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(radius / 46, radius / 46);
        ctx.fillStyle = '#a1c4fd';
        ctx.beginPath();
        ctx.roundRect(-23, -23, 46, 46, 10);
        ctx.fill();
        const gradient = ctx.createLinearGradient(0, 0, 28, 0);
        gradient.addColorStop(0, 'lightblue');
        gradient.addColorStop(1, 'lightpink');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(0, -11.5, 28, 13, 5);
        ctx.fill();
        ctx.restore();
    }

    drawActionButtons(ctx) {
        if (this.isGameOver) return;
        this.actionButtons.forEach(button => {
            if (button.errorShake > 0) {
                button.errorShake--;
            }
            const shakeX = button.errorShake > 0 ? Math.sin(button.errorShake * 2) * 5 : 0;
            const radius = button.radius * (button.hovered ? 1.1 : 1);
            ctx.save();
            ctx.translate(button.x + shakeX, button.y);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();

            if (button.id === 'buy_shield') {
                this.drawShieldIcon(ctx, 0, 0, radius);
            } else if (button.id === 'buy_turret') {
                this.drawTurretIcon(ctx, 0, 0, radius);
            } else {
                ctx.font = `${radius * 0.8}px 'Lucky Guy'`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#333';
                ctx.fillText(button.icon, 0, 0);
            }

            if (button.hovered || button.errorShake > 0) {
                const cost = button.getCost();
                if (cost !== 'MAX' && cost !== 'N/A' && cost !== 'SELL') {
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, Math.PI * 2);
                    ctx.clip();
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                    ctx.fill();
                    ctx.fillStyle = button.errorShake > 0 ? 'red' : '#fff';
                    ctx.font = `bold ${radius * 0.5}px 'Lucky Guy'`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(`$${cost}`, 0, 0);
                    ctx.restore();
                }
            }
            ctx.restore();
        });
    }

    initListeners() {
        this.resizeModals();
        window.addEventListener('resize', () => this.resizeModals());

        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const k = e.key.toLowerCase();
            this.keys[k] = true;
            if (k === 'f') this.toggleShop();
            if (k === 'escape') {
                if (document.getElementById('guide-modal').style.display === 'flex') document.getElementById('guide-modal').style.display = 'none';
                else if (document.getElementById('stats-modal').style.display === 'flex') document.getElementById('stats-modal').style.display = 'none';
                else if (document.getElementById('gummy-worm-modal').style.display === 'flex') this.closeGummyWormModal();
                else if (document.getElementById('marshmallow-modal').style.display === 'flex') this.closeMarshmallowModal();
                else if (document.getElementById('piggy-modal').style.display === 'block') this.closePiggyModal();
                else if (this.placementMode) this.cancelPlacement();
                else if (this.sellMode) this.cancelSell();
                else if (this.isShopOpen) this.toggleShop();
                else if (this.isEmporiumOpen) this.toggleEmporium();
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

            this.actionButtons.forEach(button => {
                const dist = Math.hypot(this.mouse.x - button.x, this.mouse.y - button.y);
                button.hovered = dist < button.radius;
            });
        });
        this.canvas.addEventListener('mousedown', () => {
            this.mouse.isDown = true;
            let buttonClicked = false;
        
            // Allow clicking buttons if game is running, or to place an item if paused
            if ((!this.isPaused || this.placementMode || this.sellMode) && !this.isGameOver) {
                
                // Handle button clicks only if not in placement/sell mode already
                if (!this.placementMode && !this.sellMode) {
                    this.actionButtons.forEach(button => {
                        if (button.hovered) {
                            buttonClicked = true;
                            const cost = button.getCost();
        
                            if (typeof cost === 'number' && this.money >= cost) {
                                if (button.id === 'buy_turret' || button.id === 'buy_shield') {
                                    this.placementMode = (button.id === 'buy_turret' ? 'turret' : 'shield');
                                    this.placementItemCost = cost;
                                    this.isPaused = true;
                                    document.getElementById('notification').innerText = `Click to Place ${this.placementMode.toUpperCase()} | ESC to Cancel`;
                                    document.getElementById('notification').style.opacity = 1;
                                    setTimeout(() => { if (this.placementMode) document.getElementById('notification').style.opacity = 0; }, 2000);
                                }
                            } else if (button.id === 'sell_item' && cost !== 'N/A') {
                                this.sellMode = true;
                                this.isPaused = true; // Also pause for sell mode
                                document.getElementById('notification').innerText = `Click an item to Sell | ESC to Cancel`;
                                document.getElementById('notification').style.opacity = 1;
                                setTimeout(() => { if (this.sellMode) document.getElementById('notification').style.opacity = 0; }, 2000);
                            } else if (cost !== 'MAX' && cost !== 'SELL' && cost !== 'N/A') { // Not enough money
                                button.errorShake = 15;
                            }
                        }
                    });
                }
        
                // This part handles placing item OR licking.
                // If a button was clicked to enter a mode, this part should be skipped.
                if (!buttonClicked) {
                    if (this.placementMode) {
                        this.tryPlaceItem();
                    } else if (this.sellMode) {
                        // The logic for selling is handled within the gameLoop's sellMode block
                    } else if (!this.isShopOpen && !this.player.isControlling) {
                        this.player.tryLick();
                    }
                }
            }
        });
        this.canvas.addEventListener('mouseup', () => this.mouse.isDown = false);
        document.getElementById('start-game-btn').addEventListener('click', () => {
            document.getElementById('start-game-modal').style.display = 'none';
            this.isPaused = false;
        });

        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());
        
        document.getElementById('help-btn').addEventListener('click', () => document.getElementById('guide-modal').style.display = 'flex');
        document.getElementById('stats-btn').addEventListener('click', () => {
            this.updateStatsWindow();
            document.getElementById('stats-modal').style.display = 'flex';
        });
        document.getElementById('open-emporium-btn').addEventListener('click', () => this.toggleEmporium());
        document.getElementById('emporium-reset-btn').addEventListener('click', () => this.resetEmporiumUpgrades());
        document.getElementById('stats-btn-emporium').addEventListener('click', () => {
            this.updateStatsWindow();
            document.getElementById('stats-modal').style.display = 'block';
        });
        document.getElementById('help-btn-emporium').addEventListener('click', () => document.getElementById('guide-modal').style.display = 'block');

        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    resetEmporiumUpgrades() {
        let refundedScoops = 0;
        for (const key in this.emporiumUpgrades) {
            const upgrade = this.emporiumUpgrades[key];
            const costs = EMPORIUM_UPGRADE_COSTS;
            for (let i = 0; i < upgrade.level; i++) {
                refundedScoops += costs[i];
            }
        }

        this.iceCreamScoops += refundedScoops;
        this.emporiumUpgrades = getInitialEmporiumUpgrades();

        saveEmporiumUpgrades(this.emporiumUpgrades);
        localStorage.setItem('iceCreamScoops', this.iceCreamScoops);

        // Refresh the emporium display
        this.renderEmporiumGrid();
        if (this.selectedEmporiumItem) {
            this.selectEmporiumItem(this.selectedEmporiumItem);
        }
        document.getElementById('emporium-scoops-display').innerText = '🍦' + this.iceCreamScoops;
    }

    closePiggyModal() {
        document.getElementById('piggy-modal').style.display = 'none';
        this.isPaused = false;
    }

    closeGummyWormModal() {
        document.getElementById('gummy-worm-modal').style.display = 'none';
        this.isPaused = false;
    }

    closeMarshmallowModal() {
        document.getElementById('marshmallow-modal').style.display = 'none';
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
        const startingMoneyLevel = this.emporiumUpgrades.starting_money.level;
        this.money = this.emporiumUpgrades.starting_money.values[startingMoneyLevel];

        const castleHealthLevel = this.emporiumUpgrades.castle_health.level;
        this.castleHealth = this.emporiumUpgrades.castle_health.values[castleHealthLevel];
        const maxHealth = this.castleHealth;
        document.getElementById('health-text').innerText = `${this.castleHealth}/${maxHealth}`;
        
        this.totalMoneyEarned = 0; this.enemiesKilled = 0; this.currentScore = 0; this.shotsFired = 0; this.shotsHit = 0;
        this.gameTime = 0; this.isGameOver = false; this.isPaused = false; this.currentRPM = 5.5;
        this.piggyTimer = 0; this.piggyBankSeen = false;
        this.shopOpenedFirstTime = false;
        this.shopReminderShown = false;

        this.stats.damageLvl = 0; this.stats.fireRateLvl = 0; this.stats.rangeLvl = 0;
        this.stats.shieldLvl = 0; this.stats.luckLvl = 0; this.stats.lickLvl = 0; this.stats.piggyLvl = 0; this.stats.critLvl = 0;
        this.stats.turretsBought = 0;

        this.missiles = []; this.projectiles = []; this.particles = []; this.drops = []; this.shields = []; this.damageSpots = []; this.floatingTexts = [];
        this.player.reset();
        this.lastTime = 0;
        document.getElementById('restart-btn').style.display = 'none';
        document.getElementById('open-emporium-btn').style.display = 'none';
        document.getElementById('game-over-stats').style.display = 'none';
                this.initLevel();
                this.threatManager.reset();
            }

initLevel() {
    // --- 1. CORE ENVIRONMENT & COLORS ---
    const castleColor = '#f8c8dc'; 
    const groundColor = '#f8c8dc';
    const lollipopPalette = ['#ff9ff3', '#feca57', '#48dbfb']; 
    
    // Platforms Setup
    const groundPlatform = { x: 0, y: this.height - 60, width: this.width, height: 60, color: groundColor, type: 'ground' };
    const castlePlatforms = [
        { x: 50, y: this.height - 160, width: 100, height: 160, color: castleColor, type: 'castle' },
        { x: this.width - 150, y: this.height - 160, width: 100, height: 160, color: castleColor, type: 'castle' },
        { x: this.width / 2 - 100, y: this.height - 120, width: 200, height: 120, color: castleColor, type: 'castle' }
    ];

    this.platforms = [...castlePlatforms, groundPlatform];

    // Cloud Platforms logic
    const floatingConfigs = [
        { x: 100, y: this.height - 250, width: 200 }, { x: 900, y: this.height - 350, width: 200 },
        { x: 500, y: this.height - 550, width: 250 }, { x: 100, y: this.height - 750, width: 180 },
        { x: 800, y: this.height - 850, width: 180 }, { x: 450, y: this.height - 1100, width: 200 }
    ];

    floatingConfigs.forEach(cfg => {
        const platform = { ...cfg, height: 30, type: 'cloud' };

        const shadowOffset = 10;
        const width = platform.width;
        const height = platform.height * 1.5;

        // Create an off-screen canvas
        platform.canvas = document.createElement('canvas');
        platform.canvas.width = width;
        platform.canvas.height = height + shadowOffset;
        const pCtx = platform.canvas.getContext('2d');

        // Draw shadow (as a solid darker shape)
        pCtx.fillStyle = '#A99075'; // Darker tan for shadow
        if (pCtx.roundRect) {
            pCtx.beginPath();
            pCtx.roundRect(0, shadowOffset, width, height, height * 0.3);
            pCtx.fill();
        } else {
            pCtx.fillRect(0, shadowOffset, width, height);
        }

        // --- Draw maple bar on the off-screen canvas ---
        // Base of the maple bar
        const gradient = pCtx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#E6CBA7'); // Lighter tan on top
        gradient.addColorStop(1, '#D2B48C'); // Original tan at the bottom
        pCtx.fillStyle = gradient;
        if (pCtx.roundRect) {
            pCtx.beginPath();
            pCtx.roundRect(0, 0, width, height, height * 0.3);
            pCtx.fill();
        } else {
            pCtx.fillRect(0, 0, width, height);
        }

        // Frosting (pink)
        const frostingHeight = height * 0.6;
        pCtx.fillStyle = '#FFC0CB'; // Pink color
        if (pCtx.roundRect) {
            pCtx.beginPath();
            pCtx.roundRect(0, 0, width, frostingHeight, [height * 0.3, height * 0.3, 0, 0]);
            pCtx.fill();
        } else {
            pCtx.fillRect(0, 0, width, frostingHeight);
        }

        // Drips
        for (let i = 0; i < (width / 40); i++) {
            const dripX = Math.random() * width;
            const dripY = frostingHeight - 5;
            const dripWidth = 8 + Math.random() * 8;
            const dripHeight = 10 + Math.random() * 10;
            if (pCtx.roundRect) {
                pCtx.beginPath();
                pCtx.roundRect(dripX, dripY, dripWidth, dripHeight, 4);
                pCtx.fill();
            } else {
                pCtx.fillRect(dripX, dripY, dripWidth, dripHeight);
            }
        }

        // Sprinkles
        const sprinkles = ['#FF1493', '#00BFFF', '#ADFF2F', '#FFD700', '#FF4500'];
        for (let i = 0; i < (width / 10); i++) {
            const sprinkleX = 5 + Math.random() * (width - 10);
            const sprinkleY = 5 + Math.random() * (frostingHeight - 20);
            pCtx.fillStyle = sprinkles[Math.floor(Math.random() * sprinkles.length)];
            const sprinkleWidth = 2 + Math.random() * 2;
            const sprinkleHeight = 5 + Math.random() * 3;
            pCtx.fillRect(sprinkleX, sprinkleY, sprinkleWidth, sprinkleHeight);
        }

        this.platforms.push(platform);
    });

    this.towers = floatingConfigs.map(p => new Tower(this, p.x + 72.4, p.y - 55.2));
    this.clouds = Array.from({ length: 4 }, () => new Cloud(this));

    // --- 2. LOLLIPOP TREES SETUP ---
    // We generate these here, but drawing order in your main loop is what hides the trunks.
    this.trees = [];
    const treeCount = 8;
    const spacing = this.width / treeCount;

    for (let i = 0; i < treeCount; i++) {
        const depth = Math.random(); 
        this.trees.push({
            x: (spacing * i) + (Math.random() * (spacing * 0.4)),
            y: this.height - 55, // Slightly lower than ground to ensure no gaps
            z: depth,
            width: 110 + (depth * 90), 
            height: 380 + (depth * 520), 
            color: lollipopPalette[i % lollipopPalette.length]
        });
    }

    // --- 3. REFINED MOUNTAIN DRAWING (Will hide trunks) ---
    this.drawMountains = (ctx) => {
        const mountainColors = ['#ffafbd', '#ffc3a0', '#ff9ff3'];
        
        // Add a very subtle "Distance Fog" to the mountains
        ctx.save();
        ctx.globalAlpha = 0.9;
        
        mountainColors.forEach((color, i) => {
            const yBase = this.height - 60; // Anchored exactly to ground top
            const mWidth = this.width / 1.4;
            const xStart = (i * this.width / 4) - 150;
            const peakX = xStart + mWidth / 2;
            const peakY = yBase - 280 - (i * 60);

            // Solid Mountain Shape (covers trunks)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(xStart, yBase + 10); // Overlap slightly with ground
            ctx.lineTo(peakX, peakY);
            ctx.lineTo(xStart + mWidth, yBase + 10);
            ctx.closePath();
            ctx.fill();

            // Refined Soft Peak Glow
            const grad = ctx.createLinearGradient(peakX, peakY, peakX, peakY + 200);
            grad.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.fill();
        });
        ctx.restore();
    };

    // --- 4. LOLLIPOP DRAWING LOGIC ---
    this.drawTree = (ctx, t) => {
        ctx.save();
        const scale = 0.45 + (t.z * 0.55);
        ctx.globalAlpha = 0.7 + (t.z * 0.3); // Atmospheric fading for depth
        
        const trunkW = 16 * scale;
        const trunkH = t.height;
        const headR = (t.width / 2) * scale;
        const headY = t.y - trunkH;

        // Trunk
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(-trunkW/2, -trunkH, trunkW, trunkH);
        
        ctx.beginPath();
        ctx.rect(-trunkW/2, -trunkH, trunkW, trunkH);
        ctx.clip();
        
        ctx.strokeStyle = "#ffb3c1"; // Softer candy pink stripe
        ctx.lineWidth = 6 * scale;
        for (let j = -trunkH - 50; j < 50; j += 40 * scale) {
            ctx.beginPath();
            ctx.moveTo(-trunkW, j);
            ctx.lineTo(trunkW, j + (25 * scale));
            ctx.stroke();
        }
        ctx.restore();

        // Lollipop Top
        ctx.beginPath();
        ctx.arc(t.x, headY, headR, 0, Math.PI * 2);
        ctx.fillStyle = t.color;
        ctx.fill();

        // Elegant Swirl
        ctx.save();
        ctx.translate(t.x, headY);
        ctx.beginPath();
        ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
        ctx.lineWidth = 2.5 * scale;
        for (let a = 0; a < 15; a += 0.1) {
            const radius = (a / 15) * headR;
            const angle = a * 1.8; 
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.stroke();
        ctx.restore();

        // Sophisticated Gloss (Rim Lighting)
        const shine = ctx.createRadialGradient(
            t.x - headR * 0.4, headY - headR * 0.4, headR * 0.05,
            t.x - headR * 0.4, headY - headR * 0.4, headR * 0.8
        );
        shine.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
        shine.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = shine;
        ctx.beginPath();
        ctx.arc(t.x, headY, headR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    // --- 5. AESTHETIC TWEAKS (Background Castle & Ground Bloom) ---
    const bgCastleColor = darkenColor(castleColor, 12);
    this.backgroundCastlePlatforms = castlePlatforms.map(p => ({
        ...p, x: p.x - 75, y: p.y - 30, color: bgCastleColor
    }));
    this.backgroundCastlePlatforms.push({ ...groundPlatform, y: groundPlatform.y - 30, color: bgCastleColor });
}

    killMissile(m, index) {
        // Splitting logic for marshmallows
        if (m.type === 'marshmallow_large') {
            this.missiles.splice(index, 1);
            for (let i = 0; i < 2; i++) {
                // Spawn two medium marshmallows with a bit of horizontal offset
                const newMissile = new Missile(this, m.x + (i * 30) - 15, 'marshmallow_medium', m.y);
                this.missiles.push(newMissile);
            }
            for (let k = 0; k < 20; k++) this.particles.push(new Particle(m.x, m.y, m.color, 'smoke'));
            return; // Skip loot drop
        }

        if (m.type === 'marshmallow_medium') {
            this.missiles.splice(index, 1);
            for (let i = 0; i < 2; i++) {
                // Spawn two small marshmallows
                const newMissile = new Missile(this, m.x + (i * 20) - 10, 'marshmallow_small', m.y);
                this.missiles.push(newMissile);
            }
            for (let k = 0; k < 10; k++) this.particles.push(new Particle(m.x, m.y, m.color, 'smoke'));
            return; // Skip loot drop
        }

        // Default kill logic for all other enemies (including small marshmallow)
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

            const iceCreamChanceLevel = this.emporiumUpgrades.ice_cream_chance.level;
            const chances = this.emporiumUpgrades.ice_cream_chance.values[iceCreamChanceLevel];
            const dropChance = (m.type === 'piggy') ? chances[1] : chances[0];
            if (Math.random() * 100 < dropChance) {
                this.drops.push(new Drop(this, m.x, m.y, 'ice_cream_scoop'));
            }
        }
        for (let k = 0; k < 20; k++) this.particles.push(new Particle(m.x, m.y, (m.type === 'piggy' ? '#ff69b4' : m.color), 'smoke'));
    }

    toggleShop() {
        if (this.placementMode) { this.cancelPlacement(); return; }
        if (this.isGameOver) return;
        this.isShopOpen = !this.isShopOpen; this.isPaused = this.isShopOpen;
        const gamePausedIndicator = document.getElementById('game-paused-indicator');
        gamePausedIndicator.style.display = this.isShopOpen ? 'block' : 'none';

                if (this.isShopOpen) { 
                    this.shopOpenedFirstTime = true;
                    document.getElementById('notification').innerText = 'Game Paused';
                    document.getElementById('notification').style.opacity = 1;
                    setTimeout(() => document.getElementById('notification').style.opacity = 0, 1000);
                }
                document.getElementById('shop-overlay').style.display = this.isShopOpen ? 'flex' : 'none';
                if (this.isShopOpen) { 
                    document.getElementById('shop-money-display').innerText = this.money; 
                    this.renderShopGrid(); 
                    this.selectShopItem(this.shopItems[0]); 
                }    }

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
                <div class="shop-item-cost">${cost === 'MAX' ? 'MAX' : `$${cost}`}</div>
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

        // --- Button Logic ---
        if (item.type === 'sell') {
            document.getElementById('buy-btn').disabled = (cost === 'N/A');
            document.getElementById('buy-btn').innerText = 'SELL';
        } else {
            document.getElementById('buy-btn').innerText = cost === 'MAX' ? 'MAXED' : `BUY ($${cost})`;
            document.getElementById('buy-btn').disabled = !((typeof cost === 'number' && this.money >= cost));
        }
        document.getElementById('buy-btn').onclick = () => this.buyItem(item);

        // --- Stat Comparison Logic ---
        let nextValue = item.getNext();
        if (nextValue === "MAX") document.getElementById('detail-stats').innerHTML = `<div class="stat-old">${item.getValue()}</div><div class="arrow">➜</div><div class="stat-new">MAX</div>`;
        else document.getElementById('detail-stats').innerHTML = `<div class="stat-old">${item.getValue()}</div><div class="arrow">➜</div><div class="stat-new">${nextValue}</div>`;

        // --- NEW LEVEL DISPLAY LOGIC ---
        const levelDisplay = document.getElementById('detail-level-display'); // Get the new element
        if (item.getLevel) {
            // Use the getLevel() function to get the current/max level text
            levelDisplay.innerText = `Level: ${item.getLevel()}`;
        } else {
            levelDisplay.innerText = ''; // Clear the text for items like 'Sell Item' or placeables
        }
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
        document.getElementById('shop-money-display').innerText = '$' + this.money;
    }

    toggleEmporium() {
        // Only allow opening if game is over
        if (!this.isEmporiumOpen && !this.isGameOver) {
            return;
        }

        this.isEmporiumOpen = !this.isEmporiumOpen;
        const gamePausedIndicator = document.getElementById('game-paused-indicator');

        if (this.isEmporiumOpen) {
            this.isPaused = true; // Always pause when emporium is open
            gamePausedIndicator.style.display = 'flex';
            document.getElementById('emporium-scoops-display').innerText = '🍦' + this.iceCreamScoops;
            this.renderEmporiumGrid();
            document.getElementById('emporium-overlay').style.display = 'flex';
        } else {
            // When closing, if game is over, remain paused. Otherwise, unpause.
            if (!this.isGameOver) {
                this.isPaused = false;
            }
            gamePausedIndicator.style.display = 'none';
            document.getElementById('emporium-overlay').style.display = 'none';
        }
    }

    renderEmporiumGrid() {
        document.getElementById('emporium-grid').innerHTML = '';
        this.emporiumItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'shop-item';
            if (this.selectedEmporiumItem === item) div.classList.add('selected');
            const cost = item.getCost();
            div.innerHTML = `
                <div class="shop-item-icon">${item.icon}</div>
                <div class="shop-item-name">${item.name}</div>
                <div class="shop-item-cost">${cost === 'MAX' ? 'MAX' : `🍦${cost}`}</div>
                ${item.getLevel ? `<div class="shop-item-count">${item.getLevel()}</div>` : ''}
            `;
            div.onclick = () => this.selectEmporiumItem(item);
            document.getElementById('emporium-grid').appendChild(div);
        });
    }

    selectEmporiumItem(item) {
        this.selectedEmporiumItem = item;
        this.renderEmporiumGrid();
        document.getElementById('emporium-detail-icon').innerText = item.icon;
        document.getElementById('emporium-detail-title').innerText = item.name;
        document.getElementById('emporium-detail-desc').innerText = item.desc;
        const cost = item.getCost();

        document.getElementById('emporium-buy-btn').innerText = cost === 'MAX' ? 'MAXED' : `UPGRADE (🍦${cost})`;
        document.getElementById('emporium-buy-btn').disabled = !((typeof cost === 'number' && this.iceCreamScoops >= cost));
        document.getElementById('emporium-buy-btn').onclick = () => this.buyEmporiumItem(item);

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

    buyEmporiumItem(item) {
        const cost = item.getCost();
        if (typeof cost === 'number' && this.iceCreamScoops >= cost) {
            this.iceCreamScoops -= cost;
            item.action();
            this.selectEmporiumItem(item);
            document.getElementById('emporium-scoops-display').innerText = '🍦' + this.iceCreamScoops;
            saveEmporiumUpgrades(this.emporiumUpgrades);
            localStorage.setItem('iceCreamScoops', this.iceCreamScoops);
        }
    }

    updateStatsWindow() {
        document.getElementById('stat-shot-damage').innerText = this.stats.damage;
        document.getElementById('stat-fire-rate').innerText = `${(60/this.stats.fireRate).toFixed(1)}/s`;
        document.getElementById('stat-projectile-speed').innerText = this.stats.projectileSpeed.toFixed(1);
        document.getElementById('stat-range').innerText = this.stats.range;
        document.getElementById('stat-lick-damage').innerText = this.stats.lickDamage;
        document.getElementById('stat-lick-knockback').innerText = this.stats.lickKnockback;
        document.getElementById('stat-enemy-health').innerText = (30 + this.currentRPM + (this.enemiesKilled * 0.1)).toFixed(0);
        document.getElementById('stat-castle-max-health').innerText = this.emporiumUpgrades.castle_health.values[this.emporiumUpgrades.castle_health.level];
        document.getElementById('stat-shield-regen').innerText = `${this.emporiumUpgrades.shield_regen.values[this.emporiumUpgrades.shield_regen.level]}%`;
        document.getElementById('stat-shield-health').innerText = this.stats.shieldMaxHp;
        document.getElementById('stat-big-coin-chance').innerText = `${this.stats.luckCoin}%`;
        document.getElementById('stat-big-coin-cash').innerText = `$${this.emporiumUpgrades.big_coin_value.values[this.emporiumUpgrades.big_coin_value.level]}`;
        document.getElementById('stat-heart-chance').innerText = `${this.stats.luckHeart}%`;
        document.getElementById('stat-heart-heal').innerText = this.emporiumUpgrades.heart_heal.values[this.emporiumUpgrades.heart_heal.level];
        document.getElementById('stat-piggy-bonus').innerText = `${(this.stats.piggyStats.bonus*100).toFixed(0)}%`;
        document.getElementById('stat-piggy-multiplier').innerText = `${this.stats.piggyStats.mult}x`;
        document.getElementById('stat-piggy-cooldown').innerText = `${this.emporiumUpgrades.piggy_cooldown.values[this.emporiumUpgrades.piggy_cooldown.level]}s`;
        document.getElementById('stat-critical-hit-chance').innerText = `${this.stats.criticalHitChance}%`;
        const iceCreamChanceLevel = this.emporiumUpgrades.ice_cream_chance.level;
        const iceCreamChances = this.emporiumUpgrades.ice_cream_chance.values[iceCreamChanceLevel];
        document.getElementById('stat-ice-cream-chance').innerText = `${iceCreamChances[0]}% / ${iceCreamChances[1]}%`;
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

drawThermometer(ctx) {
    // --- 1. DIMENSIONS ---
    const w = 42;           
    const h = 375;          
    const xBase = this.width - 80;
    const yBase = 100;
    const bulbRadius = 38;  
    const bulbY = yBase + h;

    // --- 2. 10-MINUTE TIMER LOGIC ---
    if (!this.thermometerStartTime) {
        this.thermometerStartTime = Date.now();
    }
    const duration = 10 * 60 * 1000; 
    const elapsed = Date.now() - this.thermometerStartTime;
    const fillPercent = Math.min(1, elapsed / duration);
    
    const totalFillHeight = (h + bulbRadius) * fillPercent;
    const jamTopY = (bulbY + bulbRadius) - totalFillHeight;

    const intersectAngle = Math.asin((w / 2) / bulbRadius);
    const intersectY = bulbY - Math.cos(intersectAngle) * bulbRadius;

    // --- 3. ANIMATION LOGIC (HALF SPEED) ---
    const time = Date.now() * 0.001; // Slower time (multiplied by 0.001 instead of 0.002)
    const pulse = (Math.sin(time * 2) + 1) / 2; 
    const scale = 1 + (pulse * 0.05); 
    
    // Wobble: 2 degrees is ~0.035 radians
    const wobbleAngle = Math.sin(time * 0.8) * 0.035; 

    ctx.save();

    const centerX = xBase;
    const centerY = yBase + (h / 2);
    ctx.translate(centerX, centerY);
    ctx.rotate(wobbleAngle);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    const x = xBase;
    const y = yBase;

    // 4. REUSABLE GLASS SHAPE
    const drawGlassShape = () => {
        ctx.beginPath();
        ctx.arc(x, y, w / 2, Math.PI, 0); 
        ctx.lineTo(x + w / 2, intersectY);
        ctx.arc(x, bulbY, bulbRadius, 1.5 * Math.PI + intersectAngle, 1.5 * Math.PI - intersectAngle);
        ctx.closePath();
    };

    // OUTER GLOW
    ctx.save();
    ctx.shadowBlur = 15 + (pulse * 10);
    ctx.shadowColor = `rgba(255, 105, 180, ${0.4 + pulse * 0.3})`; 
    ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
    ctx.lineWidth = 2;
    drawGlassShape();
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    drawGlassShape();
    ctx.fill();

    // 5. INTERNAL PINK JAM
    ctx.save();
    drawGlassShape();
    ctx.clip(); 

    const jamGrad = ctx.createLinearGradient(x, jamTopY, x, bulbY + bulbRadius);
    jamGrad.addColorStop(0, "rgba(255, 180, 220, 0.9)"); // Brighter pink
    jamGrad.addColorStop(0.3, "rgba(255, 20, 147, 0.75)"); 
    jamGrad.addColorStop(1, "rgba(139, 0, 139, 0.7)");    
    ctx.fillStyle = jamGrad;

    ctx.fillRect(x - bulbRadius - 10, jamTopY, (bulbRadius + 10) * 2, (bulbY + bulbRadius) - jamTopY);

    // Wave Surface
    const waveTime = Date.now() * 0.005;
    const waveWidth = bulbRadius + 10;
    ctx.beginPath();
    ctx.moveTo(x - waveWidth, jamTopY + 10);
    for (let i = -waveWidth; i <= waveWidth; i++) {
        const wave = Math.sin(i * 0.15 + waveTime * 1.5) * 4 + Math.cos(i * 0.1 - waveTime * 0.8) * 2;
        ctx.lineTo(x + i, jamTopY + wave);
    }
    ctx.lineTo(x + waveWidth, jamTopY + 10);
    ctx.fill();

    // SPITTING PARTICLES (Only if > 80% full)
    if (fillPercent > 0.8) {
        ctx.fillStyle = "rgba(255, 105, 180, 0.8)";
        for (let i = 0; i < 5; i++) {
            const pTime = Date.now() * 0.002 + i;
            const px = x + Math.cos(pTime * 2) * 15;
            const py = jamTopY - (Math.abs(Math.sin(pTime * 5)) * 30);
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // SLOW BUBBLES
    const bTime = Date.now();
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    for (let i = 0; i < 8; i++) {
        const bX = x + Math.sin(bTime * 0.001 + i) * (w * 0.3);
        const bY = (bulbY + 10) - ((bTime * (0.015 + i * 0.003)) % (totalFillHeight + 20));
        if (bY > jamTopY + 5) {
            ctx.beginPath();
            ctx.arc(bX, bY, 1 + (i % 2), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.restore(); 

    // 6. NOTCHES WITH GLOW LOGIC
    for (let i = 1; i <= 10; i++) {
        const notchPct = i / 10;
        const notchY = bulbY - (h * notchPct);
        const isGlowing = fillPercent >= notchPct;

        ctx.beginPath();
        ctx.moveTo(x - w / 2 + 5, notchY);
        ctx.quadraticCurveTo(x, notchY + 5, x + w / 2 - 5, notchY);
        
        if (isGlowing) {
            ctx.strokeStyle = "rgba(255, 180, 220, 0.9)";
            ctx.lineWidth = 3;
            ctx.shadowBlur = 5;
            ctx.shadowColor = "pink";
        } else {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 0;
        }
        ctx.stroke();
    }
    ctx.shadowBlur = 0; // Reset shadow

    // Main Border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 3;
    drawGlassShape();
    ctx.stroke();

    // Glare
    const glassGlare = ctx.createLinearGradient(x - w/2, 0, x + w/2, 0);
    glassGlare.addColorStop(0.2, "rgba(255, 255, 255, 0.3)");
    glassGlare.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = glassGlare;
    ctx.fillRect(x - w/2, y - 10, w, h + 10);

    ctx.restore(); 
}

    start() {
        window.closePiggyModal = this.closePiggyModal.bind(this);
        window.closeGummyWormModal = this.closeGummyWormModal.bind(this);
        window.closeMarshmallowModal = this.closeMarshmallowModal.bind(this);
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
        this.drawSunlight(this.ctx);
this.drawMountains(this.ctx);
// Draw trees sorted by depth (z) so further ones are behind
[...this.trees].sort((a, b) => a.z - b.z).forEach(t => this.drawTree(this.ctx, t));

        if (!this.isPaused && !this.isGameOver) {
            this.gameTime += tsf;
            this.threatManager.update(tsf);

            if (this.money >= 100 && !this.shopOpenedFirstTime && !this.shopReminderShown) {
                this.shopReminderShown = true;
                document.getElementById('shop-reminder').style.display = 'block';
                this.isPaused = true;
            }

            const piggyCooldownLevel = this.emporiumUpgrades.piggy_cooldown.level;
            const piggyCooldown = this.emporiumUpgrades.piggy_cooldown.values[piggyCooldownLevel] * 60; // convert to frames
            this.piggyTimer += tsf;
            if (this.piggyTimer >= piggyCooldown) {
                this.piggyTimer = 0;
                this.missiles.push(new Missile(this, Math.random() * (this.width - 50) + 25, 'piggy'));
                if (!this.piggyBankSeen) {
                    this.piggyBankSeen = true;
                    this.isPaused = true;
                    const piggyCooldownLevel = this.emporiumUpgrades.piggy_cooldown.level;
                    const currentCooldown = this.emporiumUpgrades.piggy_cooldown.values[piggyCooldownLevel];
                    document.getElementById('piggy-cooldown-text').innerText = `It appears once every ${currentCooldown} seconds.`;
                    document.getElementById('piggy-modal').style.display = 'block';
                }
            }

            this.clouds.forEach(c => c.update(tsf));
            this.player.update(tsf);
            this.towers.forEach(t => t.update(tsf));
            this.shields.forEach(s => s.update(tsf));
            this.castleHealthBar.update(tsf);

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
                    this.castleHealth -= 10;
                    this.castleHealthBar.triggerHit();
                    this.missiles.splice(i, 1);
                    this.screenShake.trigger(5, 10);
                    for (let k = 0; k < 15; k++) {
                        this.particles.push(new Particle(m.x, m.y, '#e74c3c', 'smoke'));
                    }

                    const numSpots = 5;
                    for (let j = 0; j < numSpots; j++) {
                        const castlePlatforms = this.platforms.filter(p => p.type === 'castle' || p.type === 'ground');
                        const randomPlatform = castlePlatforms[Math.floor(Math.random() * castlePlatforms.length)];
                        const spotX = randomPlatform.x + Math.random() * randomPlatform.width;
                        const spotY = randomPlatform.y + Math.random() * randomPlatform.height;
                        const spotRadius = Math.random() * 5 + 5;
                        const spotColor = darkenColor('#f8c8dc', 20);
                        this.damageSpots.push(new DamageSpot(spotX, spotY, spotRadius, spotColor));
                    }
                }
            }
            this.currentScore = (this.enemiesKilled * 50) + (this.totalMoneyEarned) + (this.gameTime / 30);
            document.getElementById('score-display').textContent = this.currentScore.toFixed(0);
           // --- PASTE THIS INSTEAD ---
for (let i = this.projectiles.length - 1; i >= 0; i--) {
    const p = this.projectiles[i];
    p.update(tsf);

    // Remove if off-screen
    if (p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height || p.dead) { 
        this.projectiles.splice(i, 1); 
        continue; 
    }

    for (let j = this.missiles.length - 1; j >= 0; j--) {
        const m = this.missiles[j];

        // Check for hit
        if (p.x > m.x && p.x < m.x + m.width && p.y > m.y && p.y < m.y + m.height) {
            // Determine if it's a critical hit
            const isCritical = (Math.random() * 100 < this.stats.criticalHitChance);
            let damageAmount = p.hp || 10;
            if (isCritical) {
                damageAmount *= 2;
            }
            
            // Apply damage from projectile to enemy
            const isDead = m.takeDamage(damageAmount, isCritical);
            
            // Visual feedback
            m.kbVy = -2;
            this.particles.push(new Particle(p.x, p.y, '#fff', 'spark'));

            if (!p.hasHit) { 
                p.hasHit = true; 
                this.shotsHit++; 
            }

            // CRITICAL FIX: If enemy is dead, kill it immediately
            if (isDead) {
                this.killMissile(m, j);
            }

            // Remove the projectile so it doesn't hit again
            this.projectiles.splice(i, 1);
            break; 
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

            for (let i = this.damageSpots.length - 1; i >= 0; i--) {
                this.damageSpots[i].update(tsf);
                if (this.damageSpots[i].opacity <= 0) {
                    this.damageSpots.splice(i, 1);
                }
            }
            
            if (this.castleHealth <= 0) {
                this.isGameOver = true;
                document.getElementById('open-emporium-btn').style.display = 'block';
                document.getElementById('restart-btn').style.display = 'block';
                document.getElementById('game-over-stats').style.display = 'block';

                saveEmporiumUpgrades(this.emporiumUpgrades);
                localStorage.setItem('iceCreamScoops', this.iceCreamScoops);
                
                const timeSec = (this.gameTime / 60);
                const accuracy = (this.shotsFired > 0) ? (this.shotsHit / this.shotsFired) : 0;
                let mult = 0.5;
                if (accuracy <= 0.5) mult = 0.5 + (accuracy * 100 * 0.01);
                else mult = 1.0 + ((accuracy - 0.5) * 100 * 0.02);
                
                // Calculate scores
                const timeScore = timeSec * 2;
                const killsScore = this.enemiesKilled * 50;
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

        this.drawMountains(this.ctx);
        this.clouds.forEach(c => c.draw(this.ctx));

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
            this.ctx.save();
            if (p.type === 'cloud') {
                const floatingOffset = Math.sin(this.gameTime * 0.03) * 2;
                this.ctx.drawImage(p.canvas, p.x, p.y + floatingOffset);
            } else { // Handles 'castle' and 'ground'
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.roundRect(p.x, p.y, p.width, p.height, 20);
                this.ctx.fill();
                this.drawPlatformFrosting(p);
            }
            this.ctx.restore();
        });

        for (const spot of this.damageSpots) {
            spot.draw(this.ctx);
        }
        
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
        this.drawThermometer(this.ctx);
        this.player.draw(this.ctx);
        this.floatingTexts.forEach(ft => ft.draw(this.ctx));

        this.drawActionButtons(this.ctx);

        this.ctx.restore();


        if (!this.player.isControlling && !this.isPaused && !this.isGameOver) {
            this.towers.forEach(t => {
                if (!t.isAuto && Math.hypot((t.x + 20) - (this.player.x + 12), (t.y + 20) - (this.player.y + 18)) < 80) {
                    this.ctx.fillStyle = 'white'; this.ctx.font = '20px "Lucky Guy"'; this.ctx.fillText('Press E', t.x + 5, t.y - 15);
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
            this.ctx.fillStyle = '#333'; this.ctx.font = 'bold 20px "Lucky Guy"'; this.ctx.textAlign = 'center';
            this.ctx.fillText('Click to Place | ESC to Cancel', this.mouse.x, this.mouse.y - 50);
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
                this.ctx.font = 'bold 24px "Lucky Guy"';
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
        if (this.isShopOpen) document.getElementById('shop-money-display').innerText = '$' + this.money;

        const castleHealthLevel = this.emporiumUpgrades.castle_health.level;
        const maxHealth = this.emporiumUpgrades.castle_health.values[castleHealthLevel];
        document.getElementById('health-bar-fill').style.width = Math.max(0, (this.castleHealth / maxHealth) * 100) + '%';
        document.getElementById('health-text').innerText = `${Math.max(0, this.castleHealth)}/${maxHealth}`;


        requestAnimationFrame(() => this.gameLoop(performance.now()));
    }

    drawMountains(ctx) {
    const mountainColors = ['#ffafbd', '#ffc3a0', '#ff9ff3'];
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = mountainColors[i];
        ctx.beginPath();
        const yBase = this.height - 100;
        const mWidth = this.width / 1.5;
        const xStart = (i * this.width / 4) - 100;

        ctx.moveTo(xStart, yBase);
        ctx.lineTo(xStart + mWidth / 2, yBase - 300 - (i * 50));
        ctx.lineTo(xStart + mWidth, yBase);
        ctx.fill();

        // --- SUNLIGHT GLOW (RIM LIGHTING) ---
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const glowGrad = ctx.createLinearGradient(xStart, yBase - 300, xStart + mWidth/2, yBase);
        glowGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)'); // Bright glow on the sunward side
        glowGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fill();
        ctx.restore();
    }
}
    

drawTree(ctx, t) {
    ctx.save();
    // Use z-index for parallax-like scaling
    const scale = 0.5 + (t.z * 0.5);
    const trunkWidth = 20 * scale;
    const trunkHeight = t.height * 0.4;
    
    // --- SPIRAL WRAPPED TRUNK ---
    ctx.save();
    ctx.translate(t.x, t.y - trunkHeight);
    // Draw white base
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-trunkWidth/2, 0, trunkWidth, trunkHeight);
    
    // Draw red spiral stripes
    ctx.clip(new Path2D(`M${-trunkWidth/2} 0 h${trunkWidth} v${trunkHeight} h${-trunkWidth} z`));
    ctx.strokeStyle = '#ff4d4d';
    ctx.lineWidth = 8 * scale;
    for(let j = -20; j < trunkHeight; j += 20 * scale) {
        ctx.beginPath();
        ctx.moveTo(-trunkWidth, j);
        ctx.lineTo(trunkWidth, j + (20 * scale)); // Diagonal line for "wrap" look
        ctx.stroke();
    }
    ctx.restore();

    // --- GLOSSY LOLLIPOP TOP ---
    const headRadius = (t.width / 2) * scale;
    const headY = t.y - trunkHeight;
    
    const grad = ctx.createRadialGradient(
        t.x - headRadius * 0.3, headY - headRadius * 0.3, headRadius * 0.1,
        t.x, headY, headRadius
    );
    grad.addColorStop(0, '#ffffff'); // Shine
    grad.addColorStop(0.2, t.color); // Main candy color
    grad.addColorStop(1, darkenColor(t.color, 20)); // Shadow edge

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(t.x, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Sunlight Glow on the Lollipop
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.arc(t.x, headY, headRadius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

    drawSunlight(ctx) {
        const centerX = this.width * 0.9;
        const centerY = this.height * 0.1;
        const radiusInner = 100;
        const radiusOuter = 500;

        const gradient = ctx.createRadialGradient(centerX, centerY, radiusInner, centerX, centerY, radiusOuter);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)'); // Faint white glow
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');  // Transparent

        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radiusOuter, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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
    
    drawLollipopTree(tree) {
        this.ctx.save();
        this.ctx.globalAlpha = tree.z * 0.1 + 0.8;

        const trunkWidth = tree.width * 0.15; // Thinner trunk
        const trunkHeight = tree.height * 0.7; // Shorter trunk for lollipop head
        const headRadius = tree.width * 0.6; // Large round head
        const headY = tree.y - trunkHeight - headRadius;

        // Solid white trunk
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(tree.x - trunkWidth / 2, tree.y - trunkHeight, trunkWidth, trunkHeight);

        // Slanted red stripes
        this.ctx.strokeStyle = '#e74c3c';
        this.ctx.lineWidth = trunkWidth / 2;
        const stripeGap = trunkWidth * 1.5;
        for (let i = -trunkHeight; i < trunkHeight; i += stripeGap) {
            this.ctx.beginPath();
            this.ctx.moveTo(tree.x - trunkWidth, tree.y - i);
            this.ctx.lineTo(tree.x + trunkWidth, tree.y - (i - stripeGap * 0.7));
            this.ctx.stroke();
        }

        // Highlight strip
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.fillRect(tree.x - trunkWidth/2, tree.y - trunkHeight, trunkWidth / 3, trunkHeight);

        // Lollipop Head
        this.ctx.fillStyle = tree.color;
        this.ctx.beginPath();
        this.ctx.arc(tree.x, headY, headRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // Swirl pattern
        this.ctx.strokeStyle = darkenColor(tree.color, 20); // Darker shade of tree color
        this.ctx.lineWidth = headRadius * 0.1;
        const numSwirls = 5;
        for (let i = 0; i < numSwirls; i++) {
            this.ctx.beginPath();
            this.ctx.arc(tree.x, headY, headRadius * (1 - (i / numSwirls)), Math.PI * 2 * i / numSwirls, Math.PI * 2 * (i + 1) / numSwirls + Math.PI / numSwirls);
            this.ctx.stroke();
        }

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
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    game.start();
});
