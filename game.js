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
import initLevel from './initLevel.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.levelManager = new initLevel(this);
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
                this.levelManager = new initLevel(this);
                this.threatManager.reset();
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

        // --- CANDYLAND SKY ---
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
        skyGradient.addColorStop(0, '#A1C4FD'); 
        skyGradient.addColorStop(1, '#FFDDE1'); 
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // 1. ADD SUNLIGHT EFFECT
        this.drawSunlight(this.ctx);

        // 2. ADD SUGAR SNOW
        this.drawSugarSnow(this.ctx, tsf);

        // 3. RENDER PRE-RENDERED ICE CREAM MOUNTAIN
        this.drawIceCreamBackground(this.ctx);
        
        this.clouds.forEach(c => c.draw(this.ctx));

        if (!this.isPaused && !this.isGameOver) {
            this.gameTime += tsf;
            this.threatManager.update(tsf);

            if (this.money >= 100 && !this.shopOpenedFirstTime && !this.shopReminderShown) {
                this.shopReminderShown = true;
                const reminder = document.getElementById('shop-reminder');
                if (reminder) reminder.style.display = 'block';
                this.isPaused = true;
            }

            const pLvl = this.emporiumUpgrades.piggy_cooldown.level;
            const pCooldown = this.emporiumUpgrades.piggy_cooldown.values[pLvl] * 60;
            this.piggyTimer += tsf;
            if (this.piggyTimer >= pCooldown) {
                this.piggyTimer = 0;
                this.missiles.push(new Missile(this, Math.random() * (this.width - 50) + 25, 'piggy'));
                if (!this.piggyBankSeen) {
                    this.piggyBankSeen = true;
                    this.isPaused = true;
                    const curCD = this.emporiumUpgrades.piggy_cooldown.values[pLvl];
                    document.getElementById('piggy-cooldown-text').innerText = `It appears once every ${curCD} seconds.`;
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
                    for (let k = 0; k < 15; k++) this.particles.push(new Particle(m.x, m.y, '#e74c3c', 'smoke'));
                    
                    const castlePlats = this.platforms.filter(p => p.type === 'castle' || p.type === 'ground');
                    for (let j = 0; j < 5; j++) {
                        const rPlat = castlePlats[Math.floor(Math.random() * castlePlats.length)];
                        const sX = rPlat.x + Math.random() * rPlat.width;
                        const sY = rPlat.y + Math.random() * rPlat.height;
                        this.damageSpots.push(new DamageSpot(sX, sY, Math.random() * 5 + 5, darkenColor('#f8c8dc', 20)));
                    }
                }
            }

            this.currentScore = (this.enemiesKilled * 50) + (this.totalMoneyEarned) + (this.gameTime / 30);
            document.getElementById('score-display').textContent = this.currentScore.toFixed(0);

            for (let i = this.projectiles.length - 1; i >= 0; i--) {
                const p = this.projectiles[i];
                p.update(tsf);
                if (p.x < 0 || p.x > this.width || p.y < 0 || p.y > this.height || p.dead) { this.projectiles.splice(i, 1); continue; }
                for (let j = this.missiles.length - 1; j >= 0; j--) {
                    const m = this.missiles[j];
                    if (p.x > m.x && p.x < m.x + m.width && p.y > m.y && p.y < m.y + m.height) {
                        const isCrit = (Math.random() * 100 < this.stats.criticalHitChance);
                        let dmg = (p.hp || 10) * (isCrit ? 2 : 1);
                        if (m.takeDamage(dmg, isCrit)) this.killMissile(m, j);
                        m.kbVy = -2;
                        this.particles.push(new Particle(p.x, p.y, '#fff', 'spark'));
                        if (!p.hasHit) { p.hasHit = true; this.shotsHit++; }
                        this.projectiles.splice(i, 1);
                        break;
                    }
                }
            }

            // Cleanup
            for (let i = this.drops.length - 1; i >= 0; i--) { this.drops[i].update(tsf); if (this.drops[i].life <= 0) this.drops.splice(i, 1); }
            for (let i = this.particles.length - 1; i >= 0; i--) { this.particles[i].update(tsf); if (this.particles[i].life <= 0) this.particles.splice(i, 1); }
            for (let i = this.floatingTexts.length - 1; i >= 0; i--) { this.floatingTexts[i].update(tsf); if (this.floatingTexts[i].life <= 0) this.floatingTexts.splice(i, 1); }
            for (let i = this.damageSpots.length - 1; i >= 0; i--) { this.damageSpots[i].update(tsf); if (this.damageSpots[i].opacity <= 0) this.damageSpots.splice(i, 1); }

            if (this.castleHealth <= 0) {
                this.isGameOver = true;
                document.getElementById('open-emporium-btn').style.display = 'block';
                document.getElementById('restart-btn').style.display = 'block';
                document.getElementById('game-over-stats').style.display = 'block';
                saveEmporiumUpgrades(this.emporiumUpgrades);
                localStorage.setItem('iceCreamScoops', this.iceCreamScoops);
                
                const timeSec = (this.gameTime / 60);
                const accuracy = (this.shotsFired > 0) ? (this.shotsHit / this.shotsFired) : 0;
                let mult = accuracy <= 0.5 ? 0.5 + (accuracy * 100 * 0.01) : 1.0 + ((accuracy - 0.5) * 100 * 0.02);
                const scoreBase = (timeSec * 2) + (this.enemiesKilled * 50) + (this.totalMoneyEarned);
                const finalScore = Math.floor(scoreBase * mult);
                let highScore = parseInt(localStorage.getItem('myGameHighScore')) || 0;
                if (finalScore > highScore) { highScore = finalScore; localStorage.setItem('myGameHighScore', highScore); }
                document.getElementById('go-time').textContent = `${timeSec.toFixed(1)}s`;
                document.getElementById('go-kills').textContent = this.enemiesKilled.toLocaleString();
                document.getElementById('go-money').textContent = `$${this.totalMoneyEarned.toLocaleString()}`;
                document.getElementById('go-acc').textContent = `${(accuracy * 100).toFixed(1)}%`;
                document.getElementById('go-score').textContent = finalScore.toLocaleString();
                document.getElementById('go-high-score').textContent = highScore.toLocaleString();
            }
        }

        const offset = this.screenShake.getOffset();
        this.ctx.save(); 
        this.ctx.translate(offset.x, offset.y);

        this.platforms.forEach(p => {
            this.ctx.save();
            if (p.type === 'cloud') {
                const fO = Math.sin(this.gameTime * 0.03) * 2;
                this.ctx.drawImage(p.canvas, p.x, p.y + fO);
            } else {
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.roundRect(p.x, p.y, p.width, p.height, 20);
                this.ctx.fill();
                this.drawPlatformFrosting(p);
            }
            this.ctx.restore();
        });

        this.damageSpots.forEach(s => s.draw(this.ctx));
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

        document.getElementById('money-display').innerText = this.money;
        const cHealthLvl = this.emporiumUpgrades.castle_health.level;
        const mHealth = this.emporiumUpgrades.castle_health.values[cHealthLvl];
        document.getElementById('health-bar-fill').style.width = Math.max(0, (this.castleHealth / mHealth) * 100) + '%';
        document.getElementById('health-text').innerText = `${Math.max(0, this.castleHealth)}/${mHealth}`;

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    drawSunlight(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const rayCount = 2;
        for (let i = 0; i < rayCount; i++) {
            ctx.beginPath();
            const grad = ctx.createLinearGradient(0, 0, this.width, this.height);
            grad.addColorStop(0, 'rgba(255, 255, 220, 0.2)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.moveTo(150 + (i * 400), -100);
            ctx.lineTo(400 + (i * 400), -100);
            ctx.lineTo(-100 + (i * 400), this.height + 100);
            ctx.lineTo(-350 + (i * 400), this.height + 100);
            ctx.fill();
        }
        ctx.restore();
    }

    drawSugarSnow(ctx, tsf) {
        if (!this.sugarSnowflakes) {
            this.sugarSnowflakes = Array.from({ length: 70 }, () => ({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.6 + 0.2
            }));
        }
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        this.sugarSnowflakes.forEach(f => {
            f.y += f.speed * tsf;
            if (f.y > this.height) f.y = -20;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

drawIceCreamBackground(ctx) {
    if (!this.bgCanvas) {
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = this.width;
        this.bgCanvas.height = this.height;
        const bctx = this.bgCanvas.getContext('2d');

        const centerX = this.width / 2;
        const scoopData = [
            { x: 0, y: this.height + 300, r: 400, color: '#FFB5C5' }, 
            { x: this.width * 0.25, y: this.height + 320, r: 450, color: '#C1FFC1' },
            { x: this.width * 0.5, y: this.height + 350, r: 500, color: '#FFE4B5' },
            { x: this.width * 0.75, y: this.height + 320, r: 450, color: '#FFC0CB' },
            { x: this.width, y: this.height + 300, r: 400, color: '#B0E2FF' },
            { x: this.width * 0.3, y: this.height + 100, r: 380, color: '#FFFACD' },
            { x: this.width * 0.7, y: this.height + 100, r: 380, color: '#D1FFD1' },
            { x: centerX, y: this.height - 240, r: 360, color: '#FFB5C5' }, 
            { x: centerX, y: this.height - 480, r: 295, color: '#FFF9F0', hasCherry: true }
        ];

        scoopData.forEach((s) => {
            const drawScoopShape = (context, x, y, r) => {
                context.beginPath();
                context.moveTo(x - r, y);
                context.bezierCurveTo(x - r, y - r * 1.35, x + r, y - r * 1.35, x + r, y);
                const ripples = 12;
                for (let i = 0; i <= ripples; i++) {
                    let rx = x + r - (i * (r * 2 / ripples));
                    let ry = y + (i % 2 === 0 ? 35 : 15);
                    context.quadraticCurveTo(rx + (r/ripples), ry + 20, rx, y);
                }
            };

            // 1. Scoop Base
            bctx.save();
            bctx.fillStyle = s.color;
            drawScoopShape(bctx, s.x, s.y, s.r);
            bctx.fill();
            bctx.strokeStyle = darkenColor(s.color, 10);
            bctx.lineWidth = 4;
            bctx.stroke();
            bctx.restore();

            // 2. Sprinkles
            const sprColors = ['#FF69B4', '#5DADE2', '#F4D03F', '#58D68D', '#EB984E'];
            bctx.save();
            bctx.clip(); 
            for(let i=0; i < 12; i++) {
                let angle = Math.PI + (Math.random() * Math.PI); 
                let dist = (s.r * 0.5) + (Math.random() * s.r * 0.4);
                let sx = s.x + Math.cos(angle) * dist;
                let sy = s.y + Math.sin(angle) * dist;
                if (sy < s.y - (s.r * 0.4)) {
                    bctx.save();
                    bctx.translate(sx, sy);
                    bctx.rotate(Math.random() * Math.PI);
                    bctx.fillStyle = sprColors[i % sprColors.length];
                    bctx.beginPath();
                    bctx.ellipse(0, 0, 14, 5, 0, 0, Math.PI * 2);
                    bctx.fill();
                    bctx.restore();
                }
            }
            bctx.restore();

            // 3. REFINED LAYERED CHERRY
            if (s.hasCherry) {
                const cx = s.x;
                const cy = s.y - s.r * 0.92; 
                const mainR = 60;
                const bgR = 64;   // Size of the background layers
                const shift = 3;  // Tightened offset

                // Stem
                bctx.beginPath();
                bctx.strokeStyle = '#4E342E';
                bctx.lineWidth = 6;
                bctx.moveTo(cx, cy - 10);
                bctx.quadraticCurveTo(cx + 10, cy - 80, cx + 45, cy - 110);
                bctx.stroke();

                // LIGHT LAYER (Visible Top Right - Anchored Bottom Left)
                bctx.fillStyle = '#FFDDE4'; // Even lighter pink
                bctx.beginPath();
                bctx.arc(cx + shift, cy - shift, bgR, 0, Math.PI * 2);
                bctx.fill();

                // DARK LAYER (Visible Bottom Left - Anchored Top Right)
                bctx.fillStyle = '#800015'; 
                bctx.beginPath();
                bctx.arc(cx - shift, cy + shift, bgR, 0, Math.PI * 2);
                bctx.fill();

                // MAIN LAYER (Center)
                bctx.fillStyle = '#FF4D6D'; 
                bctx.beginPath();
                bctx.arc(cx, cy, mainR, 0, Math.PI * 2);
                bctx.fill();

                // Small Shine
                bctx.fillStyle = '#FFFFFF';
                bctx.globalAlpha = 0.3;
                bctx.beginPath();
                bctx.ellipse(cx - 15, cy - 15, 10, 5, Math.PI / 4, 0, Math.PI * 2);
                bctx.fill();
                bctx.globalAlpha = 1.0;

                // Tuck-in (Hides clipping from background layers)
                bctx.fillStyle = s.color;
                bctx.beginPath();
                bctx.ellipse(cx, cy + mainR + 5, mainR * 1.6, 25, 0, 0, Math.PI * 2);
                bctx.fill();
            }
        });
    }
    ctx.drawImage(this.bgCanvas, 0, 0);
}

    drawPlatformFrosting(platform) {
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.roundRect(platform.x, platform.y, platform.width, platform.height, 20);
        this.ctx.clip();
        const fColor = lightenColor(platform.color, 15);
        this.ctx.fillStyle = fColor;
        this.ctx.beginPath();
        let sY = platform.y + 5;
        this.ctx.moveTo(platform.x, sY);
        let nD = Math.floor(platform.width / 25);
        for (let i = 0; i < nD; i++) {
            let x1 = platform.x + (i / nD) * platform.width;
            let x2 = platform.x + ((i + 0.5) / nD) * platform.width;
            let x3 = platform.x + ((i + 1) / nD) * platform.width;
            let dY = sY + 18 + (Math.sin(this.gameTime / 60 + i) * 8);
            this.ctx.quadraticCurveTo(x2, dY, x3, sY);
        }
        this.ctx.lineTo(platform.x + platform.width, platform.y + platform.height);
        this.ctx.lineTo(platform.x, platform.y + platform.height);
        this.ctx.fill();
        this.ctx.restore();
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
}

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const game = new Game(canvas);
        game.start();
    }
});