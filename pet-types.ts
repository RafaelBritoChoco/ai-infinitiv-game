/**
 * Pet System Type Definitions
 * Core interfaces for the Tamagotchi Infinity system
 */

export type PetStage = 'EGG' | 'SLIME' | 'TEEN' | 'ADULT' | 'DEAD';
export type PetSickness = 'NONE' | 'SICK' | 'BERSERK';

/**
 * Complete state of a pet
 */
export interface PetState {
    // Identity
    id: string;
    name: string;
    stage: PetStage;

    // Core Stats (0-100 scale)
    hunger: number;        // 0 = full, 100 = starving
    dirt: number;          // 0 = clean, 100 = filthy
    boredom: number;       // 0 = entertained, 100 = bored
    hp: number;            // Current health
    maxHp: number;         // Max health
    happiness: number;     // Overall mood (0-100)

    // States
    sickness: PetSickness;
    poopCount: number;     // Current poops on screen

    // Time tracking
    ageHoursTotal: number;
    ageHoursInStage: number;
    lastUpdate: number;

    // Lifetime Stats
    totalPoopsCleaned: number;
    totalGamesPlayed: number;
    totalMissionsDone: number;
    timesDied: number;

    // Economy & Inventory (Premium Upgrade)
    coins: number;
    inventory: {
        food: Record<string, number>;
        toys: Record<string, number>;
    };
}

/**
 * Buffs that the pet provides to the main game
 */
export interface PetBuffs {
    scoreMultiplier: number;      // 1.0 = normal, 1.2 = +20% score
    extraCoinsChance: number;     // 0.0 to 1.0 probability of bonus coins
    shieldOnStart: boolean;       // Start run with shield active
    extraLives: number;           // Bonus lives at start (0-2)
}

/**
 * Balancing configuration for pet mechanics
 */
export interface PetBalancing {
    // Consumption rates per hour
    hungerRateByStage: Record<PetStage, number>;
    dirtRateByStage: Record<PetStage, number>;
    boredomRateByStage: Record<PetStage, number>;

    // Poop generation
    poopChancePerHour: Record<PetStage, number>;
    maxPoopsOnScreen: number;

    // Evolution requirements (hours in each stage)
    evolutionHours: Record<PetStage, number>;

    // Death conditions
    starvationThreshold: number;
    sicknessThresholds: { hunger: number; dirt: number; boredom: number };
}

export interface ShopItem {
    id: string;
    name: string;
    type: 'food' | 'toy';
    price: number;
    power: number; // Hunger reduction or Fun increase
    description: string;
    icon: string; // Emoji or pixel art reference
}
