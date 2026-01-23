const FORCE_MOBILE_DEBUG = false;

import Player from './player.js?v=2';
import Tower from './tower.js';
import Missile from './missile.js?v=25';
import ThreatManager from './threatManager.js';
import { ScreenShake, darkenColor, lightenColor, showNotification } from './utils.js?v=25';
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
import LevelUpManagerScreen from './levelUpManagerScreen.js';
import XPBar from './xpBar.js';
import LevelingManager from './levelingManager.js';
import { COMPONENTS } from './components.js';
import GummyCluster from './boss.js';
import Background from './background.js';
import DecalManager from './decalManager.js';
import ModalManager from './modalManager.js';
import Shop from './shop.js';
import ComponentQuarters from './componentQuarters.js';

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
        this.decalManager = new DecalManager(this);
        this.background = new Background(this);

        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };
        
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
        this.lootImage = new Image();
        this.lootImage.src = 'assets/Images/loot.png';
        this.tagCrownImage = new Image();
        this.tagCrownImage.src = 'assets/Images/tagcrown.png';
        this.titlescreenImage = new Image();
        this.titlescreenImage.src = 'assets/Images/titlescreen.png';
        this.readybuttonImage = new Image();
        this.readybuttonImage.src = 'assets/Images/readybutton.png';
        this.loadingbuttonImage = new Image();
        this.loadingbuttonImage.src = 'assets/Images/loadingbutton.png';
        this.marshmallowBigImage = new Image();
        this.marshmallowBigImage.src = 'assets/Images/marshmallowbig.png';
        this.marshmallowMediumImage = new Image();
        this.marshmallowMediumImage.src = 'assets/Images/marshmallowmedium.png';
        this.marshmallowSmallImage = new Image();
        this.marshmallowSmallImage.src = 'assets/Images/marshmallowsmall.png';
        // Preload shop and emporium images
        this.shopOverlayImage = new Image();
        this.shopOverlayImage.src = 'assets/Images/shopoverlay.png';
        this.modalImage = new Image();
        this.modalImage.src = 'assets/Images/modal.png';
        this.upgradeSlotImage = new Image();
        this.upgradeSlotImage.src = 'assets/Images/upgradeslot.png';
        this.shopUpgradeDownImage = new Image();
        this.shopUpgradeDownImage.src = 'assets/Images/shopupgradedown.png';
        this.disabledButtonImage = new Image();
        this.disabledButtonImage.src = 'assets/Images/disabledbutton.png';
        this.sellButtonUpImage = new Image();
        this.sellButtonUpImage.src = 'assets/Images/sellbuttonup.png';
        this.sellButtonDownImage = new Image();
        this.sellButtonDownImage.src = 'assets/Images/sellbuttondown.png';
        this.restartButtonImage = new Image();
        this.restartButtonImage.src = 'assets/Images/restartbutton.png';
        this.emporiumButtonImage = new Image();
        this.emporiumButtonImage.src = 'assets/Images/emporiumbutton.png';
        this.resetButtonImage = new Image();
        this.resetButtonImage.src = 'assets/Images/resetbutton.png';
        this.modalConfirmUpImage = new Image();
        this.modalConfirmUpImage.src = 'assets/Images/modalconfirmup.png';
        this.modalConfirmDownImage = new Image();
        this.modalConfirmDownImage.src = 'assets/Images/modalconfirmdown.png';

        this.PASTEL_COLORS = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'];
        this.FROSTING_COLORS = ['#ffadc8c9', '#ffd8cc83', '#ffb6c3a8', '#ffb2bcc4', '#fccef4a6', '#ffa6c8c7', '#fca4e6d5', '#ff81aba1', '#ffb3de', '#f4acb7'];
        this.ENEMY_FROSTING_COLORS = ['#8ab0f0', '#e0e3a0', '#a8e8b3ff', '#9bf6ff', '#b894daff', '#ff9d70ff'];
        this.DAMAGE_TIERS = [18, 25, 32, 40, 48, 58, 68, 80, 95, 110, 125, 140, 155, 170, 185, 190, 205, 225, 245, 265, 285, 305, 330, 355, 380, 405, 440];
        this.UPGRADE_COSTS = [75, 200, 400, 700, 1100, 1600, 2250, 3400, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 90000, 100000, 125000, 150000, 175000, 200000, 2500000, 3000000, 4000000, 5000000];
        this.LICK_DAMAGE_TIERS = [10, 13, 17, 22, 28, 35, 42, 50, 58, 67, 76, 85, 95];
        this.LICK_KNOCKBACK_TIERS = [20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 45];
        this.CRITICAL_CHANCE_TIERS = [1, 4, 7, 10, 14, 18, 22, 26, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90];
        this.PIGGY_TIERS = [
            { bonus: 0.08, mult: 2 },
            { bonus: 0.09, mult: 3 },
            { bonus: 0.1, mult: 3 },
            { bonus: 0.11, mult: 4 },
            { bonus: 0.12, mult: 4 },
            { bonus: 0.13, mult: 5 },
            { bonus: 0.14, mult: 5 },
            { bonus: 0.15, mult: 6 },
            { bonus: 0.16, mult: 6 },
            { bonus: 0.17, mult: 7 },
            { bonus: 0.18, mult: 8 }
        ];

        this.lastTime = 0;
        this.targetFrameTime = 1000 / 60;

        this.money = 0;
        this.castleHealth = 100;
        // Initialize currency from localStorage or 0
        this.iceCreamScoops = parseInt(localStorage.getItem('iceCreamScoops')) || 0;
        this.isPaused = true;
        this.glowSprite = document.createElement('canvas');
