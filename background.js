export default class Background {
    constructor(game) {
        this.game = game;
        this.loaded = false;
        this.backgroundImage = new Image();
        this.cloudImages = [
            new Image(),
            new Image(),
            new Image(),
        ];
        this.clouds = [];
    }

    load() {
        console.log('Loading background images...');
        const allPromises = [];

        // Background Image
        const bgPromise = new Promise((resolve, reject) => {
            this.backgroundImage.onload = resolve;
            this.backgroundImage.onerror = reject;
            this.backgroundImage.src = 'assets/Images/background.png';
        });
        allPromises.push(bgPromise);

        // Cloud Images
        const cloudSrcs = [
            'assets/Images/cloud1.png',
            'assets/Images/cloud2.png',
            'assets/Images/cloud3.png',
        ];
        this.cloudImages.forEach((img, index) => {
            const cloudPromise = new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
                img.src = cloudSrcs[index];
            });
            allPromises.push(cloudPromise);
        });

        return Promise.all(allPromises).then(() => {
            this.loaded = true;
            console.log('All background images loaded successfully.');
        }).catch(error => {
            console.error('Error loading background images:', error);
            throw error; // Re-throw to make the main Promise.all in game.js fail
        });
    }

    init() {
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                image: this.cloudImages[Math.floor(Math.random() * this.cloudImages.length)],
                x: Math.random() * this.game.width,
                y: Math.random() * (this.game.PLAYABLE_AREA_HEIGHT / 2),
                speed: Math.random() * 0.2 + 0.1,
            });
        }
    }

    update(tsf) {
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed * tsf;
            if (cloud.x > this.game.width) {
                cloud.x = -cloud.image.width;
                cloud.y = Math.random() * (this.game.height / 2);
                cloud.image = this.cloudImages[Math.floor(Math.random() * this.cloudImages.length)];
            }
        });

        if (!this.sugarSnowflakes) {
            this.sugarSnowflakes = Array.from({ length: 70 }, () => ({
                x: Math.random() * this.game.width,
                y: Math.random() * this.game.PLAYABLE_AREA_HEIGHT,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.6 + 0.2
            }));
        }
        this.sugarSnowflakes.forEach(f => {
            f.y += f.speed * tsf;
            if (f.y > this.game.PLAYABLE_AREA_HEIGHT) f.y = -20;
        });
    }

    draw(ctx) {
        ctx.drawImage(this.backgroundImage, 0, 0, this.game.width, this.game.PLAYABLE_AREA_HEIGHT);
        this.clouds.forEach(cloud => {
            ctx.drawImage(cloud.image, cloud.x, cloud.y);
        });

        // Draw the mobile control zone background if active
        if (this.game.MOBILE_CONTROL_ZONE_HEIGHT > 0) {
            const gradient = ctx.createLinearGradient(0, this.game.PLAYABLE_AREA_HEIGHT, 0, this.game.height);
            gradient.addColorStop(0, 'rgba(243, 169, 201, 1)'); // Top of the control zone
            gradient.addColorStop(1, 'rgba(218, 141, 174, 1)'); // Bottom
            ctx.fillStyle = gradient;
            ctx.fillRect(0, this.game.PLAYABLE_AREA_HEIGHT -100, this.game.width, this.game.MOBILE_CONTROL_ZONE_HEIGHT + 100);
        }
        this.drawSunlight(ctx);
        this.drawSugarSnow(ctx, 1);
        if (this.game.boss) {
            this.drawBossOverlay(ctx);
        }
    }

    drawBossOverlay(ctx) {
        const pulse = (Math.sin(this.game.gameTime * 0.03) + 1) / 2; // Slow pulse
        const opacity = pulse * 0.20; // Less vibrant
        ctx.save();
        ctx.fillStyle = `rgba(255, 0, 255, ${opacity})`;
        ctx.fillRect(0, 0, this.game.width, this.game.PLAYABLE_AREA_HEIGHT);
        ctx.restore();
    }

    drawSunlight(ctx) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        const rayCount = 2;
        for (let i = 0; i < rayCount; i++) {
            ctx.beginPath();
            const grad = ctx.createLinearGradient(0, 0, this.game.width, this.game.height);
            grad.addColorStop(0, 'rgba(255, 255, 220, 0.2)');
            grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = grad;
            ctx.moveTo(150 + (i * 400), -100);
            ctx.lineTo(400 + (i * 400), -100);
            ctx.lineTo(-100 + (i * 400), this.game.PLAYABLE_AREA_HEIGHT + 100);
            ctx.lineTo(-350 + (i * 400), this.game.PLAYABLE_AREA_HEIGHT + 100);
            ctx.fill();
        }
        ctx.restore();
    }

    drawSugarSnow(ctx, tsf) {
        if (!this.sugarSnowflakes) {
            this.sugarSnowflakes = Array.from({ length: 70 }, () => ({
                x: Math.random() * this.game.width,
                y: Math.random() * this.game.PLAYABLE_AREA_HEIGHT,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.6 + 0.2
            }));
        }
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        this.sugarSnowflakes.forEach(f => {
            f.y += f.speed * tsf;
            if (f.y > this.game.PLAYABLE_AREA_HEIGHT) f.y = -20;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }
}
