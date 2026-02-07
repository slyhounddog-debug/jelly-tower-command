import { COMPONENTS } from './components.js';
import { showNotification, lightenColor, darkenColor, drawNineSlice } from './utils.js';

export default class ComponentQuarters {
    constructor(game) {
        this.game = game;
        this.componentSlots = [];
        this.hoveredComponent = null;
    }

    initializeComponentsUI() {
        const modalConfig = this.game.modalManager.getModalConfig('components');
        if (!modalConfig) return;

        this.componentSlots = []; // Will store UI data for each component type

        const gridCols = 3; // Changed to 3 columns
        const cardWidth = 180; // Increased card width
        const cardHeight = 180; // Increased card height
        const horizontalSpacing = 20; // Gap between cards horizontally
        const verticalSpacing = 20; // Gap between cards vertically
        const gridPaddingX = 80; // Padding from modal edges
        const gridPaddingY = 320; // Moved down by 100 pixels (180 + 100)

        const startX = modalConfig.x + gridPaddingX;
        const startY = modalConfig.y + gridPaddingY;

        let col = 0;
        let row = 0;

        // Get sorted component names for consistent layout
        const sortedComponentNames = Object.keys(this.game.player.components).sort();

        for (const componentName of sortedComponentNames) {
            const playerComponentData = this.game.player.components[componentName];
            const x = startX + col * (cardWidth + horizontalSpacing);
            const y = startY + row * (cardHeight + verticalSpacing);

            // Coordinates for the quantity stepper buttons and display
            const stepperButtonWidth = cardWidth * 0.3; // Proportionally adjusted
            const stepperButtonHeight = cardHeight * 0.2; // Proportionally adjusted
            const stepperY = y + cardHeight - stepperButtonHeight - 15; // Adjusted 15px from bottom
            const stepperGap = 8; // Adjusted gap

            const minusButtonX = x + 15; // 15px from left edge of card
            const plusButtonX = x + cardWidth - stepperButtonWidth - 15; // 15px from right edge of card
            const activeCountDisplayX = minusButtonX + stepperButtonWidth + stepperGap;
            const activeCountDisplayWidth = plusButtonX - activeCountDisplayX - stepperGap;


            this.componentSlots.push({
                name: componentName,
                owned: playerComponentData.owned,
                active: playerComponentData.active,
                x: x,
                y: y,
                width: cardWidth,
                height: cardHeight,
                minusButton: { x: minusButtonX, y: stepperY, width: stepperButtonWidth, height: stepperButtonHeight },
                plusButton: { x: plusButtonX, y: stepperY, width: stepperButtonWidth, height: stepperButtonHeight },
                activeCountDisplay: { x: activeCountDisplayX, y: stepperY, width: activeCountDisplayWidth, height: stepperButtonHeight }
            });

            col++;
            if (col >= gridCols) {
                col = 0;
                row++;
            }
        }
    }

    handleInput(mouseX, mouseY) {
        const modalConfig = this.game.modalManager.getModalConfig('components');
        if (!modalConfig) return false;

        // Click to close mechanism
        if (this.selectedComponentForTooltip) {
            // Check if click is inside the selected component's card
            const slot = this.selectedComponentForTooltip;
            const isClickInsideCard = (mouseX > slot.x && mouseX < slot.x + slot.width &&
                                       mouseY > slot.y && mouseY < slot.y + slot.height);
            // Check if click is on +/- buttons
            const isClickOnMinusButton = (mouseX > slot.minusButton.x && mouseX < slot.minusButton.x + slot.minusButton.width &&
                                          mouseY > slot.minusButton.y && mouseY < slot.minusButton.y + slot.minusButton.height);
            const isClickOnPlusButton = (mouseX > slot.plusButton.x && mouseX < slot.plusButton.x + slot.plusButton.width &&
                                         mouseY > slot.plusButton.y && mouseY < slot.plusButton.y + slot.plusButton.height);

            if (!isClickInsideCard || isClickOnMinusButton || isClickOnPlusButton) {
                this.selectedComponentForTooltip = null; // Clicked outside or on a button, close tooltip
                // Continue to process potential button clicks or other modal interactions
            } else {
                return true; // Clicked inside the selected card (but not on +/-), consume click and keep tooltip open
            }
        }


        // Loop through component slots to check for button clicks
        for (const slot of this.componentSlots) {
            // Check Minus Button
            if (mouseX > slot.minusButton.x && mouseX < slot.minusButton.x + slot.minusButton.width &&
                mouseY > slot.minusButton.y && mouseY < slot.minusButton.y + slot.minusButton.height) {
                this.decrementActive(slot.name);
                return true; // Click consumed
            }

            // Check Plus Button
            if (mouseX > slot.plusButton.x && mouseX < slot.plusButton.x + slot.plusButton.width &&
                mouseY > slot.plusButton.y && mouseY < slot.plusButton.y + slot.plusButton.height) {
                this.incrementActive(slot.name);
                return true; // Click consumed
            }

            // Check for click on component container itself (to open tooltip)
            if (mouseX > slot.x && mouseX < slot.x + slot.width &&
                mouseY > slot.y && mouseY < slot.y + slot.height) {
                
                // Only open tooltip if it's not the currently open one, or if it's new
                if (this.selectedComponentForTooltip !== slot) {
                    this.selectedComponentForTooltip = slot;
                    return true; // Click consumed, tooltip opened
                } else {
                    // Clicked on the same component again, close it
                    this.selectedComponentForTooltip = null;
                    return true;
                }
            }
        }
        
        return true; // Clicked inside modal area, but not on a specific interactive element, still consume it
    }
    
