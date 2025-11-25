import React, { useState, useEffect, useRef } from 'react';
import {
    Play, Move, Trash2, PlusSquare, Save, AlertTriangle, Pause, RefreshCw, Smartphone, Gamepad2, Rocket, Lock, Trophy, Coins, XOctagon,
    ToggleLeft, ToggleRight, X, Settings, Download, MapPin, Shuffle, Crown, Keyboard, Zap, Battery, ChevronsUp, Wind, TrendingUp,
    ArrowLeft, ShoppingBag, Home, Sparkles, Wand2, Maximize, RotateCcw, ChevronLeft, ChevronRight, ArrowUp, Shield, HelpCircle,
    Layers, Globe, Check, MousePointer2, ArrowDown, Heart, Unlock, Loader2, Medal, Send, User, Eye
} from 'lucide-react';
import { CharacterSkin, GameState, LeaderboardEntry, ShopUpgrades, TROPHY_POWERS, CHARACTER_CHALLENGES, CharacterChallenge } from '../../types';
import { soundManager } from './audioManager';
import { Persistence } from './persistence';
import * as Constants from '../../constants';
import { SKINS } from './assets';

export const SensorDebugModal = ({ onClose }: { onClose: () => void }) => {
    const [orientation, setOrientation] = useState<any>({});
    const [absolute, setAbsolute] = useState<any>({});
    const [motion, setMotion] = useState<any>({});
    const [counts, setCounts] = useState({ orient: 0, abs: 0, motion: 0 });
    const [perms, setPerms] = useState<string>("Unknown");
    const [sensorStatus, setSensorStatus] = useState<'checking' | 'working' | 'blocked' | 'no-data'>('checking');
    const [isBrave, setIsBrave] = useState(false);

    useEffect(() => {
        // Detect Brave browser
        (navigator as any).brave?.isBrave().then((result: boolean) => setIsBrave(result)).catch(() => {});
        // Also check user agent
        if (navigator.userAgent.includes('Brave')) setIsBrave(true);

        let hasReceivedValidData = false;
        let checkTimeout: NodeJS.Timeout;

        const handleOrient = (e: DeviceOrientationEvent) => {
            setOrientation({ a: e.alpha, b: e.beta, g: e.gamma, abs: e.absolute });
            setCounts(p => ({ ...p, orient: p.orient + 1 }));
            
            // Check if we have REAL data (not null/undefined)
            if (e.gamma !== null && e.gamma !== undefined && e.beta !== null) {
                hasReceivedValidData = true;
                setSensorStatus('working');
            }
        };
        const handleAbs = (e: any) => {
            setAbsolute({ a: e.alpha, b: e.beta, g: e.gamma, abs: e.absolute });
            setCounts(p => ({ ...p, abs: p.abs + 1 }));
            
            if (e.gamma !== null && e.gamma !== undefined) {
                hasReceivedValidData = true;
                setSensorStatus('working');
            }
        };
        const handleMotion = (e: DeviceMotionEvent) => {
            setMotion({
                acc: e.acceleration,
                accG: e.accelerationIncludingGravity,
                rot: e.rotationRate
            });
            setCounts(p => ({ ...p, motion: p.motion + 1 }));
            
            if (e.accelerationIncludingGravity?.x !== null) {
                hasReceivedValidData = true;
                setSensorStatus('working');
            }
        };

        window.addEventListener('deviceorientation', handleOrient);
        window.addEventListener('deviceorientationabsolute', handleAbs);
        window.addEventListener('devicemotion', handleMotion);

        // After 3 seconds, check if we got valid data
        checkTimeout = setTimeout(() => {
            if (!hasReceivedValidData) {
                setSensorStatus('blocked');
            }
        }, 3000);

        return () => {
            window.removeEventListener('deviceorientation', handleOrient);
            window.removeEventListener('deviceorientationabsolute', handleAbs);
            window.removeEventListener('devicemotion', handleMotion);
            clearTimeout(checkTimeout);
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

    const isBraveDetected = isBrave || navigator.userAgent.includes('Brave');

    return (
        <div className="fixed inset-0 z-[300] bg-black/95 text-white p-6 overflow-y-auto font-mono text-xs">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                <h2 className="text-xl font-bold text-cyan-400">SENSOR DIAGNOSTICS</h2>
                <button onClick={onClose} className="p-2 bg-red-900/50 text-red-200 rounded"><X size={20} /></button>
            </div>

            <div className="space-y-4">
                {/* STATUS ALERT */}
                {sensorStatus === 'blocked' && (
                    <div className="bg-red-900/50 border-2 border-red-500 p-4 rounded-lg animate-pulse">
                        <h3 className="font-bold text-red-400 text-lg mb-2">⚠️ SENSORS BLOCKED!</h3>
                        <p className="text-red-200 mb-3">Your browser is blocking motion sensors. Values are empty/null.</p>
                        
                        {isBraveDetected ? (
                            <div className="bg-orange-900/50 p-3 rounded border border-orange-500 mb-3">
                                <h4 className="font-bold text-orange-400 mb-2">🦁 BRAVE BROWSER DETECTED</h4>
                                <p className="text-orange-200 text-xs mb-2">Brave blocks sensors by default for privacy.</p>
                                <ol className="text-orange-100 text-xs space-y-1 list-decimal list-inside">
                                    <li>Tap the <strong>Brave Shield icon</strong> (lion) in address bar</li>
                                    <li>Turn OFF "Block Fingerprinting"</li>
                                    <li>Or use <strong>Chrome/Samsung Internet</strong> instead</li>
                                </ol>
                            </div>
                        ) : (
                            <div className="bg-yellow-900/50 p-3 rounded border border-yellow-500">
                                <h4 className="font-bold text-yellow-400 mb-2">💡 Try these fixes:</h4>
                                <ol className="text-yellow-100 text-xs space-y-1 list-decimal list-inside">
                                    <li>Use <strong>Chrome</strong> or <strong>Samsung Internet</strong></li>
                                    <li>Check browser settings for "Motion Sensors"</li>
                                    <li>Reload the page after changing settings</li>
                                </ol>
                            </div>
                        )}
                    </div>
                )}

                {sensorStatus === 'working' && (
                    <div className="bg-green-900/50 border-2 border-green-500 p-4 rounded-lg">
                        <h3 className="font-bold text-green-400 text-lg">✅ SENSORS WORKING!</h3>
                        <p className="text-green-200">Motion controls should work. Close this and play!</p>
                    </div>
                )}

                {sensorStatus === 'checking' && (
                    <div className="bg-blue-900/50 border-2 border-blue-500 p-4 rounded-lg">
                        <h3 className="font-bold text-blue-400 text-lg flex items-center gap-2">
                            <Loader2 className="animate-spin" size={20} /> Checking sensors...
                        </h3>
                        <p className="text-blue-200">Tilt your device to test.</p>
                    </div>
                )}

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-yellow-400 mb-2">ENVIRONMENT</h3>
                    <div>Secure Context (HTTPS): <span className={window.isSecureContext ? "text-green-400" : "text-red-500"}>{window.isSecureContext ? "YES" : "NO"}</span></div>
                    <div>Browser: <span className={isBraveDetected ? "text-orange-400" : "text-slate-300"}>{isBraveDetected ? "Brave (may block sensors)" : "Chrome/Other"}</span></div>
                    <div>Permission State: {perms}</div>
                    <button onClick={requestPerms} className="mt-2 px-3 py-1 bg-blue-900 text-blue-200 rounded border border-blue-700">Request Permission</button>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-cyan-400 mb-2">DEVICE ORIENTATION (Standard)</h3>
                    <div>Events Fired: <span className={counts.orient > 5 ? "text-green-400" : "text-yellow-400"}>{counts.orient}</span></div>
                    <div>Alpha (Compass): <span className={orientation.a !== undefined && orientation.a !== null ? "text-green-400" : "text-red-400"}>{orientation.a?.toFixed(2) || "NULL ❌"}</span></div>
                    <div>Beta (Front/Back): <span className={orientation.b !== undefined && orientation.b !== null ? "text-green-400" : "text-red-400"}>{orientation.b?.toFixed(2) || "NULL ❌"}</span></div>
                    <div>Gamma (Left/Right): <span className={orientation.g !== undefined && orientation.g !== null ? "text-green-400" : "text-red-400"}>{orientation.g?.toFixed(2) || "NULL ❌"}</span></div>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-purple-400 mb-2">ORIENTATION ABSOLUTE (Android)</h3>
                    <div>Events Fired: {counts.abs}</div>
                    <div>Gamma: <span className={absolute.g !== undefined && absolute.g !== null ? "text-green-400" : "text-red-400"}>{absolute.g?.toFixed(2) || "NULL ❌"}</span></div>
                </div>

                <div className="bg-slate-900 p-3 rounded border border-slate-700">
                    <h3 className="font-bold text-green-400 mb-2">DEVICE MOTION (Accel)</h3>
                    <div>Events Fired: {counts.motion}</div>
                    <div>AccG X: <span className={motion.accG?.x !== undefined && motion.accG?.x !== null ? "text-green-400" : "text-red-400"}>{motion.accG?.x?.toFixed(2) || "NULL ❌"}</span></div>
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

// Interface for individual button layouts
interface ButtonLayout {
    id: string;
    x: number;
    y: number;
    scale: number;
    visible: boolean;
}

interface ControlsLayout {
    leftArrow: ButtonLayout;
    rightArrow: ButtonLayout;
    jumpBtn: ButtonLayout;
    jetpackBtn: ButtonLayout;
    globalScale: number;
}

const DEFAULT_CONTROLS_LAYOUT: ControlsLayout = {
    leftArrow: { id: 'leftArrow', x: 24, y: 24, scale: 1, visible: true },
    rightArrow: { id: 'rightArrow', x: 120, y: 24, scale: 1, visible: true },
    jumpBtn: { id: 'jumpBtn', x: -140, y: 24, scale: 1, visible: true },
    jetpackBtn: { id: 'jetpackBtn', x: -48, y: 24, scale: 1.1, visible: true },
    globalScale: 1,
};

export const TouchControls = ({ inputRef, mode, layout = { scale: 1, x: 0, y: 0 }, controlsLayout, gameState, onOpenSettings, hideMotionDebug = false, playerRef }: { 
    inputRef: any, 
    mode: 'BUTTONS' | 'TILT' | 'JOYSTICK' | 'ARROWS', 
    layout?: any, 
    controlsLayout?: ControlsLayout | null,
    gameState?: any, 
    onOpenSettings?: () => void, 
    hideMotionDebug?: boolean,
    playerRef?: any
}) => {
    // Load saved layout or use default
    const [savedLayout, setSavedLayout] = React.useState<ControlsLayout>(() => {
        if (controlsLayout) return controlsLayout;
        try {
            const saved = localStorage.getItem('CONTROLS_LAYOUT');
            if (saved) return JSON.parse(saved);
        } catch { }
        return DEFAULT_CONTROLS_LAYOUT;
    });

    // Check if player can do perfect jump (is grounded)
    const canPerfectJump = playerRef?.current?.isGrounded === true;

    // Perfect jump indicator - shows PINK when player can do perfect jump
    const [showPerfectIndicator, setShowPerfectIndicator] = React.useState(false);
    
    // Update perfect indicator based on grounded state
    React.useEffect(() => {
        const checkGrounded = () => {
            const isGrounded = playerRef?.current?.isGrounded === true;
            setShowPerfectIndicator(isGrounded);
        };
        // Check frequently for responsive feedback
        const interval = setInterval(checkGrounded, 16); // ~60fps
        return () => clearInterval(interval);
    }, [playerRef]);

    // Update when controlsLayout prop changes
    React.useEffect(() => {
        if (controlsLayout) setSavedLayout(controlsLayout);
    }, [controlsLayout]);

    // Don't render if not playing
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

    const globalScale = savedLayout.globalScale || 1;
    
    // Perfect indicator style - PINK SUAVE when player is on ground (can perfect jump)
    const perfectStyle = showPerfectIndicator ? 'bg-pink-400/30 border-pink-300/50 shadow-[0_0_12px_rgba(236,72,153,0.3)]' : '';

    // SPEEDRUN-STYLE Perfect Jump Indicator - Fast fill, clear visual feedback
    const RadialPerfectIndicator = ({ size, isReady }: { size: number; isReady: boolean }) => {
        const [fillProgress, setFillProgress] = React.useState(0);
        const [isPerfect, setIsPerfect] = React.useState(false);
        const [pulseScale, setPulseScale] = React.useState(1);
        
        React.useEffect(() => {
            if (isReady) {
                // SPEEDRUN STYLE: Fast fill (400ms) for quick reactions
                const startTime = Date.now();
                const duration = 400; // Fast! 0.4 seconds to fill
                
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    
                    // Easing function - starts slow, ends fast (anticipation)
                    const eased = progress < 0.5 
                        ? 2 * progress * progress 
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
                    
                    setFillProgress(eased);
                    
                    if (progress >= 1) {
                        setIsPerfect(true);
                        // Pulse animation when ready
                        let pulseFrame = 0;
                        const pulseAnimate = () => {
                            pulseFrame++;
                            setPulseScale(1 + Math.sin(pulseFrame * 0.15) * 0.08);
                            if (isReady) requestAnimationFrame(pulseAnimate);
                        };
                        pulseAnimate();
                    } else {
                        requestAnimationFrame(animate);
                    }
                };
                animate();
                
                // Start charging sound
                soundManager.startPerfectCharge();
            } else {
                setFillProgress(0);
                setIsPerfect(false);
                setPulseScale(1);
                // Stop charging sound
                soundManager.stopPerfectCharge();
            }
            
            return () => {
                soundManager.stopPerfectCharge();
            };
        }, [isReady]);
        
        if (!isReady && fillProgress === 0) return null;
        
        const radius = size / 2 - 6;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset = circumference * (1 - fillProgress);
        
        // Color transitions: cyan -> pink -> gold when perfect
        const getColor = () => {
            if (isPerfect) return '#fbbf24'; // GOLD when perfect!
            if (fillProgress > 0.7) return '#ec4899'; // Pink near ready
            return '#06b6d4'; // Cyan while charging
        };
        
        return (
            <div 
                className="absolute inset-0 pointer-events-none flex items-center justify-center"
                style={{ transform: `scale(${pulseScale})`, transition: 'transform 0.1s ease-out' }}
            >
                <svg 
                    width={size} 
                    height={size}
                    style={{ transform: 'rotate(-90deg)' }}
                >
                    {/* Background ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="5"
                    />
                    {/* Progress arc - thick and visible */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={getColor()}
                        strokeWidth="5"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        style={{ 
                            transition: 'stroke-dashoffset 0.05s linear, stroke 0.2s ease',
                            filter: isPerfect ? 'drop-shadow(0 0 8px #fbbf24)' : `drop-shadow(0 0 4px ${getColor()})`
                        }}
                    />
                </svg>
                {/* PERFECT! indicator when ready */}
                {isPerfect && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[9px] font-black text-yellow-400 animate-pulse"
                              style={{ textShadow: '0 0 8px #fbbf24, 0 0 16px #f59e0b' }}>
                            ⚡
                        </span>
                    </div>
                )}
            </div>
        );
    };

    // Helper to render a button with custom layout
    const renderButton = (id: 'leftArrow' | 'rightArrow' | 'jumpBtn' | 'jetpackBtn', touchKey: string, icon: React.ReactNode, baseSize: number, colorClass: string) => {
        const btnLayout = savedLayout[id];
        if (!btnLayout?.visible) return null;
        
        const size = baseSize * (btnLayout.scale || 1) * globalScale;
        const isRightAligned = btnLayout.x < 0;
        
        // Only apply perfect indicator to JUMP button
        const isJumpButton = id === 'jumpBtn';
        const shouldShowPerfect = isJumpButton && showPerfectIndicator;
        const buttonStyle = shouldShowPerfect 
            ? 'bg-pink-500/30 border-2 border-pink-400/50' 
            : colorClass;
        
        // Clone icon with pink color if perfect jump available on jump button
        const iconElement = shouldShowPerfect && React.isValidElement(icon)
            ? React.cloneElement(icon as React.ReactElement<any>, { 
                className: 'text-pink-200 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' 
              })
            : icon;
        
        return (
            <button
                key={id}
                className={`pointer-events-auto rounded-full flex items-center justify-center active:scale-95 transition-all backdrop-blur-sm relative ${buttonStyle}`}
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    position: 'absolute',
                    bottom: `${btnLayout.y}px`,
                    left: isRightAligned ? undefined : `${btnLayout.x}px`,
                    right: isRightAligned ? `${-btnLayout.x}px` : undefined,
                }}
                onTouchStart={(e) => { e.preventDefault(); handleTouch(touchKey, true); }}
                onTouchEnd={(e) => { e.preventDefault(); handleTouch(touchKey, false); }}
            >
                {/* Radial indicator for jump button */}
                {isJumpButton && <RadialPerfectIndicator size={size} isReady={showPerfectIndicator} />}
                {iconElement}
            </button>
        );
    };

    // --- TILT MODE: Jump centralizado pequeno + Jetpack à direita ---
    if (mode === 'TILT') {
        const tiltX = inputRef.current?.tiltX || 0;
        const bubblePos = Math.max(-50, Math.min(50, tiltX * 50));
        const isLevel = Math.abs(tiltX) < 0.1;
        
        const jumpSize = 60 * globalScale;
        const jetpackSize = 70 * globalScale;

        return (
            <div className="absolute inset-0 pointer-events-none z-[100]">
                {/* Bubble Level Indicator */}
                {!hideMotionDebug && (
                    <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
                        <div className="w-48 h-4 bg-slate-900/60 rounded-full border border-slate-600/50 relative overflow-hidden shadow-lg backdrop-blur-sm">
                            <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-8 bg-slate-700/30 border-x border-slate-500/20"></div>
                            <div
                                className={`absolute top-0.5 bottom-0.5 w-8 rounded-full transition-transform duration-100 ${isLevel ? 'bg-green-400/80 shadow-[0_0_10px_#4ade80]' : 'bg-cyan-400/80'}`}
                                style={{ left: '50%', marginLeft: '-16px', transform: `translateX(${bubblePos}px)` }}
                            />
                        </div>
                        <span className={`text-[10px] font-bold tracking-widest uppercase ${isLevel ? 'text-green-400/80' : 'text-slate-500/80'}`}>
                            {isLevel ? 'LEVEL' : 'TILT TO STEER'}
                        </span>
                    </div>
                )}

                {/* Jump Button - CENTRALIZADO e PEQUENO - ROSA quando pulo perfeito disponível */}
                <button
                    className={`absolute pointer-events-auto rounded-full flex items-center justify-center border-2 active:scale-95 transition-all relative ${
                        showPerfectIndicator 
                            ? 'bg-pink-500/30 border-pink-400/50' 
                            : 'bg-cyan-900/30 border-cyan-500/40'
                    }`}
                    style={{
                        bottom: '24px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: `${jumpSize}px`,
                        height: `${jumpSize}px`,
                    }}
                    onTouchStart={(e) => { e.preventDefault(); inputRef.current.jumpIntent = true; inputRef.current.jumpPressedTime = Date.now(); }}
                    onTouchEnd={(e) => { e.preventDefault(); inputRef.current.jumpIntent = false; inputRef.current.jetpack = false; }}
                    onMouseDown={() => { inputRef.current.jumpIntent = true; inputRef.current.jumpPressedTime = Date.now(); }}
                    onMouseUp={() => { inputRef.current.jumpIntent = false; inputRef.current.jetpack = false; }}
                >
                    <RadialPerfectIndicator size={jumpSize} isReady={showPerfectIndicator} />
                    <ArrowUp size={24 * globalScale} className={showPerfectIndicator ? 'text-pink-200 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : 'text-cyan-200/70'} />
                </button>

                {/* Jetpack Button - À DIREITA */}
                <button
                    className="absolute pointer-events-auto rounded-full flex items-center justify-center border-2 active:scale-95 bg-purple-900/30 border-purple-500/40"
                    style={{
                        bottom: '24px',
                        right: '24px',
                        width: `${jetpackSize}px`,
                        height: `${jetpackSize}px`,
                    }}
                    onTouchStart={(e) => { e.preventDefault(); inputRef.current.jetpack = true; }}
                    onTouchEnd={(e) => { e.preventDefault(); inputRef.current.jetpack = false; }}
                    onMouseDown={() => { inputRef.current.jetpack = true; }}
                    onMouseUp={() => { inputRef.current.jetpack = false; }}
                >
                    <Rocket size={24 * globalScale} className="text-purple-200/70" />
                </button>
            </div>
        );
    }

    // --- JOYSTICK MODE: Jump Button + Jetpack Button ---
    if (mode === 'JOYSTICK') {
        return (
            <div className="absolute inset-0 pointer-events-none z-[100]">
                {/* Jump Button */}
                {renderButton('jumpBtn', 'jump', <ArrowUp size={32 * globalScale} className="text-cyan-200/70" />, 80, 
                    'bg-cyan-900/30 border-2 border-cyan-500/40 active:bg-cyan-500/40')}
                
                {/* Jetpack Button - NEW */}
                {renderButton('jetpackBtn', 'jetpack', <Rocket size={28 * globalScale} className="text-purple-200/70" />, 70, 
                    'bg-purple-800/30 border-2 border-purple-500/40 active:bg-purple-500/40')}
            </div>
        );
    }

    // --- ARROWS MODE: Only 2 arrows - tap=jump, BOTH=jetpack ---
    // Controles em uma BARRA FIXA na parte de baixo para não atrapalhar visão
    if (mode === 'ARROWS') {
        const [leftPressed, setLeftPressed] = React.useState(false);
        const [rightPressed, setRightPressed] = React.useState(false);
        const [jetpackActive, setJetpackActive] = React.useState(false);
        
        // CRITICAL: Reset states when game restarts (when isPlaying changes to true)
        React.useEffect(() => {
            if (gameState?.isPlaying && !gameState?.isGameOver) {
                setLeftPressed(false);
                setRightPressed(false);
                setJetpackActive(false);
                if (inputRef.current) {
                    inputRef.current.left = false;
                    inputRef.current.right = false;
                    inputRef.current.jetpack = false;
                    inputRef.current.jumpIntent = false;
                }
            }
        }, [gameState?.isPlaying, gameState?.runId]); // runId changes on each restart
        
        // Check if both buttons are pressed
        React.useEffect(() => {
            if (leftPressed && rightPressed) {
                // Both pressed = JETPACK!
                inputRef.current.jetpack = true;
                setJetpackActive(true);
            } else {
                inputRef.current.jetpack = false;
                setJetpackActive(false);
            }
        }, [leftPressed, rightPressed]);
        
        const handlePress = (side: 'left' | 'right') => {
            // Set direction
            if (side === 'left') {
                inputRef.current.left = true;
                setLeftPressed(true);
            }
            if (side === 'right') {
                inputRef.current.right = true;
                setRightPressed(true);
            }
            
            // Trigger jump immediately
            inputRef.current.jumpIntent = true;
            inputRef.current.jumpPressedTime = Date.now();
        };
        
        const handleRelease = (side: 'left' | 'right') => {
            // Clear direction
            if (side === 'left') {
                inputRef.current.left = false;
                setLeftPressed(false);
            }
            if (side === 'right') {
                inputRef.current.right = false;
                setRightPressed(false);
            }
            
            // Clear jump
            inputRef.current.jumpIntent = false;
        };
        
        const buttonSize = 80 * globalScale;
        
        // Get button style based on state - ROSA quando pode pular perfeito, ROXO quando jetpack ativo
        const getButtonStyle = (isPressed: boolean) => {
            if (jetpackActive) return 'bg-purple-600/50 border-purple-400/60 shadow-[0_0_20px_rgba(168,85,247,0.5)]';
            if (showPerfectIndicator) return 'bg-pink-500/30 border-pink-400/50 shadow-[0_0_15px_rgba(236,72,153,0.4)]';
            if (isPressed) return 'bg-cyan-500/40 border-cyan-400/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]';
            return 'bg-slate-800/30 border-slate-500/30';
        };
        
        // Barra de controle fixa na parte inferior - TRANSPARENTE
        return (
            <div className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none">
                {/* Barra TRANSPARENTE - não cobre o jogo */}
                <div className="h-[100px] flex items-center justify-between px-4 pointer-events-auto">
                    {/* LEFT ARROW */}
                    <button
                        className={`rounded-2xl flex items-center justify-center transition-all border-2 active:scale-95 ${getButtonStyle(leftPressed)}`}
                        style={{
                            width: `${buttonSize}px`,
                            height: `${buttonSize}px`,
                        }}
                        onTouchStart={(e) => { e.preventDefault(); handlePress('left'); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleRelease('left'); }}
                        onMouseDown={() => handlePress('left')}
                        onMouseUp={() => handleRelease('left')}
                        onMouseLeave={() => handleRelease('left')}
                    >
                        <ChevronLeft size={48 * globalScale} className={jetpackActive ? 'text-purple-100/90' : showPerfectIndicator ? 'text-pink-200/70' : leftPressed ? 'text-cyan-100/70' : 'text-white/50'} strokeWidth={2.5} />
                    </button>
                    
                    {/* Centro - Indicador de JETPACK */}
                    <div className="flex-1 flex items-center justify-center">
                        {jetpackActive && (
                            <div className="flex items-center gap-2 bg-purple-600/50 px-3 py-1.5 rounded-full border border-purple-400/50 animate-pulse">
                                <Rocket size={16} className="text-purple-200" />
                                <span className="text-[10px] font-bold text-purple-200 uppercase">JETPACK</span>
                            </div>
                        )}
                    </div>
                    
                    {/* RIGHT ARROW */}
                    <button
                        className={`rounded-2xl flex items-center justify-center transition-all border-2 active:scale-95 ${getButtonStyle(rightPressed)}`}
                        style={{
                            width: `${buttonSize}px`,
                            height: `${buttonSize}px`,
                        }}
                        onTouchStart={(e) => { e.preventDefault(); handlePress('right'); }}
                        onTouchEnd={(e) => { e.preventDefault(); handleRelease('right'); }}
                        onMouseDown={() => handlePress('right')}
                        onMouseUp={() => handleRelease('right')}
                        onMouseLeave={() => handleRelease('right')}
                    >
                        <ChevronRight size={48 * globalScale} className={jetpackActive ? 'text-purple-100/90' : showPerfectIndicator ? 'text-pink-200/70' : rightPressed ? 'text-cyan-100/70' : 'text-white/50'} strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        );
    }

    // --- BUTTONS MODE: Arrows + Jump + Jetpack ---
    return (
        <div className="absolute inset-0 pointer-events-none z-[100]">
            {/* Arrows */}
            {renderButton('leftArrow', 'left', <ChevronLeft size={32 * globalScale} className="text-white/50" />, 80, 
                'bg-slate-700/30 border-2 border-slate-400/30 active:bg-slate-600/40')}
            {renderButton('rightArrow', 'right', <ChevronRight size={32 * globalScale} className="text-white/50" />, 80, 
                'bg-slate-700/30 border-2 border-slate-400/30 active:bg-slate-600/40')}
            
            {/* Jump Button */}
            {renderButton('jumpBtn', 'jump', <ArrowUp size={32 * globalScale} className="text-cyan-200/70" />, 80, 
                'bg-cyan-800/30 border-2 border-cyan-500/40 active:bg-cyan-500/40')}
            
            {/* Jetpack Button - NEW */}
            {renderButton('jetpackBtn', 'jetpack', <Rocket size={28 * globalScale} className="text-purple-200/70" />, 70, 
                'bg-purple-800/30 border-2 border-purple-500/40 active:bg-purple-500/40')}
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
                        RESET TO DEFAULTS
                    </button>
                </div>
            </div>
        </>
    );
};

// ====================================================================================
// CALIBRATION MODAL - Gyro/Motion Calibration
// ====================================================================================

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
                        <div className="flex justify-between text-[10px] text-slate-600 mt-2">
                            <span>LOW</span>
                            <span>DEFAULT (35)</span>
                            <span>HIGH</span>
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
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setMobileControlMode('BUTTONS')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${currentMode === 'BUTTONS' ? 'bg-cyan-600 text-white border-cyan-500 shadow-lg' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                BUTTONS
                            </button>
                            <button onClick={() => setMobileControlMode('ARROWS')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${currentMode === 'ARROWS' ? 'bg-green-600 text-white border-green-500 shadow-lg' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                ARROWS
                            </button>
                            <button onClick={() => setMobileControlMode('TILT')} className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${currentMode === 'TILT' ? 'bg-purple-600 text-white border-purple-500 shadow-lg' : 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                TILT
                            </button>
                        </div>
                        <p className="text-[10px] text-slate-400 font-mono leading-relaxed mt-2">
                            {currentMode === 'TILT' ? "Incline o dispositivo para mover. Botões FLY e JUMP." : 
                             currentMode === 'ARROWS' ? "Apenas setas! Toque = Pular, Segurar = Jetpack" :
                             "Use setas D-Pad + botões de Pulo e Jetpack."}
                        </p>
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

// ====================================================================================
// ADMIN PANEL - Protected by secret code
// ====================================================================================
export const AdminPanel = ({ onClose }: { onClose: () => void }) => {
    const [isResetting, setIsResetting] = useState(false);
    const [resetResult, setResetResult] = useState<string | null>(null);

    const handleResetLeaderboard = async () => {
        if (!window.confirm('⚠️ TEM CERTEZA que quer ZERAR o ranking global? Esta ação não pode ser desfeita!')) return;
        
        setIsResetting(true);
        setResetResult(null);
        
        try {
            const response = await fetch('/api/leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'RESET_LEADERBOARD_2025' })
            });
            const data = await response.json();
            
            if (data.success) {
                setResetResult('✅ Ranking global ZERADO com sucesso!');
            } else {
                setResetResult(`❌ Erro: ${data.error || 'Falha ao resetar'}`);
            }
        } catch (err: any) {
            setResetResult(`❌ Erro de conexão: ${err.message}`);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-4">
            <div className="bg-slate-900 border-2 border-red-500 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-black text-red-400 flex items-center gap-2">
                        <Shield size={24} /> ADMIN PANEL
                    </h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white">
                        <X size={24} />
                    </button>
                </div>
                
                <p className="text-slate-400 text-sm mb-6">⚠️ Área restrita para administradores. Ações aqui afetam TODOS os jogadores.</p>
                
                {/* RESET LEADERBOARD */}
                <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 mb-4">
                    <h3 className="text-red-400 font-bold mb-2 flex items-center gap-2">
                        <Trash2 size={18} /> Zerar Ranking Global
                    </h3>
                    <p className="text-xs text-slate-500 mb-3">Remove TODAS as pontuações do ranking mundial. Isso não pode ser desfeito!</p>
                    <button
                        onClick={handleResetLeaderboard}
                        disabled={isResetting}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2"
                    >
                        {isResetting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                        {isResetting ? 'ZERANDO...' : 'ZERAR RANKING'}
                    </button>
                </div>
                
                {resetResult && (
                    <div className={`p-3 rounded-lg text-sm font-bold ${resetResult.includes('✅') ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                        {resetResult}
                    </div>
                )}
                
                <p className="text-[10px] text-slate-600 mt-4 text-center">ChocoPro Admin v1.0</p>
            </div>
        </div>
    );
};

// ============================================================================
// CHARACTER PREVIEW & TUTORIAL MODAL - Animated character demos
// ============================================================================
const CharacterPreviewModal = ({ skin, onClose, onSelectSkin, allSkins }: { 
    skin: CharacterSkin; 
    onClose: () => void; 
    onSelectSkin: (skin: CharacterSkin) => void;
    allSkins: CharacterSkin[];
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>(0);
    const listRef = useRef<HTMLDivElement>(null);
    const [currentSkinIndex, setCurrentSkinIndex] = useState(() => {
        const idx = allSkins.findIndex(s => s.id === skin.id);
        return idx >= 0 ? idx : 0;
    });
    const [activeTab, setActiveTab] = useState<'preview' | 'jetpack' | 'perfect' | 'wrap'>('preview');
    
    // Scroll to selected character when index changes
    useEffect(() => {
        if (listRef.current) {
            const selectedItem = listRef.current.children[currentSkinIndex] as HTMLElement;
            if (selectedItem) {
                selectedItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
            }
        }
    }, [currentSkinIndex]);
    
    const currentSkin = allSkins[currentSkinIndex] || skin;
    
    // Animation state - platforms can dissolve like in game
    const stateRef = useRef({
        x: 140,
        y: 250,
        vx: 0,
        vy: 0,
        frame: 0,
        isGrounded: true,
        direction: 1,
        platforms: [] as { x: number; y: number; w: number; dissolve?: number; dissolving?: boolean }[],
        particles: [] as { x: number; y: number; vx: number; vy: number; life: number; color: string }[],
        jetpackActive: false,
        jetpackTimer: 0,
        perfectJumpReady: false,
        tutorialPhase: 0,
    });
    
    // Reset state when tab OR skin changes
    useEffect(() => {
        const state = stateRef.current;
        state.x = 140;
        state.y = 250;
        state.vx = 0;
        state.vy = 0;
        state.frame = 0;
        state.isGrounded = true;
        state.direction = 1;
        state.jetpackActive = false;
        state.jetpackTimer = 0;
        state.perfectJumpReady = false;
        state.tutorialPhase = 0;
        state.particles = [];
        
        // Set up platforms based on tab
        if (activeTab === 'preview') {
            state.platforms = [
                { x: 20, y: 320, w: 260 }, // Wide ground
                { x: 50, y: 250, w: 70 },
                { x: 180, y: 250, w: 70 },
                { x: 110, y: 180, w: 80 },
                { x: 40, y: 110, w: 70 },
                { x: 190, y: 110, w: 70 },
            ];
        } else if (activeTab === 'jetpack') {
            state.platforms = [
                { x: 20, y: 320, w: 100 }, // Left ground
                { x: 180, y: 320, w: 100 }, // Right ground (gap in middle)
                { x: 110, y: 150, w: 80 }, // High platform
            ];
        } else if (activeTab === 'perfect') {
            state.platforms = [
                { x: 60, y: 320, w: 180 }, // Ground
                { x: 100, y: 200, w: 100 }, // Target platform
            ];
        } else if (activeTab === 'wrap') {
            state.platforms = [
                { x: -50, y: 340, w: 400 }, // Extra wide ground to prevent falling
            ];
        }
    }, [activeTab, currentSkinIndex]); // Reset when changing skin too!
    
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const state = stateRef.current;
        const GRAVITY = 0.5;
        const GROUND_Y = 320;
        
        const animate = () => {
            // Clear
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Stars background
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            for (let i = 0; i < 20; i++) {
                const sx = (i * 73 + state.frame * 0.1) % canvas.width;
                const sy = (i * 47) % canvas.height;
                ctx.fillRect(sx, sy, 1, 1);
            }
            
            state.frame++;
            
            // ========== TAB-SPECIFIC LOGIC ==========
            if (activeTab === 'preview') {
                // Auto movement - zigzag
                if (state.frame % 90 < 45) {
                    state.direction = 1;
                    state.vx = 2;
                } else {
                    state.direction = -1;
                    state.vx = -2;
                }
                
                // Auto jump when grounded
                if (state.isGrounded && state.frame % 50 === 0) {
                    state.vy = -12;
                    state.isGrounded = false;
                    // Jump particles
                    for (let i = 0; i < 5; i++) {
                        state.particles.push({
                            x: state.x, y: state.y + 24,
                            vx: (Math.random() - 0.5) * 4, vy: Math.random() * 2,
                            life: 20, color: currentSkin.color || '#06b6d4'
                        });
                    }
                }
                
                // Jetpack occasionally
                if (state.frame % 180 === 90) {
                    state.jetpackActive = true;
                    state.jetpackTimer = 40;
                }
            } else if (activeTab === 'jetpack') {
                // Tutorial: show jetpack crossing gap
                const phase = Math.floor(state.frame / 120) % 4;
                
                if (phase === 0) {
                    // Walk right
                    state.vx = 1.5;
                    state.direction = 1;
                } else if (phase === 1) {
                    // Jump and activate jetpack over gap
                    if (state.tutorialPhase !== 1) {
                        state.vy = -8;
                        state.isGrounded = false;
                        state.tutorialPhase = 1;
                    }
                    state.jetpackActive = true;
                    state.vx = 2;
                } else if (phase === 2) {
                    // Land and walk left
                    state.jetpackActive = false;
                    state.vx = -1.5;
                    state.direction = -1;
                } else {
                    // Reset position
                    state.x = 70;
                    state.y = 250;
                    state.vx = 0;
                    state.vy = 0;
                    state.isGrounded = true;
                    state.tutorialPhase = 0;
                }
            } else if (activeTab === 'perfect') {
                // Tutorial: show perfect jump timing
                const phase = Math.floor(state.frame / 100) % 3;
                
                if (phase === 0) {
                    // Show pink indicator (ready to perfect jump)
                    state.perfectJumpReady = state.isGrounded;
                    state.vx = 0;
                } else if (phase === 1) {
                    // Do perfect jump (high jump)
                    if (state.tutorialPhase !== 1 && state.isGrounded) {
                        state.vy = -16; // Higher jump!
                        state.isGrounded = false;
                        state.tutorialPhase = 1;
                        state.perfectJumpReady = false;
                        // Pink particles for perfect jump
                        for (let i = 0; i < 10; i++) {
                            state.particles.push({
                                x: state.x, y: state.y + 24,
                                vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 4,
                                life: 30, color: '#ec4899'
                            });
                        }
                    }
                } else {
                    // Reset
                    state.x = 150;
                    state.y = 250;
                    state.vy = 0;
                    state.isGrounded = true;
                    state.tutorialPhase = 0;
                }
            } else if (activeTab === 'wrap') {
                // Tutorial: show screen wrap - keep grounded
                state.vx = 3;
                state.direction = 1;
                state.y = 290; // Keep on ground level
                state.vy = 0; // No vertical movement
                // Don't clamp, let it wrap
            }
            
            // ========== PHYSICS ==========
            // Jetpack - IGUAL AO JOGO (BURST quando caindo, GLIDE quando subindo)
            if (state.jetpackActive) {
                state.jetpackTimer--;
                
                // Jetpack force depends on vertical velocity (like the game)
                let force = 0.8;
                let isBurst = false;
                
                if (state.vy > 0) {
                    // BURST mode - falling, need more force
                    force = 2.0;
                    isBurst = true;
                } else {
                    // GLIDE mode - ascending, gentle force
                    force = state.vy < -6 ? 0.4 : 0.6;
                }
                
                state.vy = Math.max(state.vy - force, -8);
                
                if (state.jetpackTimer <= 0 && activeTab !== 'jetpack') {
                    state.jetpackActive = false;
                }
                
                // Flame particles - different colors for BURST vs GLIDE
                if (state.frame % 2 === 0) {
                    const pColor = isBurst ? '#f97316' : '#22d3ee'; // Orange for burst, cyan for glide
                    state.particles.push({
                        x: state.x + (Math.random() - 0.5) * 10, 
                        y: state.y + 24,
                        vx: (Math.random() - 0.5) * (isBurst ? 8 : 3), 
                        vy: (isBurst ? 10 : 4) + Math.random() * (isBurst ? 10 : 4),
                        life: isBurst ? 20 : 12, 
                        color: pColor
                    });
                    // Extra flame for burst mode
                    if (isBurst) {
                        state.particles.push({
                            x: state.x, y: state.y + 24,
                            vx: (Math.random() - 0.5) * 4, 
                            vy: 8 + Math.random() * 8,
                            life: 15, 
                            color: '#facc15' // Yellow inner flame
                        });
                    }
                }
            }
            
            // Gravity
            if (!state.isGrounded) {
                state.vy += GRAVITY;
            }
            
            // Apply velocity
            state.x += state.vx;
            state.y += state.vy;
            
            // Screen wrap (horizontal)
            if (activeTab === 'wrap') {
                if (state.x > canvas.width + 20) {
                    state.x = -20;
                    // Wrap effect particles
                    for (let i = 0; i < 5; i++) {
                        state.particles.push({
                            x: 5, y: state.y + Math.random() * 40 - 20,
                            vx: 3, vy: (Math.random() - 0.5) * 2,
                            life: 20, color: '#a855f7'
                        });
                    }
                }
            } else {
                // Normal boundary
                if (state.x < 20) state.x = 20;
                if (state.x > canvas.width - 20) state.x = canvas.width - 20;
            }
            
            // Platform collision + dissolve like game
            state.isGrounded = false;
            const playerBottom = state.y + 24;
            for (const plat of state.platforms) {
                // Skip fully dissolved platforms
                if (plat.dissolve !== undefined && plat.dissolve <= 0) continue;
                
                if (state.vy >= 0 && 
                    playerBottom >= plat.y && playerBottom <= plat.y + 15 &&
                    state.x >= plat.x - 10 && state.x <= plat.x + plat.w + 10) {
                    state.y = plat.y - 24;
                    state.vy = 0;
                    state.isGrounded = true;
                    
                    // Start dissolving when player lands (except ground platforms)
                    if (plat.y < 300 && plat.dissolve === undefined) {
                        plat.dissolving = true;
                        plat.dissolve = 1.0;
                    }
                }
            }
            
            // Update dissolving platforms
            state.platforms = state.platforms.map(plat => {
                if (plat.dissolving && plat.dissolve !== undefined) {
                    plat.dissolve -= 0.015; // Dissolve speed
                    // Create dissolve particles
                    if (Math.random() < 0.3 && plat.dissolve > 0) {
                        state.particles.push({
                            x: plat.x + Math.random() * plat.w,
                            y: plat.y,
                            vx: (Math.random() - 0.5) * 2,
                            vy: Math.random() * 2 + 1,
                            life: 15,
                            color: '#22d3ee'
                        });
                    }
                }
                return plat;
            }).filter(plat => plat.dissolve === undefined || plat.dissolve > 0);
            
            // Safety: don't fall below screen
            if (state.y > canvas.height - 30) {
                state.y = canvas.height - 54;
                state.vy = 0;
                state.isGrounded = true;
            }
            
            // ========== DRAWING ==========
            
            // Draw platforms with dissolve effect
            for (const plat of state.platforms) {
                const dissolveAlpha = plat.dissolve !== undefined ? plat.dissolve : 1;
                if (dissolveAlpha <= 0) continue;
                
                ctx.globalAlpha = dissolveAlpha;
                
                // Platform shadow
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.fillRect(plat.x + 4, plat.y + 4, plat.w, 10);
                
                // Platform body - color changes when dissolving
                const isDissolving = plat.dissolving && dissolveAlpha < 1;
                ctx.shadowColor = isDissolving ? '#ef4444' : '#06b6d4';
                ctx.shadowBlur = isDissolving ? 12 : 8;
                ctx.fillStyle = isDissolving ? '#dc2626' : '#0891b2';
                ctx.fillRect(plat.x, plat.y, plat.w, 10);
                ctx.shadowBlur = 0;
                
                // Platform top
                ctx.fillStyle = isDissolving ? '#f87171' : '#22d3ee';
                ctx.fillRect(plat.x, plat.y, plat.w, 3);
                
                ctx.globalAlpha = 1;
            }
            
            // Draw particles
            state.particles = state.particles.filter(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.life--;
                ctx.globalAlpha = p.life / 20;
                ctx.fillStyle = p.color;
                ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
                ctx.globalAlpha = 1;
                return p.life > 0;
            });
            
            // Draw character
            const pixels = currentSkin.pixels || [];
            const pixelSize = 3;
            const charWidth = (pixels[0]?.length || 16) * pixelSize;
            const charHeight = pixels.length * pixelSize;
            const startX = state.x - charWidth / 2;
            const startY = state.y - charHeight / 2;
            
            // Perfect jump glow (pink)
            if (state.perfectJumpReady && activeTab === 'perfect') {
                ctx.shadowColor = '#ec4899';
                ctx.shadowBlur = 25;
                ctx.fillStyle = 'rgba(236,72,153,0.3)';
                ctx.beginPath();
                ctx.arc(state.x, state.y, 35, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.shadowColor = currentSkin.color || '#f97316';
                ctx.shadowBlur = 12;
            }
            
            // Draw pixels
            pixels.forEach((row: number[], y: number) => {
                row.forEach((val: number, x: number) => {
                    if (val === 0) return;
                    let color = currentSkin.color || '#f97316';
                    if (val === 1) color = '#0f172a';
                    else if (val === 3) color = '#ffffff';
                    else if (val === 4) color = '#ffffff';
                    else if (val === 5) color = '#000000';
                    else if (val === 6) color = '#facc15';
                    
                    ctx.fillStyle = color;
                    const drawX = state.direction === -1 
                        ? startX + (pixels[0].length - 1 - x) * pixelSize 
                        : startX + x * pixelSize;
                    ctx.fillRect(drawX, startY + y * pixelSize, pixelSize, pixelSize);
                });
            });
            ctx.shadowBlur = 0;
            
            // Jetpack flame
            if (state.jetpackActive) {
                ctx.fillStyle = '#f97316';
                ctx.fillRect(state.x - 4, state.y + charHeight/2 - 5, 8, 10 + Math.random() * 10);
                ctx.fillStyle = '#facc15';
                ctx.fillRect(state.x - 2, state.y + charHeight/2, 4, 6 + Math.random() * 10);
            }
            
            // ========== TUTORIAL TEXT ==========
            ctx.font = 'bold 14px monospace';
            ctx.textAlign = 'center';
            
            if (activeTab === 'jetpack') {
                ctx.fillStyle = '#a855f7';
                ctx.fillText('🚀 JETPACK', canvas.width/2, 30);
                ctx.font = '11px monospace';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('Segure o botão roxo para voar', canvas.width/2, 50);
                ctx.fillText('Use para cruzar vãos!', canvas.width/2, 68);
            } else if (activeTab === 'perfect') {
                ctx.fillStyle = '#ec4899';
                ctx.fillText('⚡ PERFECT JUMP', canvas.width/2, 30);
                ctx.font = '11px monospace';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('Botão fica ROSA quando pronto', canvas.width/2, 50);
                ctx.fillText('Pula mais alto no momento certo!', canvas.width/2, 68);
                
                if (state.perfectJumpReady) {
                    ctx.fillStyle = '#ec4899';
                    ctx.font = 'bold 16px monospace';
                    ctx.fillText('🎯 AGORA! PULE!', canvas.width/2, canvas.height - 50);
                }
            } else if (activeTab === 'wrap') {
                ctx.fillStyle = '#a855f7';
                ctx.fillText('↔️ SCREEN WRAP', canvas.width/2, 30);
                ctx.font = '11px monospace';
                ctx.fillStyle = '#94a3b8';
                ctx.fillText('Saia por um lado da tela...', canvas.width/2, 50);
                ctx.fillText('...apareça do outro lado!', canvas.width/2, 68);
            }
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        
        return () => {
            cancelAnimationFrame(animationRef.current);
        };
    }, [currentSkin, activeTab]);
    
    const tabs = [
        { id: 'preview', label: '👁️', title: 'Preview' },
        { id: 'jetpack', label: '🚀', title: 'Jetpack' },
        { id: 'perfect', label: '⚡', title: 'Perfect' },
        { id: 'wrap', label: '↔️', title: 'Wrap' },
    ];
    
    return (
        <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-start p-2 overflow-hidden">
            {/* Close button */}
            <button onClick={onClose} className="absolute top-2 right-2 p-2 text-slate-400 hover:text-white z-10">
                <X size={24} />
            </button>
            
            {/* CHARACTER LIST - Horizontal Gallery at TOP */}
            <div className="w-full max-w-md mt-1 mb-2">
                <p className="text-[10px] text-slate-500 text-center mb-1">← DESLIZE PARA VER TODOS →</p>
                <div 
                    ref={listRef}
                    className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 px-2 snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {allSkins.map((s, i) => {
                        const isSelected = i === currentSkinIndex;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setCurrentSkinIndex(i)}
                                className={`flex-shrink-0 flex flex-col items-center p-1.5 rounded-lg border-2 transition-all snap-center ${
                                    isSelected 
                                        ? 'border-cyan-400 bg-cyan-900/40 shadow-[0_0_15px_rgba(6,182,212,0.5)] scale-110' 
                                        : 'border-slate-700 bg-slate-900/60 hover:border-slate-500 opacity-60 hover:opacity-100'
                                }`}
                                style={{ minWidth: '50px' }}
                            >
                                {/* Mini character */}
                                <div className={`w-8 h-8 ${isSelected ? 'animate-bounce' : ''}`} style={{ animationDuration: '0.6s' }}>
                                    <svg viewBox={`0 0 ${s.pixels?.length > 16 ? 24 : 16} ${s.pixels?.length > 16 ? 24 : 16}`} className="w-full h-full" shapeRendering="crispEdges">
                                        {(s?.pixels || []).map((row: number[], y: number) =>
                                            row.map((val: number, x: number) => {
                                                if (val === 0) return null;
                                                let color = s?.color || '#f97316';
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
                                {/* Name */}
                                <span className={`text-[7px] font-bold uppercase truncate max-w-[45px] ${isSelected ? 'text-cyan-300' : 'text-slate-500'}`}>
                                    {s.name || s.id}
                                </span>
                                {/* Index indicator */}
                                {isSelected && (
                                    <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
                {/* Position indicator */}
                <div className="flex justify-center gap-1 mt-1">
                    <span className="text-[10px] text-cyan-400 font-bold">{currentSkinIndex + 1}</span>
                    <span className="text-[10px] text-slate-600">/</span>
                    <span className="text-[10px] text-slate-500">{allSkins.length}</span>
                </div>
            </div>
            
            {/* Title - Character Name */}
            <h2 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-1">
                {currentSkin.name || currentSkin.id}
            </h2>
            
            {/* Tab buttons */}
            <div className="flex gap-1 mb-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            activeTab === tab.id 
                                ? 'bg-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.5)]' 
                                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                        title={tab.title}
                    >
                        {tab.label} {tab.title}
                    </button>
                ))}
            </div>
            
            {/* Canvas - slightly smaller */}
            <div className="relative">
                <canvas 
                    ref={canvasRef} 
                    width={280} 
                    height={320} 
                    className="rounded-xl border-2 border-slate-700 shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                />
                
                {/* Navigation arrows on canvas sides */}
                <button 
                    onClick={() => setCurrentSkinIndex((prev) => (prev - 1 + allSkins.length) % allSkins.length)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 p-2 bg-slate-800/90 rounded-full text-white hover:bg-cyan-600 z-10 border border-slate-600"
                >
                    <ChevronLeft size={20} />
                </button>
                
                <button 
                    onClick={() => setCurrentSkinIndex((prev) => (prev + 1) % allSkins.length)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 p-2 bg-slate-800/90 rounded-full text-white hover:bg-cyan-600 z-10 border border-slate-600"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
            
            {/* Action button - Select and Close */}
            <div className="flex gap-3 mt-3">
                <button
                    onClick={() => {
                        onSelectSkin(currentSkin);
                        onClose();
                    }}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-bold rounded-xl text-sm uppercase tracking-widest hover:from-cyan-500 hover:to-purple-500 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                    <Check size={16} className="inline mr-2" />
                    USAR {currentSkin.name || currentSkin.id}
                </button>
            </div>
        </div>
    );
};

export const StartScreen = ({ gameState, setGameState, availableSkins, showAiInput, setShowAiInput, aiPrompt, setAiPrompt, isGeneratingSkin, handleGenerateSkin, handleStart, onOpenControls, onOpenCalibration, onOpenSettings, selectedIndex, gyroEnabled, setGyroEnabled }: any) => {
    // SAFETY: Ensure availableSkins is always an array
    const safeSkins = Array.isArray(availableSkins) ? availableSkins : [];

    const [lang, setLang] = useState<'EN' | 'PT'>('EN');
    const [showSensorDebug, setShowSensorDebug] = useState(false);
    const [showRanking, setShowRanking] = useState(false);
    const [showAdminPanel, setShowAdminPanel] = useState(false);
    const [secretCode, setSecretCode] = useState('');
    const [showCharacterPreview, setShowCharacterPreview] = useState(false);
    const [showChallengeModal, setShowChallengeModal] = useState<CharacterChallenge | null>(null);
    const [unlockedCharacters, setUnlockedCharacters] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('UNLOCKED_CHARACTERS');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });
    const [weedMode, setWeedMode] = useState(() => {
        try { return localStorage.getItem('WEED_MODE') === 'true'; } catch { return false; }
    });
    
    // Characters that are ALWAYS unlocked (starter pack)
    const STARTER_CHARACTERS = ['ginger', 'kero']; // GINGER and KERO always unlocked
    
    // Check if a skin is locked
    const isCharacterLocked = (skinId: string): boolean => {
        // Starter characters are never locked
        if (STARTER_CHARACTERS.includes(skinId)) return false;
        // Trophy skins have their own unlock system
        if (skinId.startsWith('trophy_')) return false;
        // AI generated skins are never locked
        if (skinId.startsWith('ai_')) return false;
        // Check if character has a challenge
        const challenge = CHARACTER_CHALLENGES.find(c => c.skinId === skinId);
        if (!challenge) return false; // No challenge = unlocked
        // Check if unlocked
        return !unlockedCharacters.includes(skinId);
    };
    
    // Get challenge for a character
    const getCharacterChallenge = (skinId: string): CharacterChallenge | undefined => {
        return CHARACTER_CHALLENGES.find(c => c.skinId === skinId);
    };
    
    // Handle clicking on locked character
    const handleLockedCharacterClick = (skinId: string) => {
        const challenge = getCharacterChallenge(skinId);
        if (challenge) {
            setShowChallengeModal(challenge);
        }
    };
    
    // Secret code detection - type "chocopro" to open admin panel
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            const newCode = (secretCode + e.key).slice(-8);
            setSecretCode(newCode);
            if (newCode === 'chocopro') {
                setShowAdminPanel(true);
                setSecretCode('');
            }
        };
        window.addEventListener('keypress', handleKeyPress);
        return () => window.removeEventListener('keypress', handleKeyPress);
    }, [secretCode]);

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



    // Weed mode translations
    const weedT = {
        title: weedMode ? '420 INFINITIV' : 'AI INFINITIV',
        subtitle: weedMode ? 'Pega a Brisa Protocol' : 'Vertical Ascent Protocol',
        start: weedMode ? 'ACENDE ESSA' : t[lang].start,
        skin: weedMode ? 'ESCOLHE TEU BECK' : t[lang].skin,
        highScore: weedMode ? 'MAIOR VIAGEM' : t[lang].highScore,
        coins: weedMode ? 'BECK COINS' : t[lang].coins,
        motion: weedMode ? 'BALANCA' : 'MOTION',
        controls: weedMode ? 'CONTROLA' : t[lang].controls,
        ranking: weedMode ? 'OS MAIS CHAPADOS' : 'RANKING GLOBAL',
    };

    const toggleWeedMode = () => {
        const newMode = !weedMode;
        setWeedMode(newMode);
        try { localStorage.setItem('WEED_MODE', String(newMode)); } catch {}
    };

    return (
        <div className={`absolute inset-0 z-50 flex flex-col items-center backdrop-blur-md overflow-y-auto custom-scrollbar ${weedMode ? 'bg-green-950/95' : 'bg-black/90'}`}>
            {/* UPDATE BUTTON - FIXED position always visible */}
            <button
                onClick={async () => {
                    try {
                        if ('caches' in window) {
                            const cacheNames = await caches.keys();
                            await Promise.all(cacheNames.map(name => caches.delete(name)));
                        }
                        if ('serviceWorker' in navigator) {
                            const registrations = await navigator.serviceWorker.getRegistrations();
                            await Promise.all(registrations.map(reg => reg.unregister()));
                        }
                        window.location.href = window.location.href.split('?')[0] + '?v=' + Date.now();
                    } catch (e) {
                        window.location.reload();
                    }
                }}
                className="fixed top-2 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] uppercase tracking-wider rounded border-2 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:shadow-[0_0_25px_rgba(6,182,212,0.8)] transition-all flex items-center gap-2"
            >
                <RefreshCw size={12} className="animate-spin-slow" /> UPDATE <span className="text-yellow-300 font-mono">{Constants.APP_VERSION}</span>
            </button>

            {/* WEED MODE TOGGLE */}
            <button 
                onClick={toggleWeedMode}
                className={`fixed top-2 right-2 z-[100] px-3 py-2 rounded font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 transition-all border ${weedMode ? 'bg-green-600 text-white border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : 'bg-slate-800/80 text-slate-400 border-slate-600 hover:bg-slate-700/80'}`}
            >
                420 {weedMode ? 'ON' : 'OFF'}
            </button>

            {/* HEADER */}
            <div className="mb-4 md:mb-8 text-center relative shrink-0 mt-12">
                <div className={`absolute -inset-10 blur-3xl rounded-full animate-pulse ${weedMode ? 'bg-green-500/30' : 'bg-cyan-500/20'}`}></div>
                <h1 className={`text-4xl md:text-8xl font-black italic tracking-tighter text-white relative z-10 ${weedMode ? 'drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]' : 'drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]'}`}>
                    {weedMode ? '420 ' : 'AI '}<span className={`text-transparent bg-clip-text ${weedMode ? 'bg-gradient-to-r from-green-400 via-lime-400 to-green-500' : 'bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500'}`}>INFINITIV</span>
                </h1>
                
                <p className={`font-mono tracking-[0.5em] text-[10px] md:text-sm mt-2 font-bold uppercase ${weedMode ? 'text-green-500' : 'text-cyan-500'}`}>{weedT.subtitle}</p>
                <p className="text-slate-600 text-[10px] mt-1 font-mono">Criado por <span className="text-cyan-400">AI</span> & <span className="text-purple-400">ChocoPro</span></p>
            </div>

            {/* RANKING BUTTON - PRINCIPAL - Antes de tudo */}
            <div className="w-full max-w-4xl px-4 md:px-8 mb-4 relative z-10">
                <button 
                    onClick={() => setShowRanking(true)} 
                    className={`w-full py-4 rounded-2xl text-lg font-black transition-all flex items-center justify-center gap-3 border-2 ${weedMode ? 'bg-gradient-to-r from-green-800 to-lime-700 border-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:shadow-[0_0_50px_rgba(34,197,94,0.7)]' : 'bg-gradient-to-r from-yellow-700 via-amber-600 to-yellow-700 border-yellow-400 text-white shadow-[0_0_30px_rgba(234,179,8,0.5)] hover:shadow-[0_0_50px_rgba(234,179,8,0.7)]'} animate-pulse hover:animate-none`}
                >
                    <Trophy size={24} className="text-yellow-300" /> {weedT.ranking} <Crown size={20} className="text-yellow-300" />
                </button>
            </div>

            {/* MAIN MENU GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-w-4xl px-4 md:px-8 relative z-10 pb-32">

                {/* LEFT COLUMN - CHARACTER */}
                <div className={`border rounded-2xl p-6 backdrop-blur-sm flex flex-col items-center ${weedMode ? 'bg-green-900/30 border-green-700' : 'bg-slate-900/50 border-slate-800'}`}>
                    <h3 className={`text-xs font-bold tracking-[0.2em] mb-4 uppercase ${weedMode ? 'text-green-400' : 'text-slate-400'}`}>{weedT.skin}</h3>

                    {/* Character Preview Box - Click for Tutorial */}
                    <div 
                        className="relative w-36 h-40 mb-2 group cursor-pointer rounded-xl border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 transition-all hover:scale-105" 
                        onClick={() => setShowCharacterPreview(true)}
                    >
                        {/* Hover instruction */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                            <span className="text-[10px] font-bold text-cyan-400 animate-pulse">👆 TOQUE PARA TUTORIAL</span>
                        </div>
                        
                        {/* Background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-600/20 rounded-xl group-hover:from-cyan-500/30 group-hover:to-purple-600/30 transition-all"></div>
                        
                        {/* Character */}
                        <div className="w-full h-full p-3 flex items-center justify-center">
                            <svg viewBox={`0 0 ${gameState.selectedSkin?.pixels?.length > 16 ? 24 : 16} ${gameState.selectedSkin?.pixels?.length > 16 ? 24 : 16}`} className="w-24 h-24 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] group-hover:drop-shadow-[0_0_25px_rgba(6,182,212,0.6)] transition-all" shapeRendering="crispEdges">
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
                        
                        {/* Character name */}
                        <p className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold text-cyan-400 uppercase tracking-wider whitespace-nowrap bg-black/60 px-2 py-0.5 rounded">{gameState.selectedSkin?.name || ''}</p>
                        
                        {/* Tutorial icon */}
                        <div className="absolute top-2 right-2 bg-cyan-500/80 p-1.5 rounded-lg border border-cyan-300/50 animate-bounce" style={{ animationDuration: '2s' }}>
                            <HelpCircle size={14} className="text-white" />
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
                        <>
                            {/* Regular skins with animation */}
                            <div className="flex gap-2 w-full overflow-x-auto custom-scrollbar pb-2">
                                {safeSkins.map((skin: any, i: number) => {
                                    const isSelected = gameState.selectedSkin.id === skin.id;
                                    const isLocked = isCharacterLocked(skin.id);
                                    const challenge = getCharacterChallenge(skin.id);
                                    
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => {
                                                if (isLocked) {
                                                    handleLockedCharacterClick(skin.id);
                                                } else {
                                                    setGameState((prev: any) => ({ ...prev, selectedSkin: skin }));
                                                }
                                            }}
                                            className={`flex-shrink-0 flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all relative ${
                                                isLocked 
                                                    ? 'border-red-800/50 bg-red-950/30 hover:border-red-600' 
                                                    : isSelected 
                                                        ? 'border-cyan-400 bg-cyan-900/30 shadow-[0_0_10px_rgba(6,182,212,0.3)]' 
                                                        : 'border-slate-800 bg-slate-900/50 hover:border-slate-600'
                                            }`}
                                        >
                                            <span className={`text-[8px] font-bold uppercase tracking-wider ${isLocked ? 'text-red-400' : 'text-slate-300'}`}>
                                                {isLocked ? '🔒' : ''} {skin.name || skin.id}
                                            </span>
                                            <div className={`w-10 h-10 relative ${isSelected && !isLocked ? 'animate-bounce' : ''}`} style={{ animationDuration: '0.6s' }}>
                                                <svg 
                                                    viewBox={`0 0 ${skin.pixels?.length > 16 ? 24 : 16} ${skin.pixels?.length > 16 ? 24 : 16}`} 
                                                    className={`w-full h-full ${isLocked ? 'grayscale opacity-40' : ''}`} 
                                                    shapeRendering="crispEdges"
                                                >
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
                                                {/* Lock overlay */}
                                                {isLocked && (
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <Lock size={14} className="text-red-500 drop-shadow-[0_0_4px_rgba(239,68,68,0.8)]" />
                                                    </div>
                                                )}
                                            </div>
                                            {/* Challenge hint */}
                                            {isLocked && challenge && (
                                                <span className="text-[6px] text-red-400 mt-0.5">{challenge.emoji}</span>
                                            )}
                                        </button>
                                    );
                                })}
                                
                                {/* GLITCH - AI Create Button */}
                                <button
                                    onClick={() => setShowAiInput(true)}
                                    className="flex-shrink-0 flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all border-purple-500/50 bg-purple-900/20 hover:border-purple-400 hover:bg-purple-900/40 relative overflow-hidden group"
                                >
                                    <span className="text-[8px] font-bold text-purple-400 uppercase tracking-wider animate-pulse">+ AI</span>
                                    <div className="w-10 h-10 relative">
                                        {/* Glitch character - distorted humanoid */}
                                        <svg viewBox="0 0 16 16" className="w-full h-full animate-pulse" shapeRendering="crispEdges">
                                            {/* Glitchy body with random colors */}
                                            {[
                                                [0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0],
                                                [0,0,0,0,0,2,3,3,3,3,2,0,0,0,0,0],
                                                [0,0,0,0,2,3,1,3,3,1,3,2,0,0,0,0],
                                                [0,0,0,0,2,3,3,3,3,3,3,2,0,0,0,0],
                                                [0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0],
                                                [0,0,0,0,0,0,2,2,2,2,0,0,0,0,0,0],
                                                [0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0],
                                                [0,0,0,2,2,2,2,2,2,2,2,2,2,0,0,0],
                                                [0,0,2,2,2,2,2,2,2,2,2,2,2,2,0,0],
                                                [0,0,2,0,0,2,2,2,2,2,2,0,0,2,0,0],
                                                [0,0,2,0,0,2,2,2,2,2,2,0,0,2,0,0],
                                                [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
                                                [0,0,0,0,0,2,2,0,0,2,2,0,0,0,0,0],
                                                [0,0,0,0,2,2,2,0,0,2,2,2,0,0,0,0],
                                                [0,0,0,0,2,2,0,0,0,0,2,2,0,0,0,0],
                                                [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                                            ].map((row, y) =>
                                                row.map((val, x) => {
                                                    if (val === 0) return null;
                                                    // Glitch colors - random between magenta, cyan, lime
                                                    const glitchColors = ['#ff00ff', '#00ffff', '#00ff00', '#ff0000', '#ffff00'];
                                                    let color = glitchColors[(x + y) % glitchColors.length];
                                                    if (val === 1) color = '#ffffff'; // eyes
                                                    if (val === 3) color = '#000000'; // face details
                                                    return <rect key={`g-${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} className="animate-pulse" style={{ animationDelay: `${(x + y) * 50}ms` }} />;
                                                })
                                            )}
                                        </svg>
                                        {/* Glitch effect overlay lines */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-1/4 left-0 right-0 h-px bg-cyan-400 opacity-50 animate-pulse" style={{ animationDuration: '0.2s' }}></div>
                                            <div className="absolute top-1/2 left-0 right-0 h-px bg-magenta-400 opacity-50 animate-pulse" style={{ animationDuration: '0.3s' }}></div>
                                            <div className="absolute top-3/4 left-0 right-0 h-px bg-lime-400 opacity-50 animate-pulse" style={{ animationDuration: '0.15s' }}></div>
                                        </div>
                                    </div>
                                    {/* Sparkle icon */}
                                    <Sparkles size={10} className="absolute top-0 right-0 text-purple-400 animate-spin" style={{ animationDuration: '3s' }} />
                                </button>
                            </div>
                            
                            {/* Trophy Skins Section - Prizes */}
                            {(() => {
                                const unlockedTrophies = getUnlockedTrophySkins();
                                const selectedTrophyId = gameState.selectedSkin?.id;
                                const selectedTrophyPower = selectedTrophyId && TROPHY_POWERS[selectedTrophyId];
                                
                                return (
                                    <div className="mt-3 w-full">
                                        <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                            🏆 Prêmios TOP 3
                                        </div>
                                        
                                        {/* Show selected trophy powers */}
                                        {selectedTrophyPower && (
                                            <div className="mb-2 p-2 rounded-lg bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-500/30 animate-pulse">
                                                <div className="text-[10px] font-bold text-yellow-300 text-center">
                                                    ⚡ PODERES ATIVOS ⚡
                                                </div>
                                                <div className="text-[9px] text-yellow-200 text-center mt-1">
                                                    {selectedTrophyPower.description}
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className="flex gap-2 flex-wrap">
                                            {/* GOLD - 1st Place */}
                                            {(() => {
                                                const goldData = unlockedTrophies.find(t => t.skin.id === 'trophy_gold');
                                                const hasGold = goldData && goldData.gamesRemaining > 0;
                                                const isGoldSelected = gameState.selectedSkin?.id === 'trophy_gold';
                                                return (
                                                    <button
                                                        onClick={() => hasGold && setGameState((prev: any) => ({ ...prev, selectedSkin: TROPHY_GOLD }))}
                                                        className={`flex-shrink-0 flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all relative ${
                                                            isGoldSelected ? 'border-yellow-400 bg-yellow-900/30 shadow-[0_0_15px_rgba(255,215,0,0.5)]' : 
                                                            hasGold ? 'border-yellow-600/50 bg-yellow-900/20 hover:border-yellow-500' : 
                                                            'border-slate-800 bg-slate-900/50 opacity-50'
                                                        }`}
                                                        disabled={!hasGold}
                                                        title={TROPHY_POWERS.trophy_gold.description}
                                                    >
                                                        <span className="text-[8px] font-bold text-yellow-400 uppercase">👑 1º</span>
                                                        <div className={`w-10 h-10 ${isGoldSelected ? 'animate-bounce' : ''}`} style={{ animationDuration: '0.5s' }}>
                                                            <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
                                                                {TROPHY_GOLD.pixels.map((row: number[], y: number) =>
                                                                    row.map((val: number, x: number) => {
                                                                        if (val === 0) return null;
                                                                        let color = '#ffd700';
                                                                        if (val === 1) color = '#0f172a';
                                                                        else if (val === 3) color = '#ffffff';
                                                                        else if (val === 4) color = '#ffffff';
                                                                        else if (val === 5) color = '#000000';
                                                                        else if (val === 6) color = '#ffd700';
                                                                        return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
                                                                    })
                                                                )}
                                                            </svg>
                                                        </div>
                                                        {hasGold && (
                                                            <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded-full">{goldData.gamesRemaining}x</span>
                                                        )}
                                                        {!hasGold && <span className="text-[6px] text-slate-500">Seja 1º</span>}
                                                    </button>
                                                );
                                            })()}
                                            
                                            {/* SILVER - 2nd Place */}
                                            {(() => {
                                                const silverData = unlockedTrophies.find(t => t.skin.id === 'trophy_silver');
                                                const hasSilver = silverData && silverData.gamesRemaining > 0;
                                                const isSilverSelected = gameState.selectedSkin?.id === 'trophy_silver';
                                                return (
                                                    <button
                                                        onClick={() => hasSilver && setGameState((prev: any) => ({ ...prev, selectedSkin: TROPHY_SILVER }))}
                                                        className={`flex-shrink-0 flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all relative ${
                                                            isSilverSelected ? 'border-slate-300 bg-slate-700/30 shadow-[0_0_15px_rgba(192,192,192,0.5)]' : 
                                                            hasSilver ? 'border-slate-500/50 bg-slate-800/20 hover:border-slate-400' : 
                                                            'border-slate-800 bg-slate-900/50 opacity-50'
                                                        }`}
                                                        disabled={!hasSilver}
                                                        title={TROPHY_POWERS.trophy_silver.description}
                                                    >
                                                        <span className="text-[8px] font-bold text-slate-300 uppercase">🥈 2º</span>
                                                        <div className={`w-10 h-10 ${isSilverSelected ? 'animate-bounce' : ''}`} style={{ animationDuration: '0.5s' }}>
                                                            <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
                                                                {TROPHY_SILVER.pixels.map((row: number[], y: number) =>
                                                                    row.map((val: number, x: number) => {
                                                                        if (val === 0) return null;
                                                                        let color = '#c0c0c0';
                                                                        if (val === 1) color = '#0f172a';
                                                                        else if (val === 3) color = '#e8e8e8';
                                                                        else if (val === 4) color = '#ffffff';
                                                                        else if (val === 5) color = '#000000';
                                                                        return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
                                                                    })
                                                                )}
                                                            </svg>
                                                        </div>
                                                        {hasSilver && (
                                                            <span className="absolute -top-1 -right-1 bg-slate-400 text-black text-[8px] font-bold px-1 rounded-full">{silverData.gamesRemaining}x</span>
                                                        )}
                                                        {!hasSilver && <span className="text-[6px] text-slate-500">Seja 2º</span>}
                                                    </button>
                                                );
                                            })()}
                                            
                                            {/* BRONZE - 3rd Place */}
                                            {(() => {
                                                const bronzeData = unlockedTrophies.find(t => t.skin.id === 'trophy_bronze');
                                                const hasBronze = bronzeData && bronzeData.gamesRemaining > 0;
                                                const isBronzeSelected = gameState.selectedSkin?.id === 'trophy_bronze';
                                                return (
                                                    <button
                                                        onClick={() => hasBronze && setGameState((prev: any) => ({ ...prev, selectedSkin: TROPHY_BRONZE }))}
                                                        className={`flex-shrink-0 flex flex-col items-center gap-1 p-1 rounded-lg border-2 transition-all relative ${
                                                            isBronzeSelected ? 'border-orange-400 bg-orange-900/30 shadow-[0_0_15px_rgba(205,127,50,0.5)]' : 
                                                            hasBronze ? 'border-orange-600/50 bg-orange-900/20 hover:border-orange-500' : 
                                                            'border-slate-800 bg-slate-900/50 opacity-50'
                                                        }`}
                                                        disabled={!hasBronze}
                                                        title={TROPHY_POWERS.trophy_bronze.description}
                                                    >
                                                        <span className="text-[8px] font-bold text-orange-400 uppercase">🥉 3º</span>
                                                        <div className={`w-10 h-10 ${isBronzeSelected ? 'animate-bounce' : ''}`} style={{ animationDuration: '0.5s' }}>
                                                            <svg viewBox="0 0 16 16" className="w-full h-full" shapeRendering="crispEdges">
                                                                {TROPHY_BRONZE.pixels.map((row: number[], y: number) =>
                                                                    row.map((val: number, x: number) => {
                                                                        if (val === 0) return null;
                                                                        let color = '#cd7f32';
                                                                        if (val === 1) color = '#0f172a';
                                                                        else if (val === 3) color = '#dda15e';
                                                                        else if (val === 4) color = '#ffffff';
                                                                        else if (val === 5) color = '#000000';
                                                                        return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
                                                                    })
                                                                )}
                                                            </svg>
                                                        </div>
                                                        {hasBronze && (
                                                            <span className="absolute -top-1 -right-1 bg-orange-500 text-black text-[8px] font-bold px-1 rounded-full">{bronzeData.gamesRemaining}x</span>
                                                        )}
                                                        {!hasBronze && <span className="text-[6px] text-slate-500">Seja 3º</span>}
                                                    </button>
                                                );
                                            })()}
                                        </div>
                                        <div className="text-[8px] text-slate-500 mt-1">Fique no TOP 3 do ranking para ganhar skins especiais! (3 jogadas cada)</div>
                                    </div>
                                );
                            })()}
                        </>
                    )}
                </div>

                {/* RIGHT COLUMN - ACTIONS */}
                <div className="flex flex-col gap-4">
                    {/* START BUTTON */}
                    <button
                        onClick={() => handleStart('NORMAL')}
                        className={`w-full py-4 md:py-6 font-black text-xl md:text-2xl rounded-2xl transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 border ${weedMode ? 'bg-gradient-to-r from-green-600 to-lime-500 hover:from-green-500 hover:to-lime-400 shadow-[0_0_30px_rgba(34,197,94,0.5)] text-white border-green-400/30' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] border-cyan-400/30'} ${selectedIndex === 0 ? 'ring-2 ring-white scale-[1.02]' : ''}`}
                    >
                        <Play size={24} className="md:w-7 md:h-7" fill="currentColor" /> {weedT.start}
                    </button>

                    {/* SHOP BUTTON */}
                    <button
                        onClick={() => setGameState((p: any) => ({ ...p, isShopOpen: true }))}
                        className="w-full py-3 md:py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-black text-base md:text-lg rounded-xl shadow-[0_0_20px_rgba(202,138,4,0.4)] hover:shadow-[0_0_40px_rgba(202,138,4,0.6)] transition-all transform hover:scale-[1.02] flex items-center justify-center gap-3 border border-yellow-400/30"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                        LOJA ({gameState.totalCoins})
                    </button>

                    {/* CONTROL MODE TOGGLE */}
                    <div className="grid grid-cols-4 gap-1 md:gap-3">
                        {/* BUTTONS MODE */}
                        <button
                            onClick={() => setGameState((p: any) => ({ ...p, mobileControlMode: 'BUTTONS' }))}
                            className={`py-2 md:py-4 rounded-xl border-2 font-bold text-[8px] md:text-sm flex flex-col items-center gap-1 transition-all ${gameState.mobileControlMode === 'BUTTONS' ? 'bg-slate-800 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                        >
                            <Gamepad2 size={18} className="md:w-6 md:h-6" />
                            BUTTONS
                        </button>

                        {/* ARROWS MODE */}
                        <button
                            onClick={() => setGameState((p: any) => ({ ...p, mobileControlMode: 'ARROWS' }))}
                            className={`py-2 md:py-4 rounded-xl border-2 font-bold text-[8px] md:text-sm flex flex-col items-center gap-1 transition-all ${gameState.mobileControlMode === 'ARROWS' ? 'bg-slate-800 border-green-500 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                        >
                            <ArrowUp size={18} className="md:w-6 md:h-6" />
                            ARROWS
                        </button>

                        {/* JOYSTICK MODE */}
                        <button
                            onClick={() => setGameState((p: any) => ({ ...p, mobileControlMode: 'JOYSTICK' }))}
                            className={`py-2 md:py-4 rounded-xl border-2 font-bold text-[8px] md:text-sm flex flex-col items-center gap-1 transition-all ${gameState.mobileControlMode === 'JOYSTICK' ? 'bg-slate-800 border-cyan-500 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                        >
                            <Move size={18} className="md:w-6 md:h-6" />
                            JOYSTICK
                        </button>

                        {/* TILT/MOTION MODE */}
                        <button
                            onClick={async () => {
                                console.log('MOTION button clicked');
                                // Request motion permission first
                                if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                                    console.log('iOS detected - requesting permission');
                                    try {
                                        const permission = await (DeviceOrientationEvent as any).requestPermission();
                                        console.log('iOS permission result:', permission);
                                        if (permission === 'granted') {
                                            if (setGyroEnabled) setGyroEnabled(true);
                                            setGameState((p: any) => ({ ...p, mobileControlMode: 'TILT' }));
                                        } else {
                                            alert('⚠️ Permission denied. Enable sensors in browser settings.');
                                        }
                                    } catch (e) {
                                        console.error('Permission error:', e);
                                        alert('❌ Error requesting sensor permission.');
                                    }
                                } else {
                                    // Android or desktop - no permission needed
                                    console.log('Android/Desktop - no permission needed, enabling TILT');
                                    if (setGyroEnabled) setGyroEnabled(true);
                                    setGameState((p: any) => ({ ...p, mobileControlMode: 'TILT' }));
                                }
                            }}
                            className={`py-2 md:py-4 rounded-xl border-2 font-bold text-[8px] md:text-sm flex flex-col items-center gap-1 transition-all ${gameState.mobileControlMode === 'TILT' ? 'bg-purple-800 border-purple-500 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:border-slate-600'}`}
                        >
                            <Smartphone size={18} className="md:w-6 md:h-6" />
                            {gameState.mobileControlMode === 'TILT' ? (gyroEnabled ? '✓ MOTION' : '⏳') : 'MOTION'}
                        </button>
                    </div>

                    {/* SENSOR DEBUG BUTTON - Only show when MOTION is selected */}
                    {gameState.mobileControlMode === 'TILT' && (
                        <button
                            onClick={() => setShowSensorDebug(true)}
                            className="w-full py-2 bg-cyan-900/50 border border-cyan-700 rounded-lg text-xs font-bold text-cyan-400 hover:bg-cyan-800/50 transition-all flex items-center justify-center gap-2"
                        >
                            <HelpCircle size={14} /> SENSOR DIAGNOSTICS
                        </button>
                    )}

                    {/* UTILS ROW */}
                    <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setLang(lang === 'EN' ? 'PT' : 'EN')} className="py-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-all">
                            {lang === 'EN' ? '🇺🇸 EN' : '🇧🇷 PT'}
                        </button>
                        <button onClick={toggleFullscreen} className="py-3 bg-slate-900/80 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:border-slate-500 transition-all flex items-center justify-center gap-1">
                            <Maximize size={14} /> {t[lang].fullscreen}
                        </button>
                        <button onClick={onOpenSettings} className="py-3 bg-purple-900/80 border border-purple-600 rounded-lg text-xs font-bold text-purple-300 hover:text-white hover:border-purple-400 transition-all flex items-center justify-center gap-1">
                            <Settings size={14} /> SET
                        </button>
                    </div>
                </div>
            </div>

            {/* FOOTER STATS */}
            <div className={`mt-8 flex gap-8 font-mono text-xs font-bold ${weedMode ? 'text-green-600' : 'text-slate-500'}`}>
                <div className="flex items-center gap-2">
                    <Trophy size={14} className={weedMode ? 'text-green-500' : 'text-yellow-600'} />
                    <span>{weedT.highScore}: <span className={weedMode ? 'text-green-400' : 'text-yellow-500'}>{gameState.highScore}m</span></span>
                </div>
                <div className="flex items-center gap-2">
                    <Coins size={14} className={weedMode ? 'text-green-500' : 'text-yellow-600'} />
                    <span>{weedT.coins}: <span className={weedMode ? 'text-green-400' : 'text-yellow-500'}>{gameState.totalCoins}</span></span>
                </div>
            </div>

            {/* SENSOR DEBUG MODAL */}
            {showSensorDebug && <SensorDebugModal onClose={() => setShowSensorDebug(false)} />}
            
            {/* RANKING MODAL */}
            <RankingModal isOpen={showRanking} onClose={() => setShowRanking(false)} />
            
            {/* CHARACTER PREVIEW MODAL */}
            {showCharacterPreview && (
                <CharacterPreviewModal 
                    skin={gameState.selectedSkin} 
                    onClose={() => setShowCharacterPreview(false)} 
                    onSelectSkin={(skin) => setGameState((prev: any) => ({ ...prev, selectedSkin: skin }))}
                    allSkins={safeSkins}
                />
            )}
            
            {/* CHALLENGE MODAL - shows when clicking locked character */}
            {showChallengeModal && (
                <div className="fixed inset-0 z-[250] bg-black/95 flex items-center justify-center p-4" onClick={() => setShowChallengeModal(null)}>
                    <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(239,68,68,0.3)] animate-in zoom-in-90 duration-200" onClick={e => e.stopPropagation()}>
                        {/* Lock icon */}
                        <div className="flex justify-center mb-4">
                            <div className="p-4 rounded-full bg-red-900/40 border-2 border-red-500/50">
                                <Lock size={32} className="text-red-400" />
                            </div>
                        </div>
                        
                        {/* Character preview */}
                        {(() => {
                            const skin = safeSkins.find((s: any) => s.id === showChallengeModal.skinId);
                            return skin ? (
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 grayscale opacity-50">
                                        <svg viewBox={`0 0 ${skin.pixels?.length > 16 ? 24 : 16} ${skin.pixels?.length > 16 ? 24 : 16}`} className="w-full h-full" shapeRendering="crispEdges">
                                            {(skin?.pixels || []).map((row: number[], y: number) =>
                                                row.map((val: number, x: number) => {
                                                    if (val === 0) return null;
                                                    let color = skin?.color || '#f97316';
                                                    if (val === 1) color = '#0f172a';
                                                    else if (val === 3) color = '#ffffff';
                                                    return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
                                                })
                                            )}
                                        </svg>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                        
                        {/* Title */}
                        <h2 className="text-xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 mb-2">
                            {showChallengeModal.emoji} {showChallengeModal.title}
                        </h2>
                        
                        {/* Character name */}
                        <p className="text-center text-slate-400 text-sm mb-4 uppercase tracking-wider">
                            Desbloquear: <span className="text-white font-bold">{safeSkins.find((s: any) => s.id === showChallengeModal.skinId)?.name || showChallengeModal.skinId}</span>
                        </p>
                        
                        {/* Challenge description */}
                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
                            <p className="text-center text-lg font-bold text-yellow-400">
                                🎯 DESAFIO
                            </p>
                            <p className="text-center text-white mt-2 text-sm">
                                {showChallengeModal.description}
                            </p>
                        </div>
                        
                        {/* Difficulty indicator */}
                        <div className="flex justify-center gap-1 mb-4">
                            {[1, 2, 3].map((i) => {
                                const difficulty = 
                                    showChallengeModal.requirement === 'world_record' ? 3 :
                                    showChallengeModal.targetValue >= 1000 ? 3 :
                                    showChallengeModal.targetValue >= 100 ? 2 : 1;
                                return (
                                    <div 
                                        key={i}
                                        className={`w-3 h-3 rounded-full ${i <= difficulty ? 'bg-red-500' : 'bg-slate-700'}`}
                                    />
                                );
                            })}
                            <span className="text-[10px] text-slate-500 ml-2">
                                {showChallengeModal.requirement === 'world_record' ? 'LENDÁRIO' :
                                 showChallengeModal.targetValue >= 1000 ? 'DIFÍCIL' :
                                 showChallengeModal.targetValue >= 100 ? 'MÉDIO' : 'FÁCIL'}
                            </span>
                        </div>
                        
                        {/* Close button */}
                        <button
                            onClick={() => setShowChallengeModal(null)}
                            className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold rounded-xl hover:from-red-500 hover:to-orange-500 transition-all"
                        >
                            ACEITAR DESAFIO 💪
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ====================================================================================
// RANKING MODAL - Global Leaderboard Display
// ====================================================================================

// Helper to get skin by ID
const getSkinById = (skinId?: string): CharacterSkin | null => {
    if (!skinId) return null;
    // Check regular skins
    const skin = SKINS.find(s => s.id === skinId);
    if (skin) return skin;
    // Check trophy skins
    if (skinId === 'trophy_gold') return TROPHY_GOLD;
    if (skinId === 'trophy_silver') return TROPHY_SILVER;
    if (skinId === 'trophy_bronze') return TROPHY_BRONZE;
    return null;
};

// Mini character renderer for leaderboard - with fallback
const MiniCharacter = ({ skinId, size = 24 }: { skinId?: string; size?: number }) => {
    const skin = getSkinById(skinId);
    
    // Fallback: show colored user icon if no valid skin
    if (!skin || !skin.pixels || skin.pixels.length === 0) {
        return (
            <div className="flex items-center justify-center w-full h-full bg-slate-800 rounded">
                <User size={size * 0.7} className="text-cyan-400" />
            </div>
        );
    }
    
    const viewBoxSize = skin.pixels.length > 16 ? 24 : 16;
    return (
        <svg viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} width={size} height={size} shapeRendering="crispEdges">
            {skin.pixels.map((row: number[], y: number) =>
                row.map((val: number, x: number) => {
                    if (val === 0) return null;
                    let color = skin.color || '#f97316';
                    if (val === 1) color = '#0f172a';
                    else if (val === 3) color = '#ffffff';
                    else if (val === 4) color = '#ffffff';
                    else if (val === 5) color = '#000000';
                    else if (val === 6) color = '#facc15';
                    return <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={color} />;
                })
            )}
        </svg>
    );
};

export const RankingModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
    const [localLeaderboard, setLocalLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'local' | 'global'>('local');
    const [globalStatus, setGlobalStatus] = useState<string>('');

    const fetchLeaderboard = async () => {
        // LOCAL: Always load instantly
        const localData = Persistence.loadLeaderboard();
        setLocalLeaderboard(localData.length > 0 ? localData : [
            { id: '1', name: 'Você', score: 0, date: '' },
        ]);
        
        // GLOBAL: Try to fetch
        setLoading(true);
        setGlobalStatus('Conectando...');
        
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);
            
            const res = await fetch('/api/leaderboard', { 
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timeout);
            
            const data = await res.json();
            
            if (data.offline) {
                setGlobalStatus('❌ Redis não configurado');
                setGlobalLeaderboard([]);
            } else if (data.success && data.leaderboard?.length > 0) {
                const hasRealData = data.leaderboard.some((e: any) => e.name !== '- - -' && e.score > 0);
                if (hasRealData) {
                    setGlobalLeaderboard(data.leaderboard);
                    setGlobalStatus('✅ Conectado');
                } else {
                    setGlobalStatus('📭 Vazio - seja o primeiro!');
                    setGlobalLeaderboard([]);
                }
            }
        } catch (e: any) {
            setGlobalStatus('❌ Erro de conexão');
            setGlobalLeaderboard([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchLeaderboard();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getMedalColor = (index: number) => {
        if (index === 0) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
        if (index === 1) return 'text-slate-300 bg-slate-400/20 border-slate-400/50';
        if (index === 2) return 'text-amber-600 bg-amber-600/20 border-amber-600/50';
        return 'text-slate-500 bg-slate-800/50 border-slate-700';
    };

    const currentList = activeTab === 'local' ? localLeaderboard : globalLeaderboard;

    return (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-md max-h-[85vh] bg-slate-950 border border-yellow-500/30 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.2)] flex flex-col overflow-hidden animate-in zoom-in-95">
                {/* Header */}
                <div className="p-4 border-b border-yellow-500/20 bg-gradient-to-r from-yellow-900/20 to-slate-900/50 flex justify-between items-center">
                    <h2 className="text-xl font-black text-white flex items-center gap-3">
                        <Trophy size={24} className="text-yellow-400" />
                        RANKING
                    </h2>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={fetchLeaderboard}
                            disabled={loading}
                            className="p-2 hover:bg-cyan-900/30 rounded-lg text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button onClick={onClose} className="p-2 hover:bg-red-900/30 rounded-lg text-slate-400 hover:text-red-400">
                            <X size={22} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-800">
                    <button
                        onClick={() => setActiveTab('local')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'local' 
                                ? 'bg-cyan-900/30 text-cyan-400 border-b-2 border-cyan-400' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Smartphone size={16} /> Local
                    </button>
                    <button
                        onClick={() => setActiveTab('global')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                            activeTab === 'global' 
                                ? 'bg-green-900/30 text-green-400 border-b-2 border-green-400' 
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <Globe size={16} /> Global
                        {loading && <Loader2 size={14} className="animate-spin" />}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {currentList.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center py-8">
                            <Trophy size={48} className="text-slate-700 mb-4" />
                            <p className="text-slate-500 font-bold">
                                {activeTab === 'local' ? 'Nenhum score local' : 'Nenhum score global'}
                            </p>
                            <p className="text-slate-600 text-sm mt-1">
                                {activeTab === 'local' ? 'Jogue para aparecer aqui!' : globalStatus}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {currentList.slice(0, 10).map((entry, index) => (
                                <div 
                                    key={entry.id || index}
                                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${getMedalColor(index)} ${index < 3 ? 'shadow-lg' : ''}`}
                                >
                                    {/* Rank Badge */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${
                                        index === 0 ? 'bg-yellow-500 text-black' :
                                        index === 1 ? 'bg-slate-400 text-black' :
                                        index === 2 ? 'bg-amber-600 text-black' :
                                        'bg-slate-800 text-slate-400'
                                    }`}>
                                        {index < 3 ? <Medal size={16} /> : `#${index + 1}`}
                                    </div>
                                    
                                    {/* Character Mini */}
                                    <div className={`w-8 h-8 flex-shrink-0 rounded-lg p-0.5 ${
                                        index === 0 ? 'bg-yellow-900/50 border border-yellow-500/50' :
                                        index === 1 ? 'bg-slate-700/50 border border-slate-400/50' :
                                        index === 2 ? 'bg-amber-900/50 border border-amber-600/50' :
                                        'bg-slate-800/50 border border-slate-700/50'
                                    }`}>
                                        <MiniCharacter skinId={entry.skinId} size={28} />
                                    </div>
                                    
                                    {/* Name & Date */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`font-bold truncate text-sm ${index < 3 ? 'text-white' : 'text-slate-300'}`}>{entry.name}</p>
                                        {entry.date && <p className="text-[9px] text-slate-600">{new Date(entry.date).toLocaleDateString('pt-BR')}</p>}
                                    </div>
                                    
                                    {/* Score */}
                                    <div className="text-right flex-shrink-0">
                                        <p className={`font-mono font-black text-lg ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-500' : 'text-cyan-400'}`}>
                                            {entry.score}m
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="p-3 border-t border-slate-800 bg-slate-900/50 text-center">
                    <p className="text-slate-600 text-[10px]">
                        {activeTab === 'local' 
                            ? `Seus melhores scores neste dispositivo`
                            : globalStatus || 'Carregando...'}
                    </p>
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

// ====================================================================================
// FIREWORKS CELEBRATION COMPONENT
// ====================================================================================
const FireworksCelebration = ({ rank }: { rank: number }) => {
    const [particles, setParticles] = useState<any[]>([]);
    
    useEffect(() => {
        const colors = rank === 1 
            ? ['#ffd700', '#ffed4a', '#fff', '#fbbf24'] // Gold for 1st
            : rank === 2 
                ? ['#c0c0c0', '#e5e5e5', '#94a3b8', '#cbd5e1'] // Silver for 2nd
                : ['#cd7f32', '#d97706', '#f59e0b', '#fbbf24']; // Bronze for 3rd
        
        const createFirework = () => {
            const centerX = Math.random() * 80 + 10; // 10-90%
            const centerY = Math.random() * 40 + 10; // 10-50%
            const newParticles: any[] = [];
            
            for (let i = 0; i < 30; i++) {
                const angle = (Math.PI * 2 * i) / 30;
                const speed = Math.random() * 3 + 2;
                newParticles.push({
                    id: Math.random(),
                    x: centerX,
                    y: centerY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    life: 1,
                    size: Math.random() * 4 + 2
                });
            }
            setParticles(prev => [...prev, ...newParticles]);
        };
        
        // Create initial fireworks
        createFirework();
        const interval = setInterval(createFirework, 800);
        
        // Animate particles
        const animate = setInterval(() => {
            setParticles(prev => prev
                .map(p => ({
                    ...p,
                    x: p.x + p.vx * 0.3,
                    y: p.y + p.vy * 0.3 + 0.1,
                    vy: p.vy + 0.05,
                    life: p.life - 0.02
                }))
                .filter(p => p.life > 0)
            );
        }, 30);
        
        return () => {
            clearInterval(interval);
            clearInterval(animate);
        };
    }, [rank]);
    
    return (
        <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="absolute rounded-full"
                    style={{
                        left: `${p.x}%`,
                        top: `${p.y}%`,
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        opacity: p.life,
                        boxShadow: `0 0 ${p.size * 2}px ${p.color}`
                    }}
                />
            ))}
        </div>
    );
};

// === TROPHY SKINS - Actual Trophy Cups for each rank ===
// 1st Place - Golden Trophy Cup
const TROPHY_GOLD = {
    id: 'trophy_gold',
    name: '🏆 OURO',
    color: '#ffd700',
    pixels: [
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,6,6,1,0,0,0,0,0,0],
        [0,0,1,1,1,1,6,6,6,6,1,1,1,1,0,0],
        [0,1,6,6,6,6,6,6,6,6,6,6,6,6,1,0],
        [1,6,6,6,6,6,6,6,6,6,6,6,6,6,6,1],
        [1,6,6,3,3,6,6,6,6,6,6,3,3,6,6,1],
        [1,6,6,3,3,6,6,6,6,6,6,3,3,6,6,1],
        [0,1,6,6,6,6,6,6,6,6,6,6,6,6,1,0],
        [0,0,1,6,6,6,6,6,6,6,6,6,6,1,0,0],
        [0,0,0,1,6,6,6,6,6,6,6,6,1,0,0,0],
        [0,0,0,0,1,6,6,6,6,6,6,1,0,0,0,0],
        [0,0,0,0,0,1,1,6,6,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,1,6,6,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,6,6,6,6,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
};

// 2nd Place - Silver Trophy Cup
const TROPHY_SILVER = {
    id: 'trophy_silver',
    name: '🥈 PRATA',
    color: '#c0c0c0',
    pixels: [
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,1,1,1,1,2,2,2,2,1,1,1,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,3,3,2,2,2,2,2,2,3,3,2,2,1],
        [1,2,2,3,3,2,2,2,2,2,2,3,3,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,0,0,1,1,2,2,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
};

// 3rd Place - Bronze Trophy Cup
const TROPHY_BRONZE = {
    id: 'trophy_bronze',
    name: '🥉 BRONZE',
    color: '#cd7f32',
    pixels: [
        [0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,1,1,1,1,2,2,2,2,1,1,1,1,0,0],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
        [1,2,2,3,3,2,2,2,2,2,2,3,3,2,2,1],
        [1,2,2,3,3,2,2,2,2,2,2,3,3,2,2,1],
        [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
        [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
        [0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
        [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
        [0,0,0,0,0,1,1,2,2,1,1,0,0,0,0,0],
        [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
        [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
        [0,0,0,0,1,1,1,1,1,1,1,1,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
    ]
};

// Get trophy skin by rank
const getTrophySkinByRank = (rank: number) => {
    if (rank === 1) return TROPHY_GOLD;
    if (rank === 2) return TROPHY_SILVER;
    if (rank === 3) return TROPHY_BRONZE;
    return TROPHY_GOLD;
};

// Get all unlocked trophy skins from localStorage
const getUnlockedTrophySkins = () => {
    const skins: any[] = [];
    try {
        const data = localStorage.getItem('TROPHY_SKINS');
        if (data) {
            const parsed = JSON.parse(data);
            // Return array of {skin, gamesRemaining}
            if (parsed.gold && parsed.gold > 0) skins.push({ skin: TROPHY_GOLD, gamesRemaining: parsed.gold });
            if (parsed.silver && parsed.silver > 0) skins.push({ skin: TROPHY_SILVER, gamesRemaining: parsed.silver });
            if (parsed.bronze && parsed.bronze > 0) skins.push({ skin: TROPHY_BRONZE, gamesRemaining: parsed.bronze });
        }
    } catch {}
    return skins;
};

// ============================================================================
// UNLOCK NOTIFICATION - Shows in corner when character unlocked
// ============================================================================
const UnlockNotification = ({ challenge, onClose }: { challenge: CharacterChallenge; onClose: () => void }) => {
    const skin = SKINS.find(s => s.id === challenge.skinId);
    
    useEffect(() => {
        // Play unlock sound
        soundManager.playPerfectJump();
        setTimeout(() => soundManager.playPerfectJump(), 200);
        
        // Auto close after 4 seconds
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, [onClose]);
    
    return (
        <div className="fixed bottom-4 left-4 z-[300] animate-in slide-in-from-left-10 duration-500">
            <div className="bg-gradient-to-r from-emerald-900 to-teal-900 border-2 border-emerald-400 rounded-xl p-3 shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-3 min-w-[200px]">
                {/* Character preview */}
                <div className="w-12 h-12 bg-emerald-800/50 rounded-lg p-1 border border-emerald-500/50 animate-bounce" style={{ animationDuration: '0.5s' }}>
                    {skin && (
                        <svg viewBox={`0 0 ${skin.pixels?.length > 16 ? 24 : 16} ${skin.pixels?.length > 16 ? 24 : 16}`} className="w-full h-full" shapeRendering="crispEdges">
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
                    )}
                </div>
                
                {/* Text */}
                <div className="flex-1">
                    <div className="flex items-center gap-1 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                        <Unlock size={12} /> DESBLOQUEADO!
                    </div>
                    <div className="text-white font-black text-sm">
                        {challenge.emoji} {skin?.name || challenge.skinId}
                    </div>
                </div>
                
                {/* Close button */}
                <button onClick={onClose} className="text-emerald-400 hover:text-white">
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

// Helper function to check challenge completion and save unlock
const checkAndUnlockCharacters = (gameData: {
    score: number;
    maxCombo: number;
    runCoins: number;
    totalCoins: number;
    jetpackTime: number;
    perfectJumps: number;
    noDamageAltitude: number;
    gameTime: number;
    globalRank?: number;
    totalGames: number;
}): CharacterChallenge[] => {
    const unlocked: CharacterChallenge[] = [];
    
    // Load existing unlocks
    let unlockedChars: string[] = [];
    try {
        const saved = localStorage.getItem('UNLOCKED_CHARACTERS');
        unlockedChars = saved ? JSON.parse(saved) : [];
    } catch {}
    
    // Check each challenge
    for (const challenge of CHARACTER_CHALLENGES) {
        // Skip already unlocked
        if (unlockedChars.includes(challenge.skinId)) continue;
        
        let completed = false;
        
        switch (challenge.requirement) {
            case 'world_record':
                completed = gameData.globalRank === 1;
                break;
            case 'altitude':
                completed = gameData.score >= challenge.targetValue;
                break;
            case 'coins':
                // Check both run coins and total coins depending on target
                completed = challenge.targetValue >= 1000 
                    ? gameData.totalCoins >= challenge.targetValue 
                    : gameData.runCoins >= challenge.targetValue;
                break;
            case 'games':
                completed = gameData.totalGames >= challenge.targetValue;
                break;
            case 'combo':
                completed = gameData.maxCombo >= challenge.targetValue;
                break;
            case 'no_damage':
                completed = gameData.noDamageAltitude >= challenge.targetValue;
                break;
            case 'jetpack':
                completed = gameData.jetpackTime >= challenge.targetValue;
                break;
            case 'perfect_jumps':
                completed = gameData.perfectJumps >= challenge.targetValue;
                break;
            case 'speed':
                // Speed challenge: reach altitude in time (seconds)
                completed = gameData.score >= challenge.targetValue && gameData.gameTime <= 180;
                break;
        }
        
        if (completed) {
            unlocked.push(challenge);
            unlockedChars.push(challenge.skinId);
        }
    }
    
    // Save newly unlocked
    if (unlocked.length > 0) {
        try {
            localStorage.setItem('UNLOCKED_CHARACTERS', JSON.stringify(unlockedChars));
        } catch {}
    }
    
    return unlocked;
};

export const GameOverMenu = ({ gameState, handleStart, setGameState, leaderboard, onSaveScore, selectedIndex }: any) => {
    const [playerName, setPlayerName] = useState(() => localStorage.getItem('PLAYER_NAME') || '');
    const [submitted, setSubmitted] = useState(false);
    const [submittedRank, setSubmittedRank] = useState<number | null>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [bonusGiven, setBonusGiven] = useState(false);
    const [newUnlocks, setNewUnlocks] = useState<CharacterChallenge[]>([]);
    const [currentUnlockIndex, setCurrentUnlockIndex] = useState(0);
    
    const isNewHighScore = gameState.score > gameState.highScore;
    const currentScore = Math.floor(gameState.score); // Ensure integer
    
    // Increment total games count on mount
    useEffect(() => {
        try {
            const totalGames = parseInt(localStorage.getItem('TOTAL_GAMES') || '0') + 1;
            localStorage.setItem('TOTAL_GAMES', String(totalGames));
        } catch {}
    }, []);

    // Check for character unlocks on game over
    useEffect(() => {
        let totalGames = 1;
        try {
            totalGames = parseInt(localStorage.getItem('TOTAL_GAMES') || '1');
        } catch {}
        
        const unlocked = checkAndUnlockCharacters({
            score: currentScore,
            maxCombo: gameState.maxCombo || 0,
            runCoins: gameState.runCoins || 0,
            totalCoins: gameState.totalCoins || 0,
            jetpackTime: gameState.jetpackTime || 0,
            perfectJumps: gameState.perfectJumps || 0,
            noDamageAltitude: gameState.noDamageAltitude || 0,
            gameTime: gameState.gameTime || 0,
            globalRank: submittedRank || undefined,
            totalGames: totalGames,
        });
        
        if (unlocked.length > 0) {
            setNewUnlocks(unlocked);
        }
    }, [currentScore, gameState, submittedRank]);

    // Handle Top 3 celebration and rewards - DIFFERENT rewards per rank
    useEffect(() => {
        if (submittedRank && submittedRank <= 3 && !bonusGiven) {
            setShowCelebration(true);
            setBonusGiven(true);
            
            // Hide celebration after 2 seconds (was staying forever)
            setTimeout(() => setShowCelebration(false), 2000);
            
            // Different gold bonus per rank: 1st=300, 2nd=200, 3rd=100
            const goldBonus = submittedRank === 1 ? 300 : submittedRank === 2 ? 200 : 100;
            const currentCoins = gameState.totalCoins || 0;
            setGameState((prev: any) => ({ ...prev, totalCoins: currentCoins + goldBonus }));
            Persistence.saveCoins(currentCoins + goldBonus);
            
            // Save trophy skin unlock (3 games) - DIFFERENT skin per rank
            try {
                const existingData = JSON.parse(localStorage.getItem('TROPHY_SKINS') || '{}');
                if (submittedRank === 1) existingData.gold = (existingData.gold || 0) + 3;
                if (submittedRank === 2) existingData.silver = (existingData.silver || 0) + 3;
                if (submittedRank === 3) existingData.bronze = (existingData.bronze || 0) + 3;
                localStorage.setItem('TROPHY_SKINS', JSON.stringify(existingData));
            } catch {}
            
            // Play celebration sound
            soundManager.playPerfectJump();
            setTimeout(() => soundManager.playPerfectJump(), 300);
            setTimeout(() => soundManager.playPerfectJump(), 600);
        }
    }, [submittedRank, bonusGiven, gameState.totalCoins, setGameState]);


    const handleSubmitScore = async () => {
        const trimmedName = playerName.trim();
        
        if (!trimmedName || trimmedName.length < 2) {
            alert('Digite um nome com pelo menos 2 caracteres!');
            return;
        }
        if (trimmedName.length > 15) {
            alert('Nome muito longo! Máximo 15 caracteres.');
            return;
        }
        
        // INSTANT: Save locally and show success immediately
        localStorage.setItem('PLAYER_NAME', trimmedName);
        Persistence.saveScoreToLeaderboard(trimmedName, currentScore);
        setSubmitted(true);
        soundManager.playPerfectJump();
        
        // Background: Try to save online (don't wait)
        fetch('/api/leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: trimmedName, score: currentScore })
        })
        .then(res => res.json())
        .then(data => {
            if (data.rank) {
                setSubmittedRank(data.rank);
            }
        })
        .catch(() => {}); // Ignore errors, already saved locally
    };

    const menuOptions = [
        { label: 'RETRY MISSION', action: () => handleStart(gameState.gameMode), icon: RotateCcw, color: 'cyan' },
        { label: 'MAIN MENU', action: () => setGameState((p: any) => ({ ...p, isGameOver: false, isPlaying: false })), icon: Home, color: 'slate' }
    ];

    const getRankColor = (rank: number) => {
        if (rank === 1) return 'from-yellow-500 to-amber-600 text-yellow-200';
        if (rank === 2) return 'from-slate-300 to-slate-500 text-slate-100';
        if (rank === 3) return 'from-amber-600 to-orange-700 text-amber-200';
        return 'from-cyan-600 to-cyan-800 text-cyan-200';
    };

    return (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            {/* Fireworks for Top 3 */}
            {showCelebration && submittedRank && submittedRank <= 3 && (
                <FireworksCelebration rank={submittedRank} />
            )}
            
            <div className="bg-[#020617] border border-red-900/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.2)] max-w-md w-full flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 relative z-10">
                <div className="text-center">
                    <div className="text-red-500 text-sm font-bold tracking-[0.5em] uppercase mb-2">Signal Lost</div>
                    <h2 className="text-4xl font-black text-white italic tracking-tighter">GAME OVER</h2>
                </div>

                {/* Score Display */}
                <div className="grid grid-cols-2 gap-3 w-full">
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl text-center">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Altitude</div>
                        <div className="text-2xl font-black text-white">{currentScore}m</div>
                    </div>
                    <div className="bg-slate-900/50 border border-slate-800 p-3 rounded-xl text-center">
                        <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Coins</div>
                        <div className="text-2xl font-black text-yellow-400 flex items-center justify-center gap-1"><Coins size={16} /> {gameState.runCoins}</div>
                    </div>
                </div>

                {/* New High Score Badge */}
                {isNewHighScore && (
                    <div className="w-full bg-gradient-to-r from-yellow-900/30 to-yellow-600/30 border border-yellow-500/50 p-3 rounded-xl text-center animate-pulse">
                        <div className="flex items-center justify-center gap-2 text-yellow-400 font-black uppercase tracking-widest">
                            <Trophy size={20} /> NOVO RECORDE!
                        </div>
                    </div>
                )}

                {/* TOP 3 CELEBRATION - Quick trophy flash */}
                {showCelebration && submittedRank && submittedRank <= 3 && (
                    <div className="flex items-center justify-center gap-3 animate-bounce" style={{ animationDuration: '0.5s' }}>
                        <span className="text-4xl">
                            {submittedRank === 1 ? '🏆' : submittedRank === 2 ? '🥈' : '🥉'}
                        </span>
                        <span className={`text-2xl font-black ${submittedRank === 1 ? 'text-yellow-400' : submittedRank === 2 ? 'text-slate-300' : 'text-amber-500'}`}>
                            TOP {submittedRank}!
                        </span>
                    </div>
                )}

                {/* Submit Score Section */}
                {!submitted ? (
                    <div className="w-full bg-slate-900/50 border border-cyan-900/50 p-4 rounded-xl space-y-3">
                        <div className="text-center">
                            <p className="text-cyan-400 text-xs font-bold uppercase tracking-widest mb-1">
                                <Globe size={14} className="inline mr-1" /> Salvar no Ranking Global
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                <input
                                    type="text"
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value.slice(0, 15))}
                                    placeholder="Seu nome..."
                                    maxLength={15}
                                    className="w-full pl-10 pr-3 py-3 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm font-bold focus:border-cyan-500 outline-none"
                                />
                            </div>
                            <button
                                onClick={handleSubmitScore}
                                disabled={!playerName.trim()}
                                className="px-4 py-3 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-lg flex items-center gap-2 transition-all"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <p className="text-slate-600 text-[10px] text-center">Máximo 15 caracteres</p>
                    </div>
                ) : (
                    <div className="w-full bg-green-900/20 border border-green-500/50 p-4 rounded-xl text-center space-y-1">
                        <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                            <Check size={20} /> Score salvo!
                        </div>
                        {submittedRank && submittedRank <= 10 ? (
                            <p className="text-yellow-400 text-sm font-bold animate-pulse">
                                TOP {submittedRank} GLOBAL!
                            </p>
                        ) : (
                            <p className="text-slate-500 text-xs">Ranking será atualizado em breve</p>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="w-full space-y-2">
                    {menuOptions.map((opt, idx) => (
                        <button
                            key={idx}
                            onClick={opt.action}
                            className={`w-full py-3 rounded-xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                                idx === selectedIndex
                                    ? `bg-${opt.color}-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] scale-105`
                                    : `bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white`
                            }`}
                        >
                            <opt.icon size={18} /> {opt.label}
                        </button>
                    ))}
                </div>
            </div>
            
            {/* UNLOCK NOTIFICATION - Shows unlocked characters */}
            {newUnlocks.length > 0 && currentUnlockIndex < newUnlocks.length && (
                <UnlockNotification 
                    challenge={newUnlocks[currentUnlockIndex]} 
                    onClose={() => {
                        if (currentUnlockIndex < newUnlocks.length - 1) {
                            setCurrentUnlockIndex(prev => prev + 1);
                        } else {
                            setNewUnlocks([]);
                            setCurrentUnlockIndex(0);
                        }
                    }}
                />
            )}
        </div>
    );
};
