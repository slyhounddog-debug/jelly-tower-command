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

export function darkenColor(hex, percent) {
    if (!hex) return '#000000';
    hex = hex.replace(/^#/, '');
    if (hex.length !== 6) return '#000000'; // Invalid hex

    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    const factor = 1 - percent / 100;
    r = Math.max(0, Math.floor(r * factor));
    g = Math.max(0, Math.floor(g * factor));
    b = Math.max(0, Math.floor(b * factor));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function lightenColor(hex, percent) {
    if (!hex) return '#ffffff';
    hex = hex.replace(/^#/, '');
    if (hex.length !== 6) return '#ffffff'; // Invalid hex

    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    const factor = 1 + percent / 100;
    r = Math.min(255, Math.floor(r * factor));
    g = Math.min(255, Math.floor(g * factor));
    b = Math.min(255, Math.floor(b * factor));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
