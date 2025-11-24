import React, { useState } from 'react';
import { X, Gamepad2, Save, RotateCcw, Monitor, Volume2, Cpu, Wind, Eye, Activity, Download, Upload, Zap } from 'lucide-react';
import { GameConfig, detectPerformanceMode } from '../../types';
import * as Constants from '../../constants';

interface SettingsModalProps {
    onClose: () => void;
    gameState: any;
    setGameState: (state: any) => void;
    config: GameConfig;
    setConfig: (config: GameConfig) => void;
}

const TABS = [
    { id: 'PERFORMANCE', icon: Zap, label: 'Performance' },
    { id: 'CONTROLS', icon: Gamepad2, label: 'Controls' },
    { id: 'PHYSICS', icon: Wind, label: 'Physics' },
    { id: 'VISUALS', icon: Eye, label: 'Visuals' },
    { id: 'AUDIO', icon: Volume2, label: 'Audio' },
    { id: 'GAMEPLAY', icon: Activity, label: 'Gameplay' },
    { id: 'DEBUG', icon: Cpu, label: 'Debug' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
    onClose, gameState, setGameState, config, setConfig
}) => {
    const safeConfig = config || {} as GameConfig;
    const [localConfig, setLocalConfig] = useState<GameConfig>({ ...safeConfig });
    const [activeTab, setActiveTab] = useState('PERFORMANCE');

    const handleSave = () => {
        setConfig(localConfig);
        onClose();
    };

    const updateConfig = (key: keyof GameConfig, value: any) => {
        setLocalConfig(prev => ({ ...prev, [key]: value }));
        setConfig({ ...localConfig, [key]: value });
    };

    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState<string>('');

    const ConfigSlider = ({ label, configKey, min, max, step, format = (v: number) => v.toFixed(2) }: { label: string, configKey: keyof GameConfig, min: number, max: number, step: number, format?: (v: number) => string }) => {
        const isEditing = editingKey === configKey;
        const currentValue = localConfig[configKey] as number || 0;

        const handleValueClick = () => {
            setEditingKey(configKey);
            setTempValue(currentValue.toString());
        };

        const handleValueBlur = () => {
            const parsed = parseFloat(tempValue);
            if (!isNaN(parsed)) {
                const clamped = Math.max(min, Math.min(max, parsed));
                updateConfig(configKey, clamped);
            }
            setEditingKey(null);
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                handleValueBlur();
            } else if (e.key === 'Escape') {
                setEditingKey(null);
            }
        };

        return (
            <div>
                <div className="flex justify-between mb-1">
                    <label className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">{label}</label>
                    {isEditing ? (
                        <input
                            type="text"
                            value={tempValue}
                            onChange={(e) => setTempValue(e.target.value)}
                            onBlur={handleValueBlur}
                            onKeyDown={handleKeyDown}
                            autoFocus
                            className="w-16 px-1 text-cyan-400 font-mono text-xs bg-slate-800 border border-cyan-500 rounded text-right focus:outline-none focus:ring-1 focus:ring-cyan-400"
                        />
                    ) : (
                        <span
                            onClick={handleValueClick}
                            className="text-cyan-400 font-mono text-xs cursor-pointer hover:text-cyan-300 hover:underline transition-colors"
                            title="Click to edit"
                        >
                            {format(currentValue)}
                        </span>
                    )}
                </div>
                <input
                    type="range" min={min} max={max} step={step}
                    value={currentValue}
                    onChange={(e) => updateConfig(configKey, parseFloat(e.target.value))}
                    className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer hover:bg-slate-700 transition-colors"
                />
            </div>
        );
    };

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(localConfig, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "game_config.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileReader = new FileReader();
        if (event.target.files && event.target.files[0]) {
            fileReader.readAsText(event.target.files[0], "UTF-8");
            fileReader.onload = (e) => {
                if (e.target?.result) {
                    try {
                        const parsed = JSON.parse(e.target.result as string);
                        setLocalConfig({ ...localConfig, ...parsed });
                    } catch (err) {
                        alert("Invalid JSON file");
                    }
                }
            };
        }
    };

    const detectedMode = detectPerformanceMode();

    // Drag & Drop State
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 420, y: 20 });
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.drag-handle')) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: Math.max(0, Math.min(window.innerWidth - 400, e.clientX - dragStart.x)),
                y: Math.max(0, Math.min(window.innerHeight - 600, e.clientY - dragStart.y))
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    React.useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            return () => {
                window.removeEventListener('mousemove', handleMouseMove);
                window.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isDragging, dragStart]);

    return (
        <>
            {/* Semi-transparent backdrop - NÃO fecha ao clicar */}
            <div className="fixed inset-0 bg-black/20" style={{ zIndex: Constants.Z_LAYERS.MODAL - 1 }} />

            {/* Floating draggable modal */}
            <div
                className="fixed w-96 h-[600px] bg-slate-900/98 backdrop-blur-md border-2 border-cyan-500/50 rounded-lg shadow-2xl flex flex-col"
                style={{
                    zIndex: Constants.Z_LAYERS.MODAL,
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                    cursor: isDragging ? 'grabbing' : 'default'
                }}
                onMouseDown={handleMouseDown}
            >

                {/* HEADER com Drag Handle */}
                <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/90 backdrop-blur-sm shrink-0 drag-handle cursor-move">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                            <div className="w-3 h-0.5 bg-slate-600 rounded"></div>
                            <div className="w-3 h-0.5 bg-slate-600 rounded"></div>
                            <div className="w-3 h-0.5 bg-slate-600 rounded"></div>
                        </div>
                        <h2 className="text-lg font-black text-white italic tracking-tight flex items-center gap-2">
                            <span className="text-cyan-500">DEV</span> CONSOLE
                        </h2>
                        <span className="px-2 py-0.5 bg-cyan-900/30 text-cyan-400 text-[9px] font-mono rounded border border-cyan-500/20">{Constants.APP_VERSION}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button onClick={handleExport} className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors" title="Export">
                            <Download size={14} />
                        </button>
                        <label className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors cursor-pointer" title="Import">
                            <Upload size={14} />
                            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                        </label>
                        <div className="w-px h-4 bg-slate-700" />
                        <button onClick={onClose} className="p-1.5 hover:bg-red-900/30 rounded text-slate-400 hover:text-red-400 transition-colors">
                            <X size={16} />
                        </button>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex overflow-x-auto border-b border-slate-800 bg-slate-950/50 shrink-0 scrollbar-hide">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${isActive
                                    ? 'text-cyan-400 border-cyan-500 bg-cyan-950/20'
                                    : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800/50'
                                    }`}
                            >
                                <Icon size={14} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* CONTENT */}
                <div className="flex-1 p-3 overflow-y-auto custom-scrollbar bg-slate-900/30">
                    {/* PERFORMANCE TAB */}
                    {activeTab === 'PERFORMANCE' && (
                        <div className="space-y-4">
                            <section>
                                <h3 className="text-yellow-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <Zap size={12} /> Graphics Quality
                                </h3>
                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-3">
                                    <div className="grid grid-cols-3 gap-2">
                                        <button
                                            onClick={() => updateConfig('PERFORMANCE_MODE', 'auto')}
                                            className={`p-3 rounded border flex flex-col items-center gap-2 transition-all text-[10px] ${localConfig.PERFORMANCE_MODE === 'auto' ? 'bg-purple-950 border-purple-500 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                        >
                                            <Activity size={20} />
                                            AUTO
                                            <span className="text-[8px] text-slate-600">{detectedMode.toUpperCase()}</span>
                                        </button>
                                        <button
                                            onClick={() => updateConfig('PERFORMANCE_MODE', 'high')}
                                            className={`p-3 rounded border flex flex-col items-center gap-2 transition-all text-[10px] ${localConfig.PERFORMANCE_MODE === 'high' ? 'bg-green-950 border-green-500 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                        >
                                            <Eye size={20} />
                                            HIGH
                                        </button>
                                        <button
                                            onClick={() => updateConfig('PERFORMANCE_MODE', 'low')}
                                            className={`p-3 rounded border flex flex-col items-center gap-2 transition-all text-[10px] ${localConfig.PERFORMANCE_MODE === 'low' ? 'bg-orange-950 border-orange-500 text-orange-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}
                                        >
                                            <Zap size={20} />
                                            LOW
                                        </button>
                                    </div>

                                    {localConfig.PERFORMANCE_MODE === 'low' && (
                                        <div className="bg-orange-950/30 border border-orange-900/50 p-2 rounded text-[9px] text-orange-300">
                                            <strong>LOW MODE ACTIVE:</strong> Reduced particles (20 max), flat textures, 30fps input, minimal effects. Recommended for budget devices (M23, etc).
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <h3 className="text-cyan-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <Cpu size={12} /> Advanced Settings
                                </h3>
                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-3">
                                    <ConfigSlider label="Max Particles (High)" configKey="MAX_PARTICLES_HIGH" min={50} max={300} step={10} format={(v) => v.toFixed(0)} />
                                    <ConfigSlider label="Max Particles (Low)" configKey="MAX_PARTICLES_LOW" min={5} max={50} step={5} format={(v) => v.toFixed(0)} />
                                    <ConfigSlider label="Max Platforms (High)" configKey="MAX_PLATFORMS_HIGH" min={50} max={200} step={10} format={(v) => v.toFixed(0)} />
                                    <ConfigSlider label="Max Platforms (Low)" configKey="MAX_PLATFORMS_LOW" min={20} max={50} step={5} format={(v) => v.toFixed(0)} />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* CONTROLS TAB */}
                    {activeTab === 'CONTROLS' && (
                        <div className="space-y-4">
                            <section>
                                <h3 className="text-cyan-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <Gamepad2 size={12} /> Input Method
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => setGameState((p: any) => ({ ...p, mobileControlMode: 'BUTTONS' }))} className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all text-[10px] ${gameState?.mobileControlMode === 'BUTTONS' ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                        <Gamepad2 size={20} /> BUTTONS
                                    </button>
                                    <button onClick={() => setGameState((p: any) => ({ ...p, mobileControlMode: 'JOYSTICK' }))} className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all text-[10px] ${gameState?.mobileControlMode === 'JOYSTICK' ? 'bg-cyan-950 border-cyan-500 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                                        <Monitor size={20} /> JOYSTICK
                                    </button>
                                </div>
                            </section>
                            <section>
                                <h3 className="text-purple-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <RotateCcw size={12} /> Sensitivity
                                </h3>
                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-3">
                                    <ConfigSlider label="Gamepad Deadzone" configKey="GAMEPAD_DEADZONE" min={0} max={0.5} step={0.01} />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* PHYSICS TAB */}
                    {activeTab === 'PHYSICS' && (
                        <div className="space-y-4">
                            <section>
                                <h3 className="text-green-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <Wind size={12} /> Movement & Gravity
                                </h3>
                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 grid grid-cols-2 gap-3">
                                    <ConfigSlider label="Gravity" configKey="GRAVITY" min={0.1} max={2.0} step={0.05} />
                                    <ConfigSlider label="Friction" configKey="FRICTION" min={0.5} max={0.99} step={0.01} />
                                    <ConfigSlider label="Air Resist" configKey="AIR_RESISTANCE" min={0.8} max={1.0} step={0.001} />
                                    <ConfigSlider label="Move Accel" configKey="MOVE_ACCELERATION" min={0.1} max={5.0} step={0.1} />
                                    <ConfigSlider label="Max Fall Spd" configKey="MAX_FALL_SPEED" min={10} max={200} step={5} />
                                    <ConfigSlider label="Max H Speed" configKey="MAX_H_SPEED" min={5} max={30} step={1} />
                                </div>
                            </section>
                            <section>
                                <h3 className="text-yellow-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <Activity size={12} /> Jump & Jetpack
                                </h3>
                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 grid grid-cols-2 gap-3">
                                    <ConfigSlider label="Jump (Weak)" configKey="WEAK_JUMP_FORCE" min={10} max={100} step={1} />
                                    <ConfigSlider label="Jump (Perfect)" configKey="PERFECT_JUMP_FORCE" min={20} max={150} step={1} />
                                    <ConfigSlider label="Jetpack Force" configKey="JETPACK_FORCE" min={0.05} max={0.5} step={0.01} />
                                    <ConfigSlider label="Jetpack Cost" configKey="JETPACK_FUEL_COST_PER_FRAME" min={0} max={5} step={0.1} />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* VISUALS TAB */}
                    {activeTab === 'VISUALS' && (
                        <div className="space-y-4">
                            <section>
                                <h3 className="text-pink-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <Eye size={12} /> Camera & View
                                </h3>
                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 grid grid-cols-2 gap-3">
                                    <ConfigSlider label="Max Zoom Out" configKey="MAX_ZOOM_OUT" min={1} max={10} step={0.1} />
                                    <ConfigSlider label="Zoom Threshold" configKey="ZOOM_START_THRESHOLD" min={0} max={1000} step={10} />
                                    <ConfigSlider label="Lookahead" configKey="CAMERA_LOOKAHEAD_FALLING" min={0} max={50} step={1} />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* AUDIO TAB */}
                    {activeTab === 'AUDIO' && (
                        <div className="space-y-4">
                            <section>
                                <h3 className="text-blue-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <Volume2 size={12} /> Sound Levels
                                </h3>
                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-3">
                                    <ConfigSlider label="Master Volume" configKey="VOLUME_MASTER" min={0} max={1} step={0.05} />
                                    <ConfigSlider label="Music Volume" configKey="VOLUME_MUSIC" min={0} max={1} step={0.05} />
                                    <ConfigSlider label="SFX Volume" configKey="VOLUME_SFX" min={0} max={1} step={0.05} />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* GAMEPLAY TAB */}
                    {activeTab === 'GAMEPLAY' && (
                        <div className="space-y-4">
                            <section>
                                <h3 className="text-orange-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <Activity size={12} /> Economy
                                </h3>
                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 grid grid-cols-2 gap-3">
                                    <ConfigSlider label="Coin Value" configKey="COIN_VALUE" min={1} max={100} step={1} format={(v) => v.toFixed(0)} />
                                    <ConfigSlider label="Fuel Refill" configKey="FUEL_REFILL_AMOUNT" min={10} max={100} step={5} format={(v) => v.toFixed(0)} />
                                    <ConfigSlider label="Max Fuel" configKey="JETPACK_FUEL_MAX" min={0} max={200} step={10} format={(v) => v.toFixed(0)} />
                                    <ConfigSlider label="Fuel Upg Bonus" configKey="UPGRADE_FUEL_BONUS" min={5} max={50} step={1} format={(v) => v.toFixed(0)} />
                                </div>
                            </section>
                            <section>
                                <h3 className="text-indigo-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <Wind size={12} /> Level Gen
                                </h3>
                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 grid grid-cols-2 gap-3">
                                    <ConfigSlider label="Lvl2 Gap Mult" configKey="LVL2_GAP_MULT" min={1.0} max={2.0} step={0.05} />
                                    <ConfigSlider label="Shield Bounce" configKey="SHIELD_BOUNCE_FORCE" min={50} max={300} step={10} format={(v) => v.toFixed(0)} />
                                </div>
                            </section>
                        </div>
                    )}

                    {/* DEBUG TAB */}
                    {activeTab === 'DEBUG' && (
                        <div className="space-y-4">
                            <section>
                                <h3 className="text-red-500 font-bold mb-2 uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                                    <Cpu size={12} /> Debug Tools
                                </h3>
                                <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800 space-y-2">
                                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded text-xs">
                                        <span className="text-slate-400 font-bold">Show Hitboxes</span>
                                        <button
                                            onClick={() => setGameState((p: any) => ({ ...p, showHitboxes: !p?.showHitboxes }))}
                                            className={`w-10 h-5 rounded-full relative transition-all ${gameState?.showHitboxes ? 'bg-green-600' : 'bg-slate-800'}`}
                                        >
                                            <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${gameState?.showHitboxes ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between p-2 bg-slate-900 rounded text-xs">
                                        <span className="text-slate-400 font-bold">God Mode</span>
                                        <button
                                            onClick={() => setGameState((p: any) => ({ ...p, godMode: !p?.godMode }))}
                                            className={`w-10 h-5 rounded-full relative transition-all ${gameState?.godMode ? 'bg-purple-600' : 'bg-slate-800'}`}
                                        >
                                            <div className={`w-3 h-3 bg-white rounded-full absolute top-1 transition-all ${gameState?.godMode ? 'left-6' : 'left-1'}`} />
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="p-2 border-t border-slate-800 bg-slate-950/90 backdrop-blur-sm flex justify-between gap-2 shrink-0">
                    <button onClick={onClose} className="px-3 py-1.5 rounded font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all uppercase tracking-widest text-[10px]">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] uppercase tracking-widest text-[10px] flex items-center gap-1.5">
                        <Save size={12} /> Apply
                    </button>
                </div>
            </div>
        </>
    );
};
