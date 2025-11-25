import React, { useState, useEffect } from 'react';
import { Settings, X, Check, RotateCcw, Save } from 'lucide-react';
import { soundManager } from '../audioManager';

export const CalibrationModal = ({ isOpen, onClose, configRef }: { isOpen: boolean; onClose: () => void; configRef: React.MutableRefObject<any> }) => {
    const [sensitivity, setSensitivity] = useState(configRef.current?.GYRO_SENSITIVITY || 35);
    const [offset, setOffset] = useState(0);
    const [currentTilt, setCurrentTilt] = useState(0);
    const [calibrated, setCalibrated] = useState(false);

    useEffect(() => {
        if (!isOpen) return;

        const handleOrientation = (e: DeviceOrientationEvent) => {
            const gamma = e.gamma || 0;
            setCurrentTilt(gamma);
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [isOpen]);

    const handleCalibrate = () => {
        // Set current position as zero
        setOffset(currentTilt);
        setCalibrated(true);
        soundManager.playCollect();
    };

    const handleSave = () => {
        // Save to configRef
        if (configRef.current) {
            configRef.current.GYRO_SENSITIVITY = sensitivity;
        }
        // Save calibration to localStorage
        localStorage.setItem('GYRO_CALIBRATION', JSON.stringify({ offset, sensitivity }));
        soundManager.playClick();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
                    <h2 className="text-xl font-black text-cyan-400 flex items-center gap-2">
                        <Settings size={20} /> CALIBRATION
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-full transition-all text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Current Tilt Display */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-widest">Live Tilt Reading</div>
                        <div className="relative h-8 bg-slate-900 rounded-full overflow-hidden">
                            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-cyan-500 z-10"></div>
                            <div 
                                className="absolute top-1 bottom-1 w-6 bg-green-500 rounded-full transition-all duration-100 shadow-[0_0_10px_#22c55e]"
                                style={{ 
                                    left: `calc(50% + ${Math.max(-45, Math.min(45, (currentTilt - offset))) * 2}px - 12px)` 
                                }}
                            ></div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-slate-500 font-mono">
                            <span>-45°</span>
                            <span className="text-cyan-400">{(currentTilt - offset).toFixed(1)}°</span>
                            <span>+45°</span>
                        </div>
                    </div>

                    {/* Calibrate Button */}
                    <button 
                        onClick={handleCalibrate}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            calibrated 
                                ? 'bg-green-900/50 border-2 border-green-500 text-green-400' 
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        }`}
                    >
                        {calibrated ? <Check size={20} /> : <RotateCcw size={20} />}
                        {calibrated ? 'CALIBRATED!' : 'SET CURRENT AS CENTER'}
                    </button>

                    {/* Sensitivity Slider */}
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="flex justify-between mb-3">
                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sensitivity</span>
                            <span className="text-sm font-mono text-cyan-400">{sensitivity}</span>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="80"
                            step="5"
                            value={sensitivity}
                            onChange={(e) => setSensitivity(parseInt(e.target.value))}
                            className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                        />
                        <div className="flex justify-between text-[10px] text-slate-600 mt-2 font-bold">
                            <span className={sensitivity < 25 ? "text-green-400" : ""}>LOW</span>
                            <span className={sensitivity >= 25 && sensitivity <= 45 ? "text-green-400" : ""}>DEFAULT (35)</span>
                            <span className={sensitivity > 45 ? "text-green-400" : ""}>HIGH</span>
                        </div>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/20"
                    >
                        <Save size={20} /> SAVE & CLOSE
                    </button>
                </div>
            </div>
        </div>
    );
};
