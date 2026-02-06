// JellyTowerCommand/objectPool.js

export default class ObjectPool {
    constructor(objectClass, size, gameInstance = null) {
        this.pool = [];
        this.objectClass = objectClass;
        this.gameInstance = gameInstance;

        for (let i = 0; i < size; i++) {
            const obj = new this.objectClass(this.gameInstance);
            obj.active = false;
            this.pool.push(obj);
        }
    }

    get(...args) {
        for (let i = 0; i < this.pool.length; i++) {
            if (!this.pool[i].active) {
                const obj = this.pool[i];
                obj.active = true;
                if (typeof obj.init === 'function') {
                    obj.init(...args);
                }
                return obj;
            }
        }
        console.warn(`Pool of ${this.objectClass.name} is full. Consider increasing size.`);
        return null;
    }

    returnToPool(obj) {
        obj.active = false;
        if (typeof obj.reset === 'function') {
            obj.reset();
        }
    }

    // New reset method for the pool itself
    reset() {
        for (const obj of this.pool) {
            if (obj.active) {
                if (typeof obj.reset === 'function') {
                    obj.reset();
                }
                obj.active = false; // Ensure it's marked inactive
            }
        }
    }

    update(tsf) {
        for (const obj of this.pool) {
            if (obj.active) {
                obj.update(tsf);
            }
        }
    }

    draw(ctx) {
        for (const obj of this.pool) {
            if (obj.active) {
                obj.draw(ctx);
            }
        }
    }

    forEach(callback) {
        for (const obj of this.pool) {
            if (obj.active) {
                callback(obj);
            }
        }
    }

    getActiveCount() {
        let count = 0;
        for (let i = 0; i < this.pool.length; i++) {
            if (this.pool[i].active) {
                count++;
            }
        }
        return count;
    }
}
