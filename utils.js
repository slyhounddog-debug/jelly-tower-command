export function drawNineSlice(ctx, image, x, y, width, height, sliceSize) {
    if (!image || !image.complete || image.naturalWidth === 0) return;

    const sw = image.naturalWidth;
    const sh = image.naturalHeight;
    sliceSize = Math.min(sliceSize, sw / 2, sh / 2);

    const s = sliceSize;
    const c = sliceSize;

    // Corners
    ctx.drawImage(image, 0, 0, s, s, x, y, s, s); // Top-left
    ctx.drawImage(image, sw - s, 0, s, s, x + width - s, y, s, s); // Top-right
    ctx.drawImage(image, 0, sh - s, s, s, x, y + height - s, s, s); // Bottom-left
    ctx.drawImage(image, sw - s, sh - s, s, s, x + width - s, y + height - s, s, s); // Bottom-right

    // Edges
    ctx.drawImage(image, s, 0, sw - 2 * s, s, x + s, y, width - 2 * s, s); // Top
    ctx.drawImage(image, s, sh - s, sw - 2 * s, s, x + s, y + height - s, width - 2 * s, s); // Bottom
    ctx.drawImage(image, 0, s, s, sh - 2 * s, x, y + s, s, height - 2 * s); // Left
    ctx.drawImage(image, sw - s, s, s, sh - 2 * s, x + width - s, y + s, s, height - 2 * s); // Right

    // Center
    ctx.drawImage(image, s, s, sw - 2 * s, sh - 2 * s, x + s, y + s, width - 2 * s, height - 2 * s);
}

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

    // Handle 8-digit hex codes (with alpha) by ignoring the alpha channel
    if (hex.length === 8) {
        hex = hex.substring(0, 6);
    }

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

export function calculateChainBounceDamage(level) {
    if (level === 0) return [1.0];
    const falloff = [1.0];
    let current = 1.0;
    for (let i = 0; i < level; i++) {
        current = (current + 0.5) / 2;
        falloff.push(current);
    }
    falloff.push(0.5);
    falloff.push(0.25);
    return falloff;
}

export function showNotification(message) {
    const notification = document.createElement('div');
    notification.innerText = message;
    
    // Styling
    notification.style.position = 'fixed';
    notification.style.top = '50%';
    notification.style.left = '50%';
    notification.style.transform = 'translate(-50%, -50%)';
    notification.style.backgroundColor = 'lightpink';
    notification.style.color = '#9966CC'; // Change font color to white
    notification.style.padding = '20px 40px';
    notification.style.borderRadius = '25px'; // More rounded
    notification.style.zIndex = '2000';
    notification.style.fontSize = '32px'; // h2 font size (approx)
   
    notification.style.fontFamily = "'Titan One', cursive"; // h2 font type
    notification.style.textAlign = 'center';
    notification.style.opacity = '0';
    notification.style.transition = 'opacity 0.5s';
    notification.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.4)'; // Drop shadow

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '1';
    }, 1);

    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 1100);
}
