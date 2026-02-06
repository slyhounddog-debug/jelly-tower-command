// JellyTowerCommand/objectPool.js

export default class ObjectPool {
    constructor(objectClass, size, gameInstance = null) {
        this.pool = [];
        this.objectClass = objectClass;
        this.gameInstance = gameInstance;
        this.poolSize = size; // Store size for modulo operator
        this.poolPointer = 0; // Initialize pool pointer

        for (let i = 0; i < size; i++) {
            const obj = new this.objectClass(this.gameInstance);
            obj.active = false;
            this.pool.push(obj);
        }
    }

    get(...args) {
        let foundObj = null;
        let objIndex = -1;

        // Search for an inactive object starting from the current poolPointer
        for (let i = 0; i < this.poolSize; i++) {
            const currentIndex = (this.poolPointer + i) % this.poolSize;
            const obj = this.pool[currentIndex];
            if (!obj.active) {
                foundObj = obj;
                objIndex = currentIndex;
                break;
            }
        }

        // If no inactive object was found after searching the entire pool,
        // then the pool is truly full. Force-reset the object at the current poolPointer.
        if (foundObj === null) {
            foundObj = this.pool[this.poolPointer];
            objIndex = this.poolPointer;
            console.warn(`Pool for ${this.objectClass.name} is full, force-resetting oldest active object.`);
            if (typeof foundObj.reset === 'function') {
                foundObj.reset();
            }
        }
        
        foundObj.active = true;
        if (typeof foundObj.init === 'function') {
            foundObj.init(...args);
        }
        
        // Update poolPointer to the next position after the one we just took
        this.poolPointer = (objIndex + 1) % this.poolSize;
        
        return foundObj;
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