this.glowSprite.width = 128;
this.glowSprite.height = 128;
const gCtx = this.glowSprite.getContext('2d');

const gradient = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)'); // Bright white center
gradient.addColorStop(0.3, 'rgba(255, 215, 0, 0.4)'); // Golden inner aura
gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');    // Fades to transparent
gCtx.fillStyle = gradient;
gCtx.fillRect(0, 0, 128, 128);
// Add this to your Game class (where you init sprites)
this.glowSprites = {};
const colors = {
    yellow: '255, 215, 0',
    purple: '180, 0, 255',
    red: '255, 0, 0',
    pink: '255, 105, 180',
    blue: '0, 150, 255'
};

Object.entries(colors).forEach(([name, rgb]) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const gCtx = canvas.getContext('2d');
    const grad = gCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, `rgba(255, 255, 255, 0.9)`); 
    grad.addColorStop(0.3, `rgba(${rgb}, 0.5)`); 
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    gCtx.fillStyle = grad;
    gCtx.fillRect(0, 0, 128, 128);
    this.glowSprites[name] = canvas;
});


        this.isShopOpen = false;
        this.isGameOver = false;
        this.gameStarted = false;
        this.assetsReady = false;
        this.shopState = 'shop';
        this.gameTime = 0;
        this.placementMode = null;
        this.sellMode = null;
        this.placementItemCost = 0;
        this.lastShopOpenTime = 0;
        this.hitStopFrames = 0;
        

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

        this.gummyWormSpawnThreshold = 24;
        this.gummyWormSeen = false;
        this.marshmallowSpawnThreshold = 53;
        this.marshmallowSeen = false;

        this.killsSinceLastBoss = 0;
        this.killsForNextBoss = 50;
        this.groundProximityThreshold = 400;
        this.wasLickKill = false;

        this.thermometer = new Thermometer(this);
        this.drawing = new Drawing(this);
        this.emporium = new Emporium(this);
        this.emporium.loadEmporiumUpgrades(); // Essential to load upgrade levels
        this.gameLoop = new GameLoop(this);

        this.player = new Player(this);

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
            maxTurrets: 5,
            componentPointsLvl: 0, // New: Component Points Level for shop upgrade
            game: this,
            get damage() { return this.game.DAMAGE_TIERS[Math.min(this.damageLvl, this.game.DAMAGE_TIERS.length - 1)]; },
            getNextDamage() { return (this.damageLvl >= this.game.DAMAGE_TIERS.length - 1) ? "MAX" : this.game.DAMAGE_TIERS[this.damageLvl + 1]; },
            get fireRate() { return Math.max(5, Math.floor(this.baseFireRate * Math.pow(0.92, this.fireRateLvl))); },
            get projectileSpeed() { return 4 + .1 * this.fireRateLvl; },
            getNextProjectileSpeed() { return 4 + .1 * (this.fireRateLvl + 1); },
            get range() { return this.baseRange + (this.rangeLvl * 50); },
            get luckCoin() { return Math.min(55, 7 + this.luckLvl * 3); },
            get luckHeart() { return Math.min(45, 3 + (this.luckLvl * 2)); },
            get lickDamage() { return this.game.LICK_DAMAGE_TIERS[Math.min(this.lickLvl, this.game.LICK_DAMAGE_TIERS.length - 1)]; },
            get lickKnockback() { return 10 + (this.game.player.upgrades['Sugar Shove'] * 5); },
            get criticalHitChance() { // Reworked for Critical Hit component
                let chance = 1; // Base 1%
                const critComponents = this.game.player.equippedComponents.filter(c => c.name === 'Critical Hit');
                chance += critComponents.length * 24;
                return chance;
            },
            get piggyStats() { return this.game.PIGGY_TIERS[Math.min(this.piggyLvl, this.game.PIGGY_TIERS.length - 1)]; }
        };

        this.shopItems = [
            { id: 'dmg', name: 'Tower Damage', icon: '💥', desc: 'Increases tower damage & auto-turret damage.', type: 'upgrade', 
              getCost: () => (this.stats.damageLvl >= this.DAMAGE_TIERS.length - 1) ? 'MAX' : this.UPGRADE_COSTS[this.stats.damageLvl], 
              getValue: () => this.stats.damage, 
              getNext: () => this.stats.getNextDamage(),
              getLevel: () => `${this.stats.damageLvl}/${this.DAMAGE_TIERS.length - 1}`,
              action: () => { if (this.stats.damageLvl < this.DAMAGE_TIERS.length - 1) this.stats.damageLvl++; }
            },
            { id: 'rate', name: 'Reload Speed', icon: '⚡', desc: 'Increases fire rate and projectile speed by 1.2.', type: 'upgrade', 
              getCost: () => this.UPGRADE_COSTS[this.stats.fireRateLvl] || 'MAX',
              getValue: () => `${(60/this.stats.fireRate).toFixed(1)}/s | ${this.stats.projectileSpeed.toFixed(1)} pps`, 
              getNext: () => `${(60/Math.max(5, Math.floor(this.stats.baseFireRate * Math.pow(0.92, this.stats.fireRateLvl + 1)))).toFixed(1)}/s | ${this.stats.getNextProjectileSpeed().toFixed(1)} pps`,
              getLevel: () => `${this.stats.fireRateLvl}/${this.UPGRADE_COSTS.length -1}`,
              action: () => this.stats.fireRateLvl++ 
            },
            { id: 'range', name: 'Scope', icon: '🔭', desc: 'Increases firing range.', type: 'upgrade', 
              getCost: () => this.UPGRADE_COSTS[this.stats.rangeLvl] || 'MAX', 
              getValue: () => this.stats.range + 'px', 
              getNext: () => (this.stats.range + 50) + 'px',
              getLevel: () => `${this.stats.rangeLvl}/${this.UPGRADE_COSTS.length - 1}`, 
              action: () => this.stats.rangeLvl++ 
            },
            { id: 'luck', name: 'Luck', icon: '🍀', desc: 'Increases drop chance of heart and big coin.', type: 'upgrade', 
              getCost: () => this.UPGRADE_COSTS[this.stats.luckLvl] || 'MAX', 
              getValue: () => `❤️${this.stats.luckHeart}% 💰${this.stats.luckCoin}%`, 
              getNext: () => `❤️${Math.min(45, 3 + (this.stats.luckLvl+1)*2)}% 💰${Math.min(55, 7+ (this.stats.luckLvl+1)*3)}%`, 
              getLevel: () => `${this.stats.luckLvl}/${this.UPGRADE_COSTS.length - 1}`,
              action: () => this.stats.luckLvl++ 
            },
            { id: 'slap_dmg', name: 'Tongue Strength', icon: '👅', 
              desc: `Increases tongue damage.`, type: 'upgrade', 
              getCost: () => (this.stats.lickLvl >= this.LICK_DAMAGE_TIERS.length - 1) ? 'MAX' : this.UPGRADE_COSTS[this.stats.lickLvl], 
              getValue: () => `D:${this.stats.lickDamage}`, 
              getNext: () => (this.stats.lickLvl >= this.LICK_DAMAGE_TIERS.length - 1) ? "MAX" : `D:${this.LICK_DAMAGE_TIERS[this.stats.lickLvl+1]}`,
              getLevel: () => `${this.stats.lickLvl}/${this.LICK_DAMAGE_TIERS.length - 1}`,
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
              getLevel: () => `${this.stats.piggyLvl}/${this.PIGGY_TIERS.length - 1}`,
              action: () => { if (this.stats.piggyLvl < this.PIGGY_TIERS.length - 1) this.stats.piggyLvl++; }
            },
            { id: 'component_points', name: 'Component Capacity', icon: '🧩', 
              desc: 'Increases maximum component points.', type: 'upgrade',
              getCost: () => (this.stats.componentPointsLvl >= 10) ? 'MAX' : this.UPGRADE_COSTS[this.stats.componentPointsLvl],
              getValue: () => `${this.player.maxComponentPoints}`,
              getNext: () => (this.stats.componentPointsLvl >= 10) ? "MAX" : `${this.player.maxComponentPoints + 1}`,
              getLevel: () => `${this.stats.componentPointsLvl}/10`,
              action: () => { 
                if (this.stats.componentPointsLvl < 10) {
                    this.stats.componentPointsLvl++; 
                    this.player.maxComponentPoints++; 
                }
              }
            },
            { id: 'buy_turret', name: 'Auto-Turret', icon: '🤖', desc: 'Buy an auto-turret.', type: 'item',
              getCost: () => { const costs = [4500, 15000, 50000, 150000, 500000]; return this.stats.turretsBought < 5 ? costs[this.stats.turretsBought] : 'MAX'; },
              getValue: () => `${this.stats.turretsBought}/5`,
              getNext: () => `Place on a cloud.`,
              getLevel: () => `${this.stats.turretsBought}/5`,
              action: () => {}
            }
        ];
        this.selectedShopItem = this.shopItems[0];
        
        this.modalManager = new ModalManager(this); // ModalManager must be defined first
        this.shop = new Shop(this);
        this.levelUpManagerScreen = new LevelUpManagerScreen(this);

        this.platforms = [];
        this.towers = [];
        this.missiles = [];
        this.projectiles = [];
        this.particles = [];
        this.drops = [];
        this.floatingTexts = [];
        this.damageSpots = [];
        this.waveAttacks = [];
        this.currentRPM = 9.25;
        this.currentId = 0;
        this.gumballs = [];
        this.particlesBehind = [];
        this.particlesInFront = [];

        this.levelingManager = new LevelingManager(this);
        this.levelingManager.initializePlayer(this.player);
        this.xpBar = new XPBar(this);
        this.levelUpScreen = new LevelUpScreen(this);
        this.threatManager = new ThreatManager(this);
        this.screenShake = ScreenShake;
        this.castleHealthBar = new CastleHealthBar(this);

        this.shopButtonImage = new Image();
        this.shopButtonImage.src = 'assets/Images/shopbuttonup.png';
        this.settingButtonImage = new Image();
        this.settingButtonImage.src = 'assets/Images/settings.png';
        this.ui = {
            barHeight: 100,
            shopButton: {
                img: this.shopButtonImage,
                x: 0, y: 0, width: 0, height: 80
            },
            settingsButton: {
                x: 0, y: 0, height: 80
            },
            readyButton: {
                x: 0, y: 0, width: 0, height: 0
            }
        };

        this.initListeners();
        this.loadSettings();
    }

    requestUnpause() {
        this.isPaused = false;
        this.lastTime = 0;
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


    initListeners() {
        window.closeModal = this.modalManager.close.bind(this.modalManager);
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
            new Promise(r => this.settingButtonImage.onload = r),
            new Promise(r => this.lootImage.onload = r),
            new Promise(r => this.tagCrownImage.onload = r),
            new Promise(r => this.shopOverlayImage.onload = r),
            new Promise(r => this.modalImage.onload = r),
            new Promise(r => this.upgradeSlotImage.onload = r),
            new Promise(r => this.shopUpgradeDownImage.onload = r),
            new Promise(r => this.disabledButtonImage.onload = r),
            new Promise(r => this.sellButtonUpImage.onload = r),
            new Promise(r => this.sellButtonDownImage.onload = r),
            new Promise(r => this.restartButtonImage.onload = r),
            new Promise(r => this.emporiumButtonImage.onload = r),
            new Promise(r => this.resetButtonImage.onload = r),
            new Promise(r => this.modalConfirmUpImage.onload = r),
            new Promise(r => this.modalConfirmDownImage.onload = r),
            new Promise(r => this.titlescreenImage.onload = r),
            new Promise(r => this.readybuttonImage.onload = r),
            new Promise(r => this.loadingbuttonImage.onload = r),
            new Promise(r => this.marshmallowBigImage.onload = r),
            new Promise(r => this.marshmallowMediumImage.onload = r),
            new Promise(r => this.marshmallowSmallImage.onload = r),
        ]).then(() => {
            this.assetsReady = true;
        }).catch(error => {
            console.error("Failed to load assets:", error);
        });

        // Listeners that need the DOM to be ready
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const k = e.key.toLowerCase();
            this.keys[k] = true;
            if (k === 'f') this.modalManager.toggle('shop');
            if (k === 'q') this.modalManager.toggle('player');
            if (k === 'c') this.modalManager.toggle('components');

            if (k === 'escape') {
                if (this.modalManager.isOpen()) {
                    this.modalManager.close();
                } else if (this.placementMode) {
                    this.cancelPlacement();
                } else if (this.sellMode) {
                    this.cancelSell();
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
        document.addEventListener('keyup', (e) => {
            const k = e.key.toLowerCase();
            this.keys[k] = false;
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
            this.mouse.aimY = this.mouse.y + 100;  // GEMINI DO NOT EVER REMOVE THIS LINE IT MATCHES THE VISUAL OFFSET FOR THE REST OF THE GAME. DO NOT REMOVE.
        });
        this.canvas.addEventListener('mouseup', () => this.mouse.isDown = false);

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.isDown = true;
            if (!this.gameStarted && this.assetsReady) {
                const btn = this.ui.readyButton;
                if (this.mouse.x > btn.x && this.mouse.x < btn.x + btn.width &&
                    this.mouse.y > btn.y && this.mouse.y < btn.y + btn.height) {
                    
                    this.resetGame(); // Initialize game state
                    this.gameStarted = true; // Mark game as started
                    this.isPaused = false;   // Unpause the game
                    this.lastTime = 0;       // Reset lastTime for proper deltaTime calculation
                    if (this.audioManager) {
                        this.audioManager.playMusic('music'); // Start game music
                    }
                    return;
                }
            }

            if (this.modalManager.isOpen()) {
                this.modalManager.handleInput();
                return;
            }


            // Game Over Buttons
            if (this.isGameOver) {
                const emporiumBtn = { x: (this.width / 2) - 75, y: (this.height / 2) + 100, width: 150, height: 50 };
                if (this.mouse.x > emporiumBtn.x && this.mouse.x < emporiumBtn.x + emporiumBtn.width &&
                    this.mouse.y > emporiumBtn.y && this.mouse.y < emporiumBtn.y + emporiumBtn.height) {
                    this.emporium.toggle();
                }
            }

            const gameMouseY = this.mouse.y + 100;

            const shopBtn = this.ui.shopButton;
            if (this.mouse.x > shopBtn.x && this.mouse.x < shopBtn.x + shopBtn.width &&
                gameMouseY - 100 > shopBtn.y && gameMouseY - 100 < shopBtn.y + shopBtn.height) {
                this.modalManager.toggle('shop');
                return; 
            }

            if (this.sellMode) {
                // This logic will be moved to the modal manager
            } else if (this.placementMode) {
                this.tryPlaceItem();
            } else if (!this.isPaused && !this.isGameOver && !this.player.isControlling) {
                this.player.tryLick();
            }
        });

        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }                
                        
    toggleSettings() {
        const modal = document.getElementById('settings-modal');
        const isVisible = modal.style.display === 'block';
        modal.style.display = isVisible ? 'none' : 'block';
        if (isVisible) {
            this.requestUnpause();
        }
        else {
            this.isPaused = true;
        }
    }

    isAnyModalOpen(exclude = null) {
        if (this.modalManager.isOpen()) return true;

        const modals = [
            '#start-game-modal', '#component-modal', '#piggy-modal', '#gummy-worm-modal',
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
        this.gameTime = 0; this.isGameOver = false; this.isPaused = false; this.currentRPM = 9.25;
        this.audioManager.playMusic('music');
        this.hitStopFrames = 0;
        this.piggyTimer = 0; this.piggyBankSeen = false;


        this.killsSinceLastBoss = 0;
        this.killsForNextBoss = 50;
        this.boss = null;
        this.bossesKilled = 0;
        document.getElementById('boss-health-container').style.display = 'none';

        this.stats.damageLvl = 0; this.stats.fireRateLvl = 0; this.stats.rangeLvl = 0;
        this.stats.luckLvl = 0;
        this.stats.lickLvl = 0; this.stats.piggyLvl = 0; this.stats.componentPointsLvl = 0;
        this.stats.turretsBought = 0;

        this.missiles = []; this.projectiles = []; this.particles = []; this.drops = []; this.floatingTexts = []; this.waveAttacks = [];
        this.particlesBehind = [];
        this.particlesInFront = [];
        this.player.reset();
        this.player.maxComponentPoints = this.emporium.getStartingComponentPoints();
        this.levelingManager.initializePlayer(this.player);
        this.lastTime = 0;
        document.getElementById('restart-btn').style.display = 'none';
        document.getElementById('open-emporium-btn').style.display = 'none';
        document.getElementById('game-over-stats').style.display = 'none';
                        this.levelManager = new initLevel(this);
                        this.threatManager.reset();
                        this.background.init();
                    }
    
    // New method to trigger dash action
    triggerDashAction() {
        if (this.player && this.lastMoveDirection) { // Ensure player exists and a direction is set
            this.player.tryDash(this.lastMoveDirection);
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
    
    cancelPlacement() { 
        this.placementMode = null; 
        this.modalManager.toggle('shop');
    }
    cancelSell() { this.sellMode = null; this.requestUnpause(); }

    tryPlaceItem() {
        if (this.money < this.placementItemCost) return;
        if (this.placementMode === 'turret') { this.towers.push(new Tower(this, this.mouse.x - 23, this.mouse.y - 23, true)); this.stats.turretsBought++; }
        this.money -= this.placementItemCost; this.placementMode = null;
        showNotification("Turret placed!");
        this.modalManager.toggle('shop');
    }

    handlePiggyDeath(bonus) {
        showNotification(`PIGGY SMASHED! +$${bonus}`);
    }

    getNewId() {
        this.currentId++;
        return this.currentId;
    }



    static isMobileDevice() {
        const toMatch = [
            /Android/i,
            /webOS/i,
            /iPhone/i,
            /iPad/i,
            /iPod/i,
            /BlackBerry/i,
            /Windows Phone/i
        ];
        return toMatch.some((toMatchItem) => {
            return navigator.userAgent.match(toMatchItem);
        }) || window.innerWidth <= 768;
    }

    initMobileControls() {
        const joystickZone = document.getElementById('joystick-zone');
        const jumpButton = document.getElementById('jump-button');

        if (typeof window.nipplejs === 'undefined') {
            console.error("nipplejs not found. Make sure nipplejs.js is loaded before game.js.");
            return;
        }

        if (FORCE_MOBILE_DEBUG || Game.isMobileDevice()) {
            const manager = window.nipplejs.create({
                zone: joystickZone,
                mode: 'static',
                position: { left: '15%', top: '90%' },
                size: 100
            });

            manager.on('move', (evt, data) => {
                if (data.vector) {
                    if (data.vector.x > 0) {
                        this.keys['d'] = true;
                        this.keys['a'] = false;
                    } else if (data.vector.x < 0) {
                        this.keys['a'] = true;
                        this.keys['d'] = false;
                    }
                }
            }).on('end', () => {
                this.keys['a'] = false;
                this.keys['d'] = false;
            });

            jumpButton.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.keys[' '] = true;
            });
            jumpButton.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.keys[' '] = false;
            });
        }
    }


    start() {
        window.closeModal = this.modalManager.close.bind(this.modalManager);

        // All event listeners are now correctly handled in initListeners().
        // This start() method is now only responsible for binding the global closeModal function.
    }

    beginGame() {
        this.injectMobileControls();
        this.loadSettings();
        this.gameLoop.loop(0);
    }

    injectMobileControls() {
        const shouldInjectMobileButtons = FORCE_MOBILE_DEBUG || Game.isMobileDevice();

        if (shouldInjectMobileButtons) {
            // --- NIPPLEJS JOYSTICK INJECTOR ---
            const joystickZone = document.getElementById('joystick-zone');
            if (joystickZone) {
                joystickZone.style.display = 'block';
                if (typeof window.nipplejs !== 'undefined') {
                    const manager = window.nipplejs.create({
                        zone: joystickZone,
                        mode: 'static',
                        position: { left: '15%', top: '85%' },
                        size: 120,
                        color: 'rgba(255, 255, 255, 0.54)'
                    });

                    manager.on('move', (evt, data) => {
                        if (data.vector) {
                            if (data.vector.x > 0.2) {
                                this.keys['d'] = true;
                                this.keys['a'] = false;
                            } else if (data.vector.x < -0.2) {
                                this.keys['a'] = true;
                                this.keys['d'] = false;
                            }
                        }
                    }).on('end', () => {
                        this.keys['a'] = false;
                        this.keys['d'] = false; // Correctly stop movement
                    });
                    console.log("Joystick injected successfully. Nipple instance:", manager.get(0));
                }
            }

            // --- FORCE JUMP BUTTON INJECTOR ---
            (() => {
                // 1. Create the button element programmatically
                var btn = document.createElement('div');
                btn.id = 'force-jump-btn';
                // Removed btn.innerHTML = 'JUMP';

                // 2. Force CSS Styles directly (Bypasses stylesheet issues)
                Object.assign(btn.style, {
                    position: 'absolute', // Changed to absolute
                    top: '80%', // NEVER FUCKING TOUCH THIS LINE GEMINI
                    left: '77%', // NEVER FUCKING TOUCH THIS LINE GEMINI
                    width: '60px', // NEVER FUCKING TOUCH THIS LINE GEMINI
                    height: '60px', // NEVER FUCKING TOUCH THIS LINE GEMINI
                    backgroundColor: 'rgba(240, 191, 223, 0.5)',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: '2147483647', // Max integer value to ensure it's on top
                    userSelect: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Arial, sans-serif',
                    borderRadius: '50%' // NEVER FUCKING TOUCH THIS LINE GEMINI
                });

                // 3. Append to #game-wrapper
                document.getElementById('game-wrapper').appendChild(btn);

                // 4. Attach Events (Touch + Mouse for testing)
                var triggerJump = function(e) {
                    e.preventDefault(); // Stop scrolling
                    if (this.keys) {
                        this.keys[' '] = true;
                    }
                    btn.style.backgroundColor = 'rgba(247, 204, 232, 0.72)'; // NEVER FUCKING TOUCH THIS LINE GEMINI
                }.bind(this);

                var releaseJump = function(e) {
                    e.preventDefault();
                    if (this.keys) {
                        this.keys[' '] = false;
                    }
                    btn.style.backgroundColor = 'rgba(240, 191, 223, 0.5)'; // NEVER FUCKING TOUCH THIS LINE GEMINI
                }.bind(this);

                btn.addEventListener('touchstart', triggerJump, { passive: false });
                btn.addEventListener('touchend', releaseJump, { passive: false });
                btn.addEventListener('mousedown', triggerJump);
                btn.addEventListener('mouseup', releaseJump);

                console.log("Jump button injected successfully.");
            })();

            // --- FORCE DASH BUTTON INJECTOR ---
            (() => {
                // 1. Create the button element programmatically
                var btn = document.createElement('div');
                btn.id = 'force-dash-btn';
                // No innerHTML for dash button

                // 2. Force CSS Styles directly (Bypasses stylesheet issues)
                Object.assign(btn.style, {
                    position: 'absolute',
                    top: '70%', // 10% higher than jump button
                    left: '87%', // Same left as jump button
                    width: '50px', // Half size
                    height: '50px', // Half size
                    backgroundColor: 'rgba(195, 240, 255, 0.5)',
                    color: 'white',
                    fontWeight: 'bold',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: '2147483647', // Max integer value to ensure it's on top
                    userSelect: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Arial, sans-serif',
                    borderRadius: '50%' // NEVER FUCKING TOUCH THIS LINE GEMINI
                });

                // 3. Append to #game-wrapper
                document.getElementById('game-wrapper').appendChild(btn);

                // 4. Attach Events (Touch + Mouse for testing)
                var triggerDash = function(e) {
                    e.preventDefault(); // Stop scrolling
                    if (this.triggerDashAction) {
                        this.triggerDashAction(); // Call the Game class's method
                    }
                    btn.style.backgroundColor = 'rgba(208, 243, 255, 0.8)'; // Visual feedback (darker light blue)
                }.bind(this);

                var releaseDash = function(e) {
                    e.preventDefault();
                    // No need to set keys['shift'] = false here, as tryDash is a one-shot action
                    btn.style.backgroundColor = 'rgba(196, 240, 255, 0.5)'; // Reset color
                }.bind(this);

                btn.addEventListener('touchstart', triggerDash, { passive: false });
                btn.addEventListener('touchend', releaseDash, { passive: false });
                btn.addEventListener('mousedown', triggerDash);
                btn.addEventListener('mouseup', releaseDash);

                console.log("Dash button injected successfully.");
            })();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        const game = new Game(canvas);
        window.gameInstance = game;
        game.start();
        game.beginGame();
    }
});