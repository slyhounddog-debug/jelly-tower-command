// JellyTowerCommand/shuffleUtils.js

export const jellyBeanBag = [];
export const turretBag = [];

/**
 * Shuffles an array in place using the Fisher-Yates algorithm.
 * @param {Array} array The array to shuffle.
 */
export function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }
    return array;
}

/**
 * Gets a variant index from a shuffle bag. If the bag is empty, it's refilled and shuffled.
 * @param {Array<number>} bag The shuffle bag (e.g., jellyBeanBag, turretBag).
 * @param {number} totalVariants The total number of unique variants available.
 * @returns {number} The next variant index.
 */
export function getVariantFromBag(bag, totalVariants) {
    if (bag.length === 0) {
        for (let i = 0; i < totalVariants; i++) {
            bag.push(i);
        }
        shuffle(bag);
    }
    return bag.pop();
}
