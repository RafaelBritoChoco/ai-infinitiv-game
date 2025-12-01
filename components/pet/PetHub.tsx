/**
 * Pet Hub - Premium Tamagotchi Interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { getPetStateForUser, performPetAction, resetPet } from './pet-service';
import type { PetState } from '../../pet-types';
import { PET_SPRITES } from '../../pet-constants';
import { PixelPetRenderer } from './PixelPetRenderer';
import { PetShop } from './PetShop';
import { MiniGameRPS } from './MiniGameRPS';
import { AdoptionCenter } from './AdoptionCenter';
import { X, ShoppingBag, Gamepad2, Trash2, Heart, Utensils, Sparkles, AlertTriangle, Thermometer } from 'lucide-react';
import { POOP_SPRITE, ITEM_SPRITES } from '../../pet-constants';
import './PetHub.css';

interface PetHubProps {
    onClose: () => void;
}

export const PetHub: React.FC<PetHubProps> = ({ onClose }) => {
    const [pet, setPet] = useState<PetState | null>(null);
    const [loading, setLoading] = useState(true);
    const [showShop, setShowShop] = useState(false);
    const [showMiniGame, setShowMiniGame] = useState(false);
    const [dragItem, setDragItem] = useState<{ type: 'food' | 'toy', icon: string } | null>(null);
    const [petAnimation, setPetAnimation] = useState<'IDLE' | 'HAPPY'>('IDLE');

    // Incubation State
    const [warmth, setWarmth] = useState(0); // 0-100
    const [isHatching, setIsHatching] = useState(false);

    // Refs for drag detection
    const petRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadPet();
    }, []);

    const loadPet = async () => {
        const petState = await getPetStateForUser();
        setPet(petState);
        setLoading(false);
    };

    const handleAction = async (action: 'feed' | 'clean' | 'play', params?: any) => {
        if (!pet) return;

        // Egg Logic: Only 'play' (rubbing) works to increase warmth
        if (pet.stage === 'EGG') {
            if (action === 'play') {
                const newWarmth = Math.min(100, warmth + 5);
                setWarmth(newWarmth);
                setPetAnimation('HAPPY'); // Shake/Bounce
                setTimeout(() => setPetAnimation('IDLE'), 500);

                if (newWarmth >= 100 && !isHatching) {
                    hatchEgg();
                }
            }
            return;
        }

        const updated = await performPetAction(action, params);
        if (updated) {
            setPet(updated);

            // Trigger happy animation
            setPetAnimation('HAPPY');
            setTimeout(() => setPetAnimation('IDLE'), 2000);
        }
    };

    const hatchEgg = async () => {
        setIsHatching(true);
        // Animation delay
        setTimeout(async () => {
            // Use service to evolve and save
            const { evolvePet } = await import('./pet-service');
            const updated = await evolvePet('SLIME');

            if (updated) {
                setPet(updated);
                setIsHatching(false);
                // Trigger happy animation
                setPetAnimation('HAPPY');
                setTimeout(() => setPetAnimation('IDLE'), 2000);
            }
        }, 2000);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (!dragItem || !pet) return;
        if (pet.stage === 'EGG') return; // Cannot feed egg

        // Check if dropped on pet
        const petRect = petRef.current?.getBoundingClientRect();
        if (petRect) {
            const dropX = e.clientX;
            const dropY = e.clientY;

            if (
                dropX >= petRect.left &&
                dropX <= petRect.right &&
                dropY >= petRect.top &&
                dropY <= petRect.bottom
            ) {
                // Successful drop!
                if (dragItem.type === 'food') {
                    handleAction('feed', { foodPower: 30 }); // Default food power
                } else {
                    handleAction('play', { funPower: 25 });
                }
            }
        }
        setDragItem(null);
    };

    if (loading) return <div className="pet-loading">Loading...</div>;

    // Show Adoption Center if no pet
    if (!pet) {
        return <AdoptionCenter onAdopt={(newPet) => setPet(newPet)} onClose={onClose} />;
    }

    return (
        <div className="pet-hub-overlay">
            {/* Modals */}
            {showShop && <PetShop onClose={() => setShowShop(false)} onBuySuccess={loadPet} />}
            {showMiniGame && <MiniGameRPS onClose={() => setShowMiniGame(false)} onGameEnd={loadPet} />}

            <div className="pet-device-container">
                {/* Device Frame */}
                <div className="pet-device-frame">

                    {/* Screen */}
                    <div
                        className="pet-screen"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                    >
                        {/* Header Stats */}
                        <div className="pet-header">
                            <div className="pet-name-tag">{pet.name}</div>
                            <div className="pet-coin-display">
                                💰 {pet.coins || 0}
                            </div>
                        </div>

                        {/* Main Pet Area */}
                        <div className="pet-world">
                            {/* Poop (Only if not Egg) */}
                            {pet.stage !== 'EGG' && Array.from({ length: Math.min(pet.poopCount, 5) }).map((_, i) => (
                                <div
                                    key={i}
                                    className="poop-pixel"
                                    style={{ left: `${20 + (i * 15)}%`, bottom: '10%' }}
                                    onClick={() => handleAction('clean')}
                                >
                                    <PixelPetRenderer pixels={POOP_SPRITE} scale={3} />
                                </div>
                            ))}

                            {/* The Pet / Egg */}
                            <div
                                ref={petRef}
                                className={`pet-entity ${petAnimation === 'HAPPY' ? 'bounce' : 'breathe'} ${isHatching ? 'hatching' : ''}`}
                                onClick={() => handleAction('play', { funPower: 5 })}
                                style={{ cursor: 'pointer' }}
                            >
                                <PixelPetRenderer
                                    pixels={PET_SPRITES[pet.stage][petAnimation] || PET_SPRITES.SLIME.IDLE}
                                    scale={6}
                                />
                                {/* Cracks overlay for Egg */}
                                {pet.stage === 'EGG' && warmth > 30 && <div className="egg-crack-1">⚡</div>}
                                {pet.stage === 'EGG' && warmth > 70 && <div className="egg-crack-2">⚡</div>}
                            </div>

                            {/* Status Indicators */}
                            {pet.sickness !== 'NONE' && (
                                <div className="status-icon sick"><Thermometer size={24} color="#f59e0b" /></div>
                            )}
                            {pet.hunger > 80 && pet.stage !== 'EGG' && (
                                <div className="status-icon hungry"><Utensils size={24} color="#ef4444" /></div>
                            )}
                        </div>

                        {/* Interactive Toolbar (Draggables) - Hidden for Egg */}
                        {pet.stage !== 'EGG' ? (
                            <div className="pet-toolbar">
                                <div
                                    className="tool-item"
                                    draggable
                                    onDragStart={() => setDragItem({ type: 'food', icon: 'apple' })}
                                >
                                    <div className="tool-icon">
                                        <PixelPetRenderer pixels={ITEM_SPRITES['apple']} scale={3} />
                                    </div>
                                    <span className="tool-label">Feed</span>
                                </div>

                                <div
                                    className="tool-item"
                                    draggable
                                    onDragStart={() => setDragItem({ type: 'toy', icon: 'ball' })}
                                >
                                    <div className="tool-icon">
                                        <PixelPetRenderer pixels={ITEM_SPRITES['ball']} scale={3} />
                                    </div>
                                    <span className="tool-label">Play</span>
                                </div>

                                <button className="tool-item" onClick={() => handleAction('clean')} disabled={pet.poopCount === 0}>
                                    <div className="tool-icon"><Trash2 size={24} /></div>
                                    <span className="tool-label">Clean</span>
                                </button>
                            </div>
                        ) : (
                            <div className="pet-toolbar incubation-toolbar">
                                <div className="warmth-meter">
                                    <span className="warmth-label">WARMTH</span>
                                    <div className="warmth-bar">
                                        <div className="warmth-fill" style={{ width: `${warmth}%` }}></div>
                                    </div>
                                </div>
                                <div className="incubation-hint">
                                    Rub the egg to hatch!
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Physical Buttons Area */}
                    <div className="pet-controls">
                        <button className="control-btn big" onClick={() => setShowShop(true)} disabled={pet.stage === 'EGG'}>
                            <ShoppingBag size={24} />
                            <span>SHOP</span>
                        </button>

                        <div className="d-pad">
                            <div className="d-pad-center" />
                        </div>

                        <button className="control-btn big" onClick={() => setShowMiniGame(true)} disabled={pet.stage === 'EGG'}>
                            <Gamepad2 size={24} />
                            <span>GAME</span>
                        </button>
                    </div>

                    {/* Stats Panel (Holographic Overlay) - Different for Egg */}
                    <div className="pet-stats-panel">
                        {pet.stage === 'EGG' ? (
                            <div className="incubation-status">
                                INCUBATING... {warmth}%
                            </div>
                        ) : (
                            <>
                                <StatRow label="HUNGER" value={pet.hunger} max={100} color="#f59e0b" invert />
                                <StatRow label="DIRT" value={pet.dirt} max={100} color="#78350f" invert />
                                <StatRow label="FUN" value={100 - pet.boredom} max={100} color="#8b5cf6" />
                                <StatRow label="HAPPY" value={pet.happiness} max={100} color="#ec4899" />
                            </>
                        )}
                    </div>

                    {/* Close Button */}
                    <button onClick={onClose} className="device-close-btn">
                        <X size={24} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatRow: React.FC<{ label: string, value: number, max: number, color: string, invert?: boolean }> = ({ label, value, max, color, invert }) => {
    const pct = Math.min(100, Math.max(0, (value / max) * 100));

    return (
        <div className="stat-row">
            <span className="stat-label">{label}</span>
            <div className="stat-track">
                <div
                    className="stat-fill"
                    style={{
                        width: `${pct}%`,
                        backgroundColor: color,
                        opacity: invert ? 0.7 : 1
                    }}
                />
            </div>
        </div>
    );
};
