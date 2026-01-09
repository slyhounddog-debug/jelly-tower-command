import Player from './player.js?v=2';
import Tower from './tower.js';
import Missile from './missile.js?v=25';
import ThreatManager from './threatManager.js';
import { ScreenShake, darkenColor, lightenColor } from './utils.js?v=25';
import Drop from './drop.js?v=25';
import Particle from './particle.js';
import WaveAttack from './waveAttack.js';
import FloatingText from './floatingText.js?v=25';
import DamageSpot from './damageSpot.js';
import CastleHealthBar from './castleHealthBar.js';
import initLevel from './initLevel.js';
import Thermometer from './thermometer.js';
import Drawing from './drawing.js';
import SpriteAnimation from './SpriteAnimation.js';
import Emporium from './emporium.js';
import GameLoop from './gameloop.js';
import AudioManager from './audioManager.js';
import LootPopupManager from './lootPopup.js';
import LevelUpScreen from './levelUpScreen.js';
import XPBar from './xpBar.js';
import LevelingManager from './levelingManager.js';
import { COMPONENTS } from './components.js';
import GummyCluster from './boss.js';
import Background from './background.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.boss = null;
        this.bossesKilled = 0;

        this.audioManager = new AudioManager(this);
        this.lootPopupManager = new LootPopupManager(this);
        this.levelManager = new initLevel(this);
        this.background = new Background(this);
        this.platformImage = new Image();
        this.platformImage.src = 'assets/Images/platform.png';
        this.groundImage = new Image();
        this.groundImage.src = 'assets/Images/ground.png';
        this.castleImage = new Image();
        this.castleImage.src = 'assets/Images/castle.png';
        this.towerImage = new Image();
        this.towerImage.src = 'assets/Images/tower.png';
        this.armImage = new Image();
        this.armImage.src = 'assets/Images/arm.png';
        this.autoTurretImage = new Image();
        this.autoTurretImage.src = 'assets/Images/auto-turret.png';
        this.jellybeanImages = [];
        for (let i = 1; i <= 5; i++) {
            const img = new Image();
            img.src = `assets/Images/jellybean${i}.png`;
            this.jellybeanImages.push(img);
        }
        this.gummyclusterImages = [];
        for (let i = 1; i <= 3; i++) {
            const img = new Image();
            img.src = `assets/Images/gummycluster${i}.png`;
            this.gummyclusterImages.push(img);
        }
        this.gummybearImages = [];
        for (let i = 1; i <= 4; i++) {
            const img = new Image();
            img.src = `assets/Images/gummybear${i}.png`;
            this.gummybearImages.push(img);
        }
        this.PASTEL_COLORS = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'];
        this.DAMAGE_TIERS = [16, 23, 30, 38, 48, 58, 68, 80, 95, 110, 125, 140, 160, 180, 200, 225, 250, 275, 300, 350, 400, 450, 500, 550, 600, 700, 800];
        this.UPGRADE_COSTS = [75, 150, 250, 400, 700, 1000, 1250, 1500, 1800, 2150, 2500, 3000, 4000, 5000, 7500, 10000, 12500, 15000, 17500, 20000, 25000, 30000, 40000, 50000, 60000, 75000, 90000, 100000];
        this.LICK_DAMAGE_TIERS = [13, 17, 22, 28, 35, 43, 52, 62, 72, 83, 95, 110, 125];
        this.LICK_KNOCKBACK_TIERS = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 100];
        this.CRITICAL_CHANCE_TIERS = [1, 4, 7, 10, 14, 18, 22, 26, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
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
        this.lastShopOpenTime = 0;
        this.shopReminderTimer = 0;

        this.firstComponentCollected = false;
        this.lastMoveDirection = 1;

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

        this.killsSinceLastBoss = 0;
        this.killsForNextBoss = 50;
        this.groundProximityThreshold = 400;

        this.thermometer = new Thermometer(this);
        this.drawing = new Drawing(this);
        this.emporium = new Emporium(this);
        this.emporium.loadEmporiumUpgrades(); // Essential to load upgrade levels
        this.gameLoop = new GameLoop(this);

        this.stats = {
            damageLvl: 0,
            fireRateLvl: 0,
            rangeLvl: 0,
            luckLvl: 0,
            lickLvl: 0,
            piggyLvl: 0,
            baseDamage: 10,
            baseFireRate: 45,
            baseRange: 375,
            turretsBought: 0,
            maxTurrets: 3,
            critLvl: 0,
            criticalHitChance: 1, // 1% initial chance
            game: this,
            get damage() { return this.game.DAMAGE_TIERS[Math.min(this.damageLvl, this.game.DAMAGE_TIERS.length - 1)]; },
            getNextDamage() { return (this.damageLvl >= this.game.DAMAGE_TIERS.length - 1) ? "MAX" : this.game.DAMAGE_TIERS[this.damageLvl + 1]; },
            get fireRate() { return Math.max(5, Math.floor(this.baseFireRate * Math.pow(0.82, this.fireRateLvl))); },
            get projectileSpeed() { return 4 + .5 * this.fireRateLvl; },
            getNextProjectileSpeed() { return 4 + .5 * (this.fireRateLvl + 1); },
            get range() { return this.baseRange + (this.rangeLvl * 80); },
            get luckCoin() { return Math.min(55, 7 + this.luckLvl * 3); },
            get luckHeart() { return Math.min(45, 3 + (this.luckLvl * 2)); },
            get lickDamage() { return this.game.LICK_DAMAGE_TIERS[Math.min(this.lickLvl, this.game.LICK_DAMAGE_TIERS.length - 1)]; },
            get lickKnockback() { return this.game.LICK_KNOCKBACK_TIERS[Math.min(this.lickLvl, this.game.LICK_KNOCKBACK_TIERS.length - 1)]; },
            get criticalHitChance() { return this.game.CRITICAL_CHANCE_TIERS[Math.min(this.critLvl, this.game.CRITICAL_CHANCE_TIERS.length - 1)]; },
            get piggyStats() { return this.game.PIGGY_TIERS[Math.min(this.piggyLvl, this.game.PIGGY_TIERS.length - 1)]; }
        };

        this.shopItems = [
            { id: 'dmg', name: 'Tower Damage', icon: '💥', desc: 'Increases tower damage & auto-turret damage.', type: 'upgrade', 
              getCost: () => (this.stats.damageLvl >= this.DAMAGE_TIERS.length - 1) ? 'MAX' : this.UPGRADE_COSTS[this.stats.damageLvl], 
              getValue: () => this.stats.damage, 
              getNext: () => this.stats.getNextDamage(),
              getLevel: () => `${this.stats.damageLvl}/${this.DAMAGE_TIERS.length}`,
              action: () => { if (this.stats.damageLvl < this.DAMAGE_TIERS.length - 1) this.stats.damageLvl++; }
            },
            { id: 'rate', name: 'Reload Speed', icon: '⚡', desc: 'Increases fire rate and projectile speed by 1.2.', type: 'upgrade', 
              getCost: () => this.UPGRADE_COSTS[this.stats.fireRateLvl] || 'MAX',
              getValue: () => `${(60/this.stats.fireRate).toFixed(1)}/s | ${this.stats.projectileSpeed.toFixed(1)} pps`, 
              getNext: () => `${(60/Math.max(5, Math.floor(this.baseFireRate * Math.pow(0.82, this.stats.fireRateLvl + 1)))).toFixed(1)}/s | ${this.stats.getNextProjectileSpeed().toFixed(1)} pps`,
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
            },
            { id: 'buy_turret', name: 'Auto-Turret', icon: '🤖', desc: 'Buy an auto-turret.', type: 'item',
              getCost: () => { const costs = [2500, 10000, 50000]; return this.stats.turretsBought < 3 ? costs[this.stats.turretsBought] : 'MAX'; },
              getValue: () => `${this.stats.turretsBought}/3`,
              getNext: () => `Place on a cloud.`,
              getLevel: () => `${this.stats.turretsBought}/3`,
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
        this.floatingTexts = [];
        this.damageSpots = [];
        this.waveAttacks = [];
        this.currentRPM = 5.5;

        this.player = new Player(this);
        this.levelingManager = new LevelingManager(this);
        this.levelingManager.initializePlayer(this.player);
        this.xpBar = new XPBar(this);
        this.levelUpScreen = new LevelUpScreen(this);
        this.threatManager = new ThreatManager(this);
        this.screenShake = ScreenShake;
        this.castleHealthBar = new CastleHealthBar(this);

        this.shopButtonImage = new Image();
        this.shopButtonImage.src = 'assets/Images/shopbuttonup.png';
        this.ui = {
            barHeight: 100,
            shopButton: {
                img: this.shopButtonImage,
                x: 0, y: 0, width: 0, height: 80
            },
            settingsButton: {
                x: 0, y: 0, radius: 25
            }
        };

        this.initListeners();
        this.loadSettings();
        this.resetGame();
    }

    loadSettings() {
        const soundVolume = localStorage.getItem('soundEffectsVolume');
        const musicVolume = localStorage.getItem('musicVolume');

        if (soundVolume !== null) {
            const soundSlider = document.getElementById('sound-effects-slider');
            const soundValue = document.getElementById('sound-effects-value');
            soundSlider.value = soundVolume;
            soundValue.textContent = `${soundVolume}%`;
            this.audioManager.setSoundVolume(soundVolume / 100);
        }

        if (musicVolume !== null) {
            const musicSlider = document.getElementById('music-slider');
            const musicValue = document.getElementById('music-value');
            musicSlider.value = musicVolume;
            musicValue.textContent = `${musicVolume}%`;
            this.audioManager.setMusicVolume(musicVolume / 100);
        }
    }

    saveSettings() {
        const soundVolume = document.getElementById('sound-effects-slider').value;
        const musicVolume = document.getElementById('music-slider').value;
        localStorage.setItem('soundEffectsVolume', soundVolume);
        localStorage.setItem('musicVolume', musicVolume);
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

        Promise.all([
            this.audioManager.loadingPromise,
            this.background.load(),
            new Promise(r => this.platformImage.onload = r),
            new Promise(r => this.groundImage.onload = r),
            new Promise(r => this.castleImage.onload = r),
            new Promise(r => this.towerImage.onload = r),
            new Promise(r => this.armImage.onload = r),
            new Promise(r => this.autoTurretImage.onload = r),
            ...this.jellybeanImages.map(img => new Promise(r => img.onload = r)),
            ...this.gummyclusterImages.map(img => new Promise(r => img.onload = r)),
            ...this.gummybearImages.map(img => new Promise(r => img.onload = r)),
            new Promise(r => this.shopButtonImage.onload = r),
        ]).then(() => {
            startButton.src = 'assets/Images/modalconfirmup.png'; // Set to normal image
            startButton.style.pointerEvents = 'all'; // Enable click
            const btn = this.ui.shopButton;
            btn.width = (btn.img.width / btn.img.height) * btn.height;
            btn.x = (this.width - btn.width) / 2;
            btn.y = this.height - this.ui.barHeight + (this.ui.barHeight - btn.height) / 2;
        }).catch(error => {
            console.error("Failed to load assets:", error);
        });

        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const k = e.key.toLowerCase();
            this.keys[k] = true;
            if (k === 'f') this.toggleShop();
            if (k === 'escape') {
                if (document.getElementById('guide-modal').style.display === 'flex') {
                    document.getElementById('guide-modal').style.display = 'none';
                    this.requestUnpause();
                } else if (document.getElementById('stats-modal').style.display === 'flex') {
                    document.getElementById('stats-modal').style.display = 'none';
                    this.requestUnpause();
                } else if (document.getElementById('gummy-worm-modal').style.display === 'flex') {
                    this.closeGummyWormModal();
                } else if (document.getElementById('marshmallow-modal').style.display === 'flex') {
                    this.closeMarshmallowModal();
                } else if (document.getElementById('piggy-modal').style.display === 'block') {
                    this.closePiggyModal();
                } else if (this.placementMode) {
                    this.cancelPlacement();
                } else if (this.sellMode) {
                    this.cancelSell();
                } else if (this.isShopOpen) {
                    this.toggleShop();
                } else if (this.emporium.isEmporiumOpen) {
                    this.emporium.toggle();
                }
            }
            if (k === 'a') {
                this.lastMoveDirection = -1;
                if (Date.now() - this.player.lastAPress < 300) {
                    this.player.tryDash(-1);
                }
                this.player.lastAPress = Date.now();
            }
            if (k === 'd') {
                this.lastMoveDirection = 1;
                if (Date.now() - this.player.lastDPress < 300) {
                    this.player.tryDash(1);
                }
                this.player.lastDPress = Date.now();
            }
            if (k === 'shift') {
                this.player.tryDash(this.lastMoveDirection);
            }
        });
        document.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = ((e.clientY - rect.top) * scaleY);
        });
        this.canvas.addEventListener('mousedown', () => {
          this.mouse.isDown = true;

    // We subtract 100 here to cancel out the mouse offset 
    // and match the actual visual position of the buttons
    const adjustedY = this.mouse.y - 100; 

    const shopBtn = this.ui.shopButton;
// We check the mouse directly because the UI bar is not affected by game world shifts
if (this.mouse.x > shopBtn.x && this.mouse.x < shopBtn.x + shopBtn.width &&
    this.mouse.y > shopBtn.y && this.mouse.y < shopBtn.y + shopBtn.height) {
    this.toggleShop();
    return; 
}

const settingsBtn = this.ui.settingsButton;
const dist = Math.hypot(this.mouse.x - settingsBtn.x, this.mouse.y - settingsBtn.y);
if (dist < settingsBtn.radius) {
    this.toggleSettings();
    return;
}

            if ((!this.isPaused || this.placementMode || this.sellMode) && !this.isGameOver) {
                if (this.placementMode) {
                    this.tryPlaceItem();
                } else if (this.sellMode) {
                    // The logic for selling is handled within the gameLoop's sellMode block
                } else if (!this.isShopOpen && !this.player.isControlling) {
                    this.player.tryLick();
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
                document.getElementById('stats-btn-components').addEventListener('click', () => {
                    this.updateStatsWindow();
                    document.getElementById('stats-modal').style.display = 'flex';
                });
                document.getElementById('help-btn-components').addEventListener('click', () => {
                    document.getElementById('guide-modal').style.display = 'flex';
                });
        
                document.getElementById('settings-icon').addEventListener('click', () => this.toggleSettings());
                document.getElementById('settings-close-btn').addEventListener('click', () => this.toggleSettings());

                // Add event listeners for modal-confirm-buttons
                document.querySelectorAll('.modal-confirm-button').forEach(button => {
                    button.addEventListener('mousedown', () => {
                        button.src = 'assets/Images/modalconfirmdown.png';
                    });
                    button.addEventListener('mouseup', () => {
                        button.src = 'assets/Images/modalconfirmup.png';
                    });
                });

                // Add event listeners for shop-upgrade-buttons
                document.querySelectorAll('.shop-upgrade-button').forEach(button => {
                    button.addEventListener('mousedown', () => {
                        button.src = 'assets/Images/shopupgradedown.png';
                    });
                    button.addEventListener('mouseup', () => {
                        button.src = 'assets/Images/shopupgradeup.png';
                    });
                });

                document.getElementById('sound-effects-slider').addEventListener('input', (e) => {
                    const value = e.target.value;
                    document.getElementById('sound-effects-value').textContent = `${value}%`;
                    this.audioManager.setSoundVolume(value / 100);
                    this.saveSettings();
                });
        
                document.getElementById('music-slider').addEventListener('input', (e) => {
                    const value = e.target.value;
                    document.getElementById('music-value').textContent = `${value}%`;
                    this.audioManager.setMusicVolume(value / 100);
                    this.saveSettings();
                });

        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }                
                        renderComponentQuarters() {
                            const usedPoints = this.player.equippedComponents.reduce((sum, c) => sum + (COMPONENTS[c.name] ? COMPONENTS[c.name].cost : 0), 0);
                            const maxPoints = this.player.maxComponentPoints;

                            // Render component points bar
                            const bar = document.getElementById('component-points-bar');
                            const barFill = bar.querySelector('.xp-fill');
                            const barSegmentsContainer = bar.querySelector('.xp-segments');
                            const barText = bar.parentElement.querySelector('.xp-text');
                            
                            barFill.style.width = `${(usedPoints / maxPoints) * 100}%`;
                            barSegmentsContainer.innerHTML = ''; // Clear existing segments

                            for (let i = 0; i < maxPoints - 1; i++) {
                                const segment = document.createElement('div');
                                segment.classList.add('segment-line');
                                barSegmentsContainer.appendChild(segment);
                            }

                            barText.innerText = `POINTS: ${usedPoints} / ${maxPoints}`;

                            // Render component grid
                            const grid = document.getElementById('component-grid');
                            const tooltip = document.getElementById('component-tooltip');
                            grid.innerHTML = '';
                            
                            this.player.collectedComponents.forEach((component) => {
                                const componentData = COMPONENTS[component.name];
                                const div = document.createElement('div');
                                div.className = 'component-item';
                                
                                const isEquipped = this.player.equippedComponents.some(equipped => equipped.id === component.id);

                                if (isEquipped) {
                                    div.classList.add('equipped');
                                    div.style.boxShadow = '0 0 15px #00ff00';
                                }
                                div.innerHTML = `
                                    <div class="component-name">${component.name}</div>
                                    <div class="component-cost">${componentData.cost}</div>
                                `;

                                // Tooltip events
                                div.addEventListener('mouseover', (e) => {
                                    tooltip.style.display = 'block';
                                    tooltip.innerHTML = `<strong>${component.name}</strong><br>${componentData.description}`;
                                });
                                div.addEventListener('mouseout', () => {
                                    tooltip.style.display = 'none';
                                });
                                div.addEventListener('mousemove', (e) => {
                                    tooltip.style.left = `${e.clientX + 15}px`;
                                    tooltip.style.top = `${e.clientY}px`;
                                });

                                div.onclick = () => {
                                    const currentUsedPoints = this.player.equippedComponents.reduce((sum, c) => sum + (COMPONENTS[c.name] ? COMPONENTS[c.name].cost : 0), 0);

                                    if (isEquipped) {
                                        // Unequip
                                        const equippedIndex = this.player.equippedComponents.findIndex(equipped => equipped.id === component.id);
                                        if (equippedIndex > -1) {
                                            this.player.equippedComponents.splice(equippedIndex, 1);
                                        }
                                        this.audioManager.playSound('reset'); // Sound for unequipping
                                    } else {
                                        // Equip
                                        const newUsedPoints = currentUsedPoints + componentData.cost;
                                        if (newUsedPoints <= this.player.maxComponentPoints) {
                                            this.player.equippedComponents.push(component);
                                            this.audioManager.playSound('purchase'); // Sound for equipping
                                        } else {
                                            // Not enough points
                                            this.audioManager.playSound('pop'); // Error sound
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

                            // Add event listeners for the new buttons
                            document.getElementById('stats-btn-components').onclick = () => {
                                this.updateStatsWindow();
                                document.getElementById('stats-modal').style.display = 'flex';
                            };
                            document.getElementById('help-btn-components').onclick = () => {
                                document.getElementById('guide-modal').style.display = 'flex';
                            };
                                            }
                                            toggleComponentQuarters() {
                                                const modal = document.getElementById('component-quarters-overlay');
                                                const isVisible = modal.style.display === 'block';
                                                modal.style.display = isVisible ? 'none' : 'block';
                                                if (isVisible) {
                                                    this.requestUnpause();
                                                } else {
                                                    this.isPaused = true;
                                                    this.renderComponentQuarters();
                                                }
                                            }
    toggleSettings() {
        const modal = document.getElementById('settings-modal');
        const isVisible = modal.style.display === 'block';
        modal.style.display = isVisible ? 'none' : 'block';
        if (isVisible) {
            this.requestUnpause();
        } else {
            this.isPaused = true;
        }
    }

    isAnyModalOpen(exclude = null) {
        const modals = [
            '#component-modal', '#piggy-modal', '#gummy-worm-modal',
            '#marshmallow-modal', '#boss-modal',
            '#component-quarters-overlay', '#settings-modal', '#shop-overlay',
            '#guide-modal', '#stats-modal'
        ];
        return modals.some(modalId => {
            if (modalId === exclude) return false;
            const modal = document.querySelector(modalId);
            return modal && (modal.style.display === 'block' || modal.style.display === 'flex');
        });
    }

    requestUnpause(exclude = null) {
        if (!this.isAnyModalOpen(exclude)) {
            this.isPaused = false;
        }
    }
                            
            closeComponentModal() {
                document.getElementById('component-modal').style.display = 'none';
                this.requestUnpause();
            }

    closePiggyModal() {
        document.getElementById('piggy-modal').style.display = 'none';
        this.requestUnpause();
    }

    closeGummyWormModal() {
        document.getElementById('gummy-worm-modal').style.display = 'none';
        this.requestUnpause();
    }

    closeMarshmallowModal() {
        document.getElementById('marshmallow-modal').style.display = 'none';
        this.requestUnpause();
    }



    closeBossModal() {
        document.getElementById('boss-modal').style.display = 'none';
        this.requestUnpause();
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
        
        
        this.totalMoneyEarned = 0; this.enemiesKilled = 0; this.currentScore = 0; this.shotsFired = 0; this.shotsHit = 0;
        this.gameTime = 0; this.isGameOver = false; this.isPaused = false; this.currentRPM = 5.5;
        this.piggyTimer = 0; this.piggyBankSeen = false;
        this.shopOpenedFirstTime = false;
        this.shopReminderShown = false;

        this.killsSinceLastBoss = 0;
        this.killsForNextBoss = 50;

        this.stats.damageLvl = 0; this.stats.fireRateLvl = 0; this.stats.rangeLvl = 0;
        this.stats.luckLvl = 0;
        this.stats.lickLvl = 0; this.stats.piggyLvl = 0; this.stats.critLvl = 0;
        this.stats.turretsBought = 0;

        this.missiles = []; this.projectiles = []; this.particles = []; this.drops = []; this.damageSpots = []; this.floatingTexts = []; this.waveAttacks = [];
        this.player.reset();
        this.levelingManager.initializePlayer(this.player);
        this.lastTime = 0;
        document.getElementById('restart-btn').style.display = 'none';
        document.getElementById('open-emporium-btn').style.display = 'none';
        document.getElementById('game-over-stats').style.display = 'none';
                        this.levelManager = new initLevel(this);
                        this.threatManager.reset();
                        this.background.init();
                    }


        toggleShop() {
            if (this.placementMode) { this.cancelPlacement(); return; }
            if (this.isGameOver) return;
            this.isShopOpen = !this.isShopOpen;
            document.getElementById('shop-overlay').style.display = this.isShopOpen ? 'flex' : 'none';

            if (this.isShopOpen) {
                this.isPaused = true;
                this.lastShopOpenTime = this.gameTime;
            } else {
                this.requestUnpause('#shop-overlay');
            }

            const gamePausedIndicator = document.getElementById('game-paused-indicator');
            gamePausedIndicator.style.display = this.isShopOpen ? 'block' : 'none';
    
                    if (this.isShopOpen) { 
                        this.shopOpenedFirstTime = true;
                        document.getElementById('notification').innerText = 'Game Paused';
                        document.getElementById('notification').style.opacity = 1;
                        setTimeout(() => document.getElementById('notification').style.opacity = 0, 1000);
                        this.audioManager.playSound('purchase'); // Play sound when shop opens
                    } else {
                        this.audioManager.playSound('reset'); // Play sound when shop closes
                    }
                    if (this.audioManager) {
                        this.audioManager.setMuffled(this.isShopOpen);
                    }
                    
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
                <div class.shop-item-name">${item.name}</div>
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

        const buyBtn = document.getElementById('buy-btn');
        const sellBtn = document.getElementById('sell-btn');
        const canAfford = typeof cost === 'number' && this.money >= cost;
        const isMaxLevel = cost === 'MAX';

        if (item.id === 'buy_turret' && this.stats.turretsBought > 0) {
            sellBtn.style.display = 'block';
            sellBtn.onclick = () => this.sellItem();
        } else {
            sellBtn.style.display = 'none';
        }

        if (isMaxLevel) {
            buyBtn.src = 'assets/Images/disabledbutton.png';
            buyBtn.style.pointerEvents = 'none';
        } else if (canAfford) {
            buyBtn.src = 'assets/Images/shopupgradeup.png';
            buyBtn.style.pointerEvents = 'all';
        } else {
            buyBtn.src = 'assets/Images/disabledbutton.png';
            buyBtn.style.pointerEvents = 'none';
        }

        buyBtn.onclick = () => {
            if (canAfford && !isMaxLevel) {
                this.buyItem(item);
            }
        };

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

    sellItem() {
        this.sellMode = true;
        this.isPaused = true; 
        this.isShopOpen = false; 
        document.getElementById('shop-overlay').style.display = 'none';
        document.getElementById('notification').innerText = `Click an item to Sell | ESC to Cancel`;
        document.getElementById('notification').style.opacity = 1;
        setTimeout(() => { if (this.sellMode) document.getElementById('notification').style.opacity = 0; }, 2000);
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
        document.getElementById('stat-big-coin-chance').innerText = `${this.stats.luckCoin}%`;
        document.getElementById('stat-heart-heal').innerText = this.emporium.getHeartHeal();
        document.getElementById('stat-piggy-bonus').innerText = `${(this.stats.piggyStats.bonus*100).toFixed(0)}%`;
        document.getElementById('stat-piggy-multiplier').innerText = `${this.stats.piggyStats.mult}x`;
        document.getElementById('stat-piggy-cooldown').innerText = `${this.emporium.getPiggyCooldown()}s`;
        document.getElementById('stat-critical-hit-chance').innerText = `${this.stats.criticalHitChance}%`;
        const iceCreamChances = this.emporium.getIceCreamChance();
        document.getElementById('stat-ice-cream-chance').innerText = `${iceCreamChances[0]}% / ${iceCreamChances[1]}%`;
    }
    
    cancelPlacement() { this.placementMode = null; this.requestUnpause(); document.getElementById('notification').style.opacity = 0; }
    cancelSell() { this.sellMode = null; this.requestUnpause(); document.getElementById('notification').style.opacity = 0; }

    tryPlaceItem() {
        if (this.money < this.placementItemCost) return;
        if (this.placementMode === 'turret') { this.towers.push(new Tower(this, this.mouse.x - 23, this.mouse.y - 23, true)); this.stats.turretsBought++; }
        this.money -= this.placementItemCost; this.placementMode = null; this.requestUnpause();
        document.getElementById('notification').innerText = "DEPLOYED";
        document.getElementById('notification').style.opacity = 1;
        setTimeout(() => document.getElementById('notification').style.opacity = 0, 1000);
        document.getElementById('shop-money-display').innerText = this.money;
    }


    start() {
        window.closePiggyModal = this.closePiggyModal.bind(this);
        window.closeGummyWormModal = this.closeGummyWormModal.bind(this);
        window.closeMarshmallowModal = this.closeMarshmallowModal.bind(this);

        window.closeComponentModal = this.closeComponentModal.bind(this);
        window.closeComponentQuarters = this.toggleComponentQuarters.bind(this);
        window.closeBossModal = this.closeBossModal.bind(this);
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
