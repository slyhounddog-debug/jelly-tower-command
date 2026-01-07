import Missile from './missile.js';
import Particle from './particle.js';
import DamageSpot from './damageSpot.js';
import { darkenColor } from './utils.js';


export default class GameLoop {
    constructor(game) {
        this.game = game;
    }

    loop(currentTime) {
        if (!this.game.lastTime) this.game.lastTime = currentTime;
        const deltaTime = currentTime - this.game.lastTime;
        this.game.lastTime = currentTime;
        const tsf = deltaTime / this.game.targetFrameTime;

        this.game.screenShake.update(tsf);

        this.game.background.update(tsf);
        this.game.background.draw(this.game.ctx);
        
        if (!this.game.isPaused && !this.game.isGameOver) {
            this.game.gameTime += tsf;
            this.game.threatManager.update(tsf);

            if (this.game.boss) {
                this.game.audioManager.setBossMusic(true);
            } else {
                this.game.audioManager.setBossMusic(false);
            }

            if (this.game.money >= 100 && !this.game.shopOpenedFirstTime && !this.game.shopReminderShown) {
                this.game.shopReminderShown = true;
                const reminder = document.getElementById('shop-reminder');
                if (reminder) reminder.style.display = 'block';
                this.game.isPaused = true;
            }

            const pLvl = this.game.emporiumUpgrades.piggy_cooldown.level;
            const pCooldown = this.game.emporiumUpgrades.piggy_cooldown.values[pLvl] * 60;
            this.game.piggyTimer += tsf;
            if (this.game.piggyTimer >= pCooldown) {
                this.game.piggyTimer = 0;
                this.game.missiles.push(new Missile(this.game, Math.random() * (this.game.width - 50) + 25, 'piggy'));
                if (!this.game.piggyBankSeen) {
                    this.game.piggyBankSeen = true;
                    this.game.isPaused = true;
                    const curCD = this.game.emporiumUpgrades.piggy_cooldown.values[pLvl];
                    document.getElementById('piggy-cooldown-text').innerText = `It appears once every ${curCD} seconds.`;
                    document.getElementById('piggy-modal').style.display = 'block';
                }
            }

            this.game.player.update(tsf);
            this.game.towers.forEach(t => t.update(tsf));
            this.game.shields.forEach(s => s.update(tsf));
            this.game.castleHealthBar.update(tsf);
            this.game.thermometer.update(tsf);
            if (this.game.boss) this.game.boss.update(tsf);

            for (let i = this.game.missiles.length - 1; i >= 0; i--) {
                const m = this.game.missiles[i];
                m.update(tsf);
                if (m.health <= 0) { m.kill(i); continue; }
                let blocked = false;
                for (let sIdx = this.game.shields.length - 1; sIdx >= 0; sIdx--) {
                    const s = this.game.shields[sIdx];
                    if (m.x < s.x + s.width && m.x + m.width > s.x && m.y < s.y + s.height && m.y + m.height > s.y) {
                        for (let k = 0; k < 10; k++) this.game.particles.push(new Particle(this.game, m.x, m.y, '#3498db', 'spark'));
                        if (s.takeDamage(10)) { this.game.shields.splice(sIdx, 1); this.game.screenShake.trigger(3, 5); } else this.game.screenShake.trigger(1, 3);
                        m.kill(i);
                        blocked = true;
                        break;
                    }
                }
                if (blocked) continue;
                if (m.y > this.game.height - 80) {
                    if (m.type === 'gummy_bear') {
                        this.game.castleHealth -= 10;
                    } else {
                        this.game.castleHealth -= 10;
                    }
                    this.game.castleHealthBar.triggerHit();
                    this.game.missiles.splice(i, 1);
                    this.game.screenShake.trigger(5, 10);
                    for (let k = 0; k < 15; k++) this.game.particles.push(new Particle(this.game, m.x, m.y, '#e74c3c', 'smoke'));
                    
                    const castlePlats = this.game.platforms.filter(p => p.type === 'castle' || p.type === 'ground');
                    for (let j = 0; j < 5; j++) {
                        const rPlat = castlePlats[Math.floor(Math.random() * castlePlats.length)];
                        const sX = rPlat.x + Math.random() * rPlat.width;
                        const sY = rPlat.y + Math.random() * rPlat.height;
                        this.game.damageSpots.push(new DamageSpot(sX, sY, Math.random() * 5 + 5, darkenColor('#f8c8dc', 20)));
                    }
                }
            }

            this.game.currentScore = (this.game.enemiesKilled * 50) + (this.game.totalMoneyEarned) + (this.game.gameTime / 30);
            document.getElementById('score-display').textContent = this.game.currentScore.toFixed(0);

            for (let i = this.game.projectiles.length - 1; i >= 0; i--) {
                const p = this.game.projectiles[i];
                p.update(tsf);
                if (p.x < 0 || p.x > this.game.width || p.y < 0 || p.y > this.game.height || p.dead) {
                    if (p.popRockStacks > 0) {
                        p.createExplosion();
                    }
                    if (!p.hasHit) {
                        this.game.audioManager.playSound('miss');
                    }
                    this.game.projectiles.splice(i, 1);
                    continue;
                }
                
                if (this.game.boss && p.x > this.game.boss.x && p.x < this.game.boss.x + this.game.boss.width && p.y > this.game.boss.y && p.y < this.game.boss.y + this.game.boss.height) {
                    const isCrit = (Math.random() * 100 < this.game.stats.criticalHitChance);
                    let dmg = (p.hp || 10) * (isCrit ? 2 : 1);
                    this.game.boss.takeDamage(dmg);
                    this.game.particles.push(new Particle(this.game, p.x, p.y, '#fff', 'spark'));
                    if (!p.hasHit) { p.hasHit = true; this.game.shotsHit++; }
                    if (p.popRockStacks > 0) {
                        p.createExplosion();
                    }
                    this.game.projectiles.splice(i, 1);
                    continue;
                }

                for (let j = this.game.missiles.length - 1; j >= 0; j--) {
                    const m = this.game.missiles[j];
                    if (p.x > m.x && p.x < m.x + m.width && p.y > m.y && p.y < m.y + m.height) {
                        const isCrit = (Math.random() * 100 < this.game.stats.criticalHitChance);
                        let dmg = (p.hp || 10) * (isCrit ? 2 : 1);
                        if (p.fireDamageCount > 0) {
                            m.applyFire(dmg, p.fireDamageCount);
                        }
                        if (p.freezeStacks > 0) {
                            m.applySlow(300, 0.1 * p.freezeStacks);
                        }
                        if (m.takeDamage(dmg, isCrit)) m.kill(j);
                        m.kbVy = -2;
                        this.game.particles.push(new Particle(this.game, p.x, p.y, '#fff', 'spark'));
                        if (!p.hasHit) { p.hasHit = true; this.game.shotsHit++; }
                        if (p.popRockStacks > 0) {
                            p.createExplosion();
                        }
                        this.game.projectiles.splice(i, 1);
                        break;
                    }
                }
            }

            // Gravity Pull component logic
            this.game.projectiles.forEach(p => {
                if (p.gravityPullCount > 0) {
                    const pullRange = 50 * (1 + p.gravityPullCount * 0.15);
                    const pullForce = 0.1 * (1 + p.gravityPullCount * 0.15);
                    this.game.missiles.forEach(m => {
                        const dist = Math.hypot(p.x - m.x, p.y - m.y);
                        if (dist < pullRange) {
                            const angle = Math.atan2(p.y - m.y, p.x - m.x);
                            m.x += Math.cos(angle) * pullForce * tsf;
                            m.y += Math.sin(angle) * pullForce * tsf;
                        }
                    });
                }
            });

            // Cleanup
            for (let i = this.game.drops.length - 1; i >= 0; i--) { this.game.drops[i].update(tsf); if (this.game.drops[i].life <= 0) this.game.drops.splice(i, 1); }
            for (let i = this.game.particles.length - 1; i >= 0; i--) { this.game.particles[i].update(tsf); if (this.game.particles[i].life <= 0) this.game.particles.splice(i, 1); }
            for (let i = this.game.floatingTexts.length - 1; i >= 0; i--) { this.game.floatingTexts[i].update(tsf); if (this.game.floatingTexts[i].life <= 0) this.game.floatingTexts.splice(i, 1); }
            for (let i = this.game.damageSpots.length - 1; i >= 0; i--) { this.game.damageSpots[i].update(tsf); if (this.game.damageSpots[i].opacity <= 0) this.game.damageSpots.splice(i, 1); }

            this.game.lootPopupManager.update(deltaTime);

            if (this.game.castleHealth <= 0) {
                this.game.isGameOver = true;
                this.game.audioManager.stopMusic('music');
                this.game.audioManager.playMusic('gameOverMusic');
                document.getElementById('open-emporium-btn').style.display = 'block';
                document.getElementById('restart-btn').style.display = 'block';
                document.getElementById('game-over-stats').style.display = 'block';
                this.game.emporium.saveEmporiumUpgrades(this.game.emporiumUpgrades);
                localStorage.setItem('iceCreamScoops', this.game.iceCreamScoops);
                
                const timeSec = (this.game.gameTime / 60);
                const accuracy = (this.game.shotsFired > 0) ? (this.game.shotsHit / this.game.shotsFired) : 0;
                let mult = accuracy <= 0.5 ? 0.5 + (accuracy * 100 * 0.01) : 1.0 + ((accuracy - 0.5) * 100 * 0.02);
                const scoreBase = (timeSec * 2) + (this.game.enemiesKilled * 50) + (this.game.totalMoneyEarned);
                const finalScore = Math.floor(scoreBase * mult);
                let highScore = parseInt(localStorage.getItem('myGameHighScore')) || 0;
                if (finalScore > highScore) { highScore = finalScore; localStorage.setItem('myGameHighScore', highScore); }
                document.getElementById('go-time').textContent = `${timeSec.toFixed(1)}s`;
                document.getElementById('go-kills').textContent = this.game.enemiesKilled.toLocaleString();
                document.getElementById('go-money').textContent = `$${this.game.totalMoneyEarned.toLocaleString()}`;
                document.getElementById('go-acc').textContent = `${(accuracy * 100).toFixed(1)}%`;
                document.getElementById('go-score').textContent = finalScore.toLocaleString();
                document.getElementById('go-high-score').textContent = highScore.toLocaleString();
            }
        }

        const offset = this.game.screenShake.getOffset();
        this.game.ctx.save(); 
        this.game.ctx.translate(offset.x, offset.y);

        this.game.platforms.forEach(p => {
            this.game.ctx.save();
            if (p.type === 'cloud') {
                this.game.ctx.drawImage(this.game.platformImage, p.x, p.y, p.width, p.height);
           } else if (p.type === 'ground') {
    // If you are floating, subtract pixels (e.g., p.y - 10)
    // If you are sinking, add pixels (e.g., p.y + 10)
    const yOffset = -170; // Change this number until it looks perfect
    this.game.ctx.drawImage(this.game.groundImage, p.x, p.y + yOffset, p.width, p.height);
           } else if (p.type === 'castle') {
    const img = this.game.castleImage;

    // Use visual properties if they exist, otherwise fallback to standard dimensions
    const drawW = p.vWidth || p.width;
    const drawH = p.vHeight || p.height;

    const offX = p.hitboxOffsetX || 0;
    const offY = p.hitboxOffsetY || 0;

    // This math ensures the bottom of the image meets the bottom of the collision box
    // (p.height - drawH) creates a negative offset that "lifts" the image up
    const yOffset = p.height - drawH;

    this.game.ctx.drawImage(
        img, 
        p.x, 
        p.y + yOffset, 
        drawW, 
        drawH
    );
}
 else {
                this.game.ctx.fillStyle = p.color;
                this.game.ctx.beginPath();
                this.game.ctx.roundRect(p.x, p.y, p.width, p.height, 20);
                this.game.ctx.fill();
                this.game.drawing.drawPlatformFrosting(p);
            }
            this.game.ctx.restore();
        });

        this.game.damageSpots.forEach(s => s.draw(this.game.ctx));
        this.game.towers.forEach(t => t.draw(this.game.ctx));
        this.game.shields.forEach(s => s.draw(this.game.ctx));
        if (this.game.boss) this.game.boss.draw(this.game.ctx);
        this.game.missiles.forEach(m => m.draw(this.game.ctx));
        this.game.projectiles.forEach(p => p.draw(this.game.ctx));
        this.game.drops.forEach(d => d.draw(this.game.ctx));
        this.game.particles.forEach(p => p.draw(this.game.ctx));
        this.game.thermometer.draw(this.game.ctx);
        this.game.xpBar.draw(this.game.ctx);
        this.game.player.draw(this.game.ctx);
        this.game.floatingTexts.forEach(ft => ft.draw(this.game.ctx));
        this.game.drawing.drawActionButtons(this.game.ctx);

        this.game.lootPopupManager.draw(this.game.ctx);

        if (this.game.levelingManager.isLevelingUp) {
            this.game.audioManager.setMuffled(true);
            this.game.isPaused = true;
            this.game.levelUpScreen.update(tsf);
            this.game.levelUpScreen.draw(this.game.ctx);
        }

        this.game.ctx.restore();

        document.getElementById('money-display').innerText = this.game.money;
        this.game.castleHealthBar.draw(this.game.ctx);

        const bossHealthContainer = document.getElementById('boss-health-container');
        const bossPulseOverlay = document.getElementById('boss-pulse-overlay');
        if (this.game.boss) {
            bossHealthContainer.style.display = 'block';
            bossPulseOverlay.style.display = 'block';
            const bossHealthFill = document.getElementById('boss-health-bar-fill');
            const bossHealthText = document.getElementById('boss-health-text');
            const bossHealthPercentage = (this.game.boss.health / this.game.boss.maxHealth) * 100;
            bossHealthFill.style.width = `${bossHealthPercentage}%`;
            bossHealthText.innerText = `BOSS: ${Math.ceil(this.game.boss.health)}`;
            
            // Rainbow color effect
            const hue = (this.game.gameTime * 0.5) % 360;
            bossHealthFill.style.background = `linear-gradient(to right, hsl(${hue}, 100%, 50%), hsl(${(hue + 60) % 360}, 100%, 50%))`;

            // Pulse effect
            const pulse = (Math.sin(this.game.gameTime * 0.05) + 1) / 2;
            bossPulseOverlay.style.opacity = 0.1 + (pulse * 0.2);

        } else {
            bossHealthContainer.style.display = 'none';
            bossPulseOverlay.style.display = 'none';
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}
