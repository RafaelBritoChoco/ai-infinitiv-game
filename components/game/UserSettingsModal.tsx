import React, { useState } from 'react';
import { 
    X, Settings, Volume2, Gamepad2, Key, Smartphone, Monitor, 
    ChevronRight, Check, ExternalLink, Eye, EyeOff, Move, 
    RefreshCw, Lock, Unlock, Sliders, Edit3, Zap, Sparkles, Cpu, Trash2, Loader2, Trophy
} from 'lucide-react';

export type GraphicsQuality = 'LOW' | 'MEDIUM' | 'HIGH';

export const GRAPHICS_PRESETS: Record<GraphicsQuality, {
    label: string;
    desc: string;
    particles: boolean;
    shadows: boolean;
    blur: boolean;
    animations: boolean;
    glowEffects: boolean;
    bgParallax: boolean;
}> = {
    LOW: {
        label: 'Economia',
        desc: 'Celular fraco / bateria',
        particles: false,
        shadows: false,
        blur: false,
        animations: false,
        glowEffects: false,
        bgParallax: false,
    },
    MEDIUM: {
        label: 'Balanceado',
        desc: 'Performance e visual',
        particles: true,
        shadows: false,
        blur: false,
        animations: true,
        glowEffects: true,
        bgParallax: true,
    },
    HIGH: {
        label: 'Máximo',
        desc: 'Todos os efeitos',
        particles: true,
        shadows: true,
        blur: true,
        animations: true,
        glowEffects: true,
        bgParallax: true,
    }
};

export const getGraphicsConfig = (): GraphicsQuality => {
    return (localStorage.getItem('GRAPHICS_QUALITY') as GraphicsQuality) || 'MEDIUM';
};

export const setGraphicsConfig = (quality: GraphicsQuality) => {
    localStorage.setItem('GRAPHICS_QUALITY', quality);
};
import { GameConfig } from '../../types';
import * as Constants from '../../constants';
import { soundManager } from './audioManager';

interface UserSettingsModalProps {
    onClose: () => void;
    gameState: any;
    setGameState: (state: any) => void;
    config: GameConfig;
    setConfig: (config: GameConfig) => void;
    onOpenDevConsole?: () => void;
    onOpenVisualEditor?: () => void;
    onLeaderboardReset?: () => void;
}

type Tab = 'MAIN' | 'INTERFACE' | 'AUDIO' | 'CONTROLS' | 'API_KEY' | 'DEV_LOGIN';

