export const ScreenShake = {
    magnitude: 0,
    duration: 0,
    decayRate: 0.9,
    trigger(mag, dur) { this.magnitude = Math.max(this.magnitude, mag); this.duration = Math.max(this.duration, dur); },
    update(tsf) {
        if (this.duration > 0) {
            this.duration -= tsf;
            this.magnitude *= (this.decayRate ** tsf);
            if (this.duration <= 0) { this.magnitude = 0; this.duration = 0; }
        }
    },
    getOffset() {
        if (this.magnitude <= 0) return { x: 0, y: 0 };
        return { x: (Math.random() - 0.5) * 2 * this.magnitude, y: (Math.random() - 0.5) * 2 * this.magnitude };
    }
};