import { drawNineSlice } from './utils.js';
import ComponentQuarters from './componentQuarters.js';
import Particle from './particle.js';

const BUTTON_WIDTH = 256;
const BUTTON_HEIGHT = 112;

export default class ModalManager {
    constructor(game) {
        this.game = game;
        this.activeModal = null; // 'shop', 'components', 'player', 'emporium', or null
        this.isOpening = false;
        this.isClosing = false;
        this.animationProgress = 0;
        this.animationDuration = 15; // In frames/ticks
        this.closeDelayTimer = 0; // New: Timer for preventing immediate closure
        this.closeDelayDuration = 60; // 1 second at 60 FPS

        this.uiButtonsImage = new Image();
        this.uiButtonsImage.src = 'assets/Images/uibuttons.png';
        this.componentQuartersImage = new Image();
        this.componentQuartersImage.src = 'assets/Images/componentquarters.png';
        this.levelUpManagerImage = new Image();
        this.levelUpManagerImage.src = 'assets/Images/levelupmanager.png';
        this.shopOverlayImage = new Image();
        this.shopOverlayImage.src = 'assets/Images/shopoverlay.png';
        this.piggyModalImage = new Image();
        this.piggyModalImage.src = 'assets/Images/piggybankmodal.png';
        this.componentModalImage = new Image(); // This refers to the single component pickup modal
        this.componentModalImage.src = 'assets/Images/componentmodal.png';
        this.bossModalImage = new Image();
        this.bossModalImage.src = 'assets/Images/bossmodal.png';
        this.modalConfirmUpImage = new Image();
        this.modalConfirmUpImage.src = 'assets/Images/modalconfirmup.png';

        // Dynamically calculate MODAL_CONFIG based on game dimensions
        this.MODAL_CONFIG = {
            shop: {
                width: this.game.width * 0.8,
                height: this.game.PLAYABLE_AREA_HEIGHT * 0.7,
                x: (this.game.width - (this.game.width * 0.8)) / 2,
                y: (this.game.PLAYABLE_AREA_HEIGHT - (this.game.PLAYABLE_AREA_HEIGHT * 0.7)) / 2,
                image: this.shopOverlayImage,
            },
            emporium: { // Emporium reuses the shop's layout
                width: this.game.width * 0.8,
                height: this.game.PLAYABLE_AREA_HEIGHT * 0.7,
                x: (this.game.width - (this.game.width * 0.8)) / 2,
                y: (this.game.PLAYABLE_AREA_HEIGHT - (this.game.PLAYABLE_AREA_HEIGHT * 0.7)) / 2,
                image: this.shopOverlayImage, // Re-use the shop background
            },
            components: {
                width: this.game.width * 0.7,
                height: this.game.PLAYABLE_AREA_HEIGHT * 0.6,
                x: (this.game.width - (this.game.width * 0.7)) / 2,
                y: (this.game.PLAYABLE_AREA_HEIGHT - (this.game.PLAYABLE_AREA_HEIGHT * 0.6)) / 2,
                image: this.componentQuartersImage,
            },
            player: { // This is for the level-up/player screen
                width: this.game.width * 0.9,
                height: this.game.PLAYABLE_AREA_HEIGHT * 0.8,
                x: (this.game.width - (this.game.width * 0.9)) / 2,
                y: (this.game.PLAYABLE_AREA_HEIGHT - (this.game.PLAYABLE_AREA_HEIGHT * 0.8)) / 2,
                image: this.levelUpManagerImage,
            }
        };


        this.componentQuarters = new ComponentQuarters(this.game);

        this.buttons = [];
    }

    getModalConfig(modalName) {
        // Dynamically calculate x, y for centering fixed-size modals
        const calculateCenteredPosition = (width, height) => {
            const x = (this.game.width - width) / 2;
            const y = (this.game.PLAYABLE_AREA_HEIGHT - height) / 2;
            return { x, y };
        };

        const config = this.MODAL_CONFIG[modalName];
        if (config) return config; // Return existing config for shop, components, player

        // For other modals, calculate fixed dimensions and center them
        switch (modalName) {
            case 'piggy': {
                const width = this.game.width * 0.6;
                const height = this.game.PLAYABLE_AREA_HEIGHT * 0.5;
                const { x, y } = calculateCenteredPosition(width, height);
                const buttonWidth = 100;
                const buttonHeight = 65;
                return { 
                    x, y, width, height, image: this.piggyModalImage,
                    confirmButton: {
                        x: x + (width - buttonWidth) / 2,
                        y: y + height - buttonHeight - 120 + 100, // Adjusted Y: moved up by 100
                        width: buttonWidth,
                        height: buttonHeight
                    }
                };
            }
            case 'component_modal': {
                const width = this.game.width * 0.6;
                const height = this.game.PLAYABLE_AREA_HEIGHT * 0.5;
                const { x, y } = calculateCenteredPosition(width, height);
                const buttonWidth = 108;
                const buttonHeight = 70;
                return { 
                    x, y, width, height, image: this.componentModalImage,
                    confirmButton: {
                        x: x + (width - buttonWidth) / 2,
                        y: y + height - buttonHeight - 120 + 100, // Adjusted Y: moved up by 100
                        width: buttonWidth,
                        height: buttonHeight
                    }
                };
            }
            case 'boss': {
                const width = this.game.width * 0.7;
                const height = this.game.PLAYABLE_AREA_HEIGHT * 0.6;
                const { x, y } = calculateCenteredPosition(width, height);
                const buttonWidth = 116;
                const buttonHeight = 75;
                return { 
                    x: x, y: y, width: width, height: height, image: this.bossModalImage,
                    confirmButton: {
                        x: x + (width - buttonWidth) / 2,
                        y: y + height - buttonHeight - 120 + 100, // Adjusted Y: moved up by 100
                        width: buttonWidth,
                        height: buttonHeight
                    }
                };
            }
            default:
                return null;
        }
    }
    
