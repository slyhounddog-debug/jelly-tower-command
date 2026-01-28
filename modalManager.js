import { drawNineSlice } from './utils.js';
import ComponentQuarters from './componentQuarters.js';

const BUTTON_WIDTH = 256;
const BUTTON_HEIGHT = 112;

export default class ModalManager {
    constructor(game) {
        this.game = game;
        this.activeModal = null; // 'shop', 'components', 'player', 'emporium', or null

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

        // Dynamically calculate MODAL_CONFIG based on game dimensions
        this.MODAL_CONFIG = {
            shop: {
                x: this.game.width * 0.1,
                y: this.game.PLAYABLE_AREA_HEIGHT * 0.05,
                width: this.game.width * 0.8,
                height: this.game.PLAYABLE_AREA_HEIGHT * 0.7,
                image: this.shopOverlayImage,
            },
            emporium: { // Emporium reuses the shop's layout
                x: this.game.width * 0.1,
                y: this.game.PLAYABLE_AREA_HEIGHT * 0.05,
                width: this.game.width * 0.8,
                height: this.game.PLAYABLE_AREA_HEIGHT * 0.7,
                image: this.shopOverlayImage, // Re-use the shop background
            },
            components: {
                x: this.game.width * 0.15,
                y: this.game.PLAYABLE_AREA_HEIGHT * 0.05,
                width: this.game.width * 0.7,
                height: this.game.PLAYABLE_AREA_HEIGHT * 0.6,
                image: this.componentQuartersImage,
            },
            player: { // This is for the level-up/player screen
                x: this.game.width * 0.05,
                y: this.game.PLAYABLE_AREA_HEIGHT * 0.05,
                width: this.game.width * 0.9,
                height: this.game.PLAYABLE_AREA_HEIGHT * 0.8,
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
                const width = this.game.width * 0.35; // 0.5 * 0.7
                const height = this.game.PLAYABLE_AREA_HEIGHT * 0.42; // 0.6 * 0.7
                const { x, y } = calculateCenteredPosition(width, height);
                return { x, y, width, height, image: this.piggyModalImage };
            }
            case 'component_modal': { // Corrected name for clarity
                const width = this.game.width * 0.35; // 0.5 * 0.7
                const height = this.game.PLAYABLE_AREA_HEIGHT * 0.42; // 0.6 * 0.7
                const { x, y } = calculateCenteredPosition(width, height);
                return { x, y, width, height, image: this.componentModalImage };
            }
            case 'boss': {
                const width = this.game.width * 0.42;
                const height = this.game.PLAYABLE_AREA_HEIGHT * 0.49;
                const { x, y } = calculateCenteredPosition(width, height);
                return { x, y, width, height, image: this.bossModalImage };
            }
            default:
                return null;
        }
    }
    
    initializeComponentQuarters() {
        this.componentQuarters.generateComponentItems();
    }
    
    isOpen() {
        return this.activeModal !== null;
    }

    open(modalName) {
        if (!this.game.gameStarted || this.game.isGameOver) return;
        this.activeModal = modalName;
        this.game.isPaused = true;
        this.game.audioManager.setMuffled(true);
        this.game.audioManager.playSound('purchase');
        
        const config = this.getModalConfig(modalName); // Use the new getModalConfig
        if (!config) return;

        if (modalName === 'player') {
            this.game.levelUpManagerScreen.organizeCards(config);
        } else if (['piggy', 'component_modal', 'boss'].includes(modalName)) { // These are HTML modals
            const modalId = modalName === 'component_modal' ? 'component-modal' : `${modalName}-modal`;
            document.getElementById(modalId).style.display = 'block';
            // Adjust button position dynamically since it's an HTML modal
            const confirmButton = document.querySelector(`#${modalId} .modal-confirm-button`);
            if (confirmButton) {
                confirmButton.style.position = 'absolute';
                confirmButton.style.setProperty('top', '85%', 'important');
            }
        }

        // Define buttons based on the new spec. Only for top-level navigation modals.
        if (['shop', 'components', 'player', 'emporium'].includes(modalName)) {
            const buttonY = config.y + 20;
            const totalButtonWidth = 3 * BUTTON_WIDTH + 2 * 10; // 3 buttons, 2 gaps
            const startX = (this.game.width - totalButtonWidth) / 2;

            this.buttons = [
                { name: 'shop', x: startX, y: buttonY, width: BUTTON_WIDTH, height: BUTTON_HEIGHT },
                { name: 'components', x: startX + BUTTON_WIDTH + 10, y: buttonY, width: BUTTON_WIDTH, height: BUTTON_HEIGHT },
                { name: 'player', x: startX + 2 * (BUTTON_WIDTH + 10), y: buttonY, width: BUTTON_WIDTH, height: BUTTON_HEIGHT },
            ];
        } else {
            this.buttons = []; // No navigation buttons for these simple modals
        }
    }

