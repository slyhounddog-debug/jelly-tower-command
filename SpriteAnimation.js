// SpriteAnimation.js

export default class SpriteAnimation {
    /**
     * @param {Object} config
     * @param {string} config.src - Path to the sprite strip PNG
     * @param {number} config.frameWidth - Width of a single frame
     * @param {number} config.frameHeight - Height of a single frame
     * @param {number} config.totalFrames - Number of frames per row
     * @param {number} [config.fps=12] - Animation speed
     * @param {number} [config.row=0] - Which row to use (for color variants)
     */
    constructor(config) {
        this.image = new Image();
        this.image.src = config.src;
        this.frameWidth = config.frameWidth;   
        this.frameHeight = config.frameHeight; 
        this.totalFrames = config.totalFrames; 
        this.row = config.row || 0;            
        
        this.currentFrame = 0;
        this.timer = 0;
        this.fps = config.fps || 12;           
    }

    /**
     * Updates the animation frame based on time
     * @param {number} deltaTime - Time passed since last frame (in ms)
     */
    update(deltaTime) {
        this.timer += deltaTime;
        if (this.timer > (1000 / this.fps)) {
            this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
            this.timer = 0;
        }
    }

    /**
     * Draws the current frame to the canvas
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x - Center X position
     * @param {number} y - Bottom Y position (feet of the character)
     * @param {number} width - Base width to draw
     * @param {number} height - Base height to draw
     * @param {number} stretch - Extra width to add (from movement/squish logic)
     * @param {number} squish - Extra height to add (from movement/squish logic)
     */
    draw(ctx, x, y, width, height, stretch = 0, squish = 0) {
        // Calculate the crop coordinates
        const sx = this.currentFrame * this.frameWidth;
        const sy = this.row * this.frameHeight;

        ctx.drawImage(
            this.image,
            sx, sy,                         // Source start (top-left of crop)
            this.frameWidth, this.frameHeight, // Source dimensions (size of crop)
            x - (width + stretch) / 2,      // Destination X (centered)
            y - (height + squish),          // Destination Y (bottom-aligned)
            width + stretch,                // Destination Width (stretched)
            height + squish                 // Destination Height (squished)
        );
    }

    /**
     * Manually set the row (useful for changing variants on the fly)
     */
    setRow(newRow) {
        this.row = newRow;
    }

    /**
     * Reset animation to the first frame
     */
    reset() {
        this.currentFrame = 0;
        this.timer = 0;
    }
}