    initializeComponentQuarters() {
        this.componentQuarters.generateComponentItems();
    }
    
    isOpen() {
        return this.activeModal !== null || this.isClosing;
    }

    open(modalName) {
        console.log('modalManager.open called', modalName);
        if (this.isOpening || this.isClosing || this.activeModal === modalName) return;

        // If another modal is already open, close it first before opening the new one.
        if (this.activeModal && this.activeModal !== modalName) {
            this.close();
        }

        if ((!this.game.gameStarted || this.game.isGameOver) && modalName !== 'emporium') return;

        this.activeModal = modalName;
        this.isOpening = true;
        this.isClosing = false;
        this.animationProgress = 0; // Start animation from the beginning

        if (['piggy', 'component_modal', 'boss'].includes(modalName)) {
            this.closeDelayTimer = this.closeDelayDuration;
        } else {
            this.closeDelayTimer = 0; // No delay for other modals
        }

        this.game.isPaused = true;
        this.game.audioManager.setMuffled(true);
        this.game.audioManager.playSound('purchase');
        
        const config = this.getModalConfig(modalName); // Use the new getModalConfig
        if (!config) return;

        if (modalName === 'player') {
            this.game.levelUpManagerScreen.organizeCards(config);
        } 

        // Define buttons based on the new spec. Only for top-level navigation modals.
        if (['shop', 'components', 'player', 'emporium'].includes(modalName)) {
            this.game.lastOpenedMenu = modalName; // Remember the last opened menu
            const buttonY = config.y + 20;
            const totalButtonWidth = 3 * BUTTON_WIDTH + 2 * 10; // 3 buttons, 2 gaps
            const startX = (this.game.width - totalButtonWidth) / 2;

            this.buttons = ['shop', 'components', 'player'].map((name, index) => ({
                name: name, x: startX + index * (BUTTON_WIDTH + 10), y: buttonY, width: BUTTON_WIDTH, height: BUTTON_HEIGHT,
                isAnimating: false, animTimer: 0, animDuration: 12
            }));
        } else {
            this.buttons = []; // No navigation buttons for these simple modals
        }
    }

    close() {
        console.log('modalManager.close called');
        if (!this.isOpen() || this.isClosing) return;
        
        this.isClosing = true;
        this.isOpening = false;
        this.animationProgress = 0; // Start closing animation

        this.game.audioManager.playSound('reset');
        // The rest of the cleanup will happen in update() after the animation finishes
    }

    switch_to(modalName) {
        this.activeModal = modalName;
        this.game.lastOpenedMenu = modalName;

        const config = this.getModalConfig(modalName);
        if (!config) return;

        if (modalName === 'player') {
            this.game.levelUpManagerScreen.organizeCards(config);
        }

        if (['shop', 'components', 'player', 'emporium'].includes(modalName)) {
            const buttonY = config.y + 20;
            const totalButtonWidth = 3 * BUTTON_WIDTH + 2 * 10;
            const startX = (this.game.width - totalButtonWidth) / 2;

            this.buttons = ['shop', 'components', 'player'].map((name, index) => ({
                name: name, x: startX + index * (BUTTON_WIDTH + 10), y: buttonY, width: BUTTON_WIDTH, height: BUTTON_HEIGHT,
                isAnimating: false, animTimer: 0, animDuration: 12
            }));
        } else {
            this.buttons = [];
        }
    }

    toggle(modalName) {
        if (this.activeModal === modalName) {
            this.close();
        } else if (this.activeModal) {
            this.switch_to(modalName);
        } else {
            this.open(modalName);
        }
    }

