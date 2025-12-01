import React, { useState } from 'react';
import { Egg, Sparkles, Check } from 'lucide-react';
import { adoptEgg } from './pet-service';
import { PetState } from '../../pet-types';
import { PixelPetRenderer } from './PixelPetRenderer';
import { PET_SPRITES } from '../../pet-constants';
import './PetHub.css'; // Reuse styles

interface AdoptionCenterProps {
    onAdopt: (pet: PetState) => void;
    onClose: () => void;
}

export const AdoptionCenter: React.FC<AdoptionCenterProps> = ({ onAdopt, onClose }) => {
    const [name, setName] = useState('');
    const [isAdopting, setIsAdopting] = useState(false);

    const handleAdopt = async () => {
        if (!name.trim()) return;

        setIsAdopting(true);

        // Simulate "processing" or payment
        setTimeout(async () => {
            const newPet = await adoptEgg(name);
            onAdopt(newPet);
        }, 1500);
    };

    return (
        <div className="pet-hub-overlay">
            <div className="pet-device-container">
                <div className="pet-device-frame adoption-mode">
                    <div className="pet-screen adoption-screen">
                        <div className="adoption-header">
                            <Sparkles className="icon-spin" size={24} color="#fbbf24" />
                            <h2>Adoption Center</h2>
                            <Sparkles className="icon-spin" size={24} color="#fbbf24" />
                        </div>

                        <div className="egg-showcase">
                            <div className="egg-pedestal">
                                <div className="egg-display bounce">
                                    <PixelPetRenderer pixels={PET_SPRITES.EGG.IDLE} scale={6} />
                                </div>
                            </div>
                            <p className="egg-description">
                                A mysterious egg found in the digital void.
                                Needs warmth and love to hatch!
                            </p>
                        </div>

                        <div className="adoption-form">
                            <label>Name your companion:</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Neo, Glitch, Pixel..."
                                maxLength={12}
                                autoFocus
                            />
                        </div>

                        <div className="adoption-actions">
                            <button
                                className={`adopt-btn ${!name.trim() ? 'disabled' : ''}`}
                                onClick={handleAdopt}
                                disabled={!name.trim() || isAdopting}
                            >
                                {isAdopting ? 'Incubating...' : 'ADOPT EGG (100 💰)'}
                            </button>
                            <button className="cancel-btn" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
