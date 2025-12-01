/**
 * Pet Hub - REDESIGN v3 - Clean Tamagotchi Interface
 * HIGH CONTRAST + CLEAR UX + PIXEL ART + NO EMOJIS + SHOP
 */

import React, { useState, useEffect } from 'react';
import { getPetStateForUser, performPetAction, resetPet, buyItem } from './pet-service';
import type { PetState } from '../../pet-types';
import { PixelPetRenderer } from './PixelPetRenderer';
import { FoodIcon, PlayIcon, CleanIcon, ShopIcon, ExitIcon, EggIcon } from './PetIcons';
import './PetHub.css';

interface PetHubProps {
    onClose: () => void;
}

export const PetHub: React.FC<PetHubProps> = ({ onClose }) => {
    const [pet, setPet] = useState<PetState | null>(null);
    const [loading, setLoading] = useState(true);
    const [petName, setPetName] = useState('');
    const [warmth, setWarmth] = useState(0);
    const [isHatching, setIsHatching] = useState(false);
    const [showShop, setShowShop] = useState(false);

    useEffect(() => {
        loadPet();
    }, []);

    const loadPet = async () => {
        const petState = await getPetStateForUser();
        setPet(petState);
        setLoading(false);
    };

    const handleAction = async (action: 'feed' | 'clean' | 'play') => {
        if (!pet) return;

        // If egg, only play (rub) increases warmth
        if (pet.stage === 'EGG') {
            if (action === 'play') {
                const newWarmth = Math.min(100, warmth + 10);
                setWarmth(newWarmth);

                if (newWarmth >= 100 && !isHatching) {
                    hatchEgg();
                }
            }
            return;
        }

        const updated = await performPetAction(action);
        if (updated) {
            setPet(updated);
        }
    };

    const hatchEgg = async () => {
        setIsHatching(true);

        setTimeout(async () => {
            const { evolvePet } = await import('./pet-service');
            const updated = await evolvePet('SLIME');

            if (updated) {
                setPet(updated);
                setIsHatching(false);
            }
        }, 2000);
    };

    const adoptPet = async () => {
        if (!petName.trim()) return;

        const { adoptNewPet } = await import('./pet-service');
        const newPet = await adoptNewPet(petName.trim());

        if (newPet) {
            setPet(newPet);
        }
    };

    const handleBuy = async (itemId: string) => {
        const result = await buyItem(itemId);

        if (result.success && result.pet) {
            setPet(result.pet);
        } else {
            alert(result.message);
        }
    };

    // SHOP MODAL COMPONENT
    const ShopModal = () => {
        // Dynamic require to avoid circular dependency issues if any, 
        // though in this structure it should be fine. 
        // Using require for safety as requested in previous steps logic.
        const { SHOP_ITEMS } = require('../../pet-constants');

        return (
            <div className="pet-shop-overlay">
                <div className="pet-shop-container">
                    <div className="shop-header">
                        <span>LOJA</span>
                        <button onClick={() => setShowShop(false)} className="shop-close-btn"><ExitIcon size={16} /></button>
                    </div>

                    <div className="shop-coins">
                        💰 {pet?.coins || 0}
                    </div>

                    <div className="shop-items-grid">
                        {SHOP_ITEMS.map((item: any) => (
                            <div key={item.id} className="shop-item-card">
                                <div className="item-icon">{item.icon}</div>
                                <div className="item-info">
                                    <span className="item-name">{item.name}</span>
                                    <span className="item-price">💰 {item.price}</span>
                                </div>
                                <button
                                    className="buy-btn"
                                    disabled={(pet?.coins || 0) < item.price}
                                    onClick={() => handleBuy(item.id)}
                                >
                                    COMPRAR
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="pet-hub-overlay">
                <div className="tamagotchi-device">
                    <div className="pet-screen-area">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.7rem',
                            color: '#1a2921'
                        }}>
                            LOADING...
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ADOPTION SCREEN (No pet yet)
    if (!pet) {
        return (
            <div className="pet-hub-overlay">
                <div className="tamagotchi-device">
                    <button onClick={onClose} className="pet-close-btn">
                        <ExitIcon size={24} />
                    </button>

                    <div className="pet-header-bar">
                        <div className="pet-title-text">ADOÇÃO PET</div>
                    </div>

                    <div className="pet-screen-area">
                        <div className="adoption-screen">
                            <div className="adoption-title">
                                ADOTE SEU PET!
                            </div>

                            <div className="egg-showcase">
                                <EggIcon size={80} />

                                <div className="pet-instruction">
                                    Escolha um nome para seu pet
                                </div>
                            </div>

                            <div className="name-input-area">
                                <input
                                    type="text"
                                    className="name-input"
                                    placeholder="NOME DO PET"
                                    value={petName}
                                    onChange={(e) => setPetName(e.target.value)}
                                    maxLength={12}
                                />

                                <button
                                    className="adopt-button"
                                    onClick={adoptPet}
                                    disabled={!petName.trim()}
                                >
                                    ADOTAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // EGG INCUBATION SCREEN
    if (pet.stage === 'EGG') {
        return (
            <div className="pet-hub-overlay">
                <div className="tamagotchi-device">
                    <button onClick={onClose} className="pet-close-btn">
                        <ExitIcon size={24} />
                    </button>

                    <div className="pet-header-bar">
                        <div className="pet-title-text">🥚 {pet.name}</div>
                    </div>

                    <div className="pet-screen-area">
                        <div className="pet-display-zone">
                            <EggIcon size={120} cracked={warmth > 50} />
                        </div>

                        <div className="pet-instruction">
                            {warmth < 50 && "Clique em PLAY para aquecer o ovo!"}
                            {warmth >= 50 && warmth < 100 && "Continue! O ovo está rachando..."}
                            {warmth >= 100 && "ECLODINDO!"}
                        </div>

                        <div className="pet-stats-bar">
                            <div className="stat-item">
                                <span className="stat-label">CALOR</span>
                                <div className="stat-bar-track">
                                    <div
                                        className="stat-bar-fill"
                                        style={{
                                            width: `${warmth}%`,
                                            background: warmth < 100
                                                ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                                : 'linear-gradient(90deg, #4ade80, #22c55e)'
                                        }}
                                    ></div>
                                </div>
                                <span className="stat-value">{warmth}%</span>
                            </div>
                        </div>
                    </div>

                    <div className="pet-action-buttons">
                        <button className="pet-action-btn" onClick={() => handleAction('play')}>
                            <PlayIcon size={32} />
                            <span className="btn-label">AQUECER</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // MAIN PET SCREEN (After hatching)
    const hungerPercent = Math.round((pet.stats.hunger / 100) * 100);
    const happinessPercent = Math.round((pet.stats.happiness / 100) * 100);
    const cleanlinessPercent = Math.round(((100 - pet.stats.poop) / 100) * 100);

    return (
        <div className="pet-hub-overlay">
            <div className="tamagotchi-device">
                <button onClick={onClose} className="pet-close-btn">
                    <ExitIcon size={24} />
                </button>

                <div className="pet-header-bar">
                    <div className="pet-title-text">🐾 {pet.name}</div>
                    <div className="pet-coins-display">💰 {pet.coins}</div>
                </div>

                <div className="pet-screen-area">
                    {showShop && <ShopModal />}

                    <div className="pet-display-zone">
                        <div className="pet-sprite-container">
                            <PixelPetRenderer pet={pet} size={100} />
                        </div>
                    </div>

                    <div className="pet-instruction">
                        {pet.stats.hunger < 40 && "Seu pet está com fome!"}
                        {pet.stats.happiness < 40 && "Seu pet quer brincar!"}
                        {pet.stats.poop > 60 && "Seu pet precisa de limpeza!"}
                        {pet.stats.hunger >= 70 && pet.stats.happiness >= 70 && pet.stats.poop < 30 && "Seu pet está feliz!"}
                    </div>

                    <div className="pet-stats-bar">
                        <div className="stat-item">
                            <span className="stat-label">FOME</span>
                            <div className="stat-bar-track">
                                <div
                                    className="stat-bar-fill"
                                    style={{
                                        width: `${hungerPercent}%`,
                                        background: hungerPercent > 50
                                            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                            : 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                    }}
                                ></div>
                            </div>
                            <span className="stat-value">{hungerPercent}%</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-label">FELIZ</span>
                            <div className="stat-bar-track">
                                <div
                                    className="stat-bar-fill"
                                    style={{
                                        width: `${happinessPercent}%`,
                                        background: happinessPercent > 50
                                            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                            : 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                    }}
                                ></div>
                            </div>
                            <span className="stat-value">{happinessPercent}%</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-label">LIMPO</span>
                            <div className="stat-bar-track">
                                <div
                                    className="stat-bar-fill"
                                    style={{
                                        width: `${cleanlinessPercent}%`,
                                        background: cleanlinessPercent > 50
                                            ? 'linear-gradient(90deg, #4ade80, #22c55e)'
                                            : 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                                    }}
                                ></div>
                            </div>
                            <span className="stat-value">{cleanlinessPercent}%</span>
                        </div>
                    </div>
                </div>

                <div className="pet-action-buttons">
                    <button className="pet-action-btn" onClick={() => handleAction('feed')}>
                        <FoodIcon size={24} />
                        <span className="btn-label">COMIDA</span>
                    </button>

                    <button className="pet-action-btn" onClick={() => handleAction('play')}>
                        <PlayIcon size={24} />
                        <span className="btn-label">BRINCAR</span>
                    </button>

                    <button className="pet-action-btn" onClick={() => handleAction('clean')}>
                        <CleanIcon size={24} />
                        <span className="btn-label">LIMPAR</span>
                    </button>

                    <button className="pet-action-btn shop-btn" onClick={() => setShowShop(true)}>
                        <ShopIcon size={24} />
                        <span className="btn-label">LOJA</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
