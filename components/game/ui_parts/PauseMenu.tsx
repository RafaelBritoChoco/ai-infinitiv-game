import React from 'react';
import { RotateCcw, Settings } from 'lucide-react';

export const PauseMenu = ({ setGameState, handleStart, selectedIndex = 0, onOpenCalibration, onOpenSettings, weedMode }: any) => (
    <div className={`fixed inset-0 z-[100] ${weedMode ? 'bg-green-950/95' : 'bg-black/95'} backdrop-blur-xl flex items-center justify-center`}>
        <div className="max-w-md w-full mx-4">
            {/* TITLE */}
            <div className="text-center mb-8">
                <h2 className="text-5xl font-black italic text-white mb-2 tracking-tight">
                    <span className={`text-transparent bg-clip-text ${weedMode ? 'bg-gradient-to-r from-green-400 to-lime-500' : 'bg-gradient-to-r from-cyan-400 to-purple-500'}`}>
                        {weedMode ? 'CHAPOU?' : 'PAUSED'}
                    </span>
                </h2>
                <p className={`text-sm uppercase tracking-widest ${weedMode ? 'text-green-400' : 'text-slate-400'}`}>
                    {weedMode ? 'Pausa pra respirar' : 'Mission On Hold'}
                </p>
            </div>

            {/* MENU BUTTONS */}
            <div className="space-y-3">
                <button
                    onClick={() => setGameState((prev: any) => ({ ...prev, isPaused: false }))}
                    className={`w-full py-4 font-black text-lg uppercase tracking-widest rounded-xl transition-all shadow-lg ${weedMode ? 'bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-500 hover:to-lime-400 text-white shadow-green-500/30' : 'bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-cyan-500/30'}`}
                >
                    ▶ {weedMode ? 'VOLTAR PRA BRISA' : 'CONTINUAR'}
                </button>

                <button
                    onClick={() => {
                        setGameState((prev: any) => ({ ...prev, isPaused: false }));
                        handleStart(0); // Restart game
                    }}
                    className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 border-2 border-yellow-400 text-white font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <RotateCcw size={20} /> REINICIAR
                </button>

                <button
                    onClick={onOpenSettings}
                    className="w-full py-4 bg-purple-800 hover:bg-purple-700 border-2 border-purple-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <Settings size={20} /> SETTINGS
                </button>

                <button
                    onClick={() => {
                        setGameState((prev: any) => ({ ...prev, isPaused: false, isPlaying: false, isGameOver: false }));
                    }}
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 hover:border-red-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all"
                >
                    🏠 MENU PRINCIPAL
                </button>
            </div>
        </div>
    </div>
);
