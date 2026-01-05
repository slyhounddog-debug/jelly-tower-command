export default class CastleHealthBar {
    constructor(game) {
        this.game = game;
        this.healthBarElement = document.getElementById('health-container');
        this.healthTextElement = document.getElementById('health-text');
        this.hitAnimTimer = 0;
        this.healAnimTimer = 0;
    }

    update(tsf) {
        if (this.hitAnimTimer > 0) {
            this.hitAnimTimer -= tsf;
            // Shake effect
            const shakeX = Math.sin(this.hitAnimTimer * 0.8) * 5;
            const shakeY = Math.cos(this.hitAnimTimer * 0.8) * 5;
            this.healthBarElement.style.transform = `translate(${shakeX}px, ${shakeY}px)`;

            // Flash white effect - using background color directly for simplicity
            if (Math.floor(this.hitAnimTimer / 2) % 2 === 0) {
                this.healthBarElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            } else {
                this.healthBarElement.style.backgroundColor = 'rgba(255,255,255,0.3)';
            }
        } else {
            this.healthBarElement.style.transform = 'translate(0, 0)';
            this.healthBarElement.style.backgroundColor = 'rgba(255,255,255,0.3)'; // Reset to original
        }

        if (this.healAnimTimer > 0) {
            this.healAnimTimer -= tsf;
            const scale = 1 + (Math.sin(this.healAnimTimer / 10 * Math.PI) * 0.1); // Grow and shrink
            this.healthBarElement.style.transform += ` scale(${scale})`;
        } else {
            // Ensure scale resets after animation
            if (this.healthBarElement.style.transform.includes('scale')) {
                this.healthBarElement.style.transform = this.healthBarElement.style.transform.replace(/scale\([^)]+\)/g, '').trim();
            }
        }
    }

    triggerHit() {
        this.hitAnimTimer = 20; // ~0.33 seconds at 60 FPS
        this.game.audioManager.playSound('towerHit');
    }

    triggerHeal() {
        this.healAnimTimer = 20; // ~0.33 seconds at 60 FPS
    }
}
