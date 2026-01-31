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
import SwipeParticle from './swipeParticle.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.width = this.canvas.width;
        this.boss = null;
        this.bossesKilled = 0;
        this.swipeTrail = [];
        this.swipeParticles = [];

        // Define playable area height and mobile control zone height
        this.PLAYABLE_AREA_HEIGHT = this.canvas.height
        this.MOBILE_CONTROL_ZONE_HEIGHT = (FORCE_MOBILE_DEBUG || Game.isMobileDevice()) ? 500 : 0; // Add 500px for controls on mobile
        this.height = this.PLAYABLE_AREA_HEIGHT + this.MOBILE_CONTROL_ZONE_HEIGHT; // Total canvas height
        this.canvas.height = this.height; // Update canvas element height
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
        this.armsImage = new Image();
        this.armsImage.src = 'assets/Images/arms.png';
        this.towersImage = new Image();
        this.towersImage.src = 'assets/Images/towers.png';
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
                this.cancelButtonImage = new Image();
                this.cancelButtonImage.src = 'assets/Images/cancelbutton.png';
                this.cancelButtonActiveImage = new Image(); // Active state for cancel button
                this.cancelButtonActiveImage.src = 'assets/Images/cancelbutton.png';
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
        this.sellButtonUpImage = new Image();
        this.sellButtonUpImage.src = 'assets/Images/sellbuttonup.png';
        this.sellButtonDownImage = new Image();
        this.sellButtonDownImage.src = 'assets/Images/sellbuttondown.png';

        this.awaitingSellConfirmation = false; // New state variable

        this.lastClickTime = 0; // For double-tap detection
        this.lastClickedTower = null; // For double-tap detection
        this.doubleTapThreshold = 300; // milliseconds for double-tap
        this.doubleTapTimeoutId = null; // NEW: To manage double-tap timeout
        this.turretCostTextColor = '#783e9eff'; // NEW: Color for turret cost text

        this.PASTEL_COLORS = ['#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', '#9bf6ff', '#a0c4ff', '#bdb2ff'];
        this.FROSTING_COLORS = ['#ffadc8c9', '#ffd8cc83', '#ffb6c3a8', '#ffb2bcc4', '#fccef4a6', '#ffa6c8c7', '#fca4e6d5', '#ff81aba1', '#ffb3de', '#f4acb7'];
        this.ENEMY_FROSTING_COLORS = ['#8ab0f0', '#e0e3a0', '#a8e8b3ff', '#9bf6ff', '#b894daff', '#ff9d70ff'];
        this.DAMAGE_TIERS = [10, 14, 18, 23, 28, 34, 40, 46, 53, 70, 78, 86, 94, 102, 110, 118, 126, 136, 146, 156, 166, 176, 186, 197, 208, 220, 234];
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
        this.isBuilding = false;
        this.highlightedSlot = null;
        this.isCancelingBuild = false;
        this.cancelAnimTimer = 0;
        this.cancelAnimDuration = 20; // Match tower sell duration
        this.vignetteAlpha = 0; // For build mode vignette fade
        this.cancelAnimData = { x: 0, y: 0, width: 0, height: 0 };


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
        this.timeScale = 1; // New property for controlling game speed


        this.player = new Player(this);

        this.stats = {
            damageLvl: 0,
            fireRateLvl: 0,
            rangeLvl: 0,
            luckLvl: 0,
            lickLvl: 0,
            piggyLvl: 0,
            baseDamage: 10,
            baseFireRate: 55,
            baseRange: 395,
            turretsBought: 0, // This will now track auto-turrets placed
            // maxTurrets: 5, // Removed
            maxTurretsCap: 3, // New: initial max turrets
            maxTurretsLvl: 0, // New: level for max turrets upgrade
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
            get piggyStats() { return this.game.PIGGY_TIERS[Math.min(this.piggyLvl, this.game.PIGGY_TIERS.length - 1)]; },
            get maxTurretsAvailable() { return this.maxTurretsCap + (this.maxTurretsLvl * 2); } // Current max turrets calculation
        };

        this.shopItems = [
            { id: 'dmg', name: 'Tower Damage', icon: '💥', desc: 'Increases tower damage & auto-turret damage.', type: 'upgrade', 
              getCost: () => (this.stats.damageLvl >= this.DAMAGE_TIERS.length - 1) ? 'MAX' : this.UPGRADE_COSTS[this.stats.damageLvl], 
              getValue: () => this.stats.damage * 0.5, 
              getNext: () => this.stats.getNextDamage() * 0.5,
              getLevel: () => `${this.stats.damageLvl}/${this.DAMAGE_TIERS.length - 1}`,
              action: () => { if (this.stats.damageLvl < this.DAMAGE_TIERS.length - 1) this.stats.damageLvl++; }
            },
            { id: 'rate', name: 'Reload Speed', icon: '⚡', desc: 'Increases fire rate and projectile speed by 1.2.', type: 'upgrade', 
              getCost: () => this.UPGRADE_COSTS[this.stats.fireRateLvl] || 'MAX',
              getValue: () => `${((60/this.stats.fireRate) * 0.5).toFixed(1)}/s | ${this.stats.projectileSpeed.toFixed(1)} pps`, 
              getNext: () => `${((60/Math.max(5, Math.floor(this.stats.baseFireRate * Math.pow(0.92, this.stats.fireRateLvl + 1)))) * 0.5).toFixed(1)}/s | ${this.stats.getNextProjectileSpeed().toFixed(1)} pps`,
              getLevel: () => `${this.stats.fireRateLvl}/${this.UPGRADE_COSTS.length -1}`,
              action: () => this.stats.fireRateLvl++ 
            },
            { id: 'range', name: 'Scope', icon: '🔭', desc: 'Increases firing range.', type: 'upgrade', 
              getCost: () => this.UPGRADE_COSTS[this.stats.rangeLvl] || 'MAX', 
              getValue: () => (this.stats.range * 0.5) + 'px', 
              getNext: () => ((this.stats.range + 50) * 0.5) + 'px',
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
            { id: 'max_turrets', name: 'Max Turrets', icon: '⚙️',
              desc: 'Increases the maximum number of turrets you can place.', type: 'upgrade',
              getCost: () => (this.stats.maxTurretsLvl >= 10) ? 'MAX' : this.UPGRADE_COSTS[this.stats.maxTurretsLvl], // Max 10 levels for now
              getValue: () => `${this.stats.maxTurretsAvailable}`,
              getNext: () => (this.stats.maxTurretsLvl >= 10) ? "MAX" : `${this.stats.maxTurretsAvailable + 2}`,
              getLevel: () => `${this.stats.maxTurretsLvl}/10`,
              action: () => {
                if (this.stats.maxTurretsLvl < 10) {
                    this.stats.maxTurretsLvl++;
                }
              }
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


        this.buildButtonImage = new Image();
        this.buildButtonImage.src = 'assets/Images/buildbutton.png';
        this.shopButtonImage = new Image(); // NEWLY ADDED for the relocated shop button
        this.shopButtonImage.src = 'assets/Images/shopbuttonup.png';
        this.settingButtonImage = new Image();
        this.settingButtonImage.src = 'assets/Images/settings.png';

        this.ui = {
            barHeight: (FORCE_MOBILE_DEBUG || Game.isMobileDevice()) ? 500 : 0, // 500px for mobile, 0px for PC
            buildButton: {
                img: this.buildButtonImage, // This will be dynamically managed
                x: 0, y: 0, width: 80, height: 80,
                isAnimating: false,
                animTimer: 0,
                animDuration: 12
            },
            cancelButton: { // New: for the cancel button during build mode
                img: this.cancelButtonImage,
                x: 0, y: 0, width: 80, height: 80,
                activeImg: this.cancelButtonActiveImage,
            },
            shopButton: { // NEWLY ADDED for the relocated shop button
                img: this.shopButtonImage,
                x: 0, y: 0, width: 80, height: 80,
                isAnimating: false,
                animTimer: 0,
                animDuration: 12
            },
            settingsButton: {
                img: this.settingButtonImage, // Added img property
                x: 0, y: 0, width: 80, height: 80,
                isAnimating: false,
                animTimer: 0,
                animDuration: 12
            },
            readyButton: {
                x: 0, y: 0, width: 0, height: 0
            },
            sellButton: {
                visible: false, alpha: 0, x: 0, y: 0, width: 80, height: 80
            },
            sellButton: {
                visible: false, alpha: 0, x: 0, y: 0, width: 120, height: 120,
                animTimer: 0,
                animDuration: 12, // 20% faster (was 15)
                isAnimatingIn: false,
                isAnimatingOut: false
            },
            moneyTextPos: { x: 0, y: 0 },
            xpBarPos: { x: 0, y: 0 }
        };

        this.uiShake = { money: 0, xp: 0, turretCost: 0 };

        this.initListeners();
        this.injectMobileControls();
    }

    addMoney(amount) {
        if (amount <= 0) return;
        this.money += amount;
        this.totalMoneyEarned += amount;
        this.triggerMoneyAnimation(amount);
    }

    addXp(amount) {
        if (amount <= 0) return;
        this.levelingManager.grantXpToPlayer(amount);
        this.triggerXpAnimation(amount);
    }

    triggerMoneyAnimation(amount) {
        this.uiShake.money = 15;
        const pos = this.ui.moneyTextPos;
        this.floatingTexts.push(new FloatingText(this, pos.x, pos.y, `+$${amount}`, '#fdffb6'));
    }

    triggerXpAnimation(amount) {
        this.uiShake.xp = 15;
        const pos = this.ui.xpBarPos;
        this.floatingTexts.push(new FloatingText(this, pos.x, pos.y, `+${amount.toFixed(0)} XP`, '#9bf6ff'));
    }

    triggerTurretCostAnimation() {
        this.uiShake.turretCost = 15;
    }


    findNearestAvailableSlot(mouseX, mouseY) {
        let nearestSlot = null;
        let minDistance = Infinity;

        // Special case for the cancel button in build mode
        if (this.isBuilding) {
            const cancelBtn = this.ui.cancelButton;
            const uiScale = 1.55;
            const scaledWidth = cancelBtn.width * uiScale;
            const scaledHeight = cancelBtn.height * uiScale;
            const cancelBtnCenterX = cancelBtn.x + scaledWidth / 2;
            const cancelBtnCenterY = cancelBtn.y + scaledHeight / 2;
            const dist = Math.hypot(mouseX - cancelBtnCenterX, mouseY - cancelBtnCenterY);

            if (dist < minDistance) {
                minDistance = dist;
                nearestSlot = {
                    id: 'cancel',
                    x: cancelBtnCenterX,
                    y: cancelBtnCenterY,
                    canPlace: false // This flag indicates it's not a real buildable slot
                };
            }
        }
        const checkPlatformSlots = (platform, slots) => {
            slots.forEach(slot => {
                const turretWidth = 137;
                const turretHeight = 190;
                
                const slotCenterX = slot.x;
                const slotCenterY = slot.y;

                const dist = Math.hypot(mouseX - slotCenterX, mouseY - slotCenterY);

                if (dist < minDistance) {
                    minDistance = dist;
                    let canPlace = true;
                    if (slot.isOccupied) canPlace = false;
                    
                    nearestSlot = { 
                        ...slot, 
                        platform: platform, 
                        canPlace: canPlace 
                    }; 
                }
            });
        };

        this.platforms.forEach(platform => {
            if (platform.slots) { 
                checkPlatformSlots(platform, platform.slots);
            }
        });
        return nearestSlot;
    }

    sellTower(tower) {
        if (!tower) return;
    
        const refundAmount = this.getRefundAmount(this.towers.length - 1);
        this.money += refundAmount;
    
        // Free up the platform slot
        this.platforms.forEach(p => {
            if (p.slots) {
                const slot = p.slots.find(s => s.id === tower.platformSlotId);
                if (slot) {
                    slot.isOccupied = false;
                }
            }
        });
    
        tower.sell(); // Trigger the sell animation
        showNotification(`Sold +$${refundAmount}!`);
        this.triggerTurretCostAnimation();
        this.cancelSell();
    }
    
    cancelSell() {
        this.towerToSell = null;
        const sellBtn = this.ui.sellButton;
        sellBtn.isAnimatingIn = false;
        sellBtn.isAnimatingOut = true;
        sellBtn.animTimer = 0;
        this.awaitingSellConfirmation = false;
        this.lastClickTime = 0; // Reset double-tap state
        this.lastClickedTower = null; // Reset double-tap state
        if (this.doubleTapTimeoutId) { // Clear any pending double-tap timeout
            clearTimeout(this.doubleTapTimeoutId);
            this.doubleTapTimeoutId = null;
        }
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
        this.loadSettings();

        // Stage 1: Load essential UI images first.
        Promise.all([
            new Promise((res, rej) => { this.titlescreenImage.onload = res; this.titlescreenImage.onerror = rej; }),
            new Promise((res, rej) => { this.loadingbuttonImage.onload = res; this.loadingbuttonImage.onerror = rej; }),
            new Promise((res, rej) => { this.readybuttonImage.onload = res; this.readybuttonImage.onerror = rej; })
        ]).then(() => {
            // Once the essential UI is loaded, start the game loop.
            this.gameLoop.loop(0);
        }).catch(error => console.error("Critical UI could not be loaded:", error));

        // Stage 2: Load all other game assets in the background.
        Promise.all([
            this.audioManager.loadingPromise,
            this.background.load(),
            new Promise(r => { this.platformImage.onload = r; this.platformImage.onerror = r; }),
            new Promise(r => { this.groundImage.onload = r; this.groundImage.onerror = r; }),
            new Promise(r => { this.castleImage.onload = r; this.castleImage.onerror = r; }),
            new Promise(r => { this.towerImage.onload = r; this.towerImage.onerror = r; }),
            new Promise(r => { this.armsImage.onload = r; this.armsImage.onerror = r; }),
            new Promise(r => { this.towersImage.onload = r; this.towersImage.onerror = r; }),
            ...this.jellybeanImages.map(img => new Promise(r => { img.onload = r; img.onerror = r; })),
            ...this.gummyclusterImages.map(img => new Promise(r => { img.onload = r; img.onerror = r; })),
            ...this.gummybearImages.map(img => new Promise(r => { img.onload = r; img.onerror = r; })),
            new Promise(r => { this.buildButtonImage.onload = r; this.buildButtonImage.onerror = r; }),
            new Promise(r => { this.shopButtonImage.onload = r; this.shopButtonImage.onerror = r; }),
            new Promise(r => { this.settingButtonImage.onload = r; this.settingButtonImage.onerror = r; }),
            new Promise(r => { this.lootImage.onload = r; this.lootImage.onerror = r; }),
            new Promise(r => { this.tagCrownImage.onload = r; this.tagCrownImage.onerror = r; }),
            new Promise(r => { this.shopOverlayImage.onload = r; this.shopOverlayImage.onerror = r; }),
            new Promise(r => { this.modalImage.onload = r; this.modalImage.onerror = r; }),
            new Promise(r => { this.upgradeSlotImage.onload = r; this.upgradeSlotImage.onerror = r; }),
            new Promise(r => { this.shopUpgradeDownImage.onload = r; this.shopUpgradeDownImage.onerror = r; }),
            new Promise(r => { this.disabledButtonImage.onload = r; this.disabledButtonImage.onerror = r; }),
            new Promise(r => { this.cancelButtonImage.onload = r; this.cancelButtonImage.onerror = r; }),
            new Promise(r => { this.cancelButtonActiveImage.onload = r; this.cancelButtonActiveImage.onerror = r; }),
            new Promise(r => { this.restartButtonImage.onload = r; this.restartButtonImage.onerror = r; }),
            new Promise(r => { this.emporiumButtonImage.onload = r; this.emporiumButtonImage.onerror = r; }),
            new Promise(r => { this.resetButtonImage.onload = r; this.resetButtonImage.onerror = r; }),
            new Promise(r => { this.modalConfirmUpImage.onload = r; this.modalConfirmUpImage.onerror = r; }),
            new Promise(r => { this.modalConfirmDownImage.onload = r; this.modalConfirmDownImage.onerror = r; }),
            new Promise(r => { this.marshmallowBigImage.onload = r; this.marshmallowBigImage.onerror = r; }),
            new Promise(r => { this.marshmallowMediumImage.onload = r; this.marshmallowMediumImage.onerror = r; }),
            new Promise(r => { this.marshmallowSmallImage.onload = r; this.marshmallowSmallImage.onerror = r; }),
            new Promise(r => { this.sellButtonUpImage.onload = r; this.sellButtonUpImage.onerror = r; }),
            new Promise(r => { this.sellButtonDownImage.onload = r; this.sellButtonDownImage.onerror = r; }),
        ]).then(() => {
            this.assetsReady = true;
        }).catch(error => console.error("Failed to load game assets:", error));

        // --- Keyboard and Mouse Listeners ---

        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;
            const k = e.key.toLowerCase();
            this.keys[k] = true;
            
            if (this.modalManager.isOpen() || this.isAnyModalOpen()) {
                if (k === 'escape') {
                    this.modalManager.close();
                } else if (k === 'f') { // Shop key
                    if (this.modalManager.activeModal === 'shop') {
                        this.modalManager.close();
                    } else {
                        this.modalManager.open('shop');
                    }
                } else if (k === 'c') { // Components key
                    if (this.modalManager.activeModal === 'components') {
                        this.modalManager.close();
                    } else {
                        this.modalManager.open('components');
                    }
                } else if (k === 'q') { // Player/Level Up key
                    if (this.modalManager.activeModal === 'player') {
                        this.modalManager.close();
                    } else {
                        this.modalManager.open('player');
                    }
                }
                return; // Block other game controls while modal is open
            }

            // --- Game Actions (Only run if no modal is open) ---
            if (k === 'f') {
                this.modalManager.open('shop');
            }
            if (k === 'c') {
                this.modalManager.open('components');
            }
            if (k === 'q') {
                this.modalManager.open('player');
            }

            if (k === 'e') {
                if (this.player.isControlling) {
                    this.player.exitTower();
                } else {
                    for (const tower of this.towers) {
                        if (tower.playerInRange) { this.player.enterTower(tower); break; }
                    }
                }
            }

            if (k === 'a') {
                this.lastMoveDirection = -1;
                if (Date.now() - this.player.lastAPress < 300) { this.player.tryDash(-1); }
                this.player.lastAPress = Date.now();
            }
            if (k === 'd') {
                this.lastMoveDirection = 1;
                if (Date.now() - this.player.lastDPress < 300) { this.player.tryDash(1); }
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
            const currentMouseX = (e.clientX - rect.left) * scaleX;
            const currentMouseY = (e.clientY - rect.top) * scaleY;
            this.mouse.x = currentMouseX;
            this.mouse.y = currentMouseY;
            this.mouse.aimY = this.mouse.y + 100; // Apply the +100 offset here consistently

            if (this.isBuilding) {
                const offset = this.screenShake.getOffset();
                const gameWorldMouseX = currentMouseX - offset.x;
                const gameWorldMouseY = currentMouseY - (offset.y - 100);
                this.highlightedSlot = this.findNearestAvailableSlot(gameWorldMouseX, gameWorldMouseY);
            }
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.isDown = true;
            
            // If we are awaiting sell confirmation, handle click on sell button or cancel
            if (this.awaitingSellConfirmation) {
                const sellBtn = this.ui.sellButton;
                if (this.mouse.x > sellBtn.x && this.mouse.x < sellBtn.x + sellBtn.width &&
                    this.mouse.aimY > sellBtn.y && this.mouse.aimY < sellBtn.y + sellBtn.height) {
                    this.sellTower(this.towerToSell);
                } else {
                    this.cancelSell();
                }
                return; // Consume the click
            }
            
            // Handle clicks on ready button, shop, build, settings buttons
            if (!this.gameStarted && this.assetsReady) {
                const btn = this.ui.readyButton;
                if (this.mouse.x > btn.x && this.mouse.x < btn.x + btn.width && this.mouse.y > btn.y && this.mouse.y < btn.y + btn.height) {
                    this.resetGame();
                    this.gameStarted = true;
                    this.isPaused = false;
                    this.lastTime = 0;
                    if (this.audioManager) { this.audioManager.playMusic('music'); }
                    return;
                }
            }
            if (this.modalManager.isOpen()) { this.modalManager.handleInput(); return; } // Handle clicks within modals
        
            const shopBtn = this.ui.shopButton;
            if (this.mouse.x > shopBtn.x && this.mouse.x < shopBtn.x + shopBtn.width && this.mouse.y > shopBtn.y && this.mouse.y < shopBtn.y + shopBtn.height) {
                this.modalManager.toggle('shop');
                shopBtn.isAnimating = true;
                shopBtn.animTimer = 0;
                this.audioManager.playSound('lick'); // Use a generic UI sound
                return;
            }
            const buildBtn = this.ui.buildButton;
            if (this.mouse.x > buildBtn.x && this.mouse.x < buildBtn.x + buildBtn.width && this.mouse.y > buildBtn.y && this.mouse.y < buildBtn.y + buildBtn.height) {
                if (!this.isBuilding) {
                    this.isBuilding = true;
                    this.audioManager.setBuildMode(true, false); // In build mode, not just muffled
                    this.ui.buildButton.img = this.ui.cancelButton.img;
                    this.timeScale = 0.05; // Game will be slowed
                    buildBtn.isAnimating = true;
                    buildBtn.animTimer = 0;
                    this.highlightedSlot = null; // Clear any previous highlighted slot
                } else { // If already in build mode, clicking the build button acts as cancel
                    this.isBuilding = false;
                    this.audioManager.setBuildMode(false, false);
                    this.ui.buildButton.img = this.buildButtonImage;
                    this.timeScale = 1; // Resume game speed
                    this.highlightedSlot = null;
                }
                return; // Consume the click
            }

            // Check for the new shop button position on the right
            if (this.mouse.x > shopBtn.x && this.mouse.x < shopBtn.x + shopBtn.width && this.mouse.y > shopBtn.y && this.mouse.y < shopBtn.y + shopBtn.height) {
                this.modalManager.toggle('shop');
                shopBtn.isAnimating = true;
                shopBtn.animTimer = 0;
                this.audioManager.playSound('lick');
                return;
            }

            const settingsBtn = this.ui.settingsButton;
            if (this.mouse.x > settingsBtn.x && this.mouse.x < settingsBtn.x + settingsBtn.width && this.mouse.y > settingsBtn.y && this.mouse.y < settingsBtn.y + settingsBtn.height) {
                this.toggleSettings();
                settingsBtn.isAnimating = true;
                settingsBtn.animTimer = 0;
                return;
            }
            
            // NEW DOUBLE-TAP LOGIC FOR SELLING TURRETS (Clean Implementation)
            let clickedTower = null;
            for (const tower of this.towers) {
                // Increase hitbox for click detection slightly
                const clickHitboxX = tower.x - 5;
                const clickHitboxY = tower.y - 5;
                const clickHitboxWidth = tower.width + 10;
                const clickHitboxHeight = tower.height + 10;

                if (this.mouse.x > clickHitboxX && this.mouse.x < clickHitboxX + clickHitboxWidth &&
                    this.mouse.aimY > clickHitboxY && this.mouse.aimY < clickHitboxY + clickHitboxHeight) {
                    clickedTower = tower;
                    break;
                }
            }

            if (clickedTower) {
                // If another sell was pending, cancel it before showing the new one.
                if (this.awaitingSellConfirmation && this.towerToSell !== clickedTower) {
                    this.cancelSell();
                }

                this.towerToSell = clickedTower;
                const sellBtn = this.ui.sellButton;
                
                // Position sell button in the center of the clicked tower
                sellBtn.x = 25 + this.towerToSell.x + (this.towerToSell.width / 2) - (sellBtn.width / 2);
                sellBtn.y = this.towerToSell.y + (this.towerToSell.height / 2) - (sellBtn.height / 2);
                sellBtn.visible = true;
                sellBtn.isAnimatingIn = true;
                sellBtn.isAnimatingOut = false;
                sellBtn.animTimer = 0;

                this.awaitingSellConfirmation = true;
                // NOTE: We do NOT return here, so the click can fall through to the lick action.
            } else {
                // Clicked nowhere or not on a tower (and no sell confirmation pending from a previous double-tap)
                // Clear any pending single-click timeout
                if (this.doubleTapTimeoutId) {
                    clearTimeout(this.doubleTapTimeoutId);
                    this.doubleTapTimeoutId = null;
                }
                
                // If sell button was visible, and we click elsewhere on the canvas, cancel it
                if (this.awaitingSellConfirmation) {
                    this.cancelSell();
                    return; // Consumed by cancel
                }

                // Only reset double-tap state if no tower was clicked AND no sell confirmation was pending.
                // This allows the single-click state to persist for a double-tap window.
                this.lastClickedTower = null;
                this.lastClickTime = 0;
            }
            
            if (this.player.isControlling) return;
            
            if (!this.isPaused && !this.isGameOver && !this.player.isControlling) {
                if (FORCE_MOBILE_DEBUG || Game.isMobileDevice()) {
                     handleSwipeStart(e);
                } else {
                    this.player.tryLick();
                }
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
            
            // Handle building logic after mouseup
            if (this.isBuilding) {
                // If the highlighted slot is the cancel button, just cancel the build.
                const isCancelAction = this.highlightedSlot && (this.highlightedSlot.id === 'cancel' || this.highlightedSlot.isOccupied);

                if (isCancelAction) {
                    // --- Start Cancel Animation ---
                    this.isBuilding = false; // Stop drawing the normal ghost
                    this.isCancelingBuild = true;
                    this.cancelAnimTimer = 0;
                    
                    // Store ghost turret's final position for the animation
                    const turretWidth = 137 * 0.9;
                    const turretHeight = 190 * 0.9;
                    this.cancelAnimData.width = turretWidth;
                    this.cancelAnimData.height = turretHeight;
                    this.cancelAnimData.x = this.highlightedSlot.x;
                    this.cancelAnimData.y = this.highlightedSlot.y;
                    this.cancelAnimData.id = this.highlightedSlot.id; // Store the ID for positioning

                    // Create "poof" effect at the correct location
                    const poofY = (this.highlightedSlot.id === 'cancel') ? this.highlightedSlot.y - (this.ui.cancelButton.height * 1.55 / 2) + 30 : this.highlightedSlot.y - 80;
                    for (let i = 0; i < 25; i++) {
                        this.particles.push(new Particle(this, this.highlightedSlot.x, poofY, 'rgba(255, 105, 180, 0.7)', 'smoke', 0.8));
                    }

                    this.audioManager.playSound('reset'); // Play a cancel sound
                } else if (this.highlightedSlot && this.highlightedSlot.canPlace) {
                    const cost = this.getNextTurretCost();
                    if (this.towers.length >= this.stats.maxTurretsAvailable) {
                        showNotification("Max turrets reached!");
                        // Poof effect for failed placement
                        const poofX = this.highlightedSlot.x;
                        const poofY = this.highlightedSlot.y - 80;
                        for (let i = 0; i < 25; i++) {
                            this.particles.push(new Particle(this, poofX, poofY, 'rgba(255, 105, 180, 0.7)', 'smoke', 0.8));
                        }
                    } else if (this.money < cost) {
                        showNotification("Not enough money!");
                    } else {
                        const turretWidth = 137;
                        const turretHeight = 190;
                        const turretX = this.highlightedSlot.x - (turretWidth / 2); 
                        const turretY = this.highlightedSlot.y - turretHeight + (turretHeight / 2);
                        const newTurret = new Tower(this, turretX, turretY, true, this.highlightedSlot.id); 
                        this.towers.push(newTurret);
                        this.money -= cost; 

                        // Mark the slot as occupied
                        let foundSlot = false;
                        for (const p of this.platforms) {
                            if (p.slots) {
                                const slotToOccupy = p.slots.find(s => s.id === this.highlightedSlot.id);
                                if (slotToOccupy) {
                                    slotToOccupy.isOccupied = true;
                                    foundSlot = true;
                                    break;
                                }
                            }
                        }
                        if (!foundSlot) console.error("Could not find and occupy slot with ID:", this.highlightedSlot.id);
                    }
                    this.triggerTurretCostAnimation();
                }
                // If not starting a cancel animation, exit build mode immediately
                if (!this.isCancelingBuild) {
                    this.isBuilding = false;
                    this.audioManager.setBuildMode(false, false);
                    this.highlightedSlot = null;
                    this.timeScale = 1; // Resume game speed
                    this.ui.buildButton.img = this.buildButtonImage;
                }
            }
        });

        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

        let isSwiping = false;
        let swipeStartTime = 0;
        let swipePath = [];

        const getCanvasCoords = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const scaleX = this.canvas.width / rect.width;
            const scaleY = this.canvas.height / rect.height;
            const clientX = e.touches ? e.touches[0].clientX : (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
            const clientY = e.touches ? e.touches[0].clientY : (e.changedTouches ? e.changedTouches[0].clientY : e.clientY);
            return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
        };

        const handleSwipeStart = (e) => {
            const { x, y } = getCanvasCoords(e);
            for (const tower of this.towers) {
                if (x > tower.x && x < tower.x + tower.width && y > tower.y && y < tower.y + tower.height) {
                    if (this.player.isControlling === tower) { this.player.exitTower(); return; }
                    else if (!this.player.isControlling && tower.playerInRange) { this.player.enterTower(tower); return; }
                }
            }
            isSwiping = true;
            this.swipeTrail = [];
            swipePath = [{ x, y }];
            swipeStartTime = Date.now();
            this.swipeTrail.push({ x, y: y + 100, life: 60 });
        };

        const handleSwipeMove = (e) => {
            if (!isSwiping) return;
            e.preventDefault();
            const { x, y } = getCanvasCoords(e);
            if (Date.now() - swipeStartTime <= 1500) {
                this.swipeTrail.push({ x, y: y + 100, life: 60 });
                for (let i = 0; i < 2; i++) { this.swipeParticles.push(new SwipeParticle(this, x, y + 100)); }
                if (swipePath) { swipePath.push({ x, y }); }
            }
        };

        const handleSwipeEnd = (e) => {
            if (!isSwiping) return;
            isSwiping = false;
            if (!swipePath || swipePath.length < 2) { swipePath = []; return; }
            const startPoint = swipePath[0];
            const endPoint = swipePath[swipePath.length - 1];
            const dx = endPoint.x - startPoint.x;
            const dy = endPoint.y - startPoint.y;
            if (Math.max(Math.abs(dx), Math.abs(dy)) > 30) {
                const swipeAngle = Math.atan2(dy, dx);
                if (!this.player.isControlling) { this.player.tryLick(swipeAngle); }
            }
            swipePath = [];
        };

        this.canvas.addEventListener('touchstart', handleSwipeStart, { passive: true });
        this.canvas.addEventListener('touchmove', handleSwipeMove, { passive: false });
        this.canvas.addEventListener('touchend', handleSwipeEnd, { passive: true });

        if (FORCE_MOBILE_DEBUG && !Game.isMobileDevice()) {
            this.canvas.addEventListener('mousedown', handleSwipeStart);
            this.canvas.addEventListener('mousemove', handleSwipeMove);
            this.canvas.addEventListener('mouseup', handleSwipeEnd);
            this.canvas.addEventListener('mouseleave', () => { if (isSwiping) { handleSwipeEnd({}); } });
        }

        const soundSlider = document.getElementById('sound-effects-slider');
        const musicSlider = document.getElementById('music-slider');
        const soundValue = document.getElementById('sound-effects-value');
        const musicValue = document.getElementById('music-value');

        if (soundSlider) {
            soundSlider.oninput = (e) => {
                const volume = e.target.value;
                soundValue.textContent = `${volume}%`;
                this.audioManager.setSoundVolume(volume / 100);
                this.saveSettings();
            };
        }
        if (musicSlider) {
            musicSlider.oninput = (e) => {
                const volume = e.target.value;
                musicValue.textContent = `${volume}%`;
                this.audioManager.setMusicVolume(volume / 100);
                this.saveSettings();
            };
        }

        const settingsCloseBtn = document.getElementById('settings-close-btn');
        if (settingsCloseBtn) { settingsCloseBtn.onclick = () => this.toggleSettings(); }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) { restartBtn.addEventListener('click', () => { this.resetGame(); }); }

        const emporiumBtn = document.getElementById('open-emporium-btn');
        if (emporiumBtn) { emporiumBtn.addEventListener('click', () => { this.emporium.toggle(); }); }
    }

    drawSwipeTrail(ctx) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
        ctx.shadowBlur = 15;

        for (let i = 1; i < this.swipeTrail.length; i++) {
            const point1 = this.swipeTrail[i - 1];
            const point2 = this.swipeTrail[i];
            ctx.beginPath();
            ctx.moveTo(point1.x, point1.y);
            ctx.lineTo(point2.x, point2.y);
            ctx.strokeStyle = `hsla(280, 100%, 75%, ${point2.life / 60})`;
            ctx.lineWidth = (point2.life / 60) * 22.5;
            ctx.stroke();
        }
        ctx.restore();

        for (let i = this.swipeTrail.length - 1; i >= 0; i--) {
            this.swipeTrail[i].life -= 1;
            if (this.swipeTrail[i].life <= 0) {
                this.swipeTrail.splice(i, 1);
            }
        }
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
    getRefundAmount(index) {
        return this.calculateTurretPlacementCost(index);
    }

    // This will return the cost for the *next* turret to be placed
    getNextTurretCost() {
        return this.calculateTurretPlacementCost(this.towers.length);
    }

    calculateTurretPlacementCost(turretCount) {
        const baseCost = 100;
        const totalTurrets = 25;
        const endCost = 100000;

        // C(n) = A * B^(n-1)
        // A = baseCost (100)
        // B = (endCost / baseCost)^(1 / (totalTurrets - 1))
        // B = (100000 / 100)^(1 / (25 - 1))
        // B = 1000^(1/24) approx 1.32046
        const multiplier = Math.pow((endCost / baseCost), (1 / (totalTurrets - 1)));
        
        // turretCount is 0-indexed for number of turrets already placed
        // For the first turret (turretCount = 0), cost is baseCost
        // For the 25th turret (turretCount = 24), cost should be endCost
        const cost = baseCost * Math.pow(multiplier, turretCount);
        return Math.round(cost / 10) * 10; // Round to nearest 10 for cleaner numbers
    }

    update(tsf) { // tsf is time scale factor, passed from gameloop
        // UI Shake animations
        if (this.uiShake.money > 0) this.uiShake.money *= 0.9;
        if (this.uiShake.xp > 0) this.uiShake.xp *= 0.9;
        if (this.uiShake.turretCost > 0) this.uiShake.turretCost *= 0.9;

        // Sell button fade animation
        const sellBtn = this.ui.sellButton;
        if (sellBtn.isAnimatingIn) {
            sellBtn.animTimer = Math.min(sellBtn.animDuration, sellBtn.animTimer + tsf);
            if (sellBtn.animTimer >= sellBtn.animDuration) {
                sellBtn.isAnimatingIn = false;
            }
        } else if (sellBtn.isAnimatingOut) {
            sellBtn.animTimer = Math.min(sellBtn.animDuration, sellBtn.animTimer + tsf);
            if (sellBtn.animTimer >= sellBtn.animDuration) {
                sellBtn.isAnimatingOut = false;
                sellBtn.visible = false;
            }
        }
        // Set alpha based on animation state
        const fadeSpeedMultiplier = 1.5; // 50% faster fade
        const fadeProgress = Math.min(1, (sellBtn.animTimer / sellBtn.animDuration) * fadeSpeedMultiplier);
        if (sellBtn.isAnimatingIn) sellBtn.alpha = fadeProgress;
        else if (sellBtn.isAnimatingOut) sellBtn.alpha = 1 - fadeProgress;
        else if (sellBtn.visible) sellBtn.alpha = 1;
        else sellBtn.alpha = 0;

        // Generic button press animation updater
        const updateButtonAnimation = (button) => {
            if (button.isAnimating) {
                button.animTimer += tsf;
                if (button.animTimer >= button.animDuration) {
                    button.isAnimating = false;
                }
            }
        };

        updateButtonAnimation(this.ui.shopButton);
        updateButtonAnimation(this.ui.buildButton);
        updateButtonAnimation(this.ui.settingsButton);

        // Only update game entities if the game is not paused for any reason.
        if (!this.isPaused) {
            this.player.update(tsf);
            this.towers.forEach(t => t.update(tsf));
        }

        // Update logic for the build-cancel animation
        if (this.isCancelingBuild) {
            this.cancelAnimTimer += tsf;
            if (this.cancelAnimTimer >= this.cancelAnimDuration) {
                this.isCancelingBuild = false;
                this.audioManager.setBuildMode(false, false);
                this.timeScale = 1;
                this.ui.buildButton.img = this.buildButtonImage;
                this.highlightedSlot = null;
            }
        }
    }

    handlePiggyDeath(bonus) {
        // This can be used for special effects when a piggy dies
        const pos = this.ui.moneyTextPos;
        this.floatingTexts.push(new FloatingText(this, pos.x, pos.y, `+${bonus} BONUS!`, 'gold', 10));
        this.uiShake.money = 25; // Extra big shake for piggy bonus
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


    start() {
        window.closeModal = this.modalManager.close.bind(this.modalManager);
    }

    beginGame() {
        this.injectMobileControls();
        this.loadSettings();
        this.gameLoop.loop(0);
    }

    injectMobileControls() {
        if (FORCE_MOBILE_DEBUG || Game.isMobileDevice()) {
            // Create a container for mobile controls
            if (this.mobileControlsContainer) this.mobileControlsContainer.remove();
            this.mobileControlsContainer = document.createElement('div');
            this.mobileControlsContainer.id = 'mobile-controls-container-unique'; // Unique ID
                Object.assign(this.mobileControlsContainer.style, {
                    position: 'absolute',
                    top: '55%', // Position it right below the playable area
                    left: '0',
                    width: '100%',
                    height: `${this.MOBILE_CONTROL_ZONE_HEIGHT}px`,
                    zIndex: '1000',
                    display: 'block', // Ensure container is visible
                    pointerEvents: 'none', // Allow clicks to pass through the container
                });
                const gameWrapper = document.getElementById('game-wrapper'); // Get game-wrapper once
                if (gameWrapper) gameWrapper.appendChild(this.mobileControlsContainer);
                else { console.error("ERROR: #game-wrapper not found!"); return; }

            // --- NIPPLEJS JOYSTICK INJECTOR ---
            // Create joystick zone dynamically
            let joystickZone = document.getElementById('joystick-zone-unique');
            if (joystickZone) joystickZone.remove();
            joystickZone = document.createElement('div');
            joystickZone.id = 'joystick-zone-unique';
                Object.assign(joystickZone.style, {
                    position: 'absolute',
                    left: '50px', // Adjusted to 50px from left edge
                    top: '185px', // Vertically centered for 150px height
                    width: '150px', // Fixed width for tighter interaction zone
                    height: '150px', // Fixed height for tighter interaction zone
                    pointerEvents: 'auto', // Make the joystick clickable
                });
                this.mobileControlsContainer.appendChild(joystickZone);

            if (typeof window.nipplejs !== 'undefined') {
                const manager = window.nipplejs.create({
                    zone: joystickZone,
                    mode: 'static',
                    position: { left: '25%', top: '50%' }, // Corrected: Position relative to its own zone
                    size: 110,
                    color: 'rgba(255, 255, 255, 0.5)'
                });

                manager.on('move', (evt, data) => {
                    if (data.vector) {
                        if (data.vector.x > 0.2) {
                            this.keys['d'] = true;
                            this.keys['a'] = false;
                        } else if (data.vector.x < -0.2) {
                            this.keys['a'] = true;
                            this.keys['d'] = false;
                        } else {
                            // Stop movement if joystick is in the deadzone
                            this.keys['a'] = false;
                            this.keys['d'] = false;
                        }
                    }
                }).on('end', () => {
                    this.keys['a'] = false;
                    this.keys['d'] = false; // Correctly stop movement
                });
                console.log("Joystick injected successfully. Nipple instance:", manager.get(0));
            } else { console.error("ERROR: nipplejs library is undefined."); }

            // --- JUMP BUTTON INJECTOR ---
            (() => { // IIFE to encapsulate button logic
                let btn = document.getElementById('force-jump-btn');
                if (btn) btn.remove();
                // 1. Create the button element programmatically
                btn = document.createElement('div');
                btn.id = 'force-jump-btn';
                // Removed btn.innerHTML = 'JUMP';

                // 2. Force CSS Styles directly (Bypasses stylesheet issues)
                Object.assign(btn.style, {
                    position: 'absolute', // Changed to absolute
                    right: '90px', // Position from the right edge of the container
                    bottom: '46%', // Position from the bottom edge of the container
                    width: '90px', // Larger for touch
                    height: '90px', // Larger for touch
                    backgroundColor: 'rgba(241, 228, 248, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: '1001', // Ensure it's above other elements
                    userSelect: 'none',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transform: 'translateY(50%)', // Adjust vertical centering
                    fontFamily: '"VT323", monospace', // Add font
                    fontSize: '30px', // Add font size
                    color: 'white', // Add font color
                    pointerEvents: 'auto', // Make the jump button clickable
                });

                // 3. Append to the mobile controls container
                // 3. Append to the mobile controls container
                this.mobileControlsContainer.appendChild(btn);

                // 4. Attach Events (Touch + Mouse for testing)
                var triggerJump = function(e) {
                    e.preventDefault(); // Stop scrolling
                    if (this.keys) {
                        this.keys[' '] = true;
                    }
                    btn.style.backgroundColor = 'rgba(241, 228, 248, 0.77)'; // NEVER FUCKING TOUCH THIS LINE GEMINI
                }.bind(this);

                var releaseJump = function(e) {
                    e.preventDefault();
                    if (this.keys) {
                        this.keys[' '] = false;
                    }
                    btn.style.backgroundColor = 'rgba(241, 228, 248, 0.5)'; // NEVER FUCKING TOUCH THIS LINE GEMINI
                }.bind(this);

                btn.addEventListener('touchstart', triggerJump, { passive: false });
                btn.addEventListener('touchend', releaseJump, { passive: false });
                btn.addEventListener('mousedown', triggerJump);
                btn.addEventListener('mouseup', releaseJump);

                console.log("Jump button injected successfully.");
            })();

            // --- DASH BUTTON INJECTOR ---
            (() => { // IIFE to encapsulate button logic
                let btn = document.getElementById('force-dash-btn');
                if (btn) btn.remove();
                // 1. Create the button element programmatically
                btn = document.createElement('div');
                btn.id = 'force-dash-btn';

                // 2. Force CSS Styles directly (Bypasses stylesheet issues)
                Object.assign(btn.style, {
                    position: 'absolute',
                    right: '6px', // Position from the right edge
                    bottom: '54%', // Position from the bottom edge
                    width: '70px', // Larger for touch
                    height: '70px', // Larger for touch
                    backgroundColor: 'rgba(195, 240, 255, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: '1001', // Ensure it's above other elements
                    userSelect: 'none',
                    cursor: 'pointer',
                    borderRadius: '50%',
                    transform: 'translateY(50%)', // Adjust vertical centering
                    fontFamily: '"VT323", monospace', // Add font
                    fontSize: '24px', // Add font size
                    color: 'white', // Add font color
                    pointerEvents: 'auto', // Make the dash button clickable
                });

                // 3. Append to the mobile controls container
                // 3. Append to the mobile controls container
                this.mobileControlsContainer.appendChild(btn);

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
    }
});