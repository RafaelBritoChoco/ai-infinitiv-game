import React, { useState } from 'react';
import { Move, Save } from 'lucide-react';
import { DEFAULT_CONTROLS_LAYOUT, ControlsLayout } from './TouchControls';

export const LayoutEditorModal = ({ onClose, onSave, initialLayout }: { onClose: () => void, onSave: (layout: ControlsLayout) => void, initialLayout?: ControlsLayout }) => {
    const [settings, setSettings] = useState<ControlsLayout>(initialLayout || DEFAULT_CONTROLS_LAYOUT);

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="max-w-lg w-full bg-[#020617] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 mb-20 animate-in slide-in-from-bottom-10">
                <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2"><Move size={20} className="text-cyan-400" /> EDIT LAYOUT</h2>

                <div className="space-y-4">
                    <div className="bg-slate-900 p-3 rounded border border-slate-800">
                        <div className="flex justify-between mb-2 text-xs font-bold text-slate-400">
                            <span>GLOBAL SCALE</span>
                            <span>{settings.globalScale?.toFixed(1) || 1}x</span>
                        </div>
                        <input
                            type="range" min="0.5" max="1.5" step="0.1" 
                            value={settings.globalScale || 1}
                            onChange={(e) => setSettings({ ...settings, globalScale: parseFloat(e.target.value) })}
                            className="w-full accent-cyan-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                    <button onClick={onClose} className="py-3 rounded font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all uppercase tracking-widest">Cancel</button>
                    <button onClick={() => onSave(settings)} className="py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-bold shadow-lg uppercase tracking-widest flex items-center justify-center gap-2"><Save size={16} /> Save</button>
                </div>
            </div>
        </div>
    );
};
