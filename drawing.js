function drawMarshmallowPanel(ctx, x, y, width, height) {
    const cornerRadius = 40;
    const shadowOffset = 10;
    const shadowBlur = 20;

    // Soft shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = shadowBlur;
    ctx.shadowOffsetX = shadowOffset;
    ctx.shadowOffsetY = shadowOffset;
    
    // Main marshmallow shape
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius, y);
    ctx.lineTo(x + width - cornerRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
    ctx.lineTo(x + width, y + height - cornerRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
    ctx.lineTo(x + cornerRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
    ctx.lineTo(x, y + cornerRadius);
    ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    ctx.closePath();

    // Off-white cream color
    ctx.fillStyle = '#FDF5E6'; // Off-white cream
    ctx.fill();
    ctx.restore();
}

function drawPipedBorder(ctx, x, y, width, height, color = '#FF69B4') {
    const cornerRadius = 40;
    const lineWidth = 20;
    
    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer border
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius, y);
    ctx.lineTo(x + width - cornerRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
    ctx.lineTo(x + width, y + height - cornerRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
    ctx.lineTo(x + cornerRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
    ctx.lineTo(x, y + cornerRadius);
    ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    ctx.closePath();
    ctx.stroke();

    // Inner highlight
    ctx.lineWidth = lineWidth / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.stroke();

    ctx.restore();
}

function drawSquishyButton(ctx, x, y, width, height, text, color = '#4CAF50') {
    const cornerRadius = 20;
    const shadowOffset = 5;
    const shadowColor = 'rgba(0, 0, 0, 0.2)';

    // Button shadow
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius, y + shadowOffset);
    ctx.lineTo(x + width - cornerRadius, y + shadowOffset);
    ctx.quadraticCurveTo(x + width, y + shadowOffset, x + width, y + cornerRadius + shadowOffset);
    ctx.lineTo(x + width, y + height - cornerRadius + shadowOffset);
    ctx.quadraticCurveTo(x + width, y + height + shadowOffset, x + width - cornerRadius, y + height + shadowOffset);
    ctx.lineTo(x + cornerRadius, y + height + shadowOffset);
    ctx.quadraticCurveTo(x, y + height + shadowOffset, x, y + height - cornerRadius + shadowOffset);
    ctx.lineTo(x, y + cornerRadius + shadowOffset);
    ctx.quadraticCurveTo(x, y + shadowOffset, x + cornerRadius, y + shadowOffset);
    ctx.closePath();
    ctx.fill();

    // Button body
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + cornerRadius, y);
    ctx.lineTo(x + width - cornerRadius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
    ctx.lineTo(x + width, y + height - cornerRadius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
    ctx.lineTo(x + cornerRadius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
    ctx.lineTo(x, y + cornerRadius);
    ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
    ctx.closePath();
    ctx.fill();
    
    // Button highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x + width / 2, y + height / 2 - 5, width / 2, 0, Math.PI, true);
    ctx.fill();

    // Button text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px "Luckiest Guy", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + width / 2, y + height / 2);
}

function drawCloseButton(ctx, x, y, size) {
    const cornerRadius = size / 2;
    const shadowOffset = 3;
    const shadowColor = 'rgba(0, 0, 0, 0.2)';

    // Button shadow
    ctx.fillStyle = shadowColor;
    ctx.beginPath();
    ctx.arc(x + size / 2 + shadowOffset, y + size / 2 + shadowOffset, cornerRadius, 0, Math.PI * 2, true);
    ctx.fill();

    // Button body
    ctx.fillStyle = '#E91E63'; // Pinkish-red color
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, cornerRadius, 0, Math.PI * 2, true);
    ctx.fill();

    // Button highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2 - 3, cornerRadius, 0, Math.PI, true);
    ctx.fill();

    // "X" mark
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + size * 0.3, y + size * 0.3);
    ctx.lineTo(x + size * 0.7, y + size * 0.7);
    ctx.moveTo(x + size * 0.7, y + size * 0.3);
    ctx.lineTo(x + size * 0.3, y + size * 0.7);
    ctx.stroke();
}

export { drawMarshmallowPanel, drawPipedBorder, drawSquishyButton, drawCloseButton };
