import React from 'react';
import { Move, Settings, Smartphone, Gamepad2, RotateCcw, Lock, Unlock } from 'lucide-react';

export const ControlsModal = ({ onClose, currentMode, setMobileControlMode, onCalibrate, onOpenLayoutEditor, rotationLock, setRotationLock }: any) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="max-w-lg w-full bg-[#020617] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 mb-20 animate-in slide-in-from-bottom-10">
                <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
                    <Gamepad2 size={24} className="text-cyan-400" /> CONTROLS
                </h2>

                <div className="grid grid-cols-1 gap-3 mb-6">
                    <button 
                        onClick={() => setMobileControlMode('BUTTONS')}
                        className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${currentMode === 'BUTTONS' ? 'bg-cyan-900/40 border-cyan-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                    >
                        <span className="font-bold flex items-center gap-2"><Gamepad2 size={18} /> BUTTONS</span>
                        {currentMode === 'BUTTONS' && <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
                    </button>

                    <button 
                        onClick={() => setMobileControlMode('ARROWS')}
                        className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${currentMode === 'ARROWS' ? 'bg-cyan-900/40 border-cyan-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                    >
                        <span className="font-bold flex items-center gap-2"><Move size={18} /> ARROWS (Split)</span>
                        {currentMode === 'ARROWS' && <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
                    </button>

                    <button 
                        onClick={() => setMobileControlMode('TILT')}
                        className={`p-4 rounded-xl border-2 flex items-center justify-between transition-all ${currentMode === 'TILT' ? 'bg-cyan-900/40 border-cyan-400 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                    >
                        <span className="font-bold flex items-center gap-2"><Smartphone size={18} /> TILT (Motion)</span>
                        {currentMode === 'TILT' && <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>}
                    </button>
                </div>

                <div className="space-y-3">
                    {currentMode === 'TILT' && (
                        <button 
                            onClick={onCalibrate}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        >
                            <RotateCcw size={16} /> Calibrate Tilt
                        </button>
                    )}

                    <button 
                        onClick={onOpenLayoutEditor}
                        className="w-full py-3 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-500/30 text-purple-200 rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                    >
                        <Settings size={16} /> Edit Layout
                    </button>
                    
                    {setRotationLock && (
                         <button 
                            onClick={() => setRotationLock(!rotationLock)}
                            className={`w-full py-3 border rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${rotationLock ? 'bg-green-900/30 border-green-500/50 text-green-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                        >
                            {rotationLock ? <Lock size={16} /> : <Unlock size={16} />} {rotationLock ? 'Rotation Locked' : 'Rotation Unlocked'}
                        </button>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    className="w-full mt-6 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-widest transition-all"
                >
                    Close
                </button>
            </div>
        </div>
    );
};
