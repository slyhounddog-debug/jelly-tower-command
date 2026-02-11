import { darkenColor } from './utils.js';
import Gumball from './gumball.js';
import FrostingParticle from './frostingParticle.js';
import Particle from './particle.js';


export default class GameLoop {
    constructor(game) {
        this.game = game;
    }

    loop(currentTime) {
        // --- Start Frame Timing ---
        if (!this.game.lastTime) this.game.lastTime = currentTime;
        const deltaTime = Math.min(100, currentTime - this.game.lastTime); // Prevent super large delta on tab switch
        this.game.lastTime = currentTime;
        const frameStartTime = currentTime; // Mark the beginning of the frame processing

        let tsf = deltaTime / this.game.targetFrameTime;
        if (this.game.isBuilding) {
            tsf *= 0.05; // Game runs very slow in build mode
        }

        if (!this.game.gameStarted) {
            this.game.drawing.drawTitleScreen(this.game.ctx);
            requestAnimationFrame((t) => this.loop(t));
            return;
        }

        if (this.game.modalManager.isOpen()) {
            this.game.isPaused = true;
            this.game.modalManager.update(deltaTime / this.game.targetFrameTime);
        } else if (this.game.isPaused && !this.game.sellModeActive && !this.game.levelingManager.isLevelingUp) {
            this.game.isPaused = false;
        }

        if (this.game.hitStopFrames > 0) {
            this.game.hitStopFrames--;
            requestAnimationFrame((t) => this.loop(t));
            return;
        }
        
        this.game.update(tsf);

        
                this.game.screenShake.update(tsf);
        
                this.game.background.update(tsf);
                this.game.background.draw(this.game.ctx, this.game.PLAYABLE_AREA_HEIGHT);
                
        
        if (this.game.heldTurret && !this.game.sellModeActive) {
            if (Date.now() - this.game.sellTimer > 10) {
                this.game.sellModeActive = true;
                this.game.isPaused = true;
            }
        }

            if (this.game.castleHealth <= 0) {
                this.game.isGameOver = true;
                this.game.isPaused = true;
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
        if (!this.game.isPaused) {
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
            }

            const pLvl = this.game.emporiumUpgrades.piggy_cooldown.level;
            const pCooldown = this.game.emporiumUpgrades.piggy_cooldown.values[pLvl] * 60;
            this.game.piggyTimer += tsf;
            if (this.game.piggyTimer >= pCooldown) {
                this.game.piggyTimer = 0;
                this.game.enemyPools['piggy'].get(this.game, Math.random() * (this.game.width - 90) + 25, 'piggy');
                if (!this.game.piggyBankSeen) {
                    this.game.piggyBankSeen = true;
                    const curCD = this.game.emporiumUpgrades.piggy_cooldown.values[pLvl];
                    this.game.modalManager.toggle('piggy');
                }
            }

            this.game.castleHealthBar.update(tsf);
            this.game.thermometer.update(tsf);
            if (this.game.boss) this.game.boss.update(tsf);

            // Check for missiles reaching castle (modified to use pools)
            for (const type in this.game.enemyPools) {
                this.game.enemyPools[type].forEach(m => {
                    if (m.active && m.y > this.game.PLAYABLE_AREA_HEIGHT - 110) {  // enemy death vertical threshold 
                        this.game.castleHealth -= m.damage || 10;
                        this.game.castleHealthBar.triggerHit();
                        this.game.hitStopFrames = 5;
                        this.game.screenShake.trigger(5, 10);
                        // Old smoke particles removed - These will need pooling later
                        const particleCount = 10 + Math.floor(Math.random() * 10);
                        for (let k = 0; k < particleCount; k++) {
                            const colorChoice = Math.random();
                            let color;
                            if (colorChoice < 0.5) {
                                color = this.game.ENEMY_FROSTING_COLORS[Math.floor(Math.random() * this.game.ENEMY_FROSTING_COLORS.length)];
                            } else {
                                color = this.game.FROSTING_COLORS[Math.floor(Math.random() * this.game.FROSTING_COLORS.length)];
                            }
                            
                            const vx = (Math.random() - 0.5) * 8;
                            const vy = -Math.random() * 10 - 2;
                            const radius = Math.random() * 5 + 2;
                            const lifespan = 40 + Math.random() * 20;

                            this.game.frostingParticlePool.get(this.game, m.x + m.width / 2, m.y + m.height, vx, vy, radius, color, lifespan, 0.15, 'enemy');
                        }
                        this.game.damageSpotPool.get(this.game, m.x + m.width / 2, m.y + m.height / 2, m.width * 0.5);
                        this.game.enemyPools[type].returnToPool(m); 
                    }
                });
            }

            this.game.currentScore = (this.game.enemiesKilled * 50) + (this.game.totalMoneyEarned) + (this.game.gameTime / 30);
            // document.getElementById('score-display').textContent = this.game.currentScore.toFixed(0);
        // GEMINI_UPDATE_BLOCK_END


            this.game.projectilesPool.forEach(p => {
                if (!p.active) return; // Should not be needed if pool is managed correctly, but as a safeguard

                if (this.game.boss && !p.hasHitBoss &&
                    p.x > this.game.boss.x + this.game.boss.hitboxOffsetX &&
                    p.x < this.game.boss.x + this.game.boss.hitboxOffsetX + this.game.boss.hitboxWidth &&
                    p.y > this.game.boss.y + this.game.boss.hitboxOffsetY &&
                    p.y < this.game.boss.y + this.game.boss.hitboxOffsetY + this.game.boss.hitboxHeight) {
                    const isCrit = (Math.random() * 100 < this.game.stats.criticalHitChance);
                    let dmg = (p.hp || 10) * (isCrit ? 2 : 1);
                    this.game.boss.takeDamage(dmg, isCrit);
                    this.game.particlePool.get(this.game, p.x, p.y, '#fff', 'spark', null, 0.5);
                    if (!p.hasHit) { p.hasHit = true; this.game.shotsHit++; }
                    p.hasHitBoss = true;
                    if (p.popRockStacks > 0) {
                        p.createExplosion();
                    }
                    if (!p.chainBounceCount) {
                        p.reset(); // Return to pool
                    }
                }

                for (const type in this.game.enemyPools) {
                    let hit = false;
                    this.game.enemyPools[type].forEach(m => {
                        if (!m.active) return;
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
                            this.game.particlePool.get(this.game, p.x, p.y, '#fff', 'spark', null, 0.5);
                            if (!p.hasHit) { p.hasHit = true; this.game.shotsHit++; }
                            if (p.popRockStacks > 0) {
                                p.createExplosion();
                            }
                            if (!p.chainBounceCount) {
                                p.reset(); // Return to pool
                            }
                            hit = true;
                        }
                    });
                    if (hit) break; // Break from enemy type loop if hit, to prevent multiple hits per projectile per frame
                }
            });

            // Gravity Pull component logic
            this.game.projectilesPool.forEach(p => {
                if (p.gravityPullCount > 0) {
                    const pullRange = 50 * (1 + p.gravityPullCount * 0.15);
                    const pullForce = 0.1 * (1 + p.gravityPullCount * 0.15);
                    for (const type in this.game.enemyPools) {
                        this.game.enemyPools[type].forEach(m => {
                            if (m.active) {
                                const dist = Math.hypot(p.x - m.x, p.y - m.y);
                                if (dist < pullRange) {
                                    const angle = Math.atan2(p.y - m.y, p.x - m.x);
                                    m.x += Math.cos(angle) * pullForce * tsf;
                                    m.y += Math.sin(angle) * pullForce * tsf;
                                }
                            }
                        });
                    }
                }
            });

            // Cleanup

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

        this.game.decalManager.draw(this.game.ctx);
        if (this.game.boss) this.game.boss.draw(this.game.ctx);
        // Draw enemies from pools
        for (const type in this.game.enemyPools) {
            this.game.enemyPools[type].draw(this.game.ctx);
        }
        // Draw synergy lines once per frame, after missiles but before projectiles
        this.game.synergyLinePool.draw(this.game.ctx);
        // Draw projectiles from pool
        this.game.projectilesPool.draw(this.game.ctx);
        this.game.dropPool.forEach(d => { if (!d.isBeingLicked) d.draw(this.game.ctx); });
        this.game.thermometer.draw(this.game.ctx);
        this.game.xpBar.draw(this.game.ctx);
        // Draw souls from pool
        this.game.soulPool.draw(this.game.ctx);
        // Draw particles from pool
        this.game.particlePool.draw(this.game.ctx);
        // Draw debris from pool
        this.game.enemyDebrisPool.draw(this.game.ctx);
        // Draw frosting particles from pool
        this.game.frostingParticlePool.draw(this.game.ctx);
        // Draw damage spots from pool
        this.game.damageSpotPool.draw(this.game.ctx);
        // Draw wave attacks from pool
        this.game.waveAttackPool.draw(this.game.ctx);

        this.game.player.draw(this.game.ctx);
        this.game.drawSwipeTrail(this.game.ctx);
        this.game.swipeParticlePool.draw(this.game.ctx);
        this.game.dropPool.forEach(d => { if (d.isBeingLicked) d.draw(this.game.ctx); });
        this.game.gumballPool.draw(this.game.ctx);
        // Draw floating texts from pool
        this.game.floatingTextPool.draw(this.game.ctx);

        this.game.lootPopupManager.draw(this.game.ctx);
        this.game.modalManager.draw(this.game.ctx);

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


        // 1. Calculate widths of all elements for precise layout
        const xpBarTotalWidth = (game.xpBar.width * 0.6) * game.ui.uiScale; 
        const shopButtonTotalWidth = ui.shopButton.width * game.ui.uiScale; 
        ctx.font = `bold ${Math.floor(52 * game.ui.uiScale)}px "VT323"`;
        const moneyTextTotalWidth = ctx.measureText(`$${game.money}`).width;
        const healthBarTotalWidth = (game.castleHealthBar.width * 0.3) * game.ui.uiScale; 
        ctx.font = `bold ${Math.floor(40 * game.ui.uiScale)}px "VT323"`;
        const turretCostTextTotalWidth = ctx.measureText(`$${game.getNextTurretCost()}`).width;
        const buildButtonTotalWidth = ui.buildButton.width * game.ui.uiScale; 
        const settingsButtonTotalWidth = ui.settingsButton.width; 

        // 2. Health Bar (CENTERED)
        const healthBarX = (game.width / 2) - (healthBarTotalWidth / 2);
        game.castleHealthBar.height = 52 * game.ui.uiScale;
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

        game.xpBar.height = 38 * game.ui.uiScale;
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

            ctx.font = `bold ${Math.floor(45 * game.ui.uiScale)}px "VT323"`; // 50% bigger
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
        } else if (shopBtn.isShaking) {
            const progress = shopBtn.shakeTimer / shopBtn.shakeDuration;
            const shakeOffset = Math.sin(progress * Math.PI * 4) * 8; // 4 shakes
            ctx.translate(shakeOffset, 0);
        }

        const nextTurretCost = game.getNextTurretCost();
        let buttonImage = shopBtn.img;
        if (game.money < nextTurretCost) {
            buttonImage = game.disabledButtonImage;
        }

        if (buttonImage.complete) {
            ctx.drawImage(buttonImage, -shopButtonTotalWidth / 2, -shopButtonTotalWidth / 2, shopButtonTotalWidth, shopButtonTotalWidth);
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
            let drawY = this.game.mouse.y - (turretHeight / 2); // Use y to account for offset
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

        // Calculate actual frame time and FPS
        const frameEndTime = performance.now();
        this.game.frameTime = frameEndTime - frameStartTime;

        // Update FPS (average over ~1 second)
        this.game.fpsHistory.push(1000 / deltaTime);
        if (this.game.fpsHistory.length > 60) { // Keep last 60 delta times
            this.game.fpsHistory.shift();
        }
        this.game.fps = this.game.fpsHistory.reduce((a, b) => a + b) / this.game.fpsHistory.length;

        // Draw Debug HUD last
        this.game.drawDebugHUD(this.game.ctx);

        requestAnimationFrame((t) => this.loop(t));
    }
}
