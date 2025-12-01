/**
 * Pet Logic Core - Pure Functions
 * All pet mechanics as pure, testable functions
 * NO side effects, NO API calls, NO localStorage
 */

import { PetState, PetStage, PetSickness, PetBuffs, PetBalancing } from '../../pet-types';
import { PET_BALANCING, PET_ACTION_POWER } from '../../pet-constants';

/**
 * Main update function - applies time-based changes to pet state
 */
export function updatePetState(
    pet: PetState,
    now: number,
    balancing: PetBalancing = PET_BALANCING
): PetState {
    if (pet.stage === 'DEAD') return pet;

    if (pet.stage === 'EGG') {
        return handleEggStage(pet, now, balancing);
    }

    const hoursSinceUpdate = (now - pet.lastUpdate) / (1000 * 60 * 60);

    let newHunger = Math.min(100, pet.hunger + balancing.hungerRateByStage[pet.stage] * hoursSinceUpdate);
    let newDirt = Math.min(100, pet.dirt + balancing.dirtRateByStage[pet.stage] * hoursSinceUpdate);
    let newBoredom = Math.min(100, pet.boredom + balancing.boredomRateByStage[pet.stage] * hoursSinceUpdate);

    let newPoopCount = pet.poopCount;
    const poopRolls = Math.floor(hoursSinceUpdate);
    for (let i = 0; i < poopRolls; i++) {
        if (Math.random() < balancing.poopChancePerHour[pet.stage]) {
            newPoopCount = Math.min(balancing.maxPoopsOnScreen, newPoopCount + 1);
        }
    }

    if (newPoopCount > 0) {
        newDirt = Math.min(100, newDirt + newPoopCount * 2);
    }

    const avgNeed = (newHunger + newDirt + newBoredom) / 3;
    const happiness = Math.max(0, 100 - avgNeed);

    const sickness = calculateSickness(newHunger, newDirt, newBoredom, balancing);
    const isDead = newHunger >= balancing.starvationThreshold || sickness === 'BERSERK';

    const newAgeHoursInStage = pet.ageHoursInStage + hoursSinceUpdate;
    const newAgeHoursTotal = pet.ageHoursTotal + hoursSinceUpdate;

    let newStage = pet.stage;
    let resetAgeInStage = newAgeHoursInStage;

    if (newAgeHoursInStage >= balancing.evolutionHours[pet.stage]) {
        newStage = evolveToNextStage(pet.stage);
        resetAgeInStage = 0;
    }

    return {
        ...pet,
        hunger: newHunger,
        dirt: newDirt,
        boredom: newBoredom,
        happiness,
        sickness: isDead ? 'NONE' : sickness,
        poopCount: newPoopCount,
        ageHoursInStage: resetAgeInStage,
        ageHoursTotal: newAgeHoursTotal,
        lastUpdate: now,
        stage: isDead ? 'DEAD' : newStage,
        hp: isDead ? 0 : pet.hp
    };
}

function handleEggStage(pet: PetState, now: number, balancing: PetBalancing): PetState {
    const hoursSinceUpdate = (now - pet.lastUpdate) / (1000 * 60 * 60);
    const newAgeHoursInStage = pet.ageHoursInStage + hoursSinceUpdate;
    const newAgeHoursTotal = pet.ageHoursTotal + hoursSinceUpdate;

    if (newAgeHoursInStage >= balancing.evolutionHours.EGG) {
        return {
            ...pet,
            stage: 'SLIME',
            ageHoursInStage: 0,
            ageHoursTotal: newAgeHoursTotal,
            lastUpdate: now
        };
    }

    return {
        ...pet,
        ageHoursInStage: newAgeHoursInStage,
        ageHoursTotal: newAgeHoursTotal,
        lastUpdate: now
    };
}

export function feedPet(pet: PetState, foodPower: number = PET_ACTION_POWER.FEED): PetState {
    if (pet.stage === 'DEAD' || pet.stage === 'EGG') return pet;
    return {
        ...pet,
        hunger: Math.max(0, pet.hunger - foodPower)
    };
}

