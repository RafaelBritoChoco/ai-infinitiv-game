import React from 'react';
import { X } from 'lucide-react';

interface DevConsoleProps {
    isOpen: boolean;
    onClose: () => void;
    configRef: React.MutableRefObject<any>;
}

export const DevConsole = ({ isOpen, onClose, configRef }: DevConsoleProps) => {
    const [activeTab, setActiveTab] = React.useState<'physics' | 'controls' | 'visual'>('physics');

    // Live values (what user is tweaking)
    const [gravity, setGravity] = React.useState(() => configRef.current.GRAVITY || 0.65);
    const [jumpForce, setJumpForce] = React.useState(() => configRef.current.PERFECT_JUMP_FORCE || 65);
    const [moveSpeed, setMoveSpeed] = React.useState(() => configRef.current.MOVE_ACCELERATION || 1.8);

    // Apply changes in real-time
    React.useEffect(() => {
        configRef.current.GRAVITY = gravity;
    }, [gravity, configRef]);

    React.useEffect(() => {
        configRef.current.PERFECT_JUMP_FORCE = jumpForce;
        configRef.current.WEAK_JUMP_FORCE = jumpForce * 0.65;
    }, [jumpForce, configRef]);

    React.useEffect(() => {
        configRef.current.MOVE_ACCELERATION = moveSpeed;
    }, [moveSpeed, configRef]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150]"
                onClick={onClose}
            />

            {/* Side Panel */}
            <div className="fixed right-0 top-0 h-full w-[400px] bg-slate-900 border-l-2 border-cyan-500 z-[160] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-slate-900 border-b border-cyan-500/30 p-4 z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-cyan-400 flex items-center gap-2">
                            DEV CONSOLE
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Changes apply instantly</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 p-2 border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('physics')}
                        className={`flex-1 py-2 px-3 rounded text-xs font-bold ${activeTab === 'physics'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        PHYSICS
                    </button>
                    <button
                        onClick={() => setActiveTab('controls')}
                        className={`flex-1 py-2 px-3 rounded text-xs font-bold ${activeTab === 'controls'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        CONTROLS
                    </button>
                    <button
                        onClick={() => setActiveTab('visual')}
                        className={`flex-1 py-2 px-3 rounded text-xs font-bold ${activeTab === 'visual'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        VISUAL
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                    {activeTab === 'physics' && (
                        <>
                            {/* GRAVITY */}
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold text-slate-300">GRAVITY</span>
                                    <span className="text-sm font-mono text-cyan-400">{gravity.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.1"
                                    max="3.0"
                                    step="0.05"
                                    value={gravity}
                                    onChange={(e) => setGravity(parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg"
                                />
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                    <span>Floaty (0.1)</span>
                                    <span>Default (0.65)</span>
                                    <span>Heavy (3.0)</span>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">
                                    <span className="text-cyan-400">🔴 LIVE</span> - Changes apply now!
                                </div>
                            </div>

                            {/* JUMP FORCE */}
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold text-slate-300">JUMP FORCE</span>
                                    <span className="text-sm font-mono text-cyan-400">{jumpForce.toFixed(0)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="30"
                                    max="150"
                                    step="5"
                                    value={jumpForce}
                                    onChange={(e) => setJumpForce(parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg"
                                />
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                    <span>Low Jump</span>
                                    <span>Default (65)</span>
                                    <span>High Jump</span>
                                </div>
                            </div>

                            {/* MOVE SPEED */}
                            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm font-bold text-slate-300">MOVE ACCEL</span>
                                    <span className="text-sm font-mono text-cyan-400">{moveSpeed.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="5.0"
                                    step="0.1"
                                    value={moveSpeed}
                                    onChange={(e) => setMoveSpeed(parseFloat(e.target.value))}
                                    className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg"
                                />
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1 font-bold">
                                    <span className={moveSpeed < 1.0 ? "text-green-400" : ""}>Slow</span>
                                    <span className={moveSpeed >= 1.0 && moveSpeed <= 2.5 ? "text-green-400" : ""}>Default (1.8)</span>
                                    <span className={moveSpeed > 2.5 ? "text-green-400" : ""}>Fast</span>
                                </div>
                            </div>

                            {/* Info */}
                            <div className="bg-cyan-900/20 border border-cyan-500/30 p-3 rounded">
                                <p className="text-xs text-cyan-300">
                                    💡 <strong>Tip:</strong> Adjust while playing to see changes instantly!
                                </p>
                            </div>
                        </>
                    )}

                    {activeTab === 'controls' && (
                        <div className="bg-slate-800 p-4 rounded text-center">
                            <p className="text-slate-400 text-sm">Control settings coming soon...</p>
                        </div>
                    )}

                    {activeTab === 'visual' && (
                        <div className="bg-slate-800 p-4 rounded text-center">
                            <p className="text-slate-400 text-sm">Visual settings coming soon...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-slate-900 border-t border-slate-800 p-4">
                    <button
                        onClick={() => {
                            setGravity(0.65);
                            setJumpForce(65);
                            setMoveSpeed(1.8);
                        }}
                        className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white rounded font-bold text-sm"
                    >
                        RESET TO DEFAULTS
                    </button>
                </div>
            </div>
        </>
    );
};
