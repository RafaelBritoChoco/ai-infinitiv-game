import React, { useState, useRef, useEffect } from 'react';
import { X, Save, RotateCcw, Plus, Minus, ChevronLeft, ChevronRight, ArrowUp, Rocket, Check, Eye, EyeOff, Edit3 } from 'lucide-react';
import * as Constants from '../../constants';

// Individual button layout
export interface ButtonLayout {
    id: string;
    x: number;
    y: number;
    scale: number;
    visible: boolean;
}

// Full control layout for all buttons
export interface ControlsLayout {
    leftArrow: ButtonLayout;
    rightArrow: ButtonLayout;
    jumpBtn: ButtonLayout;
    jetpackBtn: ButtonLayout;
    globalScale: number;
}

// Layouts padrão para cada modo de controle
const DEFAULT_LAYOUTS: Record<string, ControlsLayout> = {
    ARROWS: {
        leftArrow: { id: 'leftArrow', x: 24, y: 24, scale: 1, visible: true },
        rightArrow: { id: 'rightArrow', x: 120, y: 24, scale: 1, visible: true },
        jumpBtn: { id: 'jumpBtn', x: -100, y: 24, scale: 0.8, visible: false }, // Não usado em ARROWS
        jetpackBtn: { id: 'jetpackBtn', x: -48, y: 24, scale: 1, visible: false }, // Não usado em ARROWS
        globalScale: 1,
    },
    BUTTONS: {
        leftArrow: { id: 'leftArrow', x: 24, y: 24, scale: 1, visible: true },
        rightArrow: { id: 'rightArrow', x: 120, y: 24, scale: 1, visible: true },
        jumpBtn: { id: 'jumpBtn', x: -100, y: 24, scale: 1, visible: true },
        jetpackBtn: { id: 'jetpackBtn', x: -48, y: 24, scale: 1, visible: false },
        globalScale: 1,
    },
    TILT: {
        leftArrow: { id: 'leftArrow', x: 24, y: 24, scale: 1, visible: false }, // Não usado em TILT
        rightArrow: { id: 'rightArrow', x: 120, y: 24, scale: 1, visible: false }, // Não usado em TILT
        jumpBtn: { id: 'jumpBtn', x: 0, y: 24, scale: 0.75, visible: true }, // Centralizado pequeno
        jetpackBtn: { id: 'jetpackBtn', x: -24, y: 24, scale: 0.85, visible: true }, // À direita
        globalScale: 1,
    },
    JOYSTICK: {
        leftArrow: { id: 'leftArrow', x: 24, y: 24, scale: 1, visible: false },
        rightArrow: { id: 'rightArrow', x: 120, y: 24, scale: 1, visible: false },
        jumpBtn: { id: 'jumpBtn', x: -100, y: 24, scale: 1, visible: true },
        jetpackBtn: { id: 'jetpackBtn', x: -48, y: 24, scale: 1, visible: false },
        globalScale: 1,
    },
};

type ControlMode = 'BUTTONS' | 'TILT' | 'JOYSTICK' | 'ARROWS';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (layout: ControlsLayout) => void;
    initialLayout?: ControlsLayout;
    currentMode?: ControlMode;
    onModeChange?: (mode: ControlMode) => void;
}

// Função para carregar layout de um modo específico
const loadLayoutForMode = (mode: ControlMode): ControlsLayout => {
    try {
        const saved = localStorage.getItem(`CONTROLS_LAYOUT_${mode}`);
        if (saved) return JSON.parse(saved);
    } catch { }
    return DEFAULT_LAYOUTS[mode] || DEFAULT_LAYOUTS.ARROWS;
};

// Função para salvar layout de um modo específico
const saveLayoutForMode = (mode: ControlMode, layout: ControlsLayout) => {
    localStorage.setItem(`CONTROLS_LAYOUT_${mode}`, JSON.stringify(layout));
};