    incrementActive(componentName) {
        const playerComponent = this.game.player.components[componentName];
        if (!playerComponent) return;

        const componentData = COMPONENTS[componentName];
        const cost = componentData ? componentData.cost : 0;
        const currentUsedPoints = this.calculateUsedComponentPoints();

        if (playerComponent.active < playerComponent.owned) { // Can't activate more than owned
            if (currentUsedPoints + cost <= this.game.player.maxComponentPoints) { // Check max points
                playerComponent.active++;
                this.game.audioManager.playSound('purchase'); // Use purchase sound for equipping
            } else {
                this.game.audioManager.playSound('pop'); // Max points reached sound
                showNotification('Maximum component points reached!', 'error');
            }
        } else {
            this.game.audioManager.playSound('pop'); // Max owned reached sound
        }
    }

    decrementActive(componentName) {
        const playerComponent = this.game.player.components[componentName];
        if (!playerComponent) return;

        if (playerComponent.active > 0) { // Can't deactivate less than zero
            playerComponent.active--;
            this.game.audioManager.playSound('reset'); // Use reset sound for unequipping
        } else {
            this.game.audioManager.playSound('pop'); // Already zero sound
        }
    }

    calculateUsedComponentPoints() {
        let usedPoints = 0;
        for (const compName in this.game.player.components) {
            const comp = this.game.player.components[compName];
            const compData = COMPONENTS[compName];
            usedPoints += comp.active * (compData ? compData.cost : 0);
        }
        return usedPoints;
    }

    // Renamed from updateHoveredComponent to reflect new behavior
    // This is now just a placeholder, as the hover state is not used for tooltips
    _unusedUpdateHoveredComponent(mouseX, mouseY) {
        // This method is no longer directly used for tooltip display
        // Keeping it for potential future hover effects or if specific hover logic is needed
        this.hoveredComponent = null; // Ensure it's cleared
        for (const slot of this.componentSlots) {
            if (mouseX > slot.x && mouseX < slot.x + slot.width &&
                mouseY > slot.y && mouseY < slot.y + slot.height) {
                this.hoveredComponent = slot; // Still track for other potential uses
                break;
            }
        }
    }

    update(tsf) {
        if (this.game.modalManager.activeModal !== 'components') {
            this.selectedComponentForTooltip = null; // Clear selected component if modal is not active
            return;
        }
        // No longer tracking hover for tooltip, but can be used for other effects if needed
        // this._unusedUpdateHoveredComponent(this.game.mouse.x, this.game.mouse.aimY); 
    }

    draw(ctx) {
        const modalConfig = this.game.modalManager.getModalConfig('components');
        if (!modalConfig) return;
        
        // Initialize UI slots based on current player components
        this.initializeComponentsUI();

        this.drawHud(ctx, modalConfig);
        this.drawComponentGrid(ctx, modalConfig);
        this.drawTooltip(ctx, modalConfig); // Tooltip now draws based on this.selectedComponentForTooltip
    }
    
