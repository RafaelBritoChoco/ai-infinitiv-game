import React, { useState } from 'react';
import {
    X, Rocket, Zap, ChevronsUp, Wind, TrendingUp, Shield, Coins, Lock, Check, ChevronRight, Star
} from 'lucide-react';
import * as Constants from '../../constants';
import { ShopUpgrades } from '../../types';
import { soundManager } from './audioManager';

interface SkillTreeShopProps {
    gameState: any;
    setGameState: (state: any) => void;
}

interface SkillNode {
    id: keyof ShopUpgrades;
    name: string;
    icon: any;
    desc: string;
    color: string;
    tier: number; // 1-3 (rows)
    column: number; // position in row
    requirements: {
        altitude?: number; // unlock altitude
        prereq?: (keyof ShopUpgrades)[]; // required skills
    };
    type: 'upgrade' | 'consumable';
    cost?: number;
    maxLevel: number;
}

const SKILL_TREE: SkillNode[] = [
    // TIER 1 - Foundation (0m altitude)
    {
        id: 'maxFuel',
        name: 'JETPACK CORE',
        icon: Rocket,
        desc: 'Install jetpack propulsion system.',
        color: 'cyan',
        tier: 1,
        column: 2,
        requirements: { altitude: 0 },
        type: 'upgrade',
        maxLevel: 5
    },
    {
        id: 'jump',
        name: 'HYDRAULIC LEGS',
        icon: ChevronsUp,
        desc: 'Enhanced jump mechanics.',
        color: 'orange',
        tier: 1,
        column: 1,
        requirements: { altitude: 0 },
        type: 'upgrade',
        maxLevel: 5
    },
    {
        id: 'luck',
        name: 'SCAVENGER MODULE',
        icon: TrendingUp,
        desc: 'Improved loot detection.',
        color: 'green',
        tier: 1,
        column: 3,
        requirements: { altitude: 0 },
        type: 'upgrade',
        maxLevel: 5
    },

    // TIER 2 - Advanced (500m)
    {
        id: 'efficiency',
        name: 'ION THRUSTERS',
        icon: Zap,
        desc: 'Reduces fuel burn rate.',
        color: 'purple',
        tier: 2,
        column: 2,
        requirements: { altitude: 500, prereq: ['maxFuel'] },
        type: 'upgrade',
        maxLevel: 5
    },
    {
        id: 'aerodynamics',
        name: 'AERO FRAME',
        icon: Wind,
        desc: 'Reduced air resistance.',
        color: 'teal',
        tier: 2,
        column: 3,
        requirements: { altitude: 500, prereq: ['luck'] },
        type: 'upgrade',
        maxLevel: 5
    },

    // TIER 3 - Elite (1500m)
    {
        id: 'shield',
        name: 'VOID SHIELD',
        icon: Shield,
        desc: 'Death protection module.',
        color: 'blue',
        tier: 3,
        column: 2,
        requirements: { altitude: 1500, prereq: ['efficiency'] },
        type: 'consumable',
        cost: Constants.ITEM_SHIELD_COST,
        maxLevel: 3
    }
];

