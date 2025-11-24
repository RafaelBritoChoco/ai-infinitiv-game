import React, { useState, useEffect, useRef } from 'react';
import {
    Play, Move, Trash2, PlusSquare, Save, AlertTriangle, Pause, RefreshCw, Smartphone, Gamepad2, Rocket, Lock, Trophy, Coins, XOctagon,
    ToggleLeft, ToggleRight, X, Settings, Download, MapPin, Shuffle, Crown, Keyboard, Zap, Battery, ChevronsUp, Wind, TrendingUp,
    ArrowLeft, ShoppingBag, Home, Sparkles, Wand2, Maximize, RotateCcw, ChevronLeft, ChevronRight, ArrowUp, Shield, HelpCircle,
    Layers, Globe, Check, MousePointer2, ArrowDown, Heart, Unlock, Loader2
} from 'lucide-react';
import { CharacterSkin, GameState, LeaderboardEntry, ShopUpgrades } from '../../types';
import { soundManager } from './audioManager';
import * as Constants from '../../constants';

export const SensorDebugModal = ({ onClose }: { onClose: () => void }) => {
    const [orientation, setOrientation] = useState<any>({});
    const [absolute, setAbsolute] = useState<any>({});
    const [motion, setMotion] = useState<any>({});
    const [counts, setCounts] = useState({ orient: 0, abs: 0, motion: 0 });
    const [perms, setPerms] = useState<string>("Unknown");

    useEffect(() => {
        const handleOrient = (e: DeviceOrientationEvent) => {
            setOrientation({ a: e.alpha, b: e.beta, g: e.gamma, abs: e.absolute });
            setCounts(p => ({ ...p, orient: p.orient + 1 }));
        };
        const handleAbs = (e: any) => {
            setAbsolute({ a: e.alpha, b: e.beta, g: e.gamma, abs: e.absolute });
            setCounts(p => ({ ...p, abs: p.abs + 1 }));
        };
        const handleMotion = (e: DeviceMotionEvent) => {
            setMotion({
                acc: e.acceleration,
                accG: e.accelerationIncludingGravity,
                rot: e.rotationRate
            });
            setCounts(p => ({ ...p, motion: p.motion + 1 }));
        };

        window.addEventListener('deviceorientation', handleOrient);
        window.addEventListener('deviceorientationabsolute', handleAbs);
        window.addEventListener('devicemotion', handleMotion);

        return () => {
            window.removeEventListener('deviceorientation', handleOrient);
            window.removeEventListener('deviceorientationabsolute', handleAbs);
            window.removeEventListener('devicemotion', handleMotion);
        };
    }, []);

    const requestPerms = async () => {
        try {
            if ((DeviceOrientationEvent as any).requestPermission) {
                const r = await (DeviceOrientationEvent as any).requestPermission();
                setPerms(r);
                alert(`Permission: ${r}`);
            } else {
                setPerms("N/A (Android/Desktop)");
            }
        } catch (e: any) {
            setPerms(`Error: ${e.message}`);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/95 text-white p-6 overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h2 className="text-xl font-bold text-cyan-400">SENSOR DIAGNOSTICS</h2>
                <button onClick={onClose} className="p-2 bg-red-900/50 text-red-200 rounded"><X size={20} /></button>
            </div>

            <div className="space-y-4">
                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-yellow-400 mb-2">ENVIRONMENT</h3>
                    <div>Secure Context (HTTPS): <span className={window.isSecureContext ? "text-green-400" : "text-red-500"}>{window.isSecureContext ? "YES" : "NO"}</span></div>
                    <div>User Agent: {navigator.userAgent}</div>
                    <div>Permission State: {perms}</div>
                    <button onClick={requestPerms} className="mt-2 px-3 py-1 bg-blue-900 text-blue-200 rounded border border-blue-700">Request Permission</button>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-cyan-400 mb-2">DEVICE ORIENTATION (Standard)</h3>
                    <div>Events Fired: {counts.orient}</div>
                    <div>Alpha (Compass): {orientation.a?.toFixed(2)}</div>
                    <div>Beta (Front/Back): {orientation.b?.toFixed(2)}</div>
                    <div>Gamma (Left/Right): {orientation.g?.toFixed(2)}</div>
                    <div>Absolute: {orientation.abs ? "YES" : "NO"}</div>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-purple-400 mb-2">ORIENTATION ABSOLUTE (Android)</h3>
                    <div>Events Fired: {counts.abs}</div>
                    <div>Alpha: {absolute.a?.toFixed(2)}</div>
                    <div>Beta: {absolute.b?.toFixed(2)}</div>
                    <div>Gamma: {absolute.g?.toFixed(2)}</div>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-green-400 mb-2">DEVICE MOTION (Accel)</h3>
                    <div>Events Fired: {counts.motion}</div>
                    <div>AccG X: {motion.accG?.x?.toFixed(2)}</div>
                    <div>AccG Y: {motion.accG?.y?.toFixed(2)}</div>
                    <div>AccG Z: {motion.accG?.z?.toFixed(2)}</div>
                </div>
            </div>
        </div>
    );
};

const InstallButton = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [debugStatus, setDebugStatus] = useState("Initializing...");
    const [swStatus, setSwStatus] = useState("Checking...");

    const registerSW = async () => {
        if ('serviceWorker' in navigator) {
            try {
                // Try to register explicitly (Vite PWA usually does this, but we force it for debug)
                // The sw.js file is generated by vite-plugin-pwa at the root
                const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
                setSwStatus(`Registered (${reg.scope})`);
                // console.log('SW Registered:', reg);
            } catch (err: any) {
                setSwStatus(`Error: ${err.message}`);
                console.error('SW Error:', err);
            }
        } else {
            setSwStatus("Not Supported");
        }
    };

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setDebugStatus("Ready to Install");
        };
        window.addEventListener('beforeinstallprompt', handler);

        const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(ios);
        if (ios) setDebugStatus("iOS Device Detected");
        else if (!deferredPrompt) setDebugStatus("Waiting for Prompt...");

        // Check Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(regs => {
                if (regs.length > 0) {
                    setSwStatus(`Active (${regs.length})`);
                } else {
                    setSwStatus("None Found - Attempting Register...");
                    registerSW();
                }
            });
        } else {
            setSwStatus("Not Supported");
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [deferredPrompt]);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
            }
        } else if (isIOS) {
            setShowIOSPrompt(true);
        }
    };

    if (!deferredPrompt && !isIOS) {
        return (
            <div className="w-full mt-2">
                <button disabled className="w-full py-3 bg-slate-900/50 text-slate-600 font-bold rounded-xl border border-slate-800 flex items-center justify-center gap-2 uppercase tracking-wider cursor-not-allowed">
                    <Download size={18} /> Install Unavailable
                </button>
                <div className="text-[10px] text-slate-600 text-center mt-1 font-mono">
                    Status: {debugStatus}<br />
                    SW: {swStatus}
                </div>
                {swStatus.includes("Error") || swStatus.includes("None") ? (
                    <button onClick={registerSW} className="w-full mt-1 py-1 bg-red-900/30 text-red-400 text-[10px] rounded border border-red-800">
                        FORCE REGISTER SW
                    </button>
                ) : null}

                {/* FORCE UPDATE BUTTON (Cache Buster) */}
                <button
                    onClick={async () => {
                        if ('serviceWorker' in navigator) {
                            const registrations = await navigator.serviceWorker.getRegistrations();
                            for (const registration of registrations) {
                                await registration.unregister();
                            }
                            window.location.reload();
                        }
                    }}
                    className="w-full mt-2 py-2 bg-red-900/20 text-red-500 text-[10px] font-bold uppercase tracking-widest rounded border border-red-900/30 hover:bg-red-900/40 transition-colors"
                >
                    ⚠️ Force Update (Fix v4.1)
                </button>
            </div >
        );
    }

    return (
        <>
            <button
                onClick={handleInstall}
                className="w-full py-3 bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 font-bold rounded-xl border border-purple-500/30 flex items-center justify-center gap-2 uppercase tracking-wider transition-all mt-2"
            >
                <Download size={18} className="animate-bounce" /> {isIOS ? "Install App" : "Install App"}
            </button>

            {showIOSPrompt && (
                <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur flex items-center justify-center p-6" onClick={() => setShowIOSPrompt(false)}>
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-sm text-center relative">
                        <div className="absolute top-4 right-4 text-slate-500"><X size={20} /></div>
                        <h3 className="text-xl font-bold text-white mb-4">Install on iOS</h3>
                        <p className="text-slate-300 mb-4 text-sm">To install this app on your iPhone/iPad:</p>
                        <ol className="text-left text-slate-400 text-sm space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                            <li className="flex items-center gap-2">1. Tap the <span className="text-blue-400 font-bold">Share</span> button <span className="bg-slate-800 p-1 rounded"><Download size={12} /></span></li>
                            <li className="flex items-center gap-2">2. Scroll down and tap <span className="text-white font-bold">Add to Home Screen</span></li>
                        </ol>
                    </div>
                </div>
            )}
        </>
    );
};

