
import { drawMarshmallowPanel, drawPipedBorder, drawSquishyButton, drawCloseButton } from './drawing.js';

const allModals = [
    'start-game-modal', 'shop-overlay', 'guide-modal', 'stats-modal', 
    'piggy-modal', 'gummy-worm-modal', 'marshmallow-modal', 
    'game-over-stats', 'shop-reminder', 'emporium-overlay'
];

function showModal(modalId, callback) {
    allModals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
        }
    });

    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        
        const canvas = modal.querySelector('.modal-canvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            const modalRect = modal.getBoundingClientRect();
            
            canvas.width = modalRect.width;
            canvas.height = modalRect.height;

            drawMarshmallowPanel(ctx, 0, 0, canvas.width, canvas.height);
            drawPipedBorder(ctx, 0, 0, canvas.width, canvas.height);
        }

        if (callback) {
            callback();
        }
    }
}

function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateShopUI(game) {
    // This function will be filled in later with the logic to update the shop UI
}

function updateEmporiumUI(game) {
    // This function will be filled in later with the logic to update the emporium UI
}


export { showModal, hideModal, updateShopUI, updateEmporiumUI };
