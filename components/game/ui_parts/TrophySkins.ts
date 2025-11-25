// === TROPHY SKINS - Actual Trophy Cups for each rank ===
// 1st Place - Golden Trophy Cup
export const TROPHY_GOLD = {
    id: 'trophy_gold',
    name: '🏆 OURO',
    color: '#ffd700',
    pixels: [
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,6,6,1,0,0,0,0,0,0],
        [0,0,1,1,1,1,6,6,6,6,1,1,1,1,0,0],
        [0,1,6,6,6,6,6,6,6,6,6,6,6,6,1,0],
        [1,6,6,6,6,6,6,6,6,6,6,6,6,6,6,1],
        [1,6,6,3,3,6,6,6,6,6,6,3,3,6,6,1],
        [1,6,6,3,3,6,6,6,6,6,6,3,3,6,6,1],
        [0,1,6,6,6,6,6,6,6,6,6,6,6,6,1,0],
        [0,0,1,6,6,6,6,6,6,6,6,6,6,1,0,0],
        [0,0,0,1,6,6,6,6,6,6,6,6,1,0,0,0],
        [0,0,0,0,1,6,6,6,6,6,6,1,0,0,0,0],
        [0,0,0,0,0,1,1,6,6,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,1,6,6,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,6,6,6,6,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
};

// 2nd Place - Silver Trophy Cup
export const TROPHY_SILVER = {
    id: 'trophy_silver',
    name: '🥈 PRATA',
    color: '#c0c0c0',
    pixels: [
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,1,1,1,1,2,2,2,2,1,1,1,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,3,3,2,2,2,2,2,2,3,3,2,2,1],
        [1,2,2,3,3,2,2,2,2,2,2,3,3,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,0,0,1,1,2,2,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
};

// 3rd Place - Bronze Trophy Cup
export const TROPHY_BRONZE = {
    id: 'trophy_bronze',
    name: '🥉 BRONZE',
    color: '#cd7f32',
    pixels: [
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,1,1,1,1,2,2,2,2,1,1,1,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,3,3,2,2,2,2,2,2,3,3,2,2,1],
        [1,2,2,3,3,2,2,2,2,2,2,3,3,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,0,0,1,1,2,2,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
};

// Get trophy skin by rank
export const getTrophySkinByRank = (rank: number) => {
    if (rank === 1) return TROPHY_GOLD;
    if (rank === 2) return TROPHY_SILVER;
    if (rank === 3) return TROPHY_BRONZE;
    return TROPHY_GOLD;
};

// Get all unlocked trophy skins from localStorage
export const getUnlockedTrophySkins = () => {
    const skins: any[] = [];
    try {
        const data = localStorage.getItem('TROPHY_SKINS');
        if (data) {
            const parsed = JSON.parse(data);
            // Return array of {skin, gamesRemaining}
            if (parsed.gold && parsed.gold > 0) skins.push({ skin: TROPHY_GOLD, gamesRemaining: parsed.gold });
            if (parsed.silver && parsed.silver > 0) skins.push({ skin: TROPHY_SILVER, gamesRemaining: parsed.silver });
            if (parsed.bronze && parsed.bronze > 0) skins.push({ skin: TROPHY_BRONZE, gamesRemaining: parsed.bronze });
        }
    } catch {}
    return skins;
};