    close() {
        if (!this.isOpen()) return;
        const closedModalName = this.activeModal;
        this.activeModal = null;
        this.game.isPaused = false;
        this.game.audioManager.setMuffled(false);
        this.game.audioManager.playSound('reset');
        this.game.lastTime = 0; // Prevent time jump
        
        // Ensure specific modals are closed via their JS if they weren't managed by modalManager
        if (['piggy', 'component_modal', 'boss'].includes(closedModalName)) {
            const modalId = closedModalName === 'component_modal' ? 'component-modal' : `${closedModalName}-modal`;
            document.getElementById(modalId).style.display = 'none';
        } else if (closedModalName === 'player') {
            this.game.levelUpManagerScreen.resetMagnifiedCard();
        }
    }

    toggle(modalName) {
        if (this.activeModal === modalName) {
            this.close();
        } else {
            // Close any currently active modal before opening a new one
            if (this.activeModal) {
                this.close();
            }
            this.open(modalName);
        }
    }

    handleInput() {
        if (!this.isOpen()) return;

        // Check button clicks for modal navigation
        for (const button of this.buttons) {
            if (this.game.mouse.x > button.x && this.game.mouse.x < button.x + button.width &&
                this.game.mouse.y > button.y && this.game.mouse.y < button.y + button.height) {
                this.toggle(button.name);
                return; // Navigation click handled, stop processing.
            }
        }

        // If no navigation button was clicked, delegate to the active modal's input handler
        switch (this.activeModal) {
            case 'shop':
                this.game.shop.handleInput();
                break;
            case 'components':
                this.componentQuarters.handleInput();
                break;
            case 'player':
                this.game.levelUpManagerScreen.handleInput();
                break;
            case 'emporium':
                this.game.emporium.handleInput();
                break;
            // No specific input handling for piggy, component_modal, boss as they are simple display modals
        }
    }
    
    update(tsf) {
        if (!this.isOpen()) return;

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

    draw(ctx) {
        if (!this.isOpen()) return;

        // Draw darkened background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.27)';
        ctx.fillRect(0, 0, this.game.width, this.game.PLAYABLE_AREA_HEIGHT-100); // Only darken playable area

        const config = this.getModalConfig(this.activeModal);
        if (!config || !config.image) {
            // If no specific image, draw a generic modal background (or just the dimmed background)
            // For now, let's just return if no image is found for simple modals like piggy, boss, etc.
            if (!['shop', 'components', 'player'].includes(this.activeModal)) {
                // If it's one of the simple modals, just draw a basic background if no image is configured
                ctx.fillStyle = 'rgba(50, 50, 50, 0.9)'; // A generic modal background
                ctx.fillRect(config.x, config.y, config.width, config.height);
            }
        }


        // Draw modal background
        switch (this.activeModal) {
            case 'shop':
                if (config.image && config.image.complete) {
                    drawNineSlice(ctx, config.image, config.x, config.y, config.width, config.height, 30);
                }
                this.game.shop.draw(ctx);
                break;
            case 'emporium':
                if (config.image && config.image.complete) {
                    drawNineSlice(ctx, config.image, config.x, config.y, config.width, config.height, 30);
                }
                this.game.emporium.draw(ctx);
                break;
            case 'components':
                if (config.image && config.image.complete) {
                    drawNineSlice(ctx, config.image, config.x, config.y, config.width, config.height, 30);
                }
                this.componentQuarters.draw(ctx);
                break;
            case 'player':
                 if (config.image && config.image.complete) {
                    drawNineSlice(ctx, config.image, config.x, config.y, config.width, config.height, 30);
                }
                this.game.levelUpManagerScreen.draw(ctx);
                break;

        }

        // Draw UI buttons (only if active modal is one of the navigation modals)
        if (['shop', 'components', 'player', 'emporium'].includes(this.activeModal)) {
            this.buttons.forEach((button, index) => {
                const isSelected = button.name === this.activeModal;
                const sx = index * BUTTON_WIDTH;
                const sy = isSelected ? BUTTON_HEIGHT : 0;
                ctx.drawImage(this.uiButtonsImage, sx, sy, BUTTON_WIDTH, BUTTON_HEIGHT, button.x, button.y, BUTTON_WIDTH, BUTTON_HEIGHT);
            });
        }
    }
}
