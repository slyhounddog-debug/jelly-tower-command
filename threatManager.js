import Missile from './missile.js';
import GummyCluster from './boss.js';

export default class ThreatManager {
    constructor(game) {
        this.game = game;
        this.reset();
    }
    reset() {
        this.spawnTimer = (3600 / this.game.currentRPM) - 60;
        this.diffTimer = 0;
        this.bossWarningTimer = 0;
        this.bossWarningActive = false;
    }
    update(tsf) {
        this.diffTimer += tsf;
        if (this.diffTimer >= 70) { // Lower increases threatRPM more quickly
            this.game.currentRPM += 0.1;
            this.diffTimer = 0;
        }

        this.threatRPM = Math.min(240, 5.5 + this.game.gameTime / 240);

        // Check if it's time to spawn the boss
        if (!this.game.boss && !this.bossWarningActive && this.game.killsSinceLastBoss >= this.game.killsForNextBoss) {
            this.bossWarningActive = true;
            this.bossWarningTimer = 180; // 3 seconds warning
            this.game.audioManager.playSound('bossSpawn'); 
        }
        
        // Handle the boss spawn warning
        if (this.bossWarningActive) {
            this.bossWarningTimer -= tsf;
            this.game.thermometer.pulse = true;
            if (Math.floor(this.bossWarningTimer / 10) % 2 === 0) {
                this.game.ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
                this.game.ctx.fillRect(0, 0, this.game.width, this.game.height);
            }

            if (this.bossWarningTimer <= 0) {
                this.bossWarningActive = false;
                this.game.thermometer.pulse = false;
                this.game.boss = new GummyCluster(this.game);
                if (this.game.bossesKilled === 0) {
                    // Show boss modal
                    document.getElementById('boss-modal').style.display = 'flex';
                    this.game.isPaused = true;
                }
            }
        }

        this.spawnTimer += tsf;
        if (this.spawnTimer >= 3600 / this.game.currentRPM) {
            this.spawnTimer = 0;
            const spawnX = Math.random() * (this.game.width - 250) + 125;

            // Marshmallow spawn logic
            if (this.game.currentRPM >= this.game.marshmallowSpawnThreshold && Math.random() < 0.10) {
                this.game.missiles.push(new Missile(this.game, spawnX, 'marshmallow_large'));
                if (!this.game.marshmallowSeen) {
                    this.game.marshmallowSeen = true;
                    this.game.isPaused = true;
                    this.game.thermometerWarn = false;
                    document.getElementById('marshmallow-modal').style.display = 'flex';
                }
            }
            // Gummy Worm spawn logic
            else if (this.game.currentRPM >= this.game.gummyWormSpawnThreshold && Math.random() < 0.3) {
                this.game.missiles.push(new Missile(this.game, spawnX, 'gummy_worm'));
                if (!this.game.gummyWormSeen) {
                    this.game.gummyWormSeen = true;
                    this.game.isPaused = true;
                    this.game.thermometerWarn = false;
                    document.getElementById('gummy-worm-modal').style.display = 'flex';
                }
            } else {
                this.game.missiles.push(new Missile(this.game, spawnX, 'missile'));
            }
        }
    }
}
