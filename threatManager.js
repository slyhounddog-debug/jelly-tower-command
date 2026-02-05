import Missile from './missile.js';
import GummyCluster from './boss.js';

export default class ThreatManager {
    constructor(game) {
        this.game = game;
        this.threatWallet = 0;
        this.directorMultiplier = 1;
        this.directorTimer = 0;
        this.diffTimer = 0;
        this.logTimer = 0;
        this.targetEnemy = null;

        this.enemyData = [
            { name: 'missile', cost: 2, threshold: 0, baseWeight: 100, weightModifier: -0.1 },
            { name: 'gummy_worm', cost: 3, threshold: 15, baseWeight: 80, weightModifier: -0.05 },
            { name: 'donut', cost: 6, threshold: 45, baseWeight: 20, weightModifier: 0.01 },
            { name: 'heartenemy', cost: 6, threshold: 30, baseWeight: 10, weightModifier: 0 },
            { name: 'ice_cream', cost: 7, threshold: 35, baseWeight: 35, weightModifier: 0.15 },
            { name: 'component_enemy', cost: 5, threshold: 25, baseWeight: 25, weightModifier: 0 },
            { name: 'marshmallow_large', cost: 11, threshold: 55, baseWeight: 15, weightModifier: 0.1 },
            { name: 'jelly_pudding', cost: 10, threshold: 70, baseWeight: 15, weightModifier: 0.2 },
            { name: 'jaw_breaker', cost: 15, threshold: 85, baseWeight: 10, weightModifier: 0.3 }
        ];

        this.reset();
    }
    reset() {
        this.threatWallet = 2;
        this.directorTimer = 0;
        this.bossWarningTimer = 0;
        this.bossWarningActive = false;
        this.logTimer = 0;
        this.targetEnemy = null;
    }

    update(tsf) {
        this.diffTimer += tsf;
        if (this.diffTimer >= 120) {
            this.game.currentRPM += 0.1;
            this.diffTimer = 0;
        }

        this.threatRPM = Math.min(240, 9.25 + this.game.gameTime / 240);

        this.logTimer += tsf;
        if (this.logTimer >= 600) {
            this.logTimer = 0;
            const unlockedEnemies = this.enemyData
                .filter(enemy => this.threatRPM >= enemy.threshold)
                .map(enemy => enemy.name)
                .join(', ');
            console.log(`ThreatRPM: ${this.threatRPM.toFixed(2)}, Unlocked Enemies: [${unlockedEnemies || 'None'}]`);
        }

        this.directorTimer += tsf;
        const cycleDuration = (45 + Math.random() * 45) * 60;
        this.directorMultiplier = 1 + Math.sin(this.directorTimer / cycleDuration * 2 * Math.PI) * 0.25;

        this.threatWallet += (this.threatRPM / 1800) * this.directorMultiplier * tsf;
        this.threatWallet = Math.min(this.threatWallet, 30);

        if (!this.game.boss && !this.bossWarningActive && this.game.killsSinceLastBoss >= this.game.killsForNextBoss) {
            this.bossWarningActive = true;
            this.bossWarningTimer = 180;
            this.game.audioManager.playSound('bossSpawn');
        }

        if (this.bossWarningActive) {
            this.bossWarningTimer -= tsf;
            this.game.thermometer.pulse = true;
            if (Math.floor(this.bossWarningTimer / 20) % 2 === 0) {
                this.game.ctx.fillStyle = 'rgba(255, 0, 255, 0.25)';
                this.game.ctx.fillRect(0, 0, this.game.width, this.game.height);
            }

            if (this.bossWarningTimer <= 0) {
                this.bossWarningActive = false;
                this.game.thermometer.pulse = false;
                this.game.boss = new GummyCluster(this.game);
                if (this.game.bossesKilled === 0) {
                    this.game.modalManager.toggle('boss');
                    this.game.isPaused = true;
                }
            }
        }
        
        // Target Enemy Spawning Logic
        if (this.targetEnemy === null) {
            this.targetEnemy = this.getRandomEnemy();
        }

        if (this.targetEnemy && this.threatWallet >= this.targetEnemy.cost) {
            this.threatWallet -= this.targetEnemy.cost;
            const spawnX = Math.random() * (this.game.width - 350) + 175;
           const enemy = this.game.enemyPools[this.targetEnemy.name].get(this.game, spawnX, this.targetEnemy.name, undefined, 1);
            if (this.targetEnemy.name === 'missile') { // Specific to missile type, ensures 8-frame sprite assignment
                enemy.sprite.currentFrame = Math.floor(Math.random() * 8);
            }
            this.targetEnemy = null;
            
            // Optional Burst Chance
            if (this.threatRPM > 60 && Math.random() < 0.1) {
                this.targetEnemy = this.getRandomEnemy();
            }
        }
    }

    getRandomEnemy() {
        const availableEnemies = this.enemyData.filter(enemy => this.threatRPM >= enemy.threshold);
        if (availableEnemies.length === 0) {
            return null;
        }
        
        const weightedEnemies = availableEnemies.map(enemy => {
            const activeWeight = Math.max(5, enemy.baseWeight + (enemy.weightModifier * this.threatRPM));
            return { ...enemy, activeWeight };
        });

        const totalWeight = weightedEnemies.reduce((sum, enemy) => sum + enemy.activeWeight, 0);
        let random = Math.random() * totalWeight;

        for (const enemy of weightedEnemies) {
            if (random < enemy.activeWeight) {
                return enemy;
            }
            random -= enemy.activeWeight;
        }
        return weightedEnemies[weightedEnemies.length - 1];
    }
    
    debugSpawn() {
        const spawnX = Math.random() * (this.game.width - 350) + 175;
        const spawnIf = (debugFlag, enemyName) => {
            if (debugFlag) {
                const enemyData = this.enemyData.find(e => e.name === enemyName);
                if (enemyData) {
                    const enemy = this.game.enemyPools[enemyName].get(this.game, spawnX, enemyName, undefined, enemyData. calculltiplier);
                    if (enemyName === 'missile') { // Specific to missile type, ensures 8-frame sprite assignment
                        enemy.sprite.currentFrame = Math.floor(Math.random() * 8);
                    }
                }
            }
        };

        spawnIf(this.game.debugSpawnJawBreaker, 'jaw_breaker');
        spawnIf(this.game.debugSpawnJellyPudding, 'jelly_pudding');
        spawnIf(this.game.debugSpawnDonut, 'donut');
        spawnIf(this.game.debugSpawnIceCream, 'ice_cream');
        spawnIf(this.game.debugSpawnComponentEnemy, 'component_enemy');
        spawnIf(this.game.debugSpawnHeartEnemy, 'heartenemy');
    }
}