    handleInput() {
        if (!this.isOpen() || this.closeDelayTimer > 0) return;
        
        const adjustedMouseX = this.game.mouse.x; // Mouse X is fine
        const adjustedMouseY = this.game.mouse.y + 100; // Adjust mouse Y for global canvas translate offset
        
        const config = this.getModalConfig(this.activeModal);
        
        // Handle confirm button click
        if (config && config.confirmButton) {
            const btn = config.confirmButton;
            if (adjustedMouseX >= btn.x && adjustedMouseX <= btn.x + btn.width &&
                adjustedMouseY >= btn.y && adjustedMouseY <= btn.y + btn.height) {
                this.close();
                return; // Consume the click
            }
        }

        if (config) { // Only check if config exists for the active modal
            // Check if click is outside the modal's main content area
            if (!(adjustedMouseX >= config.x && adjustedMouseX <= config.x + config.width &&
                  adjustedMouseY >= config.y && adjustedMouseY <= config.y + config.height)) {
                this.close(); // Clicked outside the modal
                return; // Consume the click
            }
        }

        // Check button clicks for modal navigation
        for (const button of this.buttons) {
            if (adjustedMouseX > button.x && adjustedMouseX < button.x + button.width &&
                adjustedMouseY > button.y && adjustedMouseY < button.y + button.height) {
                button.isAnimating = true;
                button.animTimer = 0;
                this.toggle(button.name);
                return; // Navigation click handled, stop processing.
            }
        }

        // If no navigation button was clicked, delegate to the active modal's input handler
        let clickHandledByModal = false;
        switch (this.activeModal) {
            case 'shop':
                if (this.game.shop && typeof this.game.shop.handleInput === 'function') {
                    clickHandledByModal = this.game.shop.handleInput(adjustedMouseX, adjustedMouseY);
                }
                break;
            case 'components':
                if (this.componentQuarters && typeof this.componentQuarters.handleInput === 'function') {
                    clickHandledByModal = this.componentQuarters.handleInput(adjustedMouseX, adjustedMouseY);
                }
                break;
            case 'player':
                if (this.game.levelUpManagerScreen && typeof this.game.levelUpManagerScreen.handleInput === 'function') {
                    clickHandledByModal = this.game.levelUpManagerScreen.handleInput(adjustedMouseX, adjustedMouseY);
                }
                break;
            case 'emporium':
                if (this.game.emporium && typeof this.game.emporium.handleInput === 'function') {
                    clickHandledByModal = this.game.emporium.handleInput(adjustedMouseX, adjustedMouseY);
                }
                break;
            // No specific input handling for piggy, component_modal, boss as they are simple display modals
        }
        if (clickHandledByModal) {
            return; // Click consumed by the active modal, stop further processing
        }
    }
    
    update(tsf) {
        if (!this.isOpen() && !this.isOpening && !this.isClosing) return;

        // Handle animation logic
        if (this.isOpening || this.isClosing) {
            this.animationProgress = Math.min(this.animationDuration, this.animationProgress + tsf);
            if (this.isClosing) {
                this.createSparks();
            }

            if (this.animationProgress >= this.animationDuration) {
                if (this.isOpening) {
                    this.isOpening = false;
                }
                if (this.isClosing) {
                    this.isClosing = false;
                    const closedModalName = this.activeModal;
                    this.activeModal = null;

                    // Perform the actual close operations now
                    this.game.isPaused = false;
                    this.game.audioManager.setMuffled(false);
                    this.game.lastTime = 0; // Prevent time jump

                    if (closedModalName === 'player') {
                        this.game.levelUpManagerScreen.resetMagnifiedCard();
                    }
                }
            }
        }

        if (this.closeDelayTimer > 0) {
            this.closeDelayTimer -= tsf;
            if (this.closeDelayTimer < 0) this.closeDelayTimer = 0; // Ensure it doesn't go negative
        }



        // Update button animations
        this.buttons.forEach(button => {
            if (button.isAnimating) {
                button.animTimer += tsf;
                if (button.animTimer >= button.animDuration) {
                    button.isAnimating = false;
                }
            }
        });
        switch (this.activeModal) {
            case 'shop':
                this.game.shop.update(tsf);
                break;
            case 'components':
                this.componentQuarters.update(tsf);
                break;
            case 'player':
                this.game.levelUpManagerScreen.update(tsf);
                break;
            case 'emporium':
                this.game.emporium.update(tsf);
                break;
            // No specific update logic for piggy, component_modal, boss
        }
    }