export const SideBarMetric = ({ label, value, icon: Icon, color, glowColor }: any) => (
    <div className="relative group" onMouseEnter={() => soundManager.playHover()}>
        <div className={`absolute inset-0 bg-${glowColor}-500/10 blur-md rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
        <div className="bg-black/60 backdrop-blur-md border border-white/10 p-3 rounded-lg mb-3 relative overflow-hidden">
            <div className={`absolute top-0 right-0 p-1 opacity-20 text-${glowColor}-500`}>
                <Icon size={28} strokeWidth={1} />
            </div>
            <div className={`text-xs font-bold text-${glowColor}-400 flex items-center gap-1.5 mb-1 uppercase tracking-[0.1em]`}>
                <Icon size={12} className={`text-${glowColor}-400`} /> {label}
            </div>
            <div className="text-xl font-black tracking-tighter text-white neon-text-cyan drop-shadow-md">{value}</div>
        </div>
    </div>
);

export const CharacterPreview = ({ skin }: { skin: CharacterSkin }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !skin || !skin.pixels) {
            // Clear if no skin data
            if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
            return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        const pixelSize = canvas.width / 16;
        skin.pixels.forEach((row, r) => {
            row.forEach((val, c) => {
                if (val === 0) return;
                if (val === 1) ctx.fillStyle = '#0f172a';
                else if (val === 2) ctx.fillStyle = skin.color;
                else if (val === 3) ctx.fillStyle = '#ffffff';
                else if (val === 4) ctx.fillStyle = '#ffffff';
                else if (val === 5) ctx.fillStyle = '#000000';
                else if (val === 6) ctx.fillStyle = '#facc15';
                ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize, pixelSize);
            });
        });
    }, [skin]);
    return (
        <div className="w-24 h-24 bg-slate-900/80 border-2 border-slate-700 rounded-xl flex items-center justify-center shadow-inner">
            <canvas ref={canvasRef} width={64} height={64} className="w-16 h-16 drop-shadow-xl" style={{ imageRendering: 'pixelated' }} />
        </div>
    );
};

export const TouchControls = ({ inputRef, mode, layout = { scale: 1, x: 0, y: 0 }, gameState, onOpenSettings }: { inputRef: any, mode: 'BUTTONS' | 'TILT' | 'JOYSTICK', layout?: any, gameState?: any, onOpenSettings?: () => void }) => {
    // Don't render if not playing, or if in JOYSTICK mode (VirtualJoystick handles that)
    // Strict Rendering Check
    if (!gameState?.isPlaying || gameState?.isGameOver || gameState?.isPaused) {
        return null;
    }

    const handleTouch = (key: string, pressed: boolean) => {
        if (!inputRef.current) return;
        if (key === 'left') inputRef.current.left = pressed;
        if (key === 'right') inputRef.current.right = pressed;
        if (key === 'jump') { inputRef.current.jumpIntent = pressed; if (pressed) inputRef.current.jumpPressedTime = Date.now(); }
        if (key === 'jetpack') { inputRef.current.jetpack = pressed; }
    };

    const containerStyle = {
        paddingBottom: `calc(env(safe-area-inset-bottom, 24px) + ${layout.y}px)`,
        transform: `scale(${layout.scale})`,
        transformOrigin: 'bottom center',
        paddingLeft: `${24 + layout.x}px`,
        paddingRight: `${24 - layout.x}px`
    };

    // COMMON DEV BUTTON (Safe Zone - Top Left)
    const DevButton = () => (
        <div className="absolute top-6 left-6 pointer-events-auto" style={{ zIndex: Constants.Z_LAYERS.MODAL }}>
            <button
                onClick={onOpenSettings}
                className="px-3 py-2 bg-purple-900/70 border border-purple-500/60 rounded-lg backdrop-blur-md text-purple-300 font-bold text-xs uppercase tracking-widest hover:bg-purple-800/90 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all shadow-lg flex items-center gap-1.5"
            >
                <Settings size={14} /> DEV
            </button>
        </div>
    );



    // --- TILT MODE: Bubble Level + Action Buttons ---
    if (mode === 'TILT') {
        // Calculate bubble position based on tiltX (accessed via inputRef for visualization)
        const tiltX = inputRef.current?.tiltX || 0;
        const bubblePos = Math.max(-50, Math.min(50, tiltX * 50)); // Clamp to +/- 50px
        const isLevel = Math.abs(tiltX) < 0.1;

        return (
            <div className="absolute inset-0 pointer-events-none z-[100] flex flex-col justify-end" style={containerStyle}>
                {/* Center: Bubble Level Indicator */}
                <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-80">
                    <div className="w-48 h-4 bg-slate-900/80 rounded-full border border-slate-600 relative overflow-hidden shadow-lg backdrop-blur-sm">
                        {/* Center Marker */}
                        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-8 bg-slate-700/50 border-x border-slate-500/30"></div>
                        {/* The Bubble */}
                        <div
                            className={`absolute top-0.5 bottom-0.5 w-8 rounded-full transition-transform duration-100 will-change-transform ${isLevel ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-cyan-400'}`}
                            style={{
                                left: '50%',
                                marginLeft: '-16px', // Half width to center
                                transform: `translateX(${bubblePos}px)`
                            }}
                        ></div>
                    </div>
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${isLevel ? 'text-green-400' : 'text-slate-500'}`}>
                        {isLevel ? 'LEVEL' : 'TILT TO STEER'}
                    </span>
                    {/* DEBUG OVERLAY */}
                    <div className="mt-2 text-[10px] font-mono text-cyan-500 bg-black/50 px-2 py-1 rounded">
                        RAW: {inputRef.current?.lastDebugValue?.toFixed(2) || '0.00'}
                    </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex justify-end items-end w-full mb-4 px-6">
                    <div className="flex gap-8">
                        {/* Jump Button */}
                        <button
                            className="pointer-events-auto w-20 h-20 bg-cyan-900/40 border-2 border-cyan-500/50 rounded-full flex items-center justify-center active:bg-cyan-500/50 active:scale-95 transition-all backdrop-blur-sm"
                            onTouchStart={(e) => { e.preventDefault(); handleTouch('jump', true); }}
                            onTouchEnd={(e) => { e.preventDefault(); handleTouch('jump', false); }}
                        >
                            <ArrowUp size={32} className="text-cyan-200" />
                        </button>

                        {/* Jetpack Button */}
                        <button
                            className="pointer-events-auto w-24 h-24 bg-purple-900/40 border-2 border-purple-500/50 rounded-full flex items-center justify-center active:bg-purple-500/50 active:scale-95 transition-all backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                            onTouchStart={(e) => { e.preventDefault(); handleTouch('jetpack', true); }}
                            onTouchEnd={(e) => { e.preventDefault(); handleTouch('jetpack', false); }}
                        >
                            <div className="flex flex-col items-center">
                                <Rocket size={32} className="text-purple-200" />
                                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider mt-1">FLY</span>
                            </div>
                        </button>
                    </div>
                </div>

                <DevButton />

                {/* Version Overlay */}
                <div className="absolute bottom-1 right-1 text-[10px] text-slate-600 font-mono opacity-50 pointer-events-none">
                    {Constants.APP_VERSION}
                </div>
            </div>
        );
    }

    // --- JOYSTICK MODE: Action Buttons ONLY (Joystick is separate) ---
    if (mode === 'JOYSTICK') {
        return (
            <div className="absolute inset-0 pointer-events-none z-[100]" style={containerStyle}>
                <DevButton />

                {/* Version Overlay */}
                <div className="absolute bottom-1 right-1 text-[10px] text-slate-600 font-mono opacity-50 pointer-events-none">
                    {Constants.APP_VERSION}
                </div>

                <div className="absolute bottom-8 right-8 flex flex-col gap-4 items-center pointer-events-auto">
                    {/* Jetpack (Top) */}
                    <button
                        className="w-16 h-16 bg-purple-900/40 border-2 border-purple-500/50 rounded-full flex items-center justify-center active:bg-purple-500/50 active:scale-95 transition-all backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        onTouchStart={(e) => { e.preventDefault(); handleTouch('jetpack', true); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleTouch('jetpack', false); }}
                    >
                        <Rocket size={24} className="text-purple-200" />
                    </button>

                    {/* Jump (Bottom) */}
                    <button
                        className="w-20 h-20 bg-cyan-900/40 border-2 border-cyan-500/50 rounded-full flex items-center justify-center active:bg-cyan-500/50 active:scale-95 transition-all backdrop-blur-sm"
                        onTouchStart={(e) => { e.preventDefault(); handleTouch('jump', true); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleTouch('jump', false); }}
                    >
                        <ArrowUp size={32} className="text-cyan-200" />
                    </button>
                </div>
            </div>
        );
    }

    // --- BUTTONS MODE: Arrows + Actions ---
    const transformStyle = {
        transform: `translate(${layout.x}px, ${layout.y}px)`
    };

    return (
        <div className="absolute inset-0 pointer-events-none z-[100] flex flex-col justify-end" style={{ ...containerStyle, ...transformStyle }}>
            <div className="flex justify-between items-end w-full mb-4 px-6">
                {/* Left: Arrows */}
                <div className="flex gap-8 pointer-events-auto">
                    <button
                        className="w-20 h-20 bg-slate-900/40 border-2 border-slate-500/50 rounded-full flex items-center justify-center active:bg-slate-700/50 active:scale-95 transition-all backdrop-blur-sm"
                        onTouchStart={(e) => { e.preventDefault(); handleTouch('left', true); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleTouch('left', false); }}
                    >
                        <ChevronLeft size={32} className="text-white" />
                    </button>
                    <button
                        className="w-20 h-20 bg-slate-900/40 border-2 border-slate-500/50 rounded-full flex items-center justify-center active:bg-slate-700/50 active:scale-95 transition-all backdrop-blur-sm"
                        onTouchStart={(e) => { e.preventDefault(); handleTouch('right', true); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleTouch('right', false); }}
                    >
                        <ChevronRight size={32} className="text-white" />
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex gap-8 pointer-events-auto">
                    <button
                        className="w-20 h-20 bg-cyan-900/40 border-2 border-cyan-500/50 rounded-full flex items-center justify-center active:bg-cyan-500/50 active:scale-95 transition-all backdrop-blur-sm"
                        onTouchStart={(e) => { e.preventDefault(); handleTouch('jump', true); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleTouch('jump', false); }}
                    >
                        <ArrowUp size={32} className="text-cyan-200" />
                    </button>
                    <button
                        className="w-24 h-24 bg-purple-900/40 border-2 border-purple-500/50 rounded-full flex items-center justify-center active:bg-purple-500/50 active:scale-95 transition-all backdrop-blur-sm shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                        onTouchStart={(e) => { e.preventDefault(); handleTouch('jetpack', true); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleTouch('jetpack', false); }}
                    >
                        <Rocket size={32} className="text-purple-200" />
                    </button>
                </div>
            </div>

            <DevButton />

            {/* Version Overlay */}
            <div className="absolute bottom-1 right-1 text-[10px] text-slate-600 font-mono opacity-50 pointer-events-none">
                {Constants.APP_VERSION}
            </div>
        </div>
    );
};

// ====================================================================================
// DEVELOPER CONSOLE - Real-Time Game Tweaker
// ====================================================================================

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
                            🛠️ DEV CONSOLE
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <X size={24} />
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Changes apply instantly ⚡</p>
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
                        ⚡ PHYSICS
                    </button>
                    <button
                        onClick={() => setActiveTab('controls')}
                        className={`flex-1 py-2 px-3 rounded text-xs font-bold ${activeTab === 'controls'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        🎮 CONTROLS
                    </button>
                    <button
                        onClick={() => setActiveTab('visual')}
                        className={`flex-1 py-2 px-3 rounded text-xs font-bold ${activeTab === 'visual'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                    >
                        ✨ VISUAL
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
                                <div className="flex justify-between text-[10px] text-slate-600 mt-1">
                                    <span>Slow</span>
                                    <span>Default (1.8)</span>
                                    <span>Fast</span>
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
                        🔄 RESET TO DEFAULTS
                    </button>
                </div>
            </div>
        </>
    );
};

// Keep old CalibrationModal name for compatibility but it's actually DevConsole now
export const CalibrationModal = DevConsole;

// ====================================================================================
// LEFT SIDEBAR
// ====================================================================================

// LeftSidebar, RightSidebar, etc. remain mostly unchanged but ensuring clean exports
export const LeftSidebar = ({ gameState, config, gamepadConnected, leaderboard }: any) => (
    <div className="hidden md:flex w-48 flex-col p-4 border-r border-cyan-900/30 bg-black/80 backdrop-blur-xl z-10 shadow-[5px_0_30px_rgba(0,0,0,0.5)]">
        <div className="mb-6 relative px-1 pt-1">
            <h1 className="text-3xl font-black text-white tracking-tighter italic neon-text-cyan leading-none">
                AI<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">INFINITIV</span>
            </h1>
            <div className="text-xs text-cyan-600 font-mono mt-2 font-bold flex items-center gap-1">
                {gameState.levelType === 'RANDOM' ? <Shuffle size={10} /> : <MapPin size={10} />}
                {gameState.levelType === 'RANDOM' ? 'RANDOM SEC' : `SEC ${gameState.levelIndex}`}
            </div>
        </div>
        <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-2">
            <SideBarMetric label="Score" value={`${gameState.score}m`} icon={Trophy} color="yellow" glowColor="yellow" />
            <SideBarMetric label="Coins" value={gameState.runCoins} icon={Coins} color="yellow" glowColor="yellow" />
            {gameState.upgrades.shield > 0 && (
                <div className="bg-blue-900/30 border border-blue-500/30 p-3 rounded-lg mb-3 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <div className="text-xs font-bold text-blue-400 flex items-center gap-2 mb-1 uppercase tracking-wider">
                        <Shield size={14} /> SHIELD ACTIVE
                    </div>
                    <div className="text-white font-mono text-sm font-bold">CHARGES: {gameState.upgrades.shield}</div>
                </div>
            )}
            <div className="bg-black/40 backdrop-blur-md border border-white/10 p-3 rounded-lg mb-3" onMouseEnter={() => soundManager.playHover()}>
                <div className="text-xs font-bold text-pink-500 flex items-center gap-2 mb-2 uppercase tracking-[0.1em]">
                    <Heart size={14} /> INTEGRITY
                </div>
                <div className="flex gap-2">
                    {[...Array(gameState.maxHealth)].map((_, i) => (
                        <div key={i} className={`relative transition-all duration-300 ${i < gameState.health ? "scale-100" : "scale-90 opacity-30 grayscale"}`}>
                            <Heart size={20} className={i < gameState.health ? "text-pink-500 fill-pink-500 drop-shadow-[0_0_5px_rgba(236,72,153,0.8)]" : "text-slate-700"} />
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-6 border-t border-white/10 pt-3">
                <div className="text-xs text-slate-500 font-bold tracking-[0.2em] uppercase mb-3 flex items-center gap-2">
                    <Crown size={14} className="text-yellow-500" /> Top Agents
                </div>
                <div className="space-y-2">
                    {leaderboard && leaderboard.length > 0 ? (
                        leaderboard.map((entry: LeaderboardEntry, i: number) => (
                            <div key={entry.id} className="flex justify-between items-center text-xs p-2 bg-slate-900/50 rounded border border-slate-800 hover:border-slate-600 transition-colors">
                                <div className="flex gap-2 items-center">
                                    <span className={`${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : 'text-amber-700'} font-bold font-mono w-4`}>#{i + 1}</span>
                                    <span className="text-slate-300 font-bold truncate max-w-[80px]">{entry.name}</span>
                                </div>
                                <span className="font-mono text-cyan-400 font-bold">{entry.score}m</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-xs text-slate-600 italic p-1">No Data</div>
                    )}
                </div>
            </div>
        </div>
        <div className="mt-auto pt-3 border-t border-white/10">
            {gamepadConnected && (
                <div className="mb-2 text-[10px] text-green-500 font-mono font-bold uppercase tracking-widest flex items-center gap-2 animate-pulse">
                    <Gamepad2 size={14} /> Gamepad Active
                </div>
            )}
            <div className="text-[10px] text-slate-500 space-y-1 font-mono font-bold">
                <div className="flex items-center gap-2"><Keyboard size={12} /> <span className="text-cyan-500/70">SPACE: JUMP</span></div>
                <div className="flex items-center gap-2"><Keyboard size={12} /> <span className="text-purple-500/70">SHIFT: JETPACK</span></div>
            </div>
        </div>
    </div>
);

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
            <div className="mb-auto bg-slate-900/50 border border-yellow-500/20 p-3 rounded-lg flex items-center justify-between">
                <div className="text-xs font-bold text-yellow-500 flex items-center gap-2"><Coins size={14} /> BANK</div>
                <div className="text-lg font-black text-white">{gameState.totalCoins}</div>
            </div>
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

export const ShopModal = ({ gameState, setGameState, selectedIndex = -1 }: any) => {
    const getFuelUpgradeName = (level: number) => level === 0 ? "UNLOCK JETPACK" : "TANK EXPANSION";
    const upgrades = [
        { id: 'maxFuel', name: getFuelUpgradeName(gameState.upgrades.maxFuel), icon: Rocket, desc: gameState.upgrades.maxFuel === 0 ? 'Install standard thruster system.' : 'Increases Max Fuel Capacity.', bonus: `+${Constants.UPGRADE_FUEL_BONUS} Capacity`, color: 'cyan', type: 'upgrade' },
        { id: 'efficiency', name: 'ION THRUSTER', icon: Zap, desc: 'Reduces fuel consumption.', bonus: `Burn Rate -${Math.round(Constants.UPGRADE_EFFICIENCY_BONUS * 100)}%`, color: 'purple', type: 'upgrade' },
        { id: 'jump', name: 'HYDRAULIC BOOTS', icon: ChevronsUp, desc: 'Increases Platform Jump Height.', bonus: `+${Constants.UPGRADE_JUMP_BONUS} Jump Force`, color: 'orange', type: 'upgrade' },
        { id: 'aerodynamics', name: 'AERODYNAMICS', icon: Wind, desc: 'Reduces air drag when ascending.', bonus: '+Air Agility', color: 'teal', type: 'upgrade' },
        { id: 'luck', name: 'SCAVENGER AI', icon: TrendingUp, desc: 'Find more Coins & Fuel.', bonus: `+${Math.round(Constants.UPGRADE_LUCK_BONUS * 100)}% Spawn Rate`, color: 'green', type: 'upgrade' },
        { id: 'shield', name: 'VOID SHIELD', icon: Shield, desc: 'Emergency rescue from the void.', bonus: 'Prevents Death (1x)', color: 'blue', type: 'consumable', cost: Constants.ITEM_SHIELD_COST, max: 3 },
    ];

    const buyUpgrade = (id: keyof ShopUpgrades, type: string, flatCost?: number, maxLimit?: number) => {
        const currentLevel = gameState.upgrades[id];
        let cost = type === 'consumable' ? (flatCost || 100) : Math.floor(Constants.UPGRADE_COST_BASE * Math.pow(Constants.UPGRADE_COST_SCALE, currentLevel));
        const limit = maxLimit || 5;
        if (gameState.totalCoins >= cost && currentLevel < limit) {
            soundManager.playCollect();
            setGameState((prev: any) => ({ ...prev, totalCoins: prev.totalCoins - cost, upgrades: { ...prev.upgrades, [id]: prev.upgrades[id] + 1 } }));
        } else { soundManager.playDamage(); }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="max-w-5xl w-full bg-[#020617] border border-cyan-500/30 rounded-2xl shadow-[0_0_100px_rgba(6,182,212,0.15)] flex flex-col max-h-[90vh] relative overflow-hidden">
                <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0 relative">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setGameState((prev: any) => ({ ...prev, isShopOpen: false }))} className="p-3 bg-slate-800 hover:bg-red-900/50 text-slate-400 hover:text-white rounded-full transition-all">
                            <ArrowLeft size={28} />
                        </button>
                        <div>
                            <h2 className="text-4xl font-black text-white italic tracking-tighter flex items-center gap-3">
                                <ShoppingBag className="text-cyan-400" size={32} /> NEON DEPOT
                            </h2>
                            <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">A - BUY <span className="mx-2">|</span> B - EXIT</p>
                        </div>
                    </div>
                    <div className="bg-black border border-yellow-500/50 px-6 py-3 rounded-full flex items-center gap-3 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                        <Coins className="text-yellow-400" size={24} />
                        <span className="text-3xl font-black text-white">{gameState.totalCoins}</span>
                    </div>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 overflow-y-auto custom-scrollbar bg-[#020617]">
                    {upgrades.map((u, idx) => {
                        const level = gameState.upgrades[u.id as keyof ShopUpgrades];
                        const isConsumable = u.type === 'consumable';
                        const limit = u.max || 5;
                        const isMaxed = level >= limit;
                        let cost = isConsumable ? (u.cost || 100) : Math.floor(Constants.UPGRADE_COST_BASE * Math.pow(Constants.UPGRADE_COST_SCALE, level));
                        const canAfford = gameState.totalCoins >= cost;
                        const isSelected = idx === selectedIndex;
                        return (
                            <div key={u.id} onClick={() => buyUpgrade(u.id as keyof ShopUpgrades, u.type, u.cost, u.max)} className={`relative bg-slate-900/80 border rounded-xl p-5 flex flex-col transition-all group cursor-pointer ${isSelected ? `border-${u.color}-400 ring-2 ring-${u.color}-400 scale-105 z-10 shadow-[0_0_40px_rgba(0,0,0,0.8)]` : 'border-slate-800 hover:bg-slate-800'}`}>
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-14 h-14 rounded-xl bg-${u.color}-900/20 flex items-center justify-center text-${u.color}-400 border border-${u.color}-500/20 ${isSelected ? 'scale-110' : ''}`}><u.icon size={28} /></div>
                                    <div className={`text-${u.color}-400 text-xs font-bold bg-${u.color}-950/30 px-2 py-1.5 rounded border border-${u.color}-900/50`}>{u.bonus}</div>
                                </div>
                                <h3 className="text-white font-bold text-lg uppercase tracking-tight">{u.name}</h3>
                                <p className="text-slate-500 text-sm mb-4 min-h-[40px] leading-snug">{u.desc}</p>
                                <div className="flex gap-1.5 mb-5 items-center">
                                    {isConsumable ? (
                                        <div className="text-slate-400 font-mono text-sm">OWNED: <span className={`text-white font-bold text-base ${level > 0 ? 'text-blue-400' : ''}`}>{level}</span> / {limit}</div>
                                    ) : (
                                        [...Array(5)].map((_, i) => (<div key={i} className={`h-2 flex-1 rounded-full transition-all duration-300 ${i < level ? `bg-${u.color}-500 shadow-[0_0_5px_${u.color}]` : 'bg-slate-800'}`}></div>))
                                    )}
                                </div>
                                <div className={`mt-auto py-4 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all uppercase tracking-widest ${isMaxed ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : canAfford ? `bg-${u.color}-600 text-white shadow-lg` : 'bg-slate-900 text-slate-600 border border-slate-800 opacity-70'}`}>
                                    {isMaxed ? "MAX LEVEL" : <>{isConsumable ? "BUY" : "UPGRADE"} <span className="text-white/30">|</span> {cost} <Coins size={16} /></>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const PauseMenu = ({ setGameState, handleStart, selectedIndex = 0, onOpenCalibration, onOpenSettings }: any) => (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
            {/* TITLE */}
            <div className="text-center mb-8">
                <h2 className="text-5xl font-black italic text-white mb-2 tracking-tight">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">PAUSED</span>
                </h2>
                <p className="text-slate-400 text-sm uppercase tracking-widest">Mission On Hold</p>
            </div>

            {/* MENU BUTTONS */}
            <div className="space-y-3">
                <button
                    onClick={() => setGameState((prev: any) => ({ ...prev, isPaused: false }))}
                    className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-black text-lg uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-cyan-500/30"
                >
                    ▶ CONTINUAR
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

export const ControlsModal = ({ onClose, currentMode, setMobileControlMode, onCalibrate, onOpenLayoutEditor, rotationLock, setRotationLock }: any) => {
    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in zoom-in duration-200">
            <div className="max-w-lg w-full bg-[#020617] border border-cyan-500/30 rounded-2xl shadow-[0_0_100px_rgba(6,182,212,0.15)] flex flex-col relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="p-6 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-white italic tracking-tighter flex items-center gap-3"><Keyboard className="text-cyan-400" size={24} /> CONTROLS</h2>
                    <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-all text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold uppercase tracking-widest flex items-center gap-2"><Smartphone size={16} /> Touch Control Mode</span>
                            <div className="flex gap-2">
                                <button onClick={() => setMobileControlMode('BUTTONS')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${currentMode === 'BUTTONS' ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                    BUTTONS
                                </button>
                                <button onClick={() => setMobileControlMode('TILT')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${currentMode === 'TILT' ? 'bg-purple-600 text-white border-purple-500 shadow-lg' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                    TILT
                                </button>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono leading-relaxed">{currentMode === 'TILT' ? "Tilt device to move. FLY Button on LEFT, JUMP Button on RIGHT." : "Use standard D-Pad and Action buttons."}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {currentMode === 'TILT' && (
                            <button
                                onClick={onCalibrate}
                                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold text-white uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                            >
                                <Settings size={16} /> Calibrate Sensitivity
                            </button>
                        )}

                        <button
                            onClick={onOpenLayoutEditor}
                            className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-xl font-bold text-white uppercase tracking-widest text-sm flex items-center justify-center gap-2"
                        >
                            <Move size={16} /> Customize Layout
                        </button>

                        <button
                            onClick={() => setRotationLock(!rotationLock)}
                            className={`w-full py-3 border rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 ${rotationLock ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                        >
                            {rotationLock ? <Lock size={16} /> : <Unlock size={16} />}
                            {rotationLock ? "Rotation Locked" : "Rotation Unlocked"}
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-800">
                            <span className="text-slate-300 font-bold text-sm uppercase tracking-widest">Move Left/Right</span>
                            <div className="flex gap-2"><span className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono font-bold text-cyan-400">A / D</span><span className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono font-bold text-cyan-400">← / →</span></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-800">
                            <span className="text-slate-300 font-bold text-sm uppercase tracking-widest">Jump</span>
                            <div className="flex gap-2"><span className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono font-bold text-cyan-400">SPACE</span><span className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono font-bold text-cyan-400">W</span></div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded border border-slate-800">
                            <span className="text-purple-300 font-bold text-sm uppercase tracking-widest">Jetpack / Fly</span>
                            <div className="flex gap-2"><span className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono font-bold text-purple-400">SHIFT</span><span className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs font-mono font-bold text-purple-400">Z</span></div>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-slate-950 border-t border-slate-800 text-center">
                    <button onClick={onClose} className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded uppercase tracking-widest transition-all">Close</button>
                </div>
            </div>
        </div>
    );
}

export const LayoutEditorModal = ({ onClose, layout, onSave }: any) => {
    const [settings, setSettings] = useState(layout || { scale: 1, x: 0, y: 0 });

    return (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex flex-col justify-end p-6">
            <div className="bg-[#020617] border border-cyan-500/30 rounded-2xl shadow-2xl p-6 mb-20 animate-in slide-in-from-bottom-10">
                <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2"><Move size={20} className="text-cyan-400" /> CUSTOMIZE CONTROLS</h2>

                <div className="space-y-4">
                    <div className="bg-slate-900 p-3 rounded border border-slate-800">
                        <div className="flex justify-between mb-2 text-xs font-bold text-slate-400">
                            <span>SIZE (Scale)</span>
                            <span>{settings.scale.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range" min="0.5" max="1.5" step="0.1" value={settings.scale}
                            onChange={(e) => setSettings({ ...settings, scale: parseFloat(e.target.value) })}
                            className="w-full accent-cyan-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="bg-slate-900 p-3 rounded border border-slate-800">
                        <div className="flex justify-between mb-2 text-xs font-bold text-slate-400">
                            <span>VERTICAL OFFSET</span>
                            <span>{settings.y}px</span>
                        </div>
                        <input
                            type="range" min="0" max="200" step="5" value={settings.y}
                            onChange={(e) => setSettings({ ...settings, y: parseInt(e.target.value) })}
                            className="w-full accent-cyan-500 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    <div className="bg-slate-900 p-3 rounded border border-slate-800">
                        <div className="flex justify-between mb-2 text-xs font-bold text-slate-400">
                            <span>HORIZONTAL SPACING</span>
                            <span>{settings.x}px</span>
                        </div>
                        <input
                            type="range" min="-50" max="100" step="5" value={settings.x}
                            onChange={(e) => setSettings({ ...settings, x: parseInt(e.target.value) })}
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

export const StartScreen = ({ gameState, setGameState, availableSkins, showAiInput, setShowAiInput, aiPrompt, setAiPrompt, isGeneratingSkin, handleGenerateSkin, handleStart, onOpenControls, onOpenCalibration, onOpenSettings, selectedIndex, gyroEnabled }: any) => {
    // SAFETY: Ensure availableSkins is always an array
    const safeSkins = Array.isArray(availableSkins) ? availableSkins : [];

    const [lang, setLang] = useState<'EN' | 'PT'>('EN');

    const t = {
        EN: {
            start: "START MISSION",
            skin: "SELECT AGENT",
            gen: "GENERATE AI SKIN",
            motion: "MOTION",
            arrows: "ARROWS",
            fullscreen: "FULLSCREEN",
            cal: "CALIBRATE",
            controls: "CONTROLS",
            highScore: "HIGH SCORE",
            coins: "COINS",
            motionActive: "SENSORS ACTIVE",
            enableMotion: "ENABLE MOTION"
        },
        PT: {
            start: "INICIAR MISSÃO",
            skin: "SELECIONAR AGENTE",
            gen: "CRIAR SKIN IA",
            motion: "MOVIMENTO",
            arrows: "SETAS",
            fullscreen: "TELA CHEIA",
            cal: "CALIBRAR",
            controls: "CONTROLES",
            highScore: "RECORDE",
            coins: "MOEDAS",
            motionActive: "SENSORES ATIVOS",
            enableMotion: "ATIVAR SENSOR"
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
            const elem = document.documentElement as any;
            if (elem.requestFullscreen) {
                elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                elem.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
            }
        }
    };



    return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
            {/* HEADER */}
            <div className="mb-8 text-center relative">
                <div className="absolute -inset-10 bg-cyan-500/20 blur-3xl rounded-full animate-pulse"></div>
                <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white relative z-10 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
                    AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500">INFINITIV</span>
                </h1>
                <p className="text-cyan-500 font-mono tracking-[0.5em] text-sm mt-2 font-bold uppercase">Vertical Ascent Protocol <span className="text-xs text-slate-500 ml-2">{Constants.APP_VERSION}</span></p>
            </div>

            {/* MAIN MENU GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl px-8 relative z-10">

                {/* LEFT COLUMN - CHARACTER */}
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center">
                    <h3 className="text-slate-400 text-xs font-bold tracking-[0.2em] mb-4 uppercase">{t[lang].skin}</h3>

                    <div className="relative w-32 h-32 mb-4 group cursor-pointer" onClick={() => setShowAiInput(!showAiInput)}>
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="w-full h-full p-2">
                            <svg viewBox="0 0 16 16" className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" shapeRendering="crispEdges">
                                {(gameState.selectedSkin?.pixels || []).map((row: number[], y: number) =>
                                    row.map((val: number, x: number) => {
                                        if (val === 0) return null;
                                        let color = gameState.selectedSkin?.color || '#f97316';
                                        if (val === 1) color = '#0f172a';
                                        else if (val === 3) color = '#ffffff';
                                        else if (val === 4) color = '#ffffff';
                                        else if (val === 5) color = '#000000';
                                        else if (val === 6) color = '#facc15';
                                        return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
                                    })
                                )}
                            </svg>
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 p-1.5 rounded-lg border border-white/10">
                            <Wand2 size={14} className="text-purple-400" />
                        </div>
                    </div>

                    {showAiInput ? (
                        <div className="w-full animate-in fade-in slide-in-from-top-2">
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Ex: Cyberpunk Ninja..."
                                className="w-full bg-black/50 border border-slate-700 rounded p-3 text-sm text-white focus:border-cyan-500 outline-none mb-2"
                            />
                            <button
                                onClick={handleGenerateSkin}
                                disabled={isGeneratingSkin}
                                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                {isGeneratingSkin ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                                {t[lang].gen}
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2 w-full overflow-x-auto custom-scrollbar pb-2">
                            {safeSkins.map((skin: any, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setGameState((prev: any) => ({ ...prev, selectedSkin: skin }))}
                                    className={`flex-shrink-0 w-12 h-12 rounded-lg border-2 transition-all ${gameState.selectedSkin.id === skin.id ? 'border-cyan-400 bg-cyan-900/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'}`}
                                >
                                    <div className="w-full h-full p-1">
                                        <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
                                            {(skin?.pixels || []).map((row: number[], y: number) =>
                                                row.map((val: number, x: number) => {
                                                    if (val === 0) return null;
                                                    let color = skin?.color || '#f97316';
                                                    if (val === 1) color = '#0f172a';
                                                    else if (val === 3) color = '#ffffff';
                                                    else if (val === 4) color = '#ffffff';
                                                    else if (val === 5) color = '#000000';
                                                    else if (val === 6) color = '#facc15';
                                                    return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
                                                })
                                            )}
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN - ACTIONS */}
                <div className="flex flex-col gap-4">
                    {/* START BUTTON */}
                    <button
                        onClick={() => handleStart('NORMAL')}
                        className={`w-full py-6 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-2xl rounded-2xl shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 border border-cyan-400/30 ${selectedIndex === 0 ? 'ring-2 ring-white scale-[1.02]' : ''}`}
                    >
                        <Play size={28} fill="currentColor" /> {t[lang].start}
                    </button>

                    {/* SHOP BUTTON */}
                    <button
                        onClick={() => setGameState((p: any) => ({ ...p, isShopOpen: true }))}
                        className="w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-black text-lg rounded-xl shadow-[0_0_20px_rgba(202,138,4,0.4)] hover:shadow-[0_0_40px_rgba(202,138,4,0.6)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 border border-yellow-400/30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                        LOJA ({gameState.totalCoins} MOEDAS)
                    </button>

                    {/* CONTROL MODE TOGGLE */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* BUTTONS MODE */}
                        <button
                            onClick={() => setGameState((p: any) => ({ ...p, mobileControlMode: 'BUTTONS' }))}
                            className={`py-4 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${gameState.mobileControlMode === 'BUTTONS' ? 'bg-slate-800 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                        >
                            <Gamepad2 size={24} />
                            BUTTONS
                        </button>

                        {/* JOYSTICK MODE (NEW) */}
                        <button
                            onClick={() => setGameState((p: any) => ({ ...p, mobileControlMode: 'JOYSTICK' }))}
                            className={`py-4 rounded-xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all ${gameState.mobileControlMode === 'JOYSTICK' ? 'bg-slate-800 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                        >
                            <Move size={24} />
                            JOYSTICK
                        </button>
                    </div>

                    {/* UTILS ROW */}
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setLang(lang === 'EN' ? 'PT' : 'EN')} className="py-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-all">
                            {lang === 'EN' ? '🇺🇸 EN' : '🇧🇷 PT'}
                        </button>
                        <button onClick={toggleFullscreen} className="py-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-1">
                            <Maximize size={14} /> {t[lang].fullscreen}
                        </button>
                        <button onClick={onOpenSettings} className="py-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:border-cyan-500 transition-all flex items-center justify-center gap-1">
                            <Settings size={14} /> DEV
                        </button>
                    </div>
                </div>
            </div>

            {/* FOOTER STATS */}
            <div className="mt-8 flex gap-8 text-slate-500 font-mono text-xs font-bold">
                <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-yellow-600" />
                    <span>{t[lang].highScore}: <span className="text-yellow-500">{gameState.highScore}m</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <Coins size={14} className="text-yellow-600" />
                    <span>{t[lang].coins}: <span className="text-yellow-500">{gameState.totalCoins}</span></span>
                </div>
            </div>
        </div>
    );
};

export const PortraitLock = ({ locked = true }: { locked?: boolean }) => {
    if (!locked) return null;
    return (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center p-8 text-center md:!hidden landscape:flex portrait:hidden">
            <Smartphone size={64} className="text-cyan-400 animate-spin-slow mb-6" />
            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-2">Rotate Device</h2>
            <p className="text-slate-400 font-mono text-sm">Please use Portrait Mode for the best experience.</p>
        </div>
    );
};

export const GameOverMenu = ({ gameState, handleStart, setGameState, leaderboard, onSaveScore, selectedIndex }: any) => {
    const [name, setName] = useState(gameState.username);
    const isHighScore = gameState.score >= (leaderboard?.[2]?.score || 0) || leaderboard?.length < 3;
    const scoreSubmitted = leaderboard?.some((e: LeaderboardEntry) => e.id === gameState.runId);

    // Navigation helper
    const menuOptions = [
        { label: 'RETRY MISSION', action: () => handleStart(gameState.gameMode), icon: RotateCcw, color: 'cyan' },
        { label: 'MAIN MENU', action: () => setGameState((p: any) => ({ ...p, isGameOver: false, isPlaying: false })), icon: Home, color: 'slate' }
    ];

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center">
            <div className="bg-[#020617] border border-red-900/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-md w-full flex flex-col items-center gap-6 animate-in zoom-in-95 duration-300">
                <div className="text-center">
                    <div className="text-red-500 text-sm font-bold tracking-[0.5em] uppercase mb-2">Signal Lost</div>
                    <h2 className="text-5xl font-black text-white italic tracking-tighter">GAME OVER</h2>
                </div>

                <div className="grid grid-cols-2 gap-4 w-full">
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Altitude</div>
                        <div className="text-3xl font-black text-white">{gameState.score}m</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-xl text-center">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-1">Coins</div>
                        <div className="text-3xl font-black text-yellow-400 flex items-center justify-center gap-1"><Coins size={20} /> {gameState.runCoins}</div>
                    </div>
                </div>

                {/* ACTION BUTTONS */}
                <div className="w-full space-y-3">
                    {menuOptions.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={opt.action}
                            className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${idx === selectedIndex
                                ? `bg-${opt.color}-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105 ring-2 ring-${opt.color}-400`
                                : `bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white`
                                }`}
                        >
                            <opt.icon size={20} /> {opt.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