    drawHud(ctx, modalConfig) {
        let usedPoints = 0;
        for (const componentName in this.game.player.components) {
            const component = this.game.player.components[componentName];
            usedPoints += component.active * (COMPONENTS[componentName] ? COMPONENTS[componentName].cost : 0);
        }
        const maxPoints = this.game.player.maxComponentPoints;
        
        const hudY = modalConfig.y + 98 + (modalConfig.height * 0.11); // 5% away from UI bar
        const pointSlotSize = 35 - (maxPoints/2);
        const gap = 8;
        const totalWidth = maxPoints * (pointSlotSize + gap) - gap;
        let startX = modalConfig.x + (modalConfig.width - totalWidth) / 2;

        ctx.save();
        ctx.font = '34px "Titan One"';
        ctx.fillStyle = '#9c536cff';
        ctx.textAlign = 'center';
        ctx.fillText('Component Points', modalConfig.x + modalConfig.width / 2, hudY - 30);

        for (let i = 0; i < maxPoints; i++) {
            ctx.fillStyle = i < usedPoints ? '#f1c40f' : 'rgba(0, 0, 0, 0.5)';
            ctx.strokeStyle = i < usedPoints ? '#fff' : '#888';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.roundRect(startX + i * (pointSlotSize + gap), hudY, pointSlotSize, pointSlotSize, 5);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
    
    drawComponentGrid(ctx, modalConfig) {
        this.componentSlots.forEach(slot => {
            const isEquipped = slot.active > 0;

            ctx.save();
            ctx.translate(slot.x, slot.y);

            // 1. Draw Cookie Container (upgradeSlotImage)
            const upgradeSlotImage = this.game.upgradeSlotImage;
            if (upgradeSlotImage && upgradeSlotImage.complete) {
                // Using drawNineSlice to ensure the whole image is used and scaled properly
                drawNineSlice(ctx, upgradeSlotImage, 0, 0, slot.width, slot.height, 30); // Assuming 30px border for 9-slice
            }

            // 2. Draw Green Glowing Border (if active)
            if (isEquipped) {
                const pulse = (Math.sin(this.game.gameTime * 0.1) + 1) / 2; // 0 to 1 pulse
                ctx.strokeStyle = `rgba(0, 255, 0, ${0.5 + pulse * 0.5})`; // Green pulsing alpha
                ctx.lineWidth = 4 + pulse * 2; // Pulsing width
            } else {
                ctx.strokeStyle = `rgba(128, 128, 128, 0.5)`; // Neutral/gray border
                ctx.lineWidth = 2;
            }
            // Draw the border here, after setting style
            // REMOVING THE EXPLICIT BORDER DRAWING
            // ctx.beginPath();
            // ctx.roundRect(0, 0, slot.width, slot.height, 10);
            // ctx.stroke();


            // 3. Draw Component Title (Centered and wrapped)
            const componentData = COMPONENTS[slot.name]; // Get global component data
            const titleMaxWidth = slot.width * 0.9;
            const titleLineHeight = 24;
            // Vertically center the title within the top part of the card
            const titleY = slot.height * 0.35; // Adjusted to be more central for a two-line title

            ctx.fillStyle = 'darkslategray'; // Dark gray title
            ctx.font = '24px "VT323"'; // Apply VT323 font
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle'; // Center text vertically on titleY
            // Use wrapText for the title, centered horizontally
            this.wrapText(ctx, slot.name, slot.width / 2, titleY, titleMaxWidth, titleLineHeight);


            // 4. Draw Component Icon (Centered below title)
            if (componentData && componentData.icon) {
                ctx.font = '40px sans-serif'; // Slightly smaller to make room for text
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'white'; // Icon color
                ctx.fillText(componentData.icon, slot.width / 2, slot.height * 0.65); // Position below title
            }
            

            // 5. Draw 'Owned' Count (Top-left corner)
            ctx.font = '20px "VT323"'; // Increased font size
            ctx.textAlign = 'left'; // Left aligned
            ctx.textBaseline = 'top';
            ctx.fillStyle = 'white'; // White for better visibility
            ctx.fillText(`x${slot.owned}`, 10, 10); // 10px from left, 10px from top

            // 6. Draw Quantity Stepper (Minus button, Active count, Plus button)
            const btnColor = '#9c536cff'; // Button background color
            const textColor = 'white';
            const buttonFont = '28px "VT323"'; // Increased font size for active count

            // Minus Button
            ctx.fillStyle = btnColor;
            ctx.beginPath();
            ctx.roundRect(slot.minusButton.x - slot.x, slot.minusButton.y - slot.y, slot.minusButton.width, slot.minusButton.height, 5);
            ctx.fill();
            ctx.strokeStyle = darkenColor(btnColor, 20);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.font = buttonFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('-', slot.minusButton.x - slot.x + slot.minusButton.width / 2, slot.minusButton.y - slot.y + slot.minusButton.height / 2);

            // Active Count Display
            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.beginPath();
            ctx.roundRect(slot.activeCountDisplay.x - slot.x, slot.activeCountDisplay.y - slot.y, slot.activeCountDisplay.width, slot.activeCountDisplay.height, 5);
            ctx.fill();
            ctx.strokeStyle = darkenColor('rgba(0, 0, 0, 0.4)', 10);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.font = buttonFont;
            ctx.fillText(`${slot.active}`, slot.activeCountDisplay.x - slot.x + slot.activeCountDisplay.width / 2, slot.activeCountDisplay.y - slot.y + slot.activeCountDisplay.height / 2);
            
            // Plus Button
            ctx.fillStyle = btnColor;
            ctx.beginPath();
            ctx.roundRect(slot.plusButton.x - slot.x, slot.plusButton.y - slot.y, slot.plusButton.width, slot.plusButton.height, 5);
            ctx.fill();
            ctx.strokeStyle = darkenColor(btnColor, 20);
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = textColor;
            ctx.font = buttonFont;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('+', slot.plusButton.x - slot.x + slot.plusButton.width / 2, slot.plusButton.y - slot.y + slot.plusButton.height / 2);

            ctx.restore();
        });
    }

    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;
        let metrics;
        let testWidth;

        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            metrics = ctx.measureText(testLine);
            testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                ctx.fillText(line, x, currentY);
                line = words[n] + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, currentY);
        return currentY + lineHeight - y; // Return total height used
    }

