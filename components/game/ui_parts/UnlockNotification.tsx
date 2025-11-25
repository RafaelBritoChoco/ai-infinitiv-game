import React, { useEffect } from 'react';
import { Unlock, X } from 'lucide-react';
import { CharacterChallenge } from '../../types';
import { SKINS } from '../assets';
import { soundManager } from '../audioManager';

export const UnlockNotification = ({ challenge, onClose }: { challenge: CharacterChallenge; onClose: () => void }) => {

    const skin = SKINS.find(s => s.id === challenge.skinId);
    
    useEffect(() => {
        // Play unlock sound
        soundManager.playPerfectJump();
        setTimeout(() => soundManager.playPerfectJump(), 200);
        
        // Removed auto-close to ensure visibility
    }, []);
    
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gradient-to-b from-emerald-900 to-teal-950 border-2 border-emerald-400 rounded-2xl p-6 shadow-[0_0_50px_rgba(16,185,129,0.6)] flex flex-col items-center gap-4 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-300 relative">
                
                {/* Close button */}
                <button onClick={onClose} className="absolute top-2 right-2 text-emerald-400 hover:text-white p-2">
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-black uppercase tracking-[0.2em] mb-2 animate-pulse">
                        <Unlock size={16} /> NOVO PERSONAGEM!
                    </div>
                    <h2 className="text-3xl font-black text-white italic tracking-tighter drop-shadow-lg">
                        DESBLOQUEADO
                    </h2>
                </div>

                {/* Character preview */}
                <div className="w-32 h-32 bg-emerald-950/50 rounded-xl p-4 border border-emerald-500/30 shadow-inner flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.2),transparent)] animate-pulse"></div>
                    <div className="w-24 h-24 animate-bounce relative z-10" style={{ animationDuration: '1s' }}>
                        {skin && (
                            <svg viewBox={`0 0 ${skin.pixels?.length > 16 ? 24 : 16} ${skin.pixels?.length > 16 ? 24 : 16}`} className="w-full h-full drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]" shapeRendering="crispEdges">
                                {(skin?.pixels || []).map((row: number[], y: number) =>
                                    row.map((val: number, x: number) => {
                                        if (val === 0) return null;
                                        let color = skin?.color || '#f97316';
                                        if (val === 1) color = '#0f172a';
                                        else if (val === 3) color = '#ffffff';
                                        else if (val === 4) color = '#ffffff';
                                        else if (val === 5) color = '#000000';
                                        else if (val === 6) color = '#facc15';
                                        return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
                                    })
                                )}
                            </svg>
                        )}
                    </div>
                </div>
                
                {/* Text */}
                <div className="text-center space-y-1">
                    <div className="text-2xl font-black text-white flex items-center justify-center gap-2">
                        <span className="text-3xl">{challenge.emoji}</span> {skin?.name || challenge.skinId}
                    </div>
                    <p className="text-emerald-200/70 text-xs font-mono uppercase tracking-wider">
                        Disponível na Loja de Skins
                    </p>
                </div>
                
                <button 
                    onClick={onClose}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl uppercase tracking-widest shadow-lg shadow-emerald-900/40 transition-all mt-2"
                >
                    CONTINUAR
                </button>
            </div>
        </div>
    );
};