export const VisualControlEditor: React.FC<Props> = ({ isOpen, onClose, onSave, initialLayout, currentMode = 'ARROWS', onModeChange }) => {
    // Control mode for editing
    const [editingMode, setEditingMode] = useState<ControlMode>(currentMode);
    
    // Layout para o modo sendo editado
    const [layout, setLayout] = useState<ControlsLayout>(() => loadLayoutForMode(currentMode));

    const [selectedBtn, setSelectedBtn] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, btnX: 0, btnY: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    // Atualiza layout quando muda o modo de edição
    useEffect(() => {
        setLayout(loadLayoutForMode(editingMode));
        setSelectedBtn(null);
    }, [editingMode]);

    // Button definitions with icons - variam por modo
    const getButtonsForMode = (mode: ControlMode) => {
        const allButtons = [
            { id: 'leftArrow', label: 'ESQUERDA', icon: ChevronLeft, color: 'slate', size: 80 },
            { id: 'rightArrow', label: 'DIREITA', icon: ChevronRight, color: 'slate', size: 80 },
            { id: 'jumpBtn', label: 'PULO', icon: ArrowUp, color: 'cyan', size: 80 },
            { id: 'jetpackBtn', label: 'JETPACK', icon: Rocket, color: 'purple', size: 96 },
        ];
        
        switch (mode) {
            case 'ARROWS':
                return allButtons.filter(b => b.id === 'leftArrow' || b.id === 'rightArrow');
            case 'TILT':
                return allButtons.filter(b => b.id === 'jumpBtn' || b.id === 'jetpackBtn');
            case 'JOYSTICK':
                return allButtons.filter(b => b.id === 'jumpBtn');
            case 'BUTTONS':
                return allButtons.filter(b => b.id !== 'jetpackBtn');
            default:
                return allButtons;
        }
    };

    const BUTTONS = getButtonsForMode(editingMode);

    const getButtonLayout = (id: string): ButtonLayout => {
        return layout[id as keyof ControlsLayout] as ButtonLayout || DEFAULT_LAYOUTS[editingMode][id as keyof ControlsLayout] as ButtonLayout;
    };

    const updateButtonLayout = (id: string, updates: Partial<ButtonLayout>) => {
        setLayout(prev => ({
            ...prev,
            [id]: { ...getButtonLayout(id), ...updates }
        }));
    };

    // Touch/Mouse handlers for dragging
    const handleDragStart = (e: React.TouchEvent | React.MouseEvent, id: string) => {
        e.preventDefault();
        setSelectedBtn(id);
        setIsDragging(true);
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const btn = getButtonLayout(id);
        
        dragStartRef.current = { x: clientX, y: clientY, btnX: btn.x, btnY: btn.y };
    };

    const handleDragMove = (e: TouchEvent | MouseEvent) => {
        if (!isDragging || !selectedBtn) return;
        e.preventDefault();
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        const dx = clientX - dragStartRef.current.x;
        const dy = -(clientY - dragStartRef.current.y); // Invert Y for bottom-based positioning
        
        updateButtonLayout(selectedBtn, {
            x: dragStartRef.current.btnX + dx,
            y: dragStartRef.current.btnY + dy,
        });
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleDragMove);
            window.addEventListener('mouseup', handleDragEnd);
            window.addEventListener('touchmove', handleDragMove, { passive: false });
            window.addEventListener('touchend', handleDragEnd);
            return () => {
                window.removeEventListener('mousemove', handleDragMove);
                window.removeEventListener('mouseup', handleDragEnd);
                window.removeEventListener('touchmove', handleDragMove);
                window.removeEventListener('touchend', handleDragEnd);
            };
        }
    }, [isDragging, selectedBtn]);

    const handleSave = () => {
        // Salva layout para o modo atual
        saveLayoutForMode(editingMode, layout);
        
        // Também salva o modo de controle selecionado
        if (onModeChange) {
            localStorage.setItem('NEON_CONTROL_MODE', editingMode);
            onModeChange(editingMode);
        }
        onSave(layout);
        onClose();
    };

    const handleReset = () => {
        setLayout(DEFAULT_LAYOUTS[editingMode]);
        setSelectedBtn(null);
    };

    if (!isOpen) return null;

    const selectedBtnData = selectedBtn ? getButtonLayout(selectedBtn) : null;

    // Descrição do modo
    const getModeDescription = (mode: ControlMode) => {
        switch (mode) {
            case 'ARROWS': return 'Setas esquerda/direita. Toque = pulo, segure = jetpack';
            case 'BUTTONS': return 'Setas + botão de pulo. Segure pulo = jetpack';
            case 'TILT': return 'Incline o celular. Jump central + Jetpack à direita';
            case 'JOYSTICK': return 'Joystick analógico + botão de pulo';
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-slate-950/95 flex flex-col">
            {/* HEADER */}
            <div className="flex-shrink-0 p-4 bg-slate-900 border-b border-cyan-500/30 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-black text-white flex items-center gap-2">
                        <Edit3 size={20} className="text-cyan-400" /> Editor de Controles
                    </h2>
                    <p className="text-xs text-slate-500">Edite cada modo de controle separadamente</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleReset} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400" title="Resetar para padrão">
                        <RotateCcw size={20} />
                    </button>
                    <button onClick={handleSave} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-bold flex items-center gap-2">
                        <Save size={18} /> Salvar
                    </button>
                    <button onClick={onClose} className="p-2 bg-red-900/50 hover:bg-red-800 rounded-lg text-red-400">
                        <X size={20} />
                    </button>
                </div>
            </div>

            {/* CONTROL MODE SELECTOR - Escolha qual modo editar */}
            <div className="flex-shrink-0 p-3 bg-slate-800/80 border-b border-slate-700">
                <p className="text-xs text-cyan-400 mb-2 uppercase font-bold flex items-center gap-2">
                    <Edit3 size={14} /> Selecione o modo para editar:
                </p>
                <div className="flex gap-2 flex-wrap">
                    {[
                        { mode: 'ARROWS' as ControlMode, label: 'SETAS', color: 'green' },
                        { mode: 'BUTTONS' as ControlMode, label: 'BOTOES', color: 'blue' },
                        { mode: 'TILT' as ControlMode, label: 'MOTION', color: 'purple' },
                        { mode: 'JOYSTICK' as ControlMode, label: 'JOYSTICK', color: 'cyan' },
                    ].map(({ mode, label, color }) => (
                        <button
                            key={mode}
                            onClick={() => setEditingMode(mode)}
                            className={`px-4 py-3 rounded-lg text-sm font-bold transition-all border-2 ${
                                editingMode === mode 
                                    ? `bg-${color}-600 text-white border-${color}-400 shadow-lg shadow-${color}-500/30 scale-105` 
                                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                            }`}
                        >
                            {label}
                            {editingMode === mode && <span className="ml-2 text-xs">(editando)</span>}
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                    {getModeDescription(editingMode)}
                </p>
            </div>

            {/* MAIN AREA - Simulated Game Screen */}
            <div ref={containerRef} className="flex-1 relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-20" style={{
                    backgroundImage: 'linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />

                {/* Safe Area Indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-24 border-t-2 border-dashed border-yellow-500/30 bg-yellow-500/5">
                    <span className="absolute top-2 left-4 text-yellow-500/50 text-[10px] uppercase font-bold">Safe Area</span>
                </div>

                {/* DRAGGABLE BUTTONS */}
                {BUTTONS.map((btn) => {
                    const btnLayout = getButtonLayout(btn.id);
                    if (!btnLayout.visible) return null;

                    const isLeft = btn.id.includes('left') || btn.id.includes('right');
                    const isSelected = selectedBtn === btn.id;
                    const Icon = btn.icon;

                    // Position calculation
                    const style: React.CSSProperties = {
                        position: 'absolute',
                        bottom: `${btnLayout.y}px`,
                        width: `${btn.size * btnLayout.scale * layout.globalScale}px`,
                        height: `${btn.size * btnLayout.scale * layout.globalScale}px`,
                        transform: 'translate(-50%, 50%)',
                        touchAction: 'none',
                        cursor: isDragging && isSelected ? 'grabbing' : 'grab',
                    };

                    // Left-aligned buttons
                    if (btn.id === 'leftArrow' || btn.id === 'rightArrow') {
                        style.left = `${btnLayout.x}px`;
                        style.transform = 'translateY(50%)';
                    }
                    // Right-aligned buttons (negative x from right)
                    else {
                        style.right = `${-btnLayout.x}px`;
                        style.transform = 'translateY(50%)';
                    }

                    const colorClasses = {
                        slate: 'bg-slate-900/60 border-slate-500/50 text-white',
                        cyan: 'bg-cyan-900/60 border-cyan-500/50 text-cyan-200',
                        purple: 'bg-purple-900/60 border-purple-500/50 text-purple-200',
                    };

                    return (
                        <div
                            key={btn.id}
                            style={style}
                            onMouseDown={(e) => handleDragStart(e, btn.id)}
                            onTouchStart={(e) => handleDragStart(e, btn.id)}
                            onClick={() => setSelectedBtn(btn.id)}
                            className={`rounded-full flex items-center justify-center border-2 backdrop-blur-sm transition-all ${
                                colorClasses[btn.color as keyof typeof colorClasses]
                            } ${isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-slate-900 shadow-[0_0_30px_rgba(6,182,212,0.5)]' : ''}`}
                        >
                            <Icon size={btn.size * 0.4 * btnLayout.scale * layout.globalScale} />
                        </div>
                    );
                })}

                {/* Position Helper Lines when dragging */}
                {isDragging && selectedBtn && (
                    <>
                        <div className="absolute left-0 right-0 border-t border-cyan-400/50 pointer-events-none"
                            style={{ bottom: `${getButtonLayout(selectedBtn).y}px` }} />
                        <div className="absolute top-0 bottom-0 border-l border-cyan-400/50 pointer-events-none"
                            style={{ left: getButtonLayout(selectedBtn).x > 0 ? `${getButtonLayout(selectedBtn).x}px` : undefined,
                                     right: getButtonLayout(selectedBtn).x <= 0 ? `${-getButtonLayout(selectedBtn).x}px` : undefined }} />
                    </>
                )}
            </div>

            {/* BOTTOM PANEL - Button Properties */}
            <div className="flex-shrink-0 p-4 bg-slate-900 border-t border-slate-700">
                {selectedBtnData ? (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-cyan-400 font-bold text-sm uppercase">
                                {BUTTONS.find(b => b.id === selectedBtn)?.label || selectedBtn}
                            </h3>
                            <button
                                onClick={() => updateButtonLayout(selectedBtn!, { visible: !selectedBtnData.visible })}
                                className={`p-2 rounded-lg ${selectedBtnData.visible ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}
                            >
                                {selectedBtnData.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                        </div>

                        {/* Size Slider */}
                        <div>
                            <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-400 uppercase font-bold">Tamanho</span>
                                <span className="text-cyan-400 font-mono">{Math.round(selectedBtnData.scale * 100)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => updateButtonLayout(selectedBtn!, { scale: Math.max(0.5, selectedBtnData.scale - 0.1) })}
                                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="range" min={0.5} max={2} step={0.05}
                                    value={selectedBtnData.scale}
                                    onChange={(e) => updateButtonLayout(selectedBtn!, { scale: parseFloat(e.target.value) })}
                                    className="flex-1 accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                                />
                                <button onClick={() => updateButtonLayout(selectedBtn!, { scale: Math.min(2, selectedBtnData.scale + 0.1) })}
                                    className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white">
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Position Display */}
                        <div className="flex gap-4 text-xs">
                            <div className="flex-1 bg-slate-800/50 p-2 rounded-lg">
                                <span className="text-slate-500">X:</span>
                                <span className="text-cyan-400 font-mono ml-2">{selectedBtnData.x.toFixed(0)}px</span>
                            </div>
                            <div className="flex-1 bg-slate-800/50 p-2 rounded-lg">
                                <span className="text-slate-500">Y:</span>
                                <span className="text-cyan-400 font-mono ml-2">{selectedBtnData.y.toFixed(0)}px</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4">
                        <p className="text-slate-500 text-sm">👆 Toque em um botão para editar</p>
                    </div>
                )}

                {/* Global Scale */}
                <div className="mt-4 pt-4 border-t border-slate-800">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400 uppercase font-bold">Escala Global</span>
                        <span className="text-cyan-400 font-mono">{Math.round(layout.globalScale * 100)}%</span>
                    </div>
                    <input
                        type="range" min={0.6} max={1.5} step={0.05}
                        value={layout.globalScale}
                        onChange={(e) => setLayout(prev => ({ ...prev, globalScale: parseFloat(e.target.value) }))}
                        className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                    />
                </div>
            </div>
        </div>
    );
};

export default VisualControlEditor;
