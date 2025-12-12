const UPGRADE_VALUES = {
    starting_money: [25, 50, 100, 200, 500, 1000],
    piggy_cooldown: [60, 52, 44, 36, 28, 20],
    castle_health: [100, 115, 130, 150, 175, 200],
    heart_heal: [10, 12, 15, 17, 20, 25],
    big_coin_value: [100, 125, 150, 175, 200, 250],
    ice_cream_chance: [[1, 20], [1.5, 30], [2, 40], [2.5, 50], [3, 60], [4, 75]],
    shield_regen: [1, 2, 3, 4, 5, 7.5]
};

const EMPORIUM_UPGRADE_COSTS = [1, 4, 7, 10, 15];

function getInitialEmporiumUpgrades() {
    const upgrades = {};
    for (const key in UPGRADE_VALUES) {
        upgrades[key] = {
            level: 0,
            values: UPGRADE_VALUES[key]
        };
    }
    return upgrades;
}

function saveEmporiumUpgrades(upgrades) {
    localStorage.setItem('emporiumUpgrades', JSON.stringify(upgrades));
}

function loadEmporiumUpgrades() {
    const savedUpgrades = localStorage.getItem('emporiumUpgrades');
    if (savedUpgrades) {
        return JSON.parse(savedUpgrades);
    }
    return getInitialEmporiumUpgrades();
}
