import React from 'react';
import { Rocket, Zap, ChevronsUp, Wind, TrendingUp, Shield, ArrowLeft, ShoppingBag, Coins } from 'lucide-react';
import { ShopUpgrades } from '../../../types';
import { soundManager } from '../audioManager';
import * as Constants from '../../../constants';

export const ShopModal = ({ gameState, setGameState, selectedIndex = -1 }: any) => {
    const getFuelUpgradeName = (level: number) => level === 0 ? "UNLOCK JETPACK" : "TANK EXPANSION";
    const upgrades = [
        { id: 'maxFuel', name: getFuelUpgradeName(gameState.upgrades.maxFuel), icon: Rocket, desc: gameState.upgrades.maxFuel === 0 ? 'Install standard thruster system.' : 'Increases Max Fuel Capacity.', bonus: `+${Constants.UPGRADE_FUEL_BONUS} Capacity`, color: 'cyan', type: 'upgrade' },
        { id: 'efficiency', name: 'ION THRUSTER', icon: Zap, desc: 'Reduces fuel consumption.', bonus: `Burn Rate -${Math.round(Constants.UPGRADE_EFFICIENCY_BONUS * 100)}%`, color: 'purple', type: 'upgrade' },
        { id: 'jump', name: 'HYDRAULIC BOOTS', icon: ChevronsUp, desc: 'Increases Platform Jump Height.', bonus: `+${Constants.UPGRADE_JUMP_BONUS} Jump Force`, color: 'orange', type: 'upgrade' },
        { id: 'aerodynamics', name: 'AERODYNAMICS', icon: Wind, desc: 'Reduces air drag when ascending.', bonus: '+Air Agility', color: 'teal', type: 'upgrade' },
        { id: 'luck', name: 'SCAVENGER AI', icon: TrendingUp, desc: 'Find more Coins & Fuel.', bonus: `+${Math.round(Constants.UPGRADE_LUCK_BONUS * 100)}% Spawn Rate`, color: 'green', type: 'upgrade' },
        { id: 'shield', name: 'VOID SHIELD', icon: Shield, desc: 'Emergency rescue from the void.', bonus: 'Prevents Death (1x)', color: 'blue', type: 'consumable', cost: Constants.ITEM_SHIELD_COST, max: 3 },
    ];

    const buyUpgrade = (id: keyof ShopUpgrades, type: string, flatCost?: number, maxLimit?: number) => {
        const currentLevel = gameState.upgrades[id];
        let cost = type === 'consumable' ? (flatCost || 100) : Math.floor(Constants.UPGRADE_COST_BASE * Math.pow(Constants.UPGRADE_COST_SCALE, currentLevel));
        const limit = maxLimit || 5;
        if (gameState.totalCoins >= cost && currentLevel < limit) {
            soundManager.playCollect();
            setGameState((prev: any) => ({ ...prev, totalCoins: prev.totalCoins - cost, upgrades: { ...prev.upgrades, [id]: prev.upgrades[id] + 1 } }));
        } else { soundManager.playDamage(); }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="max-w-5xl w-full bg-[#020617] border border-cyan-500/30 rounded-2xl shadow-[0_0_100px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh] relative overflow-hidden">
                <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0 relative">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setGameState((prev: any) => ({ ...prev, isShopOpen: false }))} className="p-3 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-white rounded-full transition-all">
                            <ArrowLeft size={28} />
                        </button>
                        <div>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
                                <ShoppingBag className="text-cyan-400" size={32} /> NEON DEPOT
                            </h2>
                            <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">A - BUY <span className="mx-2">|</span> B - EXIT</p>
                        </div>
                    </div>
                    <div className="bg-black border border-yellow-500/50 px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        <Coins className="text-yellow-400" size={24} />
                        <span className="text-3xl font-black text-white">{gameState.totalCoins}</span>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto custom-scrollbar bg-[#020617]">
                    {upgrades.map((u, idx) => {
                        const level = gameState.upgrades[u.id as keyof ShopUpgrades];
                        const isConsumable = u.type === 'consumable';
                        const limit = u.max || 5;
                        const isMaxed = level >= limit;
                        let cost = isConsumable ? (u.cost || 100) : Math.floor(Constants.UPGRADE_COST_BASE * Math.pow(Constants.UPGRADE_COST_SCALE, level));
                        const canAfford = gameState.totalCoins >= cost;
                        const isSelected = idx === selectedIndex;
                        return (
                            <div key={u.id} onClick={() => buyUpgrade(u.id as keyof ShopUpgrades, u.type, u.cost, u.max)} className={`relative bg-slate-900/80 border rounded-xl p-5 flex flex-col transition-all group cursor-pointer ${isSelected ? `border-${u.color}-400 ring-2 ring-${u.color}-400 scale-105 z-10 shadow-[0_0_40px_rgba(0,0,0,0.8)]` : 'border-slate-800 hover:bg-slate-800'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-14 h-14 rounded-xl bg-${u.color}-900/20 flex items-center justify-center text-${u.color}-400 border border-${u.color}-500/20 ${isSelected ? 'scale-110' : ''}`}><u.icon size={28} /></div>
                                    <div className={`text-${u.color}-400 text-xs font-bold bg-${u.color}-950/30 px-2 py-1.5 rounded border border-${u.color}-900/50`}>{u.bonus}</div>
                                </div>
                                <h3 className="text-white font-bold text-lg uppercase tracking-tight">{u.name}</h3>
                                <p className="text-slate-500 text-sm mb-4 min-h-[40px] leading-snug">{u.desc}</p>
                                <div className="flex gap-1.5 mb-5 items-center">
                                    {isConsumable ? (
                                        <div className="text-slate-400 font-mono text-sm">OWNED: <span className={`text-white font-bold text-base ${level > 0 ? 'text-blue-400' : ''}`}>{level}</span> / {limit}</div>
                                    ) : (
                                        [...Array(5)].map((_, i) => (<div key={i} className={`h-2 flex-1 rounded-full transition-all duration-300 ${i < level ? `bg-${u.color}-500 shadow-[0_0_5px_${u.color}]` : 'bg-slate-800'}`}></div>))
                                    )}
                                </div>
                                <div className={`mt-auto py-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all uppercase tracking-widest ${isMaxed ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : canAfford ? `bg-${u.color}-600 text-white shadow-lg` : 'bg-slate-900 text-slate-600 border border-slate-800 opacity-70'}`}>
                                    {isMaxed ? "MAX LEVEL" : <>{isConsumable ? "BUY" : "UPGRADE"} <span className="text-white/30">|</span> {cost} <Coins size={16} /></>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
