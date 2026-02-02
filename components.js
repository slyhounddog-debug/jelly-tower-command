export const COMPONENTS = {
    "Fire Damage": {
        cost: 2,
        description: "Shots apply a fire DoT for 5s. Each stack adds 10% of shot damage per second."
    },
    "Split Shot": {
        cost: 3,
        description: "Adds an additional projectile to each tower shot. Each stack adds another shot and widens the spread."
    },
    "Sniper": {
        cost: 1,
        description: "Each stack adds +20% range, +25% damage, and -10% fire rate."
    },
    "Chain Bounce": {
        cost: 2,
        description: "Shots bounce to nearby enemies with diminishing damage. Each stack adds another bounce."
    },
    "Pop-Rock Projectiles": {
        cost: 2,
        description: "Shots explode on impact. Each stack increases explosion area by 50%."
    },
    "Gummy Impact": {
        cost: 1,
        description: "Tower shots also knock enemies back by 10% of total knockback power."
    },
    "Bubble Gum Shots": {
        cost: 2,
        description: "Shots bounce off the tower's range. Each stack adds one bounce."
    },
    "Turret Synergy": {
        cost: 1,
        description: "Boosts Dmg/Rate by 1% and Range by 3% for each other tower. Stacks."
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
