import React from 'react';
import { ArrowUp, Rocket, ChevronLeft, ChevronRight } from 'lucide-react';
import { soundManager } from '../audioManager';

// Interface for individual button layouts
export interface ButtonLayout {
    id: string;
    x: number;
    y: number;
    scale: number;
    visible: boolean;
}

export interface ControlsLayout {
    leftArrow: ButtonLayout;
    rightArrow: ButtonLayout;
    jumpBtn: ButtonLayout;
    jetpackBtn: ButtonLayout;
    globalScale: number;
}

export const DEFAULT_CONTROLS_LAYOUT: ControlsLayout = {
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
            // Try loading mode-specific layout first
            const modeKey = `CONTROLS_LAYOUT_${mode}`;
            const savedMode = localStorage.getItem(modeKey);
            if (savedMode) return JSON.parse(savedMode);

            const saved = localStorage.getItem('CONTROLS_LAYOUT');
            if (saved) return JSON.parse(saved);
        } catch { }
        return DEFAULT_CONTROLS_LAYOUT;
    });

    // Perfect jump indicator with 160ms timer matching physics PARRY_WINDOW_MS
    const [showPerfectIndicator, setShowPerfectIndicator] = React.useState(false);
    const [perfectJumpTimer, setPerfectJumpTimer] = React.useState<number | null>(null);
    const PERFECT_WINDOW_MS = 160; // Match physics.ts PARRY_WINDOW_MS

    // Update perfect indicator with 160ms timing window
    React.useEffect(() => {
        const checkGrounded = () => {
            const isGrounded = playerRef?.current?.isGrounded === true;

            if (isGrounded) {
                // Player just landed - start 160ms timer
                if (perfectJumpTimer === null) {
                    setPerfectJumpTimer(Date.now());
                }
            } else {
                // Player in air - reset timer
                setPerfectJumpTimer(null);
                setShowPerfectIndicator(false);
            }

            // Show perfect indicator if within 160ms window
            if (perfectJumpTimer !== null) {
                const elapsed = Date.now() - perfectJumpTimer;
                setShowPerfectIndicator(elapsed < PERFECT_WINDOW_MS);

                // Auto-reset after window expires
                if (elapsed >= PERFECT_WINDOW_MS) {
                    setPerfectJumpTimer(null);
                }
            }
        };
        // Check frequently for responsive feedback
        const interval = setInterval(checkGrounded, 16); // ~60fps
        return () => clearInterval(interval);
    }, [playerRef, perfectJumpTimer]);

    // Update when controlsLayout prop changes OR mode changes
    React.useEffect(() => {
        if (controlsLayout) {
            setSavedLayout(controlsLayout);
        } else {
            try {
                const modeKey = `CONTROLS_LAYOUT_${mode}`;
                const savedMode = localStorage.getItem(modeKey);
                if (savedMode) {
                    setSavedLayout(JSON.parse(savedMode));
                }
            } catch { }
        }
    }, [controlsLayout, mode]);

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
                className={`pointer-events-auto rounded-full flex items-center justify-center active:scale-95 transition-all backdrop-blur-sm relative opacity-70 ${buttonStyle}`}
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
                    className={`absolute pointer-events-auto rounded-full flex items-center justify-center border-2 active:scale-95 transition-all relative opacity-70 ${showPerfectIndicator
                        ? 'bg-pink-500/30 border-pink-400/50'
                        : 'bg-cyan-900/30 border-cyan-500/40'
                        }`}
                    style={{
                        bottom: '32px',
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

                {/* Jetpack Button - À DIREITA - SÓ APARECE SE COMPROU */}
                {gameState?.upgrades?.maxFuel > 0 && (
                    <button
                        className="absolute pointer-events-auto rounded-full flex items-center justify-center border-2 active:scale-95 bg-purple-900/30 border-purple-500/40 opacity-70"
                        style={{
                            bottom: '32px',
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
                )}
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

    // --- ARROWS MODE: CLEAN DESIGN - Small arrows, large hitboxes ---
    if (mode === 'ARROWS') {
        const [leftPressed, setLeftPressed] = React.useState(false);
        const [rightPressed, setRightPressed] = React.useState(false);
        const [jetpackActive, setJetpackActive] = React.useState(false);

        // CRITICAL: Reset states when game restarts
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
        }, [gameState?.isPlaying, gameState?.runId]);

        // Check if both sides are pressed for jetpack
        React.useEffect(() => {
            if (leftPressed && rightPressed) {
                inputRef.current.jetpack = true;
                setJetpackActive(true);
            } else {
                inputRef.current.jetpack = false;
                setJetpackActive(false);
            }
        }, [leftPressed, rightPressed]);

        const handlePress = (side: 'left' | 'right') => {
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
            if (side === 'left') {
                inputRef.current.left = false;
                setLeftPressed(false);
            }
            if (side === 'right') {
                inputRef.current.right = false;
                setRightPressed(false);
            }

            inputRef.current.jumpIntent = false;
        };

        // No background colors - only arrow icons provide visual feedback
        const getButtonStyle = (isPressed: boolean) => {
            return 'bg-transparent';
        };

        // Arrow color based on state - ENHANCED PINK BRIGHTNESS
        const getArrowColor = (isPressed: boolean) => {
            if (jetpackActive) return 'text-purple-400/80 drop-shadow-[0_0_15px_rgba(168,85,247,0.9)]';

            // PERFECT JUMP AVAILABLE - Bright pink with strong glow
            if (isPressed && showPerfectIndicator) {
                return 'text-pink-300/100 drop-shadow-[0_0_20px_rgba(236,72,153,1)] brightness-125';
            }

            // Normal press
            if (isPressed) return 'text-cyan-400/90 drop-shadow-[0_0_12px_rgba(6,182,212,0.7)]';

            // Subtle pink when perfect window available (not pressed)
            if (showPerfectIndicator) return 'text-pink-200/60 drop-shadow-[0_0_8px_rgba(236,72,153,0.4)]';

            return 'text-white/30';
        };

        return (
            <div className="fixed inset-0 z-[100] pointer-events-none flex" style={{ paddingTop: '50%' }}>
                {/* LEFT HALF SCREEN - Large hitbox but top 80px free for pause button */}
                <button
                    className={`flex-1 pointer-events-auto transition-all ${getButtonStyle(leftPressed)}`}
                    onTouchStart={(e) => { e.preventDefault(); handlePress('left'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleRelease('left'); }}
                    onMouseDown={() => handlePress('left')}
                    onMouseUp={() => handleRelease('left')}
                    onMouseLeave={() => handleRelease('left')}
                >
                    {/* Small arrow indicator - ALWAYS visible at bottom left */}
                    <div className="absolute left-6 bottom-6 pointer-events-none">
                        <ChevronLeft
                            size={32}
                            className={`transition-all ${getArrowColor(leftPressed)}`}
                            strokeWidth={2.5}
                        />
                    </div>
                </button>

                {/* RIGHT HALF SCREEN - Large hitbox but top 80px free for pause button */}
                <button
                    className={`flex-1 pointer-events-auto transition-all ${getButtonStyle(rightPressed)}`}
                    onTouchStart={(e) => { e.preventDefault(); handlePress('right'); }}
                    onTouchEnd={(e) => { e.preventDefault(); handleRelease('right'); }}
                    onMouseDown={() => handlePress('right')}
                    onMouseUp={() => handleRelease('right')}
                    onMouseLeave={() => handleRelease('right')}
                >
                    {/* Small arrow indicator - ALWAYS visible at bottom right */}
                    <div className="absolute right-6 bottom-6 pointer-events-none">
                        <ChevronRight
                            size={32}
                            className={`transition-all ${getArrowColor(rightPressed)}`}
                            strokeWidth={2.5}
                        />
                    </div>
                </button>

                {/* Centro - Indicador de JETPACK - Smaller and less obtrusive */}
                {jetpackActive && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-purple-600/70 px-4 py-2 rounded-full border border-purple-300/40 backdrop-blur-sm">
                        <Rocket size={16} className="text-purple-100" />
                        <span className="text-sm font-bold text-purple-100 uppercase">JETPACK</span>
                    </div>
                )}
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