const DEV_PASSWORD = 'chocopro';

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
    onClose, gameState, setGameState, config, setConfig, onOpenDevConsole, onOpenVisualEditor, onLeaderboardReset
}) => {
    const [tab, setTab] = useState<Tab>('MAIN');
    const [localConfig, setLocalConfig] = useState<GameConfig>({ ...config });
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
    const [showApiKey, setShowApiKey] = useState(false);
    const [devPassword, setDevPassword] = useState('');
    const [devUnlocked, setDevUnlocked] = useState(false);
    const [isResettingRank, setIsResettingRank] = useState(false);
    const [resetRankResult, setResetRankResult] = useState<string | null>(null);
    const [uiScale, setUiScale] = useState(() => parseFloat(localStorage.getItem('UI_SCALE') || '1'));
    const [graphicsQuality, setGraphicsQualityState] = useState<GraphicsQuality>(() => getGraphicsConfig());

    const handleGraphicsChange = (quality: GraphicsQuality) => {
        setGraphicsQualityState(quality);
        setGraphicsConfig(quality);
        soundManager.playClick();
    };

    const updateConfig = (key: keyof GameConfig, value: any) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig);
        setConfig(newConfig);
    };

    const handleDevLogin = () => {
        if (devPassword === DEV_PASSWORD) {
            setDevUnlocked(true);
            soundManager.playPerfectJump();
        } else {
            setDevPassword('');
        }
    };
    
    const handleResetGlobalRanking = async () => {
        if (!window.confirm('⚠️ TEM CERTEZA que quer ZERAR o ranking GLOBAL? Esta ação não pode ser desfeita!')) return;
        
        setIsResettingRank(true);
        setResetRankResult(null);
        
        try {
            const response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'RESET_LEADERBOARD_2025' })
            });
            const data = await response.json();
            
            if (data.success) {
                setResetRankResult('✅ Ranking global ZERADO com sucesso!');
                onLeaderboardReset?.();
            } else {
                setResetRankResult(`❌ Erro: ${data.error || 'Falha ao resetar'}`);
            }
        } catch (err: any) {
            setResetRankResult(`❌ Erro de conexão: ${err.message}`);
        } finally {
            setIsResettingRank(false);
        }
    };

    // Reusable Slider
    const Slider = ({ label, value, onChange, min, max, step, format = (v: number) => v.toFixed(2) }: any) => (
        <div className="space-y-2">
            <div className="flex justify-between">
                <label className="text-slate-400 text-xs font-bold uppercase">{label}</label>
                <span className="text-cyan-400 font-mono text-xs">{format(value)}</span>
            </div>
            <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer" />
        </div>
    );

    // Menu Button
    const MenuBtn = ({ icon: Icon, label, desc, onClick, color = 'cyan' }: any) => (
        <button onClick={onClick}
            className={`w-full p-4 bg-slate-900/80 border border-slate-700 rounded-xl hover:border-${color}-500/50 hover:bg-slate-800/80 transition-all flex items-center gap-4`}>
            <div className={`p-3 bg-${color}-900/30 rounded-lg`}><Icon size={22} className={`text-${color}-400`} /></div>
            <div className="flex-1 text-left">
                <h3 className="text-white font-bold text-sm">{label}</h3>
                <p className="text-slate-500 text-xs">{desc}</p>
            </div>
            <ChevronRight size={18} className="text-slate-600" />
        </button>
    );

    // Toggle Button
    const Toggle = ({ label, value, onChange, desc }: any) => (
        <button onClick={() => onChange(!value)}
            className={`w-full p-3 rounded-lg border flex items-center justify-between transition-all ${
                value ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
            <span className="text-sm font-bold">{label}</span>
            <span className="text-xs opacity-70">{value ? 'ON' : 'OFF'}</span>
        </button>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* HEADER */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        {tab !== 'MAIN' && (
                            <button onClick={() => setTab('MAIN')} className="p-2 hover:bg-slate-800 rounded-lg">
                                <ChevronRight size={20} className="text-slate-400 rotate-180" />
                            </button>
                        )}
                        <h2 className="text-lg font-black text-white flex items-center gap-2">
                            <Settings size={20} className="text-cyan-400" />
                            {tab === 'MAIN' && 'Configurações'}
                            {tab === 'INTERFACE' && 'Interface'}
                            {tab === 'AUDIO' && 'Áudio'}
                            {tab === 'CONTROLS' && 'Controles'}
                            {tab === 'API_KEY' && 'API Key'}
                            {tab === 'DEV_LOGIN' && 'Modo DEV'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400">
                        <X size={22} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    
                    {/* MAIN MENU */}
                    {tab === 'MAIN' && (<>
                        <MenuBtn icon={Monitor} label="Interface" desc="Escala, tamanho dos botões" onClick={() => setTab('INTERFACE')} color="purple" />
                        <MenuBtn icon={Volume2} label="Áudio" desc="Volume geral, música, efeitos" onClick={() => setTab('AUDIO')} color="blue" />
                        <MenuBtn icon={Gamepad2} label="Controles" desc="Sensibilidade, inverter motion" onClick={() => setTab('CONTROLS')} color="green" />
                        <MenuBtn icon={Key} label="API Key (Gemini)" desc="Para gerar skins com IA" onClick={() => setTab('API_KEY')} color="yellow" />
                        <div className="border-t border-slate-800 pt-3 mt-4">
                            <MenuBtn icon={devUnlocked ? Unlock : Lock} label="Modo Desenvolvedor" 
                                desc={devUnlocked ? "Acessar console DEV" : "Requer senha"} 
                                onClick={() => devUnlocked && onOpenDevConsole ? (onClose(), onOpenDevConsole()) : setTab('DEV_LOGIN')} color="red" />
                        </div>
                    </>)}

                    {/* INTERFACE */}
                    {tab === 'INTERFACE' && (
                        <div className="space-y-4">
                            {/* GRAPHICS QUALITY */}
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <h3 className="text-purple-400 font-bold text-xs uppercase mb-3 flex items-center gap-2">
                                    <Cpu size={14} /> Qualidade Gráfica
                                </h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {(['LOW', 'MEDIUM', 'HIGH'] as GraphicsQuality[]).map((quality) => {
                                        const preset = GRAPHICS_PRESETS[quality];
                                        const isActive = graphicsQuality === quality;
                                        const colors = {
                                            LOW: { bg: 'green', icon: Zap },
                                            MEDIUM: { bg: 'yellow', icon: Sparkles },
                                            HIGH: { bg: 'purple', icon: Cpu }
                                        };
                                        const { bg, icon: Icon } = colors[quality];
                                        return (
                                            <button
                                                key={quality}
                                                onClick={() => handleGraphicsChange(quality)}
                                                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                                                    isActive
                                                        ? `bg-${bg}-900/50 border-${bg}-500 text-${bg}-400 shadow-lg shadow-${bg}-500/20`
                                                        : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                                                }`}
                                            >
                                                <Icon size={20} className={isActive ? `text-${bg}-400` : ''} />
                                                <span className="font-bold text-xs">{preset.label}</span>
                                                <span className="text-[9px] opacity-70">{preset.desc}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="mt-3 p-2 bg-slate-950 rounded-lg">
                                    <p className="text-[10px] text-slate-500 text-center">
                                        {graphicsQuality === 'LOW' && 'Maxima performance, sem efeitos visuais'}
                                        {graphicsQuality === 'MEDIUM' && 'Efeitos basicos com boa performance'}
                                        {graphicsQuality === 'HIGH' && 'Todos os efeitos: particulas, sombras, blur'}
                                    </p>
                                </div>
                            </section>

                            {/* Visual Control Editor Button */}
                            <button 
                                onClick={() => { onClose(); onOpenVisualEditor?.(); }}
                                className="w-full p-4 bg-gradient-to-r from-purple-900/80 to-cyan-900/80 border border-purple-500/50 rounded-xl hover:border-cyan-400 transition-all flex items-center gap-4 group"
                            >
                                <div className="p-3 bg-purple-600/30 rounded-lg group-hover:bg-purple-500/50 transition-colors">
                                    <Edit3 size={24} className="text-purple-300" />
                                </div>
                                <div className="flex-1 text-left">
                                    <h3 className="text-white font-bold text-sm">Editor Visual de Controles</h3>
                                    <p className="text-slate-400 text-xs">Arraste e redimensione cada botão</p>
                                </div>
                                <ChevronRight size={18} className="text-slate-600 group-hover:text-cyan-400" />
                            </button>

                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <Slider label="Escala Geral UI" value={uiScale} onChange={setUiScale}
                                    min={0.7} max={1.5} step={0.05} format={(v: number) => `${Math.round(v * 100)}%`} />
                            </section>
                            <button onClick={() => {
                                localStorage.setItem('UI_SCALE', uiScale.toString());
                                setGameState((p: any) => ({ ...p, uiLayout: { ...p.uiLayout, scale: uiScale } }));
                            }} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                <Check size={18} /> Salvar Escala
                            </button>
                        </div>
                    )}

                    {/* AUDIO */}
                    {tab === 'AUDIO' && (
                        <div className="space-y-4">
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4">
                                <Slider label="Volume Geral" value={localConfig.VOLUME_MASTER || 0.5}
                                    onChange={(v: number) => { updateConfig('VOLUME_MASTER', v); soundManager.setVolumes(v, localConfig.VOLUME_MUSIC || 0.4, localConfig.VOLUME_SFX || 0.6); }}
                                    min={0} max={1} step={0.05} format={(v: number) => `${Math.round(v * 100)}%`} />
                                <Slider label="Música" value={localConfig.VOLUME_MUSIC || 0.4}
                                    onChange={(v: number) => { updateConfig('VOLUME_MUSIC', v); soundManager.setVolumes(localConfig.VOLUME_MASTER || 0.5, v, localConfig.VOLUME_SFX || 0.6); }}
                                    min={0} max={1} step={0.05} format={(v: number) => `${Math.round(v * 100)}%`} />
                                <Slider label="Efeitos" value={localConfig.VOLUME_SFX || 0.6}
                                    onChange={(v: number) => { updateConfig('VOLUME_SFX', v); soundManager.setVolumes(localConfig.VOLUME_MASTER || 0.5, localConfig.VOLUME_MUSIC || 0.4, v); }}
                                    min={0} max={1} step={0.05} format={(v: number) => `${Math.round(v * 100)}%`} />
                            </section>
                            <button onClick={() => soundManager.playClick()}
                                className="w-full py-3 bg-blue-900/50 border border-blue-700 text-blue-300 font-bold rounded-xl hover:bg-blue-800/50">
                                🔊 Testar Som
                            </button>
                        </div>
                    )}

                    {/* CONTROLS */}
                    {tab === 'CONTROLS' && (
                        <div className="space-y-4">
                            {/* Control Mode */}
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <h3 className="text-green-400 font-bold text-xs uppercase mb-3">Modo de Controle</h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {['BUTTONS', 'ARROWS', 'JOYSTICK', 'TILT'].map((mode) => (
                                        <button key={mode}
                                            onClick={() => setGameState((p: any) => ({ ...p, mobileControlMode: mode }))}
                                            className={`p-3 rounded-lg border flex flex-col items-center gap-1 text-[10px] transition-all ${
                                                gameState?.mobileControlMode === mode 
                                                    ? 'bg-green-900/50 border-green-500 text-green-400' 
                                                    : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                            {mode === 'BUTTONS' && <Gamepad2 size={16} />}
                                            {mode === 'ARROWS' && <ChevronRight size={16} className="rotate-180" />}
                                            {mode === 'JOYSTICK' && <Move size={16} />}
                                            {mode === 'TILT' && <Smartphone size={16} />}
                                            {mode === 'TILT' ? 'MOTION' : mode}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2">
                                    {gameState?.mobileControlMode === 'BUTTONS' && '🎮 Setas + Pulo + Jetpack separados'}
                                    {gameState?.mobileControlMode === 'ARROWS' && '⬅️➡️ Apenas setas! Toque=Pular, Ambos=Jetpack'}
                                    {gameState?.mobileControlMode === 'JOYSTICK' && '🕹️ Joystick virtual + Pulo + Jetpack'}
                                    {gameState?.mobileControlMode === 'TILT' && '📱 Incline o celular para mover'}
                                </p>
                            </section>

                            {/* Sensitivity - DYNAMIC based on mode */}
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4">
                                <h3 className="text-green-400 font-bold text-xs uppercase flex items-center gap-2">
                                    <Sliders size={14} /> Sensibilidade - {gameState?.mobileControlMode || 'BUTTONS'}
                                </h3>
                                
                                {/* MOTION/TILT mode settings */}
                                {gameState?.mobileControlMode === 'TILT' && (
                                    <>
                                        <Slider label="Motion (Gyro)" value={localConfig.GYRO_SENSITIVITY || 35}
                                            onChange={(v: number) => updateConfig('GYRO_SENSITIVITY', v)}
                                            min={10} max={100} step={5} format={(v: number) => v.toFixed(0)} />
                                        <Slider label="Mobile Multiplier" value={localConfig.MOBILE_SENSITIVITY_MULTIPLIER || 2.5}
                                            onChange={(v: number) => updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', v)}
                                            min={0.5} max={5} step={0.1} format={(v: number) => `${v.toFixed(1)}x`} />
                                    </>
                                )}
                                
                                {/* JOYSTICK mode settings */}
                                {gameState?.mobileControlMode === 'JOYSTICK' && (
                                    <>
                                        <Slider label="Joystick Sensibilidade" value={localConfig.JOYSTICK_SENSITIVITY || 1.0}
                                            onChange={(v: number) => updateConfig('JOYSTICK_SENSITIVITY', v)}
                                            min={0.3} max={2.0} step={0.1} format={(v: number) => `${v.toFixed(1)}x`} />
                                        <Slider label="Zona Morta" value={localConfig.JOYSTICK_DEADZONE || 0.15}
                                            onChange={(v: number) => updateConfig('JOYSTICK_DEADZONE', v)}
                                            min={0.05} max={0.4} step={0.05} format={(v: number) => `${Math.round(v * 100)}%`} />
                                    </>
                                )}
                                
                                {/* BUTTONS mode settings */}
                                {gameState?.mobileControlMode === 'BUTTONS' && (
                                    <>
                                        <Slider label="Velocidade Movimento" value={localConfig.BUTTON_MOVE_SPEED || 1.0}
                                            onChange={(v: number) => updateConfig('BUTTON_MOVE_SPEED', v)}
                                            min={0.5} max={2.0} step={0.1} format={(v: number) => `${v.toFixed(1)}x`} />
                                        <Slider label="Tamanho Botões" value={localConfig.BUTTON_SIZE_SCALE || 1.0}
                                            onChange={(v: number) => updateConfig('BUTTON_SIZE_SCALE', v)}
                                            min={0.7} max={1.5} step={0.1} format={(v: number) => `${Math.round(v * 100)}%`} />
                                    </>
                                )}
                                
                                {/* ARROWS mode settings */}
                                {gameState?.mobileControlMode === 'ARROWS' && (
                                    <>
                                        <Slider label="Velocidade Movimento" value={localConfig.ARROW_MOVE_SPEED || 1.0}
                                            onChange={(v: number) => updateConfig('ARROW_MOVE_SPEED', v)}
                                            min={0.5} max={2.0} step={0.1} format={(v: number) => `${v.toFixed(1)}x`} />
                                        <Slider label="Tamanho Setas" value={localConfig.ARROW_SIZE_SCALE || 1.0}
                                            onChange={(v: number) => updateConfig('ARROW_SIZE_SCALE', v)}
                                            min={0.7} max={1.5} step={0.1} format={(v: number) => `${Math.round(v * 100)}%`} />
                                        <Slider label="Tempo para Jetpack" value={localConfig.ARROW_JETPACK_DELAY || 200}
                                            onChange={(v: number) => updateConfig('ARROW_JETPACK_DELAY', v)}
                                            min={100} max={500} step={50} format={(v: number) => `${v.toFixed(0)}ms`} />
                                    </>
                                )}
                            </section>

                            {/* Toggles - Only for TILT/MOTION */}
                            {gameState?.mobileControlMode === 'TILT' && (
                                <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                                    <Toggle label="Ocultar Indicador Motion" value={gameState?.hideMotionDebug}
                                        onChange={(v: boolean) => { setGameState((p: any) => ({ ...p, hideMotionDebug: v })); localStorage.setItem('HIDE_MOTION_DEBUG', v.toString()); }} />
                                    <Toggle label="Inverter Motion (Esq↔Dir)" value={gameState?.invertMotion}
                                        onChange={(v: boolean) => { setGameState((p: any) => ({ ...p, invertMotion: v })); localStorage.setItem('INVERT_MOTION', v.toString()); }} />
                                </section>
                            )}

                            {/* Presets - Dynamic based on mode */}
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => { 
                                    if (gameState?.mobileControlMode === 'TILT') {
                                        updateConfig('GYRO_SENSITIVITY', 25); 
                                        updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', 1.5);
                                    } else if (gameState?.mobileControlMode === 'JOYSTICK') {
                                        updateConfig('JOYSTICK_SENSITIVITY', 0.6);
                                        updateConfig('JOYSTICK_DEADZONE', 0.2);
                                    } else {
                                        updateConfig('BUTTON_MOVE_SPEED', 0.7);
                                        updateConfig('ARROW_MOVE_SPEED', 0.7);
                                    }
                                }}
                                    className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:border-slate-600">LENTO</button>
                                <button onClick={() => { 
                                    if (gameState?.mobileControlMode === 'TILT') {
                                        updateConfig('GYRO_SENSITIVITY', 40); 
                                        updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', 2.5);
                                    } else if (gameState?.mobileControlMode === 'JOYSTICK') {
                                        updateConfig('JOYSTICK_SENSITIVITY', 1.0);
                                        updateConfig('JOYSTICK_DEADZONE', 0.15);
                                    } else {
                                        updateConfig('BUTTON_MOVE_SPEED', 1.0);
                                        updateConfig('ARROW_MOVE_SPEED', 1.0);
                                    }
                                }}
                                    className="p-2 bg-green-900/30 border border-green-700 rounded-lg text-xs text-green-400">NORMAL</button>
                                <button onClick={() => { 
                                    if (gameState?.mobileControlMode === 'TILT') {
                                        updateConfig('GYRO_SENSITIVITY', 70); 
                                        updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', 4);
                                    } else if (gameState?.mobileControlMode === 'JOYSTICK') {
                                        updateConfig('JOYSTICK_SENSITIVITY', 1.5);
                                        updateConfig('JOYSTICK_DEADZONE', 0.1);
                                    } else {
                                        updateConfig('BUTTON_MOVE_SPEED', 1.5);
                                        updateConfig('ARROW_MOVE_SPEED', 1.5);
                                    }
                                }}
                                    className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:border-slate-600">RAPIDO</button>
                            </div>
                        </div>
                    )}

                    {/* API KEY */}
                    {tab === 'API_KEY' && (
                        <div className="space-y-4">
                            <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl">
                                <h3 className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
                                    <Key size={16} /> Google AI Studio - Gemini API
                                </h3>
                                <p className="text-yellow-200/70 text-xs mb-3">
                                    Para gerar skins com IA, obtenha uma API Key gratuita.
                                </p>
                                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg text-sm">
                                    <ExternalLink size={16} /> Criar API Key
                                </a>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <label className="text-slate-400 text-xs font-bold uppercase mb-2 block">Sua API Key</label>
                                <div className="relative">
                                    <input type={showApiKey ? 'text' : 'password'} value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)} placeholder="Cole aqui..."
                                        className="w-full p-3 pr-12 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:border-cyan-500 outline-none" />
                                    <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => { localStorage.setItem('GEMINI_API_KEY', apiKey); alert('✅ API Key salva!'); }}
                                disabled={!apiKey.trim()}
                                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                                <Check size={18} /> Salvar API Key
                            </button>
                        </div>
                    )}

                    {/* DEV LOGIN */}
                    {tab === 'DEV_LOGIN' && (
                        <div className="space-y-4">
                            {devUnlocked ? (
                                <>
                                    <div className="bg-green-900/20 border border-green-700/50 p-4 rounded-xl text-center">
                                        <Unlock size={32} className="text-green-400 mx-auto mb-2" />
                                        <h3 className="text-green-400 font-bold text-lg mb-2">DEV Desbloqueado!</h3>
                                        <button onClick={() => { onClose(); onOpenDevConsole?.(); }}
                                            className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl">
                                            Abrir Console DEV
                                        </button>
                                    </div>
                                    
                                    {/* ADMIN TOOLS */}
                                    <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4">
                                        <h3 className="text-red-400 font-bold text-sm uppercase mb-3 flex items-center gap-2">
                                            <Trophy size={16} /> Administração do Ranking
                                        </h3>
                                        <p className="text-xs text-slate-500 mb-3">⚠️ Cuidado! Ações aqui afetam TODOS os jogadores.</p>
                                        <button
                                            onClick={handleResetGlobalRanking}
                                            disabled={isResettingRank}
                                            className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            {isResettingRank ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                                            {isResettingRank ? 'ZERANDO...' : 'ZERAR RANKING GLOBAL'}
                                        </button>
                                        {resetRankResult && (
                                            <div className={`mt-3 p-2 rounded-lg text-xs font-bold ${resetRankResult.includes('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                {resetRankResult}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-red-900/20 border border-red-700/50 p-6 rounded-xl text-center">
                                    <Lock size={40} className="text-red-400 mx-auto mb-4" />
                                    <h3 className="text-red-400 font-bold text-lg mb-2">Área Restrita</h3>
                                    <p className="text-red-200/70 text-sm mb-4">Digite a senha de desenvolvedor.</p>
                                    <input type="password" value={devPassword}
                                        onChange={(e) => setDevPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleDevLogin()}
                                        placeholder="Senha..."
                                        className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-center font-mono focus:border-red-500 outline-none mb-4" />
                                    <button onClick={handleDevLogin}
                                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">
                                        Desbloquear
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-2 border-t border-slate-800 bg-slate-900/50">
                    <p className="text-center text-slate-600 text-[10px]">{Constants.APP_VERSION}</p>
                </div>
            </div>
        </div>
    );
};