export const SkillTreeShop: React.FC<SkillTreeShopProps> = ({ gameState, setGameState }) => {
    const [selectedSkill, setSelectedSkill] = useState<SkillNode | null>(null);

    const isUnlocked = (skill: SkillNode): boolean => {
        // Check altitude requirement
        if (skill.requirements.altitude && gameState.maxAltitude < skill.requirements.altitude) {
            return false;
        }

        // Check prereq skills
        if (skill.requirements.prereq) {
            return skill.requirements.prereq.every(prereqId => {
                const level = gameState.upgrades[prereqId];
                return level > 0; // At least level 1
            });
        }

        return true;
    };

    const getCost = (skill: SkillNode, currentLevel: number): number => {
        if (skill.type === 'consumable') {
            return skill.cost || 100;
        }
        return Math.floor(Constants.UPGRADE_COST_BASE * Math.pow(Constants.UPGRADE_COST_SCALE, currentLevel));
    };

    const buySkill = (skill: SkillNode) => {
        const currentLevel = gameState.upgrades[skill.id];
        const cost = getCost(skill, currentLevel);
        const isMaxed = currentLevel >= skill.maxLevel;
        const unlocked = isUnlocked(skill);
        const canAfford = gameState.totalCoins >= cost;

        if (!unlocked || isMaxed || !canAfford) {
            soundManager.playDamage();
            return;
        }

        soundManager.playCollect();
        setGameState((prev: any) => ({
            ...prev,
            totalCoins: prev.totalCoins - cost,
            upgrades: { ...prev.upgrades, [skill.id]: prev.upgrades[skill.id] + 1 }
        }));
    };

    // Group skills by tier
    const tier1 = SKILL_TREE.filter(s => s.tier === 1);
    const tier2 = SKILL_TREE.filter(s => s.tier === 2);
    const tier3 = SKILL_TREE.filter(s => s.tier === 3);

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-2 md:p-4">
            <div className="max-w-6xl w-full h-[95vh] md:h-[90vh] bg-[#020617] border border-cyan-500/30 rounded-2xl shadow-[0_0_100px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden">

                {/* HEADER */}
                <div className="p-3 md:p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={() => setGameState((prev: any) => ({ ...prev, isShopOpen: false }))}
                            className="p-2 md:p-3 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-white rounded-full transition-all"
                        >
                            <X className="icon-md" />
                        </button>
                        <div>
                            <h2 className="text-2xl md:text-4xl font-black text-white italic tracking-tighter flex items-center gap-2">
                                <Star className="text-cyan-400 icon-md" />
                                SKILL TREE
                            </h2>
                            <p className="text-slate-400 text-[10px] md:text-sm uppercase tracking-widest font-bold">
                                Unlock by reaching altitudes
                            </p>
                        </div>
                    </div>
                    <div className="bg-black border border-yellow-500/50 px-3 md:px-6 py-2 md:py-3 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        <Coins className="text-yellow-400 icon-sm" />
                        <span className="text-xl md:text-3xl font-black text-white">{gameState.totalCoins}</span>
                    </div>
                </div>

                {/* SKILL TREE GRID */}
                <div className="flex-1 p-4 md:p-8 overflow-y-auto custom-scrollbar">
                    <div className="max-w-4xl mx-auto space-y-8 md:space-y-16">

                        {/* TIER 1 */}
                        <TierRow tier={1} skills={tier1} gameState={gameState} isUnlocked={isUnlocked} getCost={getCost} buySkill={buySkill} selectedSkill={selectedSkill} setSelectedSkill={setSelectedSkill} />

                        {/* TIER 2 */}
                        <TierRow tier={2} skills={tier2} gameState={gameState} isUnlocked={isUnlocked} getCost={getCost} buySkill={buySkill} selectedSkill={selectedSkill} setSelectedSkill={setSelectedSkill} />

                        {/* TIER 3 */}
                        <TierRow tier={3} skills={tier3} gameState={gameState} isUnlocked={isUnlocked} getCost={getCost} buySkill={buySkill} selectedSkill={selectedSkill} setSelectedSkill={setSelectedSkill} />

                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper component for each tier row
const TierRow = ({ tier, skills, gameState, isUnlocked, getCost, buySkill, selectedSkill, setSelectedSkill }: any) => {
    return (
        <div>
            <div className="text-center mb-4 md:mb-6">
                <div className="text-cyan-400 font-black text-xs md:text-sm uppercase tracking-widest mb-1">
                    Tier {tier}
                </div>
                <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
            </div>
            <div className="grid grid-cols-3 gap-3 md:gap-6">
                {[1, 2, 3].map(col => {
                    const skill = skills.find((s: SkillNode) => s.column === col);
                    return (
                        <div key={col} className="flex justify-center">
                            {skill ? (
                                <SkillCard skill={skill} gameState={gameState} isUnlocked={isUnlocked} getCost={getCost} buySkill={buySkill} selectedSkill={selectedSkill} setSelectedSkill={setSelectedSkill} />
                            ) : (
                                <div className="w-full aspect-square max-w-[150px] bg-slate-900/20 border border-dashed border-slate-800 rounded-xl"></div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Skill Card Component
const SkillCard = ({ skill, gameState, isUnlocked, getCost, buySkill, selectedSkill, setSelectedSkill }: any) => {
    const currentLevel = gameState.upgrades[skill.id];
    const cost = getCost(skill, currentLevel);
    const unlocked = isUnlocked(skill);
    const canAfford = gameState.totalCoins >= cost;
    const isMaxed = currentLevel >= skill.maxLevel;
    const isSelected = selectedSkill?.id === skill.id;

    return (
        <div
            onClick={() => {
                setSelectedSkill(skill);
                if (unlocked) buySkill(skill);
            }}
            className={`w-full max-w-[200px] aspect-square bg-slate-900/80 border rounded-xl p-3 md:p-4 flex flex-col transition-all cursor-pointer ${!unlocked ? 'opacity-40 cursor-not-allowed' :
                isSelected ? `border-${skill.color}-400 ring-2 ring-${skill.color}-400 scale-105 shadow-[0_0_40px_rgba(6,182,212,0.3)]` :
                    'border-slate-800 hover:bg-slate-800 hover:scale-105'
                }`}
        >
            {/* Icon & Lock */}
            <div className="relative mb-2 md:mb-3">
                <div className={`w-14 h-14 md:w-20 md:h-20 mx-auto rounded-xl bg-${skill.color}-900/20 flex items-center justify-center text-${skill.color}-400 border border-${skill.color}-500/30 touch-target`}>
                    <skill.icon className="icon-md md:icon-lg" />
                </div>
                {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-xl backdrop-blur-sm">
                        <Lock className="text-red-400 icon-md" />
                    </div>
                )}
                {isMaxed && unlocked && (
                    <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                        <Check className="text-black icon-sm" />
                    </div>
                )}
            </div>

            {/* Name */}
            <h3 className="text-white font-bold text-[10px] md:text-sm uppercase tracking-tight text-center mb-1 md:mb-2 leading-tight">
                {skill.name}
            </h3>

            {/* Level Dots */}
            <div className="flex gap-0.5 md:gap-1 justify-center mb-2 md:mb-3">
                {[...Array(skill.maxLevel)].map((_, i) => (
                    <div
                        key={i}
                        className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${i < currentLevel ? `bg-${skill.color}-500` : 'bg-slate-800'}`}
                    ></div>
                ))}
            </div>

            {/* Cost/Status */}
            <div className={`mt-auto text-center py-1.5 md:py-2 rounded-lg font-bold text-[9px] md:text-xs uppercase tracking-wider ${!unlocked ? 'bg-slate-800 text-red-400' :
                isMaxed ? 'bg-slate-800 text-green-400' :
                    canAfford ? `bg-${skill.color}-600 text-white` :
                        'bg-slate-900/50 text-slate-500'
                }`}>
                {!unlocked ? `${skill.requirements.altitude}m` :
                    isMaxed ? 'MAXED' :
                        `${cost} 🪙`}
            </div>
        </div>
    );
};
