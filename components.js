export const COMPONENTS = {
    "Fire Damage": {
        cost: 1,
        description: "Adds a fire effect to shots, dealing 10% of shot damage per second for 5 seconds. This effect can stack."
    },
    "Split Shot": {
        cost: 3,
        description: "Adds an additional projectile to each tower shot. Spread increases with more stacks."
    },
    "Sniper": {
        cost: 1,
        description: "+20% range, +25% damage, -10% fire rate. Stackable."
    },
    "Gravity Pull": {
        cost: 1,
        description: "Shots pull nearby enemies towards them. Effect and range increase with more stacks."
    },
    "Pop-Rock Projectiles": {
        cost: 2,
        description: "Shots explode on impact or at max range, dealing 50% damage in an area. Explosion size increases with more stacks."
    },
    "Freeze Frosting": {
        cost: 1,
        description: "Shots slow enemies by 10% for 5 seconds. Stackable."
    },
    "Bubble Gum Shots": {
        cost: 2,
        description: "Shots bounce off the edge of the tower's range instead of disappearing."
    }
};

export function getRandomComponent() {
    const rand = Math.random();
    // 1-cost: 50%, 2-cost: 30%, 3-cost: 20%
    if (rand < 0.5) {
        const oneCost = Object.keys(COMPONENTS).filter(key => COMPONENTS[key].cost === 1);
        return oneCost[Math.floor(Math.random() * oneCost.length)];
    } else if (rand < 0.8) {
        const twoCost = Object.keys(COMPONENTS).filter(key => COMPONENTS[key].cost === 2);
        return twoCost[Math.floor(Math.random() * twoCost.length)];
    } else {
        const threeCost = Object.keys(COMPONENTS).filter(key => COMPONENTS[key].cost === 3);
        return threeCost[Math.floor(Math.random() * threeCost.length)];
    }
}
