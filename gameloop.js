import Missile from './missile.js';
import Particle from './particle.js';
import { darkenColor } from './utils.js';
import Gumball from './gumball.js';


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
            if (Date.now() - this.game.sellTimer > 100) { // 400ms hold to activate
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
                    if (m.type === 'gummy_bear') {
                        this.game.castleHealth -= 10;
                    } else {
                        this.game.castleHealth -= 10;
                    }
                    this.game.castleHealthBar.triggerHit();
                    m.dead = true;
                    this.game.hitStopFrames = 5;
                    this.game.screenShake.trigger(5, 10);
                    for (let k = 0; k < 15; k++) this.game.particles.push(new Particle(this.game, m.x, m.y, '#e74c3c', 'smoke'));
                    
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

        // Draw the sell button if it's active
        if (this.game.ui.sellButton.visible) {
            const btn = this.game.ui.sellButton;
            const img = this.game.sellButtonUpImage;
            this.game.ctx.save();
            this.game.ctx.globalAlpha = btn.alpha;
            this.game.ctx.drawImage(img, btn.x, btn.y, btn.width, btn.height);
            this.game.ctx.restore();
        }

        this.game.decalManager.draw(this.game.ctx);
        if (this.game.boss) this.game.boss.draw(this.game.ctx);
        this.game.missiles.forEach(m => m.draw(this.game.ctx));
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
        this.game.floatingTexts.forEach(ft => ft.draw(this.game.ctx));

        this.game.lootPopupManager.draw(this.game.ctx);

        if (this.game.levelingManager.isLevelingUp) {
            this.game.audioManager.setMuffled(true);
            this.game.isPaused = true;
            this.game.levelUpScreen.update(tsf);
            this.game.levelUpScreen.draw(this.game.ctx);
        }

        // this.game.levelUpManagerScreen.update(tsf); // Now handled by ModalManager
        // this.game.levelUpManagerScreen.draw(this.game.ctx); // Now handled by ModalManager

        // Draw Ghost Turret if in building mode
        if (this.game.isBuilding && this.game.towersImage.complete) {
            const img = this.game.towersImage;
            const turretWidth = 137;
            const turretHeight = 190;
            let drawX = this.game.mouse.x - (turretWidth / 2);
            let drawY = this.game.mouse.y - (turretHeight / 2);
            let alpha = 0.5;
            let tintColor = null; 

            const cancelBtn = this.game.ui.cancelButton;
            const cancelBtnCenterX = cancelBtn.x + cancelBtn.width / 2;
            const cancelBtnCenterY = cancelBtn.y + cancelBtn.height / 2;
            const distToCancelBtn = Math.hypot(this.game.mouse.x - cancelBtnCenterX, this.game.mouse.y - cancelBtnCenterY);
            const SNAP_DISTANCE = 60; // Pixels to snap to cancel button

            if (distToCancelBtn < SNAP_DISTANCE) {
                // Snap to cancel button
                drawX = cancelBtnCenterX - (turretWidth / 2);
                drawY = cancelBtnCenterY - (turretHeight / 2);
                tintColor = 'red';
                alpha = 0.7; // Make it slightly more opaque when snapping
            } else if (this.game.highlightedSlot) {
                drawX = this.game.highlightedSlot.x - (turretWidth / 2);
                drawY = this.game.highlightedSlot.y - (turretHeight / 2);
                if (!this.game.highlightedSlot.canPlace) {
                    tintColor = 'red'; 
                }
            }

            this.game.ctx.save();
            this.game.ctx.globalAlpha = alpha; 
            if (tintColor === 'red') {
                this.game.ctx.filter = 'hue-rotate(180deg) brightness(1.5)'; 
            }
            this.game.ctx.drawImage(img, 0, 190, turretWidth, turretHeight, drawX, drawY, turretWidth, turretHeight);
            this.game.ctx.restore(); 
        }

        this.game.ctx.restore(); // Restore screen shake translation

        const ctx = this.game.ctx;
        const ui = this.game.ui;
        const game = this.game;

        // BOTTOM UI BAR (All elements housed in the ground)
        const uiBarHeight = game.ui.barHeight; 
        const uiBarY = game.PLAYABLE_AREA_HEIGHT - 70; // The bar starts at the bottom of the playable area.
        const uiPadding = 15;
        const elementSpacing = 15;

        // Draw UI bar background
        if (uiBarHeight > 0) {
            ctx.fillStyle = '#eb9cbeff'; // Pink bar
            ctx.fillRect(0, uiBarY, game.width, uiBarHeight);
        }

        const centerY = uiBarY + (uiBarHeight / 2);
        const uiScale = 1.55; // 25% bigger


        // 1. Calculate widths of all elements for precise layout
        const xpBarTotalWidth = (game.xpBar.width * 0.5) * uiScale; 
        const shopButtonTotalWidth = ui.shopButton.width * uiScale; 
        ctx.font = `bold ${Math.floor(52 * uiScale)}px "VT323"`;
        const moneyTextTotalWidth = ctx.measureText(`$${game.money}`).width;
        const healthBarTotalWidth = (game.castleHealthBar.width * 0.35) * uiScale; 
        ctx.font = `bold ${Math.floor(40 * uiScale)}px "VT323"`;
        const turretCostTextTotalWidth = ctx.measureText(`$${game.getNextTurretCost()}`).width;
        const buildButtonTotalWidth = ui.buildButton.width * uiScale; 
        const settingsButtonTotalWidth = ui.settingsButton.width; 

        // 2. Health Bar (CENTERED)
        const healthBarX = (game.width / 2) - (healthBarTotalWidth / 2);
        game.castleHealthBar.height = 52 * uiScale;
        game.castleHealthBar.draw(ctx, healthBarX, centerY - (game.castleHealthBar.height / 2), healthBarTotalWidth);

        // 3. Place elements to the LEFT of Health Bar (XP, Money)
        let currentXLeft = healthBarX - elementSpacing; // Start at left edge of health bar, moving left
        
        // Money Display (rightmost of the left-side elements)
        currentXLeft -= moneyTextTotalWidth; // Allocate space for money text
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

        // XP Bar (to the left of the money display)
        currentXLeft -= (elementSpacing + xpBarTotalWidth); // Move left again for the XP bar
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

        // 4. Place elements to the RIGHT of Health Bar (Shop, Build, Settings)
        let currentXRight = healthBarX + healthBarTotalWidth + elementSpacing; 

        // Shop Button (leftmost of right group)
        const shopBtn = ui.shopButton;
        shopBtn.x = currentXRight;
        shopBtn.y = centerY - (shopButtonTotalWidth / 2);
        ctx.shadowColor = 'rgba(0, 183, 255, 0.5)';
        ctx.shadowBlur = 10;
        if (shopBtn.img.complete) {
            ctx.drawImage(shopBtn.img, shopBtn.x, shopBtn.y, shopButtonTotalWidth, shopButtonTotalWidth);
        }
        ctx.shadowBlur = 0;
        currentXRight += shopButtonTotalWidth + elementSpacing;

        // Build Button (middle of right group)
        const buildBtn = ui.buildButton;
        const cancelBtn = ui.cancelButton;
        buildBtn.x = currentXRight;
        buildBtn.y = centerY - (buildButtonTotalWidth / 2);
        cancelBtn.x = currentXRight;
        cancelBtn.y = centerY - (buildButtonTotalWidth / 2);

        ctx.shadowColor = 'rgba(0, 183, 255, 0.5)';
        ctx.shadowBlur = 10;
        
        let buttonToDraw = buildBtn.img;

        if (game.isBuilding) {
            buttonToDraw = cancelBtn.img;
            if (game.mouse.x > cancelBtn.x && game.mouse.x < cancelBtn.x + cancelBtn.width &&
                game.mouse.y > cancelBtn.y && game.mouse.y < cancelBtn.y + cancelBtn.height) {
                buttonToDraw = cancelBtn.activeImg;
            }
        }

        if (buttonToDraw && buttonToDraw.complete) {
            ctx.drawImage(buttonToDraw, buildBtn.x, buildBtn.y, buildButtonTotalWidth, buildButtonTotalWidth);
        }
        ctx.shadowBlur = 0;

        // Draw Turret Cost Text on top of Build Button
        if (!game.isBuilding) { // Only draw if not in build mode
            ctx.font = `bold ${Math.floor(40 * uiScale)}px "VT323"`; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = this.game.turretCostTextColor;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 4;
            const costTextY = buildBtn.y + buildButtonTotalWidth * 0.6; // Position towards the bottom of the button
            ctx.fillText(`$${game.getNextTurretCost()}`, buildBtn.x + buildButtonTotalWidth / 2, costTextY);
            ctx.shadowBlur = 0;
        }
        
        currentXRight += buildButtonTotalWidth + elementSpacing;

        // Settings Button (rightmost of right group)
        const settingsBtn = ui.settingsButton;
        settingsBtn.x = currentXRight;
        settingsBtn.y = centerY - (settingsButtonTotalWidth / 2);
        ctx.shadowColor = 'rgba(0, 183, 255, 0.5)';
        ctx.shadowBlur = 10;
        if (settingsBtn.img.complete) { 
            ctx.drawImage(settingsBtn.img, settingsBtn.x, settingsBtn.y, settingsButtonTotalWidth, settingsButtonTotalWidth);
        }
        ctx.shadowBlur = 0;


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
