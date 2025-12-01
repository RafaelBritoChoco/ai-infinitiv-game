/**
 * Pet Service Layer
 * Bridge between pure logic and localStorage persistence
 */

import { Persistence } from '../game/persistence';
import { PET_BALANCING } from '../../pet-constants';
import {
    updatePetState,
    feedPet,
    cleanPoop,
    playWithPet,
    getPetBuffs,
    createNewPet,
    getNotificationReasons,
    needsUrgentCare
} from './pet-logic-core';
import type { PetState, PetBuffs, ShopItem } from '../../pet-types';
import { SHOP_ITEMS } from '../../pet-constants';

/**
 * Get pet state for current user (creates new pet if none exists)
 * @returns Pet state or null if feature is disabled
 */
export async function getPetStateForUser(): Promise<PetState | null> {
    // Check feature flag
    if (!Persistence.isPetEnabled()) {
        return null;
    }

    try {
        const saved = localStorage.getItem('NEON_PET_STATE');
        if (saved) {
            const parsed = JSON.parse(saved);
            // Migrate old data if needed
            if (!parsed.coins) parsed.coins = 100;
            if (!parsed.inventory) parsed.inventory = { food: {}, toys: {} };

            const updated = updatePetState(parsed, Date.now(), PET_BALANCING);
            if (updated !== parsed) {
                savePetState(updated);
            }
            return updated;
        }
        return null; // No pet found -> Adoption needed
    } catch (error) {
        console.error('Error getting pet state:', error);
        return null;
    }
}

/**
 * Adopt a new egg
 */
export const adoptEgg = async (name: string): Promise<PetState> => {
    const newPet = createNewPet(name);
    newPet.stage = 'EGG';
    savePetState(newPet);
    return newPet;
};

/**
 * Perform pet action (feed, clean, play)
 */
export async function performPetAction(
    action: 'feed' | 'clean' | 'play',
    params?: { foodPower?: number; funPower?: number }
): Promise<PetState | null> {
    if (!Persistence.isPetEnabled()) return null;

    try {
        let pet = await getPetStateForUser();
        // If no pet (and not adopting), we can't perform action. 
        // But wait, getPetStateForUser returns null if no pet.
        // So we need to load it manually if we want to support actions on a just-created pet?
        // Actually, if getPetStateForUser returns null, we can't do anything.
        // But performPetAction is usually called AFTER we have a pet.
        // Let's rely on Persistence.loadPetState() directly to avoid circular dependency or null check issues?
        // No, let's use the helper but handle null.
        if (!pet) {
            // Try loading directly in case it's a fresh adoption not yet in state?
            // No, adoptEgg saves it.
            const saved = localStorage.getItem('NEON_PET_STATE');
            if (saved) {
                pet = JSON.parse(saved);
            } else {
                return null;
            }
        }

        if (!pet) return null;

        // First update based on time
        pet = updatePetState(pet, Date.now(), PET_BALANCING);

        // Then apply action
        switch (action) {
            case 'feed':
                pet = feedPet(pet, params?.foodPower);
                break;
            case 'clean':
                pet = cleanPoop(pet);
                break;
            case 'play':
                pet = playWithPet(pet, params?.funPower);
                break;
        }

        // Save updated state
        savePetState(pet);
        return pet;
    } catch (error) {
        console.error('Error performing pet action:', error);
        return null;
    }
}

/**
 * Evolve pet to specific stage
 */
export async function evolvePet(newStage: PetState['stage']): Promise<PetState | null> {
    if (!Persistence.isPetEnabled()) return null;

    try {
        let pet = await getPetStateForUser();
        if (!pet) return null;

        pet.stage = newStage;
        pet.ageHoursInStage = 0; // Reset stage age
        pet.lastUpdate = Date.now();

        savePetState(pet);
        return pet;
    } catch (error) {
        console.error('Error evolving pet:', error);
        return null;
    }
}

/**
 * Buy item from shop
 */
export async function buyItem(itemId: string): Promise<{ success: boolean; message: string; pet?: PetState }> {
    if (!Persistence.isPetEnabled()) return { success: false, message: 'Pet system disabled' };

    try {
        let pet = await getPetStateForUser();
        if (!pet) return { success: false, message: 'Pet not found' };

        const item = SHOP_ITEMS.find(i => i.id === itemId);
        if (!item) return { success: false, message: 'Item inválido' };

        if (pet.coins < item.price) {
            return { success: false, message: 'Moedas insuficientes!' };
        }

        // Deduct coins
        pet.coins -= item.price;

        // Add to inventory
        if (!pet.inventory) pet.inventory = { food: {}, toys: {} };

        const category = item.type === 'food' ? 'food' : 'toys';
        // @ts-ignore - Dynamic key access
        pet.inventory[category][itemId] = (pet.inventory[category][itemId] || 0) + 1;

        savePetState(pet);
        return { success: true, message: `Comprou ${item.name}!`, pet };
    } catch (e) {
        console.error('Buy error:', e);
        return { success: false, message: 'Erro ao comprar' };
    }
}

/**
 * Save pet state to storage
 */
export const savePetState = (pet: PetState) => {
    localStorage.setItem('NEON_PET_STATE', JSON.stringify(pet));
};

/**
 * Reset pet (for testing or after death)
 */
export async function resetPet(name?: string): Promise<PetState | null> {
    if (!Persistence.isPetEnabled()) return null;

    try {
        const oldPet = await getPetStateForUser();
        const newPet = createNewPet(name || 'Infinity');

        // Carry over death counter
        if (oldPet) {
            newPet.timesDied = oldPet.timesDied + 1;
        }

        savePetState(newPet);
        return newPet;
    } catch (error) {
        console.error('Error resetting pet:', error);
        return null;
    }
}
