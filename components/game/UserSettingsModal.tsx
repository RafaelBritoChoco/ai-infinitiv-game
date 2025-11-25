import React, { useState, useEffect } from 'react';
import { 
    X, Settings, Volume2, Gamepad2, Key, Smartphone, Monitor, 
    Sliders, ChevronRight, Check, ExternalLink, Eye, EyeOff,
    Maximize, Move, RotateCcw, Zap, Lock, Unlock, RefreshCw
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
}

type SettingsTab = 'MAIN' | 'INTERFACE' | 'AUDIO' | 'CONTROLS' | 'API_KEY' | 'DEV_LOGIN';

const DEV_PASSWORD = 'infinitiv2025';

export const UserSettingsModal: React.FC<UserSettingsModalProps> = ({
    onClose, gameState, setGameState, config, setConfig, onOpenDevConsole
}) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('MAIN');
    const [localConfig, setLocalConfig] = useState<GameConfig>({ ...config });
    const [apiKey, setApiKey] = useState(() => localStorage.getItem('GEMINI_API_KEY') || '');
    const [showApiKey, setShowApiKey] = useState(false);
    const [devPassword, setDevPassword] = useState('');
    const [devUnlocked, setDevUnlocked] = useState(false);
    const [uiScale, setUiScale] = useState(() => parseFloat(localStorage.getItem('UI_SCALE') || '1'));
    const [buttonSize, setButtonSize] = useState(() => parseFloat(localStorage.getItem('BUTTON_SIZE') || '1'));

    // Load saved settings
    useEffect(() => {
        const savedScale = localStorage.getItem('UI_SCALE');
        const savedButtonSize = localStorage.getItem('BUTTON_SIZE');
        if (savedScale) setUiScale(parseFloat(savedScale));
        if (savedButtonSize) setButtonSize(parseFloat(savedButtonSize));
    }, []);

    const updateConfig = (key: keyof GameConfig, value: any) => {
        const newConfig = { ...localConfig, [key]: value };
        setLocalConfig(newConfig);
        setConfig(newConfig);
    };

    const saveApiKey = () => {
        localStorage.setItem('GEMINI_API_KEY', apiKey);
        if (typeof window !== 'undefined' && (window as any).process?.env) {
            (window as any).process.env.API_KEY = apiKey;
        }
        alert('✅ API Key salva com sucesso!');
    };

    const saveUISettings = () => {
        localStorage.setItem('UI_SCALE', uiScale.toString());
        localStorage.setItem('BUTTON_SIZE', buttonSize.toString());
        setGameState((p: any) => ({
            ...p,
            uiLayout: { ...p.uiLayout, scale: uiScale, buttonScale: buttonSize }
        }));
    };

    const handleDevLogin = () => {
        if (devPassword === DEV_PASSWORD) {
            setDevUnlocked(true);
            soundManager.playPerfectJump();
        } else {
            alert('❌ Senha incorreta');
            setDevPassword('');
        }
    };

    const Slider = ({ label, value, onChange, min, max, step, format = (v: number) => v.toFixed(2), icon: Icon }: any) => (
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <label className="text-slate-300 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                    {Icon && <Icon size={14} className="text-cyan-400" />}
                    {label}
                </label>
                <span className="text-cyan-400 font-mono text-sm">{format(value)}</span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
        </div>
    );

    const MenuButton = ({ icon: Icon, label, description, onClick, color = 'cyan' }: any) => (
        <button
            onClick={onClick}
            className={`w-full p-4 bg-slate-900/80 border border-slate-700 rounded-xl hover:border-${color}-500/50 hover:bg-slate-800/80 transition-all flex items-center gap-4 group`}
        >
            <div className={`p-3 bg-${color}-900/30 rounded-lg group-hover:bg-${color}-900/50 transition-colors`}>
                <Icon size={24} className={`text-${color}-400`} />
            </div>
            <div className="flex-1 text-left">
                <h3 className="text-white font-bold text-sm">{label}</h3>
                <p className="text-slate-500 text-xs">{description}</p>
            </div>
            <ChevronRight size={20} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
        </button>
    );

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                
                {/* HEADER */}
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-3">
                        {activeTab !== 'MAIN' && (
                            <button
                                onClick={() => setActiveTab('MAIN')}
                                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                <ChevronRight size={20} className="text-slate-400 rotate-180" />
                            </button>
                        )}
                        <h2 className="text-xl font-black text-white flex items-center gap-2">
                            <Settings size={24} className="text-cyan-400" />
                            {activeTab === 'MAIN' && 'Configurações'}
                            {activeTab === 'INTERFACE' && 'Interface'}
                            {activeTab === 'AUDIO' && 'Áudio'}
                            {activeTab === 'CONTROLS' && 'Controles'}
                            {activeTab === 'API_KEY' && 'API Key'}
                            {activeTab === 'DEV_LOGIN' && 'Modo DEV'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    
                    {/* MAIN MENU */}
                    {activeTab === 'MAIN' && (
                        <div className="space-y-3">
                            <MenuButton
                                icon={Monitor}
                                label="Interface"
                                description="Tamanho dos botões, escala da UI"
                                onClick={() => setActiveTab('INTERFACE')}
                                color="purple"
                            />
                            <MenuButton
                                icon={Volume2}
                                label="Áudio"
                                description="Volume geral, música, efeitos"
                                onClick={() => setActiveTab('AUDIO')}
                                color="blue"
                            />
                            <MenuButton
                                icon={Gamepad2}
                                label="Controles"
                                description="Sensibilidade motion, joystick, botões"
                                onClick={() => setActiveTab('CONTROLS')}
                                color="green"
                            />
                            <MenuButton
                                icon={Key}
                                label="API Key (Gemini)"
                                description="Configurar chave para gerar skins IA"
                                onClick={() => setActiveTab('API_KEY')}
                                color="yellow"
                            />

                            <div className="border-t border-slate-800 pt-3 mt-6">
                                <MenuButton
                                    icon={devUnlocked ? Unlock : Lock}
                                    label="Modo Desenvolvedor"
                                    description={devUnlocked ? "Acessar console DEV" : "Requer senha"}
                                    onClick={() => {
                                        if (devUnlocked && onOpenDevConsole) {
                                            onClose();
                                            onOpenDevConsole();
                                        } else {
                                            setActiveTab('DEV_LOGIN');
                                        }
                                    }}
                                    color="red"
                                />
                            </div>
                        </div>
                    )}

                    {/* INTERFACE TAB */}
                    {activeTab === 'INTERFACE' && (
                        <div className="space-y-6">
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <h3 className="text-purple-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Maximize size={14} /> Escala da Interface
                                </h3>
                                <Slider
                                    label="Escala Geral"
                                    value={uiScale}
                                    onChange={setUiScale}
                                    min={0.7}
                                    max={1.5}
                                    step={0.05}
                                    format={(v: number) => `${Math.round(v * 100)}%`}
                                />
                            </section>

                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <h3 className="text-purple-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Move size={14} /> Botões de Controle
                                </h3>
                                <Slider
                                    label="Tamanho dos Botões"
                                    value={buttonSize}
                                    onChange={setButtonSize}
                                    min={0.6}
                                    max={1.4}
                                    step={0.05}
                                    format={(v: number) => `${Math.round(v * 100)}%`}
                                />
                                
                                {/* Preview dos botões */}
                                <div className="mt-4 p-4 bg-slate-950 rounded-lg border border-slate-700">
                                    <p className="text-slate-500 text-xs mb-3 text-center">Preview</p>
                                    <div className="flex justify-center gap-4" style={{ transform: `scale(${buttonSize})`, transformOrigin: 'center' }}>
                                        <div className="w-14 h-14 bg-slate-800 border-2 border-slate-600 rounded-full flex items-center justify-center">
                                            <ChevronRight size={24} className="text-slate-400 rotate-180" />
                                        </div>
                                        <div className="w-14 h-14 bg-cyan-900/50 border-2 border-cyan-500/50 rounded-full flex items-center justify-center">
                                            <span className="text-cyan-400 font-bold text-xs">JUMP</span>
                                        </div>
                                        <div className="w-14 h-14 bg-slate-800 border-2 border-slate-600 rounded-full flex items-center justify-center">
                                            <ChevronRight size={24} className="text-slate-400" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <button
                                onClick={saveUISettings}
                                className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={18} /> Salvar Interface
                            </button>
                        </div>
                    )}

                    {/* AUDIO TAB */}
                    {activeTab === 'AUDIO' && (
                        <div className="space-y-4">
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4">
                                <Slider
                                    icon={Volume2}
                                    label="Volume Geral"
                                    value={localConfig.VOLUME_MASTER || 0.5}
                                    onChange={(v: number) => {
                                        updateConfig('VOLUME_MASTER', v);
                                        soundManager.setMasterVolume(v);
                                    }}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    format={(v: number) => `${Math.round(v * 100)}%`}
                                />
                                <Slider
                                    label="Música"
                                    value={localConfig.VOLUME_MUSIC || 0.4}
                                    onChange={(v: number) => updateConfig('VOLUME_MUSIC', v)}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    format={(v: number) => `${Math.round(v * 100)}%`}
                                />
                                <Slider
                                    label="Efeitos Sonoros"
                                    value={localConfig.VOLUME_SFX || 0.6}
                                    onChange={(v: number) => updateConfig('VOLUME_SFX', v)}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    format={(v: number) => `${Math.round(v * 100)}%`}
                                />
                            </section>

                            <button
                                onClick={() => soundManager.playClick()}
                                className="w-full py-3 bg-blue-900/50 border border-blue-700 text-blue-300 font-bold rounded-xl hover:bg-blue-800/50 transition-colors"
                            >
                                🔊 Testar Som
                            </button>
                        </div>
                    )}

                    {/* CONTROLS TAB */}
                    {activeTab === 'CONTROLS' && (
                        <div className="space-y-4">
                            {/* Control Mode */}
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <h3 className="text-green-400 font-bold text-xs uppercase tracking-widest mb-3">Modo de Controle</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {['BUTTONS', 'JOYSTICK', 'TILT'].map((mode) => (
                                        <button
                                            key={mode}
                                            onClick={() => setGameState((p: any) => ({ ...p, mobileControlMode: mode }))}
                                            className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all text-xs ${
                                                gameState?.mobileControlMode === mode 
                                                    ? 'bg-green-900/50 border-green-500 text-green-400' 
                                                    : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600'
                                            }`}
                                        >
                                            {mode === 'BUTTONS' && <Gamepad2 size={20} />}
                                            {mode === 'JOYSTICK' && <Move size={20} />}
                                            {mode === 'TILT' && <Smartphone size={20} />}
                                            {mode === 'TILT' ? 'MOTION' : mode}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Sensitivity Settings */}
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800 space-y-4">
                                <h3 className="text-green-400 font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
                                    <Sliders size={14} /> Sensibilidade
                                </h3>
                                
                                <Slider
                                    icon={Smartphone}
                                    label="Sensibilidade Motion (Gyro)"
                                    value={localConfig.GYRO_SENSITIVITY || 35}
                                    onChange={(v: number) => updateConfig('GYRO_SENSITIVITY', v)}
                                    min={10}
                                    max={100}
                                    step={5}
                                    format={(v: number) => v.toFixed(0)}
                                />
                                
                                <Slider
                                    icon={Move}
                                    label="Multiplicador Mobile"
                                    value={localConfig.MOBILE_SENSITIVITY_MULTIPLIER || 2.5}
                                    onChange={(v: number) => updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', v)}
                                    min={0.5}
                                    max={5}
                                    step={0.1}
                                    format={(v: number) => `${v.toFixed(1)}x`}
                                />
                                
                                <Slider
                                    icon={Gamepad2}
                                    label="Deadzone (Zona Morta)"
                                    value={localConfig.GAMEPAD_DEADZONE || 0.1}
                                    onChange={(v: number) => updateConfig('GAMEPAD_DEADZONE', v)}
                                    min={0}
                                    max={0.4}
                                    step={0.02}
                                    format={(v: number) => `${Math.round(v * 100)}%`}
                                />
                            </section>

                            {/* Motion Visual Debug Toggle */}
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <h3 className="text-green-400 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <Eye size={14} /> Visuais do Motion
                                </h3>
                                <button
                                    onClick={() => {
                                        const newValue = !gameState?.hideMotionDebug;
                                        setGameState((p: any) => ({ ...p, hideMotionDebug: newValue }));
                                        localStorage.setItem('HIDE_MOTION_DEBUG', newValue.toString());
                                    }}
                                    className={`w-full p-3 rounded-lg border flex items-center justify-between transition-all ${
                                        gameState?.hideMotionDebug 
                                            ? 'bg-slate-800 border-slate-700 text-slate-400' 
                                            : 'bg-green-900/30 border-green-700 text-green-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {gameState?.hideMotionDebug ? <EyeOff size={18} /> : <Eye size={18} />}
                                        <span className="text-sm font-bold">
                                            {gameState?.hideMotionDebug ? 'Indicador Oculto' : 'Indicador Visível'}
                                        </span>
                                    </div>
                                    <span className="text-xs opacity-70">
                                        {gameState?.hideMotionDebug ? 'Barra de nível escondida' : 'Mostrando barra de nível'}
                                    </span>
                                </button>
                                <p className="text-slate-500 text-xs mt-2">
                                    Oculta a barra de nível e valor RAW durante o jogo no modo Motion.
                                </p>
                            </section>

                            {/* Motion Invert Toggle */}
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <h3 className="text-green-400 font-bold text-xs uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <RefreshCw size={14} /> Inverter Controles
                                </h3>
                                <button
                                    onClick={() => {
                                        const newValue = !gameState?.invertMotion;
                                        setGameState((p: any) => ({ ...p, invertMotion: newValue }));
                                        localStorage.setItem('INVERT_MOTION', newValue.toString());
                                    }}
                                    className={`w-full p-3 rounded-lg border flex items-center justify-between transition-all ${
                                        gameState?.invertMotion 
                                            ? 'bg-orange-900/30 border-orange-700 text-orange-400' 
                                            : 'bg-slate-800 border-slate-700 text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <RefreshCw size={18} className={gameState?.invertMotion ? 'animate-spin' : ''} />
                                        <span className="text-sm font-bold">
                                            {gameState?.invertMotion ? 'Invertido' : 'Normal'}
                                        </span>
                                    </div>
                                    <span className="text-xs opacity-70">
                                        {gameState?.invertMotion ? 'Esquerda ↔ Direita trocados' : 'Controles padrão'}
                                    </span>
                                </button>
                                <p className="text-slate-500 text-xs mt-2">
                                    Use se girar a tela e os controles ficarem invertidos.
                                </p>
                            </section>

                            {/* Quick Presets */}
                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <h3 className="text-green-400 font-bold text-xs uppercase tracking-widest mb-3">Presets Rápidos</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => {
                                            updateConfig('GYRO_SENSITIVITY', 25);
                                            updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', 1.5);
                                        }}
                                        className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:border-slate-600 transition-colors"
                                    >
                                        🐢 Lento
                                    </button>
                                    <button
                                        onClick={() => {
                                            updateConfig('GYRO_SENSITIVITY', 40);
                                            updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', 2.5);
                                        }}
                                        className="p-2 bg-green-900/30 border border-green-700 rounded-lg text-xs text-green-400"
                                    >
                                        ⚡ Normal
                                    </button>
                                    <button
                                        onClick={() => {
                                            updateConfig('GYRO_SENSITIVITY', 70);
                                            updateConfig('MOBILE_SENSITIVITY_MULTIPLIER', 4);
                                        }}
                                        className="p-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-400 hover:border-slate-600 transition-colors"
                                    >
                                        🚀 Rápido
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* API KEY TAB */}
                    {activeTab === 'API_KEY' && (
                        <div className="space-y-4">
                            <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-xl">
                                <h3 className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
                                    <Key size={16} /> Google AI Studio - Gemini API
                                </h3>
                                <p className="text-yellow-200/70 text-xs mb-3">
                                    Para gerar skins com IA, você precisa de uma API Key gratuita do Google AI Studio.
                                </p>
                                <a
                                    href="https://aistudio.google.com/apikey"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-colors text-sm"
                                >
                                    <ExternalLink size={16} /> Criar API Key Grátis
                                </a>
                            </div>

                            <section className="bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                                <label className="text-slate-300 font-bold text-xs uppercase tracking-wider mb-2 block">
                                    Sua API Key
                                </label>
                                <div className="relative">
                                    <input
                                        type={showApiKey ? 'text' : 'password'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="Cole sua API Key aqui..."
                                        className="w-full p-3 pr-12 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                                    />
                                    <button
                                        onClick={() => setShowApiKey(!showApiKey)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </section>

                            <button
                                onClick={saveApiKey}
                                disabled={!apiKey.trim()}
                                className="w-full py-3 bg-yellow-600 hover:bg-yellow-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                <Check size={18} /> Salvar API Key
                            </button>

                            {apiKey && (
                                <p className="text-green-400 text-xs text-center">
                                    ✅ API Key configurada
                                </p>
                            )}
                        </div>
                    )}

                    {/* DEV LOGIN TAB */}
                    {activeTab === 'DEV_LOGIN' && (
                        <div className="space-y-4">
                            {devUnlocked ? (
                                <div className="bg-green-900/20 border border-green-700/50 p-6 rounded-xl text-center">
                                    <Unlock size={48} className="text-green-400 mx-auto mb-4" />
                                    <h3 className="text-green-400 font-bold text-lg mb-2">Modo DEV Desbloqueado!</h3>
                                    <p className="text-green-200/70 text-sm mb-4">
                                        Você tem acesso às configurações avançadas.
                                    </p>
                                    <button
                                        onClick={() => {
                                            onClose();
                                            if (onOpenDevConsole) onOpenDevConsole();
                                        }}
                                        className="px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-colors"
                                    >
                                        Abrir Console DEV
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-red-900/20 border border-red-700/50 p-6 rounded-xl">
                                    <Lock size={48} className="text-red-400 mx-auto mb-4" />
                                    <h3 className="text-red-400 font-bold text-lg mb-2 text-center">Área Restrita</h3>
                                    <p className="text-red-200/70 text-sm mb-4 text-center">
                                        Digite a senha de desenvolvedor para acessar configurações avançadas (física, economia, debug).
                                    </p>
                                    
                                    <input
                                        type="password"
                                        value={devPassword}
                                        onChange={(e) => setDevPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleDevLogin()}
                                        placeholder="Senha DEV..."
                                        className="w-full p-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-center font-mono focus:border-red-500 focus:outline-none mb-4"
                                    />
                                    
                                    <button
                                        onClick={handleDevLogin}
                                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-colors"
                                    >
                                        Desbloquear
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-3 border-t border-slate-800 bg-slate-900/50">
                    <p className="text-center text-slate-600 text-xs">
                        {Constants.APP_VERSION}
                    </p>
                </div>
            </div>
        </div>
    );
};
