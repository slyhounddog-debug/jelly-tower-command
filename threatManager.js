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
        if (this.diffTimer >= 180) {
            this.game.currentRPM += 0.1;
            this.diffTimer = 0;
            document.getElementById('rpm-display').innerText = this.game.currentRPM.toFixed(1);
        }

        this.spawnTimer += tsf;
        if (this.spawnTimer >= 3600 / this.game.currentRPM) {
            this.spawnTimer = 0;
            this.game.missiles.push(new Missile(this.game, Math.random() * (this.game.width - 50) + 25));
        }
    }
}