export function cleanPoop(pet: PetState): PetState {
    if (pet.stage === 'DEAD' || pet.stage === 'EGG') return pet;
    if (pet.poopCount === 0) return pet;
    return {
        ...pet,
        dirt: Math.max(0, pet.dirt - PET_ACTION_POWER.CLEAN),
        poopCount: Math.max(0, pet.poopCount - 1),
        totalPoopsCleaned: pet.totalPoopsCleaned + 1
    };
}

export function playWithPet(pet: PetState, funPower: number = PET_ACTION_POWER.PLAY): PetState {
    if (pet.stage === 'DEAD' || pet.stage === 'EGG') return pet;
    return {
        ...pet,
        boredom: Math.max(0, pet.boredom - funPower),
        totalGamesPlayed: pet.totalGamesPlayed + 1
    };
}

function calculateSickness(hunger: number, dirt: number, boredom: number, balancing: PetBalancing): PetSickness {
    const { hunger: hungerThreshold, dirt: dirtThreshold, boredom: boredomThreshold } = balancing.sicknessThresholds;
    const sickCount = [
        hunger >= hungerThreshold ? 1 : 0,
        dirt >= dirtThreshold ? 1 : 0,
        boredom >= boredomThreshold ? 1 : 0
    ].reduce((a, b) => a + b, 0);

    if (sickCount >= 3) return 'BERSERK';
    if (sickCount >= 1) return 'SICK';
    return 'NONE';
}

function evolveToNextStage(currentStage: PetStage): PetStage {
    const evolution: Record<PetStage, PetStage> = {
        EGG: 'SLIME',
        SLIME: 'TEEN',
        TEEN: 'ADULT',
        ADULT: 'ADULT',
        DEAD: 'DEAD'
    };
    return evolution[currentStage];
}

export function getPetBuffs(pet: PetState): PetBuffs {
    if (pet.stage === 'DEAD' || pet.stage === 'EGG') {
        return {
            scoreMultiplier: 1.0,
            extraCoinsChance: 0,
            shieldOnStart: false,
            extraLives: 0
        };
    }

    const stageMultiplier = pet.stage === 'SLIME' ? 1.0 : pet.stage === 'TEEN' ? 1.2 : 1.5;
    const happinessScale = pet.happiness / 100;

    return {
        scoreMultiplier: 1.0 + (0.2 * stageMultiplier * happinessScale),
        extraCoinsChance: 0.1 * stageMultiplier * happinessScale,
        shieldOnStart: pet.stage === 'ADULT' && pet.happiness > 80,
        extraLives: pet.stage === 'ADULT' && pet.happiness > 90 ? 1 : 0
    };
}

export function getNotificationReasons(pet: PetState): string[] {
    if (pet.stage === 'DEAD') return ['Pet has died!'];
    if (pet.stage === 'EGG') return [];

    const reasons: string[] = [];
    if (pet.hunger > 80) reasons.push('Pet is very hungry! 🍎');
    if (pet.dirt > 80) reasons.push('Pet is very dirty! 🧹');
    if (pet.boredom > 80) reasons.push('Pet is very bored! 🎮');
    if (pet.sickness === 'SICK') reasons.push('Pet is sick! 🤒');
    if (pet.sickness === 'BERSERK') reasons.push('Pet is in critical condition! ⚠️');
    if (pet.poopCount >= 5) reasons.push(`Pet has ${pet.poopCount} poops to clean! 💩`);

    return reasons;
}

export function createNewPet(name: string = 'Infinity'): PetState {
    return {
        id: `pet_${Date.now()}`,
        name,
        stage: 'EGG',
        hunger: 0,
        dirt: 0,
        boredom: 0,
        hp: 100,
        maxHp: 100,
        happiness: 100,
        sickness: 'NONE',
        poopCount: 0,
        ageHoursTotal: 0,
        ageHoursInStage: 0,
        lastUpdate: Date.now(),
        totalPoopsCleaned: 0,
        totalGamesPlayed: 0,
        totalMissionsDone: 0,
        timesDied: 0,
        coins: 100, // Start with some coins
        inventory: { food: {}, toys: {} }
    };
}

export function needsUrgentCare(pet: PetState): boolean {
    if (pet.stage === 'DEAD' || pet.stage === 'EGG') return false;
    return (
        pet.hunger > 85 ||
        pet.dirt > 85 ||
        pet.boredom > 85 ||
        pet.sickness !== 'NONE'
    );
}
