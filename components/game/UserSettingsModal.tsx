import React, { useState } from 'react';
import { 
    X, Settings, Volume2, Gamepad2, Key, Smartphone, Monitor, 
    ChevronRight, Check, ExternalLink, Eye, EyeOff, Move, 
    RefreshCw, Lock, Unlock, Sliders, Edit3
} from 'lucide-react';
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
}

type Tab = 'MAIN' | 'INTERFACE' | 'AUDIO' | 'CONTROLS' | 'API_KEY' | 'DEV_LOGIN';

const DEV_PASSWORD = 'infinitiv2025';

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
    onClose, gameState, setGameState, config, setConfig, onOpenDevConsole, onOpenVisualEditor
}) => {
    const [tab, setTab] = useState<Tab>('MAIN');
    const [localConfig, setLocalConfig] = useState<GameConfig>({ ...config });
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
    const [showApiKey, setShowApiKey] = useState(false);
    const [devPassword, setDevPassword] = useState('');
    const [devUnlocked, setDevUnlocked] = useState(false);
    const [uiScale, setUiScale] = useState(() => parseFloat(localStorage.getItem('UI_SCALE') || '1'));

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
                                <div className="grid grid-cols-3 gap-2">
                                    {['BUTTONS', 'JOYSTICK', 'TILT'].map((mode) => (
                                        <button key={mode}
                                            onClick={() => setGameState((p: any) => ({ ...p, mobileControlMode: mode }))}
                                            className={`p-3 rounded-lg border flex flex-col items-center gap-1 text-xs transition-all ${
                                                gameState?.mobileControlMode === mode 
                                                    ? 'bg-green-900/50 border-green-500 text-green-400' 
                                                    : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                            {mode === 'BUTTONS' && <Gamepad2 size={18} />}
                                            {mode === 'JOYSTICK' && <Move size={18} />}
                                            {mode === 'TILT' && <Smartphone size={18} />}
                                            {mode === 'TILT' ? 'MOTION' : mode}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Sensitivity */}
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4">
                                <h3 className="text-green-400 font-bold text-xs uppercase flex items-center gap-2">
                                    <Sliders size={14} /> Sensibilidade
                                </h3>
                                <Slider label="Motion (Gyro)" value={localConfig.GYRO_SENSITIVITY || 35}
                                    onChange={(v: number) => updateConfig('GYRO_SENSITIVITY', v)}
                                    min={10} max={100} step={5} format={(v: number) => v.toFixed(0)} />
                                <Slider label="Mobile Multiplier" value={localConfig.MOBILE_SENSITIVITY_MULTIPLIER || 2.5}
                                    onChange={(v: number) => updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', v)}
                                    min={0.5} max={5} step={0.1} format={(v: number) => `${v.toFixed(1)}x`} />
                            </section>

                            {/* Toggles */}
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-3">
                                <Toggle label="Ocultar Indicador Motion" value={gameState?.hideMotionDebug}
                                    onChange={(v: boolean) => { setGameState((p: any) => ({ ...p, hideMotionDebug: v })); localStorage.setItem('HIDE_MOTION_DEBUG', v.toString()); }} />
                                <Toggle label="Inverter Motion (Esq↔Dir)" value={gameState?.invertMotion}
                                    onChange={(v: boolean) => { setGameState((p: any) => ({ ...p, invertMotion: v })); localStorage.setItem('INVERT_MOTION', v.toString()); }} />
                            </section>

                            {/* Presets */}
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => { updateConfig('GYRO_SENSITIVITY', 25); updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', 1.5); }}
                                    className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:border-slate-600">🐢 Lento</button>
                                <button onClick={() => { updateConfig('GYRO_SENSITIVITY', 40); updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', 2.5); }}
                                    className="p-2 bg-green-900/30 border border-green-700 rounded-lg text-xs text-green-400">⚡ Normal</button>
                                <button onClick={() => { updateConfig('GYRO_SENSITIVITY', 70); updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', 4); }}
                                    className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:border-slate-600">🚀 Rápido</button>
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
                                <div className="bg-green-900/20 border border-green-700/50 p-6 rounded-xl text-center">
                                    <Unlock size={40} className="text-green-400 mx-auto mb-4" />
                                    <h3 className="text-green-400 font-bold text-lg mb-2">DEV Desbloqueado!</h3>
                                    <button onClick={() => { onClose(); onOpenDevConsole?.(); }}
                                        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl">
                                        Abrir Console DEV
                                    </button>
                                </div>
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