    drawTooltip(ctx, modalConfig) {
        if (!this.selectedComponentForTooltip) return; // Use the new property

        const slot = this.selectedComponentForTooltip;
        const componentData = COMPONENTS[slot.name];
        const text = componentData.description;
        
        ctx.save();
        const tooltipMaxWidth = 250; // Max width for the tooltip box
        const lineHeight = 30; // Height per line of text, adjusted for VT323
        const padding = 20;

        ctx.font = '26px "VT323"'; // Use VT323 font
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        // Measure text to determine dynamic height
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.font = ctx.font;
        // Adjust x for wrapText to be central for the bounding box
        const totalTextHeight = this.wrapText(tempCtx, text, 0, 0, tooltipMaxWidth - padding * 2, lineHeight);
        
        const boxWidth = tooltipMaxWidth;
        const boxHeight = totalTextHeight + padding * 2;
        
        // --- Fixed Position relative to the component ---
        let boxX = slot.x + (slot.width / 2) - (boxWidth / 2); // Center above component
        let boxY = slot.y - boxHeight - 20; // 20 pixels above the component

        // --- Bounds Checking ---
        // Adjust X if off-screen left
        if (boxX < modalConfig.x) { // Use modal x boundary
            boxX = modalConfig.x;
        }
        // Adjust X if off-screen right
        if (boxX + boxWidth > modalConfig.x + modalConfig.width) { // Use modal right boundary
            boxX = modalConfig.x + modalConfig.width - boxWidth;
        }

        // Adjust Y if off-screen top
        if (boxY < modalConfig.y) { // Use modal top boundary
            boxY = slot.y + slot.height + 20; // Place below component if no room above
            if (boxY + boxHeight > modalConfig.y + modalConfig.height) { // If still no room, reset to top of modal
                boxY = modalConfig.y;
            }
        }
        // Adjust Y if off-screen bottom (already done by placing above/below)


        // Create Gradient for background
        const gradient = ctx.createLinearGradient(boxX, boxY, boxX, boxY + boxHeight);
        gradient.addColorStop(0, '#FFEBEE'); // Light Pink
        gradient.addColorStop(1, '#FDFDFF'); // Off-white
        ctx.fillStyle = gradient;
        ctx.strokeStyle = 'darkgray'; // Darker gray border
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'darkgray'; // Dark gray text
        // Need to center the wrapped text within the tooltip box
        this.wrapText(ctx, text, boxX + padding, boxY + padding, tooltipMaxWidth - padding * 2, lineHeight);

        ctx.restore();
    }
}