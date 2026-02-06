import { COMPONENTS } from './components.js';
import { showNotification } from './utils.js';

export default class ComponentQuarters {
    constructor(game) {
        this.game = game;
        this.componentSlots = [];
        this.hoveredComponent = null;
    }

    layout() {
        const modalConfig = this.game.modalManager.getModalConfig('components');
        if (!modalConfig) return;

        this.componentSlots = [];
        const components = this.game.player.collectedComponents;
        const slotWidth = (modalConfig.width - 100 - 40) / 2; // 50 padding each side, 40 gap
        const slotHeight = 80;
        const gap = 20;
        const topMargin = 98 + (modalConfig.height * 0.08);
        
        components.forEach((component, index) => {
            const col = index % 2;
            const row = Math.floor(index / 2);
            
            const slot = {
                component: component,
                x: modalConfig.x + 50 + col * (slotWidth + 40),
                y: modalConfig.y + topMargin + row * (slotHeight + gap),
                width: slotWidth,
                height: slotHeight,
            };
            this.componentSlots.push(slot);
        });
    }

    handleInput() {
        const modalConfig = this.game.modalManager.getModalConfig('components');
        if (!modalConfig) return false; // Should not happen if this modal is active

        const mouseX = this.game.mouse.x;
        const mouseY = this.game.mouse.y;

        // Check if click is within the modal's drawing area
        if (!(mouseX >= modalConfig.x && mouseX <= modalConfig.x + modalConfig.width &&
              mouseY >= modalConfig.y && mouseY <= modalConfig.y + modalConfig.height)) {
            return false; // Clicked outside the actual modal body, let modalManager handle closing
        }

        // If we reach here, the click is *inside* the modal's configured area.
        // It should be consumed by this modal, even if no specific element is clicked.
        
        // Handle component clicks
        for (const slot of this.componentSlots) {
            if (mouseX > slot.x && mouseX < slot.x + slot.width &&
                mouseY > slot.y && mouseY < slot.y + slot.height) {
                
                this.toggleComponent(slot.component);
                return true; // Click consumed by slot
            }
        }
        return true; // Clicked inside modal area, but not on a specific interactive element, still consume it
    }
    
    toggleComponent(component) {
        const componentData = COMPONENTS[component.name];
        const isEquipped = this.game.player.equippedComponents.some(equipped => equipped.id === component.id);
        const currentUsedPoints = this.game.player.equippedComponents.reduce((sum, c) => sum + (COMPONENTS[c.name] ? COMPONENTS[c.name].cost : 0), 0);

        if (isEquipped) {
            const equippedIndex = this.game.player.equippedComponents.findIndex(equipped => equipped.id === component.id);
            if (equippedIndex > -1) {
                this.game.player.equippedComponents.splice(equippedIndex, 1);
            }
            this.game.audioManager.playSound('reset');
        } else {
            if (component.name === "Critical Hit") {
                const equippedCritComponents = this.game.player.equippedComponents.filter(c => c.name === 'Critical Hit');
                if (equippedCritComponents.length >= 4) {
                    this.game.audioManager.playSound('pop');
                    showNotification('Maximum 4 Critical Hit components can be equipped.', 'error');
                    return;
                }
            }

            const newUsedPoints = currentUsedPoints + componentData.cost;
            if (newUsedPoints <= this.game.player.maxComponentPoints) {
                this.game.player.equippedComponents.push(component);
                this.game.audioManager.playSound('purchase');
            } else {
                this.game.audioManager.playSound('pop');
                // Maybe add a visual shake to the HUD later
            }
        }
    }


    update(tsf) {
        this.hoveredComponent = null;
        if (this.game.modalManager.activeModal !== 'components') return;

        for (const slot of this.componentSlots) {
            if (this.game.mouse.x > slot.x && this.game.mouse.x < slot.x + slot.width &&
                this.game.mouse.y > slot.y && this.game.mouse.y < slot.y + slot.height) {
                this.hoveredComponent = slot.component;
                break;
            }
        }
    }

    draw(ctx) {
        const modalConfig = this.game.modalManager.getModalConfig('components');
        if (!modalConfig) return;
        
        // Recalculate layout in case new components were added
        this.layout();

        this.drawHud(ctx, modalConfig);
        this.drawGrid(ctx, modalConfig);
        this.drawTooltip(ctx, modalConfig);
    }
    
    drawHud(ctx, modalConfig) {
        const usedPoints = this.game.player.equippedComponents.reduce((sum, c) => sum + (COMPONENTS[c.name] ? COMPONENTS[c.name].cost : 0), 0);
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
    
    drawGrid(ctx, modalConfig) {
        this.componentSlots.forEach(slot => {
            const isEquipped = this.game.player.equippedComponents.some(equipped => equipped.id === slot.component.id);
            const componentData = COMPONENTS[slot.component.name];

            ctx.save();

            ctx.strokeStyle = isEquipped ? '#00ff00' : '#888';
            ctx.lineWidth = isEquipped ? 4 : 2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';

            ctx.beginPath();
            ctx.roundRect(slot.x, slot.y, slot.width, slot.height, 10);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = 'white';
            ctx.font = '24px "Titan One"';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(slot.component.name, slot.x + 20, slot.y + slot.height / 2);

            ctx.font = '28px "VT323"';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#f1c40f';
            ctx.fillText(`Cost: ${componentData.cost}`, slot.x + slot.width - 20, slot.y + slot.height / 2);

            ctx.restore();
        });
    }

    drawTooltip(ctx, modalConfig) {
        if (!this.hoveredComponent) return;

        const componentData = COMPONENTS[this.hoveredComponent.name];
        const text = componentData.description;
        
        ctx.save();
        ctx.font = '18px "Nunito"';
        const textMetrics = ctx.measureText(text);
        const boxWidth = textMetrics.width + 40;
        const boxHeight = 60;
        let boxX = this.game.mouse.x + 20;
        let boxY = this.game.mouse.y - boxHeight - 10;

        // Prevent tooltip from going off-screen
        if (boxX + boxWidth > this.game.width) {
            boxX = this.game.mouse.x - boxWidth - 20;
        }
        if (boxY < 0) {
            boxY = this.game.mouse.y + 20;
        }

        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, boxX + boxWidth / 2, boxY + boxHeight / 2);

        ctx.restore();
    }
}
