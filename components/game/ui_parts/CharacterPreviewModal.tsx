import React, { useEffect, useRef, useState, useMemo } from 'react';
import { X, ChevronLeft, Lock, Trophy, Target, Star, Zap, Shield, Activity, Play } from 'lucide-react';
import { CharacterSkin, CHARACTER_CHALLENGES } from '../../../types';

export const CharacterPreviewModal = ({ skin, onClose, onSelectSkin, allSkins, unlockedSkins = [], onStartGame }: {
    skin: CharacterSkin;
    onClose: () => void;
    onSelectSkin: (skin: CharacterSkin) => void;
    allSkins: CharacterSkin[];
    unlockedSkins?: string[];
    onStartGame?: () => void;
}) => {
    const [currentSkinIndex, setCurrentSkinIndex] = useState(() => {
        if (!skin) return 0;
        const idx = allSkins.findIndex(s => s.id === skin.id);
        return idx >= 0 ? idx : 0;
    });

    // Animation State for Preview
    const [animFrame, setAnimFrame] = useState(0);

    const currentSkin = allSkins[currentSkinIndex] || skin || allSkins[0];

    // Helper to check if locked
    const isLocked = (skinId: string) => {
        if (['ginger', 'kero'].includes(skinId)) return false;
        if (skinId.startsWith('trophy_')) return false;
        if (skinId.startsWith('ai_')) return false;
        const challenge = CHARACTER_CHALLENGES.find(c => c.skinId === skinId);
        if (!challenge) return false;
        return !unlockedSkins.includes(skinId);
    };

    const getUnlockInfo = (skinId: string) => {
        const challenge = CHARACTER_CHALLENGES.find(c => c.skinId === skinId);
        if (!challenge) return null;
        return challenge;
    };

    const isCurrentLocked = isLocked(currentSkin.id);
    const unlockInfo = getUnlockInfo(currentSkin.id);

    // Improved Animation Loop (Idle/Float)
    useEffect(() => {
        let frame = 0;
        const interval = setInterval(() => {
            frame = (frame + 1) % 60;
            setAnimFrame(frame);
        }, 50);
        return () => clearInterval(interval);
    }, []);

    // Calculate float offset
    const floatY = Math.sin(animFrame * 0.1) * 10;
    const scale = 1 + Math.sin(animFrame * 0.05) * 0.02;

    const unlockedCount = allSkins.filter(s => !isLocked(s.id)).length;
    const totalCount = allSkins.length;

    return (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md overflow-hidden flex flex-col h-[100dvh]">

            {/* GLOBAL HEADER (BACK BUTTON) */}
            <div className="absolute top-safe-top left-4 z-50 mt-4">
                <button onClick={onClose} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/50 px-3 py-2 rounded-full backdrop-blur-sm border border-white/10 shadow-lg active:scale-95">
                    <ChevronLeft size={20} />
                    <span className="uppercase font-bold tracking-widest text-xs">Back</span>
                </button>
            </div>

            {/* MAIN CONTENT WRAPPER */}
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">

                {/* SECTION 1: PREVIEW AREA (Top on Mobile 45%, Right on Desktop) */}
                <div className="relative w-full md:w-1/2 lg:w-5/12 h-[45%] md:h-full bg-gradient-to-b from-slate-900 to-black flex items-center justify-center p-4 md:p-8 order-first md:order-last border-b md:border-b-0 md:border-l border-white/10 shrink-0">

                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent opacity-50" />

                    {/* Character Render */}
                    <div
                        className="relative w-[180px] h-[180px] md:w-[400px] md:h-[400px] transition-transform duration-100 ease-out cursor-pointer z-20"
                        style={{
                            transform: `translateY(${floatY}px) scale(${scale})`,
                        }}
                    >
                        <div className={`w-full h-full ${isCurrentLocked ? 'brightness-0 opacity-40' : 'drop-shadow-[0_0_30px_rgba(6,182,212,0.4)]'}`}>
                            <svg viewBox={`0 0 ${currentSkin.pixels?.length > 16 ? 24 : 16} ${currentSkin.pixels?.length > 16 ? 24 : 16}`} className="w-full h-full" shapeRendering="crispEdges">
                                {(currentSkin.pixels || []).map((row, y) => row.map((val, x) => {
                                    if (val === 0) return null;
                                    let fill = currentSkin.color || '#fff';
                                    if (val === 1) fill = '#000'; // Outline
                                    if (val === 6) fill = '#fbbf24'; // Gold accent
                                    if (val === 2) fill = currentSkin.color || '#fff';

                                    return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={fill} />
                                }))}
                            </svg>
                        </div>

                        {/* Shadow */}
                        <div
                            className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-24 md:w-48 h-3 md:h-8 bg-black/60 rounded-[100%] blur-lg transition-all duration-100"
                            style={{
                                transform: `translateX(-50%) scale(${1 - (floatY / 50)})`,
                                opacity: 0.4
                            }}
                        />

                        {/* LOCKED OVERLAY - ABOVE CHARACTER */}
                        {isCurrentLocked && unlockInfo && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] text-center z-30 animate-in fade-in zoom-in duration-300">
                                <div className="bg-black/80 backdrop-blur-md border border-red-500/50 p-3 rounded-xl shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                                    <Lock className="mx-auto text-red-500 mb-1" size={24} />
                                    <h3 className="text-red-400 font-black uppercase text-xs tracking-widest mb-1">LOCKED</h3>
                                    <p className="text-white font-bold text-xs md:text-sm leading-tight">{unlockInfo.description}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {!isCurrentLocked && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] md:w-[500px] md:h-[500px] bg-cyan-500/10 blur-[50px] md:blur-[100px] rounded-full pointer-events-none animate-pulse" />
                    )}
                </div>

                {/* SECTION 2: INFO & SELECTION (Bottom on Mobile 55%, Left on Desktop) */}
                <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 relative h-[55%] md:h-full">

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col p-4 md:p-8 pb-24 md:pb-12">

                        {/* Character Name & ID */}
                        <div className="mb-4 md:mb-6 shrink-0 text-center md:text-left">
                            <h1 className="text-3xl md:text-5xl font-black italic text-white uppercase tracking-tighter drop-shadow-lg mb-1 flex items-center justify-center md:justify-start gap-3">
                                {currentSkin.name}
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-3 text-slate-400 font-mono text-[10px] md:text-xs tracking-widest uppercase">
                                <span className="px-2 py-0.5 bg-slate-800 rounded text-white">
                                    {currentSkin.id.startsWith('ai_') ? 'AI CLASS' : currentSkin.id.startsWith('trophy_') ? 'TROPHY CLASS' : 'STANDARD'}
                                </span>
                            </div>
                        </div>

                        {/* Stats (Simplified) */}
                        {!isCurrentLocked && (
                            <div className="w-full max-w-md mb-4 shrink-0 mx-auto md:mx-0">
                                <div className="bg-cyan-950/20 border-l-2 border-cyan-500 p-2 md:p-4 rounded-r-lg backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="text-cyan-400 font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2">
                                            <Activity size={12} /> Stats
                                        </h3>
                                    </div>
                                    <div className="space-y-1.5">
                                        <StatBar label="SPD" value={currentSkin.id === 'samurai' ? 90 : 70} color="bg-cyan-500" />
                                        <StatBar label="JMP" value={currentSkin.id === 'bunny' ? 95 : 75} color="bg-blue-500" />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grid Selection Header */}
                        <h3 className="text-slate-500 font-bold uppercase tracking-widest mb-2 text-[10px] shrink-0 text-center md:text-left">
                            Select Character ({unlockedCount}/{totalCount})
                        </h3>

                        {/* Grid Selection Items */}
                        <div className="flex flex-wrap gap-2 justify-center md:justify-start content-start pb-20">
                            {allSkins.map((s, i) => (
                                <HexagonSkinItem
                                    key={s.id || i}
                                    skin={s}
                                    isSelected={currentSkinIndex === i}
                                    isLocked={isLocked(s.id)}
                                    onClick={() => setCurrentSkinIndex(i)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Mobile Select Button (Fixed at bottom with safe area) */}
                    <div className="absolute bottom-0 left-0 w-full p-3 pb-safe-bottom bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-30">
                        <div className="flex gap-2">
                            {/* EQUIP BUTTON */}
                            <button
                                onClick={() => {
                                    if (!isCurrentLocked) {
                                        onSelectSkin(currentSkin);
                                        onClose();
                                    }
                                }}
                                disabled={isCurrentLocked}
                                className={`flex-1 py-3 rounded-xl font-black uppercase tracking-widest text-sm md:text-base transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${isCurrentLocked
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                        : 'bg-slate-800 text-white hover:bg-slate-700 border border-slate-600'
                                    }`}
                            >
                                {isCurrentLocked ? <Lock size={16} /> : <Target size={18} />}
                                {isCurrentLocked ? 'LOCKED' : 'EQUIP'}
                            </button>

                            {/* PLAY BUTTON */}
                            <button
                                onClick={() => {
                                    if (!isCurrentLocked) {
                                        onSelectSkin(currentSkin);
                                        if (onStartGame) onStartGame();
                                        onClose();
                                    }
                                }}
                                disabled={isCurrentLocked}
                                className={`flex-[2] py-3 rounded-xl font-black uppercase tracking-widest text-sm md:text-base transition-all transform active:scale-95 shadow-lg flex items-center justify-center gap-2 ${isCurrentLocked
                                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                        : 'bg-cyan-500 text-black hover:bg-cyan-400 shadow-cyan-500/20'
                                    }`}
                            >
                                {isCurrentLocked ? (
                                    <>LOCKED</>
                                ) : (
                                    <>
                                        <Play size={18} fill="currentColor" /> PLAY NOW
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Stat Bar Component
const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="flex items-center gap-3">
        <span className="w-8 md:w-12 text-[10px] md:text-xs font-bold text-slate-400 uppercase">{label}</span>
        <div className="flex-1 h-1.5 md:h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }} />
        </div>
    </div>
);

// Optimized Hexagon Item using Canvas to reduce DOM nodes
const HexagonSkinItem = React.memo(({ skin, isSelected, isLocked, onClick }: { skin: CharacterSkin, isSelected: boolean, isLocked: boolean, onClick: () => void }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw Pixels
        const pixels = skin.pixels || [];
        if (pixels.length === 0) return;

        const rows = pixels.length;
        const cols = pixels[0]?.length || 0;

        // Calculate scale to fit 32x32 canvas
        // Max dimension is usually 24 in our game
        const scale = Math.min(canvas.width / cols, canvas.height / rows);
        const offsetX = (canvas.width - cols * scale) / 2;
        const offsetY = (canvas.height - rows * scale) / 2;

        ctx.fillStyle = isLocked ? '#555' : (skin.color || '#fff');

        pixels.forEach((row, y) => {
            row.forEach((val, x) => {
                if (val !== 0) {
                    ctx.fillRect(
                        Math.floor(offsetX + x * scale),
                        Math.floor(offsetY + y * scale),
                        Math.ceil(scale),
                        Math.ceil(scale)
                    );
                }
            });
        });

    }, [skin, isLocked]);

    return (
        <button
            onClick={onClick}
            className={`relative w-14 h-14 md:w-20 md:h-20 transition-all duration-200 group ${isSelected ? 'scale-110 z-10' : 'active:scale-95 opacity-80'}`}
            style={{
                clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
                padding: '2px', // Border width
                background: isSelected ? '#06b6d4' : (isLocked ? '#334155' : '#475569')
            }}
        >
            <div
                className="w-full h-full bg-slate-900 flex items-center justify-center"
                style={{
                    clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)'
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={32}
                    height={32}
                    className={`w-8 h-8 md:w-12 md:h-12 object-contain ${isLocked ? 'opacity-50 grayscale' : ''}`}
                    style={{ imageRendering: 'pixelated' }}
                />

                {/* Selection Indicator Overlay */}
                {isSelected && (
                    <div className="absolute inset-0 bg-cyan-500/20 pointer-events-none" />
                )}

                {/* Lock Icon */}
                {isLocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Lock size={12} className="text-white/70" />
                    </div>
                )}
            </div>
        </button>
    );
}, (prev, next) => {
    return prev.isSelected === next.isSelected && prev.isLocked === next.isLocked && prev.skin.id === next.skin.id;
});