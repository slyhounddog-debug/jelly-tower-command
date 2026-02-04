import Missile from './missile.js';
import Particle from './particle.js';
import { darkenColor } from './utils.js';
import Gumball from './gumball.js';
import FrostingParticle from './frostingParticle.js';


export default class GameLoop {
    constructor(game) {
        this.game = game;
    }

    loop(currentTime) {
        if (!this.game.gameStarted) {
            this.game.drawing.drawTitleScreen(this.game.ctx);
            requestAnimationFrame((t) => this.loop(t));
            return;
        }

        if (this.game.modalManager.isOpen()) {
            this.game.isPaused = true;
            this.game.modalManager.update((currentTime - (this.game.lastTime || currentTime)) / this.game.targetFrameTime);
        } else if (this.game.isPaused && !this.game.sellModeActive && !this.game.levelingManager.isLevelingUp) {
            // If nothing else is keeping the game paused, unpause it.
            // This is to handle the case where a modal was closed, but the game remained paused.
            this.game.isPaused = false;
        }

        if (this.game.hitStopFrames > 0) {
            this.game.hitStopFrames--;
            requestAnimationFrame((t) => this.loop(t));
            return;
        }
        if (!this.game.lastTime) this.game.lastTime = currentTime;
        const deltaTime = Math.min(100, currentTime - this.game.lastTime); // Cap delta to prevent physics explosion
        this.game.lastTime = currentTime;
                let tsf = deltaTime / this.game.targetFrameTime;
                if (this.game.isBuilding) {
                    tsf *= 0.05; // Slow down by 95%
                }
                this.game.update(tsf); // Call the game's main update method regardless of pause state
        
                this.game.screenShake.update(tsf);
        
                this.game.background.update(tsf);
                this.game.background.draw(this.game.ctx, this.game.PLAYABLE_AREA_HEIGHT);
                
        
        // Sell Mode Activation - This should run even if the game is "paused" for building, etc.
        if (this.game.heldTurret && !this.game.sellModeActive) {
            if (Date.now() - this.game.sellTimer > 10) { // 400ms hold to activate
                this.game.sellModeActive = true;
                this.game.isPaused = true; // Pause game for selling interaction
            }
        }

        // Check for full game pause (e.g., modals, sell mode)
        //         if ((!this.game.isPaused || this.game.isBuilding) && !this.game.isGameOver) {
            // Game Over logic should only run when not paused and not already over
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
        // --- ALL UPDATES BELOW THIS LINE RUN DURING BULLET TIME (tsf is small) BUT NOT DURING FULL PAUSE ---
        if (!this.game.isPaused) {
        // GEMINI_UPDATE_BLOCK_START
        this.game.gameTime += tsf;
        this.game.threatManager.update(tsf);

            if (this.game.boss) {
                this.game.audioManager.setBossMusic(true);
            } else {
                this.game.audioManager.setBossMusic(false);
            }

            if (this.game.money >= 100 && !this.game.shopOpenedFirstTime && !this.game.shopReminderShown) {
                this.game.shopReminderShown = true;
                const reminder = document.getElementById('shop-o');
                if (reminder) reminder.style.display = 'block';
                // Note: we don't unpause here, only allow reminder to show
            }

            const pLvl = this.game.emporiumUpgrades.piggy_cooldown.level;
            const pCooldown = this.game.emporiumUpgrades.piggy_cooldown.values[pLvl] * 60;
            this.game.piggyTimer += tsf;
            if (this.game.piggyTimer >= pCooldown) {
                this.game.piggyTimer = 0;
                this.game.missiles.push(new Missile(this.game, Math.random() * (this.game.width - 90) + 25, 'piggy'));
                if (!this.game.piggyBankSeen) {
                    this.game.piggyBankSeen = true;
                    // We don't pause here, this is just for the first time pop-up.
                    // The modal itself will handle pausing if it's new.
                    const curCD = this.game.emporiumUpgrades.piggy_cooldown.values[pLvl];
                    this.game.modalManager.toggle('piggy');
                }
            }

            // Individual entity updates (now all run during bullet time)
            // this.game.player.update(tsf) is now managed by this.game.update(tsf)
            // this.game.towers.forEach(t => t.update(tsf)) is now managed by this.game.update(tsf)
            this.game.castleHealthBar.update(tsf);
            this.game.thermometer.update(tsf);
            if (this.game.boss) this.game.boss.update(tsf);

            for (let i = this.game.missiles.length - 1; i >= 0; i--) {
                const m = this.game.missiles[i];
                m.update(tsf);
                if (m.dead) continue;
                if (m.health <= 0) { m.kill(); continue; }
                if (m.y > this.game.PLAYABLE_AREA_HEIGHT - 110) {  // enemy death vertical threshold 
                    this.game.castleHealth -= m.damage || 10;
                    this.game.castleHealthBar.triggerHit();
                    m.dead = true;
                    this.game.hitStopFrames = 5;
                    this.game.screenShake.trigger(5, 10);
                    // Old smoke particles removed

                    // Ground impact particles
                    const particleCount = 10 + Math.floor(Math.random() * 10); // 10-19 particles (doubled)
                    for (let k = 0; k < particleCount; k++) {
                        const colorChoice = Math.random();
                        let color;
                        if (colorChoice < 0.5) {
                            color = this.game.ENEMY_FROSTING_COLORS[Math.floor(Math.random() * this.game.ENEMY_FROSTING_COLORS.length)];
                        } else {
                            color = this.game.FROSTING_COLORS[Math.floor(Math.random() * this.game.FROSTING_COLORS.length)];
                        }
                        
                        const vx = (Math.random() - 0.5) * 8; // Outward horizontal burst
                        const vy = -Math.random() * 10 - 2; // Mostly upward velocity
                        const radius = Math.random() * 5 + 2;
                        const lifespan = 40 + Math.random() * 20;

                        this.game.particles.push(new FrostingParticle(this.game, m.x + m.width / 2, m.y + m.height, vx, vy, radius, color, lifespan));
                    }
                    
                    const castlePlats = this.game.platforms.filter(p => p.type === 'castle' || p.type === 'ground');
                }
            }
            this.game.missiles = this.game.missiles.filter(m => !m.dead);

            this.game.currentScore = (this.game.enemiesKilled * 50) + (this.game.totalMoneyEarned) + (this.game.gameTime / 30);
            // document.getElementById('score-display').textContent = this.game.currentScore.toFixed(0);
        // GEMINI_UPDATE_BLOCK_END


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
                
                if (this.game.boss &&
                    p.x > this.game.boss.x + this.game.boss.hitboxOffsetX &&
                    p.x < this.game.boss.x + this.game.boss.hitboxOffsetX + this.game.boss.hitboxWidth &&
                    p.y > this.game.boss.y + this.game.boss.hitboxOffsetY &&
                    p.y < this.game.boss.y + this.game.boss.hitboxOffsetY + this.game.boss.hitboxHeight) {
                    const isCrit = (Math.random() * 100 < this.game.stats.criticalHitChance);
                    let dmg = (p.hp || 10) * (isCrit ? 2 : 1);
                    this.game.boss.takeDamage(dmg, isCrit);
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
                        if (m.takeDamage(dmg, isCrit, p)) m.kill();
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
            for (let i = this.game.waveAttacks.length - 1; i >= 0; i--) { this.game.waveAttacks[i].update(tsf); if (this.game.waveAttacks[i].lifespan <= 0) this.game.waveAttacks.splice(i, 1); }
            for (let i = this.game.gumballs.length - 1; i >= 0; i--) { this.game.gumballs[i].update(tsf); if (this.game.gumballs[i].dead) this.game.gumballs.splice(i, 1); }
            for (let i = this.game.swipeParticles.length - 1; i >= 0; i--) { this.game.swipeParticles[i].update(tsf); if (this.game.swipeParticles[i].life <= 0) this.game.swipeParticles.splice(i, 1); }
            for (let i = this.game.particlesBehind.length - 1; i >= 0; i--) { this.game.particlesBehind[i].update(tsf); if (this.game.particlesBehind[i].lifespan <= 0) this.game.particlesBehind.splice(i, 1); }
            for (let i = this.game.particlesInFront.length - 1; i >= 0; i--) { this.game.particlesInFront[i].update(tsf); if (this.game.particlesInFront[i].lifespan <= 0) this.game.particlesInFront.splice(i, 1); }
            for (let i = this.game.debris.length - 1; i >= 0; i--) { this.game.debris[i].update(tsf); if (this.game.debris[i].dead) this.game.debris.splice(i, 1); }

            this.game.decalManager.update(tsf);
            this.game.lootPopupManager.update(deltaTime);

            this.game.currentScore = (this.game.enemiesKilled * 50) + (this.game.totalMoneyEarned) + (this.game.gameTime / 30);
            // document.getElementById('score-display').textContent = this.game.currentScore.toFixed(0);
        }

        const offset = this.game.screenShake.getOffset();
        this.game.ctx.save(); 
        this.game.ctx.translate(offset.x, offset.y - 100);

        this.game.platforms.forEach(p => {
            if (p.type === 'ground') return; // Will be drawn later
            this.game.ctx.save();
            if (p.type === 'cloud') {
                this.game.ctx.drawImage(this.game.platformImage, p.x, p.y, p.width, p.height);
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

        // Draw ground with shadow -- MOVED HERE
        const ground = this.game.platforms.find(p => p.type === 'ground');
        if (ground) {
            this.game.ctx.save();
            this.game.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.game.ctx.shadowBlur = 10;
            this.game.ctx.shadowOffsetY = 5;
            
            const shake = this.game.screenShake.getOffset();
            const yOffset = -170; // This specific yOffset is being applied to the ground image
            this.game.ctx.translate(shake.x, shake.y - 100); 
            this.game.ctx.drawImage(this.game.groundImage, ground.x, ground.y + yOffset, ground.width, ground.height);
            this.game.ctx.restore();
        }


        this.game.towers.forEach(t => t.draw(this.game.ctx));

        // Draw synergy lines once per frame, after missiles but before projectiles
        this.game.decalManager.draw(this.game.ctx);
        if (this.game.boss) this.game.boss.draw(this.game.ctx);
        this.game.missiles.forEach(m => m.draw(this.game.ctx));
        // Draw synergy lines once per frame, after missiles but before projectiles
        this.game.synergyLines.forEach(line => line.draw(this.game.ctx));
        this.game.projectiles.forEach(p => p.draw(this.game.ctx));
        this.game.drops.filter(d => !d.isBeingLicked).forEach(d => d.draw(this.game.ctx));
        this.game.particles.forEach(p => p.draw(this.game.ctx));
        this.game.thermometer.draw(this.game.ctx);
        this.game.xpBar.draw(this.game.ctx);
        this.game.particlesBehind.forEach(p => p.draw(this.game.ctx));

        this.game.player.draw(this.game.ctx);
        this.game.drawSwipeTrail(this.game.ctx);
        this.game.swipeParticles.forEach(p => p.draw(this.game.ctx));
        this.game.drops.filter(d => d.isBeingLicked).forEach(d => d.draw(this.game.ctx));
        this.game.waveAttacks.forEach(wa => wa.draw(this.game.ctx));
        this.game.gumballs.forEach(g => g.draw(this.game.ctx));
        this.game.particlesInFront.forEach(p => p.draw(this.game.ctx));
        this.game.debris.forEach(d => d.draw(this.game.ctx));
        this.game.floatingTexts.forEach(ft => ft.draw(this.game.ctx));

        this.game.lootPopupManager.draw(this.game.ctx);

        if (this.game.levelingManager.isLevelingUp) {
            this.game.audioManager.setMuffled(true);
            this.game.isPaused = true;
            this.game.levelUpScreen.update(tsf);
            this.game.levelUpScreen.draw(this.game.ctx);
        }

        // Draw pulsing placement slots if in building mode
        if (this.game.isBuilding) {
            // Animation is 20x faster to compensate for the 1/20 slowdown in build mode.
            const pulse = (Math.sin(this.game.gameTime * (0.1 * 25)) + 1) / 2; // 0 to 1 pulse
            this.game.platforms.forEach(p => {
                if (p.slots) {
                    p.slots.forEach(slot => { // line 332
                        // If the ghost turret is hovering over this slot, it disappears.
                        if (this.game.highlightedSlot && this.game.highlightedSlot.id === slot.id) {
                            return; // Skip drawing this slot
                        }

                        // If a turret is already there, don't draw the slot.
                        if (slot.isOccupied) {
                            return; // Skip drawing this slot
                        }


                        this.game.ctx.save();
                        
                        const rectWidth = 80;
                        const rectHeight = 80;
                        const rectX = slot.x - rectWidth / 2;
                        const rectY = slot.y - rectHeight / 2;

                        this.game.ctx.beginPath();
                        this.game.ctx.roundRect(rectX, rectY, rectWidth, rectHeight, 10);
                        
                        // If a turret is already there, show a faint red. Otherwise, pulse white, but extra juicy.
                        this.game.ctx.fillStyle = `rgba(255, 255, 255, ${0.38 + pulse * 0.5})`;
                        
                        this.game.ctx.fill();
                        this.game.ctx.restore();
                    });
                }
            });
        }

        // Draw the sell button if it's active
        if (this.game.ui.sellButton.visible) {
            const btn = this.game.ui.sellButton;
            const img = this.game.sellButtonUpImage;
            this.game.ctx.save();

            const centerX = btn.x + btn.width / 2;
            const centerY = btn.y + btn.height / 2;
            this.game.ctx.translate(centerX, centerY);

            if (btn.isAnimatingIn) {
                const progress = btn.animTimer / btn.animDuration;
                const scaleY = 1 - Math.sin(progress * Math.PI) * -0.3; // Bounces up
                const scaleX = 1 + Math.sin(progress * Math.PI) * 0.3;  // Bulges out
                this.game.ctx.scale(scaleX, scaleY);
            } else if (btn.isAnimatingOut) {
                const progress = btn.animTimer / btn.animDuration;
                const scaleY = 1 - progress * 0.8; // Squishes down
                const scaleX = 1 + progress * 0.5; // Bulges out
                this.game.ctx.scale(scaleX, scaleY);
            }

            this.game.ctx.globalAlpha = btn.alpha;
            this.game.ctx.drawImage(img, -btn.width / 2, -btn.height / 2, btn.width, btn.height);
            this.game.ctx.restore();
        }
        


        this.game.ctx.restore(); // Restore screen shake translation

        const ctx = this.game.ctx;
        const ui = this.game.ui;
        const game = this.game;

        // Apply screen shake to the entire bottom UI bar
        const uiShakeOffset = game.screenShake.getOffset();
        ctx.save();
        ctx.translate(uiShakeOffset.x, uiShakeOffset.y);

        // BOTTOM UI BAR (All elements housed in the ground)
        const uiBarHeight = game.ui.barHeight; 
        const uiBarY = game.PLAYABLE_AREA_HEIGHT - 70; // The bar starts at the bottom of the playable area.
        const uiPadding = 15;
        const elementSpacing = 25;

        // Draw UI bar background
        if (uiBarHeight > 0) {
            ctx.fillStyle = '#eb9cbeff'; // Pink bar
            ctx.fillRect(0, uiBarY, game.width, uiBarHeight);
        }

        const centerY = uiBarY + (uiBarHeight / 2);
        const uiScale = 1.55; // 25% bigger


        // 1. Calculate widths of all elements for precise layout
        const xpBarTotalWidth = (game.xpBar.width * 0.6) * uiScale; 
        const shopButtonTotalWidth = ui.shopButton.width * uiScale; 
        ctx.font = `bold ${Math.floor(52 * uiScale)}px "VT323"`;
        const moneyTextTotalWidth = ctx.measureText(`$${game.money}`).width;
        const healthBarTotalWidth = (game.castleHealthBar.width * 0.3) * uiScale; 
        ctx.font = `bold ${Math.floor(40 * uiScale)}px "VT323"`;
        const turretCostTextTotalWidth = ctx.measureText(`$${game.getNextTurretCost()}`).width;
        const buildButtonTotalWidth = ui.buildButton.width * uiScale; 
        const settingsButtonTotalWidth = ui.settingsButton.width; 

        // 2. Health Bar (CENTERED)
        const healthBarX = (game.width / 2) - (healthBarTotalWidth / 2);
        game.castleHealthBar.height = 52 * uiScale;
        game.castleHealthBar.draw(ctx, healthBarX, centerY - (game.castleHealthBar.height / 2), healthBarTotalWidth);

        // 3. Place elements to the LEFT of Health Bar (XP, Shop, Money)
        let currentXLeft = healthBarX - elementSpacing; // Start at left edge of health bar, moving left
        
        // Money Display (rightmost of left group)
        currentXLeft -= moneyTextTotalWidth-30;
        ctx.save();
        const moneyShakeX = (Math.random() - 0.5) * game.uiShake.money;
        const moneyShakeY = (Math.random() - 0.5) * game.uiShake.money;
        ctx.translate(moneyShakeX, moneyShakeY);
        game.ui.moneyTextPos.x = currentXLeft;
        game.ui.moneyTextPos.y = centerY;
        ctx.font = 'bold 62px "VT323"'; 
        ctx.textAlign = 'left'; 
        ctx.textBaseline = 'middle';
        ctx.fillStyle = 'white';
        ctx.shadowColor = 'rgba(255, 238, 0, 0.5)';
        ctx.shadowBlur = 10;
        ctx.fillText(`$${game.money}`, currentXLeft, centerY);
        ctx.restore();
        ctx.shadowBlur = 0;
        currentXLeft -= (elementSpacing + xpBarTotalWidth + 30); // Move left for XP bar, added extra padding

        game.xpBar.height = 38 * uiScale;
        ctx.save();
        const xpShakeX = (Math.random() - 0.5) * game.uiShake.xp;
        const xpShakeY = (Math.random() - 0.5) * game.uiShake.xp;
        ctx.translate(xpShakeX, xpShakeY);
        game.ui.xpBarPos.x = currentXLeft + xpBarTotalWidth / 2;
        game.ui.xpBarPos.y = centerY;
        game.xpBar.draw(ctx, currentXLeft, centerY - (game.xpBar.height / 2), xpBarTotalWidth);
        ctx.restore();
        ctx.shadowBlur = 0;


        // 4. Place elements to the RIGHT of Health Bar (Turret Cost, Build, Settings)
        let currentXRight = healthBarX + healthBarTotalWidth + elementSpacing; // Start at right edge of health bar, moving right

        // Shop Button (now leftmost of right group)
        const shopBtn = ui.shopButton;
        shopBtn.x = currentXRight;
        shopBtn.y = centerY - (shopButtonTotalWidth / 2);
        currentXRight += shopButtonTotalWidth + elementSpacing;

        // Build Button (now middle of right group)
        const buildBtn = ui.buildButton;
        const cancelBtn = ui.cancelButton;
        buildBtn.x = currentXRight;
        buildBtn.y = centerY - (buildButtonTotalWidth / 2);
        cancelBtn.x = currentXRight; // Position cancel button at the same spot
        cancelBtn.y = centerY - (buildButtonTotalWidth / 2);
        // Draw Next Turret Cost above the build button, but only when not in build mode
        if (!game.isBuilding) {
            ctx.save();
            const turretCostShakeX = (Math.random() - 0.5) * game.uiShake.turretCost;
            const turretCostShakeY = (Math.random() - 0.5) * game.uiShake.turretCost;
            ctx.translate(turretCostShakeX, turretCostShakeY);

            ctx.font = `bold ${Math.floor(45 * uiScale)}px "VT323"`; // 50% bigger
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.fillStyle = game.turretCostTextColor;
            ctx.shadowColor = 'rgba(255, 0, 191, 0.5)';
            ctx.shadowBlur = 10;
            ctx.fillText(`$${game.getNextTurretCost()}`, buildBtn.x + (buildButtonTotalWidth / 2), buildBtn.y + 15);
            ctx.shadowBlur = 0;
            ctx.restore();
        }

        // Draw the moved shop button
        ctx.shadowColor = 'rgba(0, 183, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.save();
        const shopBtnCenterX = shopBtn.x + shopButtonTotalWidth / 2;
        const shopBtnCenterY = shopBtn.y + shopButtonTotalWidth / 2;
        ctx.translate(shopBtnCenterX, shopBtnCenterY);

        if (shopBtn.isAnimating) {
            const progress = shopBtn.animTimer / shopBtn.animDuration;
            // This creates a "boing" effect: shrinks then returns to normal size.
            const scale = 1 - Math.sin(progress * Math.PI) * 0.2; 
            const squish = 1 + Math.sin(progress * Math.PI) * 0.1;
            ctx.scale(squish, scale);
        }

        if (shopBtn.img.complete) {
            ctx.drawImage(shopBtn.img, -shopButtonTotalWidth / 2, -shopButtonTotalWidth / 2, shopButtonTotalWidth, shopButtonTotalWidth);
        }
        ctx.restore();
        ctx.shadowBlur = 0;

        // Draw the Build/Cancel button

        ctx.shadowBlur = 10;
        
        let buttonToDraw = buildBtn.img; // Default to build button

        if (game.isBuilding) {
            buttonToDraw = cancelBtn.img; // Show cancel button when building

            // Check if mouse is hovering over the cancel button
            if (game.mouse.x > cancelBtn.x && game.mouse.x < cancelBtn.x + cancelBtn.width &&
                game.mouse.y > cancelBtn.y && game.mouse.y < cancelBtn.y + cancelBtn.height) {
                buttonToDraw = cancelBtn.activeImg; // Use active image if hovering
            }
        }

        if (buttonToDraw && buttonToDraw.complete) {
            ctx.save();
            const buildBtnCenterX = buildBtn.x + buildButtonTotalWidth / 2;
            const buildBtnCenterY = buildBtn.y + buildButtonTotalWidth / 2;
            ctx.translate(buildBtnCenterX, buildBtnCenterY);
            if (buildBtn.isAnimating) {
                const progress = buildBtn.animTimer / buildBtn.animDuration;
                const scale = 1 - Math.sin(progress * Math.PI) * 0.2;
                const squish = 1 + Math.sin(progress * Math.PI) * 0.1;
                ctx.scale(squish, scale);
            }
            ctx.drawImage(buttonToDraw, -buildButtonTotalWidth / 2, -buildButtonTotalWidth / 2, buildButtonTotalWidth, buildButtonTotalWidth);
            ctx.restore();
        }
        ctx.shadowBlur = 0;
        currentXRight += buildButtonTotalWidth + elementSpacing;

        // Settings Button (rightmost of right group)
        const settingsBtn = ui.settingsButton;
        settingsBtn.x = currentXRight;
        settingsBtn.y = centerY - (settingsButtonTotalWidth / 2);
        ctx.shadowColor = 'rgba(0, 183, 255, 0.5)';
        ctx.shadowBlur = 10;
        ctx.save();
        const settingsBtnCenterX = settingsBtn.x + settingsButtonTotalWidth / 2;
        const settingsBtnCenterY = settingsBtn.y + settingsButtonTotalWidth / 2;
        ctx.translate(settingsBtnCenterX, settingsBtnCenterY);
        if (settingsBtn.isAnimating) {
            const progress = settingsBtn.animTimer / settingsBtn.animDuration;
            const scale = 1 - Math.sin(progress * Math.PI) * 0.2;
            const squish = 1 + Math.sin(progress * Math.PI) * 0.1;
            ctx.scale(squish, scale);
        }
        if (settingsBtn.img.complete) {
            ctx.drawImage(settingsBtn.img, -settingsButtonTotalWidth / 2, -settingsButtonTotalWidth / 2, settingsButtonTotalWidth, settingsButtonTotalWidth);
        }
        ctx.restore();
        ctx.shadowBlur = 0;

        ctx.restore(); // Restore from UI bar shake



        // Draw "Hold" text for build button feedback
        if (game.showHoldText) {
            const buildBtn = ui.buildButton;
            const textX = buildBtn.x + (buildBtn.width / 2);
            const textY = buildBtn.y - 20 - game.holdTextBounceOffset; // 20 pixels above button, plus bounce

            ctx.save();
            ctx.globalAlpha = game.holdTextAlpha;
            ctx.font = 'bold 28px "VT323"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = 'white';
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 5;
            ctx.fillText("Hold", textX, textY);
            ctx.restore();
        }

        // Draw Ghost Turret if in building mode (MOVED TO END OF DRAW)
        if (this.game.isBuilding && this.game.towersImage.complete) {
            const img = this.game.towersImage;
            const turretWidth = 137 * 0.9; // Scale down by 10%
            const turretHeight = 190 * 0.9;
            let drawX = this.game.mouse.x - (turretWidth / 2);
            let drawY = this.game.mouse.aimY - (turretHeight / 2); // Use aimY to account for offset
            let alpha = 0.5;
            let tintColor = null;

            if (this.game.highlightedSlot) {
                // If it's the cancel slot
                if (this.game.highlightedSlot.id === 'cancel') {
                    drawX = this.game.highlightedSlot.x - (turretWidth / 2);
                    drawY = this.game.highlightedSlot.y - (turretHeight / 2) - 10;
                    tintColor = 'red';
                    alpha = 0.7;
                } else { // It's a regular build slot
                    drawX = this.game.highlightedSlot.x - (turretWidth / 2) - 5;
                    drawY = this.game.highlightedSlot.y - (turretHeight / 2) - 180; // Match initial spawn height
                    if (this.game.highlightedSlot.isOccupied) {
                        tintColor = 'red';
                    }
                }
            }

            ctx.save();
            ctx.globalAlpha = alpha;
            if (tintColor === 'red') {
                ctx.filter = 'hue-rotate(180deg) brightness(1.5)';
            } 
            // Draw the ghost turret relative to the main canvas, not the UI bar
            ctx.drawImage(img, 0, 190, 137, 190, drawX, drawY, turretWidth, turretHeight);
            ctx.restore();
        }

        // Draw Build-Cancel Animation
        if (this.game.isCancelingBuild && this.game.towersImage.complete) {
            const animData = this.game.cancelAnimData;
            const visualCx = animData.x;
            // Adjust Y based on whether it was a cancel button or a build slot
            const visualCy = (animData.id === 'cancel') ? animData.y : animData.y - 80;

            ctx.save();
            ctx.translate(visualCx, visualCy);

            // Apply the same squish/sell animation logic
            const progress = this.game.cancelAnimTimer / this.game.cancelAnimDuration;
            const scale = 1 - progress;
            const squishY = 1 - progress * 0.8; // Squishes down
            const squishX = 1 + progress * 0.5; // Bulges out
            ctx.scale(scale * squishX, scale * squishY);
            ctx.globalAlpha = 1 - progress;

            // Draw the ghost turret image centered
            const img = this.game.towersImage;
            ctx.drawImage(img, 0, 190, 137, 190, -animData.width / 2, -animData.height, animData.width, animData.height);

            ctx.restore();
        }

        // --- Vignette Fade Logic ---
        const vignetteFadeOutSpeed = 0.01; // Normal speed for fading out
        const vignetteFadeInSpeed = .50; // 20x faster to compensate for bullet time (0.05 * 20 = 1.0 effective speed)

        if (this.game.isBuilding && this.game.vignetteAlpha < 0.25) {
            this.game.vignetteAlpha = Math.min(0.6, this.game.vignetteAlpha + vignetteFadeInSpeed * tsf);
        } else if (!this.game.isBuilding && this.game.vignetteAlpha > 0) {
            this.game.vignetteAlpha = Math.max(0, this.game.vignetteAlpha - vignetteFadeOutSpeed * tsf);
        }

        // Draw Vignette in Build Mode
        if (this.game.vignetteAlpha > 0) {
            ctx.save();
            const gradient = ctx.createRadialGradient(
                this.game.width / 2, this.game.height / 2, this.game.width * 0.3,
                this.game.width / 2, this.game.height / 2, this.game.width * 0.8
            );
            gradient.addColorStop(0, 'rgba(45, 16, 82, 0)');
            gradient.addColorStop(1, `rgba(100,10,100,${this.game.vignetteAlpha})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, this.game.width, this.game.height);
            ctx.restore();
        }

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

            // Glass tube background (assuming bossHealthContainer is the outer container)
            bossHealthContainer.style.background = 'rgba(255, 255, 255, 0.3)'; // Semi-transparent white
            bossHealthContainer.style.border = '2px solid rgba(255, 255, 255, 0.7)'; // Shiny border
            bossHealthContainer.style.boxShadow = 'inset 0 0 10px rgba(255, 255, 255, 0.5), 0 0 15px rgba(255, 255, 255, 0.3)'; // Inner and outer glow


            // Pulse effect
            const pulse = (Math.sin(this.game.gameTime * 0.05) + 1) / 2;
            bossPulseOverlay.style.opacity = 0.1 + (pulse * 0.2);

        } else {
            bossHealthContainer.style.display = 'none';
            bossPulseOverlay.style.display = 'none';
        }

        if (this.game.modalManager.isOpen()) {
            this.game.modalManager.draw(this.game.ctx);
        }

        requestAnimationFrame((t) => this.loop(t));
    }
}
