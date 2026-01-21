import { drawNineSlice } from './utils.js';
import ComponentQuarters from './componentQuarters.js';

const BUTTON_WIDTH = 179;
const BUTTON_HEIGHT = 78;

export default class ModalManager {
    constructor(game) {
        this.game = game;
        this.activeModal = null; // 'shop', 'components', 'player', or null

        // Dynamically calculate MODAL_CONFIG based on game dimensions
        this.MODAL_CONFIG = {
            shop: {
                x: this.game.width * 0.1,
                y: this.game.height * 0.05,
                width: this.game.width * 0.8,
                height: this.game.height * 0.9,
            },
            components: {
                x: this.game.width * 0.15,
                y: this.game.height * 0.05,
                width: this.game.width * 0.7,
                height: this.game.height * 0.8,
            },
            player: { // This is for the level-up/player screen
                x: this.game.width * 0.05,
                y: this.game.height * 0.05,
                width: this.game.width * 0.9,
                height: this.game.height * 0.98,
            }
        };

        this.uiButtonsImage = new Image();
        this.uiButtonsImage.src = 'assets/Images/uibuttons.png';
        this.componentQuartersImage = new Image();
        this.componentQuartersImage.src = 'assets/Images/componentquarters.png';
        this.levelUpManagerImage = new Image();
        this.levelUpManagerImage.src = 'assets/Images/levelupmanager.png';
        this.shopOverlayImage = new Image();
        this.shopOverlayImage.src = 'assets/Images/shopoverlay.png';

        this.componentQuarters = new ComponentQuarters(this.game);

        this.buttons = [];
    }

    getModalConfig(modalName) {
        return this.MODAL_CONFIG[modalName];
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
        
        const config = this.MODAL_CONFIG[modalName];

        if (modalName === 'player') {
            this.game.levelUpManagerScreen.organizeCards(config);
        }

        // Define buttons based on the new spec
        const buttonY = config.y + 20;
        const totalButtonWidth = 3 * BUTTON_WIDTH + 2 * 10; // 3 buttons, 2 gaps
        const startX = (this.game.width - totalButtonWidth) / 2;

        this.buttons = [
            { name: 'shop', x: startX, y: buttonY, width: BUTTON_WIDTH, height: BUTTON_HEIGHT },
            { name: 'components', x: startX + BUTTON_WIDTH + 10, y: buttonY, width: BUTTON_WIDTH, height: BUTTON_HEIGHT },
            { name: 'player', x: startX + 2 * (BUTTON_WIDTH + 10), y: buttonY, width: BUTTON_WIDTH, height: BUTTON_HEIGHT },
        ];
    }

    close() {
        if (!this.isOpen()) return;
        this.activeModal = null;
        this.game.isPaused = false;
        this.game.audioManager.setMuffled(false);
        this.game.audioManager.playSound('reset');
        this.game.lastTime = 0; // Prevent time jump
    }

    toggle(modalName) {
        if (this.activeModal === modalName) {
            this.close();
        } else {
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
        }
    }

    draw(ctx) {
        if (!this.isOpen()) return;

        // Draw darkened background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.game.width, this.game.height);

        const config = this.MODAL_CONFIG[this.activeModal];

        // Draw modal background
        switch (this.activeModal) {
            case 'shop':
                if (this.shopOverlayImage.complete) {
                    drawNineSlice(ctx, this.shopOverlayImage, config.x, config.y, config.width, config.height, 30);
                }
                this.game.shop.draw(ctx);
                break;
            case 'components':
                if (this.componentQuartersImage.complete) {
                    drawNineSlice(ctx, this.componentQuartersImage, config.x, config.y, config.width, config.height, 30);
                }
                this.componentQuarters.draw(ctx);
                break;
            case 'player':
                 if (this.levelUpManagerImage.complete) {
                    drawNineSlice(ctx, this.levelUpManagerImage, config.x, config.y, config.width, config.height, 30);
                }
                this.game.levelUpManagerScreen.draw(ctx);
                break;
        }

        // Draw UI buttons
        this.buttons.forEach((button, index) => {
            const isSelected = button.name === this.activeModal;
            const sx = index * BUTTON_WIDTH;
            const sy = isSelected ? BUTTON_HEIGHT : 0;
            ctx.drawImage(this.uiButtonsImage, sx, sy, BUTTON_WIDTH, BUTTON_HEIGHT, button.x, button.y, BUTTON_WIDTH, BUTTON_HEIGHT);
        });
    }
}
