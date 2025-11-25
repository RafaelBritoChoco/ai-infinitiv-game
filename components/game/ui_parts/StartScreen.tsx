import React, { useState, useEffect } from 'react';
import {
    RefreshCw, Trophy, Crown, HelpCircle, Loader2, Sparkles, Lock,
    Settings, Gamepad2, Edit3, Monitor, ShoppingCart, Play, LogOut, X, Globe
} from 'lucide-react';
import { CharacterSkin, CharacterChallenge, CHARACTER_CHALLENGES, TROPHY_POWERS } from '../../../types';
import * as Constants from '../../../constants';
import { soundManager } from '../audioManager';
import { AdminPanel } from './AdminPanelComponent';
import { CharacterPreviewModal } from './CharacterPreviewModal';
import { getUnlockedTrophySkins, getTrophySkinByRank, TROPHY_GOLD, TROPHY_SILVER, TROPHY_BRONZE } from './TrophySkins';
import { Persistence } from '../persistence';
import { TRANSLATIONS } from '../translations';

export const StartScreen = ({ gameState, setGameState, availableSkins, showAiInput, setShowAiInput, aiPrompt, setAiPrompt, isGeneratingSkin, handleGenerateSkin, handleStart, onOpenControls, onOpenCalibration, onOpenSettings, selectedIndex, gyroEnabled, setGyroEnabled, onLogout, leaderboard, setLeaderboard, weedMode, setWeedMode, lang, setLang }: any) => {
    // SAFETY: Ensure availableSkins is always an array
    const safeSkins = Array.isArray(availableSkins) ? availableSkins : [];

    const [showSensorDebug, setShowSensorDebug] = useState(false);
    const [showRanking, setShowRanking] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [secretCode, setSecretCode] = useState('');
    const [showCharacterPreview, setShowCharacterPreview] = useState(false);
    const [showChallengeModal, setShowChallengeModal] = useState<CharacterChallenge | null>(null);
    const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>(() => {
        return Persistence.loadUnlockedSkins();
    });
    // WeedMode is now controlled by GameCanvas via props
    
    const [activeTab, setActiveTab] = useState<'local' | 'global'>('global');
    const [globalStatus, setGlobalStatus] = useState<string | null>(null);

    // Fetch Global Leaderboard
    useEffect(() => {
        // Always fetch global leaderboard on mount or when tab is global
        if (activeTab === 'global') {
            setGlobalStatus(t[lang].loading);
            Persistence.fetchGlobalLeaderboard()
                .then(data => {
                    if (setLeaderboard) setLeaderboard(data);
                    setGlobalStatus(null);
                })
                .catch(err => {
                    console.error(err);
                    setGlobalStatus(t[lang].connectionError);
                });
        }
    }, [activeTab, setLeaderboard]);
    
    // Characters that are ALWAYS unlocked (starter pack)
    const STARTER_CHARACTERS = ['ginger', 'kero']; // GINGER and KERO always unlocked
    
    // Check if a skin is locked
    const isCharacterLocked = (skinId: string): boolean => {
        // Starter characters are never locked
        if (STARTER_CHARACTERS.includes(skinId)) return false;
        // Trophy skins have their own unlock system
        if (skinId.startsWith('trophy_')) return false;
        // AI generated skins are never locked
        if (skinId.startsWith('ai_')) return false;
        // Check if character has a challenge
        const challenge = CHARACTER_CHALLENGES.find(c => c.skinId === skinId);
        if (!challenge) return false; // No challenge = unlocked
        // Check if unlocked
        return !unlockedCharacters.includes(skinId);
    };
    
    // Get challenge for a character
    const getCharacterChallenge = (skinId: string): CharacterChallenge | undefined => {
        return CHARACTER_CHALLENGES.find(c => c.skinId === skinId);
    };
    
    // Handle clicking on locked character
    const handleLockedCharacterClick = (skinId: string) => {
        const challenge = getCharacterChallenge(skinId);
        if (challenge) {
            setShowChallengeModal(challenge);
        }
    };
    
    // Secret code detection - type "chocopro" to open admin panel
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            const newCode = (secretCode + e.key).slice(-8);
            setSecretCode(newCode);
            if (newCode === 'chocopro') {
                setShowAdminPanel(true);
                setSecretCode('');
            }
        };
        window.addEventListener('keypress', handleKeyPress);
        return () => window.removeEventListener('keypress', handleKeyPress);
    }, [secretCode]);

    const t = TRANSLATIONS;

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
            const elem = document.documentElement as any;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            }
        }
    };



    // Weed mode translations
    const weedT = {
        title: weedMode ? '420 INFINITIV' : 'AI INFINITIV',
        subtitle: weedMode ? 'Pega a Brisa Protocol' : 'Vertical Ascent Protocol',
        start: weedMode ? 'ACENDE ESSA' : t[lang].start,
        skin: weedMode ? 'ESCOLHE TEU BECK' : t[lang].skin,
        highScore: weedMode ? 'MAIOR VIAGEM' : t[lang].highScore,
        coins: weedMode ? 'BECK COINS' : t[lang].coins,
        motion: weedMode ? 'BALANCA' : 'MOTION',
        controls: weedMode ? 'CONTROLA' : t[lang].controls,
        ranking: weedMode ? 'OS MAIS CHAPADOS' : 'RANKING GLOBAL',
    };

    const toggleWeedMode = () => {
        const newMode = !weedMode;
        setWeedMode(newMode);
        try { localStorage.setItem('WEED_MODE', String(newMode)); } catch {}
    };

    return (
        <div className={`absolute inset-0 z-50 flex flex-col items-center backdrop-blur-md overflow-hidden ${weedMode ? 'bg-green-950/95' : 'bg-black/90'}`}>
            {/* UPDATE BUTTON - FIXED position always visible */}
            <button
                onClick={async () => {
                    try {
                        if ('caches' in window) {
                            const cacheNames = await caches.keys();
                            await Promise.all(cacheNames.map(name => caches.delete(name)));
                        }
                        if ('serviceWorker' in navigator) {
                            const registrations = await navigator.serviceWorker.getRegistrations();
                            await Promise.all(registrations.map(reg => reg.unregister()));
                        }
                        window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
                    } catch (e) {
                        window.location.reload();
                    }
                }}
                className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wider rounded border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] transition-all flex items-center gap-2"
            >
                <RefreshCw size={12} className="animate-spin-slow" /> UPDATE <span className="text-yellow-300 font-mono">{Constants.APP_VERSION}</span>
            </button>

            {/* TOP RIGHT CONTROLS */}
            <div className="fixed top-2 right-2 z-[100] flex flex-col gap-2 items-end">
                {/* LANGUAGE TOGGLE */}
                <button 
                    onClick={() => {
                        const nextLang = lang === 'EN' ? 'PT' : lang === 'PT' ? 'IT' : 'EN';
                        setLang(nextLang);
                    }}
                    className="p-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-400 rounded-xl border border-slate-600 shadow-lg transition-all flex items-center gap-1"
                    title="Change Language"
                >
                    <Globe size={14} />
                    <span className="text-[10px] font-bold">{lang}</span>
                </button>

                {/* FULLSCREEN TOGGLE */}
                <button 
                    onClick={toggleFullscreen}
                    className="p-2 bg-slate-800/90 hover:bg-slate-700/90 text-slate-400 rounded-xl border border-slate-600 shadow-lg transition-all"
                    title={t[lang].fullscreen}
                >
                    <Monitor size={14} />
                </button>

                {/* WEED MODE TOGGLE */}
                <button 
                    onClick={toggleWeedMode}
                    className={`px-3 py-2 rounded-xl font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all border shadow-lg ${weedMode ? 'bg-green-600 text-white border-green-400 shadow-green-500/30' : 'bg-slate-800/90 text-slate-400 border-slate-600 hover:bg-slate-700/90'}`}
                >
                    420 {weedMode ? 'ON' : 'OFF'}
                </button>

                {/* LOGOUT BUTTON - Improved Style */}
                <button 
                    onClick={onLogout}
                    className="px-3 py-2 bg-red-900/80 hover:bg-red-800 text-red-200 rounded-xl font-bold text-[10px] uppercase tracking-wider border border-red-700/50 transition-all flex items-center gap-2 shadow-lg"
                    title="Sair da Conta"
                >
                    <LogOut size={12} /> {t[lang].logout}
                </button>
            </div>

            {/* MAIN CONTENT CONTAINER - OPTIMIZED FOR MOBILE (NO SCROLL) */}
            <div className="flex flex-col items-center w-full max-w-md h-full pt-14 pb-4 px-4 justify-between overflow-hidden">
                
                {/* HEADER - Compact */}
                <div className="text-center shrink-0 relative z-10">
                    <div className={`absolute -inset-10 blur-3xl rounded-full animate-pulse opacity-50 ${weedMode ? 'bg-green-500/20' : 'bg-cyan-500/10'}`}></div>
                    <h1 className={`text-4xl font-black italic tracking-tighter text-white relative z-10 leading-none ${weedMode ? 'drop-shadow-[0_0_10px_rgba(34,197,94,0.8)]' : 'drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]'}`}>
                        {weedMode ? '420 ' : 'AI '}<span className={`text-transparent bg-clip-text ${weedMode ? 'bg-gradient-to-r from-green-400 to-lime-500' : 'bg-gradient-to-r from-cyan-400 to-purple-500'}`}>INFINITIV</span>
                    </h1>
                    <p className={`font-mono tracking-[0.3em] text-[8px] mt-1 font-bold uppercase ${weedMode ? 'text-green-500' : 'text-cyan-500'}`}>{weedT.subtitle}</p>
                </div>

                {/* CHARACTER SECTION - Compact & Centered */}
                <div className={`w-full border rounded-xl p-3 backdrop-blur-sm flex flex-col items-center shrink-0 relative z-10 transition-all ${weedMode ? 'bg-green-900/20 border-green-800/50' : 'bg-slate-900/40 border-slate-800/50'}`}>
                    
                    {/* Character Preview Box */}
                    <div 
                        className="relative w-24 h-24 mb-2 group cursor-pointer rounded-lg border border-dashed border-cyan-500/30 hover:border-cyan-400/60 transition-all hover:scale-105" 
                        onClick={() => setShowCharacterPreview(true)}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-purple-600/10 rounded-lg"></div>
                        <div className="w-full h-full p-2 flex items-center justify-center">
                            <svg viewBox={`0 0 ${gameState.selectedSkin?.pixels?.length > 16 ? 24 : 16} ${gameState.selectedSkin?.pixels?.length > 16 ? 24 : 16}`} className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" shapeRendering="crispEdges">
                                {(gameState.selectedSkin?.pixels || []).map((row: number[], y: number) =>
                                    row.map((val: number, x: number) => {
                                        if (val === 0) return null;
                                        let color = gameState.selectedSkin?.color || '#f97316';
                                        if (val === 1) color = '#0f172a';
                                        else if (val === 3) color = '#ffffff';
                                        else if (val === 4) color = '#ffffff';
                                        else if (val === 5) color = '#000000';
                                        else if (val === 6) color = '#facc15';
                                        return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
                                    })
                                )}
                            </svg>
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded border border-slate-700">
                            <span className="text-[8px] font-bold text-cyan-400 uppercase whitespace-nowrap">{gameState.selectedSkin?.name || 'AGENT'}</span>
                        </div>
                    </div>

                    {/* LORE DISPLAY */}
                    <div className="w-full px-2 mb-2 text-center">
                        <p className="text-[10px] text-slate-400 italic leading-tight">
                            "{t[lang].lore[gameState.selectedSkin?.id] || t[lang].lore.ai_generated}"
                        </p>
                    </div>

                    {/* Character List - Horizontal Scroll */}
                    <div className="w-full mt-1">
                        <div className="flex justify-between items-center mb-1 px-1">
                            <h4 className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{t[lang].skin}</h4>
                            <button onClick={() => setShowCharacterPreview(true)} className="text-[8px] text-cyan-500 font-bold hover:text-cyan-400">{t[lang].viewAll}</button>
                        </div>
                        
                        <div className="flex gap-2 w-full overflow-x-auto custom-scrollbar pb-2 px-1 snap-x">
                            {/* AI Button */}
                            <button
                                onClick={() => setShowAiInput(true)}
                                className="flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 rounded-lg border border-purple-500/30 bg-purple-900/20 hover:bg-purple-900/40 relative overflow-hidden"
                            >
                                <span className="text-[8px] font-bold text-purple-400">+AI</span>
                            </button>

                            {safeSkins.map((skin: any, i: number) => {
                                const isSelected = gameState.selectedSkin.id === skin.id;
                                const isLocked = isCharacterLocked(skin.id);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            if (isLocked) handleLockedCharacterClick(skin.id);
                                            else setGameState((prev: any) => ({ ...prev, selectedSkin: skin }));
                                        }}
                                        className={`flex-shrink-0 w-10 h-10 p-1 rounded-lg border transition-all relative snap-center ${
                                            isLocked ? 'border-red-900/30 bg-red-950/20' : 
                                            isSelected ? 'border-cyan-400 bg-cyan-900/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 
                                            'border-slate-700 bg-slate-900/60 opacity-60'
                                        }`}
                                    >
                                        <svg viewBox={`0 0 ${skin.pixels?.length > 16 ? 24 : 16} ${skin.pixels?.length > 16 ? 24 : 16}`} className={`w-full h-full ${isLocked ? 'grayscale opacity-40' : ''}`} shapeRendering="crispEdges">
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
                                        {isLocked && <div className="absolute inset-0 flex items-center justify-center"><Lock size={10} className="text-red-500" /></div>}
                                    </button>
                                );
                            })}
                        </div>
                        
                        {/* TUTORIAL BUTTON */}
                        <button 
                            onClick={onOpenControls}
                            className="w-full mt-2 py-1.5 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                            <HelpCircle size={10} /> {t[lang].tutorial}
                        </button>
                    </div>
                </div>

                {/* BOTTOM ACTIONS - Fixed at bottom */}
                <div className="w-full flex flex-col gap-2 shrink-0 mt-auto relative z-10">
                    {/* START BUTTON - Big & Prominent */}
                    <button 
                        onClick={handleStart}
                        className={`w-full py-4 rounded-xl text-xl font-black tracking-tighter transition-all flex items-center justify-center gap-3 shadow-lg group relative overflow-hidden ${weedMode ? 'bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-500 hover:to-lime-500 shadow-green-900/50' : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-900/50'}`}
                    >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <Play size={24} className="fill-current animate-pulse" />
                        <span>{t[lang].start}</span>
                    </button>

                    {/* SECONDARY ACTIONS GRID - 4 Columns */}
                    <div className="grid grid-cols-4 gap-2">
                        {/* RANKING */}
                        <button 
                            onClick={() => setShowRanking(true)} 
                            className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${weedMode ? 'bg-green-900/40 border-green-700 hover:bg-green-800/50' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-700'}`}
                        >
                            <Trophy size={16} className="text-yellow-400" />
                            <span className="text-[8px] font-bold text-slate-300 uppercase">{t[lang].rank}</span>
                        </button>

                        {/* SHOP */}
                        <button 
                            onClick={() => setGameState((prev: any) => ({ ...prev, isShopOpen: true }))}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1 transition-all"
                        >
                            <ShoppingCart size={16} className="text-yellow-400" />
                            <span className="text-[8px] font-bold text-slate-300 uppercase">{t[lang].shopLabel}</span>
                        </button>

                        {/* CONTROLS */}
                        <button 
                            onClick={onOpenControls}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1 transition-all"
                        >
                            <Gamepad2 size={16} className="text-cyan-400" />
                            <span className="text-[8px] font-bold text-slate-300 uppercase">{t[lang].controlsShort}</span>
                        </button>

                        {/* SETTINGS */}
                        <button 
                            onClick={onOpenSettings}
                            className="p-2 bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1 transition-all"
                        >
                            <Settings size={16} className="text-slate-400" />
                            <span className="text-[8px] font-bold text-slate-300 uppercase">{t[lang].settingsShort}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer - Hidden on small screens to save space, visible on large */}
            <div className="hidden md:block p-2 border-t border-slate-800 bg-slate-900/50 text-center w-full">
                <p className="text-slate-600 text-[10px]">
                    {activeTab === 'local' ? `Seus melhores scores neste dispositivo` : globalStatus || t[lang].loading}
                </p>
            </div>
            
            {/* Admin Panel */}
            {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
            
            {/* RANKING MODAL */}
            {showRanking && (
                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                            <h3 className="font-black text-xl italic flex items-center gap-2">
                                <Trophy className="text-yellow-400" size={20} />
                                LEADERBOARD
                            </h3>
                            <button onClick={() => setShowRanking(false)} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        
                        <div className="flex border-b border-slate-800">
                            <button 
                                onClick={() => setActiveTab('local')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'local' ? 'bg-slate-800 text-white border-b-2 border-cyan-500' : 'text-slate-500 hover:bg-slate-800/50'}`}
                            >
                                {t[lang].local}
                            </button>
                            <button 
                                onClick={() => setActiveTab('global')}
                                className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'global' ? 'bg-slate-800 text-white border-b-2 border-cyan-500' : 'text-slate-500 hover:bg-slate-800/50'}`}
                            >
                                {t[lang].global}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {activeTab === 'local' ? (
                                <div className="text-center py-8 text-slate-500">
                                    <p className="text-sm">{t[lang].highScoreLabel} <span className="text-white font-bold">{Math.floor(Persistence.loadHighScore())}m</span></p>
                                    <p className="text-xs mt-2">{t[lang].maxAltitudeLabel} {Math.floor(Persistence.loadMaxAltitude())}m</p>
                                </div>
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    <Globe className="mx-auto mb-2 opacity-20" size={48} />
                                    <p>{t[lang].globalComingSoon}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Character Preview Modal */}
            {showCharacterPreview && (
                <CharacterPreviewModal 
                    skin={gameState.selectedSkin} 
                    onClose={() => setShowCharacterPreview(false)} 
                    onSelectSkin={(skin: CharacterSkin) => setGameState((prev: any) => ({ ...prev, selectedSkin: skin }))}
                    allSkins={safeSkins}
                    unlockedSkins={unlockedCharacters}
                />
            )}
        </div>
    );
};
