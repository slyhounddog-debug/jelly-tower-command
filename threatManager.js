import Missile from './missile.js';

export default class ThreatManager {
    constructor(game) {
        this.game = game;
        this.reset();
    }
    reset() {
        this.spawnTimer = (3600 / this.game.currentRPM) - 60;
        this.diffTimer = 0;
    }
    update(tsf) {
        this.diffTimer += tsf;
        if (this.diffTimer >= 150) {
            this.game.currentRPM += 0.1;
            this.diffTimer = 0;
            document.getElementById('rpm-display').innerText = this.game.currentRPM.toFixed(1);
        }

        this.spawnTimer += tsf;
        if (this.spawnTimer >= 3600 / this.game.currentRPM) {
            this.spawnTimer = 0;
            const spawnX = Math.random() * (this.game.width - 50) + 25;

            // Marshmallow spawn logic
            if (this.game.currentRPM >= this.game.marshmallowSpawnThreshold && Math.random() < 0.25) {
                this.game.missiles.push(new Missile(this.game, spawnX, 'marshmallow_large'));
                if (!this.game.marshmallowSeen) {
                    this.game.marshmallowSeen = true;
                    this.game.isPaused = true;
                    document.getElementById('marshmallow-modal').style.display = 'flex';
                }
            }
            // Gummy Worm spawn logic
            else if (this.game.currentRPM >= this.game.gummyWormSpawnThreshold && Math.random() < 0.5) {
                this.game.missiles.push(new Missile(this.game, spawnX, 'gummy_worm'));
                if (!this.game.gummyWormSeen) {
                    this.game.gummyWormSeen = true;
                    this.game.isPaused = true;
                    document.getElementById('gummy-worm-modal').style.display = 'flex';
                }
            } else {
                this.game.missiles.push(new Missile(this.game, spawnX, 'missile'));
            }
        }
    }
}
