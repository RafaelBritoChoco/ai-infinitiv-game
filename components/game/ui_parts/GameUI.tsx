import React from 'react';
import { Coins, Heart, User, Rocket } from 'lucide-react';

export const GameUI = ({ gameState, config, setConfig, weedMode }: any) => {
    // weedMode passed as prop for reactivity
    
    return (
        <div className="absolute top-0 left-0 right-0 p-4 z-50 pointer-events-none flex justify-center">
            <div className={`
                flex items-center gap-6 px-6 py-2 rounded-full border-2 backdrop-blur-md shadow-lg
                ${weedMode 
                    ? 'bg-green-900/60 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.3)]' 
                    : 'bg-slate-900/60 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                }
            `}>
                {/* Coins */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <div className={`absolute inset-0 rounded-full blur-sm ${weedMode ? 'bg-yellow-500/50' : 'bg-yellow-400/40'}`}></div>
                        <Coins size={18} className="text-yellow-400 relative z-10" />
                    </div>
                    <span className="font-mono font-bold text-yellow-400 text-lg drop-shadow-md">
                        {gameState.runCoins}
                    </span>
                </div>

                {/* Divider */}
                <div className={`w-px h-6 ${weedMode ? 'bg-green-500/30' : 'bg-white/10'}`}></div>

                {/* Health */}
                <div className="flex items-center gap-1">
                    {[...Array(gameState.maxHealth)].map((_, i) => (
                        <Heart 
                            key={i} 
                            size={20} 
                            className={`
                                transition-all duration-300 filter drop-shadow-md
                                ${i < gameState.health 
                                    ? 'text-red-500 fill-red-500 scale-100' 
                                    : 'text-slate-700 scale-90 opacity-50'
                                }
                            `} 
                        />
                    ))}
                </div>

                {/* Divider */}
                <div className={`w-px h-6 ${weedMode ? 'bg-green-500/30' : 'bg-white/10'}`}></div>

                {/* Fuel Gauge (Mobile/Desktop) */}
                {gameState.upgrades.maxFuel > 0 && (
                    <>
                        <div className="flex items-center gap-2">
                            <Rocket size={18} className="text-cyan-400" />
                            <div className="w-16 h-2 bg-slate-700/50 rounded-full overflow-hidden border border-white/10">
                                <div 
                                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-300"
                                    style={{ width: `${Math.min(100, (gameState.fuel / ((config.JETPACK_FUEL_MAX || 100) + (gameState.upgrades.maxFuel * (config.UPGRADE_FUEL_BONUS || 25)))) * 100)}%` }}
                                ></div>
                            </div>
                        </div>
                        <div className={`w-px h-6 ${weedMode ? 'bg-green-500/30' : 'bg-white/10'}`}></div>
                    </>
                )}

                {/* Altitude */}
                <div className="flex items-center gap-2 min-w-[80px] justify-end">
                    <span className={`font-mono font-black text-xl tracking-tight drop-shadow-md ${weedMode ? 'text-green-400' : 'text-cyan-400'}`}>
                        {Math.floor(gameState.score)}
                    </span>
                    <span className={`text-xs font-bold uppercase mt-1 ${weedMode ? 'text-green-600' : 'text-slate-500'}`}>m</span>
                </div>
            </div>
            
            {/* Player Name Tag (Floating below HUD) */}
            <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                    <User size={10} className="text-cyan-400" />
                    {gameState.username || "AGENT"}
                </span>
            </div>
        </div>
    );
};
