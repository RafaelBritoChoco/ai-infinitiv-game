import React from 'react';
import { Trophy, Coins, Shield, Heart, Crown, Gamepad2, Keyboard } from 'lucide-react';
import { SideBarMetric } from './SideBarMetric';
import { soundManager } from '../audioManager';
import { LeaderboardEntry } from '../../types';

export const LeftSidebar = ({ gameState, config, gamepadConnected, leaderboard }: any) => (
    <div className="hidden md:flex w-48 flex-col p-4 border-r border-cyan-900/30 bg-black/80 backdrop-blur-xl z-10 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
        <div className="mb-6 relative px-1 pt-1">
            <h1 className="text-3xl font-black text-white tracking-tighter italic neon-text-cyan leading-none">
                AI<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">INFINITIV</span>
            </h1>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {/* Removed duplicate metrics (Score, Coins, Health) as they are now in the main HUD */}
            
            {gameState.upgrades.shield > 0 && (
                <div className="bg-blue-900/30 border border-blue-500/30 p-3 rounded-lg mb-3 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <div className="text-xs font-bold text-blue-400 flex items-center gap-2 mb-1 uppercase tracking-wider">
                        <Shield size={14} /> SHIELD ACTIVE
                    </div>
                    <div className="text-white font-mono text-sm font-bold">CHARGES: {gameState.upgrades.shield}</div>
                </div>
            )}
            
            <div className="mt-6 border-t border-white/10 pt-3">
                <div className="text-xs text-slate-500 font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
                    <Crown size={14} className="text-yellow-500" /> GLOBAL RANKING
                </div>
                <div className="space-y-2">
                    {leaderboard && leaderboard.length > 0 ? (
                        leaderboard.map((entry: LeaderboardEntry, i: number) => (
                            <div key={entry.id} className="flex justify-between items-center text-xs p-2 bg-slate-900/50 rounded border border-slate-800 hover:border-slate-600 transition-colors">
                                <div className="flex gap-2 items-center">
                                    <span className={`${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : 'text-amber-700'} font-bold font-mono w-4`}>#{i + 1}</span>
                                    <span className="text-slate-300 font-bold truncate max-w-[80px]">{entry.name}</span>
                                </div>
                                <span className="font-mono text-cyan-400 font-bold">{entry.score}m</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-slate-600 italic p-1">No Data</div>
                    )}
                </div>
            </div>
        </div>
        <div className="mt-auto pt-3 border-t border-white/10">
            {gamepadConnected && (
                <div className="mb-2 text-[10px] text-green-500 font-mono font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse">
                    <Gamepad2 size={14} /> Gamepad Active
                </div>
            )}
            <div className="text-[10px] text-slate-500 space-y-1 font-mono font-bold">
                <div className="flex items-center gap-2"><Keyboard size={12} /> <span className="text-cyan-500/70">SPACE: JUMP</span></div>
                <div className="flex items-center gap-2"><Keyboard size={12} /> <span className="text-purple-500/70">SHIFT: JETPACK</span></div>
            </div>
        </div>
    </div>
);
