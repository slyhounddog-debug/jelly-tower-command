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
import Thermometer from './thermometer.js';
import Drawing from './drawing.js';
import Emporium from './emporium.js';
import GameLoop from './gameloop.js';
import AudioManager from './audioManager.js';
import LootPopupManager from './lootPopup.js';
import LevelUpScreen from './levelUpScreen.js';
import XPBar from './xpBar.js';
import LevelingManager from './levelingManager.js';
import { COMPONENTS } from './components.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.audioManager = new AudioManager();
        this.lootPopupManager = new LootPopupManager(this);
        this.levelManager = new initLevel(this);
        this.PASTEL_COLORS = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'];
        this.DAMAGE_TIERS = [16, 23, 30, 38, 48, 58, 68, 80, 95, 110, 125, 140, 160, 180, 200, 225, 250, 275, 300, 350, 400, 450, 500, 550, 600, 700, 800];
        this.UPGRADE_COSTS = [75, 150, 250, 400, 700, 1000, 1250, 1500, 1800, 2150, 2500, 3000, 4000, 5000, 7500, 10000, 12500, 15000, 17500, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 90000, 100000];
        this.LICK_DAMAGE_TIERS = [13, 17, 22, 28, 35, 43, 52, 62, 72, 83, 95, 110, 125];
        this.LICK_KNOCKBACK_TIERS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100];
        this.CRITICAL_CHANCE_TIERS = [1, 4, 7, 10, 14, 18, 22, 26, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
        this.SHIELD_COSTS = [25, 35, 45, 55, 75];
        this.PIGGY_TIERS = [
            { bonus: 0.8, mult: 2 },
            { bonus: 0.10, mult: 3 },
            { bonus: 0.12, mult: 3 },
            { bonus: 0.14, mult: 4 },
            { bonus: 0.15, mult: 4 },
            { bonus: 0.16, mult: 5 },
            { bonus: 0.17, mult: 6 },
            { bonus: 0.18, mult: 7 },
            { bonus: 0.19, mult: 8 },
            { bonus: 0.20, mult: 9 },
            { bonus: 0.20, mult: 10 }
        ];

        this.lastTime = 0;
        this.targetFrameTime = 1000 / 60;

        this.money = 0;
        this.castleHealth = 100;
        // Initialize currency from localStorage or 0
        this.iceCreamScoops = parseInt(localStorage.getItem('iceCreamScoops')) || 0;
        this.isPaused = true;
        this.isShopOpen = false;
        this.isGameOver = false;
        this.gameTime = 0;
        this.placementMode = null;
        this.sellMode = null;
        this.placementItemCost = 0;
        this.shopOpenedFirstTime = false;
        this.shopReminderShown = false;
        this.firstComponentCollected = false;

       this.totalMoneyEarned = 0;
        this.enemiesKilled = 0;
        this.currentScore = 0;
        this.wasRunningBeforeHidden = false; // Tracks if game was running before tab switch
        this.shotsFired = 0;
        this.shotsHit = 0;

        this.piggyTimer = 0;
        this.piggyBankSeen = false;

        this.gummyWormSpawnThreshold = 12;
        this.gummyWormSeen = false;
        this.marshmallowSpawnThreshold = 22;
        this.marshmallowSeen = false;

        this.thermometer = new Thermometer(this);
        this.drawing = new Drawing(this);
        this.emporium = new Emporium(this);
        this.emporium.loadEmporiumUpgrades(); // Essential to load upgrade levels
        this.gameLoop = new GameLoop(this);

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
        this.levelingManager = new LevelingManager(this);
        this.levelingManager.initializePlayer(this.player);
        this.xpBar = new XPBar(this);
        this.levelUpScreen = new LevelUpScreen(this);
        this.threatManager = new ThreatManager(this);
        this.screenShake = ScreenShake;
        this.castleHealthBar = new CastleHealthBar(this);
        
        this.initListeners();
        this.resetGame();
    }



    resizeModals() {
        const modals = document.querySelectorAll('.modal');
        const canvasWidth = this.canvas.clientWidth;
        modals.forEach(modal => {
            modal.style.width = `${canvasWidth}px`;
        });
    }



    initListeners() {
        this.resizeModals();
        window.addEventListener('resize', () => this.resizeModals());

        const startButton = document.getElementById('start-game-btn');
        startButton.disabled = true;
        startButton.textContent = 'Loading Sounds...';

        this.audioManager.loadingPromise.then(() => {
            startButton.disabled = false;
            startButton.textContent = 'Start Game';
        });

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
                else if (this.emporium.isEmporiumOpen) this.emporium.toggle();
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

    // Start the persistent music when the user clicks Start
    if (this.audioManager) {
        this.audioManager.playMusic('music');
    }
});

        document.getElementById('restart-btn').addEventListener('click', () => this.resetGame());
        
        document.getElementById('help-btn').addEventListener('click', () => document.getElementById('guide-modal').style.display = 'flex');
        document.getElementById('stats-btn').addEventListener('click', () => {
            this.updateStatsWindow();
            document.getElementById('stats-modal').style.display = 'flex';
        });
        document.getElementById('open-emporium-btn').addEventListener('click', () => this.emporium.toggle());
        document.getElementById('emporium-reset-btn').addEventListener('click', () => this.emporium.reset());
                document.getElementById('stats-btn-emporium').addEventListener('click', () => {
                    this.updateStatsWindow();
                    document.getElementById('stats-modal').style.display = 'block';
                });
                document.getElementById('help-btn-emporium').addEventListener('click', () => document.getElementById('guide-modal').style.display = 'block');
                document.getElementById('components-btn').addEventListener('click', () => this.toggleComponentQuarters());
        
                        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
                    }
                
                        renderComponentQuarters() {
                            const bar = document.getElementById('component-points-bar');
                            bar.innerHTML = '';
                            const usedPoints = Object.values(this.player.equippedComponents).reduce((sum, component) => sum + (component ? component.cost : 0), 0);
                            for (let i = 0; i < this.player.maxComponentPoints; i++) {
                                const segment = document.createElement('div');
                                segment.classList.add('component-point-segment');
                                if (i < usedPoints) {
                                    segment.classList.add('used');
                                } else {
                                    segment.classList.add('available');
                                }
                                bar.appendChild(segment);
                            }
                    
                            const grid = document.getElementById('component-grid');
                            grid.innerHTML = '';
                            
                            const uniqueComponents = [...new Set(this.player.collectedComponents)];

                            uniqueComponents.forEach(componentName => {
                                const component = COMPONENTS[componentName];
                                const div = document.createElement('div');
                                div.className = 'component-item';
                                if (this.player.equippedComponents[componentName]) {
                                    div.classList.add('equipped');
                                }
                                div.innerHTML = `
                                    <div class="component-name">${componentName}</div>
                                    <div class="component-cost">${component.cost}</div>
                                `;
                                div.onclick = () => {
                                    const currentUsedPoints = Object.values(this.player.equippedComponents).reduce((sum, c) => sum + (c ? c.cost : 0), 0);

                                    if (this.player.equippedComponents[componentName]) {
                                        // Unequip
                                        delete this.player.equippedComponents[componentName];
                                    } else {
                                        // Equip
                                        const newUsedPoints = currentUsedPoints + component.cost;
                                        if (newUsedPoints <= this.player.maxComponentPoints) {
                                            this.player.equippedComponents[componentName] = component;
                                        } else {
                                            // Not enough points
                                            const barContainer = document.getElementById('component-points-bar-container');
                                            if(barContainer) {
                                                barContainer.style.animation = 'shake 0.5s';
                                                setTimeout(() => {
                                                    barContainer.style.animation = '';
                                                }, 500);
                                            }
                                        }
                                    }
                                    this.renderComponentQuarters();
                                };
                                grid.appendChild(div);
                            });
                        }                
                    toggleComponentQuarters() {
                        const modal = document.getElementById('component-quarters-overlay');
                        const isVisible = modal.style.display === 'block';
                        modal.style.display = isVisible ? 'none' : 'block';
                        this.isPaused = !isVisible;
                        if (!isVisible) {
                            this.renderComponentQuarters();
                        }
                    }        
            closeComponentModal() {
                document.getElementById('component-modal').style.display = 'none';
                this.isPaused = false;
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
        this.audioManager.stopMusic('gameOverMusic');
        this.money = this.emporium.getStartingMoney();

        this.castleHealth = this.emporium.getStartingHealth();
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
        this.levelingManager.initializePlayer(this.player);
        this.lastTime = 0;
        document.getElementById('restart-btn').style.display = 'none';
        document.getElementById('open-emporium-btn').style.display = 'none';
        document.getElementById('game-over-stats').style.display = 'none';
                this.levelManager = new initLevel(this);
                this.threatManager.reset();
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
                   
                } else {
                   
                }
                if (this.audioManager) {
                    this.audioManager.setMuffled(this.isShopOpen);
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
                this.money -= cost;
                item.action();
                this.selectShopItem(item);
                this.audioManager.playSound('upgrade');
            }
        }
        document.getElementById('shop-money-display').innerText = '$' + this.money;
    }





    updateStatsWindow() {
        document.getElementById('stat-shot-damage').innerText = this.stats.damage;
        document.getElementById('stat-fire-rate').innerText = `${(60/this.stats.fireRate).toFixed(1)}/s`;
        document.getElementById('stat-projectile-speed').innerText = this.stats.projectileSpeed.toFixed(1);
        document.getElementById('stat-range').innerText = this.stats.range;
        document.getElementById('stat-lick-damage').innerText = this.stats.lickDamage;
        document.getElementById('stat-lick-knockback').innerText = this.stats.lickKnockback;
        document.getElementById('stat-enemy-health').innerText = (30 + this.currentRPM + (this.enemiesKilled * 0.1)).toFixed(0);
        document.getElementById('stat-castle-max-health').innerText = this.emporium.getCastleMaxHealth();
        document.getElementById('stat-shield-regen').innerText = `${this.emporium.getShieldRegen()}%`;
        document.getElementById('stat-shield-health').innerText = this.stats.shieldMaxHp;
        document.getElementById('stat-big-coin-chance').innerText = `${this.stats.luckCoin}%`;
        document.getElementById('stat-big-coin-cash').innerText = `$${this.emporium.getBigCoinValue()}`;
        document.getElementById('stat-heart-chance').innerText = `${this.stats.luckHeart}%`;
        document.getElementById('stat-heart-heal').innerText = this.emporium.getHeartHeal();
        document.getElementById('stat-piggy-bonus').innerText = `${(this.stats.piggyStats.bonus*100).toFixed(0)}%`;
        document.getElementById('stat-piggy-multiplier').innerText = `${this.stats.piggyStats.mult}x`;
        document.getElementById('stat-piggy-cooldown').innerText = `${this.emporium.getPiggyCooldown()}s`;
        document.getElementById('stat-critical-hit-chance').innerText = `${this.stats.criticalHitChance}%`;
        const iceCreamChances = this.emporium.getIceCreamChance();
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


    start() {
        window.closePiggyModal = this.closePiggyModal.bind(this);
        window.closeGummyWormModal = this.closeGummyWormModal.bind(this);
        window.closeMarshmallowModal = this.closeMarshmallowModal.bind(this);
        window.closeShopReminder = this.closeShopReminder.bind(this);
        window.closeComponentModal = this.closeComponentModal.bind(this);
        window.closeComponentQuarters = this.toggleComponentQuarters.bind(this);
        this.gameLoop.loop(0);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const game = new Game(canvas);
        game.start();
    }
});