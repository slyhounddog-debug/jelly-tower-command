export default class Background {
    constructor(game) {
        this.game = game;
        this.loaded = false;
        this.backgroundImage = new Image();
        this.backgroundImage.src = 'assets/Images/background.png';
        this.cloudImages = [
            new Image(),
            new Image(),
            new Image(),
        ];
        this.cloudImages[0].src = 'assets/Images/cloud1.png';
        this.cloudImages[1].src = 'assets/Images/cloud2.png';
        this.cloudImages[2].src = 'assets/Images/cloud3.png';
        this.clouds = [];
    }

    load() {
        console.log('Loading background images...');
        return new Promise((resolve, reject) => {
            const promises = [];

            const backgroundImagePromise = new Promise((resolve, reject) => {
                this.backgroundImage.onload = () => {
                    console.log('Background image loaded.');
                    resolve();
                };
                this.backgroundImage.onerror = () => {
                    console.error('Failed to load background image.');
                    reject('Failed to load background image.');
                };
            });
            promises.push(backgroundImagePromise);

            this.cloudImages.forEach((img, index) => {
                const cloudImagePromise = new Promise((resolve, reject) => {
                    img.onload = () => {
                        console.log(`Cloud image ${index + 1} loaded.`);
                        resolve();
                    };
                    img.onerror = () => {
                        console.error(`Failed to load cloud image ${index + 1}.`);
                        reject(`Failed to load cloud image ${index + 1}.`);
                    };
                });
                promises.push(cloudImagePromise);
            });

            Promise.all(promises).then(() => {
                console.log('All background images loaded successfully.');
                this.loaded = true;
                resolve();
            }).catch(error => {
                console.error('Error loading background images:', error);
                reject(error);
            });
        });
    }

    init() {
        for (let i = 0; i < 5; i++) {
            this.clouds.push({
                image: this.cloudImages[Math.floor(Math.random() * this.cloudImages.length)],
                x: Math.random() * this.game.width,
                y: Math.random() * (this.game.height / 2),
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
                y: Math.random() * this.game.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.6 + 0.2
            }));
        }
        this.sugarSnowflakes.forEach(f => {
            f.y += f.speed * tsf;
            if (f.y > this.game.height) f.y = -20;
        });
    }

    draw(ctx) {
        ctx.drawImage(this.backgroundImage, 0, 0, this.game.width, this.game.height);
        this.clouds.forEach(cloud => {
            ctx.drawImage(cloud.image, cloud.x, cloud.y);
        });
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
        ctx.fillRect(0, 0, this.game.width, this.game.height);
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
            ctx.lineTo(-100 + (i * 400), this.game.height + 100);
            ctx.lineTo(-350 + (i * 400), this.game.height + 100);
            ctx.fill();
        }
        ctx.restore();
    }

    drawSugarSnow(ctx, tsf) {
        if (!this.sugarSnowflakes) {
            this.sugarSnowflakes = Array.from({ length: 70 }, () => ({
                x: Math.random() * this.game.width,
                y: Math.random() * this.game.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 0.6 + 0.2
            }));
        }
        ctx.save();
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        this.sugarSnowflakes.forEach(f => {
            f.y += f.speed * tsf;
            if (f.y > this.game.height) f.y = -20;
            ctx.beginPath();
            ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }
}
