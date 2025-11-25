import React from 'react';
import { soundManager } from '../audioManager';

export const SideBarMetric = ({ label, value, icon: Icon, color, glowColor }: any) => (
    <div className="relative group" onMouseEnter={() => soundManager.playHover()}>
        <div className={`absolute inset-0 bg-${glowColor}-500/10 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-lg mb-3 relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-1 opacity-20 text-${glowColor}-500`}>
                <Icon size={28} strokeWidth={1} />
            </div>
            <div className={`text-xs font-bold text-${glowColor}-400 flex items-center gap-1.5 mb-1 uppercase tracking-[0.1em]`}>
                <Icon size={12} className={`text-${glowColor}-400`} /> {label}
            </div>
            <div className="text-xl font-black tracking-tighter text-white neon-text-cyan drop-shadow-md">{value}</div>
        </div>
    </div>
);
