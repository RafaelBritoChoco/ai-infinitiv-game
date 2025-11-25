import React from 'react';
import { Rocket, Lock, XOctagon, Coins, Battery } from 'lucide-react';
import * as Constants from '../../../constants';

export const RightSidebar = ({ gameState, config, jetpackMode, setShowDebug, tiltDebug, gyroEnabled }: any) => {
    const hasJetpack = gameState.upgrades.maxFuel > 0;
    const currentMaxFuel = Constants.JETPACK_FUEL_MAX + (gameState.upgrades.maxFuel * Constants.UPGRADE_FUEL_BONUS);
    return (
        <div className="hidden md:flex w-48 flex-col p-4 border-l border-cyan-900/30 bg-black/80 backdrop-blur-xl z-10 shadow-[-5px_0_30px_rgba(0,0,0,0.5)]">
            <div className="flex justify-between items-center mb-6 px-1">
                <div className="text-xs font-bold text-slate-500 tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_#22c55e]"></div>
                    SYSTEMS ONLINE
                </div>
            </div>

            {/* TILT DEBUGGER */}
            {gameState.mobileControlMode === 'TILT' && (
                <div className="bg-slate-900/80 border border-cyan-800 p-2 rounded mb-4 text-[10px] font-mono">
                    <div className="text-cyan-500 font-bold mb-1 flex justify-between">
                        <span>GYRO SENSOR</span>
                        <span className={gyroEnabled ? "text-green-400" : "text-red-500"}>{gyroEnabled ? "ACTIVE" : "OFF"}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                        <span>TILT:</span>
                        <span className={Math.abs(tiltDebug) > 0.1 ? "text-white" : ""}>{tiltDebug.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 mt-1 relative">
                        <div className="absolute top-0 bottom-0 w-0.5 bg-white left-1/2"></div>
                        <div className="h-full bg-cyan-500 absolute" style={{ left: '50%', width: '4px', transform: `translateX(${tiltDebug * 20}px)` }}></div>
                    </div>
                </div>
            )}

            <div className={`bg-black/40 backdrop-blur-md border p-3 rounded-lg mb-5 transition-all duration-300 relative overflow-hidden group ${hasJetpack ? (jetpackMode === 'BURST' ? 'border-orange-500/50 shadow-[0_0_25px_rgba(249,115,22,0.3)]' : 'border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.1)]') : 'border-red-900/50 opacity-70'}`}>
                <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(6,182,212,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.5)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                <div className="flex justify-between items-end mb-2 relative z-10">
                    <span className={`text-xs font-bold ${hasJetpack ? 'text-cyan-400' : 'text-red-500'} flex items-center gap-2 uppercase tracking-widest`}>
                        {hasJetpack ? <Rocket size={14} className={jetpackMode !== 'IDLE' ? 'animate-bounce' : ''} /> : <Lock size={14} />} Thrusters
                    </span>
                    <span className="text-base font-mono font-black text-white neon-text-cyan">
                        {hasJetpack ? Math.floor(gameState.fuel) : 'LOCKED'}
                        {hasJetpack && <span className="text-[10px] text-cyan-600 ml-0.5">%</span>}
                    </span>
                </div>
                <div className="h-32 bg-slate-900/50 rounded border border-slate-700 relative overflow-hidden w-full p-1">
                    <div className="absolute top-1/4 w-full h-px bg-slate-600/30 z-10"></div>
                    <div className="absolute top-2/4 w-full h-px bg-slate-600/30 z-10"></div>
                    <div className="absolute top-3/4 w-full h-px bg-slate-600/30 z-10"></div>
                    {hasJetpack ? (
                        <div className={`absolute bottom-1 left-1 right-1 rounded-sm transition-all duration-100 ease-linear ${gameState.fuel < 20 ? 'bg-gradient-to-t from-red-900 to-red-500 shadow-[0_0_15px_#ef4444]' : jetpackMode === 'BURST' ? 'bg-gradient-to-t from-orange-900 to-orange-500 shadow-[0_0_15px_#f97316]' : 'bg-gradient-to-t from-cyan-900 to-cyan-400 shadow-[0_0_10px_#06b6d4]'}`} style={{ height: `${Math.min(100, (gameState.fuel / (currentMaxFuel || 1)) * 100)}%` }}>
                            <div className="absolute inset-0 w-full h-full opacity-50 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-900/50">
                            <XOctagon size={32} />
                            <div className="text-[8px] font-black mt-2 tracking-widest text-center leading-tight">INSTALL<br />MODULE</div>
                        </div>
                    )}
                </div>
            </div>
            {/* Removed duplicate Bank section */}
            <div className="mt-auto bg-cyan-950/20 border border-cyan-500/20 p-3 rounded-lg text-[10px] text-cyan-300/80 leading-relaxed font-mono">
                <p className="mb-2 font-bold text-cyan-400 uppercase flex items-center gap-2"><Battery size={12} /> FLIGHT PROTOCOLS</p>
                <ul className="space-y-2 list-disc list-inside opacity-90">
                    {hasJetpack ? <li>Hold <span className="text-white font-bold">SHIFT</span> to Fly.</li> : <li className="text-red-400 font-bold">Jetpack Locked.</li>}
                    <li><span className="text-blue-400 font-bold">Blue</span> = Fuel.</li>
                    <li><span className="text-yellow-400 font-bold">Yellow</span> = Credits.</li>
                </ul>
            </div>
        </div>
    );
};