    createSparks() {
        const shopButton = this.game.ui.shopButton;
        const x = shopButton.x + shopButton.width / 2;
        const y = shopButton.y + 100; // 100 pixels down

        const themedColors = {
            shop: ['#fdffb6', '#ffd6a5'],
            components: ['#caffbf', '#9bf6ff'],
            player: ['#a0c4ff', '#bdb2ff'],
            emporium: ['#ffadad', '#ffd6a5'],
        };

        const colors = themedColors[this.activeModal] || ['#ffffff'];

        for (let i = 0; i < 5; i++) { // Half the particles
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particle = this.game.particlePool.get();
            if (particle) {
                const angle = -Math.PI / 2 + (Math.random() - 0.5) * (Math.PI / 2);
                const speed = Math.random() * 6 + 3; // Increased speed
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                const initialSize = (Math.random() * 3 + 2) * 1.25; // 25% larger particles
                particle.init(this.game, x, y, color, 'spark', initialSize, 0.5, vx, vy); // Half the lifespan
            }
        }
    }

    draw(ctx) {
        if (!this.isOpen() && !this.isOpening && !this.isClosing) return;

        // --- Easing Function ---
        const easeInOutCubic = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        let progress = this.animationProgress / this.animationDuration;
        const easedProgress = easeInOutCubic(progress);

        // Draw darkened background
        const bgAlpha = this.isClosing ? (1 - easedProgress) * 0.27 : easedProgress * 0.27;
        ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        const config = this.getModalConfig(this.activeModal);
        if (!config) return;

        const shopButton = this.game.ui.shopButton;
        const startX = shopButton.x;
        const startY = shopButton.y;
        const startWidth = shopButton.width;
        const startHeight = shopButton.height;

        const endX = config.x;
        const endY = config.y;
        const endWidth = config.width;
        const endHeight = config.height;

        const animMultiplier = this.isClosing ? 1 - easedProgress : easedProgress;

        const currentWidth = startWidth + (endWidth - startWidth) * animMultiplier;
        const currentHeight = startHeight + (endHeight - startHeight) * animMultiplier;
        const currentX = startX + (endX - startX) * animMultiplier;
        const currentY = startY + (endY - startY) * animMultiplier;

        // --- Rotation ---
        const rotation = (1 - animMultiplier) * -Math.PI / 8; // Rotate up to -22.5 degrees

        // --- Skew ---
        const skewAmount = Math.sin(progress * Math.PI) * 0.2;

        ctx.save();
        ctx.translate(currentX + currentWidth / 2, currentY + currentHeight / 2);
        ctx.rotate(rotation);
        ctx.translate(-(currentX + currentWidth / 2), -(currentY + currentHeight / 2));
        
        ctx.save();
        ctx.translate(currentX, currentY);
        ctx.transform(1, skewAmount, skewAmount, 1, 0, 0);

        // --- Fade In/Out for Modal Content ---
        const contentAlpha = Math.sin(animMultiplier * Math.PI / 2);
        ctx.globalAlpha = contentAlpha;

        if (config.image && config.image.complete) {
            drawNineSlice(ctx, config.image, 0, 0, currentWidth, currentHeight, 30);
        }
        
        ctx.restore();
        ctx.restore();

        // Only draw modal contents if fully open
        if (!this.isOpening && !this.isClosing && this.activeModal) {
            ctx.globalAlpha = 1.0; // Ensure full opacity when static
            switch (this.activeModal) {
                case 'shop':
                    this.game.shop.draw(ctx);
                    break;
                case 'emporium':
                    this.game.emporium.draw(ctx);
                    break;
                case 'components':
                    this.componentQuarters.draw(ctx);
                    break;
                case 'player':
                    this.game.levelUpManagerScreen.draw(ctx);
                    break;
            }

            // Draw confirm button for specific modals
            if (config.confirmButton && this.modalConfirmUpImage && this.modalConfirmUpImage.complete) {
                const btn = config.confirmButton;
                ctx.drawImage(this.modalConfirmUpImage, btn.x, btn.y, btn.width, btn.height);
            }

            // Draw UI buttons
            if (['shop', 'components', 'player', 'emporium'].includes(this.activeModal)) {
                this.buttons.forEach((button, index) => {
                    const isSelected = button.name === this.activeModal;
                    const sx = index * BUTTON_WIDTH;
                    const sy = isSelected ? BUTTON_HEIGHT : 0;

                    ctx.save();
                    const btnCenterX = button.x + button.width / 2;
                    const btnCenterY = button.y + button.height / 2;
                    ctx.translate(btnCenterX, btnCenterY);

                    if (button.isAnimating) {
                        const progress = button.animTimer / button.animDuration;
                        const scale = 1 - Math.sin(progress * Math.PI) * 0.2;
                        const squish = 1 + Math.sin(progress * Math.PI) * 0.1;
                        ctx.scale(squish, scale);
                    }
                    ctx.drawImage(this.uiButtonsImage, sx, sy, BUTTON_WIDTH, BUTTON_HEIGHT, -button.width / 2, -button.height / 2, BUTTON_WIDTH, BUTTON_HEIGHT);
                    ctx.restore();
                });
            }
        }
    }
}
